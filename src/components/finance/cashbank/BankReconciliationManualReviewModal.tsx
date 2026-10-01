import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  ArrowRight,
  PlusCircle,
  FileText,
  Landmark,
  ShieldCheck,
  Check,
  Tag,
  Clock,
  HelpCircle,
} from 'lucide-react';
import {
  BankAccountRecord,
  BankStatementLine,
  SystemBankTransaction,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface BankReconciliationManualReviewModalProps {
  line: BankStatementLine;
  bankAccount: BankAccountRecord;
  availableSystemTransactions: SystemBankTransaction[];
  onClose: () => void;
  onMatched: (matchedSystemTxId: string, matchedRef: string) => void;
  onAdjustmentCreated: (newSystemTx: SystemBankTransaction) => void;
  onMarkTimingDifference: (note: string) => void;
}

export const BankReconciliationManualReviewModal: React.FC<BankReconciliationManualReviewModalProps> = ({
  line,
  bankAccount,
  availableSystemTransactions,
  onClose,
  onMatched,
  onAdjustmentCreated,
  onMarkTimingDifference,
}) => {
  const [activeTab, setActiveTab] = useState<'match' | 'adjust' | 'timing'>('match');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // Adjustment Form State
  const isWithdrawal = line.withdrawal > 0;
  const targetAmount = isWithdrawal ? line.withdrawal : line.deposit;
  const [adjCategory, setAdjCategory] = useState<string>(
    isWithdrawal ? 'Bank Charges' : 'Interest Received'
  );
  const [adjNotes, setAdjNotes] = useState<string>(
    line.reviewReason || `Manual bank reconciliation adjustment for ${line.description}`
  );
  const [timingNote, setTimingNote] = useState<string>(
    `Cleared in bank on ${line.date}; pending GL entry verification.`
  );

  // Candidate system transactions matching direction
  const eligibleSystemTxs = availableSystemTransactions.filter((s) => {
    if (s.status === 'Matched' || s.status === 'Reconciled') return false;
    const sysIsWithdrawal = (s.withdrawal || 0) > 0;
    if (sysIsWithdrawal !== isWithdrawal) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        s.description.toLowerCase().includes(q) ||
        (s.referenceNumber && s.referenceNumber.toLowerCase().includes(q)) ||
        (s.partyName && s.partyName.toLowerCase().includes(q)) ||
        String(s.withdrawal || s.deposit).includes(q)
      );
    }
    return true;
  });

  // Handle manual pairing
  const handleConfirmPairing = () => {
    if (!selectedTxId) return;
    const target = availableSystemTransactions.find((s) => s.id === selectedTxId);
    if (target) {
      onMatched(target.id, target.referenceNumber || target.id);
    }
  };

  // Handle 1-click Quick Voucher Creation
  const handleCreateAdjustment = () => {
    const today = line.date || new Date().toISOString().split('T')[0];
    const adjNumber = `ADJ-${Date.now().toString().slice(-6)}`;

    if (isWithdrawal) {
      // Create quick payment voucher for bank charge/direct debit
      const newPayment = erpFinanceStorage.postPayment({
        id: `pmt-${Date.now()}`,
        paymentNumber: adjNumber,
        partyId: 'BANK-SERVICE',
        partyName: `${bankAccount.name} (${adjCategory})`,
        partyType: 'Vendor',
        accountId: bankAccount.id,
        accountName: bankAccount.name,
        paymentMethod: 'Bank Transfer',
        referenceNumber: line.reference || adjNumber,
        amount: targetAmount,
        status: 'Completed',
        date: today,
        remarks: adjNotes,
        skipApproval: true,
      });

      const newSysTx: SystemBankTransaction = {
        id: newPayment.id,
        date: today,
        type: 'Withdrawal',
        category: 'Payment',
        bankAccountId: bankAccount.id,
        partyName: `${bankAccount.name} (${adjCategory})`,
        referenceNumber: adjNumber,
        description: adjNotes,
        withdrawal: targetAmount,
        deposit: 0,
        status: 'Matched',
        clearedDate: line.date,
      };

      onAdjustmentCreated(newSysTx);
    } else {
      // Create quick receipt voucher for interest/direct deposit
      const newReceipt = erpFinanceStorage.postReceipt({
        id: `rcpt-${Date.now()}`,
        receiptNumber: adjNumber,
        partyId: 'BANK-INTEREST',
        partyName: `${bankAccount.name} (${adjCategory})`,
        accountId: bankAccount.id,
        accountName: bankAccount.name,
        paymentMethod: 'Bank Transfer',
        referenceNumber: line.reference || adjNumber,
        amount: targetAmount,
        date: today,
        remarks: adjNotes,
      });

      const newSysTx: SystemBankTransaction = {
        id: newReceipt.id,
        date: today,
        type: 'Deposit',
        category: 'Receipt',
        bankAccountId: bankAccount.id,
        partyName: `${bankAccount.name} (${adjCategory})`,
        referenceNumber: adjNumber,
        description: adjNotes,
        withdrawal: 0,
        deposit: targetAmount,
        status: 'Matched',
        clearedDate: line.date,
      };

      onAdjustmentCreated(newSysTx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Manual Review & Resolution</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                  {line.reviewCategory || 'Unmatched Entry'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Resolve flagged discrepancy for {bankAccount.name} statement line
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Statement Line Snapshot */}
        <div className="p-4 bg-amber-50/50 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statement Entry</div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{line.description}</div>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
              <span>Date: <span className="font-mono font-semibold text-slate-700">{line.date}</span></span>
              {line.reference && (
                <span>Ref: <span className="font-mono font-semibold text-slate-700">{line.reference}</span></span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Discrepancy Amount</div>
            <div className={`text-base font-bold font-mono ${isWithdrawal ? 'text-rose-600' : 'text-emerald-600'}`}>
              {isWithdrawal ? `-${formatINR(line.withdrawal)} (Debit)` : `+${formatINR(line.deposit)} (Credit)`}
            </div>
            <div className="text-[11px] text-amber-700 mt-0.5 font-medium">{line.reviewReason}</div>
          </div>
        </div>

        {/* Resolution Mode Switcher */}
        <div className="flex items-center border-b border-slate-200 bg-white px-6 shrink-0">
          <button
            onClick={() => setActiveTab('match')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'match'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Pair with Existing ERP Voucher ({eligibleSystemTxs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('adjust')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'adjust'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Quick Ledger Adjustment</span>
          </button>

          <button
            onClick={() => setActiveTab('timing')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-colors ${
              activeTab === 'timing'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Mark Timing Difference</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'match' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Select a pending system transaction to link and clear:
                </span>
                <span className="text-[11px] text-slate-500">
                  Target: {formatINR(targetAmount)} ({isWithdrawal ? 'Withdrawal' : 'Deposit'})
                </span>
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by party, voucher reference, amount..."
                  className="w-full text-xs bg-transparent focus:outline-none"
                />
              </div>

              {/* Candidates List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {eligibleSystemTxs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">No open {isWithdrawal ? 'payment' : 'receipt'} vouchers match this criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      You can switch to the "Create Quick Ledger Adjustment" tab to generate one instantly.
                    </p>
                  </div>
                ) : (
                  eligibleSystemTxs.map((tx) => {
                    const isSelected = selectedTxId === tx.id;
                    const diff = Math.abs((tx.withdrawal || tx.deposit || 0) - targetAmount);
                    const isExactMatch = diff < 0.01;

                    return (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTxId(tx.id)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">{tx.referenceNumber}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {tx.type}
                            </span>
                            {isExactMatch && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Exact Amount
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-medium text-slate-700">{tx.partyName || tx.description}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Date: {tx.date}</div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-slate-900">
                            {formatINR(tx.withdrawal || tx.deposit || 0)}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTxId(tx.id);
                              onMatched(tx.id, tx.referenceNumber || tx.id);
                            }}
                            className="mt-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                          >
                            Link Voucher
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : activeTab === 'adjust' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>Instant GL Posting</span>
                </div>
                This will create a balanced {isWithdrawal ? 'Payment (Dr Expense / Cr Bank)' : 'Receipt (Dr Bank / Cr Income)'} entry in the ERP cash & bank ledger and automatically reconcile this statement item.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Adjustment Category</label>
                  <select
                    value={adjCategory}
                    onChange={(e) => setAdjCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {isWithdrawal ? (
                      <>
                        <option value="Bank Charges">Bank Service Charges (GL 5200)</option>
                        <option value="Direct Debit">Direct Utility / Mandate Debit</option>
                        <option value="Forex/TDS Fee">Bank Forex & Card Fee</option>
                        <option value="Miscellaneous Debit">Miscellaneous Bank Expense</option>
                      </>
                    ) : (
                      <>
                        <option value="Interest Received">Bank Interest Income (GL 4200)</option>
                        <option value="Direct Deposit">Direct Electronic Collection</option>
                        <option value="Alumni Donation">Alumni / External Inward Wire</option>
                        <option value="Rebate/Refund">Bank Fee Refund</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount</label>
                  <input
                    type="text"
                    disabled
                    value={formatINR(targetAmount)}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration / Voucher Notes</label>
                <textarea
                  rows={3}
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateAdjustment}
                className="w-full py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Post Adjustment & Reconcile Statement Line</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Timing Difference Audit Flag</span>
                </div>
                If this item is an issued cheque in clearing, a deposit in transit, or a weekend processing float, you can flag it as a verified timing difference. It will remain in the reconciliation record with your audit note.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timing Difference Justification Note</label>
                <textarea
                  rows={3}
                  value={timingNote}
                  onChange={(e) => setTimingNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <button
                type="button"
                onClick={() => onMarkTimingDifference(timingNote)}
                className="w-full py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 text-amber-700" />
                <span>Save Timing Difference Note</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>

          {activeTab === 'match' && selectedTxId && (
            <button
              type="button"
              onClick={handleConfirmPairing}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Match</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
