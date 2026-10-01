import React, { useState } from 'react';
import {
  X,
  FileCheck,
  Building2,
  Calendar,
  Layers,
  Plus,
  Trash2,
  DollarSign,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PurchaseRequest, PurchaseItemLine } from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface CopyToQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: PurchaseRequest | null;
  onQuotationCreated?: () => void;
  onSuccess?: () => void;
}

export const CopyToQuotationModal: React.FC<CopyToQuotationModalProps> = ({
  isOpen,
  onClose,
  request,
  onQuotationCreated,
  onSuccess,
}) => {
  if (!isOpen || !request) return null;

  return (
    <CopyToQuotationModalContent
      request={request}
      onClose={onClose}
      onQuotationCreated={onQuotationCreated || onSuccess || (() => {})}
    />
  );
};

const CopyToQuotationModalContent: React.FC<{
  request: PurchaseRequest;
  onClose: () => void;
  onQuotationCreated: () => void;
}> = ({ request, onClose, onQuotationCreated }) => {
  const vendors = erpFinanceStorage
    .getParties()
    .filter((p) => p.type === 'Vendor' || p.type === 'Customer & Vendor');

  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [deliveryDate, setDeliveryDate] = useState(
    request.requiredDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [remarks, setRemarks] = useState(
    `Quotation against Purchase Request ${request.requestNumber || ''}`
  );

  // Initialize items from the Purchase Request
  const [items, setItems] = useState<
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
    return (request.items || []).map((i) => ({
      itemId: i.itemId,
      itemCode: i.itemCode,
      itemName: i.itemName,
      hsnCode: '84713010',
      quantity: i.quantity,
      unit: i.unit || 'NOS',
      rate: i.estimatedPrice || 1000,
      discount: 0,
      taxPercent: 18,
    }));
  });

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('Quotation must contain at least one item line.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems: PurchaseItemLine[] = items.map((i) => {
    const lineSubtotal = i.quantity * i.rate;
    const lineDiscount = (lineSubtotal * (i.discount || 0)) / 100;
    const taxable = lineSubtotal - lineDiscount;
    const taxAmt = (taxable * (i.taxPercent || 0)) / 100;
    const cgst = taxAmt / 2;
    const sgst = taxAmt / 2;
    const igst = 0;
    const total = Math.round((taxable + taxAmt) * 100) / 100;

    return {
      itemId: i.itemId,
      itemCode: i.itemCode,
      itemName: i.itemName,
      hsnCode: i.hsnCode,
      quantity: Number(i.quantity) || 1,
      unit: i.unit,
      rate: Number(i.rate) || 0,
      discount: Number(i.discount) || 0,
      taxPercent: Number(i.taxPercent) || 0,
      cgst,
      sgst,
      igst,
      total,
    };
  });

  const subtotal = calculatedItems.reduce((s, i) => s + i.rate * i.quantity, 0);
  const discountTotal = calculatedItems.reduce(
    (s, i) => s + (i.rate * i.quantity * (i.discount || 0)) / 100,
    0
  );
  const taxTotal = calculatedItems.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
  const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) {
      alert('Please select a valid supplier/vendor.');
      return;
    }

    try {
      erpFinanceStorage.savePurchaseQuotation({
        vendorId: vendor.id,
        vendorName: vendor.name,
        requestRefId: request.id,
        requestNumber: request.requestNumber,
        deliveryDate,
        validUntil,
        paymentTerms,
        remarks,
        items: calculatedItems,
      });

      alert(`Quotation successfully created for supplier "${vendor.name}"!`);
      onQuotationCreated();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to save quotation.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100/70 text-blue-800 border border-blue-200/60">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Copy Request to Supplier Quotation</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  Ref: {request.requestNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Specify supplier bidding details: vendor, quantity, price rates, delivery date, and terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Supplier & Logistics Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Supplier / Vendor <span className="text-rose-500">*</span>
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                required
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.city || 'Kerala'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Date of Delivery <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Valid Until</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Immediate / COD">Immediate / Cash on Delivery</option>
                <option value="50% Advance, 50% on Delivery">50% Advance, 50% on Delivery</option>
                <option value="100% Advance">100% Advance</option>
              </select>
            </div>
          </div>

          {/* Multiple Item Line Pricing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Supplier Quoted Items & Pricing ({items.length})
              </h4>
              <span className="text-[11px] text-slate-500">
                Items pre-filled from PR #{request.requestNumber}. Update quantities and supplier rates.
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-bold">
                      <th className="p-2.5">Item Description</th>
                      <th className="p-2.5 w-24 text-center">Qty</th>
                      <th className="p-2.5 w-20 text-center">Unit</th>
                      <th className="p-2.5 w-32 text-right">Quoted Rate (₹)</th>
                      <th className="p-2.5 w-24 text-right">Disc %</th>
                      <th className="p-2.5 w-24 text-right">GST %</th>
                      <th className="p-2.5 w-32 text-right">Line Total</th>
                      <th className="p-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((it, idx) => {
                      const lineSubtotal = it.quantity * it.rate;
                      const lineDiscount = (lineSubtotal * (it.discount || 0)) / 100;
                      const taxable = lineSubtotal - lineDiscount;
                      const taxAmt = (taxable * (it.taxPercent || 0)) / 100;
                      const lineTotal = taxable + taxAmt;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block">{it.itemName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{it.itemCode}</span>
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                              className="w-full text-center px-2 py-1 border border-slate-300 rounded text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          <td className="p-2.5 text-center text-slate-600 font-medium">{it.unit}</td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={it.rate}
                              onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                              className="w-full text-right px-2 py-1 border border-slate-300 rounded text-xs font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          <td className="p-2.5">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={it.discount}
                              onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                              className="w-full text-right px-2 py-1 border border-slate-300 rounded text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          <td className="p-2.5">
                            <select
                              value={it.taxPercent}
                              onChange={(e) => handleItemChange(idx, 'taxPercent', Number(e.target.value))}
                              className="w-full text-right px-1.5 py-1 border border-slate-300 rounded text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>

                          <td className="p-2.5 text-right font-bold text-slate-900">{formatINR(lineTotal)}</td>

                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Remarks & Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Vendor Quotation Remarks / Notes</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Include warranty, packaging terms, or delivery notes from vendor..."
                className="w-full text-xs font-medium p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatINR(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Vendor Discounts:</span>
                  <span>-{formatINR(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (GST):</span>
                <span className="font-semibold text-slate-900">{formatINR(taxTotal)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-base text-blue-700">{formatINR(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Create Supplier Quotation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
