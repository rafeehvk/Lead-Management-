import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CreditCard,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  DollarSign,
  ArrowRight,
  TrendingUp,
  Landmark,
  Layers,
  ChevronDown,
} from 'lucide-react';
import {
  LoanRecord,
  LoanRepaymentRecord,
  LoanAmortizationScheduleItem,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface LoanRepaymentScheduleViewProps {
  loans: LoanRecord[];
  selectedLoanId: string;
  onSelectLoan: (loanId: string) => void;
  onOpenRepaymentModal: (loanId: string, prefill?: { principal: number; interest: number; dueDate: string }) => void;
  onRefresh: () => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const LoanRepaymentScheduleView: React.FC<LoanRepaymentScheduleViewProps> = ({
  loans,
  selectedLoanId,
  onSelectLoan,
  onOpenRepaymentModal,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'history'>('schedule');

  // Filter loans that are relevant for schedules
  const activeLoans = useMemo(() => {
    return loans.filter((l) => l.status !== 'Draft');
  }, [loans]);

  // Current selected loan
  const currentLoan = useMemo(() => {
    return loans.find((l) => l.id === selectedLoanId) || activeLoans[0] || loans[0];
  }, [loans, selectedLoanId, activeLoans]);

  // Historical repayments for this loan
  const repayments = useMemo(() => {
    if (!currentLoan) return [];
    return erpFinanceStorage.getLoanRepayments(currentLoan.id);
  }, [currentLoan, loans]);

  // Generate complete amortization schedule
  const amortizationSchedule = useMemo(() => {
    if (!currentLoan) return [];
    return erpFinanceStorage.calculateLoanAmortizationSchedule(currentLoan.id);
  }, [currentLoan, repayments]);

  // Automatic calculations
  const stats = useMemo(() => {
    if (!currentLoan) {
      return {
        originalPrincipal: 0,
        principalRepaid: 0,
        interestPaid: 0,
        outstandingPrincipal: 0,
        totalRepaid: 0,
        remainingBalance: 0,
        nextPaymentDate: '-',
        nextPaymentAmount: 0,
        overdueAmount: 0,
        progressPercent: 0,
      };
    }

    const orig = currentLoan.principalAmount;
    const repP = currentLoan.totalPrincipalRepaid;
    const paidI = currentLoan.totalInterestPaid;
    const outP = currentLoan.outstandingPrincipal;
    const totalRep = repP + paidI;
    const remaining = outP;

    // Next payment finder
    const nextInstallment = amortizationSchedule.find((item) => item.status === 'Pending' || item.status === 'Overdue');
    const nextDate = nextInstallment?.dueDate || currentLoan.endDate;
    const nextAmt = nextInstallment?.emi || currentLoan.emiAmount;

    // Overdue check
    let overdue = 0;
    if (currentLoan.status === 'Overdue') {
      overdue = currentLoan.emiAmount;
    }
    const overdueItems = amortizationSchedule.filter((item) => item.status === 'Overdue');
    if (overdueItems.length > 0) {
      overdue = overdueItems.reduce((sum, item) => sum + item.emi, 0);
    }

    const pct = orig > 0 ? Math.min(100, Math.round((repP / orig) * 100)) : 0;

    return {
      originalPrincipal: orig,
      principalRepaid: repP,
      interestPaid: paidI,
      outstandingPrincipal: outP,
      totalRepaid: totalRep,
      remainingBalance: remaining,
      nextPaymentDate: nextDate,
      nextPaymentAmount: nextAmt,
      overdueAmount: overdue,
      progressPercent: pct,
    };
  }, [currentLoan, amortizationSchedule]);

  // Export amortization schedule CSV
  const handleExportScheduleCsv = () => {
    if (!currentLoan) return;

    const headers = [
      'Installment #',
      'Due Date',
      'Beginning Balance',
      'EMI Amount',
      'Principal Component',
      'Interest Component',
      'Ending Balance',
      'Status',
    ];

    const rows = amortizationSchedule.map((s) => [
      s.installmentNumber,
      s.dueDate,
      s.beginningBalance,
      s.emi,
      s.principalComponent,
      s.interestComponent,
      s.endingBalance,
      s.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `Facility: ${currentLoan.loanNumber} - ${currentLoan.lenderName}`,
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Amortization_Schedule_${currentLoan.loanNumber}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!currentLoan) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
        <Landmark className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="font-semibold text-sm">No loan facilities available</p>
        <p className="text-xs text-slate-400 mt-1">
          Create a loan in the Loan Register tab to view repayment schedules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top Selector & Facility Context Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Facility Selector */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Active Loan Facility
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={currentLoan.id}
                  onChange={(e) => onSelectLoan(e.target.value)}
                  className="text-sm font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {loans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.loanNumber} • {l.lenderName} ({l.loanType})
                    </option>
                  ))}
                </select>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {currentLoan.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportScheduleCsv}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenRepaymentModal(currentLoan.id)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Record Repayment</span>
            </button>
          </div>
        </div>

        {/* 8 Metric Calculation Cards requested by User:
            Original Principal, Principal Repaid, Interest Paid, Outstanding Principal,
            Total Repaid, Remaining Balance, Next Payment, Overdue Amount */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mt-4 pt-4 border-t border-slate-100 text-xs">
          {/* 1. Original Principal */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Original Principal
            </span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
              {formatINR(stats.originalPrincipal)}
            </span>
          </div>

          {/* 2. Principal Repaid */}
          <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Principal Repaid
            </span>
            <span className="text-xs font-bold text-emerald-700 mt-0.5 block truncate">
              {formatINR(stats.principalRepaid)}
            </span>
          </div>

          {/* 3. Interest Paid */}
          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
            <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block">
              Interest Paid
            </span>
            <span className="text-xs font-bold text-amber-700 mt-0.5 block truncate">
              {formatINR(stats.interestPaid)}
            </span>
          </div>

          {/* 4. Outstanding Principal */}
          <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
            <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider block">
              Outstanding Principal
            </span>
            <span className="text-xs font-bold text-blue-900 mt-0.5 block truncate">
              {formatINR(stats.outstandingPrincipal)}
            </span>
          </div>

          {/* 5. Total Repaid */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
              Total Repaid
            </span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
              {formatINR(stats.totalRepaid)}
            </span>
          </div>

          {/* 6. Remaining Balance */}
          <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
            <span className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wider block">
              Remaining Balance
            </span>
            <span className="text-xs font-bold text-indigo-900 mt-0.5 block truncate">
              {formatINR(stats.remainingBalance)}
            </span>
          </div>

          {/* 7. Next Payment */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">
              Next Payment
            </span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
              {formatINR(stats.nextPaymentAmount)}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">{stats.nextPaymentDate}</span>
          </div>

          {/* 8. Overdue Amount */}
          <div className={`p-2.5 rounded-lg border ${stats.overdueAmount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider block ${stats.overdueAmount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
              Overdue Amount
            </span>
            <span className={`text-xs font-bold mt-0.5 block truncate ${stats.overdueAmount > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {formatINR(stats.overdueAmount)}
            </span>
          </div>
        </div>

        {/* Progress Bar & Facility Highlights */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className="text-[11px] text-slate-500 font-medium">Principal Amortized:</span>
            <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${stats.progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-800">{stats.progressPercent}%</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Interest Rate: <strong className="text-slate-800">{currentLoan.interestRate}% ({currentLoan.interestType || 'Reducing'})</strong></span>
            <span>Tenure: <strong className="text-slate-800">{currentLoan.tenureMonths} Months</strong></span>
            <span>Monthly EMI: <strong className="text-emerald-700">{formatINR(currentLoan.emiAmount)}</strong></span>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Amortization Schedule vs Historical Repayments Log */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('schedule')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'schedule'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Full Amortization Schedule ({amortizationSchedule.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Recorded Repayments History ({repayments.length})</span>
        </button>
      </div>

      {/* Tab 1: Amortization Schedule Table */}
      {activeSubTab === 'schedule' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">Installment Breakdown & Projected Balances</span>
              <span className="text-[10px] text-slate-500 font-medium">
                (Standard Reducing Balance monthly amortization)
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Facility Tenure: {currentLoan.startDate} to {currentLoan.endDate}
            </span>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px] sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-4 text-center">Inst #</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right">Beginning Balance</th>
                  <th className="py-2.5 px-4 text-right">EMI Amount</th>
                  <th className="py-2.5 px-4 text-right text-emerald-800">Principal</th>
                  <th className="py-2.5 px-4 text-right text-amber-800">Interest</th>
                  <th className="py-2.5 px-4 text-right">Ending Balance</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {amortizationSchedule.map((item) => {
                  const isPaid = item.status === 'Paid';
                  const isOverdue = item.status === 'Overdue';

                  return (
                    <tr
                      key={item.installmentNumber}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isPaid ? 'bg-emerald-50/20 text-slate-600' : isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-center font-bold text-slate-700">
                        #{item.installmentNumber}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800">{item.dueDate}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {formatINR(item.beginningBalance)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatINR(item.emi)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-emerald-700 font-mono">
                        {formatINR(item.principalComponent)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold text-amber-700 font-mono">
                        {formatINR(item.interestComponent)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                        {formatINR(item.endingBalance)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Paid
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3 text-slate-400" />
                            Scheduled
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() =>
                              onOpenRepaymentModal(currentLoan.id, {
                                principal: item.principalComponent,
                                interest: item.interestComponent,
                                dueDate: item.dueDate,
                              })
                            }
                            className="px-2 py-0.5 text-[10px] font-semibold text-blue-700 hover:text-white hover:bg-blue-600 border border-blue-200 rounded transition-colors"
                          >
                            Pay Installment
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
      )}

      {/* Tab 2: Historical Repayments Log */}
      {activeSubTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">Settled Debt Repayments & Vouchers</span>
            <span className="text-[11px] text-slate-500 font-medium">
              Total Servicing: {formatINR(stats.totalRepaid)} across {repayments.length} installments
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Repayment Voucher</th>
                  <th className="py-2.5 px-4">Payment Date</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-right text-emerald-800">Principal Paid</th>
                  <th className="py-2.5 px-4 text-right text-amber-800">Interest Paid</th>
                  <th className="py-2.5 px-4 text-right text-rose-800">Penalty</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-900">Total Paid</th>
                  <th className="py-2.5 px-4">Method & Account</th>
                  <th className="py-2.5 px-4">Reference / UTR</th>
                  <th className="py-2.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repayments.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      No repayments recorded for this facility yet. Click "Record Repayment" to post an EMI.
                    </td>
                  </tr>
                ) : (
                  repayments.map((r) => {
                    const bank = erpFinanceStorage.getBankAccounts().find((b) => b.id === r.accountId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {r.repaymentNumber}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 font-medium">{r.paymentDate || r.date}</td>
                        <td className="py-2.5 px-4 text-slate-500">{r.dueDate || '-'}</td>
                        <td className="py-2.5 px-4 text-right font-semibold text-emerald-700 font-mono">
                          {formatINR(r.principalPaid)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-amber-700 font-mono">
                          {formatINR(r.interestPaid)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-rose-700 font-mono">
                          {r.penaltyPaid > 0 ? formatINR(r.penaltyPaid) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono">
                          {formatINR(r.totalPaid)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">
                          <div>{r.paymentMethod}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {bank?.bankName || 'Bank A/c'}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                          {r.referenceNumber || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px] max-w-[150px] truncate">
                          {r.remarks || r.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
