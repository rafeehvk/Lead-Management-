import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  Clock,
  Building2,
  Filter,
  CheckCircle2,
  PieChart as PieChartIcon,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  LoanRecord,
  LoanRepaymentRecord,
  LoanAmortizationScheduleItem,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface LoanReportsViewProps {
  loans: LoanRecord[];
  onSelectLoanForSchedule?: (loanId: string) => void;
}

type ReportType =
  | 'register'
  | 'outstanding'
  | 'repayments'
  | 'upcoming'
  | 'overdue';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const LoanReportsView: React.FC<LoanReportsViewProps> = ({
  loans,
  onSelectLoanForSchedule,
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('outstanding');
  const [dateRangeFilter, setDateRangeFilter] = useState<'30' | '90' | '180' | 'all'>('90');
  const [lenderFilter, setLenderFilter] = useState<string>('All');

  const allRepayments = useMemo(() => {
    return erpFinanceStorage.getLoanRepayments();
  }, [loans]);

  // Unique lenders for filter
  const lenders = useMemo(() => {
    const list = Array.from(new Set(loans.map((l) => l.lenderName)));
    return list;
  }, [loans]);

  // Compute aggregate statistics
  const reportStats = useMemo(() => {
    const totalSanctioned = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const totalRepaidPrincipal = loans.reduce((sum, l) => sum + l.totalPrincipalRepaid, 0);
    const totalInterestPaid = loans.reduce((sum, l) => sum + l.totalInterestPaid, 0);

    // Weighted average interest rate on active debt
    let weightedRateSum = 0;
    loans.forEach((l) => {
      weightedRateSum += l.interestRate * l.outstandingPrincipal;
    });
    const weightedAvgRate = totalOutstanding > 0 ? (weightedRateSum / totalOutstanding).toFixed(2) : '0.00';

    return {
      totalSanctioned,
      totalOutstanding,
      totalRepaidPrincipal,
      totalInterestPaid,
      totalDebtServiced: totalRepaidPrincipal + totalInterestPaid,
      weightedAvgRate,
      activeLoansCount: loans.filter((l) => l.status === 'Active').length,
    };
  }, [loans]);

  // Generate upcoming schedule installments across all active loans
  const upcomingRepayments = useMemo(() => {
    const now = new Date();
    const daysLimit = dateRangeFilter === '30' ? 30 : dateRangeFilter === '90' ? 90 : dateRangeFilter === '180' ? 180 : 3650;
    const maxDate = new Date();
    maxDate.setDate(now.getDate() + daysLimit);

    const items: Array<{
      loan: LoanRecord;
      installment: LoanAmortizationScheduleItem;
      daysRemaining: number;
    }> = [];

    loans.forEach((loan) => {
      if (loan.status === 'Closed' || loan.status === 'Completed' || loan.status === 'Draft') return;
      if (lenderFilter !== 'All' && loan.lenderName !== lenderFilter) return;

      const schedule = erpFinanceStorage.calculateLoanAmortizationSchedule(loan.id);
      schedule.forEach((inst) => {
        if (inst.status === 'Paid') return;
        const d = new Date(inst.dueDate);
        const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= daysLimit) {
          items.push({
            loan,
            installment: inst,
            daysRemaining: diffDays,
          });
        }
      });
    });

    return items.sort((a, b) => new Date(a.installment.dueDate).getTime() - new Date(b.installment.dueDate).getTime());
  }, [loans, dateRangeFilter, lenderFilter]);

  // Overdue repayments across all active loans
  const overdueRepayments = useMemo(() => {
    const now = new Date();
    const items: Array<{
      loan: LoanRecord;
      installment: LoanAmortizationScheduleItem;
      overdueDays: number;
    }> = [];

    loans.forEach((loan) => {
      if (loan.status === 'Draft' || loan.status === 'Completed' || loan.status === 'Closed') return;
      if (lenderFilter !== 'All' && loan.lenderName !== lenderFilter) return;

      const schedule = erpFinanceStorage.calculateLoanAmortizationSchedule(loan.id);
      schedule.forEach((inst) => {
        if (inst.status === 'Paid') return;
        const d = new Date(inst.dueDate);
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0 || inst.status === 'Overdue' || loan.status === 'Overdue') {
          items.push({
            loan,
            installment: inst,
            overdueDays: Math.max(1, diffDays),
          });
        }
      });
    });

    return items.sort((a, b) => b.overdueDays - a.overdueDays);
  }, [loans, lenderFilter]);

  // Export current report as CSV
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let reportTitle = '';

    if (selectedReport === 'register') {
      reportTitle = 'Loan_Register_Report';
      headers = [
        'Loan Number',
        'Lender',
        'Type',
        'Sanction Date',
        'Principal Sanctioned',
        'Interest Rate (%)',
        'Interest Type',
        'Tenure (Months)',
        'Monthly EMI',
        'Principal Repaid',
        'Outstanding Balance',
        'Collateral',
        'Status',
      ];
      rows = loans.map((l) => [
        l.loanNumber,
        `"${l.lenderName}"`,
        l.loanType,
        l.loanDate || l.startDate,
        l.principalAmount,
        l.interestRate,
        l.interestType || 'Reducing Balance',
        l.tenureMonths,
        l.emiAmount,
        l.totalPrincipalRepaid,
        l.outstandingPrincipal,
        `"${l.collateral || ''}"`,
        l.status,
      ]);
    } else if (selectedReport === 'outstanding') {
      reportTitle = 'Loan_Outstanding_Report';
      headers = [
        'Loan Number',
        'Lender',
        'Type',
        'Principal Sanctioned',
        'Principal Repaid',
        'Outstanding Principal',
        'Interest Paid',
        'Interest Rate (%)',
        'Tenure Remaining',
        'Maturity Date',
        'Status',
      ];
      rows = loans.map((l) => [
        l.loanNumber,
        `"${l.lenderName}"`,
        l.loanType,
        l.principalAmount,
        l.totalPrincipalRepaid,
        l.outstandingPrincipal,
        l.totalInterestPaid,
        l.interestRate,
        l.tenureMonths,
        l.endDate,
        l.status,
      ]);
    } else if (selectedReport === 'repayments') {
      reportTitle = 'Loan_Repayments_Report';
      headers = [
        'Voucher #',
        'Loan Number',
        'Lender',
        'Payment Date',
        'Principal Paid',
        'Interest Paid',
        'Penalty Paid',
        'Total Paid',
        'Payment Mode',
        'Reference UTR',
      ];
      rows = allRepayments.map((r) => {
        const loan = loans.find((l) => l.id === r.loanId);
        return [
          r.repaymentNumber,
          loan?.loanNumber || r.loanId,
          `"${loan?.lenderName || ''}"`,
          r.paymentDate || r.date,
          r.principalPaid,
          r.interestPaid,
          r.penaltyPaid,
          r.totalPaid,
          r.paymentMethod,
          r.referenceNumber,
        ];
      });
    } else if (selectedReport === 'upcoming') {
      reportTitle = 'Upcoming_Repayments_Report';
      headers = [
        'Due Date',
        'Days Remaining',
        'Loan Number',
        'Lender',
        'Inst #',
        'EMI Amount',
        'Principal Component',
        'Interest Component',
        'Projected Balance',
      ];
      rows = upcomingRepayments.map((item) => [
        item.installment.dueDate,
        item.daysRemaining,
        item.loan.loanNumber,
        `"${item.loan.lenderName}"`,
        item.installment.installmentNumber,
        item.installment.emi,
        item.installment.principalComponent,
        item.installment.interestComponent,
        item.installment.endingBalance,
      ]);
    } else if (selectedReport === 'overdue') {
      reportTitle = 'Overdue_Repayments_Report';
      headers = [
        'Loan Number',
        'Lender',
        'Inst #',
        'Due Date',
        'Days Overdue',
        'Overdue EMI',
        'Principal',
        'Interest',
      ];
      rows = overdueRepayments.map((item) => [
        item.loan.loanNumber,
        `"${item.loan.lenderName}"`,
        item.installment.installmentNumber,
        item.installment.dueDate,
        item.overdueDays,
        item.installment.emi,
        item.installment.principalComponent,
        item.installment.interestComponent,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(',')).join('\n')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportTitle}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* Report Selection Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Report Type Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedReport('outstanding')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedReport === 'outstanding'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Loan Outstanding</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedReport('register')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedReport === 'register'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Loan Register</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedReport('repayments')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedReport === 'repayments'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Repayment Report</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedReport('upcoming')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedReport === 'upcoming'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Upcoming Repayments ({upcomingRepayments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedReport('overdue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                selectedReport === 'overdue'
                  ? 'bg-rose-50 text-rose-800 shadow-xs border border-rose-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Overdue Repayments ({overdueRepayments.length})</span>
            </button>
          </div>

          {/* Action buttons & filters */}
          <div className="flex items-center gap-2">
            {/* Lender Filter */}
            <select
              value={lenderFilter}
              onChange={(e) => setLenderFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Lenders</option>
              {lenders.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>

            {/* Range filter for upcoming */}
            {selectedReport === 'upcoming' && (
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
              >
                <option value="30">Next 30 Days</option>
                <option value="90">Next 90 Days</option>
                <option value="180">Next 6 Months</option>
                <option value="all">Full Tenure</option>
              </select>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Global Debt Position KPI Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Borrowed</span>
            <span className="text-xs font-bold text-slate-900">{formatINR(reportStats.totalSanctioned)}</span>
          </div>
          <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
            <span className="text-[10px] text-blue-800 font-semibold uppercase block">Total Outstanding Debt</span>
            <span className="text-xs font-bold text-blue-900">{formatINR(reportStats.totalOutstanding)}</span>
          </div>
          <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-semibold uppercase block">Principal Amortized</span>
            <span className="text-xs font-bold text-emerald-700">{formatINR(reportStats.totalRepaidPrincipal)}</span>
          </div>
          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
            <span className="text-[10px] text-amber-800 font-semibold uppercase block">Interest Discharged</span>
            <span className="text-xs font-bold text-amber-700">{formatINR(reportStats.totalInterestPaid)}</span>
          </div>
          <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
            <span className="text-[10px] text-indigo-800 font-semibold uppercase block">Weighted Avg Rate</span>
            <span className="text-xs font-bold text-indigo-900">{reportStats.weightedAvgRate}% p.a.</span>
          </div>
        </div>
      </div>

      {/* Report 1: Loan Outstanding Report */}
      {selectedReport === 'outstanding' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Loan Outstanding & Exposure Report</h3>
              <p className="text-[11px] text-slate-500">
                Breakdown of active borrowing facilities, debt risk covenants & repayment completion rates
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600">
              Active Borrowings: {reportStats.activeLoansCount} Facilities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Loan # & Lender</th>
                  <th className="py-2.5 px-4">Facility Type</th>
                  <th className="py-2.5 px-4 text-right">Sanctioned</th>
                  <th className="py-2.5 px-4 text-right text-emerald-800">Principal Repaid</th>
                  <th className="py-2.5 px-4 text-right text-blue-900 font-bold">Outstanding Balance</th>
                  <th className="py-2.5 px-4 text-right text-amber-800">Interest Paid</th>
                  <th className="py-2.5 px-4 text-center">Rate (% p.a.)</th>
                  <th className="py-2.5 px-4 text-center">Maturity Date</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => {
                  const pct =
                    loan.principalAmount > 0
                      ? Math.round((loan.totalPrincipalRepaid / loan.principalAmount) * 100)
                      : 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium">
                        <div className="font-bold text-slate-900">{loan.loanNumber}</div>
                        <div className="text-[11px] text-slate-500">{loan.lenderName}</div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">{loan.loanType}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                        {formatINR(loan.principalAmount)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                        <div>{formatINR(loan.totalPrincipalRepaid)}</div>
                        <div className="text-[10px] text-slate-400">{pct}% cleared</div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-blue-900 text-sm">
                        {formatINR(loan.outstandingPrincipal)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-amber-700">
                        {formatINR(loan.totalInterestPaid)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-800">
                        {loan.interestRate}% ({loan.interestType || 'Reducing'})
                      </td>
                      <td className="py-2.5 px-4 text-center text-slate-700">{loan.endDate}</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          loan.status === 'Active' ? 'bg-emerald-100 text-emerald-800' :
                          loan.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 2: Loan Register Master */}
      {selectedReport === 'register' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Master Loan Register & Covenants Audit</h3>
            <span className="text-[11px] text-slate-500 font-medium">Statutory balance sheet liability registry</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Facility & Lender</th>
                  <th className="py-2.5 px-4">Agreement Date</th>
                  <th className="py-2.5 px-4 text-right">Principal</th>
                  <th className="py-2.5 px-4 text-center">Tenure & EMI</th>
                  <th className="py-2.5 px-4">Collateral / Security</th>
                  <th className="py-2.5 px-4">Documents / Reference</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-4 font-medium">
                      <div className="font-bold text-slate-900">{loan.loanNumber}</div>
                      <div className="text-[11px] text-slate-500">{loan.lenderName} ({loan.loanType})</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{loan.loanDate || loan.startDate}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(loan.principalAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-700">
                      <div>{formatINR(loan.emiAmount)} /mo</div>
                      <div className="text-[10px] text-slate-400">{loan.tenureMonths} Months</div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-[220px]">
                      {loan.collateral || 'Unsecured / Corporate Guarantee'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {loan.documents || 'Standard sanction terms'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 3: Repayment Report */}
      {selectedReport === 'repayments' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Consolidated Repayment & Debt Servicing Log</h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Total Recorded Payments: {allRepayments.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Voucher #</th>
                  <th className="py-2.5 px-4">Loan Facility</th>
                  <th className="py-2.5 px-4">Payment Date</th>
                  <th className="py-2.5 px-4 text-right text-emerald-800">Principal</th>
                  <th className="py-2.5 px-4 text-right text-amber-800">Interest</th>
                  <th className="py-2.5 px-4 text-right text-rose-800">Penalty</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-900">Total Serviced</th>
                  <th className="py-2.5 px-4">Method & UTR</th>
                  <th className="py-2.5 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allRepayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No loan repayments recorded yet
                    </td>
                  </tr>
                ) : (
                  allRepayments.map((r) => {
                    const loan = loans.find((l) => l.id === r.loanId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{r.repaymentNumber}</td>
                        <td className="py-2.5 px-4">
                          <div className="font-semibold text-slate-800">{loan?.loanNumber || r.loanId}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{loan?.lenderName}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">{r.paymentDate || r.date}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-emerald-700">{formatINR(r.principalPaid)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-amber-700">{formatINR(r.interestPaid)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-rose-700">{r.penaltyPaid > 0 ? formatINR(r.penaltyPaid) : '-'}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{formatINR(r.totalPaid)}</td>
                        <td className="py-2.5 px-4 text-slate-600">
                          <div>{r.paymentMethod}</div>
                          <div className="text-[10px] font-mono text-slate-400">{r.referenceNumber}</div>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px] truncate max-w-[150px]">
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

      {/* Report 4: Upcoming Repayments Forecast */}
      {selectedReport === 'upcoming' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Upcoming Repayments & Liquidity Outflow</h3>
              <p className="text-[11px] text-slate-500">
                Scheduled future debt servicing commitments across facilities
              </p>
            </div>
            <span className="text-[11px] font-bold text-blue-900">
              Total Outflow Due: {formatINR(upcomingRepayments.reduce((s, i) => s + i.installment.emi, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-center">Countdown</th>
                  <th className="py-2.5 px-4">Facility & Lender</th>
                  <th className="py-2.5 px-4 text-center">Inst #</th>
                  <th className="py-2.5 px-4 text-right font-bold text-slate-900">EMI Amount</th>
                  <th className="py-2.5 px-4 text-right text-emerald-800">Principal Part</th>
                  <th className="py-2.5 px-4 text-right text-amber-800">Interest Part</th>
                  <th className="py-2.5 px-4 text-right">Ending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingRepayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No upcoming installments due in selected date range.
                    </td>
                  </tr>
                ) : (
                  upcomingRepayments.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {item.installment.dueDate}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.daysRemaining <= 7
                            ? 'bg-rose-100 text-rose-800'
                            : item.daysRemaining <= 30
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          in {item.daysRemaining} days
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-800">{item.loan.loanNumber}</div>
                        <div className="text-[10px] text-slate-500">{item.loan.lenderName}</div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-700">
                        #{item.installment.installmentNumber}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(item.installment.emi)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                        {formatINR(item.installment.principalComponent)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-amber-700">
                        {formatINR(item.installment.interestComponent)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {formatINR(item.installment.endingBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Report 5: Overdue Repayments */}
      {selectedReport === 'overdue' && (
        <div className="bg-white border border-rose-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-rose-50/70 border-b border-rose-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <div>
                <h3 className="text-xs font-bold text-rose-950">Overdue Repayments & Delinquency Tracking</h3>
                <p className="text-[11px] text-rose-800">
                  Past-due installments requiring treasury intervention and penalty management
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-rose-700">
              Total Overdue: {formatINR(overdueRepayments.reduce((s, i) => s + i.installment.emi, 0))}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-rose-50/40 border-b border-rose-100 text-rose-900 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Facility & Lender</th>
                  <th className="py-2.5 px-4 text-center">Inst #</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4 text-center">Overdue Days</th>
                  <th className="py-2.5 px-4 text-right font-bold text-rose-950">Overdue EMI</th>
                  <th className="py-2.5 px-4 text-right text-emerald-800">Principal</th>
                  <th className="py-2.5 px-4 text-right text-amber-800">Interest</th>
                  <th className="py-2.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueRepayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                      <p className="font-semibold text-xs text-slate-700">No overdue installments</p>
                      <p className="text-[11px] text-slate-400">All debt facilities are serviced and in good standing.</p>
                    </td>
                  </tr>
                ) : (
                  overdueRepayments.map((item, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-bold text-slate-900">{item.loan.loanNumber}</div>
                        <div className="text-[11px] text-slate-500">{item.loan.lenderName}</div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-slate-700">
                        #{item.installment.installmentNumber}
                      </td>
                      <td className="py-2.5 px-4 text-rose-800 font-medium">
                        {item.installment.dueDate}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                          {item.overdueDays} days late
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-900">
                        {formatINR(item.installment.emi)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                        {formatINR(item.installment.principalComponent)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-amber-700">
                        {formatINR(item.installment.interestComponent)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {onSelectLoanForSchedule && (
                          <button
                            type="button"
                            onClick={() => onSelectLoanForSchedule(item.loan.id)}
                            className="px-2.5 py-1 text-[10px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors"
                          >
                            Service Debt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
