import React, { useState, useEffect, useMemo } from 'react';
import {
  SlidersHorizontal,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Save,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Building2,
  Check,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import {
  CategoryBudgetCapConfig,
  FinanceModuleSettings,
  MonthShort,
  MonthlyCategoryCapSummary,
} from '../../types/finance';
import { financeStorage } from '../../services/financeStorageService';

interface FinanceBudgetPlannerProps {
  currentUserName?: string;
  userRole?: string;
  onOpenSettingsTab?: () => void;
  onNavigateToDashboard?: () => void;
}

const ALL_MONTHS: MonthShort[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTH_NAMES: Record<MonthShort, string> = {
  Jan: 'January',
  Feb: 'February',
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December',
};

const DEPARTMENTS = [
  'Academic',
  'IT & Tech',
  'Administration',
  'Operations',
  'Finance & Accounts',
  'Academic & Admin',
];

const COLOR_PRESETS = [
  '#168A45', // Emerald
  '#0284C7', // Sky blue
  '#7C3AED', // Purple
  '#D97706', // Amber
  '#0D9488', // Teal
  '#E11D48', // Rose/Red
  '#4F46E5', // Indigo
  '#EA580C', // Orange
  '#059669', // Mint
  '#475569', // Slate
];

export const FinanceBudgetPlanner: React.FC<FinanceBudgetPlannerProps> = ({
  currentUserName = 'Finance Administrator',
  userRole = 'Admin',
  onNavigateToDashboard,
}) => {
  // Navigation tabs within planner
  const [plannerTab, setPlannerTab] = useState<'matrix' | 'monthly' | 'settings'>('matrix');

  // Loaded data from storage
  const [categoryCaps, setCategoryCaps] = useState<CategoryBudgetCapConfig[]>([]);
  const [settings, setSettings] = useState<FinanceModuleSettings>(() =>
    financeStorage.getFinanceSettings()
  );
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlyCategoryCapSummary[]>([]);

  // Selected state for monthly drilldown
  const [selectedMonth, setSelectedMonth] = useState<MonthShort>('Sep');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Status message
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  // Edit/Add modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryBudgetCapConfig | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<{
    categoryId: string;
    categoryName: string;
    code: string;
    department: string;
    annualCap: number;
    color: string;
    description: string;
    alertThresholdPercent: number;
    isHardCap: boolean;
    distributionType: 'even' | 'custom';
  }>({
    categoryId: '',
    categoryName: '',
    code: '',
    department: 'Operations',
    annualCap: 1200000,
    color: '#168A45',
    description: '',
    alertThresholdPercent: 90,
    isHardCap: false,
    distributionType: 'even',
  });

  // Settings form state
  const [settingsFormData, setSettingsFormData] = useState<FinanceModuleSettings>(settings);
  const [hasUnsavedSettings, setHasUnsavedSettings] = useState(false);

  // Quick adjustment dropdown states
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);

  // Load data
  const loadPlannerData = () => {
    const caps = financeStorage.getCategoryBudgetCaps();
    const stt = financeStorage.getFinanceSettings();
    const summaries = financeStorage.getMonthlyCategorySummaries(selectedYear);

    setCategoryCaps(caps);
    setSettings(stt);
    setSettingsFormData(stt);
    setMonthlySummaries(summaries);
  };

  useEffect(() => {
    loadPlannerData();

    const handleDataChange = () => {
      loadPlannerData();
    };

    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => {
      window.removeEventListener('mysar_finance_data_changed', handleDataChange);
    };
  }, [selectedYear]);

  // Show auto-clearing toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Format currency in INR
  const formatINR = (val: number): string => {
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // Format compact
  const formatCompactINR = (val: number): string => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)} K`;
    return `₹${val}`;
  };

  // Total annual budget cap across all categories
  const grandAnnualCap = useMemo(() => {
    return categoryCaps.reduce((acc, cat) => acc + cat.annualCap, 0);
  }, [categoryCaps]);

  // Monthly totals across all categories
  const monthlyTotals = useMemo(() => {
    const totals: Record<MonthShort, number> = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
    };
    categoryCaps.forEach((cat) => {
      ALL_MONTHS.forEach((m) => {
        totals[m] += cat.monthlyCaps[m] || 0;
      });
    });
    return totals;
  }, [categoryCaps]);

  // Handle cell edit in 12-Month Matrix
  const handleMonthlyCapChange = (categoryId: string, month: MonthShort, valStr: string) => {
    const parsed = parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
    const updated = categoryCaps.map((cat) => {
      if (cat.categoryId === categoryId) {
        const newMonthlyCaps = { ...cat.monthlyCaps, [month]: parsed };
        const newAnnualCap = (Object.values(newMonthlyCaps) as number[]).reduce((a, b) => a + b, 0);
        return {
          ...cat,
          monthlyCaps: newMonthlyCaps,
          annualCap: newAnnualCap,
        };
      }
      return cat;
    });

    setCategoryCaps(updated);
  };

  // Save all category caps to storage
  const handleSaveCategoryCaps = (customCaps?: CategoryBudgetCapConfig[]) => {
    const capsToSave = customCaps || categoryCaps;
    financeStorage.saveCategoryBudgetCaps(capsToSave, settings.autoSyncMonthlyBudgetLimits);
    showToast(
      `Monthly category budget caps saved successfully! ${
        settings.autoSyncMonthlyBudgetLimits
          ? 'Monthly institutional budget limits synchronized.'
          : ''
      }`,
      'success'
    );
  };

  // Quick actions on a category
  const handleCopyMonthToAll = (categoryId: string, sourceMonth: MonthShort) => {
    const updated = categoryCaps.map((cat) => {
      if (cat.categoryId === categoryId) {
        const sourceVal = cat.monthlyCaps[sourceMonth] || 0;
        const newMonthlyCaps: Record<MonthShort, number> = {
          Jan: sourceVal, Feb: sourceVal, Mar: sourceVal, Apr: sourceVal,
          May: sourceVal, Jun: sourceVal, Jul: sourceVal, Aug: sourceVal,
          Sep: sourceVal, Oct: sourceVal, Nov: sourceVal, Dec: sourceVal,
        };
        return {
          ...cat,
          monthlyCaps: newMonthlyCaps,
          annualCap: sourceVal * 12,
        };
      }
      return cat;
    });

    setCategoryCaps(updated);
    handleSaveCategoryCaps(updated);
    setActiveActionMenu(null);
    showToast(
      `Copied ${sourceMonth} cap (${formatINR(
        categoryCaps.find((c) => c.categoryId === categoryId)?.monthlyCaps[sourceMonth] || 0
      )}) to all 12 months.`,
      'info'
    );
  };

  const handleDistributeEvenly = (categoryId: string) => {
    const targetCat = categoryCaps.find((c) => c.categoryId === categoryId);
    if (!targetCat) return;

    const monthlyEven = Math.round(targetCat.annualCap / 12);
    const updated = categoryCaps.map((cat) => {
      if (cat.categoryId === categoryId) {
        const newMonthlyCaps: Record<MonthShort, number> = {
          Jan: monthlyEven, Feb: monthlyEven, Mar: monthlyEven, Apr: monthlyEven,
          May: monthlyEven, Jun: monthlyEven, Jul: monthlyEven, Aug: monthlyEven,
          Sep: monthlyEven, Oct: monthlyEven, Nov: monthlyEven, Dec: monthlyEven,
        };
        return {
          ...cat,
          monthlyCaps: newMonthlyCaps,
          annualCap: monthlyEven * 12,
        };
      }
      return cat;
    });

    setCategoryCaps(updated);
    handleSaveCategoryCaps(updated);
    setActiveActionMenu(null);
    showToast(`Distributed ${formatINR(targetCat.annualCap)} evenly (~${formatINR(monthlyEven)}/mo).`, 'info');
  };

  const handleAdjustByPercentage = (categoryId: string, percent: number) => {
    const updated = categoryCaps.map((cat) => {
      if (cat.categoryId === categoryId) {
        const multiplier = 1 + percent / 100;
        const newMonthlyCaps: Record<MonthShort, number> = {} as any;
        ALL_MONTHS.forEach((m) => {
          newMonthlyCaps[m] = Math.round((cat.monthlyCaps[m] || 0) * multiplier);
        });
        const newAnnualCap = (Object.values(newMonthlyCaps) as number[]).reduce((a, b) => a + b, 0);
        return {
          ...cat,
          monthlyCaps: newMonthlyCaps,
          annualCap: newAnnualCap,
        };
      }
      return cat;
    });

    setCategoryCaps(updated);
    handleSaveCategoryCaps(updated);
    setActiveActionMenu(null);
    showToast(`Adjusted category caps by ${percent > 0 ? '+' : ''}${percent}%.`, 'info');
  };

  // Open Edit Category Modal
  const handleOpenEditCategory = (cat: CategoryBudgetCapConfig) => {
    setEditingCategory(cat);
    setCategoryFormData({
      categoryId: cat.categoryId,
      categoryName: cat.categoryName,
      code: cat.code,
      department: cat.department,
      annualCap: cat.annualCap,
      color: cat.color,
      description: cat.description || '',
      alertThresholdPercent: cat.alertThresholdPercent || 90,
      isHardCap: !!cat.isHardCap,
      distributionType: 'custom',
    });
    setIsCategoryModalOpen(true);
    setActiveActionMenu(null);
  };

  // Open Create Category Modal
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    const newId = `CAT-${String(categoryCaps.length + 1).padStart(2, '0')}`;
    setCategoryFormData({
      categoryId: newId,
      categoryName: '',
      code: '',
      department: 'Operations',
      annualCap: 1200000,
      color: COLOR_PRESETS[categoryCaps.length % COLOR_PRESETS.length],
      description: '',
      alertThresholdPercent: 90,
      isHardCap: false,
      distributionType: 'even',
    });
    setIsCategoryModalOpen(true);
  };

  // Submit Category Modal
  const handleSaveCategoryModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryFormData.categoryName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    const code =
      categoryFormData.code.trim() ||
      categoryFormData.categoryName
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);

    let monthlyCaps: Record<MonthShort, number>;

    if (editingCategory) {
      if (categoryFormData.distributionType === 'even') {
        const monthly = Math.round(categoryFormData.annualCap / 12);
        monthlyCaps = {
          Jan: monthly, Feb: monthly, Mar: monthly, Apr: monthly,
          May: monthly, Jun: monthly, Jul: monthly, Aug: monthly,
          Sep: monthly, Oct: monthly, Nov: monthly, Dec: monthly,
        };
      } else {
        monthlyCaps = editingCategory.monthlyCaps;
      }
    } else {
      const monthly = Math.round(categoryFormData.annualCap / 12);
      monthlyCaps = {
        Jan: monthly, Feb: monthly, Mar: monthly, Apr: monthly,
        May: monthly, Jun: monthly, Jul: monthly, Aug: monthly,
        Sep: monthly, Oct: monthly, Nov: monthly, Dec: monthly,
      };
    }

    const newConfig: CategoryBudgetCapConfig = {
      categoryId: editingCategory ? editingCategory.categoryId : categoryFormData.categoryId,
      categoryName: categoryFormData.categoryName.trim(),
      code,
      department: categoryFormData.department,
      annualCap: categoryFormData.annualCap,
      color: categoryFormData.color,
      description: categoryFormData.description.trim(),
      alertThresholdPercent: categoryFormData.alertThresholdPercent,
      isHardCap: categoryFormData.isHardCap,
      monthlyCaps,
    };

    financeStorage.addCategoryCapConfig(newConfig);
    setIsCategoryModalOpen(false);
    showToast(
      editingCategory
        ? `Category '${newConfig.categoryName}' updated successfully.`
        : `New category '${newConfig.categoryName}' added to budget planner.`,
      'success'
    );
  };

  // Delete Category
  const handleDeleteCategory = (categoryId: string) => {
    const cat = categoryCaps.find((c) => c.categoryId === categoryId);
    if (!cat) return;

    if (
      window.confirm(
        `Are you sure you want to delete category "${cat.categoryName}" and its budget caps?`
      )
    ) {
      financeStorage.deleteCategoryCapConfig(categoryId);
      showToast(`Category "${cat.categoryName}" removed.`, 'info');
    }
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    financeStorage.saveFinanceSettings(settingsFormData);
    setSettings(settingsFormData);
    setHasUnsavedSettings(false);
    showToast('Finance module settings & caps governance saved successfully.', 'success');
  };

  // Export Budget Caps to CSV
  const handleExportCapsCsv = () => {
    const headers = [
      'Category ID',
      'Category Name',
      'Code',
      'Department',
      'Annual Cap (INR)',
      ...ALL_MONTHS.map((m) => `${m} Cap (INR)`),
      'Alert Threshold (%)',
      'Hard Cap Policy',
    ];

    const rows = categoryCaps.map((c) => [
      c.categoryId,
      `"${c.categoryName}"`,
      c.code,
      `"${c.department}"`,
      c.annualCap,
      ...ALL_MONTHS.map((m) => c.monthlyCaps[m] || 0),
      `${c.alertThresholdPercent || 90}%`,
      c.isHardCap ? 'Enforced Hard Cap' : 'Soft Advisory Cap',
    ]);

    // Add totals row
    const totalsRow = [
      'TOTAL',
      'Institutional Budget Ceiling',
      'TOTAL-CAPS',
      'All Departments',
      grandAnnualCap,
      ...ALL_MONTHS.map((m) => monthlyTotals[m]),
      `${settings.defaultAlertThresholdPercent}%`,
      '-',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(',')), totalsRow.join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `MYSAR_Category_Budget_Caps_FY${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Budget caps exported to CSV.', 'info');
  };

  // Export JSON Backup
  const handleExportJson = () => {
    const exportPayload = {
      app: 'MYSAR ERP',
      module: 'Finance & Accounts',
      type: 'CategoryBudgetCaps_and_Settings',
      fiscalYear: selectedYear,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUserName,
      settings,
      categoryCaps,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `mysar_finance_budget_caps_fy${selectedYear}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Finance budget settings & caps exported to JSON.', 'info');
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Reset all category budget caps and module settings to institutional standard templates?'
      )
    ) {
      financeStorage.resetFinanceData();
      showToast('Budget caps and settings reset to standard institutional defaults.', 'info');
    }
  };

  // Current selected month summary
  const currentMonthSummary = useMemo(() => {
    return (
      monthlySummaries.find((s) => s.month === selectedMonth) || {
        month: selectedMonth,
        fullMonth: MONTH_NAMES[selectedMonth],
        monthIndex: ALL_MONTHS.indexOf(selectedMonth) + 1,
        year: selectedYear,
        totalMonthlyCap: monthlyTotals[selectedMonth],
        totalActualSpend: 0,
        remainingHeadroom: monthlyTotals[selectedMonth],
        utilizationRate: 0,
        categoryBreakdown: [],
      }
    );
  }, [monthlySummaries, selectedMonth, selectedYear, monthlyTotals]);

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
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header & Context */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-700 shadow-2xs shrink-0 mt-0.5">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Budget Planner & Category Caps
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {settings.planStatus} ({settings.planVersion})
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  FY {selectedYear}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Configure monthly category-wise expenditure ceilings (Salaries, Marketing, Infrastructure, etc.) and finance module governance policies.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {onNavigateToDashboard && (
              <button
                onClick={onNavigateToDashboard}
                className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
              >
                Back to Analytics Chart
              </button>
            )}

            <button
              onClick={handleOpenCreateCategory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Add Category
            </button>

            <button
              onClick={() => handleSaveCategoryCaps()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#168A45] hover:bg-[#127238] shadow-2xs transition-all active:scale-98"
            >
              <Save className="w-4 h-4" />
              Save & Sync Caps
            </button>
          </div>
        </div>

        {/* Admin mode notice */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="font-medium text-slate-700">Administrator Governance Active:</span>
            <span>Monthly caps directly govern institutional variance calculations and voucher approvals.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCapsCsv}
              className="hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleExportJson}
              className="hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* 2. Planner Executive Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Annual Cap */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>TOTAL ANNUAL BUDGET CAP</span>
            <span className="p-1 rounded-md bg-emerald-50 text-[#168A45]">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(grandAnnualCap)}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span className="font-semibold text-slate-700">{categoryCaps.length} categories</span>
            <span>across 12 operating months</span>
          </div>
        </div>

        {/* Average Monthly Cap */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>AVG. MONTHLY BUDGET CEILING</span>
            <span className="p-1 rounded-md bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(Math.round(grandAnnualCap / 12))}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>Min: {formatCompactINR(Math.min(...(Object.values(monthlyTotals) as number[])))}</span>
            <span>•</span>
            <span>Max: {formatCompactINR(Math.max(...(Object.values(monthlyTotals) as number[])))}</span>
          </div>
        </div>

        {/* Selected Month Cap */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>{MONTH_NAMES[selectedMonth].toUpperCase()} CAP LIMIT</span>
            <span className="p-1 rounded-md bg-purple-50 text-purple-600">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatINR(monthlyTotals[selectedMonth])}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Spend: {formatCompactINR(currentMonthSummary.totalActualSpend)}</span>
            <span
              className={`font-semibold ${
                currentMonthSummary.remainingHeadroom >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {currentMonthSummary.remainingHeadroom >= 0 ? 'Headroom: +' : 'Deficit: '}
              {formatCompactINR(Math.abs(currentMonthSummary.remainingHeadroom))}
            </span>
          </div>
        </div>

        {/* Policy & Auto-Sync Status */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1.5">
            <span>CAPS GOVERNANCE POLICY</span>
            <span className="p-1 rounded-md bg-amber-50 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight truncate">
            {settings.enforceHardCaps ? 'Strict Hard Cap' : 'Soft Advisory Cap'}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Alert at: {settings.defaultAlertThresholdPercent}% spend</span>
            <span className="text-emerald-700 font-medium">
              {settings.autoSyncMonthlyBudgetLimits ? 'Auto-Sync On' : 'Manual Sync'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation View Switcher (Matrix vs Monthly vs Settings) */}
      <div className="bg-white border border-gray-200 rounded-2xl p-2 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setPlannerTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              plannerTab === 'matrix'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            12-Month Category Matrix
          </button>

          <button
            onClick={() => setPlannerTab('monthly')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              plannerTab === 'monthly'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#168A45]" />
            Monthly Deep-Dive Planner
          </button>

          <button
            onClick={() => setPlannerTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
              plannerTab === 'settings'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-purple-600" />
            Finance Module Settings
          </button>
        </div>

        {/* Right side helpers */}
        <div className="flex items-center gap-2 px-2">
          <div className="text-xs text-slate-500 hidden md:block">
            Fiscal Year: <span className="font-bold text-slate-800">{selectedYear}</span>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value={2026}>FY 2026 (Active)</option>
            <option value={2025}>FY 2025</option>
            <option value={2027}>FY 2027 (Forecast)</option>
          </select>
        </div>
      </div>

      {/* 4. VIEW 1: 12-Month Category Matrix Grid */}
      {plannerTab === 'matrix' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                12-Month Category Budget Caps Matrix (₹ INR)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit individual monthly category caps directly. Changes recalculate row and column totals instantly.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Quick tip: Click any cell to adjust cap</span>
              <button
                onClick={() => handleSaveCategoryCaps()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-[#168A45] border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Apply Changes
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-gray-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 min-w-[220px]">
                    Expense Category
                  </th>
                  <th className="py-3 px-3 min-w-[110px] text-right">Annual Cap</th>
                  {ALL_MONTHS.map((m) => (
                    <th key={m} className="py-3 px-2 min-w-[95px] text-center">
                      <button
                        onClick={() => {
                          setSelectedMonth(m);
                          setPlannerTab('monthly');
                        }}
                        className="font-bold hover:text-emerald-700 underline decoration-slate-300 underline-offset-2"
                        title={`View ${MONTH_NAMES[m]} details`}
                      >
                        {m}
                      </button>
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center min-w-[90px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryCaps.map((cat) => {
                  const isMenuOpen = activeActionMenu === cat.categoryId;

                  return (
                    <tr key={cat.categoryId} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Category metadata */}
                      <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-slate-50/90 z-10 border-r border-gray-100">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {cat.categoryName}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500">
                              <span className="font-mono text-[10px] bg-slate-100 px-1 py-0.2 rounded text-slate-600">
                                {cat.code}
                              </span>
                              <span>•</span>
                              <span>{cat.department}</span>
                              {cat.isHardCap && (
                                <span className="text-[10px] text-rose-600 bg-rose-50 px-1 rounded font-medium">
                                  Hard Cap
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Annual Cap Sum */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 border-r border-gray-100 bg-slate-50/40">
                        {formatINR(cat.annualCap)}
                      </td>

                      {/* 12 Monthly Inputs */}
                      {ALL_MONTHS.map((m) => {
                        const capVal = cat.monthlyCaps[m] || 0;

                        return (
                          <td key={m} className="py-2 px-1 text-center border-r border-gray-100/60">
                            <input
                              type="number"
                              min="0"
                              step="5000"
                              value={capVal}
                              onChange={(e) =>
                                handleMonthlyCapChange(cat.categoryId, m, e.target.value)
                              }
                              className="w-full text-center font-mono text-xs font-semibold py-1.5 px-1 rounded-md border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-emerald-50/30 focus:outline-hidden text-slate-800"
                            />
                          </td>
                        );
                      })}

                      {/* Category Action Menu */}
                      <td className="py-3 px-3 text-center relative">
                        <div className="inline-block text-left">
                          <button
                            onClick={() =>
                              setActiveActionMenu(isMenuOpen ? null : cat.categoryId)
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
                            title="Category Actions & Distribution"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {isMenuOpen && (
                            <div className="origin-top-right absolute right-2 mt-1 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black/5 divide-y divide-gray-100 z-30 animate-in fade-in zoom-in-95">
                              <div className="p-2 text-left">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                                  Distribution Tools
                                </div>
                                <button
                                  onClick={() => handleCopyMonthToAll(cat.categoryId, 'Jan')}
                                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                                  Apply Jan cap to all 12 mo
                                </button>
                                <button
                                  onClick={() => handleDistributeEvenly(cat.categoryId)}
                                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                  Divide Annual Cap Evenly
                                </button>
                                <button
                                  onClick={() => handleAdjustByPercentage(cat.categoryId, 5)}
                                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2"
                                >
                                  <TrendingUp className="w-3.5 h-3.5 text-purple-600" />
                                  +5% Inflation Adjustment
                                </button>
                                <button
                                  onClick={() => handleAdjustByPercentage(cat.categoryId, -5)}
                                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2"
                                >
                                  <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                                  -5% Budget Reduction
                                </button>
                              </div>

                              <div className="p-1 text-left">
                                <button
                                  onClick={() => handleOpenEditCategory(cat)}
                                  className="w-full text-left px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md flex items-center gap-2"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                                  Edit Category Config
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(cat.categoryId)}
                                  className="w-full text-left px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  Delete Category
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Matrix Totals Footer */}
              <tfoot>
                <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-gray-300">
                  <td className="py-3 px-4 sticky left-0 bg-slate-100 z-10">
                    TOTAL MONTHLY BUDGET LIMIT
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-800 text-sm font-extrabold border-r border-gray-200">
                    {formatINR(grandAnnualCap)}
                  </td>
                  {ALL_MONTHS.map((m) => (
                    <td
                      key={m}
                      className="py-3 px-2 text-center font-mono font-bold text-slate-800 border-r border-gray-200"
                    >
                      {formatINR(monthlyTotals[m])}
                    </td>
                  ))}
                  <td className="py-3 px-3 text-center text-slate-400">--</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Annual Sum: <strong className="text-slate-800">{formatINR(grandAnnualCap)}</strong> across{' '}
                {categoryCaps.length} active institutional budget heads.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveCategoryCaps()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#168A45] hover:bg-[#127238] shadow-2xs transition-all"
              >
                Save All Monthly Category Caps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. VIEW 2: Monthly Deep-Dive Planner */}
      {plannerTab === 'monthly' && (
        <div className="space-y-4">
          {/* Month Selector Carousel */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Month for Granular Cap Control
              </div>
              <div className="text-xs text-slate-500">
                Viewing <span className="font-semibold text-slate-800">{MONTH_NAMES[selectedMonth]} {selectedYear}</span>
              </div>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {ALL_MONTHS.map((m) => {
                const isSelected = selectedMonth === m;
                const mTotal = monthlyTotals[m];
                const summary = monthlySummaries.find((s) => s.month === m);
                const spend = summary?.totalActualSpend || 0;
                const util = mTotal > 0 ? Math.round((spend / mTotal) * 100) : 0;
                const isOver = spend > mTotal;

                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-50 border-[#168A45] text-emerald-950 font-bold shadow-2xs ring-2 ring-[#168A45]/20'
                        : 'bg-white border-gray-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">{m}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      {formatCompactINR(mTotal)}
                    </span>
                    {/* mini utilization bar */}
                    <div className="w-full h-1 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isOver ? 'bg-rose-500' : util > 90 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, util)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Month Overview Card */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Target Operating Ceiling
                </span>
                <h2 className="text-2xl font-bold mt-0.5">
                  {MONTH_NAMES[selectedMonth]} {selectedYear} Cap: {formatINR(monthlyTotals[selectedMonth])}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Sum of all {categoryCaps.length} category caps for {MONTH_NAMES[selectedMonth]}. Actual spend to date: {formatINR(currentMonthSummary.totalActualSpend)}.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 p-3.5 rounded-xl backdrop-blur-xs">
                <div>
                  <div className="text-[11px] text-slate-300 font-medium">Headroom Remaining</div>
                  <div
                    className={`text-lg font-extrabold ${
                      currentMonthSummary.remainingHeadroom >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currentMonthSummary.remainingHeadroom >= 0 ? '+' : ''}
                    {formatINR(currentMonthSummary.remainingHeadroom)}
                  </div>
                </div>
                <div className="h-8 w-px bg-white/20"></div>
                <div>
                  <div className="text-[11px] text-slate-300 font-medium">Utilization</div>
                  <div className="text-lg font-extrabold text-white">
                    {currentMonthSummary.utilizationRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Cards for Selected Month */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryCaps.map((cat) => {
              const currentCap = cat.monthlyCaps[selectedMonth] || 0;
              const catSummary = currentMonthSummary.categoryBreakdown?.find(
                (b) => b.categoryId === cat.categoryId
              );
              const actualSpend = catSummary?.actualSpend || 0;
              const headroom = currentCap - actualSpend;
              const utilRate = currentCap > 0 ? Math.round((actualSpend / currentCap) * 1000) / 10 : 0;
              const isOver = actualSpend > currentCap;
              const isNearThreshold = !isOver && utilRate >= (cat.alertThresholdPercent || 90);

              return (
                <div
                  key={cat.categoryId}
                  className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-tight">
                            {cat.categoryName}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {cat.code} • {cat.department}
                          </span>
                        </div>
                      </div>

                      {/* Cap Status Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOver
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isNearThreshold
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {isOver ? 'Exceeding Cap' : isNearThreshold ? 'Near Threshold' : 'Compliant'}
                      </span>
                    </div>

                    {/* Spend vs Cap */}
                    <div className="space-y-1.5 mt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Actual Spend ({selectedMonth}):</span>
                        <span className="font-bold text-slate-800">{formatINR(actualSpend)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Headroom Balance:</span>
                        <span
                          className={`font-bold ${
                            headroom >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {headroom >= 0 ? '+' : ''}
                          {formatINR(headroom)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative mt-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver
                              ? 'bg-rose-600'
                              : isNearThreshold
                              ? 'bg-amber-500'
                              : 'bg-[#168A45]'
                          }`}
                          style={{ width: `${Math.min(100, utilRate)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                        <span>Utilization: {utilRate}%</span>
                        <span>Threshold: {cat.alertThresholdPercent || 90}%</span>
                      </div>
                    </div>

                    {/* Cap Controller */}
                    <div className="mt-5 pt-4 border-t border-gray-100">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Set {selectedMonth} Budget Cap (₹):
                      </label>
                      <div className="relative rounded-xl shadow-2xs">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="5000"
                          min="0"
                          value={currentCap}
                          onChange={(e) =>
                            handleMonthlyCapChange(cat.categoryId, selectedMonth, e.target.value)
                          }
                          className="w-full pl-7 pr-3 py-2 text-sm font-semibold rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                        />
                      </div>

                      {/* Quick Adjust Buttons */}
                      <div className="flex items-center gap-1.5 mt-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleMonthlyCapChange(
                              cat.categoryId,
                              selectedMonth,
                              String(Math.max(0, currentCap - 25000))
                            )
                          }
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          -25k
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMonthlyCapChange(
                              cat.categoryId,
                              selectedMonth,
                              String(currentCap + 25000)
                            )
                          }
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          +25k
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMonthlyCapChange(
                              cat.categoryId,
                              selectedMonth,
                              String(currentCap + 50000)
                            )
                          }
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          +50k
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyMonthToAll(cat.categoryId, selectedMonth)}
                          className="ml-auto px-2 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
                          title="Apply this month's cap across all 12 months"
                        >
                          Copy to All
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Annual Total: {formatCompactINR(cat.annualCap)}</span>
                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="hover:text-slate-700 text-slate-500 font-medium flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit Head
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => handleSaveCategoryCaps()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#168A45] hover:bg-[#127238] shadow-2xs transition-all active:scale-98"
            >
              <Save className="w-4 h-4" />
              Save {MONTH_NAMES[selectedMonth]} Category Caps
            </button>
          </div>
        </div>
      )}

      {/* 6. VIEW 3: Finance Module Settings Tab */}
      {plannerTab === 'settings' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs p-5 sm:p-7 max-w-4xl">
          <div className="border-b border-gray-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Finance Module Settings & Governance Rules
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Configure institutional spending policies, caps enforcement rules, fiscal year cycles, and approval authorities.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* General Settings */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                1. Institutional Fiscal Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Active Fiscal Year
                  </label>
                  <input
                    type="number"
                    value={settingsFormData.fiscalYear}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        fiscalYear: Number(e.target.value),
                      });
                      setHasUnsavedSettings(true);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    FY Starting Month
                  </label>
                  <select
                    value={settingsFormData.fiscalYearStartMonth}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        fiscalYearStartMonth: e.target.value as MonthShort,
                      });
                      setHasUnsavedSettings(true);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="Jan">January (Calendar FY)</option>
                    <option value="Apr">April (Indian Financial FY)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Operating Currency
                  </label>
                  <input
                    type="text"
                    value={`${settingsFormData.currency} (${settingsFormData.currencySymbol})`}
                    disabled
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-slate-50 text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Caps Policy */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                2. Budget Cap Enforcement & Automated Alerts
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="autoSyncLimits"
                    checked={settingsFormData.autoSyncMonthlyBudgetLimits}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        autoSyncMonthlyBudgetLimits: e.target.checked,
                      });
                      setHasUnsavedSettings(true);
                    }}
                    className="mt-0.5 h-4 w-4 text-[#168A45] rounded border-gray-300 focus:ring-emerald-500"
                  />
                  <label htmlFor="autoSyncLimits" className="text-xs text-slate-700">
                    <strong className="block text-slate-900 font-semibold mb-0.5">
                      Auto-Synchronize Institutional Monthly Limits with Sum of Category Caps
                    </strong>
                    When enabled, editing category caps automatically recalculates each month's institutional budget ceiling and updates the Recharts Bar Chart immediately.
                  </label>
                </div>

                <div className="flex items-start space-x-3 p-3.5 bg-slate-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    id="enforceHardCaps"
                    checked={settingsFormData.enforceHardCaps}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        enforceHardCaps: e.target.checked,
                      });
                      setHasUnsavedSettings(true);
                    }}
                    className="mt-0.5 h-4 w-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500"
                  />
                  <label htmlFor="enforceHardCaps" className="text-xs text-slate-700">
                    <strong className="block text-slate-900 font-semibold mb-0.5">
                      Strict Hard Cap Enforcement
                    </strong>
                    Require dual-administrator override before recording vouchers that exceed the monthly category budget ceiling.
                  </label>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Default Alert Warning Threshold
                    </label>
                    <span className="text-xs font-bold text-emerald-700">
                      {settingsFormData.defaultAlertThresholdPercent}% of Cap
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={settingsFormData.defaultAlertThresholdPercent}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        defaultAlertThresholdPercent: Number(e.target.value),
                      });
                      setHasUnsavedSettings(true);
                    }}
                    className="w-full accent-[#168A45]"
                  />
                  <span className="text-[11px] text-slate-400">
                    Categories will display an amber advisory warning once expenditures reach this percentage of their monthly cap.
                  </span>
                </div>
              </div>
            </div>

            {/* Plan Governance & Approvals */}
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                3. Governance & Board Approval Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Budget Plan Status
                  </label>
                  <select
                    value={settingsFormData.planStatus}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        planStatus: e.target.value as any,
                      });
                      setHasUnsavedSettings(true);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Locked">Locked (Audit Freeze)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Approved By Authority
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.approvedBy}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        approvedBy: e.target.value,
                      });
                      setHasUnsavedSettings(true);
                    }}
                    placeholder="e.g. Managing Director"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Plan Version ID
                  </label>
                  <input
                    type="text"
                    value={settingsFormData.planVersion}
                    onChange={(e) => {
                      setSettingsFormData({
                        ...settingsFormData,
                        planVersion: e.target.value,
                      });
                      setHasUnsavedSettings(true);
                    }}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Institutional Budget Notes & Justification
                </label>
                <textarea
                  rows={2}
                  value={settingsFormData.notes}
                  onChange={(e) => {
                    setSettingsFormData({
                      ...settingsFormData,
                      notes: e.target.value,
                    });
                    setHasUnsavedSettings(true);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-800"
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-5 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reset Caps & Settings to Defaults
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#168A45] hover:bg-[#127238] shadow-2xs transition-all active:scale-98"
                >
                  <Save className="w-4 h-4" />
                  Save Module Settings
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 7. Modal: Add / Edit Expense Category */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-gray-200 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingCategory ? 'Edit Budget Category Cap' : 'Add New Budget Category Head'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure name, code, annual ceiling and monthly cap distribution model.
                </p>
              </div>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategoryModal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={categoryFormData.categoryName}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, categoryName: e.target.value })
                  }
                  placeholder="e.g. Marketing, Staff Salaries, Cloud Infrastructure"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Accounting Code
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.code}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="e.g. MARKETING"
                    className="w-full px-3 py-2 text-sm font-mono rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    value={categoryFormData.department}
                    onChange={(e) =>
                      setCategoryFormData({ ...categoryFormData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Annual Budget Cap (₹ INR)
                </label>
                <input
                  type="number"
                  step="10000"
                  min="0"
                  required
                  value={categoryFormData.annualCap}
                  onChange={(e) =>
                    setCategoryFormData({
                      ...categoryFormData,
                      annualCap: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Divided across 12 months: ~{formatINR(Math.round(categoryFormData.annualCap / 12))}/month
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Category Color Tag
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: col })}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        categoryFormData.color === col ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={categoryFormData.alertThresholdPercent}
                    onChange={(e) =>
                      setCategoryFormData({
                        ...categoryFormData,
                        alertThresholdPercent: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={categoryFormData.isHardCap}
                      onChange={(e) =>
                        setCategoryFormData({
                          ...categoryFormData,
                          isHardCap: e.target.checked,
                        })
                      }
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    Strict Hard Cap Policy
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-[#168A45] hover:bg-[#127238] rounded-xl shadow-2xs"
                >
                  {editingCategory ? 'Update Category' : 'Add Category Cap'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
