import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  PaymentTransactionRecord,
  ReceiptTransactionRecord,
  InvoiceAllocation,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface AdvanceAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  advance: PaymentTransactionRecord | ReceiptTransactionRecord | null;
  advanceType: 'Customer' | 'Vendor';
  currentUserName?: string;
}

export const AdvanceAdjustmentModal: React.FC<AdvanceAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  advance,
  advanceType,
  currentUserName = 'Finance Officer',
}) => {
  if (!isOpen || !advance) return null;

  const isCustomer = advanceType === 'Customer';
  const advanceNumber = isCustomer
    ? (advance as ReceiptTransactionRecord).receiptNumber
    : (advance as PaymentTransactionRecord).paymentNumber;

  const totalAdvance = advance.amount;
  const unadjustedAmount = advance.unallocatedAmount !== undefined
    ? advance.unallocatedAmount
    : Math.max(0, advance.amount - (advance.allocatedAmount || 0));

  // Fetch open invoices for this party
  const openInvoices = useMemo(() => {
    if (isCustomer) {
      return erpFinanceStorage
        .getSalesInvoices()
        .filter(
          (inv) =>
            (inv.customerId === advance.partyId || inv.customerName === advance.partyName) &&
            inv.balanceAmount > 0 &&
            inv.status !== 'Paid' &&
            inv.status !== 'Cancelled'
        );
    } else {
      return erpFinanceStorage
        .getPurchaseInvoices()
        .filter(
          (inv) =>
            (inv.vendorId === advance.partyId || inv.vendorName === advance.partyName) &&
            inv.balanceAmount > 0 &&
            inv.status !== 'Paid' &&
            inv.status !== 'Cancelled'
        );
    }
  }, [advance, isCustomer]);

  // Allocation state per invoice: { [invoiceId]: amountString }
  const [allocations, setAllocations] = useState<{ [id: string]: string }>({});
  const [remarks, setRemarks] = useState('');
  const [adjustmentDate, setAdjustmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce((sum: number, val) => {
      const num = parseFloat(String(val));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [allocations]);

  const remainingAfterAdjustment = Math.max(0, unadjustedAmount - totalAllocated);

  const handleInvoiceAllocationChange = (invoiceId: string, val: string) => {
    setErrorMsg('');
    setAllocations((prev) => ({
      ...prev,
      [invoiceId]: val,
    }));
  };

  const handleAutoFillInvoice = (invoiceId: string, balance: number) => {
    const currentOtherAllocations = Object.entries(allocations).reduce(
      (sum: number, [id, val]) => (id === invoiceId ? sum : sum + (parseFloat(String(val)) || 0)),
      0
    );
    const availableForThis = Math.max(0, unadjustedAmount - currentOtherAllocations);
    const fillAmount = Math.min(balance, availableForThis);
    handleInvoiceAllocationChange(invoiceId, fillAmount.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAllocated <= 0) {
      setErrorMsg('Please allocate a positive amount to at least one invoice.');
      return;
    }
    if (totalAllocated > unadjustedAmount) {
      setErrorMsg(
        `Total allocated amount (${formatINR(totalAllocated)}) exceeds available advance balance (${formatINR(unadjustedAmount)}).`
      );
      return;
    }

    const allocationList: InvoiceAllocation[] = [];
    for (const [invId, amountStr] of Object.entries(allocations)) {
      const amt = parseFloat(String(amountStr));
      if (amt > 0) {
        const inv = openInvoices.find((i) => i.id === invId);
        if (inv) {
          if (amt > inv.balanceAmount) {
            setErrorMsg(
              `Allocation of ${formatINR(amt)} exceeds balance ${formatINR(inv.balanceAmount)} on invoice ${inv.invoiceNumber}.`
            );
            return;
          }
          allocationList.push({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            amount: amt,
          });
        }
      }
    }

    if (allocationList.length === 0) {
      setErrorMsg('No valid invoice allocations specified.');
      return;
    }

    try {
      setIsSubmitting(true);
      erpFinanceStorage.adjustAdvance({
        advanceId: advance.id,
        allocations: allocationList,
        remarks: remarks.trim() || undefined,
        adjustedBy: currentUserName,
        date: adjustmentDate,
      });

      setIsSubmitting(false);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Error executing advance adjustment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Layers className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                Adjust {isCustomer ? 'Customer' : 'Vendor'} Advance
              </h2>
              <p className="text-xs text-emerald-200">
                Link unallocated advance to open billing invoices with automated General Ledger posting
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Advance Summary Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Advance Ref</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">{advanceNumber}</div>
              <div className="text-[11px] text-slate-500">{advance.date}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">{isCustomer ? 'Customer' : 'Vendor'}</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{advance.partyName}</div>
              <div className="text-[11px] text-slate-500">{advance.paymentMethod}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase">Total Advance</div>
              <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">{formatINR(totalAdvance)}</div>
              <div className="text-[11px] text-slate-500">
                Already Adjusted: {formatINR(advance.allocatedAmount || 0)}
              </div>
            </div>
            <div className="bg-emerald-50/80 p-2.5 rounded-lg border border-emerald-200/60">
              <div className="text-[11px] font-bold text-emerald-800 uppercase">Available to Adjust</div>
              <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                {formatINR(unadjustedAmount)}
              </div>
              <div className="text-[10px] text-emerald-600 font-medium">Unallocated Balance</div>
            </div>
          </div>

          {/* Adjustment Date & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Date *</label>
              <div className="relative">
                <input
                  type="date"
                  value={adjustmentDate}
                  onChange={(e) => setAdjustmentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Remarks / Justification</label>
              <input
                type="text"
                placeholder="e.g. Adjusted against project milestone invoice"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Open Invoices Table */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>Select Invoices to Settle ({openInvoices.length} open)</span>
              </h3>
              <span className="text-xs text-slate-500">
                Remaining after adjustments:{' '}
                <span className="font-bold font-mono text-emerald-700">
                  {formatINR(remainingAfterAdjustment)}
                </span>
              </span>
            </div>

            {openInvoices.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-gray-300 rounded-xl text-xs text-slate-500">
                <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700">No open outstanding invoices found</p>
                <p className="mt-1">
                  There are currently no unpaid invoices for {advance.partyName}. You can adjust this advance once a new
                  invoice is raised or approved.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-gray-200">
                      <th className="py-2.5 px-3">Invoice Number</th>
                      <th className="py-2.5 px-3">Date / Due</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3 text-right w-44">Allocate Amount (₹)</th>
                      <th className="py-2.5 px-2 text-center w-20">Quick Fill</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-700">
                    {openInvoices.map((inv) => {
                      const allocVal = allocations[inv.id] || '';
                      const isAllocated = parseFloat(allocVal) > 0;
                      return (
                        <tr
                          key={inv.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isAllocated ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-2.5 px-3 text-[11px] text-slate-500">
                            <div>{inv.date}</div>
                            {inv.dueDate && (
                              <div className="text-[10px] text-amber-700">Due: {inv.dueDate}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {formatINR(inv.grandTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                            {formatINR(inv.balanceAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-slate-400 font-mono text-[11px]">₹</span>
                              <input
                                type="number"
                                min="0"
                                max={Math.min(inv.balanceAmount, unadjustedAmount)}
                                step="1"
                                placeholder="0"
                                value={allocVal}
                                onChange={(e) => handleInvoiceAllocationChange(inv.id, e.target.value)}
                                className="w-full pl-6 pr-2 py-1.5 text-xs text-right font-mono border border-gray-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleAutoFillInvoice(inv.id, inv.balanceAmount)}
                              className="px-2 py-1 bg-slate-200 hover:bg-emerald-100 hover:text-emerald-800 text-[10px] font-bold rounded text-slate-700 transition-colors cursor-pointer"
                              title="Fill maximum allowed amount"
                            >
                              Max
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-gray-200 text-slate-900">
                      <td colSpan={4} className="py-3 px-3 text-right uppercase text-[11px] text-slate-600">
                        Total Adjustment Out of Advance:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-emerald-700">
                        {formatINR(totalAllocated)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          {/* Double-Entry Journal Posting Preview */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1.5">
            <div className="font-bold flex items-center space-x-1.5 text-blue-950">
              <CheckCircle2 className="w-4 h-4 text-blue-700" />
              <span>Automated Double-Entry Accounting Impact:</span>
            </div>
            {isCustomer ? (
              <div className="font-mono text-[11px] space-y-0.5 pl-5">
                <div>Dr. Advance from Customers (Account 2300) = {formatINR(totalAllocated)}</div>
                <div>Cr. Accounts Receivable / Control (Account 1200) = {formatINR(totalAllocated)}</div>
              </div>
            ) : (
              <div className="font-mono text-[11px] space-y-0.5 pl-5">
                <div>Dr. Accounts Payable / Control (Account 2000) = {formatINR(totalAllocated)}</div>
                <div>Cr. Advance to Vendors (Account 2350) = {formatINR(totalAllocated)}</div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalAllocated <= 0 || totalAllocated > unadjustedAmount}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#168A45] hover:bg-[#0B5D2A] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>Confirm & Post Adjustment ({formatINR(totalAllocated)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
