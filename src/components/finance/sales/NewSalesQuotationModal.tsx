import React, { useState } from 'react';
import {
  X,
  FileText,
  Building2,
  Calendar,
  Layers,
  Trash2,
  DollarSign,
  Truck,
  Plus,
  AlertCircle,
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

export interface NewSalesQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const NewSalesQuotationModal: React.FC<NewSalesQuotationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen) return null;

  return <NewSalesQuotationModalContent onClose={onClose} onSuccess={onSuccess} />;
};

const NewSalesQuotationModalContent: React.FC<{
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ onClose, onSuccess }) => {
  const customers = erpFinanceStorage
    .getParties()
    .filter((p) => p.type === 'Customer' || p.type === 'Customer & Vendor');

  const itemsMaster = erpFinanceStorage.getItems();

  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [deliveryTerms, setDeliveryTerms] = useState('Door Delivery at Customer Site');
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [notes, setNotes] = useState(
    'Commercial quotation valid for 30 days. Standard warranty & SLA terms apply.'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Initialize with at least one item line
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
        itemId: firstItem?.id || 'itm-custom',
        itemCode: firstItem?.code || 'GEN-PROD',
        itemName: firstItem?.name || 'General Product / Service',
        hsnCode: firstItem?.hsnCode || '8471',
        quantity: 1,
        unit: firstItem?.baseUnit || firstItem?.salesUnit || 'NOS',
        rate: firstItem?.salesPrice || 15000,
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
        itemCode: defaultItem?.code || 'GEN-ITEM',
        itemName: defaultItem?.name || 'Standard Product',
        hsnCode: defaultItem?.hsnCode || '8471',
        quantity: 1,
        unit: defaultItem?.baseUnit || defaultItem?.salesUnit || 'NOS',
        rate: defaultItem?.salesPrice || 10000,
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
      alert('Quotation must contain at least one item line.');
      return;
    }
    setItemLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems: SalesItemLine[] = itemLines.map((i) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedCustomer) {
      setErrorMsg('Please select a valid customer.');
      return;
    }

    if (calculatedItems.length === 0) {
      setErrorMsg('Please add at least one item line.');
      return;
    }

    setIsSubmitting(true);
    try {
      erpFinanceStorage.saveSalesQuotation({
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        date: quotationDate,
        validUntil,
        paymentTerms,
        deliveryTerms,
        otherCharges: Number(otherCharges) || 0,
        notes,
        items: calculatedItems,
        status: 'Draft',
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating sales quotation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl">
              <FileText className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Individual Doing
                </span>
                <span className="text-xs text-blue-200">Standalone Commercial Proposal</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">New Sales Quotation (SQ)</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
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
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Customer / Account <span className="text-rose-500">*</span>
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
              {selectedCustomer && (
                <div className="mt-1.5 text-[11px] text-slate-500 space-y-0.5">
                  <div>GSTIN: {selectedCustomer.gstin || 'Unregistered / Consumer'}</div>
                  <div>Place of Supply: {selectedCustomer.placeOfSupply || '32-Kerala'}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Quotation Date
              </label>
              <input
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="Due on Receipt">Due on Receipt / COD</option>
                <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                <option value="100% Advance">100% Advance Payment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                Delivery / Dispatch Terms
              </label>
              <input
                type="text"
                value={deliveryTerms}
                onChange={(e) => setDeliveryTerms(e.target.value)}
                placeholder="e.g. Door delivery within 5 days"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Freight / Other Charges (₹)
              </label>
              <input
                type="number"
                min="0"
                value={otherCharges}
                onChange={(e) => setOtherCharges(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Quotation Line Items ({itemLines.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
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

          {/* Notes & Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Quotation Notes & Commercial Terms
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  <span>Other Charges / Freight:</span>
                  <span className="font-semibold text-slate-900">{formatINR(Number(otherCharges))}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
                <span className="font-bold text-slate-900">Grand Total:</span>
                <span className="font-bold text-blue-900 text-base">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500">
              * Independent quotation will be saved directly into Sales Quotations register.
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
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                {isSubmitting ? 'Saving Quotation...' : 'Save & Issue Quotation'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
