import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownRight,
  ArrowRight,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  Paperclip,
  DollarSign,
  FileText,
  Printer,
  X,
} from 'lucide-react';
import {
  ReceiptTransactionRecord,
  PaymentMode,
  InvoiceAllocation,
  SalesInvoiceRecord,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { AdvanceAdjustmentModal } from './AdvanceAdjustmentModal';
import { PrintableVoucherModal } from '../themes/PrintableVoucherModal';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const PAYMENT_METHODS: PaymentMode[] = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Card',
  'Cheque',
  'Other',
];

interface ReceiptManagementViewProps {
  currentUserName?: string;
  userRole?: string;
  onOpenPartyLedger?: (partyId: string) => void;
}

export const ReceiptManagementView: React.FC<ReceiptManagementViewProps> = ({
  currentUserName = 'Finance Officer',
  userRole = 'Admin',
  onOpenPartyLedger,
}) => {
  const [receipts, setReceipts] = useState<ReceiptTransactionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Standard' | 'Advance'>('All');

  // Modal State for New Receipt
  const [isNewReceiptModalOpen, setIsNewReceiptModalOpen] = useState(false);

  // Advance adjustment modal
  const [advanceToAdjust, setAdvanceToAdjust] = useState<ReceiptTransactionRecord | null>(null);

  // Details modal
  const [selectedReceiptDetails, setSelectedReceiptDetails] = useState<ReceiptTransactionRecord | null>(null);

  // Themed Printable Voucher Modal
  const [receiptToPrint, setReceiptToPrint] = useState<ReceiptTransactionRecord | null>(null);

  const loadData = () => {
    setReceipts(erpFinanceStorage.getReceipts());
  };

  useEffect(() => {
    loadData();
    const handleChanged = () => loadData();
    window.addEventListener('erp_receipts_changed', handleChanged);
    return () => window.removeEventListener('erp_receipts_changed', handleChanged);
  }, []);

  // Filtered Receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        r.receiptNumber.toLowerCase().includes(q) ||
        r.partyName.toLowerCase().includes(q) ||
        r.referenceNumber.toLowerCase().includes(q) ||
        (r.transactionId && r.transactionId.toLowerCase().includes(q));

      const matchType =
        typeFilter === 'All' ||
        (typeFilter === 'Advance' && r.isAdvance) ||
        (typeFilter === 'Standard' && !r.isAdvance);

      return matchQuery && matchType;
    });
  }, [receipts, searchQuery, typeFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const totalReceived = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalCustomerAdvances = receipts
      .filter((r) => r.isAdvance)
      .reduce((sum, r) => sum + r.amount, 0);

    const activeAdvances = receipts.filter(
      (r) => r.isAdvance && (r.unallocatedAmount || 0) > 0
    );
    const totalUnadjusted = activeAdvances.reduce(
      (sum, r) => sum + (r.unallocatedAmount || 0),
      0
    );

    return {
      totalReceived,
      totalCustomerAdvances,
      totalUnadjusted,
      activeAdvancesCount: activeAdvances.length,
    };
  }, [receipts]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-blue-50 rounded-xl text-blue-700 border border-blue-200">
                <Receipt className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Customer Receipts & Inflows
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                Instant GL Settlement
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Record incoming customer payments, reconcile against sales invoices, capture advance retainers, and update
              cash/bank balances with automated double-entry accounting.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewReceiptModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Receipt / Advance</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Inflows Received</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {formatINR(metrics.totalReceived)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{receipts.length} collection receipts</div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60">
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Customer Advances</div>
            <div className="text-base font-bold font-mono text-blue-900 mt-0.5">
              {formatINR(metrics.totalCustomerAdvances)}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5 font-medium">Cr. 2300 Customer Advance</div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/60">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Unadjusted Balance</div>
            <div className="text-base font-bold font-mono text-emerald-900 mt-0.5">
              {formatINR(metrics.totalUnadjusted)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
              {metrics.activeAdvancesCount} open advance retainer(s)
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/60">
            <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Inflow Reconciled</div>
            <div className="text-base font-bold font-mono text-purple-900 mt-0.5">
              {formatINR(metrics.totalReceived - metrics.totalUnadjusted)}
            </div>
            <div className="text-[10px] text-purple-700 mt-0.5">Applied to Open Invoices</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search receipt #, customer, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {(['All', 'Standard', 'Advance'] as const).map((tp) => (
              <button
                key={tp}
                type="button"
                onClick={() => setTypeFilter(tp)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  typeFilter === tp ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                {tp}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-gray-200">
                <th className="py-3 px-4">Receipt # / Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Deposit Account</th>
                <th className="py-3 px-4">Method & Reference</th>
                <th className="py-3 px-4 text-right">Amount Received</th>
                <th className="py-3 px-4">Advance Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No receipts found matching criteria
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((r) => {
                  const isAdvance = !!r.isAdvance;
                  const unallocated = r.unallocatedAmount !== undefined ? r.unallocatedAmount : 0;
                  const canAdjust = isAdvance && unallocated > 0;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{r.receiptNumber}</span>
                          {isAdvance && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded">
                              ADVANCE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{r.date}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{r.partyName}</div>
                        {r.remarks && <div className="text-[11px] text-slate-500 truncate max-w-xs">{r.remarks}</div>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{r.accountName}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{r.paymentMethod}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Ref: {r.referenceNumber}
                          {r.transactionId && ` | ${r.transactionId}`}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(r.amount)}
                      </td>

                      <td className="py-3 px-4">
                        {isAdvance ? (
                          <div>
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                unallocated === 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : unallocated < r.amount
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              <span>
                                {unallocated === 0
                                  ? 'Fully Adjusted'
                                  : unallocated < r.amount
                                  ? 'Partially Adjusted'
                                  : 'Unadjusted Advance'}
                              </span>
                            </span>
                            {unallocated > 0 && (
                              <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                                Unallocated: {formatINR(unallocated)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-slate-500 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Invoice Settled</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {canAdjust && (
                            <button
                              type="button"
                              onClick={() => setAdvanceToAdjust(r)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Adjust unallocated advance against open invoices"
                            >
                              <Layers className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setReceiptToPrint(r)}
                            className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Themed Receipt Voucher"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedReceiptDetails(r)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Receipt Details"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedReceiptDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 bg-blue-50 rounded-xl text-blue-700">
                  <Receipt className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Receipt Details: {selectedReceiptDetails.receiptNumber}
                  </h3>
                  <p className="text-xs text-slate-500">Collected on {selectedReceiptDetails.date}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Customer</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedReceiptDetails.partyName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Amount Received</div>
                <div className="font-bold font-mono text-emerald-700 text-base mt-0.5">
                  {formatINR(selectedReceiptDetails.amount)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Payment Method</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedReceiptDetails.paymentMethod}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Account Credited</div>
                <div className="font-bold text-slate-900 mt-0.5">{selectedReceiptDetails.accountName}</div>
              </div>
            </div>

            {selectedReceiptDetails.allocations && selectedReceiptDetails.allocations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Invoice Settlements
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700">
                        <th className="py-2 px-3">Invoice Number</th>
                        <th className="py-2 px-3 text-right">Settled Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedReceiptDetails.allocations.map((a, i) => (
                        <tr key={i}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{a.invoiceNumber}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-700 font-bold">
                            {formatINR(a.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReceiptToPrint(selectedReceiptDetails);
                }}
                className="px-4 py-2 bg-[#0B5D2A] hover:bg-[#168A45] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Receipt Modal */}
      {isNewReceiptModalOpen && (
        <RecordReceiptModal
          isOpen={isNewReceiptModalOpen}
          onClose={() => setIsNewReceiptModalOpen(false)}
          onSuccess={() => {
            setIsNewReceiptModalOpen(false);
            loadData();
          }}
          currentUserName={currentUserName}
        />
      )}

      {/* Advance Adjustment Modal */}
      {advanceToAdjust && (
        <AdvanceAdjustmentModal
          isOpen={!!advanceToAdjust}
          onClose={() => setAdvanceToAdjust(null)}
          onSuccess={() => {
            setAdvanceToAdjust(null);
            loadData();
          }}
          advance={advanceToAdjust}
          advanceType="Customer"
          currentUserName={currentUserName}
        />
      )}

      {/* Themed Printable Voucher Modal */}
      {receiptToPrint && (
        <PrintableVoucherModal
          type="receipt"
          receipt={receiptToPrint}
          onClose={() => setReceiptToPrint(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// RECORD RECEIPT MODAL
// ==========================================
interface RecordReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserName: string;
}

const RecordReceiptModal: React.FC<RecordReceiptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserName,
}) => {
  if (!isOpen) return null;

  const customers = useMemo(() => {
    return erpFinanceStorage.getParties().filter((p) => p.type === 'Customer' || p.type === 'Customer & Vendor');
  }, []);

  const bankAccounts = useMemo(() => erpFinanceStorage.getBankAccounts(), []);
  const cashAccounts = useMemo(() => erpFinanceStorage.getCashAccounts(), []);

  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>('Bank Transfer');
  const [selectedAccountId, setSelectedAccountId] = useState(bankAccounts[0]?.id || cashAccounts[0]?.id || '');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);
  const [amount, setAmount] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [remarks, setRemarks] = useState('');

  // Invoice allocations: { [invoiceId]: amountString }
  const [allocations, setAllocations] = useState<{ [id: string]: string }>({});
  const [errorMsg, setErrorMsg] = useState('');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Open invoices for selected customer
  const openInvoices = useMemo(() => {
    if (!selectedCustomerId) return [];
    return erpFinanceStorage
      .getSalesInvoices()
      .filter(
        (inv) =>
          (inv.customerId === selectedCustomerId || inv.customerName === selectedCustomer?.name) &&
          inv.balanceAmount > 0 &&
          inv.status !== 'Paid' &&
          inv.status !== 'Cancelled'
      );
  }, [selectedCustomerId, selectedCustomer]);

  const parsedAmount = parseFloat(amount) || 0;

  const handleInvoiceAllocationChange = (invId: string, val: string) => {
    setAllocations((prev) => ({
      ...prev,
      [invId]: val,
    }));
  };

  const handleAutoFillInvoice = (invId: string, balance: number) => {
    const otherAlloc = Object.entries(allocations).reduce(
      (sum: number, [id, val]) => (id === invId ? sum : sum + (parseFloat(String(val)) || 0)),
      0
    );
    const remainingToAllocate = Math.max(0, parsedAmount - otherAlloc);
    const fill = Math.min(balance, remainingToAllocate);
    handleInvoiceAllocationChange(invId, fill.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setErrorMsg('Please select a customer.');
      return;
    }
    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid positive collection amount.');
      return;
    }
    if (!selectedAccountId) {
      setErrorMsg('Please select a receiving bank or cash register account.');
      return;
    }

    const selectedAccount =
      bankAccounts.find((b) => b.id === selectedAccountId) ||
      cashAccounts.find((c) => c.id === selectedAccountId);

    if (!selectedAccount) {
      setErrorMsg('Selected bank/cash account could not be resolved.');
      return;
    }

    // Process invoice allocations
    const allocationList: InvoiceAllocation[] = [];
    if (!isAdvance) {
      for (const [invId, amountStr] of Object.entries(allocations)) {
        const amt = parseFloat(String(amountStr));
        if (amt > 0) {
          const inv = openInvoices.find((i) => i.id === invId);
          if (inv) {
            allocationList.push({
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              amount: amt,
            });
          }
        }
      }
    }

    try {
      erpFinanceStorage.postReceipt({
        partyId: selectedCustomer.id,
        partyName: selectedCustomer.name,
        amount: parsedAmount,
        paymentMethod,
        accountId: selectedAccount.id,
        accountName: selectedAccount.accountName,
        referenceNumber: referenceNumber.trim() || `RCPT-REF-${Date.now().toString().slice(-6)}`,
        transactionId: transactionId.trim() || undefined,
        allocations: allocationList,
        isAdvance,
        attachmentName: attachmentName || undefined,
        remarks: remarks.trim() || undefined,
        date: receiptDate,
        createdBy: currentUserName,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording receipt');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-gray-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Receipt className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {isAdvance ? 'Record Customer Advance Receipt' : 'Record Customer Collection Receipt'}
              </h2>
              <p className="text-xs text-blue-200">
                Instantly updates Accounts Receivable, Bank Balance, and Customer Ledger
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Customer *</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  setAllocations({});
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Receivable: {formatINR(Math.abs(c.currentBalance))})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Nature</label>
              <div className="flex items-center space-x-2 pt-1.5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAdvance}
                    onChange={(e) => setIsAdvance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {isAdvance ? 'Advance Retainer' : 'Invoice Settlement'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Amount, Date, Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date *</label>
              <input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account and References */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deposit To Account *</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
                required
              >
                <optgroup label="Bank Accounts">
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.accountName} (Bal: {formatINR(b.currentBalance)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cash Registers">
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.accountName} (Bal: {formatINR(c.currentBalance)})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reference Number *</label>
              <input
                type="text"
                placeholder="e.g. UTR-821948 or Cheque 9012"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transaction / UPI ID</label>
              <input
                type="text"
                placeholder="e.g. UPI-92813941"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Invoice Allocations (if not advance) */}
          {!isAdvance && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Allocate to Open Invoices ({openInvoices.length} open)
                </h3>
                <span className="text-[11px] text-slate-500">
                  Total Allocated:{' '}
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(
                      (Object.values(allocations) as string[]).reduce<number>(
                        (s, v) => s + (parseFloat(v) || 0),
                        0
                      )
                    )}
                  </span>{' '}
                  / {formatINR(parsedAmount)}
                </span>
              </div>

              {openInvoices.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 border border-dashed border-gray-300 rounded-xl text-xs text-slate-400">
                  No open sales invoices found for this customer. Check &quot;Advance Retainer&quot; above to record
                  an unlinked advance collection.
                </div>
              ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 sticky top-0 font-bold text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Invoice #</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3 text-right">Balance Due</th>
                        <th className="py-2 px-3 text-right w-36">Allocated (₹)</th>
                        <th className="py-2 px-2 text-center w-16">Fill</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {openInvoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="py-2 px-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                          <td className="py-2 px-3 text-slate-500">{inv.date}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-rose-600">
                            {formatINR(inv.balanceAmount)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={inv.balanceAmount}
                              placeholder="0"
                              value={allocations[inv.id] || ''}
                              onChange={(e) => handleInvoiceAllocationChange(inv.id, e.target.value)}
                              className="w-full px-2 py-1 text-xs text-right font-mono border border-gray-300 rounded-lg"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleAutoFillInvoice(inv.id, inv.balanceAmount)}
                              className="px-1.5 py-0.5 bg-slate-200 text-[10px] font-bold rounded hover:bg-blue-100 hover:text-blue-800 cursor-pointer"
                            >
                              Max
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Remarks & Attachment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
              <input
                type="text"
                placeholder="e.g. Cleared via client direct bank transfer"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attachment File Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Deposit_Receipt_Chq_982.pdf"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                />
                <Paperclip className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* General Ledger Preview */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs space-y-1 text-blue-950 font-mono">
            <div className="font-bold flex items-center space-x-1 font-sans text-blue-900">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>Automated Journal Entry on Save:</span>
            </div>
            <div className="pl-5 text-[11px] space-y-0.5">
              <div>Dr. Cash/Bank Account = {formatINR(parsedAmount)}</div>
              <div>
                Cr.{' '}
                {isAdvance
                  ? 'Advance from Customers (Account 2300)'
                  : 'Accounts Receivable (Account 1200)'}{' '}
                = {formatINR(parsedAmount)}
              </div>
            </div>
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
              disabled={parsedAmount <= 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#168A45] hover:bg-[#0B5D2A] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>Record & Post Collection ({formatINR(parsedAmount)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
