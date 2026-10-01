import React, { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  Calendar,
  Layers,
  ArrowDownRight,
  ChevronRight,
  Paperclip,
  Check,
  ExternalLink,
  Info,
  Printer,
  X,
} from 'lucide-react';
import {
  PaymentTransactionRecord,
  PaymentMode,
  TdsSection,
  ApprovalTier,
  InvoiceAllocation,
  PurchaseInvoiceRecord,
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

const TDS_SECTION_OPTIONS: { section: TdsSection; rate: number; label: string }[] = [
  { section: '194C', rate: 2, label: '194C - Contractors & Sub-contractors (2%)' },
  { section: '194J', rate: 10, label: '194J - Professional & Technical Fees (10%)' },
  { section: '194I', rate: 10, label: '194I - Rent for Land, Building or Furniture (10%)' },
  { section: '194H', rate: 5, label: '194H - Commission & Brokerage (5%)' },
  { section: '194Q', rate: 0.1, label: '194Q - Purchase of Goods > ₹50L (0.1%)' },
];

const PAYMENT_METHODS: PaymentMode[] = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Card',
  'Cheque',
  'Other',
];

interface PaymentManagementViewProps {
  currentUserName?: string;
  userRole?: string;
  onOpenPartyLedger?: (partyId: string) => void;
}

