import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Plus,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  TrendingDown,
  Clock,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { LoanRecord, LoanRepaymentRecord } from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { LoanRegisterTable } from './LoanRegisterTable';
import { LoanRepaymentScheduleView } from './LoanRepaymentScheduleView';
import { LoanReportsView } from './LoanReportsView';
import { CreateLoanModal } from './CreateLoanModal';
import { RecordLoanRepaymentModal } from './RecordLoanRepaymentModal';

export type LoanTab = 'register' | 'schedule' | 'reports';

interface LoanManagementViewProps {
  initialTab?: LoanTab;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const LoanManagementView: React.FC<LoanManagementViewProps> = ({
  initialTab = 'register',
}) => {
  const [currentTab, setCurrentTab] = useState<LoanTab>(initialTab);
  const [loans, setLoans] = useState<LoanRecord[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [prefilledRepayData, setPrefilledRepayData] = useState<{
    principal?: number;
    interest?: number;
    dueDate?: string;
  } | undefined>(undefined);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = () => {
    const list = erpFinanceStorage.getLoans();
    setLoans([...list]);
    if (!selectedLoanId && list.length > 0) {
      setSelectedLoanId(list[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalSanctioned = loans.reduce((sum, l) => sum + l.principalAmount, 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const totalPrincipalRepaid = loans.reduce((sum, l) => sum + l.totalPrincipalRepaid, 0);
    const totalInterestPaid = loans.reduce((sum, l) => sum + l.totalInterestPaid, 0);
    const activeFacilities = loans.filter((l) => l.status === 'Active').length;
    const overdueFacilities = loans.filter((l) => l.status === 'Overdue').length;

    return {
      totalSanctioned,
      totalOutstanding,
      totalPrincipalRepaid,
      totalInterestPaid,
      totalServiced: totalPrincipalRepaid + totalInterestPaid,
      activeFacilities,
      overdueFacilities,
    };
  }, [loans]);

  const handleSelectLoanForSchedule = (loanId: string) => {
    setSelectedLoanId(loanId);
    setCurrentTab('schedule');
  };

  const handleOpenRepaymentModal = (
    loanId?: string,
    prefill?: { principal: number; interest: number; dueDate: string }
  ) => {
    if (loanId) {
      setSelectedLoanId(loanId);
    }
    setPrefilledRepayData(prefill);
    setIsRepayModalOpen(true);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-xl shadow-xs">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Loans & Debt Management</h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Treasury & Borrowings
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Facility registries, reducing-balance amortization schedules, automated disbursement journals & repayment vouchers
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              title="Refresh Data"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleOpenRepaymentModal()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-slate-600" />
              <span>Record Repayment</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Loan</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Sanctioned Limit
            </span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block">
              {formatINR(stats.totalSanctioned)}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Across all registered facilities</span>
          </div>

          <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              Outstanding Principal
            </span>
            <span className="text-base font-bold text-blue-900 mt-0.5 block">
              {formatINR(stats.totalOutstanding)}
            </span>
            <span className="text-[10px] text-blue-600 mt-0.5 block">GL 2200 Loans Payable balance</span>
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Principal Repaid
            </span>
            <span className="text-base font-bold text-emerald-700 mt-0.5 block">
              {formatINR(stats.totalPrincipalRepaid)}
            </span>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Amortized from initial principal</span>
          </div>

          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Interest Discharged
            </span>
            <span className="text-base font-bold text-amber-700 mt-0.5 block">
              {formatINR(stats.totalInterestPaid)}
            </span>
            <span className="text-[10px] text-amber-600 mt-0.5 block">Posted to GL 6100 Finance Expense</span>
          </div>

          <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              Active Debt Facilities
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-bold text-purple-900">{stats.activeFacilities} Active</span>
              {stats.overdueFacilities > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                  {stats.overdueFacilities} Overdue
                </span>
              )}
            </div>
            <span className="text-[10px] text-purple-600 mt-0.5 block">Institutional & promoter lines</span>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs (Loan Register, Repayment Schedule, Reports) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setCurrentTab('register')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            currentTab === 'register'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Loan Register</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${currentTab === 'register' ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
            {loans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('schedule')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            currentTab === 'schedule'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Repayment Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentTab('reports')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 ${
            currentTab === 'reports'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Reports</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
            5 Views
          </span>
        </button>
      </div>

      {/* Active Tab View */}
      {currentTab === 'register' && (
        <LoanRegisterTable
          loans={loans}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onOpenRepaymentModal={(id) => handleOpenRepaymentModal(id)}
          onSelectLoanForSchedule={handleSelectLoanForSchedule}
          onRefresh={loadData}
        />
      )}

      {currentTab === 'schedule' && (
        <LoanRepaymentScheduleView
          loans={loans}
          selectedLoanId={selectedLoanId}
          onSelectLoan={(id) => setSelectedLoanId(id)}
          onOpenRepaymentModal={handleOpenRepaymentModal}
          onRefresh={loadData}
        />
      )}

      {currentTab === 'reports' && (
        <LoanReportsView
          loans={loans}
          onSelectLoanForSchedule={handleSelectLoanForSchedule}
        />
      )}

      {/* Create Loan Modal */}
      <CreateLoanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLoanCreated={(newLoan) => {
          loadData();
          showToast(`Loan facility ${newLoan.loanNumber} created successfully`);
        }}
      />

      {/* Record Repayment Modal */}
      <RecordLoanRepaymentModal
        isOpen={isRepayModalOpen}
        onClose={() => setIsRepayModalOpen(false)}
        selectedLoanId={selectedLoanId}
        onRepaymentRecorded={(rep) => {
          loadData();
          showToast(`Repayment voucher ${rep.repaymentNumber} posted successfully`);
        }}
      />
    </div>
  );
};
