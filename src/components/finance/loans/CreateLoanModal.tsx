import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Calendar,
  DollarSign,
  Percent,
  Clock,
  ShieldCheck,
  FileText,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Landmark,
  ArrowRight,
} from 'lucide-react';
import {
  LoanRecord,
  LoanType,
  LoanStatus,
  LoanInterestType,
  LoanPaymentFrequency,
  BankAccountRecord,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface CreateLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoanCreated: (loan: LoanRecord) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const CreateLoanModal: React.FC<CreateLoanModalProps> = ({
  isOpen,
  onClose,
  onLoanCreated,
}) => {
  const bankAccounts: BankAccountRecord[] = erpFinanceStorage.getBankAccounts();

  // Form states
  const [loanNumber, setLoanNumber] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('Term Loan');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [principalAmount, setPrincipalAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [interestType, setInterestType] = useState<LoanInterestType>('Reducing Balance');
  const [tenureMonths, setTenureMonths] = useState<string>('36');
  const [customEmi, setCustomEmi] = useState<string>('');
  const [isCustomEmi, setIsCustomEmi] = useState<boolean>(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [paymentFrequency, setPaymentFrequency] = useState<LoanPaymentFrequency>('Monthly');
  const [bankAccountId, setBankAccountId] = useState('');
  const [collateral, setCollateral] = useState('');
  const [documents, setDocuments] = useState('');
  const [remarks, setRemarks] = useState('');
  const [initialStatus, setInitialStatus] = useState<LoanStatus>('Active');

  // Validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      const existingLoans = erpFinanceStorage.getLoans();
      const nextNum = `LN-2026-${String(existingLoans.length + 1).padStart(4, '0')}`;
      setLoanNumber(nextNum);
      setLenderName('');
      setLoanType('Term Loan');
      setLoanDate(new Date().toISOString().split('T')[0]);
      setPrincipalAmount('1000000');
      setInterestRate('9.5');
      setInterestType('Reducing Balance');
      setTenureMonths('36');
      setCustomEmi('');
      setIsCustomEmi(false);
      setStartDate(new Date().toISOString().split('T')[0]);
      setPaymentFrequency('Monthly');
      setCollateral('');
      setDocuments('');
      setRemarks('');
      setInitialStatus('Active');
      setErrors({});
      setTouched({});

      if (bankAccounts.length > 0) {
        setBankAccountId(bankAccounts[0].id);
      }
    }
  }, [isOpen]);

  // Auto-calculate End Date based on start date & tenure
  useEffect(() => {
    if (!startDate || !tenureMonths) return;
    const months = parseInt(tenureMonths, 10);
    if (isNaN(months) || months <= 0) return;

    try {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + months);
      setEndDate(d.toISOString().split('T')[0]);
    } catch {
      // ignore
    }
  }, [startDate, tenureMonths]);

  // Compute calculated EMI & Total Payable
  const p = parseFloat(principalAmount) || 0;
  const r = parseFloat(interestRate) || 0;
  const n = parseInt(tenureMonths, 10) || 0;

  const calculatedEmi = React.useMemo(() => {
    if (p <= 0 || n <= 0) return 0;
    if (interestType === 'Flat') {
      // Flat rate: Total interest = P * (r/100) * (n/12)
      const totalInterest = p * (r / 100) * (n / 12);
      return Math.round((p + totalInterest) / n);
    }
    // Reducing Balance standard formula
    const monthlyR = r / 12 / 100;
    if (monthlyR === 0) return Math.round(p / n);
    const emi = (p * monthlyR * Math.pow(1 + monthlyR, n)) / (Math.pow(1 + monthlyR, n) - 1);
    return Math.round(emi);
  }, [p, r, n, interestType]);

  const effectiveEmi = isCustomEmi && parseFloat(customEmi) > 0 ? parseFloat(customEmi) : calculatedEmi;
  const totalPayable = effectiveEmi * n;
  const totalInterest = Math.max(0, totalPayable - p);

  // Field validation function
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Principal Amount Validation
    const principalNum = parseFloat(principalAmount);
    if (!principalAmount || isNaN(principalNum)) {
      newErrors.principalAmount = 'Principal amount is required.';
    } else if (principalNum <= 0) {
      newErrors.principalAmount = 'Principal amount must be greater than 0.';
    } else if (principalNum > 1000000000) {
      newErrors.principalAmount = 'Principal amount exceeds maximum allowed limit (₹100 Cr).';
    }

    // 2. Interest Rate Validation
    const rateNum = parseFloat(interestRate);
    if (!interestRate || isNaN(rateNum)) {
      newErrors.interestRate = 'Interest rate is required.';
    } else if (rateNum < 0) {
      newErrors.interestRate = 'Interest rate cannot be negative.';
    } else if (rateNum > 100) {
      newErrors.interestRate = 'Interest rate must be 100% or less per annum.';
    }

    // 3. Tenure Validation
    const tenureNum = parseInt(tenureMonths, 10);
    if (!tenureMonths || isNaN(tenureNum)) {
      newErrors.tenureMonths = 'Tenure is required.';
    } else if (tenureNum <= 0) {
      newErrors.tenureMonths = 'Tenure must be at least 1 month.';
    } else if (tenureNum > 360) {
      newErrors.tenureMonths = 'Tenure cannot exceed 360 months (30 years).';
    }

    // 4. Lender Name Validation
    if (!lenderName.trim()) {
      newErrors.lenderName = 'Lender / Bank name is required.';
    }

    // 5. Loan Number Validation
    if (!loanNumber.trim()) {
      newErrors.loanNumber = 'Loan Number is required.';
    }

    // 6. Bank Account Validation
    if (!bankAccountId) {
      newErrors.bankAccountId = 'Select a bank account for disbursement/servicing.';
    }

    // 7. Dates Validation
    if (!startDate) {
      newErrors.startDate = 'Repayment start date is required.';
    }
    if (!endDate) {
      newErrors.endDate = 'Maturity/end date is required.';
    } else if (startDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({
      principalAmount: true,
      interestRate: true,
      tenureMonths: true,
      lenderName: true,
      loanNumber: true,
      bankAccountId: true,
      startDate: true,
      endDate: true,
    });

    if (!validate()) {
      return;
    }

    try {
      const created = erpFinanceStorage.createLoan({
        loanNumber: loanNumber.trim(),
        lenderName: lenderName.trim(),
        loanType,
        principalAmount: parseFloat(principalAmount),
        interestRate: parseFloat(interestRate),
        interestType,
        tenureMonths: parseInt(tenureMonths, 10),
        emiAmount: effectiveEmi,
        startDate,
        endDate,
        loanDate,
        paymentFrequency,
        bankAccountId,
        collateral: collateral.trim(),
        documents: documents.trim(),
        remarks: remarks.trim(),
        status: initialStatus,
        notes: remarks.trim(),
      });

      onLoanCreated(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create loan';
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
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Create New Loan Facility</h2>
              <p className="text-xs text-slate-300">
                Setup borrowing agreement, amortization parameters & disbursement journal
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.form && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          {/* Section 1: Facility Identifiers & Lender */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Lender & Facility Identification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Loan Number */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Loan Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={loanNumber}
                  onChange={(e) => setLoanNumber(e.target.value)}
                  onBlur={() => handleBlur('loanNumber')}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.loanNumber && touched.loanNumber
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                  placeholder="e.g. LN-2026-0001"
                />
                {errors.loanNumber && touched.loanNumber && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.loanNumber}</p>
                )}
              </div>

              {/* Lender Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Lender / Bank Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  onBlur={() => handleBlur('lenderName')}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.lenderName && touched.lenderName
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                  placeholder="e.g. State Bank of India (Commercial)"
                />
                {errors.lenderName && touched.lenderName && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.lenderName}</p>
                )}
              </div>

              {/* Loan Type */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Loan Facility Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={loanType}
                  onChange={(e) => setLoanType(e.target.value as LoanType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Term Loan">Term Loan (Secured)</option>
                  <option value="Working Capital">Working Capital Line / CC</option>
                  <option value="Equipment Financing">Equipment & Asset Financing</option>
                  <option value="Promoter Loan">Promoter / Subordinated Loan</option>
                  <option value="Vehicle Loan">Commercial Vehicle Loan</option>
                  <option value="Line of Credit">Revolving Line of Credit</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sanction / Loan Date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sanction / Agreement Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="date"
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Disbursing Bank Account */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Servicing / Disbursement Bank <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  onBlur={() => handleBlur('bankAccountId')}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.bankAccountId && touched.bankAccountId
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                >
                  <option value="">-- Select Bank Account --</option>
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} - {b.accountNumber} ({b.accountType}) - Bal: {formatINR(b.currentBalance)}
                    </option>
                  ))}
                </select>
                {errors.bankAccountId && touched.bankAccountId && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.bankAccountId}</p>
                )}
              </div>

              {/* Initial Status */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Status <span className="text-rose-500">*</span>
                </label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as LoanStatus)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Active">Active (Disbursed Immediately)</option>
                  <option value="Draft">Draft (Proposal stage)</option>
                  <option value="Pending Approval">Pending Approval (Board / CFO)</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Completed">Completed</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Terms & Validated Inputs */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Financial Terms & Repayment Formula
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Principal Amount with strict validation */}
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Principal Amount (INR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm font-semibold text-slate-500">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(e.target.value)}
                    onBlur={() => handleBlur('principalAmount')}
                    className={`w-full pl-8 pr-3 py-2 text-sm font-semibold bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.principalAmount && touched.principalAmount
                        ? 'border-rose-400 focus:ring-rose-200 text-rose-900'
                        : 'border-slate-300 focus:ring-emerald-500 text-slate-900'
                    }`}
                    placeholder="e.g. 2500000"
                  />
                </div>
                {errors.principalAmount && touched.principalAmount ? (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.principalAmount}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {p > 0 ? formatINR(p) : 'Enter sanctioned amount'}
                  </p>
                )}
              </div>

              {/* Interest Rate with strict validation */}
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Interest Rate (% p.a.) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    onBlur={() => handleBlur('interestRate')}
                    className={`w-full px-3 py-2 text-sm font-semibold bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.interestRate && touched.interestRate
                        ? 'border-rose-400 focus:ring-rose-200 text-rose-900'
                        : 'border-slate-300 focus:ring-emerald-500 text-slate-900'
                    }`}
                    placeholder="e.g. 9.25"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-slate-500">%</span>
                </div>
                {errors.interestRate && touched.interestRate ? (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.interestRate}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Annual percentage rate</p>
                )}
              </div>

              {/* Interest Type */}
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Interest Calculation Type
                </label>
                <select
                  value={interestType}
                  onChange={(e) => setInterestType(e.target.value as LoanInterestType)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Reducing Balance">Reducing Balance (Standard EMI)</option>
                  <option value="Fixed">Fixed Rate</option>
                  <option value="Floating">Floating / Repo-Linked</option>
                  <option value="Flat">Flat Rate</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {interestType === 'Reducing Balance' ? 'Interest computed on monthly balance' : 'Flat rate amortized'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tenure with strict validation */}
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Tenure (Months) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="number"
                    min="1"
                    max="360"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(e.target.value)}
                    onBlur={() => handleBlur('tenureMonths')}
                    className={`w-full pl-9 pr-3 py-2 text-sm font-semibold bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.tenureMonths && touched.tenureMonths
                        ? 'border-rose-400 focus:ring-rose-200 text-rose-900'
                        : 'border-slate-300 focus:ring-emerald-500 text-slate-900'
                    }`}
                    placeholder="e.g. 60"
                  />
                </div>
                {errors.tenureMonths && touched.tenureMonths ? (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.tenureMonths}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {n > 0 ? `${(n / 12).toFixed(1)} years (${n} installments)` : 'Enter duration in months'}
                  </p>
                )}
              </div>

              {/* Payment Frequency */}
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Payment Frequency
                </label>
                <select
                  value={paymentFrequency}
                  onChange={(e) => setPaymentFrequency(e.target.value as LoanPaymentFrequency)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Annually">Annually</option>
                  <option value="Bullet">Bullet (At Maturity)</option>
                </select>
              </div>

              {/* EMI / Repayment Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-slate-800">
                    EMI / Repayment Amount
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomEmi(!isCustomEmi);
                      if (!isCustomEmi) setCustomEmi(String(calculatedEmi));
                    }}
                    className="text-[10px] text-emerald-700 hover:underline font-semibold"
                  >
                    {isCustomEmi ? 'Auto-calculate' : 'Override EMI'}
                  </button>
                </div>

                {isCustomEmi ? (
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-semibold text-slate-500">₹</span>
                    <input
                      type="number"
                      value={customEmi}
                      onChange={(e) => setCustomEmi(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-sm font-semibold bg-white border border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                      placeholder="Custom EMI"
                    />
                  </div>
                ) : (
                  <div className="px-3 py-2 bg-white border border-emerald-300 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-bold text-emerald-900">
                      {formatINR(calculatedEmi)}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Auto
                    </span>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  Per installment repayment obligation
                </p>
              </div>
            </div>

            {/* Repayment Timeline: Start Date & End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Repayment Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  onBlur={() => handleBlur('startDate')}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.startDate && touched.startDate
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
                {errors.startDate && touched.startDate && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Maturity / End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  onBlur={() => handleBlur('endDate')}
                  className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.endDate && touched.endDate
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-emerald-500'
                  }`}
                />
                {errors.endDate && touched.endDate && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.endDate}</p>
                )}
              </div>
            </div>

            {/* Live Financial Projection Box */}
            <div className="mt-3 bg-white p-3.5 rounded-xl border border-emerald-200 grid grid-cols-3 gap-3 text-center">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Sanctioned Principal
                </span>
                <span className="text-sm font-bold text-slate-800">{formatINR(p)}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Est. Total Interest
                </span>
                <span className="text-sm font-bold text-amber-700">{formatINR(totalInterest)}</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Total Debt Servicing
                </span>
                <span className="text-sm font-bold text-emerald-800">{formatINR(totalPayable)}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Collateral, Documents & Remarks */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              Collateral, Documentation & Security Covenants
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Collateral */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Collateral / Security Details
                </label>
                <input
                  type="text"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. Hypothecation of servers & datastore hardware"
                />
              </div>

              {/* Documents */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Associated Documents / References
                </label>
                <input
                  type="text"
                  value={documents}
                  onChange={(e) => setDocuments(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. SanctionLetter-2026.pdf, HypothecationDeed.pdf"
                />
              </div>
            </div>

            {/* Remarks / Purpose */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Remarks / Purpose of Facility
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Specify utilization plan, board approval reference, or covenants..."
              />
            </div>
          </div>

          {/* Section 4: Accounting Journal Notice */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-start gap-3 text-xs text-blue-900">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-blue-950">Automated Journal on Disbursement:</p>
              <p className="mt-0.5 text-blue-800">
                When marked as <span className="font-semibold text-emerald-700">Active</span>, the system immediately credits the selected bank account and posts:
                <br />
                <span className="font-mono text-[11px] font-semibold">
                  Dr. Cash/Bank ({bankAccounts.find((b) => b.id === bankAccountId)?.bankName || 'Bank A/c'}) ₹{p.toLocaleString()} → Cr. Loans Payable (2200) ₹{p.toLocaleString()}
                </span>
              </p>
            </div>
          </div>
        </form>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Loan Facility</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
