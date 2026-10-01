import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Target,
  CalendarClock,
  AlertTriangle,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  RefreshCw,
  Download,
  Building2,
  ShieldCheck,
  Hourglass,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import { financeStorage } from '../../services/financeStorageService';
import {
  MonthShort,
  BudgetProjectionSummary,
  BudgetHealthStatus,
  DailyTrajectoryPoint,
  CategoryBurnProjection,
} from '../../types/finance';

interface BudgetProjectionViewProps {
  currentUserName?: string;
  userRole?: string;
  onNavigateTab?: (tab: string) => void;
}

// Currency formatters
const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCompactINR = (val: number): string => {
  if (Math.abs(val) >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(1)} L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${(val / 1000).toFixed(0)} k`;
  }
  return `₹${val}`;
};

const ALL_MONTHS: MonthShort[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_NAMES: Record<MonthShort, string> = {
  Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
  Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
};

export const BudgetProjectionView: React.FC<BudgetProjectionViewProps> = ({
  currentUserName = 'Finance Officer',
  userRole = 'Admin',
  onNavigateTab,
}) => {
  // Control States
  const [selectedMonth, setSelectedMonth] = useState<MonthShort>('Sep');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [asOfDay, setAsOfDay] = useState<number>(15);
  const [burnRateMultiplier, setBurnRateMultiplier] = useState<number>(1.0);
  const [scenarioMode, setScenarioMode] = useState<'baseline' | 'conservative' | 'accelerated' | 'critical' | 'custom'>('baseline');
  const [customDailyBurn, setCustomDailyBurn] = useState<string>('');
  const [anticipatedLumpSum, setAnticipatedLumpSum] = useState<number>(0);
  const [showProratedPace, setShowProratedPace] = useState<boolean>(true);
  const [showCeiling, setShowCeiling] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Trigger re-render on storage change
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  useEffect(() => {
    const handleDataChange = () => setRefreshTrigger((prev) => prev + 1);
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  // Update asOfDay when selectedMonth changes
  useEffect(() => {
    const daysInMonthMap: Record<MonthShort, number> = {
      Jan: 31, Feb: 28, Mar: 31, Apr: 30, May: 31, Jun: 30,
      Jul: 31, Aug: 31, Sep: 30, Oct: 31, Nov: 30, Dec: 31,
    };
    const maxDays = daysInMonthMap[selectedMonth] || 30;
    if (selectedMonth === 'Sep' && selectedYear === 2026) {
      setAsOfDay(15);
    } else {
      setAsOfDay(Math.min(asOfDay, maxDays));
    }
  }, [selectedMonth, selectedYear]);

  // Handle Scenario preset selection
  const handleSelectScenario = (mode: 'baseline' | 'conservative' | 'accelerated' | 'critical' | 'custom') => {
    setScenarioMode(mode);
    if (mode === 'baseline') {
      setBurnRateMultiplier(1.0);
      setCustomDailyBurn('');
    } else if (mode === 'conservative') {
      setBurnRateMultiplier(0.85); // -15%
      setCustomDailyBurn('');
    } else if (mode === 'accelerated') {
      setBurnRateMultiplier(1.20); // +20%
      setCustomDailyBurn('');
    } else if (mode === 'critical') {
      setBurnRateMultiplier(1.40); // +40%
      setCustomDailyBurn('');
    }
  };

  // Compute projection data
  const projection: BudgetProjectionSummary = useMemo(() => {
    const customBurnNum = customDailyBurn && !isNaN(Number(customDailyBurn)) ? Number(customDailyBurn) : undefined;
    return financeStorage.getBudgetProjection({
      month: selectedMonth,
      year: selectedYear,
      asOfDay,
      burnRateMultiplier: customBurnNum !== undefined ? 1.0 : burnRateMultiplier,
      customDailyBurn: customBurnNum,
      department: selectedDepartment,
      anticipatedLumpSum,
    });
  }, [selectedMonth, selectedYear, asOfDay, burnRateMultiplier, customDailyBurn, selectedDepartment, anticipatedLumpSum, refreshTrigger]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Day',
      'Date',
      'Actual Spend (INR)',
      'Projected Spend (INR)',
      'Linear Prorated Budget (INR)',
      'Monthly Budget Limit (INR)',
      'Breach Status',
    ];

    const rows = projection.dailyTrajectory.map((p) => [
      p.day,
      p.dayLabel,
      p.actualSpend !== null ? p.actualSpend : '',
      p.projectedSpend,
      p.proratedBudget,
      p.budgetCeiling,
      p.isBreach ? 'BREACHED' : 'SAFE',
    ]);

    const catHeaders = ['', '', '', '', '', '', ''];
    const catTitle = ['CATEGORY-WISE PROJECTIONS', '', '', '', '', '', ''];
    const catSubHeaders = [
      'Category',
      'Department',
      'Monthly Cap',
      'Current Spend',
      'Daily Burn Rate',
      'Projected EOM Spend',
      'Projected Headroom / Overrun',
    ];
    const catRows = projection.categoryProjections.map((c) => [
      c.categoryName,
      c.department,
      c.monthlyCap,
      c.currentSpend,
      c.dailyBurnRate,
      c.projectedEOMSpend,
      c.projectedVariance,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((r) => r.join(',')),
        catHeaders.join(','),
        catTitle.join(','),
        catSubHeaders.join(','),
        ...catRows.map((r) => r.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MYSAR_Budget_Projection_${projection.month}_${projection.year}_Day${projection.daysElapsed}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Budget projection data exported to CSV.', 'info');
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projection, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `mysar_budget_projection_${projection.month}_${projection.year}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Projection model report exported to JSON.', 'info');
  };

  // Reset simulation to baseline
  const handleResetSimulation = () => {
    setAsOfDay(15);
    setBurnRateMultiplier(1.0);
    setScenarioMode('baseline');
    setCustomDailyBurn('');
    setAnticipatedLumpSum(0);
    setSelectedDepartment('All');
    setSelectedMonth('Sep');
    showToast('Projection parameters reset to real-time defaults.', 'info');
  };

  // Derived calculations
  const paceDifference = projection.dailyBurnRate - projection.idealLinearDailyBurn;
  const paceDifferencePercent = projection.idealLinearDailyBurn > 0
    ? Math.round((paceDifference / projection.idealLinearDailyBurn) * 1000) / 10
    : 0;

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pointData: DailyTrajectoryPoint = payload[0]?.payload;
      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl text-xs border border-slate-700/80 backdrop-blur-xs min-w-[220px]">
          <div className="font-bold text-sm border-b border-slate-700 pb-1.5 mb-2 flex items-center justify-between">
            <span className="text-emerald-400">{pointData?.dayLabel}</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Day {pointData?.day} of {projection.daysInMonth}
            </span>
          </div>
          <div className="space-y-1.5">
            {pointData?.actualSpend !== null && (
              <div className="flex justify-between items-center text-emerald-300">
                <span>Actual Spend:</span>
                <span className="font-mono font-bold">{formatINR(pointData.actualSpend)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-indigo-300">
              <span>{pointData?.actualSpend !== null ? 'Trajectory Base:' : 'Projected Spend:'}</span>
              <span className="font-mono font-bold">{formatINR(pointData.projectedSpend)}</span>
            </div>
            <div className="flex justify-between items-center text-blue-300">
              <span>Linear Target Pace:</span>
              <span className="font-mono">{formatINR(pointData.proratedBudget)}</span>
            </div>
            <div className="flex justify-between items-center text-red-300 border-t border-slate-800 pt-1">
              <span>Budget Ceiling:</span>
              <span className="font-mono font-bold">{formatINR(pointData.budgetCeiling)}</span>
            </div>
            {pointData.isBreach && (
              <div className="mt-1.5 p-1 rounded bg-red-950/80 border border-red-800 text-[10px] text-red-300 font-semibold text-center">
                Forecasted Budget Overrun
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : toastMessage.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
          {toastMessage.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header & Configuration Strip */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-700 shadow-2xs shrink-0 mt-0.5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Budget Projection & Daily Burn Analysis
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Velocity Forecast Model
                </span>
                {projection.isBreachProjected ? (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    Projected Overrun ({Math.abs(projection.projectedVariancePercent - 100).toFixed(1)}%)
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Within Budget Ceiling
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl">
                Calculates estimated end-of-month expenditure by tracking current daily burn rates against
                the institutional budget limit of{' '}
                <span className="font-semibold text-slate-700">
                  {formatINR(projection.monthlyBudgetLimit)}
                </span>
                .
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleResetSimulation}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>Report JSON</span>
            </button>
          </div>
        </div>

        {/* Interactive Controls Filter Bar */}
        <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Month Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Projection Month ({selectedYear})
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value as MonthShort)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
              >
                {ALL_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {MONTH_NAMES[m]} {selectedYear}
                  </option>
                ))}
              </select>
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 2. Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Cost Center / Department
            </label>
            <div className="relative">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
              >
                <option value="All">All Institutional Departments</option>
                <option value="Academic">Academic</option>
                <option value="Administration">Administration</option>
                <option value="Finance & Accounts">Finance & Accounts</option>
                <option value="IT & Tech">IT & Tech</option>
                <option value="Operations">Operations</option>
              </select>
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* 3. As of Day Selector */}
          <div className="lg:col-span-2 bg-slate-50 border border-gray-200 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                <span>Observation Window:</span>
                <span className="font-bold text-slate-900">
                  Day {asOfDay} of {projection.daysInMonth} ({projection.daysRemaining} days remaining)
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setAsOfDay(15)}
                  className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                    asOfDay === 15 ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Day 15 (Today)
                </button>
                <button
                  type="button"
                  onClick={() => setAsOfDay(10)}
                  className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                    asOfDay === 10 ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Day 10
                </button>
                <button
                  type="button"
                  onClick={() => setAsOfDay(20)}
                  className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-all ${
                    asOfDay === 20 ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Day 20
                </button>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={projection.daysInMonth}
              value={asOfDay}
              onChange={(e) => setAsOfDay(parseInt(e.target.value, 10))}
              className="w-full accent-purple-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Daily Burn Rate */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Current Daily Burn</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatINR(projection.dailyBurnRate)}
              <span className="text-xs font-normal text-slate-500"> / day</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Linear Benchmark:</span>
            <span className="font-semibold text-slate-700">
              {formatINR(projection.idealLinearDailyBurn)}/d
            </span>
          </div>
        </div>

        {/* Card 2: Projected EOM Spend */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Projected EOM Spend</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <CalendarClock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-slate-900 tracking-tight">
              {formatINR(projection.projectedEOMSpend)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Cap Utilization:</span>
            <span
              className={`font-bold ${
                projection.projectedVariancePercent > 100
                  ? 'text-red-600'
                  : projection.projectedVariancePercent >= 95
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {projection.projectedVariancePercent}%
            </span>
          </div>
        </div>

        {/* Card 3: Projected Variance / Headroom */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Forecasted Variance</span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  projection.projectedVariance >= 0
                    ? 'bg-emerald-50 text-[#168A45]'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {projection.projectedVariance >= 0 ? (
                  <ShieldCheck className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
            </div>
            <div
              className={`text-xl font-extrabold tracking-tight ${
                projection.projectedVariance >= 0 ? 'text-[#168A45]' : 'text-red-600'
              }`}
            >
              {projection.projectedVariance >= 0 ? '+' : ''}
              {formatINR(projection.projectedVariance)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Status:</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded-md ${
                projection.status === 'Over Budget'
                  ? 'bg-red-50 text-red-700'
                  : projection.status === 'On Track'
                  ? 'bg-amber-50 text-amber-800'
                  : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {projection.status}
            </span>
          </div>
        </div>

        {/* Card 4: Depletion Day */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Budget Exhaustion</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Hourglass className="w-4 h-4" />
              </div>
            </div>
            <div className="text-lg font-extrabold text-slate-900 tracking-tight">
              {projection.depletionDay ? (
                <span className="text-red-600">
                  Day {projection.depletionDay} ({projection.month} {projection.depletionDay})
                </span>
              ) : (
                <span className="text-[#168A45]">Within Budget</span>
              )}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Remaining Days:</span>
            <span className="font-semibold text-slate-700">{projection.daysRemaining} days</span>
          </div>
        </div>

        {/* Card 5: Safe Remaining Daily Burn Target */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider">Safe Target Burn</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#168A45] flex items-center justify-center">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div className="text-xl font-extrabold text-[#168A45] tracking-tight">
              {formatINR(projection.safeRemainingDailyBurn)}
              <span className="text-xs font-normal text-slate-500"> / day</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Recommended:</span>
            <span className="font-medium text-slate-600">Target for remaining days</span>
          </div>
        </div>
      </div>

      {/* 3. Scenario & Simulation Toolbar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" />
              Daily Burn Rate Velocity Scenarios
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate spending speed variations over the remaining {projection.daysRemaining} days of{' '}
              {MONTH_NAMES[projection.month]}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSelectScenario('baseline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenarioMode === 'baseline'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Baseline Pace (1.0x)
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario('conservative')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenarioMode === 'conservative'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Conservative (-15%)
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario('accelerated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenarioMode === 'accelerated'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Accelerated (+20%)
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenarioMode === 'critical'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Stress Test (+40%)
            </button>
            <button
              type="button"
              onClick={() => handleSelectScenario('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                scenarioMode === 'custom'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Custom Velocity
            </button>
          </div>
        </div>

        {/* Optional Custom Input or Lump Sum Bar */}
        {(scenarioMode === 'custom' || anticipatedLumpSum > 0) && (
          <div className="mt-4 pt-3.5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Override Daily Burn Rate (₹ / Day)
              </label>
              <input
                type="number"
                placeholder={`e.g. ${projection.dailyBurnRate}`}
                value={customDailyBurn}
                onChange={(e) => {
                  setCustomDailyBurn(e.target.value);
                  setScenarioMode('custom');
                }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                Anticipated Month-End Lump-Sum Commitment (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 50000 (One-off purchase)"
                value={anticipatedLumpSum || ''}
                onChange={(e) => setAnticipatedLumpSum(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Trajectory Forecast Chart (Recharts) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Cumulative Expenditure Trajectory (Day 1 to {projection.daysInMonth})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Solid emerald curve shows actual logged spend through Day {projection.daysElapsed}; dashed line
              forecasts trajectory based on current burn rate.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-600">
              <input
                type="checkbox"
                checked={showProratedPace}
                onChange={(e) => setShowProratedPace(e.target.checked)}
                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
              />
              <span>Linear Pace Guide</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-600">
              <input
                type="checkbox"
                checked={showCeiling}
                onChange={(e) => setShowCeiling(e.target.checked)}
                className="rounded text-red-600 focus:ring-0 cursor-pointer"
              />
              <span>Budget Cap Line</span>
            </label>
          </div>
        </div>

        {/* Visual Chart Container */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={projection.dailyTrajectory}
              margin={{ top: 10, right: 15, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient id="actualSpendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#168A45" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#168A45" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="projSpendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="day"
                tickLine={false}
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(val) => `D${val}`}
                interval={1}
              />
              <YAxis
                tickLine={false}
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(val) => formatCompactINR(val)}
                domain={[0, (dataMax: number) => Math.max(dataMax, projection.monthlyBudgetLimit * 1.15)]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              />

              {/* Linear Budget Guide */}
              {showProratedPace && (
                <Line
                  type="linear"
                  dataKey="proratedBudget"
                  name="Linear Target Pace"
                  stroke="#3B82F6"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                />
              )}

              {/* Projected Spend Area */}
              <Area
                type="monotone"
                dataKey="projectedSpend"
                name="Projected Trajectory"
                stroke={projection.isBreachProjected ? '#DC2626' : '#7C3AED'}
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#projSpendGradient)"
                dot={false}
              />

              {/* Actual Spend Area */}
              <Area
                type="monotone"
                dataKey="actualSpend"
                name="Actual Spend to Date"
                stroke="#168A45"
                strokeWidth={2.5}
                fill="url(#actualSpendGradient)"
                dot={{ r: 2.5, fill: '#168A45', strokeWidth: 1 }}
              />

              {/* Budget Limit Reference Line */}
              {showCeiling && (
                <ReferenceLine
                  y={projection.monthlyBudgetLimit}
                  stroke="#DC2626"
                  strokeDasharray="6 6"
                  strokeWidth={2}
                  label={{
                    value: `Budget Cap: ${formatCompactINR(projection.monthlyBudgetLimit)}`,
                    position: 'insideTopLeft',
                    fill: '#DC2626',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
              )}

              {/* Observation Day Vertical Guide */}
              <ReferenceLine
                x={projection.daysElapsed}
                stroke="#64748B"
                strokeDasharray="3 3"
                label={{
                  value: `As of Day ${projection.daysElapsed}`,
                  position: 'insideBottomRight',
                  fill: '#64748B',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Status Pill Below Chart */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#168A45]"></span>
            <span className="font-semibold text-slate-700">Actual Spend (Day 1 - {projection.daysElapsed}):</span>
            <span className="font-bold text-slate-900">{formatINR(projection.currentSpend)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
            <span className="font-semibold text-slate-700">Projected EOM Spend (Day {projection.daysInMonth}):</span>
            <span className="font-bold text-purple-700">{formatINR(projection.projectedEOMSpend)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
            <span className="font-semibold text-slate-700">Budget Limit:</span>
            <span className="font-bold text-red-700">{formatINR(projection.monthlyBudgetLimit)}</span>
          </div>
        </div>
      </div>

      {/* 5. Executive Insights & Burn Velocity Diagnostic Box */}
      <div
        className={`rounded-2xl p-5 border transition-all ${
          projection.isBreachProjected
            ? 'bg-red-50/70 border-red-200 text-red-900'
            : projection.projectedVariancePercent >= 95
            ? 'bg-amber-50/70 border-amber-200 text-amber-900'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-start space-x-3.5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
              projection.isBreachProjected
                ? 'bg-red-100 text-red-700'
                : projection.projectedVariancePercent >= 95
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-[#0B5D2A]'
            }`}
          >
            {projection.isBreachProjected ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold tracking-tight">
                {projection.isBreachProjected
                  ? 'Urgent: Pacing Indicates Month-End Budget Overrun'
                  : projection.projectedVariancePercent >= 95
                  ? 'Caution: Approaching Budget Ceiling'
                  : 'Positive Outlook: Sustainable Burn Velocity'}
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border">
                {MONTH_NAMES[projection.month]} Burn Velocity Report
              </span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {projection.isBreachProjected ? (
                <>
                  At the current daily burn rate of{' '}
                  <strong className="font-bold">{formatINR(projection.dailyBurnRate)}/day</strong>, the institutional
                  budget of <strong className="font-bold">{formatINR(projection.monthlyBudgetLimit)}</strong> is
                  forecasted to be exhausted by{' '}
                  <strong className="font-bold text-red-700 underline">
                    Day {projection.depletionDay} ({projection.month} {projection.depletionDay})
                  </strong>
                  . This will produce an estimated overrun of{' '}
                  <strong className="font-bold">{formatINR(Math.abs(projection.projectedVariance))}</strong> (
                  {projection.projectedVariancePercent}% of cap). To bring expenditures back under the limit, daily
                  disbursements over the remaining {projection.daysRemaining} days must be capped at{' '}
                  <strong className="font-bold">{formatINR(projection.safeRemainingDailyBurn)}/day</strong>.
                </>
              ) : (
                <>
                  Expenditure velocity is well calibrated. Over the {projection.daysElapsed}-day observation window,
                  the institution has averaged{' '}
                  <strong className="font-bold">{formatINR(projection.dailyBurnRate)}/day</strong> against a linear
                  benchmark of <strong className="font-bold">{formatINR(projection.idealLinearDailyBurn)}/day</strong>.
                  Estimated month-end expenditure is projected at{' '}
                  <strong className="font-bold">{formatINR(projection.projectedEOMSpend)}</strong>, reserving{' '}
                  <strong className="font-bold text-[#0B5D2A]">
                    +{formatINR(projection.projectedVariance)} in budget headroom
                  </strong>{' '}
                  ({(100 - projection.projectedVariancePercent).toFixed(1)}% buffer).
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 6. Category-Wise Burn Rate & Projections Breakdown Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" />
              Category Burn Rate & Projections Breakdown
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Category-level daily burn velocity, month-end forecast, and remaining safe burn thresholds
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-gray-200">
            {projection.categoryProjections.length} Budget Categories Tracked
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Category & Cost Center</th>
                <th className="px-4 py-3 text-right">Monthly Cap</th>
                <th className="px-4 py-3 text-right">Spend to Date</th>
                <th className="px-4 py-3 text-right">Daily Burn</th>
                <th className="px-4 py-3 text-right">Projected EOM</th>
                <th className="px-4 py-3 text-right">Forecast Variance</th>
                <th className="px-4 py-3 text-center">Trajectory Progress</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {projection.categoryProjections.map((cat) => (
                <tr key={cat.categoryId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <div>
                        <div className="font-bold text-slate-900">{cat.categoryName}</div>
                        <div className="text-[10px] text-slate-400">
                          {cat.code} • {cat.department}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-slate-900">
                    {formatINR(cat.monthlyCap)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-slate-700">
                    {formatINR(cat.currentSpend)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-purple-700">
                    {formatINR(cat.dailyBurnRate)}/d
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                    {formatINR(cat.projectedEOMSpend)}
                  </td>
                  <td
                    className={`px-4 py-3.5 text-right font-mono font-bold ${
                      cat.projectedVariance >= 0 ? 'text-[#168A45]' : 'text-red-600'
                    }`}
                  >
                    {cat.projectedVariance >= 0 ? '+' : ''}
                    {formatINR(cat.projectedVariance)}
                  </td>
                  <td className="px-4 py-3.5 w-44">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{cat.projectedVariancePercent}%</span>
                        {cat.depletionDay && (
                          <span className="text-red-600 font-bold">Breach Day {cat.depletionDay}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden relative">
                        {/* Actual spend portion */}
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              (cat.currentSpend / Math.max(1, cat.monthlyCap)) * 100
                            )}%`,
                            backgroundColor: cat.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        cat.status === 'Over Budget'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : cat.status === 'On Track'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      {cat.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
