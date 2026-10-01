import React, { useState, useMemo } from 'react';
import {
  X,
  ShoppingBag,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PurchaseOrder, PurchaseItemLine } from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export interface NewDirectOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated?: (po: PurchaseOrder) => void;
}

export const NewDirectOrderModal: React.FC<NewDirectOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  if (!isOpen) return null;

  return <NewDirectOrderModalContent onClose={onClose} onOrderCreated={onOrderCreated} />;
};

const NewDirectOrderModalContent: React.FC<{
  onClose: () => void;
  onOrderCreated?: (po: PurchaseOrder) => void;
}> = ({ onClose, onOrderCreated }) => {
  const parties = useMemo(
    () => erpFinanceStorage.getParties().filter((p) => p.type === 'Vendor' || p.type === 'Customer & Vendor'),
    []
  );
  const itemsMaster = useMemo(() => erpFinanceStorage.getItems(), []);

  const [selectedVendorId, setSelectedVendorId] = useState<string>(parties[0]?.id || '');
  const selectedVendor = parties.find((p) => p.id === selectedVendorId) || parties[0];

  const nextNum = erpFinanceStorage.getPurchaseOrders().length + 1;
  const [poNumber, setPoNumber] = useState<string>(`PO-2026-${String(nextNum).padStart(4, '0')}`);
  const [orderDate, setOrderDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [department, setDepartment] = useState<string>('General Admin');
  const [branch, setBranch] = useState<string>('Main Campus (Kochi)');
  const [costCenter, setCostCenter] = useState<string>('CC-OPERATIONS');
  const [paymentTerms, setPaymentTerms] = useState<string>('Net 30');
  const [deliveryLocation, setDeliveryLocation] = useState<string>(
    'No. 4/461, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021'
  );
  const [remarks, setRemarks] = useState<string>('Direct Purchase Order issued as per vendor rate contract');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Line Items
  const [items, setItems] = useState<PurchaseItemLine[]>(() => {
    const defaultItem = itemsMaster[0] || {
      id: `itm-${Date.now()}`,
      code: 'GEN-01',
      name: 'Standard Hardware Supplies',
      hsn: '8471',
      purchasePrice: 5000,
      uom: 'NOS',
      taxRate: 18,
    };
    const rate = defaultItem.purchasePrice || 5000;
    const taxRate = defaultItem.taxRate || 18;
    const sub = rate * 1;
    const tax = (sub * taxRate) / 100;
    return [
      {
        itemId: defaultItem.id,
        itemCode: defaultItem.code,
        itemName: defaultItem.name,
        hsnCode: (defaultItem as any).hsn || '8471',
        quantity: 1,
        unit: defaultItem.uom || 'NOS',
        rate,
        discount: 0,
        taxPercent: taxRate,
        cgst: tax / 2,
        sgst: tax / 2,
        igst: 0,
        total: sub + tax,
      },
    ];
  });

  const handleAddItem = () => {
    const defaultItem = itemsMaster[items.length % itemsMaster.length] || {
      id: `itm-${Date.now()}`,
      code: 'SUPPLY-ITEM',
      name: 'General Materials',
      hsn: '8471',
      purchasePrice: 2500,
      uom: 'NOS',
      taxRate: 18,
    };
    const rate = defaultItem.purchasePrice || 2500;
    const taxRate = defaultItem.taxRate || 18;
    const sub = rate * 1;
    const tax = (sub * taxRate) / 100;

    setItems((prev) => [
      ...prev,
      {
        itemId: defaultItem.id,
        itemCode: defaultItem.code,
        itemName: defaultItem.name,
        hsnCode: (defaultItem as any).hsn || '8471',
        quantity: 1,
        unit: defaultItem.uom || 'NOS',
        rate,
        discount: 0,
        taxPercent: taxRate,
        cgst: tax / 2,
        sgst: tax / 2,
        igst: 0,
        total: sub + tax,
      },
    ]);
  };

  const handleItemFieldChange = (index: number, field: keyof PurchaseItemLine, val: any) => {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: val };

      // If user selected an item from dropdown
      if (field === 'itemId') {
        const found = itemsMaster.find((i) => i.id === val);
        if (found) {
          target.itemCode = found.code;
          target.itemName = found.name;
          target.hsnCode = (found as any).hsn || target.hsnCode || '8471';
          target.rate = found.purchasePrice || target.rate;
          target.unit = found.uom || target.unit;
          target.taxPercent = found.taxRate || 18;
        }
      }

      // Recalculate totals
      const qty = Number(target.quantity) || 0;
      const rate = Number(target.rate) || 0;
      const discountPct = Number(target.discount) || 0;
      const taxPct = Number(target.taxPercent) || 0;

      const baseAmount = qty * rate;
      const discountedAmount = baseAmount - (baseAmount * discountPct) / 100;
      const taxAmount = (discountedAmount * taxPct) / 100;

      target.cgst = Math.round((taxAmount / 2) * 100) / 100;
      target.sgst = Math.round((taxAmount / 2) * 100) / 100;
      target.igst = 0;
      target.total = Math.round((discountedAmount + taxAmount) * 100) / 100;

      copy[index] = target;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('A purchase order must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Totals calculations
  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.rate), 0);
  const discountTotal = items.reduce((sum, it) => sum + ((it.quantity * it.rate * (it.discount || 0)) / 100), 0);
  const taxTotal = items.reduce((sum, it) => sum + (it.cgst + it.sgst + it.igst), 0);
  const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) {
      setErrorMessage('Please select a valid vendor.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const savedPO = erpFinanceStorage.savePurchaseOrder({
        poNumber,
        date: orderDate,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        department,
        branch,
        costCenter,
        expectedDeliveryDate,
        paymentTerms,
        deliveryLocation,
        items,
        remarks,
      });

      if (onOrderCreated) {
        onOrderCreated(savedPO);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create direct PO', err);
      setErrorMessage(err?.message || 'Failed to save purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShoppingBag className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">New Direct Purchase Order</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  Direct PO Entry
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Issue immediate purchase order with automatic Sec 96 budget commitment & vendor allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.gstin ? `(${p.gstin})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                PO Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Order Date</label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Expected Delivery</label>
              <input
                type="date"
                required
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="General Admin">General Admin</option>
                <option value="IT & Systems">IT & Systems</option>
                <option value="Hostel & Facilities">Hostel & Facilities</option>
                <option value="Academic Operations">Academic Operations</option>
                <option value="Marketing">Marketing</option>
                <option value="Logistics">Logistics</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Branch / Campus</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 45">Net 45 Days</option>
                <option value="On Delivery">Payment On Delivery</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cost Center</label>
              <input
                type="text"
                value={costCenter}
                onChange={(e) => setCostCenter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Delivery Location */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Delivery Location & Receiving Warehouse</label>
            <input
              type="text"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Line Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Line Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold border border-emerald-200 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-8">#</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Item Description</th>
                    <th className="py-2.5 px-3 w-20">HSN</th>
                    <th className="py-2.5 px-3 w-20">Qty</th>
                    <th className="py-2.5 px-3 w-20">Unit</th>
                    <th className="py-2.5 px-3 w-28">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-16">Disc %</th>
                    <th className="py-2.5 px-3 w-20">Tax %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <select
                          value={it.itemId}
                          onChange={(e) => handleItemFieldChange(idx, 'itemId', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-emerald-500 mb-1"
                        >
                          {itemsMaster.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.code})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={it.itemName}
                          onChange={(e) => handleItemFieldChange(idx, 'itemName', e.target.value)}
                          placeholder="Item custom specification"
                          className="w-full p-1 bg-white border border-slate-200 rounded text-[11px] text-slate-600"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={it.hsnCode}
                          onChange={(e) => handleItemFieldChange(idx, 'hsnCode', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-bold text-center"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={it.unit}
                          onChange={(e) => handleItemFieldChange(idx, 'unit', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={it.rate}
                          onChange={(e) => handleItemFieldChange(idx, 'rate', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={it.discount}
                          onChange={(e) => handleItemFieldChange(idx, 'discount', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <select
                          value={it.taxPercent}
                          onChange={(e) => handleItemFieldChange(idx, 'taxPercent', e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-200 rounded text-xs text-center"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {formatINR(it.total)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks & Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Remarks & Commercial Terms</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Special delivery instructions, packaging requirements, billing details..."
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
              <div className="mt-2 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center gap-2 text-[11px] text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Budget Commitment will be locked automatically for {department} upon saving.
                </span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Trade Discount:</span>
                  <span>-{formatINR(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Statutory GST (CGST + SGST):</span>
                <span>+{formatINR(taxTotal)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total (PO Commitment):</span>
                <span className="text-emerald-700">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Order...' : 'Generate & Issue Direct PO'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