export const PaymentManagementView: React.FC<PaymentManagementViewProps> = ({
  currentUserName = 'Finance Officer',
  userRole = 'Admin',
  onOpenPartyLedger,
}) => {
  const [payments, setPayments] = useState<PaymentTransactionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending Approval' | 'Completed' | 'Cancelled'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Standard' | 'Advance'>('All');

  // Modal State for New Payment
  const [isNewPaymentModalOpen, setIsNewPaymentModalOpen] = useState(false);

  // Approval step modal/prompt
  const [paymentToApprove, setPaymentToApprove] = useState<PaymentTransactionRecord | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Rejection modal
  const [paymentToReject, setPaymentToReject] = useState<PaymentTransactionRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Advance adjustment modal
  const [advanceToAdjust, setAdvanceToAdjust] = useState<PaymentTransactionRecord | null>(null);

  // Details drawer/modal
  const [selectedPaymentDetails, setSelectedPaymentDetails] = useState<PaymentTransactionRecord | null>(null);

  // Themed Printable Voucher Modal
  const [paymentToPrint, setPaymentToPrint] = useState<PaymentTransactionRecord | null>(null);

  const loadData = () => {
    setPayments(erpFinanceStorage.getPayments());
  };

  useEffect(() => {
    loadData();
    const handleChanged = () => loadData();
    window.addEventListener('erp_payments_changed', handleChanged);
    window.addEventListener('erp_approvals_changed', handleChanged);
    return () => {
      window.removeEventListener('erp_payments_changed', handleChanged);
      window.removeEventListener('erp_approvals_changed', handleChanged);
    };
  }, []);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        p.paymentNumber.toLowerCase().includes(q) ||
        p.partyName.toLowerCase().includes(q) ||
        p.referenceNumber.toLowerCase().includes(q) ||
        (p.transactionId && p.transactionId.toLowerCase().includes(q)) ||
        (p.chequeNumber && p.chequeNumber.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchType =
        typeFilter === 'All' ||
        (typeFilter === 'Advance' && p.isAdvance) ||
        (typeFilter === 'Standard' && !p.isAdvance);

      return matchQuery && matchStatus && matchType;
    });
  }, [payments, searchQuery, statusFilter, typeFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalDisbursed = payments
      .filter((p) => p.status === 'Completed')
      .reduce((sum, p) => sum + p.netPaid, 0);

    const pendingApprovalCount = payments.filter((p) => p.status === 'Pending Approval').length;
    const pendingApprovalAmount = payments
      .filter((p) => p.status === 'Pending Approval')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalTdsWithheld = payments
      .filter((p) => p.status === 'Completed')
      .reduce((sum, p) => sum + (p.tdsAmount || 0), 0);

    const activeAdvances = payments.filter(
      (p) => p.isAdvance && (p.unallocatedAmount || 0) > 0 && p.status === 'Completed'
    );
    const totalUnadjustedAdvance = activeAdvances.reduce(
      (sum, p) => sum + (p.unallocatedAmount || 0),
      0
    );

    return {
      totalDisbursed,
      pendingApprovalCount,
      pendingApprovalAmount,
      totalTdsWithheld,
      totalUnadjustedAdvance,
      activeAdvancesCount: activeAdvances.length,
    };
  }, [payments]);

  // Handlers for approval
  const handleConfirmApprove = () => {
    if (!paymentToApprove) return;
    try {
      erpFinanceStorage.approvePaymentStep(
        paymentToApprove.id,
        currentUserName,
        userRole,
        approvalComment || undefined
      );
      setPaymentToApprove(null);
      setApprovalComment('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error approving payment step');
    }
  };

  const handleConfirmReject = () => {
    if (!paymentToReject || !rejectionReason.trim()) {
      alert('Please enter a rejection justification.');
      return;
    }
    try {
      erpFinanceStorage.rejectPayment(
        paymentToReject.id,
        currentUserName,
        rejectionReason.trim()
      );
      setPaymentToReject(null);
      setRejectionReason('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error rejecting payment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-emerald-50 rounded-xl text-[#0B5D2A] border border-[#D9E5DD]">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Vendor Payments & Outflow Management
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                Sequential Approval Guard
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Execute vendor settlements with statutory TDS deduction, invoice matching, automated double-entry General
              Ledger posting, and fraud-resistant multi-tier sequential approval chains.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewPaymentModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment / Advance</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Net Disbursed</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {formatINR(metrics.totalDisbursed)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Settled to Vendors</div>
          </div>

          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/60">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Pending Approvals</div>
            <div className="text-base font-bold font-mono text-amber-900 mt-0.5">
              {formatINR(metrics.pendingApprovalAmount)}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
              {metrics.pendingApprovalCount} payment(s) in sequential chain
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/60">
            <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">TDS Withheld</div>
            <div className="text-base font-bold font-mono text-purple-900 mt-0.5">
              {formatINR(metrics.totalTdsWithheld)}
            </div>
            <div className="text-[10px] text-purple-700 mt-0.5">Cr. 2150 TDS Payable</div>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60">
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Unadjusted Advances</div>
            <div className="text-base font-bold font-mono text-blue-900 mt-0.5">
              {formatINR(metrics.totalUnadjustedAdvance)}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">
              {metrics.activeAdvancesCount} vendor advance(s) open
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search payment #, vendor, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Status Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            {(['All', 'Pending Approval', 'Completed', 'Cancelled'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  statusFilter === st ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Type Filter */}
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

      {/* Payments Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 font-bold border-b border-gray-200">
                <th className="py-3 px-4">Payment # / Date</th>
                <th className="py-3 px-4">Vendor / Party</th>
                <th className="py-3 px-4">Mode & Account</th>
                <th className="py-3 px-4 text-right">Gross Amount</th>
                <th className="py-3 px-4 text-right">TDS Withheld</th>
                <th className="py-3 px-4 text-right">Net Paid</th>
                <th className="py-3 px-4">Approval Chain Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No payments found matching criteria
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPending = p.status === 'Pending Approval';
                  const isCompleted = p.status === 'Completed';
                  const isRejected = p.status === 'Cancelled' || p.approvalStatus === 'Rejected';
                  const currentTier = p.currentTier;
                  const tiers = p.requiredTiers || ['FinanceManager'];
                  const approvedCount = (p.approvedTiers || []).length;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Payment Number & Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">{p.paymentNumber}</span>
                          {p.isAdvance && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">
                              ADVANCE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{p.date}</span>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{p.partyName}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          Ref: {p.referenceNumber}
                          {p.chequeNumber && ` | Chq: ${p.chequeNumber}`}
                          {p.transactionId && ` | Txn: ${p.transactionId}`}
                        </div>
                      </td>

                      {/* Mode & Account */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{p.paymentMethod}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{p.accountName}</div>
                      </td>

                      {/* Gross Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(p.amount)}
                      </td>

                      {/* TDS Withheld */}
                      <td className="py-3 px-4 text-right font-mono">
                        {p.tdsAmount && p.tdsAmount > 0 ? (
                          <div>
                            <span className="text-purple-700 font-bold">{formatINR(p.tdsAmount)}</span>
                            <div className="text-[10px] text-slate-400">
                              Sec {p.tdsSection} ({p.tdsRate}%)
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Net Paid */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatINR(p.netPaid)}
                      </td>

                      {/* Sequential Approval Chain Indicator */}
                      <td className="py-3 px-4">
                        {isCompleted && (
                          <div>
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Fully Approved</span>
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              By {p.approvedBy || 'Finance Manager'}
                            </div>
                          </div>
                        )}

                        {isRejected && (
                          <div>
                            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                          </div>
                        )}

                        {isPending && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1">
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-700 animate-spin" />
                                <span>Awaiting: {currentTier}</span>
                              </span>
                            </div>
                            {/* Step indicators */}
                            <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                              {tiers.map((tier, idx) => {
                                const isApproved = idx < approvedCount;
                                const isCurrent = tier === currentTier;
                                return (
                                  <React.Fragment key={tier}>
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-mono ${
                                        isApproved
                                          ? 'bg-emerald-100 text-emerald-800 font-bold'
                                          : isCurrent
                                          ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                                          : 'bg-slate-100 text-slate-400'
                                      }`}
                                      title={`Tier ${idx + 1}: ${tier}`}
                                    >
                                      T{idx + 1}
                                    </span>
                                    {idx < tiers.length - 1 && <span>→</span>}
                                  </React.Fragment>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setPaymentToApprove(p)}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-2xs transition-colors cursor-pointer"
                                title={`Authorize Step (${currentTier})`}
                              >
                                <Check className="w-3 h-3" />
                                <span>Approve Step</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPaymentToReject(p)}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                                title="Reject payment"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isCompleted && p.isAdvance && (p.unallocatedAmount || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => setAdvanceToAdjust(p)}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Adjust against purchase invoices"
                            >
                              <Layers className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setPaymentToPrint(p)}
                            className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Themed Payment Voucher"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedPaymentDetails(p)}
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Details & Allocations"
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

      {/* Approve Step Dialog */}
      {paymentToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Authorize Payment Step</h3>
                <p className="text-xs text-slate-500">
                  Sequential Approval Tier: <strong className="text-emerald-700">{paymentToApprove.currentTier}</strong>
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Ref:</span>
                <span className="font-mono font-bold text-slate-900">{paymentToApprove.paymentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vendor:</span>
                <span className="font-bold text-slate-900">{paymentToApprove.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gross Outflow:</span>
                <span className="font-mono font-bold text-slate-900">{formatINR(paymentToApprove.amount)}</span>
              </div>
              {paymentToApprove.tdsAmount && paymentToApprove.tdsAmount > 0 && (
                <div className="flex justify-between text-purple-700">
                  <span>TDS Withheld ({paymentToApprove.tdsSection}):</span>
                  <span className="font-mono font-bold">-{formatINR(paymentToApprove.tdsAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                <span className="text-slate-800">Net Disbursement:</span>
                <span className="font-mono text-emerald-700">{formatINR(paymentToApprove.netPaid)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Approver Remarks / Authorization Note
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Verified goods receipt and 3-way matching verified"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentToApprove(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Confirm Step Authorization
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {paymentToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-700 border border-rose-200">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Reject Payment</h3>
                <p className="text-xs text-slate-500">
                  Payment <span className="font-mono font-bold">{paymentToReject.paymentNumber}</span> will be halted
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Justification *
              </label>
              <textarea
                rows={3}
                placeholder="State the compliance or billing reason for rejecting this outflow..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentToReject(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
              >
                Reject & Cancel Outflow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details Drawer/Modal */}
      {selectedPaymentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-gray-200 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 bg-slate-100 rounded-xl text-slate-700">
                  <CreditCard className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Payment Details: {selectedPaymentDetails.paymentNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recorded on {selectedPaymentDetails.date} via {selectedPaymentDetails.paymentMethod}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPaymentDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Vendor</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedPaymentDetails.partyName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Account</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedPaymentDetails.accountName}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Net Paid</div>
                <div className="font-bold font-mono text-emerald-700 text-sm mt-0.5">
                  {formatINR(selectedPaymentDetails.netPaid)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Gross Outflow</div>
                <div className="font-bold font-mono text-slate-900 text-sm mt-0.5">
                  {formatINR(selectedPaymentDetails.amount)}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">TDS Withheld</div>
                <div className="font-bold font-mono text-purple-700 text-sm mt-0.5">
                  {selectedPaymentDetails.tdsAmount ? formatINR(selectedPaymentDetails.tdsAmount) : '₹0'}
                  {selectedPaymentDetails.tdsSection && ` (${selectedPaymentDetails.tdsSection})`}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-slate-400 font-bold uppercase text-[10px]">Status</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedPaymentDetails.status}</div>
              </div>
            </div>

            {/* Approval History */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Sequential Approval Log
              </h4>
              <div className="space-y-1.5 border border-gray-200 rounded-xl p-3 bg-slate-50">
                {(!selectedPaymentDetails.approvedTiers || selectedPaymentDetails.approvedTiers.length === 0) ? (
                  <div className="text-xs text-slate-400 italic">No tier authorizations logged yet</div>
                ) : (
                  selectedPaymentDetails.approvedTiers.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-gray-200 last:border-0">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-slate-800">{t.tier} Tier</span>
                        <span className="text-slate-500">authorized by {t.approverName}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{t.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invoice Allocations */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Invoice Settlements ({selectedPaymentDetails.allocations?.length || 0})
              </h4>
              {selectedPaymentDetails.allocations && selectedPaymentDetails.allocations.length > 0 ? (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-700">
                        <th className="py-2 px-3">Invoice Number</th>
                        <th className="py-2 px-3 text-right">Allocated Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedPaymentDetails.allocations.map((a, i) => (
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
              ) : (
                <div className="text-xs text-slate-400 italic">
                  {selectedPaymentDetails.isAdvance
                    ? 'Unallocated Advance payment (can be adjusted against future invoices)'
                    : 'No specific invoice allocations recorded'}
                </div>
              )}
            </div>

            {selectedPaymentDetails.remarks && (
              <div className="text-xs text-slate-600 p-3 bg-slate-50 rounded-xl border border-gray-100">
                <span className="font-bold text-slate-800">Remarks:</span> {selectedPaymentDetails.remarks}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setPaymentToPrint(selectedPaymentDetails);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Voucher</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPaymentDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isNewPaymentModalOpen && (
        <RecordPaymentModal
          isOpen={isNewPaymentModalOpen}
          onClose={() => setIsNewPaymentModalOpen(false)}
          onSuccess={() => {
            setIsNewPaymentModalOpen(false);
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
          advanceType="Vendor"
          currentUserName={currentUserName}
        />
      )}

      {/* Themed Printable Voucher Modal */}
      {paymentToPrint && (
        <PrintableVoucherModal
          type="payment"
          payment={paymentToPrint}
          onClose={() => setPaymentToPrint(null)}
        />
      )}
    </div>
  );
};

// ==========================================
// RECORD PAYMENT MODAL
// ==========================================
interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentUserName: string;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUserName,
}) => {
  if (!isOpen) return null;

  const vendors = useMemo(() => {
    return erpFinanceStorage.getParties().filter((p) => p.type === 'Vendor' || p.type === 'Customer & Vendor');
  }, []);

  const bankAccounts = useMemo(() => erpFinanceStorage.getBankAccounts(), []);
  const cashAccounts = useMemo(() => erpFinanceStorage.getCashAccounts(), []);

  // Form State
  const [selectedVendorId, setSelectedVendorId] = useState(vendors[0]?.id || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>('Bank Transfer');
  const [selectedAccountId, setSelectedAccountId] = useState(bankAccounts[0]?.id || cashAccounts[0]?.id || '');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [isAdvance, setIsAdvance] = useState(false);
  const [grossAmount, setGrossAmount] = useState('');
  const [tdsSection, setTdsSection] = useState<TdsSection | ''>('');
  const [customTdsRate, setCustomTdsRate] = useState<number | ''>('');
  const [attachmentName, setAttachmentName] = useState('');
  const [remarks, setRemarks] = useState('');

  // Invoice allocations: { [invoiceId]: amountString }
  const [allocations, setAllocations] = useState<{ [id: string]: string }>({});
  const [errorMsg, setErrorMsg] = useState('');

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  // Open invoices for selected vendor
  const openInvoices = useMemo(() => {
    if (!selectedVendorId) return [];
    return erpFinanceStorage
      .getPurchaseInvoices()
      .filter(
        (inv) =>
          (inv.vendorId === selectedVendorId || inv.vendorName === selectedVendor?.name) &&
          inv.balanceAmount > 0 &&
          inv.status !== 'Paid' &&
          inv.status !== 'Cancelled'
      );
  }, [selectedVendorId, selectedVendor]);

  // TDS Rate & Calculation
  const appliedTdsRate = useMemo(() => {
    if (!tdsSection) return 0;
    if (customTdsRate !== '') return Number(customTdsRate);
    const sec = TDS_SECTION_OPTIONS.find((o) => o.section === tdsSection);
    return sec ? sec.rate : 0;
  }, [tdsSection, customTdsRate]);

  const parsedGrossAmount = parseFloat(grossAmount) || 0;

  const tdsAmount = useMemo(() => {
    if (appliedTdsRate <= 0 || parsedGrossAmount <= 0) return 0;
    return Math.round((parsedGrossAmount * appliedTdsRate) / 100);
  }, [parsedGrossAmount, appliedTdsRate]);

  const netPaid = Math.max(0, parsedGrossAmount - tdsAmount);

  // Sequential Tiers Preview
  const sequentialTiersPreview = useMemo(() => {
    return erpFinanceStorage.getPaymentSequentialTiers(parsedGrossAmount);
  }, [parsedGrossAmount]);

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
    const remainingToAllocate = Math.max(0, parsedGrossAmount - otherAlloc);
    const fill = Math.min(balance, remainingToAllocate);
    handleInvoiceAllocationChange(invId, fill.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) {
      setErrorMsg('Please select a valid vendor.');
      return;
    }
    if (parsedGrossAmount <= 0) {
      setErrorMsg('Please enter a valid positive payment amount.');
      return;
    }
    if (!selectedAccountId) {
      setErrorMsg('Please select a disbursement bank or cash account.');
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
      erpFinanceStorage.postPayment({
        partyId: selectedVendor.id,
        partyName: selectedVendor.name,
        amount: parsedGrossAmount,
        paymentMethod,
        accountId: selectedAccount.id,
        accountName: selectedAccount.accountName,
        referenceNumber: referenceNumber.trim() || `REF-${Date.now().toString().slice(-6)}`,
        chequeNumber: chequeNumber.trim() || undefined,
        transactionId: transactionId.trim() || undefined,
        tdsSection: tdsSection || undefined,
        tdsRate: appliedTdsRate,
        tdsAmount,
        allocations: allocationList,
        isAdvance,
        attachmentName: attachmentName || undefined,
        remarks: remarks.trim() || undefined,
        date: paymentDate,
        requestedBy: currentUserName,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error processing payment outflow');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden border border-gray-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <CreditCard className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {isAdvance ? 'Record Vendor Advance Payment' : 'Record Vendor Payment'}
              </h2>
              <p className="text-xs text-emerald-200">
                Outflow requires sequential authorization based on company spending delegation rules
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

          {/* Advance Toggle & Party Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Vendor *</label>
              <select
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  setAllocations({});
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
                required
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (Payable: {formatINR(Math.abs(v.currentBalance))})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Type</label>
              <div className="flex items-center space-x-2 pt-1.5">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAdvance}
                    onChange={(e) => setIsAdvance(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {isAdvance ? 'Advance Payment' : 'Standard Payment'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Amount, Date, Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gross Amount (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-mono text-xs">₹</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={grossAmount}
                  onChange={(e) => setGrossAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold text-slate-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date *</label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMode)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Cash / Bank Account *</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-medium"
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
                placeholder="e.g. UTR-9823412 or Cheque Ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {paymentMethod === 'Cheque' ? 'Cheque Number *' : 'Transaction / UTR ID'}
              </label>
              {paymentMethod === 'Cheque' ? (
                <input
                  type="text"
                  placeholder="e.g. 402911"
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  required
                />
              ) : (
                <input
                  type="text"
                  placeholder="e.g. TXN-8923184910"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                />
              )}
            </div>
          </div>

          {/* TDS Deduction Section */}
          <div className="p-4 bg-purple-50/50 border border-purple-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>Statutory TDS Deduction</span>
              </span>
              {tdsAmount > 0 && (
                <span className="text-xs font-mono font-bold text-purple-800">
                  TDS to Withhold: {formatINR(tdsAmount)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">TDS Section</label>
                <select
                  value={tdsSection}
                  onChange={(e) => setTdsSection(e.target.value as TdsSection)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 bg-white"
                >
                  <option value="">No TDS (Exempt / Threshold Not Crossed)</option>
                  {TDS_SECTION_OPTIONS.map((opt) => (
                    <option key={opt.section} value={opt.section}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {tdsSection && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">TDS Rate %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={appliedTdsRate}
                    onChange={(e) => setCustomTdsRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-purple-500 bg-white font-mono"
                  />
                </div>
              )}
            </div>

            {tdsSection && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-100 text-xs font-mono text-purple-950">
                <div>
                  <span className="text-slate-500 text-[10px] block">Gross Payable</span>
                  <span className="font-bold">{formatINR(parsedGrossAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Less TDS Withheld</span>
                  <span className="font-bold text-purple-700">-{formatINR(tdsAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Net Bank Outflow</span>
                  <span className="font-bold text-emerald-700">{formatINR(netPaid)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Allocations (if not advance) */}
          {!isAdvance && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Link to Purchase Invoices ({openInvoices.length} open)
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
                  / {formatINR(parsedGrossAmount)}
                </span>
              </div>

              {openInvoices.length === 0 ? (
                <div className="p-4 text-center bg-slate-50 border border-dashed border-gray-300 rounded-xl text-xs text-slate-400">
                  No open unpaid purchase invoices found for this vendor. Check &quot;Advance Payment&quot; above to record
                  an unlinked advance.
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
                              className="px-1.5 py-0.5 bg-slate-200 text-[10px] font-bold rounded hover:bg-emerald-100 hover:text-emerald-800 cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Purpose</label>
              <input
                type="text"
                placeholder="e.g. Monthly cloud server infrastructure settlement"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Attachment File Name</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Payment_Proof_NEFT_901.pdf"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
                <Paperclip className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Sequential Approval Warning Banner */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
            <div className="font-bold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Mandatory Sequential Approval Workflow:</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Based on the outflow amount of <strong>{formatINR(parsedGrossAmount)}</strong>, this payment requires{' '}
              <strong>{sequentialTiersPreview.length} sequential approval tier(s)</strong>:{' '}
              <span className="font-bold font-mono text-amber-950">
                {sequentialTiersPreview.join(' → ')}
              </span>
              . Cash will NOT leave the business until Tier {sequentialTiersPreview.length} authorization is complete.
            </p>
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
              disabled={parsedGrossAmount <= 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#168A45] hover:bg-[#0B5D2A] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <span>Submit Payment into Approval Chain ({formatINR(netPaid)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
