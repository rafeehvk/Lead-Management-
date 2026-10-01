import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  CreditCard,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  MoreVertical,
  ShieldAlert,
  Send,
  Trash2,
} from 'lucide-react';
import { LoanRecord, LoanStatus, LoanType } from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface LoanRegisterTableProps {
  loans: LoanRecord[];
  onOpenCreateModal: () => void;
  onOpenRepaymentModal: (loanId?: string) => void;
  onSelectLoanForSchedule: (loanId: string) => void;
  onRefresh: () => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const LoanRegisterTable: React.FC<LoanRegisterTableProps> = ({
  loans,
  onOpenCreateModal,
  onOpenRepaymentModal,
  onSelectLoanForSchedule,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<LoanRecord | null>(null);

  // Filtered loans
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.loanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.lenderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (loan.remarks && loan.remarks.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (loan.collateral && loan.collateral.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || loan.status === statusFilter;
    const matchesType = typeFilter === 'All' || loan.loanType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Active
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Draft
          </span>
        );
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <Clock className="w-3 h-3 text-purple-600" />
            Pending
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
            <CheckCircle className="w-3 h-3 text-blue-600" />
            Completed
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Overdue
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Closed
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  const handleDisburse = (loanId: string) => {
    if (confirm('Are you sure you want to disburse this loan facility? This will post the disbursement journal voucher and credit your bank balance.')) {
      try {
        erpFinanceStorage.disburseLoan(loanId);
        onRefresh();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Disbursement failed');
      }
    }
  };

  const handleDeleteLoan = (loanId: string) => {
    if (confirm('Delete this loan record?')) {
      try {
        erpFinanceStorage.deleteLoan(loanId);
        onRefresh();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : 'Failed to delete loan');
      }
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Loan Number',
      'Lender Name',
      'Loan Type',
      'Sanction Date',
      'Principal Sanctioned',
      'Interest Rate (%)',
      'Interest Type',
      'Tenure (Months)',
      'EMI Amount',
      'Repaid Principal',
      'Paid Interest',
      'Outstanding Balance',
      'Status',
      'Collateral',
      'Maturity Date',
    ];

    const rows = filteredLoans.map((l) => [
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
      l.totalInterestPaid,
      l.outstandingPrincipal,
      l.status,
      `"${l.collateral || ''}"`,
      l.endDate,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Loan_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by loan #, lender, collateral..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="All">All Statuses ({loans.length})</option>
              <option value="Active">Active ({loans.filter((l) => l.status === 'Active').length})</option>
              <option value="Draft">Draft ({loans.filter((l) => l.status === 'Draft').length})</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Overdue">Overdue ({loans.filter((l) => l.status === 'Overdue').length})</option>
              <option value="Completed">Completed ({loans.filter((l) => l.status === 'Completed').length})</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="All">All Facilities</option>
              <option value="Term Loan">Term Loan</option>
              <option value="Working Capital">Working Capital</option>
              <option value="Equipment Financing">Equipment Financing</option>
              <option value="Promoter Loan">Promoter Loan</option>
              <option value="Vehicle Loan">Vehicle Loan</option>
            </select>
          </div>
        </div>

        {/* Export and Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Register</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Loan</span>
          </button>
        </div>
      </div>

      {/* Main Loan Register Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Loan # & Sanction Date</th>
                <th className="py-3 px-4">Lender & Facility</th>
                <th className="py-3 px-4 text-right">Principal Sanctioned</th>
                <th className="py-3 px-4 text-center">Interest & Type</th>
                <th className="py-3 px-4 text-center">Tenure & EMI</th>
                <th className="py-3 px-4 text-right">Principal Repaid</th>
                <th className="py-3 px-4 text-right">Outstanding Principal</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    <p className="text-sm font-semibold">No loan facilities found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Adjust your search or click "Create Loan" to record a new debt facility
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const percentRepaid =
                    loan.principalAmount > 0
                      ? Math.min(100, Math.round((loan.totalPrincipalRepaid / loan.principalAmount) * 100))
                      : 0;

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Loan # & Date */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {loan.loanNumber}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{loan.loanDate || loan.startDate}</span>
                        </div>
                      </td>

                      {/* Lender & Facility Type */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <div className="font-semibold text-slate-800 truncate" title={loan.lenderName}>
                          {loan.lenderName}
                        </div>
                        <div className="text-[11px] text-slate-500">{loan.loanType}</div>
                      </td>

                      {/* Principal Sanctioned */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-slate-900">{formatINR(loan.principalAmount)}</span>
                        {loan.collateral && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px] ml-auto mt-0.5" title={loan.collateral}>
                            Security: {loan.collateral}
                          </div>
                        )}
                      </td>

                      {/* Interest & Type */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-800">{loan.interestRate}%</span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {loan.interestType || 'Reducing Balance'}
                        </div>
                      </td>

                      {/* Tenure & EMI */}
                      <td className="py-3 px-4 text-center">
                        <span className="font-semibold text-emerald-800">
                          {formatINR(loan.emiAmount)}
                          <span className="text-[10px] text-slate-400 font-normal"> /mo</span>
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {loan.tenureMonths} mos ({loan.paymentFrequency || 'Monthly'})
                        </div>
                      </td>

                      {/* Principal Repaid with Progress bar */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-emerald-700">
                          {formatINR(loan.totalPrincipalRepaid)}
                        </div>
                        <div className="w-20 ml-auto bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${percentRepaid}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{percentRepaid}% cleared</div>
                      </td>

                      {/* Outstanding Principal */}
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold text-sm ${loan.outstandingPrincipal > 0 ? 'text-blue-900' : 'text-slate-400'}`}>
                          {formatINR(loan.outstandingPrincipal)}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Int: {formatINR(loan.totalInterestPaid)}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(loan.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Schedule link */}
                          <button
                            type="button"
                            onClick={() => onSelectLoanForSchedule(loan.id)}
                            title="View Amortization Schedule & Repayments"
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>

                          {/* Record Repayment button */}
                          {loan.status === 'Active' || loan.status === 'Overdue' ? (
                            <button
                              type="button"
                              onClick={() => onOpenRepaymentModal(loan.id)}
                              title="Record Repayment"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Repay</span>
                            </button>
                          ) : null}

                          {/* Disburse button if Draft / Pending */}
                          {(loan.status === 'Draft' || loan.status === 'Pending Approval') && (
                            <button
                              type="button"
                              onClick={() => handleDisburse(loan.id)}
                              title="Disburse Facility to Bank"
                              className="px-2 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center gap-1"
                            >
                              <Send className="w-3 h-3" />
                              <span>Disburse</span>
                            </button>
                          )}

                          {/* Details / Documents view */}
                          <button
                            type="button"
                            onClick={() => setSelectedLoanForDetails(loan)}
                            title="View Facility Details & Covenants"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete if draft or no repayment */}
                          {loan.totalPrincipalRepaid === 0 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLoan(loan.id)}
                              title="Delete Loan"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Details & Covenants Modal */}
      {selectedLoanForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">{selectedLoanForDetails.loanNumber} - Facility Details</h3>
                <p className="text-xs text-slate-300">{selectedLoanForDetails.lenderName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLoanForDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 font-semibold block">Facility Type</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedLoanForDetails.loanType}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 font-semibold block">Current Status</span>
                  <div className="mt-1">{getStatusBadge(selectedLoanForDetails.status)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 font-semibold block">Sanction Date</span>
                  <span className="font-bold text-slate-900">{selectedLoanForDetails.loanDate || selectedLoanForDetails.startDate}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <span className="text-slate-500 font-semibold block">Maturity Date</span>
                  <span className="font-bold text-slate-900">{selectedLoanForDetails.endDate}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="text-slate-500 font-semibold block mb-1">Collateral & Hypothecation</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-700">
                  {selectedLoanForDetails.collateral || 'No specific asset hypothecation recorded (Unsecured / General Corporate Guarantee)'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Documents on File</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-700">
                  {selectedLoanForDetails.documents || 'Sanction letter archived in financial records vault'}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold block mb-1">Remarks / Board Resolution</span>
                <p className="bg-slate-50 p-2.5 rounded-lg text-slate-700">
                  {selectedLoanForDetails.remarks || selectedLoanForDetails.notes || 'No extra remarks recorded.'}
                </p>
              </div>

              {selectedLoanForDetails.disbursedDate && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px]">
                  <strong>Disbursement Journal Reference:</strong> Disbursed on {selectedLoanForDetails.disbursedDate}.
                  Account Dr: Cash/Bank → Cr: Loans Payable (2200).
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = selectedLoanForDetails.id;
                  setSelectedLoanForDetails(null);
                  onSelectLoanForSchedule(id);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Open Repayment Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
