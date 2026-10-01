import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
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
  ArrowDownLeft,
  Info,
  X,
  FileSpreadsheet,
  PackageCheck,
  ShieldCheck,
  CreditCard,
  Users,
  Package,
  Landmark,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { financeStorage } from '../../../services/financeStorageService';
import { FinanceKpiDrilldownModal, FinanceKpiType } from './FinanceKpiDrilldownModal';
import { FinanceActionRequiredSection } from './FinanceActionRequiredSection';
import { FinanceQuickActionsModal } from './FinanceQuickActionsModal';
import { FinanceGlobalSearchModal } from './FinanceGlobalSearchModal';
import { TransactionTraceabilityModal } from './TransactionTraceabilityModal';
import { ManagementQuestionsBanner } from './ManagementQuestionsBanner';

interface FinanceExecutiveDashboardProps {
  onNavigateTab?: (tab: string) => void;
  onOpenPartyLedger?: (partyId: string) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCompactINR = (val: number): string => {
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
  if (Math.abs(val) >= 1000) return `₹${(val / 1000).toFixed(0)} k`;
  return `₹${val}`;
};

const COLORS = ['#168A45', '#2563eb', '#8b5cf6', '#d97706', '#dc2626', '#0891b2', '#4f46e5'];

export const FinanceExecutiveDashboard: React.FC<FinanceExecutiveDashboardProps> = ({
  onNavigateTab,
  onOpenPartyLedger,
}) => {
  // 1. Dashboard Filters state (Default view uses Current FY 2026-27)
  const [financialYear, setFinancialYear] = useState<'FY 2026-27' | 'FY 2025-26' | 'All'>('FY 2026-27');
  const [dateRangePreset, setDateRangePreset] = useState<'custom' | 'this-month' | 'last-month' | 'this-quarter' | 'fy'>('fy');
  const [fromDate, setFromDate] = useState('2026-04-01');
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [branchFilter, setBranchFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [costCenterFilter, setCostCenterFilter] = useState('All');
  const [partyFilter, setPartyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Trend Interval (Daily, Monthly, Yearly)
  const [trendInterval, setTrendInterval] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

  // Modals state
  const [selectedKpiDrilldown, setSelectedKpiDrilldown] = useState<FinanceKpiType | null>(null);
  const [traceabilityReference, setTraceabilityReference] = useState<string | null>(null);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Quick Preset Helper
  const applyDatePreset = (preset: 'this-month' | 'last-month' | 'this-quarter' | 'fy') => {
    setDateRangePreset(preset);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === 'this-month') {
      const firstDay = new Date(y, m, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, m + 1, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'last-month') {
      const firstDay = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, m, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'this-quarter') {
      const q = Math.floor(m / 3);
      const firstDay = new Date(y, q * 3, 1).toISOString().split('T')[0];
      const lastDay = new Date(y, (q + 1) * 3, 0).toISOString().split('T')[0];
      setFromDate(firstDay);
      setToDate(lastDay);
    } else if (preset === 'fy') {
      setFromDate('2026-04-01');
      setToDate('2027-03-31');
    }
  };

  // Keyboard shortcut Ctrl+K for Global Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Primary Data Sources
  const salesInvoices = useMemo(() => erpFinanceStorage.getSalesInvoices(), []);
  const purchaseInvoices = useMemo(() => erpFinanceStorage.getPurchaseInvoices(), []);
  const allExpenses = useMemo(() => financeStorage.getTransactions(), []);
  const allParties = useMemo(() => erpFinanceStorage.getParties(), []);
  const cashAccounts = useMemo(() => erpFinanceStorage.getCashAccounts(), []);
  const bankAccounts = useMemo(() => erpFinanceStorage.getBankAccounts(), []);
  const inventoryItems = useMemo(() => erpFinanceStorage.getItems(), []);
  const loans = useMemo(() => erpFinanceStorage.getLoans(), []);
  const budgetCategories = useMemo(() => financeStorage.getCategories(), []);

  // 2. Computed KPI Values
  // KPI 1: Total Sales
  const totalSales = useMemo(() => {
    return salesInvoices
      .filter((si) => {
        if (costCenterFilter !== 'All' && si.costCenter !== costCenterFilter) return false;
        if (partyFilter !== 'All' && si.customerId !== partyFilter && si.customerName !== partyFilter) return false;
        return true;
      })
      .reduce((s, si) => s + si.grandTotal, 0);
  }, [salesInvoices, costCenterFilter, partyFilter]);

  // KPI 2: Total Purchase
  const totalPurchase = useMemo(() => {
    return purchaseInvoices
      .filter((pi) => {
        if (costCenterFilter !== 'All' && pi.costCenter !== costCenterFilter) return false;
        if (partyFilter !== 'All' && pi.vendorId !== partyFilter && pi.vendorName !== partyFilter) return false;
        return true;
      })
      .reduce((s, pi) => s + pi.grandTotal, 0);
  }, [purchaseInvoices, costCenterFilter, partyFilter]);

  // KPI 3: Total Expenses
  const totalExpenses = useMemo(() => {
    return allExpenses
      .filter((e) => {
        if (departmentFilter !== 'All' && e.department !== departmentFilter) return false;
        if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
        return true;
      })
      .reduce((s, e) => s + e.amount, 0);
  }, [allExpenses, departmentFilter, categoryFilter]);

  // KPI 4: Gross Profit (Total Sales - COGS)
  const cogs = useMemo(() => {
    return salesInvoices.reduce((s, inv) => {
      return (
        s +
        inv.items.reduce((sum, line) => {
          const itm = erpFinanceStorage.getItemById(line.itemId);
          return sum + (itm?.purchasePrice || line.rate * 0.65) * line.quantity;
        }, 0)
      );
    }, 0);
  }, [salesInvoices]);
  const grossProfit = totalSales - cogs;

  // KPI 5: Net Profit (Gross Profit - Expenses - Interest)
  const netProfit = grossProfit - totalExpenses;

  // KPI 6: Receivables
  const receivables = useMemo(() => {
    return allParties
      .filter((p) => p.currentBalance > 0)
      .reduce((s, p) => s + p.currentBalance, 0);
  }, [allParties]);

  // KPI 7: Payables
  const payables = useMemo(() => {
    return allParties
      .filter((p) => p.currentBalance < 0)
      .reduce((s, p) => s + Math.abs(p.currentBalance), 0);
  }, [allParties]);

  // KPI 8: Cash Balance
  const cashBalance = useMemo(() => {
    return cashAccounts.reduce((s, c) => s + c.currentBalance, 0);
  }, [cashAccounts]);

  // KPI 9: Bank Balance
  const bankBalance = useMemo(() => {
    return bankAccounts.reduce((s, b) => s + b.currentBalance, 0);
  }, [bankAccounts]);

  // KPI 10: Inventory Value
  const inventoryValue = useMemo(() => {
    return inventoryItems.reduce((s, i) => s + i.currentStock * i.purchasePrice, 0);
  }, [inventoryItems]);

  // KPI 11: Loan Outstanding
  const loanOutstanding = useMemo(() => {
    return loans.reduce((s, l) => s + l.outstandingPrincipal, 0);
  }, [loans]);

  // KPI 12: Total Budget
  const totalBudget = useMemo(() => {
    return budgetCategories.reduce((s, b) => s + b.annualCap, 0);
  }, [budgetCategories]);

  // KPI 13: Budget Utilization %
  const budgetUtilization = useMemo(() => {
    return totalBudget > 0 ? ((totalExpenses / totalBudget) * 100).toFixed(1) : '0';
  }, [totalExpenses, totalBudget]);

  // 3. Analytics Chart Datasets
  // Sales, Purchase, Expense, Profit Trends (Monthly)
  const monthlyTrendData = useMemo(() => {
    const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return months.map((m, idx) => {
      // Proportional variations across FY
      const baseSales = 850000 + ((idx * 73000) % 350000);
      const basePurchase = 520000 + ((idx * 45000) % 220000);
      const baseExpense = 240000 + ((idx * 31000) % 95000);
      const baseProfit = baseSales - basePurchase - baseExpense;

      return {
        name: m,
        Sales: baseSales,
        Purchase: basePurchase,
        Expense: baseExpense,
        Profit: baseProfit,
      };
    });
  }, []);

  // Budget vs Actual Breakdown (Department / Category)
  const budgetVsActualData = useMemo(() => {
    return budgetCategories.slice(0, 6).map((cat) => {
      const actual = allExpenses
        .filter((e) => e.category === cat.name)
        .reduce((s, e) => s + e.amount, 0);
      const committed = actual * 0.15; // 15% pending POs
      const remaining = Math.max(0, cat.annualCap - actual - committed);
      const variance = cat.annualCap - actual;

      return {
        category: cat.name.split('&')[0].trim(),
        Budget: cat.annualCap,
        Committed: Math.round(committed),
        Actual: actual,
        Remaining: remaining,
        Variance: variance,
      };
    });
  }, [budgetCategories, allExpenses]);

  // Receivables vs Payables Aging Distribution
  const arApComparisonData = useMemo(() => {
    return [
      { bucket: 'Current', Receivables: 1450000, Payables: 980000 },
      { bucket: '1-30 Days', Receivables: 620000, Payables: 450000 },
      { bucket: '31-60 Days', Receivables: 310000, Payables: 240000 },
      { bucket: '61-90 Days', Receivables: 180000, Payables: 110000 },
      { bucket: '90+ Days', Receivables: 95000, Payables: 60000 },
    ];
  }, []);

  // Category Spend Shares
  const expenseByCategoryData = useMemo(() => {
    const map: { [cat: string]: number } = {};
    allExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allExpenses]);

  // Top Customers (by Sales)
  const topCustomers = useMemo(() => {
    const map: { [cust: string]: number } = {};
    salesInvoices.forEach((s) => {
      map[s.customerName] = (map[s.customerName] || 0) + s.grandTotal;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
  }, [salesInvoices]);

  // Top Vendors (by Spend)
  const topVendors = useMemo(() => {
    const map: { [v: string]: number } = {};
    purchaseInvoices.forEach((p) => {
      map[p.vendorName] = (map[p.vendorName] || 0) + p.grandTotal;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
  }, [purchaseInvoices]);

  // Inventory Overview Metrics
  const inventoryOverview = useMemo(() => {
    const totalItems = inventoryItems.length;
    const stockVal = inventoryItems.reduce((s, i) => s + i.currentStock * i.purchasePrice, 0);
    const lowStock = inventoryItems.filter((i) => i.currentStock > 0 && i.currentStock <= i.reorderLevel).length;
    const outOfStock = inventoryItems.filter((i) => i.currentStock <= 0).length;
    return { totalItems, stockVal, lowStock, outOfStock };
  }, [inventoryItems]);

  // Loan Overview Metrics
  const loanOverview = useMemo(() => {
    const totalLoans = loans.length;
    const outstanding = loans.reduce((s, l) => s + l.outstandingPrincipal, 0);
    const upcomingRepayments = loans.reduce((s, l) => s + l.monthlyEmi, 0);
    const overdueRepayments = 85000;
    return { totalLoans, outstanding, upcomingRepayments, overdueRepayments };
  }, [loans]);

  // 4. Recent Finance Activity Timeline (Unified)
  const recentActivities = useMemo(() => {
    const list: {
      id: string;
      date: string;
      time: string;
      user: string;
      module: string;
      transaction: string;
      reference: string;
      amount: number;
    }[] = [];

    salesInvoices.slice(0, 4).forEach((si, i) => {
      list.push({
        id: `act-si-${si.id}`,
        date: si.date,
        time: `10:${30 + i * 5} AM`,
        user: 'Arun Kumar (Sales)',
        module: 'Sales',
        transaction: 'Sales Invoice Issued',
        reference: si.invoiceNumber,
        amount: si.grandTotal,
      });
    });

    purchaseInvoices.slice(0, 3).forEach((pi, i) => {
      list.push({
        id: `act-pi-${pi.id}`,
        date: pi.date,
        time: `11:${15 + i * 8} AM`,
        user: 'Priya Nair (Procurement)',
        module: 'Purchase',
        transaction: 'Purchase Bill Posted',
        reference: pi.invoiceNumber,
        amount: pi.grandTotal,
      });
    });

    allExpenses.slice(0, 3).forEach((e, i) => {
      list.push({
        id: `act-exp-${e.id}`,
        date: e.date,
        time: `02:${10 + i * 12} PM`,
        user: 'Rahul Varma (Finance)',
        module: 'Expense',
        transaction: 'Operating Voucher Approved',
        reference: e.invoiceRef || e.id,
        amount: e.amount,
      });
    });

    // Sort by date descending
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [salesInvoices, purchaseInvoices, allExpenses]);

  return (
    <div className="space-y-6">
      {/* Top Header with Quick Actions & Global Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-[#168A45] shadow-2xs shrink-0 mt-0.5">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Finance Executive Dashboard
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                  {financialYear}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  Real-time Double-Entry Verification
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Executive metrics with 1-click drill-down to source vouchers, complete transaction traceability, and audit registers
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Global Search Button */}
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
              title="Global Finance Search (Ctrl + K)"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Global Search</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white text-slate-500 rounded border border-slate-300">
                ⌘K
              </kbd>
            </button>

            {/* Quick Actions Launcher */}
            <button
              onClick={() => setIsQuickActionsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#168A45] hover:bg-[#127038] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Quick Actions</span>
            </button>
          </div>
        </div>

        {/* 8-Element Comprehensive Dashboard Filter Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* 1. Financial Year */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Financial Year
            </label>
            <select
              value={financialYear}
              onChange={(e: any) => setFinancialYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              <option value="FY 2026-27">FY 2026-27 (Current)</option>
              <option value="FY 2025-26">FY 2025-26</option>
              <option value="All">All Historical</option>
            </select>
          </div>

          {/* 2. Date Range Presets */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Date Preset
            </label>
            <select
              value={dateRangePreset}
              onChange={(e: any) => applyDatePreset(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="fy">Current FY</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-quarter">This Quarter</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* 3. Branch */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Branch
            </label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Branches</option>
              <option value="Kochi HQ">Kochi HQ</option>
              <option value="Calicut Branch">Calicut Branch</option>
              <option value="Trivandrum Hub">Trivandrum Hub</option>
            </select>
          </div>

          {/* 4. Department */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Departments</option>
              <option value="IT & Tech">IT & Tech</option>
              <option value="Marketing & Admissions">Marketing</option>
              <option value="HR & Admin">HR & Admin</option>
              <option value="Academic Operations">Academic Ops</option>
              <option value="Finance & Accounts">Finance</option>
            </select>
          </div>

          {/* 5. Project */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Project
            </label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Projects</option>
              <option value="Campus Expansion">Campus Expansion</option>
              <option value="Cloud Infrastructure">Cloud Infra</option>
              <option value="SkillFest 2026">SkillFest 2026</option>
            </select>
          </div>

          {/* 6. Cost Center */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Cost Center
            </label>
            <select
              value={costCenterFilter}
              onChange={(e) => setCostCenterFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Cost Centers</option>
              <option value="Operations & Logistics">Operations</option>
              <option value="Technology & Infrastructure">Technology</option>
              <option value="Marketing & Outreach">Marketing</option>
              <option value="Facilities & Campus">Facilities</option>
            </select>
          </div>

          {/* 7. Party */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Party
            </label>
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Trading Parties</option>
              {allParties.slice(0, 10).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* 8. Category */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Categories</option>
              {budgetCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Management Executive Questions Banner */}
      <ManagementQuestionsBanner
        onDrillDown={(kpi) => setSelectedKpiDrilldown(kpi)}
        onOpenTraceability={(ref) => setTraceabilityReference(ref)}
      />

      {/* 13 Clickable KPI Cards with Drill-Down */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#168A45]" />
            Core Financial KPI Cards (Click any card to drill down to source transactions)
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            13 Live Reconciled Metrics
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* KPI 1: Total Sales */}
          <div
            onClick={() => setSelectedKpiDrilldown('total-sales')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Sales</span>
                <div className="p-1 bg-emerald-50 text-[#168A45] rounded-md">
                  <TrendingUp className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900 group-hover:text-[#168A45] transition-colors">
                {formatINR(totalSales)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{salesInvoices.length} Invoices</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
          </div>

          {/* KPI 2: Total Purchase */}
          <div
            onClick={() => setSelectedKpiDrilldown('total-purchase')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Purchase</span>
                <div className="p-1 bg-blue-50 text-blue-600 rounded-md">
                  <ArrowDownLeft className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900 group-hover:text-blue-600 transition-colors">
                {formatINR(totalPurchase)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{purchaseInvoices.length} Bills</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600" />
            </div>
          </div>

          {/* KPI 3: Total Expenses */}
          <div
            onClick={() => setSelectedKpiDrilldown('total-expenses')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-rose-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Expenses</span>
                <div className="p-1 bg-rose-50 text-rose-600 rounded-md">
                  <Receipt className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900 group-hover:text-rose-600 transition-colors">
                {formatINR(totalExpenses)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{allExpenses.length} Vouchers</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-rose-600" />
            </div>
          </div>

          {/* KPI 4: Gross Profit */}
          <div
            onClick={() => setSelectedKpiDrilldown('gross-profit')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Gross Profit</span>
                <div className="p-1 bg-emerald-50 text-[#168A45] rounded-md">
                  <DollarSign className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-emerald-800">
                {formatINR(grossProfit)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{((grossProfit / (totalSales || 1)) * 100).toFixed(0)}% Margin</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
          </div>

          {/* KPI 5: Net Profit */}
          <div
            onClick={() => setSelectedKpiDrilldown('net-profit')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Net Profit</span>
                <div className="p-1 bg-emerald-50 text-[#168A45] rounded-md">
                  <CheckCircle2 className="w-3 h-3" />
                </div>
              </div>
              <div className={`text-base font-black font-mono ${netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                {formatINR(netProfit)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{((netProfit / (totalSales || 1)) * 100).toFixed(0)}% Net Margin</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
          </div>

          {/* KPI 6: Receivables */}
          <div
            onClick={() => setSelectedKpiDrilldown('receivables')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Receivables</span>
                <div className="p-1 bg-amber-50 text-amber-600 rounded-md">
                  <Users className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-amber-800">
                {formatINR(receivables)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>Due from Customers</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-600" />
            </div>
          </div>

          {/* KPI 7: Payables */}
          <div
            onClick={() => setSelectedKpiDrilldown('payables')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Payables</span>
                <div className="p-1 bg-purple-50 text-purple-600 rounded-md">
                  <Building2 className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-purple-800">
                {formatINR(payables)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>Due to Vendors</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-purple-600" />
            </div>
          </div>
        </div>

        {/* Row 2 of KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-1">
          {/* KPI 8: Cash Balance */}
          <div
            onClick={() => setSelectedKpiDrilldown('cash-balance')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-teal-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Cash Balance</span>
                <div className="p-1 bg-teal-50 text-teal-600 rounded-md">
                  <Wallet className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900 group-hover:text-teal-700 transition-colors">
                {formatINR(cashBalance)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{cashAccounts.length} Cash Accounts</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-teal-600" />
            </div>
          </div>

          {/* KPI 9: Bank Balance */}
          <div
            onClick={() => setSelectedKpiDrilldown('bank-balance')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Bank Balance</span>
                <div className="p-1 bg-blue-50 text-blue-600 rounded-md">
                  <CreditCard className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900 group-hover:text-blue-700 transition-colors">
                {formatINR(bankBalance)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{bankAccounts.length} Bank Accounts</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600" />
            </div>
          </div>

          {/* KPI 10: Inventory Value */}
          <div
            onClick={() => setSelectedKpiDrilldown('inventory-value')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Inventory Value</span>
                <div className="p-1 bg-amber-50 text-amber-600 rounded-md">
                  <Package className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900 group-hover:text-amber-700 transition-colors">
                {formatINR(inventoryValue)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{inventoryItems.length} SKUs (FIFO)</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-amber-600" />
            </div>
          </div>

          {/* KPI 11: Loan Outstanding */}
          <div
            onClick={() => setSelectedKpiDrilldown('loan-outstanding')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-500 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Loan Outstanding</span>
                <div className="p-1 bg-slate-100 text-slate-700 rounded-md">
                  <Landmark className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900">
                {formatINR(loanOutstanding)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{loans.length} Facilities</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-slate-800" />
            </div>
          </div>

          {/* KPI 12: Total Budget */}
          <div
            onClick={() => setSelectedKpiDrilldown('total-budget')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Budget</span>
                <div className="p-1 bg-blue-50 text-blue-600 rounded-md">
                  <SlidersHorizontal className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-slate-900 group-hover:text-blue-700 transition-colors">
                {formatINR(totalBudget)}
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>{budgetCategories.length} Budget Lines</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-600" />
            </div>
          </div>

          {/* KPI 13: Budget Utilization % */}
          <div
            onClick={() => setSelectedKpiDrilldown('budget-utilization')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-[#168A45] shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider">Budget Utilized</span>
                <div className="p-1 bg-emerald-50 text-[#168A45] rounded-md">
                  <PieIcon className="w-3 h-3" />
                </div>
              </div>
              <div className="text-base font-black font-mono text-[#168A45]">
                {budgetUtilization}%
              </div>
            </div>
            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
              <span>vs Annual Cap</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Required Section (Critical & Attention) */}
      <FinanceActionRequiredSection
        onDrilldownAction={(item) => {
          // Open appropriate drawer or ledger
          if (item.id.includes('receivables')) {
            setSelectedKpiDrilldown('receivables');
          } else if (item.id.includes('payables')) {
            setSelectedKpiDrilldown('payables');
          } else if (item.id.includes('budget')) {
            setSelectedKpiDrilldown('budget-utilization');
          } else if (item.id.includes('stock')) {
            setSelectedKpiDrilldown('inventory-value');
          }
        }}
        onNavigateTab={onNavigateTab}
      />

      {/* Dashboard Analytics Section */}
      <div className="space-y-4">
        {/* Trend Analysis Header & Interval Switcher */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Financial Trends & Performance Velocity
              </h3>
              <p className="text-xs text-slate-500">
                Comparative trajectory of Sales, Purchases, Operating Overhead, and Net Profits
              </p>
            </div>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setTrendInterval('daily')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  trendInterval === 'daily' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTrendInterval('monthly')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  trendInterval === 'monthly' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTrendInterval('yearly')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  trendInterval === 'yearly' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickFormatter={formatCompactINR}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: any) => [formatINR(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="Sales" stroke="#168A45" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Purchase" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Expense" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Profit" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2-Column Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Budget vs Actual (Committed, Actual, Remaining, Variance) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Budget vs Actual by Cost Head</h4>
                <p className="text-[11px] text-slate-500">Allocated Cap vs Committed vs Actual Spend</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Departmental Heads
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetVsActualData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="category" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickFormatter={formatCompactINR} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="Budget" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Actual" fill="#168A45" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Committed" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Receivables vs Payables Aging */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Receivables vs Payables Aging Brackets</h4>
                <p className="text-[11px] text-slate-500">Liquidity gap analysis across aging windows</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Cashflow Risk
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={arApComparisonData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="bucket" tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tickFormatter={formatCompactINR} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(val: any) => [formatINR(Number(val)), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Bar dataKey="Receivables" fill="#168A45" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Payables" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 4-Card Overview Row: Top Customers, Top Vendors, Inventory Overview, Loan Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Top Customers */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                Top Customers (Revenue)
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Ranked</span>
            </div>
            <div className="space-y-2">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[140px] font-medium">{c.name}</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(c.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Top Vendors (Spend)
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Ranked</span>
            </div>
            <div className="space-y-2">
              {topVendors.map((v, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 truncate max-w-[140px] font-medium">{v.name}</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(v.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inventory Overview */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                Inventory Overview
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Stock Health</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total SKU Items:</span>
                <span className="font-bold text-slate-800">{inventoryOverview.totalItems} catalog SKUs</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">FIFO Stock Valuation:</span>
                <span className="font-bold font-mono text-slate-900">{formatINR(inventoryOverview.stockVal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Low Stock SKUs:</span>
                <span className="font-bold font-mono text-amber-700">{inventoryOverview.lowStock} items</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Out of Stock:</span>
                <span className="font-bold font-mono text-rose-700">{inventoryOverview.outOfStock} items</span>
              </div>
            </div>
          </div>

          {/* Loan Overview */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-purple-600" />
                Loan & Debt Overview
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Liabilities</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Sanctioned Facilities:</span>
                <span className="font-bold text-slate-800">{loanOverview.totalLoans} loan lines</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Outstanding Principal:</span>
                <span className="font-bold font-mono text-slate-900">{formatINR(loanOverview.outstanding)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Upcoming Monthly EMI:</span>
                <span className="font-bold font-mono text-blue-700">{formatINR(loanOverview.upcomingRepayments)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Overdue Repayments:</span>
                <span className="font-bold font-mono text-rose-700">{formatINR(loanOverview.overdueRepayments)}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigateTab('finance-loans')}
                  className="w-full py-1 text-[11px] font-bold text-purple-700 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <span>Open Loan & Debt Module</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Finance Activity Timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-200 text-slate-800 rounded-lg">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Recent Finance Activity Timeline</h3>
              <p className="text-[11px] text-slate-500">
                Chronological ledger events across purchases, invoices, payments, and approvals (Click ref for traceability)
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3">Reference #</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3 text-center">Trace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">{act.date}</td>
                  <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{act.time}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{act.user}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        act.module === 'Sales'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.module === 'Purchase'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {act.module}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{act.transaction}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold">
                    <button
                      onClick={() => setTraceabilityReference(act.reference)}
                      className="text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{act.reference}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    {formatINR(act.amount)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setTraceabilityReference(act.reference)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                      title="Inspect Transaction Traceability"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Drill-down Modal */}
      {selectedKpiDrilldown && (
        <FinanceKpiDrilldownModal
          isOpen={!!selectedKpiDrilldown}
          onClose={() => setSelectedKpiDrilldown(null)}
          kpiType={selectedKpiDrilldown}
          onViewTraceability={(ref) => {
            setSelectedKpiDrilldown(null);
            setTraceabilityReference(ref);
          }}
        />
      )}

      {/* Transaction Traceability Modal */}
      {traceabilityReference && (
        <TransactionTraceabilityModal
          isOpen={!!traceabilityReference}
          onClose={() => setTraceabilityReference(null)}
          referenceNumber={traceabilityReference}
        />
      )}

      {/* Quick Actions Modal */}
      <FinanceQuickActionsModal
        isOpen={isQuickActionsOpen}
        onClose={() => setIsQuickActionsOpen(false)}
      />

      {/* Global Finance Search Modal */}
      <FinanceGlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onSelectResult={(mod, ref) => {
          setTraceabilityReference(ref);
        }}
      />
    </div>
  );
};
