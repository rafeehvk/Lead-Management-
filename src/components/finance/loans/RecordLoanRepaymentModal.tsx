import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  CreditCard,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Landmark,
  FileText,
  Calculator,
} from 'lucide-react';
import {
  LoanRecord,
  LoanRepaymentRecord,
  PaymentMode,
  BankAccountRecord,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface RecordLoanRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLoanId?: string;
  onRepaymentRecorded: (repayment: LoanRepaymentRecord) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const RecordLoanRepaymentModal: React.FC<RecordLoanRepaymentModalProps> = ({
  isOpen,
  onClose,
  selectedLoanId,
  onRepaymentRecorded,
}) => {
  const loans = erpFinanceStorage.getLoans().filter((l) => l.status !== 'Draft');
  const bankAccounts = erpFinanceStorage.getBankAccounts();

  const [loanId, setLoanId] = useState(selectedLoanId || '');
  const [repaymentNumber, setRepaymentNumber] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [principalAmount, setPrincipalAmount] = useState<string>('');
  const [interestAmount, setInterestAmount] = useState<string>('');
  const [penaltyAmount, setPenaltyAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>('Bank Transfer');
  const [accountId, setAccountId] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedLoan = useMemo(() => {
    return loans.find((l) => l.id === loanId);
  }, [loans, loanId]);

  // When modal opens or selected loan changes
  useEffect(() => {
    if (isOpen) {
      const activeLoans = erpFinanceStorage.getLoans().filter((l) => l.status !== 'Draft');
      const targetId = selectedLoanId || (activeLoans.length > 0 ? activeLoans[0].id : '');
      setLoanId(targetId);

      const existingRepayments = erpFinanceStorage.getLoanRepayments();
      setRepaymentNumber(`LRP-2026-${String(existingRepayments.length + 1).padStart(4, '0')}`);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPenaltyAmount('0');
      setReferenceNumber(`UTR-${Date.now().toString().slice(-8)}`);
      setRemarks('Monthly EMI settlement');
      setErrors({});

      if (bankAccounts.length > 0) {
        setAccountId(bankAccounts[0].id);
      }
    }
  }, [isOpen, selectedLoanId]);

  // When loanId changes, precompute interest & principal breakdown from EMI
  useEffect(() => {
    if (selectedLoan) {
      if (selectedLoan.bankAccountId) {
        setAccountId(selectedLoan.bankAccountId);
      }
      // Calculate monthly interest based on current outstanding
      const monthlyRate = selectedLoan.interestRate / 12 / 100;
      const estInterest = Math.round(selectedLoan.outstandingPrincipal * monthlyRate);
      const estPrincipal = Math.min(
        selectedLoan.outstandingPrincipal,
        Math.max(0, selectedLoan.emiAmount - estInterest)
      );

      setPrincipalAmount(String(estPrincipal));
      setInterestAmount(String(estInterest));

      // Calculate next due date
      const repayments = erpFinanceStorage.getLoanRepayments(selectedLoan.id);
      const installmentIndex = repayments.length + 1;
      const d = new Date(selectedLoan.startDate);
      d.setMonth(d.getMonth() + installmentIndex);
      setDueDate(d.toISOString().split('T')[0]);
    }
  }, [selectedLoan]);

  // Numbers
  const p = parseFloat(principalAmount) || 0;
  const i = parseFloat(interestAmount) || 0;
  const penalty = parseFloat(penaltyAmount) || 0;
  const totalPaid = Math.round((p + i + penalty) * 100) / 100;

  // Real-time automatic loan statistics calculations required by user:
  // Original Principal, Principal Repaid, Interest Paid, Outstanding Principal, Total Repaid, Remaining Balance, Next Payment, Overdue Amount
  const metrics = useMemo(() => {
    if (!selectedLoan) {
      return {
        originalPrincipal: 0,
        principalRepaidSoFar: 0,
        interestPaidSoFar: 0,
        outstandingPrincipal: 0,
        totalRepaidSoFar: 0,
        projectedRemainingBalance: 0,
        nextPayment: 0,
        overdueAmount: 0,
      };
    }

    const orig = selectedLoan.principalAmount;
    const repaidP = selectedLoan.totalPrincipalRepaid;
    const paidI = selectedLoan.totalInterestPaid;
    const outP = selectedLoan.outstandingPrincipal;
    const totalRep = repaidP + paidI;
    const projectedRemaining = Math.max(0, outP - p);
    const nextPayment = projectedRemaining > 0 ? Math.min(projectedRemaining, selectedLoan.emiAmount) : 0;

    // Overdue amount check
    let overdue = 0;
    if (selectedLoan.status === 'Overdue') {
      overdue = selectedLoan.emiAmount;
    }

    return {
      originalPrincipal: orig,
      principalRepaidSoFar: repaidP,
      interestPaidSoFar: paidI,
      outstandingPrincipal: outP,
      totalRepaidSoFar: totalRep,
      projectedRemainingBalance: projectedRemaining,
      nextPayment,
      overdueAmount: overdue,
    };
  }, [selectedLoan, p]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!loanId) {
      errs.loanId = 'Select a loan facility.';
    }
    if (!repaymentNumber.trim()) {
      errs.repaymentNumber = 'Repayment number is required.';
    }
    if (!paymentDate) {
      errs.paymentDate = 'Payment date is required.';
    }
    if (p <= 0 && i <= 0) {
      errs.amounts = 'Enter a valid principal or interest payment amount.';
    }
    if (selectedLoan && p > selectedLoan.outstandingPrincipal) {
      errs.principalAmount = `Principal cannot exceed outstanding balance (${formatINR(selectedLoan.outstandingPrincipal)}).`;
    }
    if (!accountId) {
      errs.accountId = 'Select payment bank account.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const record = erpFinanceStorage.postLoanRepayment({
        loanId,
        repaymentNumber: repaymentNumber.trim(),
        dueDate,
        paymentDate,
        date: paymentDate,
        principalPaid: p,
        interestPaid: i,
        penaltyPaid: penalty,
        paymentMethod,
        accountId,
        referenceNumber: referenceNumber.trim() || `UTR-${Date.now()}`,
        remarks: remarks.trim(),
        notes: remarks.trim(),
      });

      onRepaymentRecorded(record);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error processing repayment';
      setErrors((prev) => ({ ...prev, form: msg }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Record Loan Repayment</h2>
              <p className="text-xs text-slate-300">
                Post EMI servicing, debt amortization & automatic journal voucher
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Section 1: Loan Selection & Facility Overview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Loan Facility <span className="text-rose-500">*</span>
                </label>
                <select
                  value={loanId}
                  onChange={(e) => setLoanId(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose Loan --</option>
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loanNumber} • {l.lenderName} (Bal: {formatINR(l.outstandingPrincipal)}) - {l.status}
                    </option>
                  ))}
                </select>
                {errors.loanId && <p className="text-[11px] text-rose-600 mt-1">{errors.loanId}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Repayment Voucher Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={repaymentNumber}
                  onChange={(e) => setRepaymentNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Automatically calculated statistics display */}
            {selectedLoan && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Original Principal</span>
                  <span className="text-xs font-bold text-slate-800">{formatINR(metrics.originalPrincipal)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Principal Repaid</span>
                  <span className="text-xs font-bold text-emerald-700">{formatINR(metrics.principalRepaidSoFar)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Interest Paid</span>
                  <span className="text-xs font-bold text-amber-700">{formatINR(metrics.interestPaidSoFar)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Outstanding Principal</span>
                  <span className="text-xs font-bold text-blue-800">{formatINR(metrics.outstandingPrincipal)}</span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Repaid</span>
                  <span className="text-xs font-bold text-slate-700">{formatINR(metrics.totalRepaidSoFar)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Projected Balance</span>
                  <span className="text-xs font-bold text-indigo-700">{formatINR(metrics.projectedRemainingBalance)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Next Payment Due</span>
                  <span className="text-xs font-bold text-slate-800">{formatINR(metrics.nextPayment)}</span>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Overdue Amount</span>
                  <span className="text-xs font-bold text-rose-700">{formatINR(metrics.overdueAmount)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Repayment Breakdown & Sums */}
          <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Repayment Breakdown & Dates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Principal, Interest, Penalty Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Principal Component <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Principal"
                  />
                </div>
                {errors.principalAmount && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.principalAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Interest Component <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={interestAmount}
                    onChange={(e) => setInterestAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Interest"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Penalty / Late Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={penaltyAmount}
                    onChange={(e) => setPenaltyAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Total Paid (Auto Sum)
                </label>
                <div className="px-3 py-2 bg-emerald-100/70 border border-emerald-300 rounded-lg flex items-center justify-between">
                  <span className="text-sm font-bold text-emerald-900">{formatINR(totalPaid)}</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200 px-1.5 py-0.5 rounded">
                    Total
                  </span>
                </div>
              </div>
            </div>
            {errors.amounts && <p className="text-xs text-rose-600 font-medium">{errors.amounts}</p>}
          </div>

          {/* Section 3: Payment Channel & Reference */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-slate-500" />
              Payment Channel & Reference
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMode)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="NEFT/RTGS">Direct Debit / ECS Mandate</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Bank / Cash Account <span className="text-rose-500">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Account --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} (Bal: {formatINR(b.currentBalance)})
                    </option>
                  ))}
                </select>
                {errors.accountId && <p className="text-[11px] text-rose-600 mt-1">{errors.accountId}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Transaction / UTR Reference
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. UTR-FDRL-902148"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Remarks / Notes
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Monthly installment clearance per schedule"
              />
            </div>
          </div>

          {/* Section 4: Automated Accounting Journal Preview */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-950">Automated Accounting Double-Entry:</p>
              <p className="mt-0.5 text-amber-900">
                Upon saving, the system creates a multi-line general ledger journal voucher:
                <br />
                <span className="font-mono text-[11px] font-semibold block mt-1">
                  • Dr. Loans Payable (2200): {formatINR(p)}
                  <br />
                  • Dr. Bank Charges & Loan Interest (6100): {formatINR(i + penalty)}
                  <br />
                  • Cr. Cash/Bank ({bankAccounts.find((b) => b.id === accountId)?.bankName || 'Bank A/c'}): {formatINR(totalPaid)}
                </span>
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={totalPaid <= 0}
            className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Post Repayment ({formatINR(totalPaid)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
