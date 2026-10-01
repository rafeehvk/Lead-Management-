import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
  Line,
  ComposedChart,
} from 'recharts';
import {
  Building2,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  SlidersHorizontal,
  AlertTriangle,
  CheckCircle2,
  Download,
  Search,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Lightbulb,
  Sparkles,
  Percent,
  Layers,
  ChevronRight,
  DollarSign,
  FileText,
  Clock,
  Check,
  RefreshCw,
  ExternalLink,
  Briefcase,
  X,
} from 'lucide-react';
import {
  VendorSpendBudgetContribution,
  VendorSpendAnalysisSummary,
  MonthShort,
  Vendor,
} from '../../types/finance';
import { financeStorage } from '../../services/financeStorageService';

interface VendorSpendBudgetContributionViewProps {
  currentUserName?: string;
  userRole?: string;
  onNavigateTab?: (tab: string) => void;
  onSelectVendorInDirectory?: (vendorId: string) => void;
}

export const VendorSpendBudgetContributionView: React.FC<VendorSpendBudgetContributionViewProps> = ({
  currentUserName = 'Finance Administrator',
  userRole = 'Admin',
  onNavigateTab,
  onSelectVendorInDirectory,
}) => {
  // Filters & State
  const [timeframe, setTimeframe] = useState<'Annual' | 'Monthly'>('Monthly');
  const [selectedMonth, setSelectedMonth] = useState<MonthShort>('Sep');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedRisk, setSelectedRisk] = useState<'All' | 'High' | 'Moderate' | 'Low'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayMetric, setDisplayMetric] = useState<'budgetContribution' | 'categoryShare' | 'totalSpend'>('budgetContribution');
  const [chartViewMode, setChartViewMode] = useState<'bar' | 'pareto' | 'distribution'>('bar');

  // Simulation Sandbox State
  const [simulatedSavingsRate, setSimulatedSavingsRate] = useState<number>(12); // 12% default renegotiation target
  const [selectedVendorsForSavings, setSelectedVendorsForSavings] = useState<string[]>([]);

  // Drilldown Modal
  const [drilldownVendor, setDrilldownVendor] = useState<VendorSpendBudgetContribution | null>(null);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Currency formatters
  const formatINR = (val: number): string => `₹${Math.round(val).toLocaleString('en-IN')}`;

  const formatCompactINR = (val: number): string => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  // Fetch dynamic analysis data
  const analysisData: VendorSpendAnalysisSummary = useMemo(() => {
    return financeStorage.getVendorSpendBudgetContributionAnalysis({
      timeframe,
      month: selectedMonth,
      year: 2026,
    });
  }, [timeframe, selectedMonth]);

  // Filtered vendor contributions list
  const filteredVendors = useMemo(() => {
    return analysisData.vendorContributions.filter((v) => {
      const matchesSearch =
        searchQuery === '' ||
        v.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.vendorCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDept = selectedDepartment === 'All' || v.department === selectedDepartment;
      const matchesRisk = selectedRisk === 'All' || v.concentrationRisk === selectedRisk;

      return matchesSearch && matchesDept && matchesRisk;
    });
  }, [analysisData, searchQuery, selectedDepartment, selectedRisk]);

  // Initialize selected vendors for simulation with top 3
  React.useEffect(() => {
    if (analysisData.vendorContributions.length > 0 && selectedVendorsForSavings.length === 0) {
      setSelectedVendorsForSavings(analysisData.vendorContributions.slice(0, 3).map((v) => v.vendorId));
    }
  }, [analysisData]);

  // Simulation calculations
  const simulationResults = useMemo(() => {
    const targetVendors = analysisData.vendorContributions.filter((v) =>
      selectedVendorsForSavings.includes(v.vendorId)
    );
    const targetSpend = targetVendors.reduce((sum, v) => sum + v.effectiveSpend, 0);
    const estimatedSavingsAnnual = Math.round(targetSpend * (simulatedSavingsRate / 100) * (timeframe === 'Monthly' ? 12 : 1));
    const estimatedSavingsMonthly = Math.round(targetSpend * (simulatedSavingsRate / 100));
    const newProcurementSpend = Math.max(0, analysisData.totalProcurementSpend - estimatedSavingsMonthly);
    const originalBudget = analysisData.totalInstitutionBudget;
    const newBudgetShare = originalBudget > 0 ? (newProcurementSpend / originalBudget) * 100 : 0;
    const budgetShareReduction = analysisData.procurementToBudgetRatio - newBudgetShare;

    return {
      targetSpend,
      estimatedSavingsAnnual,
      estimatedSavingsMonthly,
      newProcurementSpend,
      budgetShareReduction: Math.max(0, budgetShareReduction),
      count: targetVendors.length,
    };
  }, [analysisData, selectedVendorsForSavings, simulatedSavingsRate, timeframe]);

  // Recharts Bar Data
  const chartData = useMemo(() => {
    return filteredVendors.map((v) => ({
      vendorName: v.vendorName.length > 18 ? v.vendorName.substring(0, 18) + '…' : v.vendorName,
      fullVendorName: v.vendorName,
      vendorCode: v.vendorCode,
      categoryName: v.categoryName,
      spendINR: v.effectiveSpend,
      spendLakhs: parseFloat((v.effectiveSpend / 100000).toFixed(2)),
      totalBudgetContributionPercent: v.totalBudgetContributionPercent,
      categorySpendSharePercent: v.categorySpendSharePercent,
      procurementSharePercent: v.procurementSharePercent,
      cumulativeProcurementPercent: v.cumulativeProcurementPercent,
      concentrationRisk: v.concentrationRisk,
      primaryCostDriver: v.primaryCostDriver,
      color:
        v.concentrationRisk === 'High'
          ? '#DC2626'
          : v.concentrationRisk === 'Moderate'
          ? '#D97706'
          : '#168A45',
    }));
  }, [filteredVendors]);

  // Pie chart distribution data (Top 5 + Others)
  const pieData = useMemo(() => {
    const sorted = [...analysisData.vendorContributions].sort((a, b) => b.effectiveSpend - a.effectiveSpend);
    const top5 = sorted.slice(0, 5);
    const others = sorted.slice(5);
    const othersSpend = others.reduce((sum, v) => sum + v.effectiveSpend, 0);

    const colors = ['#168A45', '#2563EB', '#7C3AED', '#D97706', '#0D9488', '#94A3B8'];

    const result = top5.map((v, i) => ({
      name: v.vendorName.split(' ')[0] + ' (' + v.vendorCode + ')',
      value: v.effectiveSpend,
      percent: v.procurementSharePercent,
      color: colors[i % colors.length],
    }));

    if (othersSpend > 0) {
      const othersShare = analysisData.totalProcurementSpend > 0
        ? parseFloat(((othersSpend / analysisData.totalProcurementSpend) * 100).toFixed(1))
        : 0;
      result.push({
        name: `Other Suppliers (${others.length})`,
        value: othersSpend,
        percent: othersShare,
        color: colors[5],
      });
    }

    return result;
  }, [analysisData]);

  // Export CSV of Vendor Spend vs Budget Contribution
  const exportContributionCSV = () => {
    const headers = [
      'Rank',
      'Supplier Name',
      'Supplier Code',
      'Department',
      'Budget Category',
      'Effective Spend (INR)',
      'Total Invoiced (INR)',
      'Total Paid (INR)',
      'Pending Liabilities (INR)',
      'Category Budget Cap (INR)',
      'Share of Category Budget (%)',
      'Total Institutional Budget (INR)',
      'Total Budget Contribution (%)',
      'Share of Procurement (%)',
      'Cumulative Procurement (%)',
      'Concentration Risk',
      'Primary Cost Driver',
      'Recommended Cost-Optimization Strategy',
      'Estimated Potential Annual Savings (INR)',
    ];

    const rows = analysisData.vendorContributions.map((v) => [
      v.rank,
      `"${v.vendorName.replace(/"/g, '""')}"`,
      v.vendorCode,
      v.department,
      `"${v.categoryName.replace(/"/g, '""')}"`,
      v.effectiveSpend,
      v.totalInvoiced,
      v.totalPaid,
      v.totalPending,
      v.categoryBudgetCap,
      `${v.categorySpendSharePercent}%`,
      v.totalInstitutionBudget,
      `${v.totalBudgetContributionPercent}%`,
      `${v.procurementSharePercent}%`,
      `${v.cumulativeProcurementPercent}%`,
      v.concentrationRisk,
      `"${v.primaryCostDriver.replace(/"/g, '""')}"`,
      `"${v.costOptimizationStrategy.replace(/"/g, '""')}"`,
      v.potentialAnnualSavings,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `MYSAR_Vendor_Spend_vs_Total_Budget_Contribution_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Spend vs Budget Contribution analysis exported to CSV!');
  };

  // Toggle vendor selection for simulation
  const toggleVendorForSimulation = (vendorId: string) => {
    setSelectedVendorsForSavings((prev) =>
      prev.includes(vendorId) ? prev.filter((id) => id !== vendorId) : [...prev, vendorId]
    );
  };

  const selectAllVendorsForSimulation = () => {
    if (selectedVendorsForSavings.length === analysisData.vendorContributions.length) {
      setSelectedVendorsForSavings([]);
    } else {
      setSelectedVendorsForSavings(analysisData.vendorContributions.map((v) => v.vendorId));
    }
  };

  return (
    <div id="vendor-spend-budget-contribution-view" className="space-y-6 animate-in fade-in duration-200">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-xl bg-slate-900 text-white shadow-xl text-xs font-medium border border-slate-800 animate-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header & Executive Overview */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5 flex-wrap">
              <span className="p-2 bg-purple-50 rounded-xl text-purple-700 border border-purple-200/80">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Spend per Vendor vs. Total Budget Contribution
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Procurement Analytics & Cost Optimization
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-3xl">
              Identifies which suppliers absorb the largest share of departmental caps and institutional operating
              budget. Highlights single-supplier concentration risk, Pareto distribution, and actionable contract
              renegotiation levers.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe selector */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                id="btn-timeframe-monthly"
                onClick={() => setTimeframe('Monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'Monthly'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly (Sep 2026)
              </button>
              <button
                type="button"
                id="btn-timeframe-annual"
                onClick={() => setTimeframe('Annual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timeframe === 'Annual'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Annual (FY 2026)
              </button>
            </div>

            {/* Export CSV button */}
            <button
              type="button"
              id="btn-export-contribution-csv"
              onClick={exportContributionCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Download full analysis as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Analysis</span>
            </button>
          </div>
        </div>

        {/* 2. Top Metric KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-gray-100">
          {/* Total Procurement vs Budget Ratio */}
          <div id="metric-procurement-ratio" className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">External Procurement Share</span>
              <span className="p-1.5 rounded-lg bg-blue-100/60 text-blue-700">
                <Percent className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {analysisData.procurementToBudgetRatio}%
              </span>
              <span className="text-xs text-slate-500">of Total Budget</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {formatCompactINR(analysisData.totalProcurementSpend)} of{' '}
              {formatCompactINR(analysisData.totalInstitutionBudget)} cap
            </div>
          </div>

          {/* Top 3 Supplier Concentration */}
          <div id="metric-top3-concentration" className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Top 3 Vendor Concentration</span>
              <span className="p-1.5 rounded-lg bg-purple-100/60 text-purple-700">
                <Layers className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-700">
                {analysisData.topVendorsConcentrationRatio}%
              </span>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                High Pareto
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">Top 3 of {analysisData.totalActiveVendors} suppliers</div>
          </div>

          {/* Highest Budget Consumer */}
          <div id="metric-highest-consumer" className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Largest Budget Consumer</span>
              <span className="p-1.5 rounded-lg bg-rose-100/60 text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                {analysisData.highestBudgetVendor?.vendorName.split(' ')[0] || 'None'}
              </span>
              <span className="text-xs font-bold text-rose-700">
                {analysisData.highestBudgetVendor?.totalBudgetContributionPercent || 0}% budget
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500 truncate">
              {formatCompactINR(analysisData.highestBudgetVendor?.effectiveSpend || 0)} ({analysisData.highestBudgetVendor?.categorySpendSharePercent || 0}% of category)
            </div>
          </div>

          {/* Identified Optimization Potential */}
          <div id="metric-potential-savings" className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Identified Annual Savings</span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-[#168A45]">
                <Sparkles className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-[#0B5D2A]">
                {formatCompactINR(analysisData.totalPotentialSavings)}
              </span>
              <span className="text-xs font-semibold text-emerald-700">/ year</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-700 font-medium">
              Via volume tiers, reserved plans & terms
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visual Charts & Decision Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Column (2 cols wide) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
          {/* Chart Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#168A45]" />
                <span>Supplier Spend vs. Total Budget Contribution Benchmark</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Horizontal comparison of effective spend and relative proportion of institutional budget
              </p>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartViewMode('bar')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartViewMode === 'bar' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Spend & Budget %
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('pareto')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartViewMode === 'pareto' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pareto Curve
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('distribution')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  chartViewMode === 'distribution' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Category Share
              </button>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-[340px] w-full pt-2">
            {chartViewMode === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="vendorCode"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `₹${val}L`}
                    domain={[0, 'auto']}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#7C3AED"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, 20]}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-[220px]">
                          <div className="font-bold text-sm text-slate-100 border-b border-slate-700 pb-1 flex items-center justify-between">
                            <span>{data.fullVendorName}</span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                data.concentrationRisk === 'High'
                                  ? 'bg-rose-900 text-rose-200'
                                  : data.concentrationRisk === 'Moderate'
                                  ? 'bg-amber-900 text-amber-200'
                                  : 'bg-emerald-900 text-emerald-200'
                              }`}
                            >
                              {data.concentrationRisk} Risk
                            </span>
                          </div>
                          <div className="text-slate-300 text-[11px]">{data.categoryName}</div>
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
                            <div>
                              <span className="text-slate-400 block">Effective Spend:</span>
                              <strong className="text-emerald-400">{formatINR(data.spendINR)}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Total Budget Share:</span>
                              <strong className="text-purple-300">{data.totalBudgetContributionPercent}%</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Category Cap Share:</span>
                              <strong className="text-blue-300">{data.categorySpendSharePercent}%</strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Procurement Share:</span>
                              <strong className="text-amber-300">{data.procurementSharePercent}%</strong>
                            </div>
                          </div>
                          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400 italic">
                            {data.primaryCostDriver}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-semibold text-slate-700">{value}</span>
                    )}
                  />
                  <ReferenceLine
                    yAxisId="right"
                    y={8}
                    stroke="#EF4444"
                    strokeDasharray="4 4"
                    label={{
                      value: 'High Budget Contribution Threshold (8%)',
                      position: 'top',
                      fill: '#EF4444',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="spendLakhs"
                    name="Spend (₹ Lakhs)"
                    radius={[6, 6, 0, 0]}
                    fill="#168A45"
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.concentrationRisk === 'High'
                            ? '#EF4444'
                            : entry.concentrationRisk === 'Moderate'
                            ? '#F59E0B'
                            : '#168A45'
                        }
                      />
                    ))}
                  </Bar>
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalBudgetContributionPercent"
                    name="Total Budget Contribution %"
                    stroke="#7C3AED"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#7C3AED' }}
                    activeDot={{ r: 6 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartViewMode === 'pareto' && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="vendorCode"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, 40]}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#2563EB"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, 100]}
                  />
                  <RechartsTooltip
                    formatter={(val: any, name: any) => [
                      `${val}%`,
                      name === 'procurementSharePercent'
                        ? 'Share of Procurement Pool'
                        : 'Cumulative Pareto %',
                    ]}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine
                    yAxisId="right"
                    y={80}
                    stroke="#DC2626"
                    strokeDasharray="4 4"
                    label={{
                      value: 'Pareto 80% Cutoff',
                      position: 'insideTopLeft',
                      fill: '#DC2626',
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="procurementSharePercent"
                    name="Individual Share (%)"
                    fill="#3B82F6"
                    radius={[6, 6, 0, 0]}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulativeProcurementPercent"
                    name="Cumulative Pareto %"
                    stroke="#DC2626"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#DC2626' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {chartViewMode === 'distribution' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="vendorCode"
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748B"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `${val}%`}
                    domain={[0, 100]}
                  />
                  <RechartsTooltip
                    formatter={(val: any) => [`${val}%`, 'Share of Category Budget Cap']}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <ReferenceLine
                    y={50}
                    stroke="#D97706"
                    strokeDasharray="4 4"
                    label={{
                      value: '50% of Category Cap Absorbed',
                      position: 'top',
                      fill: '#D97706',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                  <Bar
                    dataKey="categorySpendSharePercent"
                    name="Category Budget Absorption (%)"
                    radius={[6, 6, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cat-cell-${index}`}
                        fill={
                          entry.categorySpendSharePercent > 60
                            ? '#DC2626'
                            : entry.categorySpendSharePercent > 30
                            ? '#D97706'
                            : '#0D9488'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>High Contribution (&ge;7% total or &ge;45% category)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Moderate (2.5% - 7%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Low (&lt;2.5%)</span>
              </span>
            </div>
            <span className="text-[11px] italic">Based on {timeframe} active billing commitments</span>
          </div>
        </div>

        {/* Right Column: Share of Procurement Pool Donut */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-purple-600" />
                <span>Procurement Pool Share</span>
              </h2>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Top 5 Breakdown
              </span>
            </div>

            {/* Donut Chart */}
            <div className="h-[210px] w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`slice-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [formatINR(Number(val)), 'Spend']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & breakdown list */}
            <div className="space-y-2 mt-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 truncate max-w-[170px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-700 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-slate-500 font-mono text-[11px]">{formatCompactINR(item.value)}</span>
                    <span className="font-bold text-slate-900 w-10 text-right">{item.percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 text-xs text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-purple-700 shrink-0" />
              <span>Cost Optimization Takeaway</span>
            </div>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Consolidating or renegotiating just the top 2 suppliers can lower total external procurement spend by up to{' '}
              <strong>14.5%</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Strategic Renegotiation Sandbox (Cost-Optimization Simulator) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Interactive Decision Sandbox
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Simulate Cost-Optimization & Renegotiation Scenarios
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Adjust the target discount rate and select which high-consumption suppliers to target.
              The model immediately projects institutional cash savings and the reduction in budget contribution.
            </p>

            {/* Slider Control */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Target Renegotiation Discount / Efficiency Rate:</span>
                <span className="font-bold text-emerald-400 text-sm px-2 py-0.5 bg-emerald-950/60 rounded border border-emerald-800">
                  {simulatedSavingsRate}% Discount
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="1"
                value={simulatedSavingsRate}
                onChange={(e) => setSimulatedSavingsRate(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>5% (Conservative)</span>
                <span>12% (Recommended Baseline)</span>
                <span>20% (Aggressive Tier)</span>
                <span>25% (Consortium Buying)</span>
              </div>
            </div>
          </div>

          {/* Simulation Output Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-[420px]">
            {/* Projected Annual Savings */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] font-semibold text-slate-400 block">Projected Annual Savings</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 block">
                {formatCompactINR(simulationResults.estimatedSavingsAnnual)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Across {simulationResults.count} targeted suppliers
              </span>
            </div>

            {/* Monthly Budget Relief */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80">
              <span className="text-[11px] font-semibold text-slate-400 block">Monthly Cash Relief</span>
              <span className="text-xl sm:text-2xl font-bold text-purple-300 mt-1 block">
                {formatCompactINR(simulationResults.estimatedSavingsMonthly)}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Lowers budget load by {simulationResults.budgetShareReduction.toFixed(1)}%
              </span>
            </div>

            {/* Vendor Selector Pill Bar */}
            <div className="col-span-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1.5">
                <span>Targeted Suppliers ({simulationResults.count}):</span>
                <button
                  type="button"
                  onClick={selectAllVendorsForSimulation}
                  className="text-emerald-400 hover:underline text-[10px] font-semibold cursor-pointer"
                >
                  {selectedVendorsForSavings.length === analysisData.vendorContributions.length
                    ? 'Deselect All'
                    : 'Select All Suppliers'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {analysisData.vendorContributions.map((v) => {
                  const isSelected = selectedVendorsForSavings.includes(v.vendorId);
                  return (
                    <button
                      type="button"
                      key={v.vendorId}
                      onClick={() => toggleVendorForSimulation(v.vendorId)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/60 font-semibold'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{v.vendorCode}</span>
                      <span className="text-[10px] opacity-75">({v.totalBudgetContributionPercent}%)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Detailed Ranked Performance & Cost-Optimization Decision Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4.5 h-4.5 text-[#168A45]" />
              <span>Supplier Budget Absorption & Optimization Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked by total effective spend and institutional budget contribution percentage
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search vendor or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Departments</option>
              <option value="IT & Tech">IT & Tech</option>
              <option value="Operations">Operations</option>
              <option value="Academic">Academic</option>
              <option value="Administration">Administration</option>
              <option value="Finance & Accounts">Finance & Accounts</option>
            </select>

            {/* Risk Filter */}
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value as any)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Concentration</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/70 text-slate-700 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4 min-w-[200px]">Supplier Details</th>
                <th className="py-3 px-4 min-w-[160px]">Linked Category & Cap</th>
                <th className="py-3 px-4 text-right min-w-[110px]">Spend (INR)</th>
                <th className="py-3 px-4 min-w-[140px]">Total Budget Contribution</th>
                <th className="py-3 px-4 min-w-[120px]">Category Cap Share</th>
                <th className="py-3 px-4 min-w-[260px]">Cost-Optimization Strategy</th>
                <th className="py-3 px-4 text-right min-w-[110px]">Potential Savings</th>
                <th className="py-3 px-4 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No suppliers match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((v) => {
                  return (
                    <tr
                      key={v.vendorId}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setDrilldownVendor(v)}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            v.rank === 1
                              ? 'bg-rose-100 text-rose-800'
                              : v.rank === 2
                              ? 'bg-amber-100 text-amber-800'
                              : v.rank === 3
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          #{v.rank}
                        </span>
                      </td>

                      {/* Supplier Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {v.vendorName}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {v.vendorCode}
                          </span>
                          <span className="text-[11px] text-slate-500">{v.department}</span>
                          <span className="text-[10px] text-slate-400 font-medium">({v.paymentTerms})</span>
                        </div>
                      </td>

                      {/* Linked Category & Cap */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 text-[11px] truncate max-w-[160px]">
                          {v.categoryName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Cap: {formatCompactINR(v.categoryBudgetCap)}
                        </div>
                      </td>

                      {/* Effective Spend */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-slate-900 text-sm">{formatINR(v.effectiveSpend)}</span>
                        {v.totalPending > 0 && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            {formatCompactINR(v.totalPending)} pending
                          </div>
                        )}
                      </td>

                      {/* Total Budget Contribution % */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900 text-xs">
                            {v.totalBudgetContributionPercent}%
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                              v.concentrationRisk === 'High'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : v.concentrationRisk === 'Moderate'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {v.concentrationRisk} Risk
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              v.concentrationRisk === 'High'
                                ? 'bg-rose-500'
                                : v.concentrationRisk === 'Moderate'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, v.totalBudgetContributionPercent * 5)}%` }}
                          />
                        </div>
                      </td>

                      {/* Category Cap Share */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 text-xs">
                            {v.categorySpendSharePercent}%
                          </span>
                          <span className="text-[10px] text-slate-400">of cap</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              v.categorySpendSharePercent > 60
                                ? 'bg-rose-500'
                                : v.categorySpendSharePercent > 30
                                ? 'bg-amber-500'
                                : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, v.categorySpendSharePercent)}%` }}
                          />
                        </div>
                      </td>

                      {/* Cost-Optimization Strategy */}
                      <td className="py-3.5 px-4">
                        <p className="text-[11px] text-slate-700 leading-tight font-medium">
                          {v.costOptimizationStrategy}
                        </p>
                        <span className="text-[10px] text-slate-400 italic block mt-0.5">
                          Driver: {v.primaryCostDriver}
                        </span>
                      </td>

                      {/* Potential Savings */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-emerald-700 text-xs block">
                          +{formatCompactINR(v.potentialAnnualSavings)}
                        </span>
                        <span className="text-[10px] text-slate-400">per annum</span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDrilldownVendor(v);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-all cursor-pointer"
                          title="View Vendor Optimization Profile"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Drilldown Modal */}
      {drilldownVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{drilldownVendor.vendorName}</h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-mono bg-white px-1.5 py-0.2 rounded border border-gray-200 font-bold text-slate-700">
                      {drilldownVendor.vendorCode}
                    </span>
                    <span>{drilldownVendor.department}</span>
                    <span>&bull;</span>
                    <span>Rank #{drilldownVendor.rank} in Budget Absorption</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrilldownVendor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Effective Spend</span>
                  <span className="text-lg font-bold text-slate-900 mt-0.5 block">
                    {formatINR(drilldownVendor.effectiveSpend)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {drilldownVendor.invoicesCount} invoices on file
                  </span>
                </div>

                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/80">
                  <span className="text-[11px] text-purple-800 font-medium block">Total Budget Contribution</span>
                  <span className="text-lg font-bold text-purple-900 mt-0.5 block">
                    {drilldownVendor.totalBudgetContributionPercent}%
                  </span>
                  <span className="text-[10px] text-purple-700">
                    {drilldownVendor.concentrationRisk} Concentration
                  </span>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                  <span className="text-[11px] text-emerald-800 font-medium block">Category Cap Share</span>
                  <span className="text-lg font-bold text-emerald-900 mt-0.5 block">
                    {drilldownVendor.categorySpendSharePercent}%
                  </span>
                  <span className="text-[10px] text-emerald-700">
                    Cap: {formatCompactINR(drilldownVendor.categoryBudgetCap)}
                  </span>
                </div>
              </div>

              {/* Primary Cost Driver & Strategy Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Primary Operational Cost Driver
                  </span>
                  <p className="text-xs text-slate-800 mt-1 font-medium leading-relaxed">
                    {drilldownVendor.primaryCostDriver}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <span className="text-xs font-bold text-purple-900 uppercase tracking-wider block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Recommended Cost-Optimization Levers
                  </span>
                  <p className="text-xs text-slate-800 mt-1 font-semibold leading-relaxed">
                    {drilldownVendor.costOptimizationStrategy}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Estimated Potential Annual Savings:</span>
                    <strong className="text-emerald-700 text-sm font-bold">
                      +{formatINR(drilldownVendor.potentialAnnualSavings)} / yr
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Current Payment Terms:</span>
                    <span className="font-semibold text-slate-800">{drilldownVendor.paymentTerms}</span>
                  </div>
                </div>
              </div>

              {/* Action recommendations checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Procurement Officer Action Items:</span>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0 mt-0.5" />
                    <span>
                      Initiate vendor contract review 60 days prior to renewal with multi-tier volume pricing.
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0 mt-0.5" />
                    <span>
                      Audit invoices for SLA compliance and apply prompt settlement discounts (e.g. 2/10 Net 30).
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0 mt-0.5" />
                    <span>
                      Cross-verify vendor billings against departmental budget category limits before CFO sign-off.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  if (onSelectVendorInDirectory) {
                    onSelectVendorInDirectory(drilldownVendor.vendorId);
                  }
                  setDrilldownVendor(null);
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
              >
                <span>View in Supplier Master Directory</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  showToast(`Optimization notice for ${drilldownVendor.vendorName} noted!`);
                  setDrilldownVendor(null);
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
