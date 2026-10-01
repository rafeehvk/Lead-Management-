import React, { useState, useMemo } from 'react';
import {
  X,
  Receipt,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Package,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PurchaseInvoiceRecord, PurchaseItemLine } from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export interface NewDirectInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated?: (inv: PurchaseInvoiceRecord) => void;
}

export const NewDirectInvoiceModal: React.FC<NewDirectInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated,
}) => {
  if (!isOpen) return null;

  return <NewDirectInvoiceModalContent onClose={onClose} onInvoiceCreated={onInvoiceCreated} />;
};

const NewDirectInvoiceModalContent: React.FC<{
  onClose: () => void;
  onInvoiceCreated?: (inv: PurchaseInvoiceRecord) => void;
}> = ({ onClose, onInvoiceCreated }) => {
  const parties = useMemo(
    () => erpFinanceStorage.getParties().filter((p) => p.type === 'Vendor' || p.type === 'Customer & Vendor'),
    []
  );
  const itemsMaster = useMemo(() => erpFinanceStorage.getItems(), []);

  const [selectedVendorId, setSelectedVendorId] = useState<string>(parties[0]?.id || '');
  const selectedVendor = parties.find((p) => p.id === selectedVendorId) || parties[0];

  const nextNum = erpFinanceStorage.getPurchaseInvoices().length + 1;
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`PI-2026-${String(nextNum).padStart(4, '0')}`);
  const [vendorBillRef, setVendorBillRef] = useState<string>(`VEND-BILL-${Date.now().toString().slice(-5)}`);
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [costCenter, setCostCenter] = useState<string>('CC-OPERATIONS');
  const [paymentMethod, setPaymentMethod] = useState<'NEFT' | 'UPI' | 'Cheque' | 'Cash' | 'Corporate Banking'>('NEFT');
  const [isReverseCharge, setIsReverseCharge] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Line Items
  const [items, setItems] = useState<PurchaseItemLine[]>(() => {
    const defaultItem = itemsMaster[0] || {
      id: `itm-${Date.now()}`,
      code: 'PUR-01',
      name: 'Office Operating Equipment',
      hsn: '8471',
      purchasePrice: 12000,
      uom: 'NOS',
      taxRate: 18,
    };
    const rate = defaultItem.purchasePrice || 12000;
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
      code: 'GEN-SUPPLY',
      name: 'General Material Stock',
      hsn: '8471',
      purchasePrice: 3000,
      uom: 'NOS',
      taxRate: 18,
    };
    const rate = defaultItem.purchasePrice || 3000;
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
      alert('A purchase bill must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.rate), 0);
  const discountTotal = items.reduce((sum, it) => sum + ((it.quantity * it.rate * (it.discount || 0)) / 100), 0);
  const cgstTotal = items.reduce((sum, it) => sum + it.cgst, 0);
  const sgstTotal = items.reduce((sum, it) => sum + it.sgst, 0);
  const taxTotal = cgstTotal + sgstTotal;
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

      const savedInvoice = erpFinanceStorage.postPurchaseInvoice({
        invoiceNumber,
        date: invoiceDate,
        dueDate,
        vendorId: selectedVendor.id,
        vendorName: selectedVendor.name,
        costCenter,
        items,
        isReverseCharge,
        referenceNumber: vendorBillRef,
      });

      if (onInvoiceCreated) {
        onInvoiceCreated(savedInvoice);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create direct purchase bill', err);
      setErrorMessage(err?.message || 'Failed to save purchase bill.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-emerald-700 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Receipt className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">New Direct Purchase Bill (A/P Invoice)</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  Vendor Bill Entry
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Direct entry for purchases without PO. Updates inventory stock and creates Accounts Payable ledger liability.
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
                Internal Bill No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vendor's Bill/Inv Ref</label>
              <input
                type="text"
                value={vendorBillRef}
                onChange={(e) => setVendorBillRef(e.target.value)}
                placeholder="e.g. GST-INV-9921"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bill Date</label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NEFT">Bank Transfer (NEFT/RTGS)</option>
                <option value="UPI">UPI Digital Transfer</option>
                <option value="Cheque">Corporate Cheque</option>
                <option value="Cash">Cash Voucher</option>
                <option value="Corporate Banking">Corporate Banking</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={isReverseCharge}
                  onChange={(e) => setIsReverseCharge(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>RCM Applicable (Sec 9(3))</span>
              </label>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                Purchased Line Items ({items.length})
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

          {/* Bottom Financial Summary & Notice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-xs">
                <Package className="w-4 h-4 text-emerald-700" />
                <span>Automatic Inventory & Accounting Postings</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Saving this bill immediately increments stock balances for non-service items in the Central Warehouse and posts balanced debit/credit journal entries to Purchase and Accounts Payable.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 font-mono text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span>{formatINR(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-{formatINR(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (CGST + SGST):</span>
                <span>+{formatINR(taxTotal)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-black text-slate-900">
                <span>Bill Total (Payable Liability):</span>
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
              <span>{isSubmitting ? 'Posting Bill...' : 'Post Direct Purchase Bill'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
