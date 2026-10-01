import React, { useState, useMemo } from 'react';
import {
  X,
  Receipt,
  Building2,
  Calendar,
  Layers,
  Trash2,
  DollarSign,
  Truck,
  Plus,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  FileCheck,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { SalesItemLine } from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export interface NewSalesOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewSalesOrderModal: React.FC<NewSalesOrderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return <NewSalesOrderModalContent onClose={onClose} onSuccess={onSuccess} />;
};

const NewSalesOrderModalContent: React.FC<{
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ onClose, onSuccess }) => {
  const customers = erpFinanceStorage
    .getParties()
    .filter((p) => p.type === 'Customer' || p.type === 'Customer & Vendor');

  const itemsMaster = erpFinanceStorage.getItems();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [deliveryDate, setDeliveryDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [costCenter, setCostCenter] = useState('CC-REV-EDUTECH');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [remarks, setRemarks] = useState('Direct Confirmed Sales Order booking');
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const [deliveryAddress, setDeliveryAddress] = useState(
    selectedCustomer?.shippingAddress || selectedCustomer?.billingAddress || ''
  );

  // Update address when customer changes
  const handleCustomerChange = (newCustId: string) => {
    setCustomerId(newCustId);
    const found = customers.find((c) => c.id === newCustId);
    if (found) {
      setDeliveryAddress(found.shippingAddress || found.billingAddress || '');
    }
  };

  // Item lines
  const [itemLines, setItemLines] = useState<
    Array<{
      itemId: string;
      itemCode: string;
      itemName: string;
      hsnCode: string;
      quantity: number;
      unit: string;
      rate: number;
      discount: number;
      taxPercent: number;
    }>
  >(() => {
    const firstItem = itemsMaster[0];
    return [
      {
        itemId: firstItem?.id || 'itm-default',
        itemCode: firstItem?.code || 'LAP-DELL-XPS',
        itemName: firstItem?.name || 'Dell XPS 15 Workstation',
        hsnCode: firstItem?.hsnCode || '8471',
        quantity: 1,
        unit: firstItem?.baseUnit || firstItem?.salesUnit || 'NOS',
        rate: firstItem?.salesPrice || 145000,
        discount: 0,
        taxPercent: firstItem?.taxRatePercent || 18,
      },
    ];
  });

  const handleAddItem = () => {
    const defaultItem = itemsMaster[itemLines.length % itemsMaster.length] || itemsMaster[0];
    setItemLines((prev) => [
      ...prev,
      {
        itemId: defaultItem?.id || `itm-${Date.now()}`,
        itemCode: defaultItem?.code || 'PRD-NEW',
        itemName: defaultItem?.name || 'Standard Finished Good',
        hsnCode: defaultItem?.hsnCode || '8471',
        quantity: 1,
        unit: defaultItem?.baseUnit || defaultItem?.salesUnit || 'NOS',
        rate: defaultItem?.salesPrice || 25000,
        discount: 0,
        taxPercent: defaultItem?.taxRatePercent || 18,
      },
    ]);
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setItemLines((prev) => {
      const next = [...prev];
      if (field === 'itemId') {
        const found = itemsMaster.find((it) => it.id === value);
        if (found) {
          next[index] = {
            ...next[index],
            itemId: found.id,
            itemCode: found.code,
            itemName: found.name,
            hsnCode: found.hsnCode || '8471',
            rate: found.salesPrice || next[index].rate,
            unit: found.baseUnit || found.salesUnit || next[index].unit,
          };
          return next;
        }
      }
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (itemLines.length <= 1) {
      alert('Order must contain at least one product line.');
      return;
    }
    setItemLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems: SalesItemLine[] = useMemo(() => {
    return itemLines.map((i) => {
      const lineSubtotal = (i.quantity || 0) * (i.rate || 0);
      const lineDiscount = (lineSubtotal * (i.discount || 0)) / 100;
      const taxable = lineSubtotal - lineDiscount;
      const taxAmt = (taxable * (i.taxPercent || 0)) / 100;
      const cgst = taxAmt / 2;
      const sgst = taxAmt / 2;
      const igst = 0;
      const total = taxable + taxAmt;

      return {
        itemId: i.itemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        hsnCode: i.hsnCode,
        quantity: i.quantity,
        unit: i.unit,
        rate: i.rate,
        discount: i.discount,
        taxPercent: i.taxPercent,
        cgst,
        sgst,
        igst,
        total,
      };
    });
  }, [itemLines]);

  const subtotal = calculatedItems.reduce(
    (sum, it) => sum + it.quantity * it.rate,
    0
  );
  const discountTotal = calculatedItems.reduce(
    (sum, it) => sum + (it.quantity * it.rate * (it.discount || 0)) / 100,
    0
  );
  const taxTotal = calculatedItems.reduce(
    (sum, it) => sum + it.cgst + it.sgst + it.igst,
    0
  );
  const grandTotal = Math.round((subtotal - discountTotal + taxTotal + (Number(otherCharges) || 0)) * 100) / 100;

  // Real-time Credit Limit evaluation
  const creditStatus = useMemo(() => {
    if (!selectedCustomer) return null;
    return erpFinanceStorage.checkCreditLimit(selectedCustomer.id, grandTotal);
  }, [selectedCustomer, grandTotal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCustomer) {
      setErrorMsg('Please select a valid customer.');
      return;
    }

    if (calculatedItems.length === 0) {
      setErrorMsg('Please add at least one line item.');
      return;
    }

    if (creditStatus && !creditStatus.allowed) {
      setErrorMsg(creditStatus.message || 'Credit Limit check blocked this order.');
      return;
    }

    setIsSubmitting(true);
    try {
      erpFinanceStorage.saveSalesOrder({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        date: orderDate,
        deliveryDate,
        deliveryAddress,
        costCenter,
        paymentTerms,
        otherCharges: Number(otherCharges) || 0,
        remarks,
        items: calculatedItems,
        status: 'Confirmed',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error booking sales order.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-xl">
              <Receipt className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                  Individual Doing
                </span>
                <span className="text-xs text-emerald-200">Direct Confirmed Sales Booking</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">New Sales Order (SO)</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer & Dates Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                Customer / Account <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Order Booking Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Credit Limit Verification Box */}
          {creditStatus && (
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                !creditStatus.allowed
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : creditStatus.excessAmount > 0
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {!creditStatus.allowed ? (
                  <ShieldX className="w-5 h-5 text-rose-600 shrink-0" />
                ) : creditStatus.excessAmount > 0 ? (
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>Credit Limit Enforcement:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-extrabold ${
                        !creditStatus.allowed
                          ? 'bg-rose-200 text-rose-900'
                          : creditStatus.excessAmount > 0
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-emerald-200 text-emerald-900'
                      }`}
                    >
                      {creditStatus.allowed ? 'Approved / Permitted' : 'Blocked (Exceeded)'}
                    </span>
                  </div>
                  <div className="text-[11px] opacity-80 mt-0.5">
                    Authorized Limit: {formatINR(creditStatus.creditLimit)} • Current Outstanding:{' '}
                    {formatINR(creditStatus.currentBalance)} • Projected Balance:{' '}
                    {formatINR(creditStatus.projectedBalance)}
                  </div>
                </div>
              </div>
              <div className="text-right font-bold text-xs">
                Policy: {creditStatus.action}
              </div>
            </div>
          )}

          {/* Terms, Cost Center & Shipping */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Due on Receipt">Due on Receipt / COD</option>
                <option value="100% Advance">100% Advance Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Revenue Cost Center
              </label>
              <select
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="CC-REV-EDUTECH">CC-REV-EDUTECH (EdTech Course Sales)</option>
                <option value="CC-OPERATIONS">CC-OPERATIONS (Hardware & Supplies)</option>
                <option value="CC-CONSULTING">CC-CONSULTING (Professional Services)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600" />
                Shipping / Delivery Address
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Full delivery location address"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sales Order Line Items ({itemLines.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Item / Product</th>
                    <th className="py-2.5 px-2 w-20">HSN</th>
                    <th className="py-2.5 px-2 w-20">Qty</th>
                    <th className="py-2.5 px-2 w-16">Unit</th>
                    <th className="py-2.5 px-2 w-28">Rate (₹)</th>
                    <th className="py-2.5 px-2 w-16">Disc%</th>
                    <th className="py-2.5 px-2 w-20">Tax %</th>
                    <th className="py-2.5 px-3 text-right w-28">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {itemLines.map((line, idx) => {
                    const calc = calculatedItems[idx];
                    return (
                      <tr key={idx} className="hover:bg-slate-50/75">
                        <td className="py-2 px-3">
                          <select
                            value={line.itemId}
                            onChange={(e) => handleItemChange(idx, 'itemId', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-white font-medium text-slate-800"
                          >
                            {itemsMaster.map((im) => (
                              <option key={im.id} value={im.id}>
                                {im.name} ({im.code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={line.hsnCode}
                            onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-700"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))
                            }
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded font-semibold text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="text"
                            value={line.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-600"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            value={line.rate}
                            onChange={(e) =>
                              handleItemChange(idx, 'rate', Math.max(0, Number(e.target.value)))
                            }
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded font-semibold text-slate-900"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={line.discount}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'discount',
                                Math.min(100, Math.max(0, Number(e.target.value)))
                              )
                            }
                            className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-700"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={line.taxPercent}
                            onChange={(e) =>
                              handleItemChange(idx, 'taxPercent', Number(e.target.value))
                            }
                            className="w-full px-1 py-1 text-xs border border-slate-200 rounded bg-white text-slate-800"
                          >
                            <option value="0">0%</option>
                            <option value="5">5%</option>
                            <option value="12">12%</option>
                            <option value="18">18%</option>
                            <option value="28">28%</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatINR(calc?.total || 0)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          {itemLines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Remarks / Customer Purchase Order Ref
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. PO No. CUST-PO-2026-991, Delivery instructions..."
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Total:</span>
                  <span>-{formatINR(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST Tax Total (CGST + SGST):</span>
                <span className="font-semibold text-slate-900">{formatINR(taxTotal)}</span>
              </div>
              {Number(otherCharges) > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Freight / Logistics:</span>
                  <span className="font-semibold text-slate-900">{formatINR(Number(otherCharges))}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Order Grand Total:</span>
                <span className="font-bold text-emerald-900 text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              * Creates confirmed Sales Order ready for warehouse dispatch or direct invoicing.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (creditStatus !== null && !creditStatus.allowed)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                {isSubmitting ? 'Booking Order...' : 'Confirm Sales Order'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
