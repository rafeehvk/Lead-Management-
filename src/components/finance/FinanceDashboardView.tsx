import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Plus,
  SlidersHorizontal,
  Download,
  Filter,
  RefreshCw,
  Search,
  DollarSign,
  PieChart as PieIcon,
  Receipt,
  ArrowUpRight,
  Sparkles,
  Info,
  X,
  FileSpreadsheet,
  PackageCheck,
  ShieldCheck,
  CreditCard,
  Users,
  ShoppingBag,
  Landmark,
  Layers,
  BarChart3,
} from 'lucide-react';
import { financeStorage } from '../../services/financeStorageService';
import { FinanceBudgetPlanner } from './FinanceBudgetPlanner';
import { VendorManagementView } from './VendorManagementView';
import { BudgetProjectionView } from './BudgetProjectionView';
import { SalesCustomerLedgerView } from './SalesCustomerLedgerView';
import { FinancePartyMasterView } from './FinancePartyMasterView';
import { FinanceItemMasterView } from './FinanceItemMasterView';
import { FinanceControlsAndAuditView } from './FinanceControlsAndAuditView';
import { AccountingGeneralLedgerView } from './AccountingGeneralLedgerView';
import { CashAndBankManagementView } from './CashAndBankManagementView';
import { PaymentManagementView } from './payments/PaymentManagementView';
import { ReceiptManagementView } from './payments/ReceiptManagementView';
import { AdvanceAdjustmentManagementView } from './payments/AdvanceAdjustmentManagementView';
import { FinanceExecutiveDashboard } from './dashboard/FinanceExecutiveDashboard';
import { FinanceReportCenterView } from './dashboard/FinanceReportCenterView';
import { ReceivablesPayablesManagementView } from './dashboard/ReceivablesPayablesManagementView';
import { PartyLedgerView } from './PartyLedgerView';
import { PurchaseWorkflowView } from './purchase/PurchaseWorkflowView';
import { SalesWorkflowView } from './sales/SalesWorkflowView';
import { LoanManagementView } from './loans/LoanManagementView';
import { TaxManagementView } from './tax/TaxManagementView';
import { BudgetManagementView } from './budget/BudgetManagementView';
import {
  MonthlyBudgetExpenditure,
  ExpenseCategory,
  ExpenseTransaction,
  FinanceDashboardMetrics,
  MonthShort,
  BudgetHealthStatus,
  PaymentMode,
} from '../../types/finance';

// Helper to format Indian Rupee currency
const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

// Compact format for charts (e.g. ₹12.5 L or ₹1.5 Cr)
const formatCompactINR = (val: number): string => {
  if (Math.abs(val) >= 10000000) {
    return `₹${(val / 10000000).toFixed(1)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(1)} L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${(val / 1000).toFixed(0)} k`;
  }
  return `₹${val}`;
};

export type FinanceSubTab =
  | 'analytics'
  | 'reports-center'
  | 'ar-ap-management'
  | 'purchase-workflow'
  | 'sales-workflow'
  | 'party-ledger'
  | 'budget-chart'
  | 'planner'
  | 'ledger'
  | 'parties'
  | 'vendors'
  | 'projections'
  | 'sales-ar'
  | 'gl'
  | 'cash-bank'
  | 'loans'
  | 'payments'
  | 'receipts'
  | 'advances'
  | 'item-master'
  | 'controls-audit'
  | 'tax-compliance'
  | 'budget-management';

interface FinanceDashboardViewProps {
  currentUserName?: string;
  userRole?: string;
  initialSubTab?: FinanceSubTab;
  onNavigateTab?: (tab: string) => void;
}

export const FinanceDashboardView: React.FC<FinanceDashboardViewProps> = ({
  currentUserName = 'Finance Officer',
  userRole = 'Admin',
  initialSubTab = 'analytics',
  onNavigateTab,
}) => {
  const [subTab, setSubTab] = useState<FinanceSubTab>(initialSubTab);
  const [selectedPartyIdForLedger, setSelectedPartyIdForLedger] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedMonthDrilldown, setSelectedMonthDrilldown] = useState<MonthShort | null>(null);
  const [showAverageLine, setShowAverageLine] = useState<boolean>(true);
  const [chartMode, setChartMode] = useState<'grouped' | 'variance'>('grouped');

  // Modals state
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [isAdjustBudgetOpen, setIsAdjustBudgetOpen] = useState(false);
  const [adjustTargetMonth, setAdjustTargetMonth] = useState<MonthShort>('Jan');
  const [adjustTargetAmount, setAdjustTargetAmount] = useState<number>(1400000);

  // New Expense form state
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    month: 'Sep' as MonthShort,
    year: 2026,
    category: 'Campus IT & Cloud Infrastructure',
    description: '',
    vendor: '',
    amount: '',
    department: 'IT & Tech',
    paymentMode: 'NEFT/RTGS' as PaymentMode,
    invoiceRef: '',
  });

  // Search & filter for transactions
  const [txSearch, setTxSearch] = useState('');
  const [txCategoryFilter, setTxCategoryFilter] = useState('All');

  // Data fetching
  const [monthlyData, setMonthlyData] = useState<MonthlyBudgetExpenditure[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [transactions, setTransactions] = useState<ExpenseTransaction[]>([]);
  const [metrics, setMetrics] = useState<FinanceDashboardMetrics>(() =>
    financeStorage.getDashboardMetrics(2026, 'All')
  );

  const loadData = () => {
    const mData = financeStorage.getMonthlyData(selectedYear, selectedDepartment);
    const cats = financeStorage.getCategories();
    const txs = financeStorage.getTransactions();
    const met = financeStorage.getDashboardMetrics(selectedYear, selectedDepartment);

    setMonthlyData(mData);
    setCategories(cats);
    setTransactions(txs);
    setMetrics(met);
  };

  useEffect(() => {
    loadData();

    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => {
      window.removeEventListener('mysar_finance_data_changed', handleDataChange);
    };
  }, [selectedYear, selectedDepartment]);

  // Active month data for drilldown
  const activeMonthData = useMemo(() => {
    if (!selectedMonthDrilldown) return null;
    return monthlyData.find((m) => m.month === selectedMonthDrilldown) || null;
  }, [selectedMonthDrilldown, monthlyData]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        txSearch === '' ||
        t.description.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.vendor.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.invoiceRef.toLowerCase().includes(txSearch.toLowerCase()) ||
        t.id.toLowerCase().includes(txSearch.toLowerCase());

      const matchCat = txCategoryFilter === 'All' || t.category === txCategoryFilter;
      const matchMonth =
        selectedMonthDrilldown === null || t.month === selectedMonthDrilldown;

      return matchSearch && matchCat && matchMonth;
    });
  }, [transactions, txSearch, txCategoryFilter, selectedMonthDrilldown]);

  // Average monthly budget limit
  const avgMonthlyBudget = useMemo(() => {
    if (monthlyData.length === 0) return 0;
    const total = monthlyData.reduce((acc, m) => acc + m.budgetLimit, 0);
    return Math.round(total / monthlyData.length);
  }, [monthlyData]);

  // Handle submit new expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpense.amount);
    if (isNaN(amt) || amt <= 0 || !newExpense.description || !newExpense.vendor) {
      alert('Please provide valid expense details, amount, and vendor.');
      return;
    }

    financeStorage.addTransaction({
      date: newExpense.date,
      month: newExpense.month,
      year: newExpense.year,
      category: newExpense.category,
      description: newExpense.description,
      vendor: newExpense.vendor,
      amount: amt,
      department: newExpense.department,
      paymentMode: newExpense.paymentMode,
      invoiceRef: newExpense.invoiceRef || `INV-${Date.now().toString().slice(-5)}`,
      approvedBy: currentUserName,
      status: 'Paid',
    });

    setIsRecordExpenseOpen(false);
    setNewExpense({
      date: new Date().toISOString().split('T')[0],
      month: 'Sep',
      year: 2026,
      category: 'Campus IT & Cloud Infrastructure',
      description: '',
      vendor: '',
      amount: '',
      department: 'IT & Tech',
      paymentMode: 'NEFT/RTGS',
      invoiceRef: '',
    });
  };

  // Handle update budget limit
  const handleUpdateBudgetLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustTargetAmount <= 0) {
      alert('Please enter a valid positive budget limit.');
      return;
    }
    financeStorage.updateMonthlyBudgetLimit(adjustTargetMonth, selectedYear, adjustTargetAmount);
    setIsAdjustBudgetOpen(false);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Month',
      'Year',
      'Department Scope',
      'Budget Limit (INR)',
      'Actual Expenditure (INR)',
      'Variance (INR)',
      'Utilization Rate (%)',
      'Budget Status',
    ];

    const rows = monthlyData.map((m) => [
      m.fullMonth,
      m.year,
      selectedDepartment,
      m.budgetLimit,
      m.actualExpenditure,
      m.variance,
      `${m.variancePercent}%`,
      m.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MYSAR_Finance_Monthly_Budget_vs_Expenditure_${selectedYear}_${selectedDepartment}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSubNavBar = () => {
    const tabs: {
      id: FinanceSubTab;
      label: string;
      icon: React.ElementType;
      badge?: string;
      badgeColor?: string;
      navTab: string;
    }[] = [
      {
        id: 'analytics',
        label: 'Finance Dashboard',
        icon: Wallet,
        badge: 'Executive',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        navTab: 'finance-dashboard',
      },
      {
        id: 'reports-center',
        label: 'Report Center',
        icon: FileSpreadsheet,
        badge: '11 Modules',
        badgeColor: 'bg-blue-100 text-blue-800',
        navTab: 'finance-reports',
      },
      {
        id: 'ar-ap-management',
        label: 'Receivables & Payables',
        icon: Users,
        badge: 'Aging',
        badgeColor: 'bg-amber-100 text-amber-800',
        navTab: 'finance-ar-ap',
      },
      {
        id: 'budget-chart',
        label: 'Budget vs Expense Chart',
        icon: Wallet,
        navTab: 'finance-budget-chart',
      },
      {
        id: 'gl',
        label: 'Accounting & General Ledger',
        icon: FileSpreadsheet,
        badge: 'P&L / BS',
        badgeColor: 'bg-blue-100 text-blue-800',
        navTab: 'finance-gl',
      },
      {
        id: 'cash-bank',
        label: 'Cash & Bank Accounts',
        icon: Landmark,
        navTab: 'finance-cash-bank',
      },
      {
        id: 'loans',
        label: 'Loans & Debt Management',
        icon: Landmark,
        badge: 'EMI/Debt',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        navTab: 'finance-loans',
      },
      {
        id: 'payments',
        label: 'Vendor Payments & Approvals',
        icon: CreditCard,
        badge: 'TDS / Tiered',
        badgeColor: 'bg-amber-100 text-amber-800',
        navTab: 'finance-payments',
      },
      {
        id: 'receipts',
        label: 'Customer Receipts',
        icon: Receipt,
        badge: 'Inflows',
        badgeColor: 'bg-blue-100 text-blue-800',
        navTab: 'finance-receipts',
      },
      {
        id: 'advances',
        label: 'Advance Adjustments',
        icon: Layers,
        badge: 'Reconcile',
        badgeColor: 'bg-purple-100 text-purple-800',
        navTab: 'finance-advances',
      },
      {
        id: 'controls-audit',
        label: 'Controls & Audit',
        icon: ShieldCheck,
        badge: 'SOX',
        badgeColor: 'bg-rose-100 text-rose-800',
        navTab: 'finance-controls-audit',
      },
      {
        id: 'tax-compliance',
        label: 'Tax & GST / TDS',
        icon: FileSpreadsheet,
        badge: 'GST/RCM',
        badgeColor: 'bg-purple-100 text-purple-800',
        navTab: 'finance-tax',
      },
      {
        id: 'budget-management',
        label: 'Budget & Commitments',
        icon: BarChart3,
        badge: 'Commitment',
        badgeColor: 'bg-emerald-100 text-emerald-800',
        navTab: 'finance-budget',
      },
      {
        id: 'planner',
        label: 'Budget Planner & Caps',
        icon: SlidersHorizontal,
        badge: 'Admin',
        badgeColor: 'bg-blue-100 text-blue-800',
        navTab: 'finance-planner',
      },
      {
        id: 'projections',
        label: 'Budget Projections',
        icon: TrendingUp,
        badge: 'Burn Rate',
        badgeColor: 'bg-purple-100 text-purple-800',
        navTab: 'finance-projections',
      },
      {
        id: 'ledger',
        label: 'Expense Ledger',
        icon: Receipt,
        navTab: 'finance-ledger',
      },
    ];

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-2.5 shadow-2xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSubTab(tab.id);
                  onNavigateTab?.(tab.navTab);
                  if (tab.id === 'ledger') {
                    const el = document.getElementById('expense-ledger-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 font-semibold hover:bg-white/50'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    isActive
                      ? tab.id === 'analytics' || tab.id === 'sales-ar' || tab.id === 'loans'
                        ? 'text-[#168A45]'
                        : tab.id === 'gl' || tab.id === 'planner' || tab.id === 'reports-center'
                        ? 'text-blue-600'
                        : tab.id === 'vendors' || tab.id === 'ar-ap-management'
                        ? 'text-amber-600'
                        : tab.id === 'item-master'
                        ? 'text-indigo-600'
                        : tab.id === 'controls-audit'
                        ? 'text-rose-600'
                        : tab.id === 'projections' || tab.id === 'party-ledger'
                        ? 'text-purple-600'
                        : 'text-slate-700'
                      : 'text-slate-500'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      tab.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (subTab === 'analytics') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <FinanceExecutiveDashboard
          onNavigateTab={(t) => {
            if (t === 'finance-parties') setSubTab('parties');
            else if (t === 'finance-sales-ar') setSubTab('sales-ar');
            else if (t === 'finance-cash-bank') setSubTab('cash-bank');
            else if (t === 'finance-loans') setSubTab('loans');
            else if (t === 'finance-payments') setSubTab('payments');
            else if (t === 'finance-receipts') setSubTab('receipts');
            else if (t === 'finance-advances') setSubTab('advances');
            else if (t === 'finance-item-master') setSubTab('item-master');
            else if (t === 'finance-controls-audit') setSubTab('controls-audit');
            else if (t === 'finance-tax') setSubTab('tax-compliance');
            else if (t === 'finance-budget') setSubTab('budget-management');
            else if (t === 'finance-planner') setSubTab('planner');
            else if (t === 'finance-projections') setSubTab('projections');
            else if (t === 'finance-gl') setSubTab('gl');
            else if (t === 'finance-purchase') setSubTab('purchase-workflow');
            else if (t === 'finance-sales') setSubTab('sales-workflow');
            else if (t === 'reports-center') setSubTab('reports-center');
            else if (t === 'ar-ap-management') setSubTab('ar-ap-management');
            else onNavigateTab?.(t);
          }}
          onOpenPartyLedger={(partyId) => {
            setSelectedPartyIdForLedger(partyId);
            setSubTab('party-ledger');
          }}
        />
      </div>
    );
  }

  if (subTab === 'reports-center') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <FinanceReportCenterView />
      </div>
    );
  }

  if (subTab === 'ar-ap-management') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <ReceivablesPayablesManagementView
          onOpenPartyLedger={(partyId) => {
            setSelectedPartyIdForLedger(partyId);
            setSubTab('party-ledger');
          }}
        />
      </div>
    );
  }

  if (subTab === 'party-ledger') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <PartyLedgerView initialPartyId={selectedPartyIdForLedger} />
      </div>
    );
  }

  if (subTab === 'purchase-workflow') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <PurchaseWorkflowView />
      </div>
    );
  }

  if (subTab === 'sales-workflow') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <SalesWorkflowView />
      </div>
    );
  }

  if (subTab === 'gl') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <AccountingGeneralLedgerView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  if (subTab === 'parties') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <FinancePartyMasterView />
      </div>
    );
  }

  if (subTab === 'sales-ar') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <SalesCustomerLedgerView
          currentUserName={currentUserName}
          userRole={userRole}
        />
      </div>
    );
  }

  if (subTab === 'vendors') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <VendorManagementView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  if (subTab === 'cash-bank') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <CashAndBankManagementView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  if (subTab === 'loans') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <LoanManagementView />
      </div>
    );
  }

  if (subTab === 'payments') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <PaymentManagementView
          currentUserName={currentUserName}
          userRole={userRole}
        />
      </div>
    );
  }

  if (subTab === 'receipts') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <ReceiptManagementView
          currentUserName={currentUserName}
          userRole={userRole}
        />
      </div>
    );
  }

  if (subTab === 'advances') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <AdvanceAdjustmentManagementView
          currentUserName={currentUserName}
        />
      </div>
    );
  }

  if (subTab === 'item-master') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <FinanceItemMasterView
          currentUserName={currentUserName}
          userRole={userRole}
        />
      </div>
    );
  }

  if (subTab === 'controls-audit') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <FinanceControlsAndAuditView
          currentUserName={currentUserName}
          userRole={userRole}
        />
      </div>
    );
  }

  if (subTab === 'tax-compliance') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <TaxManagementView />
      </div>
    );
  }

  if (subTab === 'budget-management') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <BudgetManagementView />
      </div>
    );
  }

  if (subTab === 'planner') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <FinanceBudgetPlanner
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateToDashboard={() => {
            setSubTab('analytics');
            onNavigateTab?.('finance-dashboard');
          }}
        />
      </div>
    );
  }

  if (subTab === 'projections') {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {renderSubNavBar()}
        <BudgetProjectionView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {renderSubNavBar()}

      {/* 1. Module Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#168A45] shadow-2xs shrink-0 mt-0.5">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Finance & Budgeting Module
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                  Fiscal Year {selectedYear}
                </span>
                {metrics.overBudgetMonthsCount > 0 ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    {metrics.overBudgetMonthsCount} Months Over Budget
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    100% In Budget
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Visual analysis of approved institutional budget limits vs actual monthly expenditures,
                burn velocity, and department allocation variances.
              </p>
            </div>
          </div>

          {/* Action Toolbar & Filters */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            {/* Year Selector */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedYear(2026)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedYear === 2026
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FY 2026
              </button>
              <button
                type="button"
                onClick={() => setSelectedYear(2025)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedYear === 2025
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                FY 2025
              </button>
            </div>

            {/* Department Filter */}
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-semibold text-slate-700 rounded-xl px-3 py-2 pr-8 shadow-2xs focus:ring-2 focus:ring-[#168A45] focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Departments</option>
                <option value="Academic">Academic</option>
                <option value="Administration">Administration</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="IT & Tech">IT & Tech</option>
                <option value="Operations">Operations & Facilities</option>
              </select>
            </div>

            {/* Budget Planner & Caps */}
            <button
              type="button"
              onClick={() => {
                setSubTab('planner');
                onNavigateTab?.('finance-planner');
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Budget Planner & Caps</span>
            </button>

            {/* Adjust Limit */}
            <button
              type="button"
              onClick={() => setIsAdjustBudgetOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Adjust Month Limit</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            {/* Record Expense CTA */}
            <button
              type="button"
              onClick={() => setIsRecordExpenseOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#116e37] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Annual Budget Limit */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Budget Limit
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(metrics.totalAnnualBudget)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">12 Months Allocation</span>
            <span>•</span>
            <span>Avg {formatCompactINR(metrics.totalAnnualBudget / 12)}/mo</span>
          </div>
        </div>

        {/* Card 2: Actual Total Expenditure */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Expenditure
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#168A45]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(metrics.totalActualExpenditure)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span
              className={`font-bold px-1.5 py-0.2 rounded-md ${
                metrics.overallUtilizationRate > 100
                  ? 'bg-rose-100 text-rose-800'
                  : metrics.overallUtilizationRate >= 95
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {metrics.overallUtilizationRate}% utilized
            </span>
            <span className="text-slate-500">of institutional cap</span>
          </div>
        </div>

        {/* Card 3: Net Variance (Savings / Deficit) */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Budget Variance (Net)
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                metrics.totalVariance >= 0
                  ? 'bg-emerald-50 text-[#168A45]'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {metrics.totalVariance >= 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
            </div>
          </div>
          <div
            className={`text-2xl font-bold tracking-tight ${
              metrics.totalVariance >= 0 ? 'text-emerald-800' : 'text-rose-700'
            }`}
          >
            {metrics.totalVariance >= 0 ? '+' : ''}
            {formatINR(metrics.totalVariance)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <span
              className={`font-bold ${
                metrics.totalVariance >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {metrics.totalVariance >= 0 ? 'Net Surplus (Savings)' : 'Budget Deficit'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500">{metrics.overBudgetMonthsCount} Over-cap months</span>
          </div>
        </div>

        {/* Card 4: Monthly Burn Rate */}
        <div className="bg-white p-4.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Monthly Burn
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-700">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(metrics.averageMonthlyExpenditure)}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
            <span className="text-slate-700 font-semibold">Peak:</span>
            <span className="text-slate-900 font-bold">{metrics.highestSpendMonth.month}</span>
            <span className="text-slate-400">({formatCompactINR(metrics.highestSpendMonth.amount)})</span>
          </div>
        </div>
      </div>

      {/* Budget Projection Quick-Callout Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white border border-purple-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                Budget Projection Feature
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                September Burn Velocity Pacing
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Track current daily burn rate against monthly caps. Current burn pace is{' '}
              <strong className="text-slate-900 font-bold">~₹46,500 / day</strong>, yielding an estimated end-of-month
              spend of <strong className="text-purple-700 font-bold">₹13.97 Lakhs</strong> (99.8% of the ₹14.0L budget cap).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSubTab('projections');
            onNavigateTab?.('finance-projections');
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <span>Open Budget Projections</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* 3. The Core Recharts Bar Chart Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Monthly Expenditures vs Budget Limits
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                12-Month Bar Chart
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Compare approved budgetary allocation against real-time operational expenditures across each month.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setChartMode('grouped')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  chartMode === 'grouped'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Side-by-Side Bars
              </button>
              <button
                type="button"
                onClick={() => setChartMode('variance')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  chartMode === 'variance'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Variance View
              </button>
            </div>

            {/* Average line toggle */}
            <button
              type="button"
              onClick={() => setShowAverageLine(!showAverageLine)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                showAverageLine
                  ? 'bg-emerald-50 text-[#0B5D2A] border-emerald-300'
                  : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
              }`}
            >
              <span>Avg Benchmark</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  showAverageLine ? 'bg-[#168A45]' : 'bg-slate-300'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Legend / Key Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 bg-[#F7FAF8] rounded-xl border border-gray-200 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded bg-slate-400 border border-slate-500" />
              <span className="font-semibold text-slate-700">Budget Limit (Approved Cap)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded bg-[#168A45] border border-[#0B5D2A]" />
              <span className="font-semibold text-slate-700">Actual Expenditure (Under/On Track)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3.5 h-3.5 rounded bg-rose-500 border border-rose-600" />
              <span className="font-semibold text-slate-700">Actual Expenditure (Over Budget)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            Tip: Click any month bar to filter drilldown ledger below
          </div>
        </div>

        {/* Recharts Bar Chart */}
        <div className="w-full h-80 sm:h-96 min-w-0 pt-2" id="finance-budget-expenditure-chart">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'grouped' ? (
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 16, left: 10, bottom: 20 }}
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const item = data.activePayload[0].payload as MonthlyBudgetExpenditure;
                    setSelectedMonthDrilldown(
                      selectedMonthDrilldown === item.month ? null : item.month
                    );
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="month"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#475569', fontWeight: 600 }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickFormatter={(val) => formatCompactINR(val)}
                  tick={{ fill: '#64748B' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(22, 138, 69, 0.06)' }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as MonthlyBudgetExpenditure;
                      const isOver = data.actualExpenditure > data.budgetLimit;
                      const diff = data.budgetLimit - data.actualExpenditure;
                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[220px]">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {data.fullMonth} {data.year}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isOver
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {data.status}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-[11px]">
                            <div className="flex justify-between items-center text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-xs bg-slate-400" />
                                Budget Limit:
                              </span>
                              <span className="font-bold text-slate-900">
                                {formatINR(data.budgetLimit)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center text-slate-600">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={`w-2.5 h-2.5 rounded-xs ${
                                    isOver ? 'bg-rose-500' : 'bg-[#168A45]'
                                  }`}
                                />
                                Actual Spent:
                              </span>
                              <span
                                className={`font-bold ${
                                  isOver ? 'text-rose-600' : 'text-[#168A45]'
                                }`}
                              >
                                {formatINR(data.actualExpenditure)}
                              </span>
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-slate-100 font-medium">
                              <span>Variance:</span>
                              <span
                                className={`font-bold ${
                                  diff >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {diff >= 0 ? '+' : ''}
                                {formatINR(diff)} ({data.variancePercent}%)
                              </span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 italic pt-1 text-center">
                            Click bar to filter details
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                />

                {/* 1. Budget Limit Bar */}
                <Bar
                  dataKey="budgetLimit"
                  name="Budget Limit"
                  fill="#94A3B8"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />

                {/* 2. Actual Expenditure Bar with dynamic coloring */}
                <Bar
                  dataKey="actualExpenditure"
                  name="Actual Expenditure"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                >
                  {monthlyData.map((entry, index) => {
                    const isSelected = selectedMonthDrilldown === entry.month;
                    const isOver = entry.actualExpenditure > entry.budgetLimit;
                    const color = isOver
                      ? '#EF4444'
                      : isSelected
                      ? '#0B5D2A'
                      : '#168A45';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>

                {/* Benchmark line */}
                {showAverageLine && (
                  <ReferenceLine
                    y={avgMonthlyBudget}
                    stroke="#D97706"
                    strokeDasharray="4 4"
                    label={{
                      value: `Avg Limit: ${formatCompactINR(avgMonthlyBudget)}`,
                      position: 'top',
                      fill: '#D97706',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  />
                )}
              </BarChart>
            ) : (
              // Variance View (Difference between Budget and Spend)
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 16, left: 10, bottom: 20 }}
                onClick={(data: any) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const item = data.activePayload[0].payload as MonthlyBudgetExpenditure;
                    setSelectedMonthDrilldown(
                      selectedMonthDrilldown === item.month ? null : item.month
                    );
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="month"
                  stroke="#64748B"
                  fontSize={12}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tick={{ fill: '#475569', fontWeight: 600 }}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickFormatter={(val) => formatCompactINR(val)}
                  tick={{ fill: '#64748B' }}
                />
                <ReferenceLine y={0} stroke="#64748B" />
                <Tooltip
                  cursor={{ fill: 'rgba(22, 138, 69, 0.06)' }}
                  formatter={(val: number) => [
                    `${val >= 0 ? '+' : ''}${formatINR(val)}`,
                    val >= 0 ? 'Surplus (Savings)' : 'Deficit (Over Budget)',
                  ]}
                />
                <Bar dataKey="variance" name="Budget Surplus / Deficit" radius={[4, 4, 4, 4]}>
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`variance-cell-${index}`}
                      fill={entry.variance >= 0 ? '#168A45' : '#EF4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Selected Month Drilldown Banner */}
        {selectedMonthDrilldown && activeMonthData && (
          <div className="bg-[#EAF7EF] border border-[#D9E5DD] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#168A45]" />
              <span className="font-bold text-slate-900 text-sm">
                Focus: {activeMonthData.fullMonth} {activeMonthData.year}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-700">
                Budget: <strong>{formatINR(activeMonthData.budgetLimit)}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-700">
                Spent: <strong>{formatINR(activeMonthData.actualExpenditure)}</strong>
              </span>
              <span className="text-slate-500">•</span>
              <span
                className={`font-bold ${
                  activeMonthData.variance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {activeMonthData.variance >= 0 ? 'Saved ' : 'Over by '}
                {formatINR(Math.abs(activeMonthData.variance))}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setAdjustTargetMonth(selectedMonthDrilldown);
                  setAdjustTargetAmount(activeMonthData.budgetLimit);
                  setIsAdjustBudgetOpen(true);
                }}
                className="px-2.5 py-1 bg-white text-slate-700 hover:text-[#168A45] border border-gray-200 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
              >
                Adjust This Month's Budget
              </button>
              <button
                type="button"
                onClick={() => setSelectedMonthDrilldown(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 cursor-pointer"
                title="Clear Focus"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Month-by-Month Variance Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Month-by-Month Expenditure vs Budget Limit Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Detailed tracking of monthly approved ceiling, actual spend, variance surplus/deficit, and status.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Total 12 Fiscal Months • Scope: <strong>{selectedDepartment}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3 text-right">Budget Limit</th>
                <th className="px-4 py-3 text-right">Actual Expenditure</th>
                <th className="px-4 py-3 text-right">Variance (Surplus/Deficit)</th>
                <th className="px-4 py-3">Utilization Rate</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {monthlyData.map((m) => {
                const isOver = m.actualExpenditure > m.budgetLimit;
                const isSelected = selectedMonthDrilldown === m.month;

                return (
                  <tr
                    key={m.month}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-[#EAF7EF]/70 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOver ? 'bg-rose-500' : 'bg-[#168A45]'
                        }`}
                      />
                      <span>{m.fullMonth}</span>
                      <span className="text-slate-400 font-normal text-[11px]">({m.month})</span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-700">
                      {formatINR(m.budgetLimit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        isOver ? 'text-rose-600' : 'text-[#168A45]'
                      }`}
                    >
                      {formatINR(m.actualExpenditure)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        m.variance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {m.variance >= 0 ? '+' : ''}
                      {formatINR(m.variance)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              m.variancePercent > 100
                                ? 'bg-rose-500'
                                : m.variancePercent >= 95
                                ? 'bg-amber-500'
                                : 'bg-[#168A45]'
                            }`}
                            style={{ width: `${Math.min(m.variancePercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono font-bold text-slate-700">
                          {m.variancePercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          m.status === 'Over Budget'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : m.status === 'On Track'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setAdjustTargetMonth(m.month);
                          setAdjustTargetAmount(m.budgetLimit);
                          setIsAdjustBudgetOpen(true);
                        }}
                        className="text-xs text-slate-500 hover:text-[#168A45] font-semibold hover:underline cursor-pointer"
                      >
                        Edit Limit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="px-4 py-3">Full Year Total</td>
                <td className="px-4 py-3 text-right font-mono">
                  {formatINR(metrics.totalAnnualBudget)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#168A45]">
                  {formatINR(metrics.totalActualExpenditure)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono ${
                    metrics.totalVariance >= 0 ? 'text-emerald-800' : 'text-rose-700'
                  }`}
                >
                  {metrics.totalVariance >= 0 ? '+' : ''}
                  {formatINR(metrics.totalVariance)}
                </td>
                <td className="px-4 py-3 font-mono">
                  {metrics.overallUtilizationRate}% Avg
                </td>
                <td className="px-4 py-3 text-center" colSpan={2}>
                  <span className="text-[11px] text-slate-600 font-semibold">
                    {metrics.overBudgetMonthsCount === 0
                      ? 'Compliant'
                      : `${metrics.overBudgetMonthsCount} Months Over Ceiling`}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 5. Category Breakdown & Recent Transactions Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Budget Allocation & Utilization */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[#168A45]">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Category Budgets</h3>
                <p className="text-[11px] text-slate-500">Allocated limit vs Actual spent</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {categories.length} Categories
            </span>
          </div>

          <div className="space-y-3.5">
            {categories.map((cat) => {
              const utilPercent =
                cat.allocatedBudget > 0
                  ? Math.round((cat.actualSpend / cat.allocatedBudget) * 100)
                  : 0;
              const isOver = cat.actualSpend > cat.allocatedBudget;

              return (
                <div key={cat.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                      {cat.name}
                    </span>
                    <span className="font-mono text-slate-600">
                      <strong>{formatINR(cat.actualSpend)}</strong> / {formatCompactINR(cat.allocatedBudget)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOver ? 'bg-rose-500' : 'bg-[#168A45]'
                      }`}
                      style={{ width: `${Math.min(utilPercent, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{cat.code}</span>
                    <span
                      className={`font-bold ${
                        isOver ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {utilPercent}% used {isOver ? '(Exceeded)' : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Expense Transactions Ledger */}
        <div id="expense-ledger-section" className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Expense Ledger & Vouchers
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real-time transactional audit trail contributing to monthly spend
                </p>
              </div>
            </div>

            {/* Quick search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search voucher, vendor..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 text-xs rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#168A45]"
                />
              </div>

              <select
                value={txCategoryFilter}
                onChange={(e) => setTxCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold text-[11px]">
                  <th className="pb-2">Voucher ID & Date</th>
                  <th className="pb-2">Description & Vendor</th>
                  <th className="pb-2">Category / Dept</th>
                  <th className="pb-2 text-right">Amount</th>
                  <th className="pb-2 text-center">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No expense transactions found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.slice(0, 7).map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 pr-2">
                        <div className="font-mono font-bold text-slate-900">{tx.id}</div>
                        <div className="text-[10px] text-slate-400">{tx.date}</div>
                      </td>
                      <td className="py-2.5 pr-2 max-w-[200px]">
                        <div className="font-semibold text-slate-900 truncate" title={tx.description}>
                          {tx.description}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate" title={tx.vendor}>
                          {tx.vendor}
                        </div>
                      </td>
                      <td className="py-2.5 pr-2">
                        <div className="text-slate-800 text-[11px] truncate max-w-[140px]">
                          {tx.category}
                        </div>
                        <div className="text-[10px] text-slate-400">{tx.department}</div>
                      </td>
                      <td className="py-2.5 pr-2 text-right font-mono font-bold text-slate-900">
                        {formatINR(tx.amount)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {tx.paymentMode}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: Record New Expense */}
      {isRecordExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#168A45] flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Record New Expense</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordExpenseOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      const monthNames: MonthShort[] = [
                        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                      ];
                      setNewExpense({
                        ...newExpense,
                        date: e.target.value,
                        month: monthNames[d.getMonth()] || 'Sep',
                        year: d.getFullYear(),
                      });
                    }}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Month</label>
                  <select
                    value={newExpense.month}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, month: e.target.value as MonthShort })
                    }
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                  >
                    {[
                      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                    ].map((m) => (
                      <option key={m} value={m}>
                        {m} 2026
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Amount in INR (₹) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 85000"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Description / Item *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server hosting renewal, Generator diesel, Lab reagents..."
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Payee *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Tele, Voltas Ltd, BPCL..."
                    value={newExpense.vendor}
                    onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice / Ref #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9842"
                    value={newExpense.invoiceRef}
                    onChange={(e) => setNewExpense({ ...newExpense, invoiceRef: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newExpense.department}
                    onChange={(e) => setNewExpense({ ...newExpense, department: e.target.value })}
                    className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administration">Administration</option>
                    <option value="Finance & Accounts">Finance & Accounts</option>
                    <option value="IT & Tech">IT & Tech</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={newExpense.paymentMode}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, paymentMode: e.target.value as PaymentMode })
                  }
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                >
                  <option value="NEFT/RTGS">NEFT / RTGS</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Corporate Card">Corporate Card</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordExpenseOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#116e37] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Confirm & Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Adjust Monthly Budget Limits */}
      {isAdjustBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Adjust Monthly Budget Limit
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustBudgetOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudgetLimit} className="mt-4 space-y-4 text-xs">
              <p className="text-slate-500">
                Modifying the approved budget ceiling for a month will immediately update the Recharts
                bar chart, recalculate variance savings, and update burn analytics.
              </p>

              <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-2">
                <div>
                  <span className="font-semibold block text-blue-800">Need granular category caps?</span>
                  <span className="text-[11px] text-blue-600">Plan Marketing, Salaries, Infrastructure & more.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdjustBudgetOpen(false);
                    setSubTab('planner');
                    onNavigateTab?.('finance-planner');
                  }}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] whitespace-nowrap shadow-2xs transition-all cursor-pointer"
                >
                  Open Planner →
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Month</label>
                <select
                  value={adjustTargetMonth}
                  onChange={(e) => {
                    const m = e.target.value as MonthShort;
                    setAdjustTargetMonth(m);
                    const found = monthlyData.find((item) => item.month === m);
                    if (found) {
                      setAdjustTargetAmount(found.budgetLimit);
                    }
                  }}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                >
                  {[
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                  ].map((m) => (
                    <option key={m} value={m}>
                      {m} {selectedYear}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Budget Limit Ceiling in INR (₹)
                </label>
                <input
                  type="number"
                  required
                  step={10000}
                  value={adjustTargetAmount}
                  onChange={(e) => setAdjustTargetAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-gray-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold text-sm focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Preview: {formatINR(adjustTargetAmount)}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustBudgetOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#116e37] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Update Budget Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
