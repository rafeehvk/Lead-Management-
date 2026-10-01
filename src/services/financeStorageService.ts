import {
  MonthlyBudgetExpenditure,
  ExpenseCategory,
  ExpenseTransaction,
  FinanceDashboardMetrics,
  MonthShort,
  BudgetHealthStatus,
  CategoryBudgetCapConfig,
  FinanceModuleSettings,
  MonthlyCategoryCapSummary,
  Vendor,
  VendorInvoice,
  VendorPaymentRecord,
  VendorSummaryMetrics,
  PaymentMode,
  BudgetProjectionSummary,
  CategoryBurnProjection,
  DailyTrajectoryPoint,
  VendorSpendBudgetContribution,
  VendorSpendAnalysisSummary,
} from '../types/finance';

const STORAGE_KEYS = {
  MONTHLY_DATA: 'mysar_finance_monthly_budget_expenditure_v1',
  CATEGORIES: 'mysar_finance_categories_v1',
  TRANSACTIONS: 'mysar_finance_transactions_v1',
  BUDGET_CAPS: 'mysar_finance_category_budget_caps_v1',
  SETTINGS: 'mysar_finance_module_settings_v1',
  VENDORS: 'mysar_finance_vendors_v1',
  VENDOR_INVOICES: 'mysar_finance_vendor_invoices_v1',
  VENDOR_PAYMENTS: 'mysar_finance_vendor_payments_v1',
};

const ALL_MONTHS: MonthShort[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const DEFAULT_BUDGET_CAPS: CategoryBudgetCapConfig[] = [
  {
    categoryId: 'CAT-01',
    categoryName: 'Staff Payroll & Salaries',
    code: 'SALARIES',
    department: 'Academic & Admin',
    annualCap: 6000000,
    color: '#168A45',
    description: 'Faculty, staff salaries, visiting faculty stipends and employee benefits',
    alertThresholdPercent: 90,
    isHardCap: true,
    monthlyCaps: {
      Jan: 480000, Feb: 480000, Mar: 500000, Apr: 480000, May: 480000, Jun: 500000,
      Jul: 500000, Aug: 520000, Sep: 520000, Oct: 520000, Nov: 500000, Dec: 520000,
    },
  },
  {
    categoryId: 'CAT-02',
    categoryName: 'Campus IT & Cloud Infrastructure',
    code: 'INFRA',
    department: 'IT & Tech',
    annualCap: 2400000,
    color: '#0284C7',
    description: 'Cloud hosting, high-speed fiber internet, campus network, server licenses & ERP upkeep',
    alertThresholdPercent: 90,
    isHardCap: false,
    monthlyCaps: {
      Jan: 180000, Feb: 180000, Mar: 200000, Apr: 180000, May: 180000, Jun: 220000,
      Jul: 200000, Aug: 240000, Sep: 220000, Oct: 200000, Nov: 190000, Dec: 210000,
    },
  },
  {
    categoryId: 'CAT-04',
    categoryName: 'Marketing, Branding & Admissions',
    code: 'MARKETING',
    department: 'Operations',
    annualCap: 2050000,
    color: '#7C3AED',
    description: 'Digital campaigns, education expos, school visits, brochures and admission drives',
    alertThresholdPercent: 85,
    isHardCap: false,
    monthlyCaps: {
      Jan: 140000, Feb: 160000, Mar: 180000, Apr: 200000, May: 220000, Jun: 220000,
      Jul: 180000, Aug: 180000, Sep: 150000, Oct: 150000, Nov: 130000, Dec: 140000,
    },
  },
  {
    categoryId: 'CAT-03',
    categoryName: 'Facilities, Maintenance & Utilities',
    code: 'FACILITIES',
    department: 'Operations',
    annualCap: 2020000,
    color: '#D97706',
    description: 'Electricity grid bills, generator diesel, HVAC upkeep, campus security and housekeeping',
    alertThresholdPercent: 90,
    isHardCap: false,
    monthlyCaps: {
      Jan: 160000, Feb: 160000, Mar: 170000, Apr: 180000, May: 190000, Jun: 180000,
      Jul: 170000, Aug: 170000, Sep: 160000, Oct: 160000, Nov: 160000, Dec: 170000,
    },
  },
  {
    categoryId: 'CAT-05',
    categoryName: 'Academic Resources & Labs',
    code: 'ACADEMIC',
    department: 'Academic',
    annualCap: 1880000,
    color: '#0D9488',
    description: 'Library journals, computer lab equipment, science reagents, student test kits',
    alertThresholdPercent: 90,
    isHardCap: false,
    monthlyCaps: {
      Jan: 160000, Feb: 150000, Mar: 170000, Apr: 140000, May: 140000, Jun: 180000,
      Jul: 170000, Aug: 180000, Sep: 160000, Oct: 150000, Nov: 140000, Dec: 150000,
    },
  },
  {
    categoryId: 'CAT-06',
    categoryName: 'Statutory Compliance & Legal',
    code: 'COMPLIANCE',
    department: 'Administration',
    annualCap: 1250000,
    color: '#E11D48',
    description: 'Annual audits, accreditation renewals, statutory filings, university affiliation cess',
    alertThresholdPercent: 95,
    isHardCap: true,
    monthlyCaps: {
      Jan: 110000, Feb: 100000, Mar: 130000, Apr: 100000, May: 90000, Jun: 120000,
      Jul: 100000, Aug: 110000, Sep: 100000, Oct: 90000, Nov: 90000, Dec: 110000,
    },
  },
];

const DEFAULT_SETTINGS: FinanceModuleSettings = {
  fiscalYear: 2026,
  fiscalYearStartMonth: 'Jan',
  currency: 'INR',
  currencySymbol: '₹',
  defaultAlertThresholdPercent: 90,
  enforceHardCaps: false,
  autoSyncMonthlyBudgetLimits: true,
  planStatus: 'Approved',
  approvedBy: 'Dr. K. S. Nambiar (Managing Director)',
  approvedDate: '2026-01-05',
  planVersion: 'FY2026-V2.4',
  notes: 'Approved institutional operating budget allocation for FY 2026. Category caps are monitored on monthly close.',
  lastUpdated: '2026-09-01T10:00:00Z',
  updatedBy: 'Chief Financial Officer',
};

// Initial realistic categories
const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  {
    id: 'CAT-01',
    name: 'Staff Payroll & Honorariums',
    code: 'PAYROLL',
    allocatedBudget: 7200000,
    actualSpend: 0,
    color: '#168A45',
    description: 'Faculty, management, administrative staff salaries and visiting lecturer honorariums',
  },
  {
    id: 'CAT-02',
    name: 'Campus IT & Cloud Infrastructure',
    code: 'IT-INFRA',
    allocatedBudget: 2400000,
    actualSpend: 0,
    color: '#0284C7',
    description: 'Cloud servers, high-speed fiber internet, SaaS licensing, LMS & ERP hosting',
  },
  {
    id: 'CAT-03',
    name: 'Facilities, Maintenance & Utilities',
    code: 'FACILITIES',
    allocatedBudget: 2100000,
    actualSpend: 0,
    color: '#D97706',
    description: 'Electricity grid, DG backup fuel, HVAC AMC, housekeeping, and campus upkeep',
  },
  {
    id: 'CAT-04',
    name: 'Marketing, Branding & Admissions',
    code: 'MARKETING',
    allocatedBudget: 1800000,
    actualSpend: 0,
    color: '#7C3AED',
    description: 'Educational expos, digital marketing campaigns, prospectus printing & field outreach',
  },
  {
    id: 'CAT-05',
    name: 'Academic Resources & Labs',
    code: 'ACADEMIC',
    allocatedBudget: 1600000,
    actualSpend: 0,
    color: '#0D9488',
    description: 'Library journals, laboratory reagents, scientific apparatus, workshop consumables',
  },
  {
    id: 'CAT-06',
    name: 'Statutory Compliance & Legal',
    code: 'COMPLIANCE',
    allocatedBudget: 900000,
    actualSpend: 0,
    color: '#E11D48',
    description: 'Audit fees, ISO compliance audits, government affiliations, university renewal cess',
  },
];

const DEFAULT_VENDORS: Vendor[] = [];

const DEFAULT_VENDOR_INVOICES: VendorInvoice[] = [];

const DEFAULT_VENDOR_PAYMENTS: VendorPaymentRecord[] = [];

// Realistic 12-month data for 2026
const DEFAULT_MONTHLY_2026: MonthlyBudgetExpenditure[] = [
  {
    month: 'Jan',
    fullMonth: 'January',
    monthIndex: 1,
    year: 2026,
    budgetLimit: 1250000,
    actualExpenditure: 0,
    committedExpenditure: 40000,
    variance: 110000,
    variancePercent: 91.2,
    status: 'Under Budget',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 450000,
      'Campus IT & Cloud Infrastructure': 160000,
      'Facilities, Maintenance & Utilities': 150000,
      'Marketing, Branding & Admissions': 130000,
      'Academic Resources & Labs': 150000,
      'Statutory Compliance & Legal': 100000,
    },
    departmentBreakdown: {
      Academic: 380000,
      Administration: 240000,
      'Finance & Accounts': 110000,
      'IT & Tech': 190000,
      Operations: 220000,
    },
  },
  {
    month: 'Feb',
    fullMonth: 'February',
    monthIndex: 2,
    year: 2026,
    budgetLimit: 1250000,
    actualExpenditure: 0,
    committedExpenditure: 35000,
    variance: 60000,
    variancePercent: 95.2,
    status: 'On Track',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 455000,
      'Campus IT & Cloud Infrastructure': 175000,
      'Facilities, Maintenance & Utilities': 160000,
      'Marketing, Branding & Admissions': 160000,
      'Academic Resources & Labs': 140000,
      'Statutory Compliance & Legal': 100000,
    },
    departmentBreakdown: {
      Academic: 390000,
      Administration: 250000,
      'Finance & Accounts': 115000,
      'IT & Tech': 200000,
      Operations: 235000,
    },
  },
  {
    month: 'Mar',
    fullMonth: 'March',
    monthIndex: 3,
    year: 2026,
    budgetLimit: 1400000,
    actualExpenditure: 0,
    committedExpenditure: 25000,
    variance: 55000,
    variancePercent: 96.1,
    status: 'On Track',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 460000,
      'Campus IT & Cloud Infrastructure': 210000,
      'Facilities, Maintenance & Utilities': 185000,
      'Marketing, Branding & Admissions': 210000,
      'Academic Resources & Labs': 180000,
      'Statutory Compliance & Legal': 100000,
    },
    departmentBreakdown: {
      Academic: 420000,
      Administration: 280000,
      'Finance & Accounts': 140000,
      'IT & Tech': 240000,
      Operations: 265000,
    },
  },
  {
    month: 'Apr',
    fullMonth: 'April',
    monthIndex: 4,
    year: 2026,
    budgetLimit: 1300000,
    actualExpenditure: 0,
    committedExpenditure: 50000,
    variance: 80000,
    variancePercent: 93.8,
    status: 'Under Budget',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 465000,
      'Campus IT & Cloud Infrastructure': 180000,
      'Facilities, Maintenance & Utilities': 165000,
      'Marketing, Branding & Admissions': 170000,
      'Academic Resources & Labs': 150000,
      'Statutory Compliance & Legal': 90000,
    },
    departmentBreakdown: {
      Academic: 400000,
      Administration: 260000,
      'Finance & Accounts': 120000,
      'IT & Tech': 210000,
      Operations: 230000,
    },
  },
  {
    month: 'May',
    fullMonth: 'May',
    monthIndex: 5,
    year: 2026,
    budgetLimit: 1450000,
    actualExpenditure: 0,
    committedExpenditure: 30000,
    variance: -80000,
    variancePercent: 105.5,
    status: 'Over Budget',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 470000,
      'Campus IT & Cloud Infrastructure': 320000, // Annual SaaS and security renewals
      'Facilities, Maintenance & Utilities': 210000,
      'Marketing, Branding & Admissions': 240000,
      'Academic Resources & Labs': 160000,
      'Statutory Compliance & Legal': 130000,
    },
    departmentBreakdown: {
      Academic: 410000,
      Administration: 290000,
      'Finance & Accounts': 150000,
      'IT & Tech': 360000,
      Operations: 320000,
    },
  },
  {
    month: 'Jun',
    fullMonth: 'June',
    monthIndex: 6,
    year: 2026,
    budgetLimit: 1350000,
    actualExpenditure: 0,
    committedExpenditure: 45000,
    variance: 60000,
    variancePercent: 95.6,
    status: 'On Track',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 475000,
      'Campus IT & Cloud Infrastructure': 190000,
      'Facilities, Maintenance & Utilities': 180000,
      'Marketing, Branding & Admissions': 210000,
      'Academic Resources & Labs': 145000,
      'Statutory Compliance & Legal': 90000,
    },
    departmentBreakdown: {
      Academic: 420000,
      Administration: 270000,
      'Finance & Accounts': 130000,
      'IT & Tech': 220000,
      Operations: 250000,
    },
  },
  {
    month: 'Jul',
    fullMonth: 'July',
    monthIndex: 7,
    year: 2026,
    budgetLimit: 1500000,
    actualExpenditure: 0,
    committedExpenditure: 60000,
    variance: 40000,
    variancePercent: 97.3,
    status: 'On Track',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 480000,
      'Campus IT & Cloud Infrastructure': 210000,
      'Facilities, Maintenance & Utilities': 220000,
      'Marketing, Branding & Admissions': 280000,
      'Academic Resources & Labs': 180000,
      'Statutory Compliance & Legal': 90000,
    },
    departmentBreakdown: {
      Academic: 450000,
      Administration: 310000,
      'Finance & Accounts': 140000,
      'IT & Tech': 250000,
      Operations: 310000,
    },
  },
  {
    month: 'Aug',
    fullMonth: 'August',
    monthIndex: 8,
    year: 2026,
    budgetLimit: 1550000,
    actualExpenditure: 0,
    committedExpenditure: 40000,
    variance: -90000,
    variancePercent: 105.8,
    status: 'Over Budget',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 490000,
      'Campus IT & Cloud Infrastructure': 225000,
      'Facilities, Maintenance & Utilities': 240000,
      'Marketing, Branding & Admissions': 360000, // Peak student intake & campus drive
      'Academic Resources & Labs': 215000,
      'Statutory Compliance & Legal': 110000,
    },
    departmentBreakdown: {
      Academic: 490000,
      Administration: 350000,
      'Finance & Accounts': 160000,
      'IT & Tech': 270000,
      Operations: 370000,
    },
  },
  {
    month: 'Sep',
    fullMonth: 'September',
    monthIndex: 9,
    year: 2026,
    budgetLimit: 1400000,
    actualExpenditure: 0,
    committedExpenditure: 50000,
    variance: 80000,
    variancePercent: 94.3,
    status: 'Under Budget',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 485000,
      'Campus IT & Cloud Infrastructure': 200000,
      'Facilities, Maintenance & Utilities': 190000,
      'Marketing, Branding & Admissions': 180000,
      'Academic Resources & Labs': 175000,
      'Statutory Compliance & Legal': 90000,
    },
    departmentBreakdown: {
      Academic: 430000,
      Administration: 280000,
      'Finance & Accounts': 135000,
      'IT & Tech': 235000,
      Operations: 240000,
    },
  },
  {
    month: 'Oct',
    fullMonth: 'October',
    monthIndex: 10,
    year: 2026,
    budgetLimit: 1350000,
    actualExpenditure: 0,
    committedExpenditure: 40000,
    variance: 80000,
    variancePercent: 94.1,
    status: 'Under Budget',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 490000,
      'Campus IT & Cloud Infrastructure': 190000,
      'Facilities, Maintenance & Utilities': 185000,
      'Marketing, Branding & Admissions': 160000,
      'Academic Resources & Labs': 165000,
      'Statutory Compliance & Legal': 80000,
    },
    departmentBreakdown: {
      Academic: 420000,
      Administration: 270000,
      'Finance & Accounts': 130000,
      'IT & Tech': 225000,
      Operations: 225000,
    },
  },
  {
    month: 'Nov',
    fullMonth: 'November',
    monthIndex: 11,
    year: 2026,
    budgetLimit: 1350000,
    actualExpenditure: 0,
    committedExpenditure: 45000,
    variance: 70000,
    variancePercent: 94.8,
    status: 'Under Budget',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 495000,
      'Campus IT & Cloud Infrastructure': 195000,
      'Facilities, Maintenance & Utilities': 185000,
      'Marketing, Branding & Admissions': 160000,
      'Academic Resources & Labs': 160000,
      'Statutory Compliance & Legal': 85000,
    },
    departmentBreakdown: {
      Academic: 425000,
      Administration: 275000,
      'Finance & Accounts': 130000,
      'IT & Tech': 230000,
      Operations: 220000,
    },
  },
  {
    month: 'Dec',
    fullMonth: 'December',
    monthIndex: 12,
    year: 2026,
    budgetLimit: 1450000,
    actualExpenditure: 0,
    committedExpenditure: 35000,
    variance: 55000,
    variancePercent: 96.2,
    status: 'On Track',
    categoryBreakdown: {
      'Staff Payroll & Honorariums': 500000,
      'Campus IT & Cloud Infrastructure': 215000,
      'Facilities, Maintenance & Utilities': 200000,
      'Marketing, Branding & Admissions': 175000,
      'Academic Resources & Labs': 195000,
      'Statutory Compliance & Legal': 110000,
    },
    departmentBreakdown: {
      Academic: 460000,
      Administration: 300000,
      'Finance & Accounts': 145000,
      'IT & Tech': 250000,
      Operations: 240000,
    },
  },
];

// Sample ledger transactions for auditing & drilling down
const DEFAULT_TRANSACTIONS: ExpenseTransaction[] = [];

class FinanceStorageService {
  private getStorageItem<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      }
      return JSON.parse(data);
    } catch {
      return defaultVal;
    }
  }

  private setStorageItem<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      window.dispatchEvent(new CustomEvent('mysar_finance_data_changed'));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  public getMonthlyData(year = 2026, department = 'All'): MonthlyBudgetExpenditure[] {
    const allData = this.getStorageItem<MonthlyBudgetExpenditure[]>(
      STORAGE_KEYS.MONTHLY_DATA,
      DEFAULT_MONTHLY_2026
    );

    const yearData = allData.filter((item) => item.year === year);

    if (department === 'All') {
      return yearData;
    }

    // If department is filtered, scale down to that department's figures
    return yearData.map((item) => {
      const deptSpend = item.departmentBreakdown?.[department] || 0;
      // Estimate department proportion of budget based on total spend
      const deptRatio = item.actualExpenditure > 0 ? deptSpend / item.actualExpenditure : 0.2;
      const deptBudget = Math.round(item.budgetLimit * deptRatio);
      const variance = deptBudget - deptSpend;
      const variancePercent = deptBudget > 0 ? Math.round((deptSpend / deptBudget) * 1000) / 10 : 0;
      const status: BudgetHealthStatus =
        variancePercent > 100
          ? 'Over Budget'
          : variancePercent >= 95
          ? 'On Track'
          : 'Under Budget';

      return {
        ...item,
        budgetLimit: deptBudget,
        actualExpenditure: deptSpend,
        variance,
        variancePercent,
        status,
      };
    });
  }

  public getCategories(): ExpenseCategory[] {
    return this.getStorageItem<ExpenseCategory[]>(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  public getTransactions(): ExpenseTransaction[] {
    return this.getStorageItem<ExpenseTransaction[]>(STORAGE_KEYS.TRANSACTIONS, DEFAULT_TRANSACTIONS);
  }

  public addTransaction(transaction: Omit<ExpenseTransaction, 'id'>): ExpenseTransaction {
    const transactions = this.getTransactions();
    const newId = `EXP-2026-${String(transactions.length + 90).padStart(3, '0')}`;
    const newTx: ExpenseTransaction = {
      ...transaction,
      id: newId,
    };
    transactions.unshift(newTx);
    this.setStorageItem(STORAGE_KEYS.TRANSACTIONS, transactions);

    // Also update the corresponding month's actual expenditure
    this.incrementMonthlyExpenditure(newTx.month, newTx.year, newTx.amount, newTx.category, newTx.department);

    return newTx;
  }

  public updateMonthlyBudgetLimit(month: MonthShort, year: number, newLimit: number): void {
    const allData = this.getStorageItem<MonthlyBudgetExpenditure[]>(
      STORAGE_KEYS.MONTHLY_DATA,
      DEFAULT_MONTHLY_2026
    );

    const updated = allData.map((item) => {
      if (item.month === month && item.year === year) {
        const variance = newLimit - item.actualExpenditure;
        const variancePercent = newLimit > 0 ? Math.round((item.actualExpenditure / newLimit) * 1000) / 10 : 0;
        const status: BudgetHealthStatus =
          variancePercent > 100
            ? 'Over Budget'
            : variancePercent >= 95
            ? 'On Track'
            : 'Under Budget';

        return {
          ...item,
          budgetLimit: newLimit,
          variance,
          variancePercent,
          status,
        };
      }
      return item;
    });

    this.setStorageItem(STORAGE_KEYS.MONTHLY_DATA, updated);
  }

  private incrementMonthlyExpenditure(
    month: MonthShort,
    year: number,
    amount: number,
    category: string,
    department: string
  ): void {
    const allData = this.getStorageItem<MonthlyBudgetExpenditure[]>(
      STORAGE_KEYS.MONTHLY_DATA,
      DEFAULT_MONTHLY_2026
    );

    const updated = allData.map((item) => {
      if (item.month === month && item.year === year) {
        const newActual = item.actualExpenditure + amount;
        const variance = item.budgetLimit - newActual;
        const variancePercent = item.budgetLimit > 0 ? Math.round((newActual / item.budgetLimit) * 1000) / 10 : 0;
        const status: BudgetHealthStatus =
          variancePercent > 100
            ? 'Over Budget'
            : variancePercent >= 95
            ? 'On Track'
            : 'Under Budget';

        const updatedCategories = { ...(item.categoryBreakdown || {}) };
        updatedCategories[category] = (updatedCategories[category] || 0) + amount;

        const updatedDepts = { ...(item.departmentBreakdown || {}) };
        updatedDepts[department] = (updatedDepts[department] || 0) + amount;

        return {
          ...item,
          actualExpenditure: newActual,
          variance,
          variancePercent,
          status,
          categoryBreakdown: updatedCategories,
          departmentBreakdown: updatedDepts,
        };
      }
      return item;
    });

    this.setStorageItem(STORAGE_KEYS.MONTHLY_DATA, updated);
  }

  public getDashboardMetrics(year = 2026, department = 'All'): FinanceDashboardMetrics {
    const monthlyData = this.getMonthlyData(year, department);
    const transactions = this.getTransactions();

    const totalAnnualBudget = monthlyData.reduce((acc, m) => acc + m.budgetLimit, 0);
    const totalActualExpenditure = monthlyData.reduce((acc, m) => acc + m.actualExpenditure, 0);
    const totalVariance = totalAnnualBudget - totalActualExpenditure;
    const overallUtilizationRate =
      totalAnnualBudget > 0
        ? Math.round((totalActualExpenditure / totalAnnualBudget) * 1000) / 10
        : 0;

    const count = monthlyData.length || 1;
    const averageMonthlyExpenditure = Math.round(totalActualExpenditure / count);

    let highestSpendMonth = { month: 'None', amount: 0 };
    let lowestSpendMonth = { month: 'None', amount: Infinity };
    let overBudgetMonthsCount = 0;

    monthlyData.forEach((m) => {
      if (m.actualExpenditure > highestSpendMonth.amount) {
        highestSpendMonth = { month: m.fullMonth, amount: m.actualExpenditure };
      }
      if (m.actualExpenditure > 0 && m.actualExpenditure < lowestSpendMonth.amount) {
        lowestSpendMonth = { month: m.fullMonth, amount: m.actualExpenditure };
      }
      if (m.actualExpenditure > m.budgetLimit) {
        overBudgetMonthsCount++;
      }
    });

    if (lowestSpendMonth.amount === Infinity) {
      lowestSpendMonth = { month: 'None', amount: 0 };
    }

    return {
      fiscalYear: year,
      totalAnnualBudget,
      totalActualExpenditure,
      totalVariance,
      overallUtilizationRate,
      averageMonthlyExpenditure,
      highestSpendMonth,
      lowestSpendMonth,
      overBudgetMonthsCount,
      activeTransactionsCount: transactions.length,
    };
  }

  public getCategoryBudgetCaps(): CategoryBudgetCapConfig[] {
    return this.getStorageItem<CategoryBudgetCapConfig[]>(
      STORAGE_KEYS.BUDGET_CAPS,
      DEFAULT_BUDGET_CAPS
    );
  }

  public saveCategoryBudgetCaps(
    caps: CategoryBudgetCapConfig[],
    syncMonthlyLimits = true
  ): void {
    this.setStorageItem(STORAGE_KEYS.BUDGET_CAPS, caps);

    if (syncMonthlyLimits) {
      // 1. Sync monthly budget limit in MonthlyBudgetExpenditure
      const allData = this.getStorageItem<MonthlyBudgetExpenditure[]>(
        STORAGE_KEYS.MONTHLY_DATA,
        DEFAULT_MONTHLY_2026
      );

      const updatedMonthly = allData.map((item) => {
        const month = item.month as MonthShort;
        const totalMonthlyCap = caps.reduce(
          (sum, cat) => sum + (cat.monthlyCaps[month] || 0),
          0
        );

        if (totalMonthlyCap > 0) {
          const variance = totalMonthlyCap - item.actualExpenditure;
          const variancePercent =
            totalMonthlyCap > 0
              ? Math.round((item.actualExpenditure / totalMonthlyCap) * 1000) / 10
              : 0;
          const status: BudgetHealthStatus =
            variancePercent > 100
              ? 'Over Budget'
              : variancePercent >= 95
              ? 'On Track'
              : 'Under Budget';

          return {
            ...item,
            budgetLimit: totalMonthlyCap,
            variance,
            variancePercent,
            status,
          };
        }
        return item;
      });

      this.setStorageItem(STORAGE_KEYS.MONTHLY_DATA, updatedMonthly);

      // 2. Sync categories allocatedBudget
      const categories = this.getCategories();
      const updatedCategories = categories.map((cat) => {
        const matchingCap = caps.find(
          (c) => c.categoryId === cat.id || c.categoryName.toLowerCase() === cat.name.toLowerCase()
        );
        if (matchingCap) {
          return {
            ...cat,
            allocatedBudget: matchingCap.annualCap,
            color: matchingCap.color || cat.color,
          };
        }
        return cat;
      });

      // Also add any new categories from caps that don't exist yet
      caps.forEach((cap) => {
        const exists = updatedCategories.some(
          (c) => c.id === cap.categoryId || c.name.toLowerCase() === cap.categoryName.toLowerCase()
        );
        if (!exists) {
          updatedCategories.push({
            id: cap.categoryId,
            name: cap.categoryName,
            code: cap.code,
            allocatedBudget: cap.annualCap,
            actualSpend: 0,
            color: cap.color,
            description: cap.description,
          });
        }
      });

      this.setStorageItem(STORAGE_KEYS.CATEGORIES, updatedCategories);
    }
  }

  public updateSingleCategoryMonthlyCap(
    categoryId: string,
    month: MonthShort,
    cap: number
  ): void {
    const caps = this.getCategoryBudgetCaps();
    const updated = caps.map((item) => {
      if (item.categoryId === categoryId) {
        const newMonthlyCaps = { ...item.monthlyCaps, [month]: Math.max(0, cap) };
        const newAnnualCap = Object.values(newMonthlyCaps).reduce((a, b) => a + b, 0);
        return {
          ...item,
          monthlyCaps: newMonthlyCaps,
          annualCap: newAnnualCap,
        };
      }
      return item;
    });

    const settings = this.getFinanceSettings();
    this.saveCategoryBudgetCaps(updated, settings.autoSyncMonthlyBudgetLimits);
  }

  public getFinanceSettings(): FinanceModuleSettings {
    return this.getStorageItem<FinanceModuleSettings>(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS
    );
  }

  public saveFinanceSettings(settings: FinanceModuleSettings): void {
    this.setStorageItem(STORAGE_KEYS.SETTINGS, {
      ...settings,
      lastUpdated: new Date().toISOString(),
    });
  }

  public getMonthlyCategorySummaries(year = 2026): MonthlyCategoryCapSummary[] {
    const caps = this.getCategoryBudgetCaps();
    const monthlyData = this.getMonthlyData(year, 'All');
    const settings = this.getFinanceSettings();
    const alertThreshold = settings.defaultAlertThresholdPercent || 90;

    const monthNames: Record<MonthShort, { full: string; index: number }> = {
      Jan: { full: 'January', index: 1 },
      Feb: { full: 'February', index: 2 },
      Mar: { full: 'March', index: 3 },
      Apr: { full: 'April', index: 4 },
      May: { full: 'May', index: 5 },
      Jun: { full: 'June', index: 6 },
      Jul: { full: 'July', index: 7 },
      Aug: { full: 'August', index: 8 },
      Sep: { full: 'September', index: 9 },
      Oct: { full: 'October', index: 10 },
      Nov: { full: 'November', index: 11 },
      Dec: { full: 'December', index: 12 },
    };

    return ALL_MONTHS.map((m) => {
      const monthExpenditure = monthlyData.find((d) => d.month === m);
      const catBreakdown = monthExpenditure?.categoryBreakdown || {};

      let totalMonthlyCap = 0;
      let totalActualSpend = 0;

      const categoryItems = caps.map((cat) => {
        const cap = cat.monthlyCaps[m] || 0;
        // Try matching by exact name, or partial keyword match (e.g. Salaries/Payroll, Marketing, Infrastructure)
        let actualSpend = catBreakdown[cat.categoryName] || 0;
        if (actualSpend === 0) {
          const foundKey = Object.keys(catBreakdown).find(
            (k) =>
              k.toLowerCase().includes(cat.code.toLowerCase()) ||
              cat.categoryName.toLowerCase().includes(k.toLowerCase()) ||
              k.toLowerCase().includes(cat.categoryName.toLowerCase().slice(0, 5))
          );
          if (foundKey) {
            actualSpend = catBreakdown[foundKey] || 0;
          }
        }

        totalMonthlyCap += cap;
        totalActualSpend += actualSpend;

        const headroom = cap - actualSpend;
        const utilizationRate =
          cap > 0 ? Math.round((actualSpend / cap) * 1000) / 10 : 0;
        const catThreshold = cat.alertThresholdPercent || alertThreshold;
        const isOverCap = actualSpend > cap;
        const isNearThreshold = !isOverCap && utilizationRate >= catThreshold;

        return {
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          cap,
          actualSpend,
          headroom,
          utilizationRate,
          isOverCap,
          isNearThreshold,
          color: cat.color,
        };
      });

      const remainingHeadroom = totalMonthlyCap - totalActualSpend;
      const utilizationRate =
        totalMonthlyCap > 0
          ? Math.round((totalActualSpend / totalMonthlyCap) * 1000) / 10
          : 0;

      return {
        month: m,
        fullMonth: monthNames[m].full,
        monthIndex: monthNames[m].index,
        year,
        totalMonthlyCap,
        totalActualSpend,
        remainingHeadroom,
        utilizationRate,
        categoryBreakdown: categoryItems,
      };
    });
  }

  public addCategoryCapConfig(newConfig: CategoryBudgetCapConfig): void {
    const caps = this.getCategoryBudgetCaps();
    const existingIndex = caps.findIndex((c) => c.categoryId === newConfig.categoryId);
    if (existingIndex >= 0) {
      caps[existingIndex] = newConfig;
    } else {
      caps.push(newConfig);
    }
    const settings = this.getFinanceSettings();
    this.saveCategoryBudgetCaps(caps, settings.autoSyncMonthlyBudgetLimits);
  }

  public deleteCategoryCapConfig(categoryId: string): void {
    const caps = this.getCategoryBudgetCaps();
    const filtered = caps.filter((c) => c.categoryId !== categoryId);
    const settings = this.getFinanceSettings();
    this.saveCategoryBudgetCaps(filtered, settings.autoSyncMonthlyBudgetLimits);
  }

  // ==========================================
  // VENDOR MANAGEMENT METHODS
  // ==========================================

  public getVendors(): Vendor[] {
    return this.getStorageItem<Vendor[]>(STORAGE_KEYS.VENDORS, DEFAULT_VENDORS);
  }

  public saveVendors(vendors: Vendor[]): void {
    this.setStorageItem(STORAGE_KEYS.VENDORS, vendors);
  }

  public addVendor(vendorData: Omit<Vendor, 'id' | 'createdDate'> & { createdDate?: string }): Vendor {
    const vendors = this.getVendors();
    const newId = `VND-${String(vendors.length + 1).padStart(3, '0')}`;
    const newVendor: Vendor = {
      ...vendorData,
      id: newId,
      createdDate: vendorData.createdDate || new Date().toISOString().slice(0, 10),
    };
    vendors.push(newVendor);
    this.saveVendors(vendors);
    return newVendor;
  }

  public updateVendor(updated: Vendor): void {
    const vendors = this.getVendors();
    const index = vendors.findIndex((v) => v.id === updated.id);
    if (index >= 0) {
      vendors[index] = updated;
      this.saveVendors(vendors);
    }
  }

  public deleteVendor(vendorId: string): void {
    const vendors = this.getVendors();
    const filtered = vendors.filter((v) => v.id !== vendorId);
    this.saveVendors(filtered);
  }

  public getVendorInvoices(vendorId?: string): VendorInvoice[] {
    const invoices = this.getStorageItem<VendorInvoice[]>(
      STORAGE_KEYS.VENDOR_INVOICES,
      DEFAULT_VENDOR_INVOICES
    );
    if (vendorId) {
      return invoices.filter((inv) => inv.vendorId === vendorId);
    }
    return invoices;
  }

  public saveVendorInvoices(invoices: VendorInvoice[]): void {
    this.setStorageItem(STORAGE_KEYS.VENDOR_INVOICES, invoices);
  }

  public addVendorInvoice(
    invoiceData: Omit<VendorInvoice, 'id' | 'pendingAmount' | 'paidAmount'> & {
      paidAmount?: number;
    }
  ): VendorInvoice {
    const invoices = this.getVendorInvoices();
    const newId = `INV-2026-${String(invoices.length + 101).padStart(3, '0')}`;
    const paidAmount = invoiceData.paidAmount || 0;
    const pendingAmount = Math.max(0, invoiceData.amount - paidAmount);

    let calculatedStatus = invoiceData.status;
    if (pendingAmount === 0) {
      calculatedStatus = 'Paid';
    } else if (paidAmount > 0) {
      calculatedStatus = 'Partially Paid';
    } else {
      const today = new Date().toISOString().slice(0, 10);
      if (invoiceData.dueDate < today) {
        calculatedStatus = 'Overdue';
      } else {
        calculatedStatus = 'Pending';
      }
    }

    const newInvoice: VendorInvoice = {
      ...invoiceData,
      id: newId,
      paidAmount,
      pendingAmount,
      status: calculatedStatus,
    };

    invoices.unshift(newInvoice);
    this.saveVendorInvoices(invoices);
    return newInvoice;
  }

  public updateVendorInvoice(updated: VendorInvoice): void {
    const invoices = this.getVendorInvoices();
    const index = invoices.findIndex((inv) => inv.id === updated.id);
    if (index >= 0) {
      invoices[index] = updated;
      this.saveVendorInvoices(invoices);
    }
  }

  public deleteVendorInvoice(invoiceId: string): void {
    const invoices = this.getVendorInvoices();
    const filtered = invoices.filter((inv) => inv.id !== invoiceId);
    this.saveVendorInvoices(filtered);
  }

  public getVendorPayments(vendorId?: string): VendorPaymentRecord[] {
    const payments = this.getStorageItem<VendorPaymentRecord[]>(
      STORAGE_KEYS.VENDOR_PAYMENTS,
      DEFAULT_VENDOR_PAYMENTS
    );
    if (vendorId) {
      return payments.filter((p) => p.vendorId === vendorId);
    }
    return payments;
  }

  public saveVendorPayments(payments: VendorPaymentRecord[]): void {
    this.setStorageItem(STORAGE_KEYS.VENDOR_PAYMENTS, payments);
  }

  public recordVendorPayment(params: {
    invoiceId: string;
    amount: number;
    paymentMode: PaymentMode;
    referenceNumber: string;
    approvedBy: string;
    paymentDate?: string;
    notes?: string;
    recordInExpenseLedger?: boolean;
  }): {
    payment: VendorPaymentRecord;
    invoice: VendorInvoice;
    transaction?: ExpenseTransaction;
  } {
    const invoices = this.getVendorInvoices();
    const invoiceIndex = invoices.findIndex((inv) => inv.id === params.invoiceId);
    if (invoiceIndex === -1) {
      throw new Error(`Invoice ${params.invoiceId} not found`);
    }

    const inv = invoices[invoiceIndex];
    const payAmount = Math.min(params.amount, inv.pendingAmount);
    const updatedPaid = inv.paidAmount + payAmount;
    const updatedPending = Math.max(0, inv.amount - updatedPaid);
    const newStatus = updatedPending === 0 ? 'Paid' : 'Partially Paid';
    const payDate = params.paymentDate || new Date().toISOString().slice(0, 10);

    const payments = this.getVendorPayments();
    const newPaymentId = `PAY-2026-${String(payments.length + 101).padStart(3, '0')}`;

    let createdTransaction: ExpenseTransaction | undefined;

    // Record in Expense Ledger if requested
    if (params.recordInExpenseLedger !== false) {
      const monthNames: MonthShort[] = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      const parsedMonthIndex = parseInt(payDate.split('-')[1], 10) - 1;
      const txMonth: MonthShort = monthNames[parsedMonthIndex] || 'Sep';
      const txYear = parseInt(payDate.split('-')[0], 10) || 2026;

      createdTransaction = this.addTransaction({
        date: payDate,
        month: txMonth,
        year: txYear,
        category: inv.categoryName,
        description: `Supplier settlement: ${inv.vendorName} (${inv.invoiceNumber})`,
        vendor: inv.vendorName,
        amount: payAmount,
        department: inv.department || 'Operations',
        paymentMode: params.paymentMode,
        invoiceRef: inv.invoiceNumber,
        approvedBy: params.approvedBy || 'Finance Officer',
        status: 'Paid',
        notes: params.notes || `Paid against invoice ${inv.invoiceNumber}`,
      });
    }

    const paymentRecord: VendorPaymentRecord = {
      id: newPaymentId,
      paymentDate: payDate,
      vendorId: inv.vendorId,
      vendorName: inv.vendorName,
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      categoryId: inv.categoryId,
      categoryName: inv.categoryName,
      department: inv.department,
      amount: payAmount,
      paymentMode: params.paymentMode,
      referenceNumber: params.referenceNumber || `UTR-${Date.now()}`,
      approvedBy: params.approvedBy || 'Finance Officer',
      status: 'Completed',
      notes: params.notes,
      linkedTransactionId: createdTransaction?.id,
    };

    payments.unshift(paymentRecord);
    this.saveVendorPayments(payments);

    const updatedInvoice: VendorInvoice = {
      ...inv,
      paidAmount: updatedPaid,
      pendingAmount: updatedPending,
      status: newStatus,
      paymentMode: params.paymentMode,
      paidDate: payDate,
      referenceTransactionId: createdTransaction?.id || inv.referenceTransactionId,
    };

    invoices[invoiceIndex] = updatedInvoice;
    this.saveVendorInvoices(invoices);

    window.dispatchEvent(new CustomEvent('mysar_finance_data_changed'));

    return {
      payment: paymentRecord,
      invoice: updatedInvoice,
      transaction: createdTransaction,
    };
  }

  public getVendorSummaryMetrics(): VendorSummaryMetrics {
    const vendors = this.getVendors();
    const invoices = this.getVendorInvoices();
    const payments = this.getVendorPayments();
    const today = new Date().toISOString().slice(0, 10);

    const activeVendors = vendors.filter((v) => v.status === 'Active').length;

    let totalPayablesPending = 0;
    let overduePayables = 0;
    let overdueInvoicesCount = 0;
    let pendingInvoicesCount = 0;

    invoices.forEach((inv) => {
      if (inv.status !== 'Cancelled' && inv.status !== 'Paid' && inv.pendingAmount > 0) {
        totalPayablesPending += inv.pendingAmount;
        pendingInvoicesCount++;

        if (inv.status === 'Overdue' || inv.dueDate < today) {
          overduePayables += inv.pendingAmount;
          overdueInvoicesCount++;
        }
      }
    });

    const totalPaidYTD = payments.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalVendors: vendors.length,
      activeVendors,
      totalPayablesPending,
      overduePayables,
      overdueInvoicesCount,
      pendingInvoicesCount,
      totalPaidYTD,
      totalTransactionsCount: payments.length,
    };
  }

  public getVendorTransactions(vendorId: string): ExpenseTransaction[] {
    const vendors = this.getVendors();
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return [];

    const transactions = this.getTransactions();
    const vNameLower = vendor.name.toLowerCase();
    const vCodeLower = vendor.code.toLowerCase();

    return transactions.filter(
      (tx) =>
        tx.vendor.toLowerCase().includes(vNameLower) ||
        vNameLower.includes(tx.vendor.toLowerCase()) ||
        tx.description.toLowerCase().includes(vCodeLower) ||
        tx.invoiceRef?.toLowerCase().includes(vCodeLower)
    );
  }

  public getBudgetProjection(params?: {
    month?: MonthShort;
    year?: number;
    asOfDay?: number;
    burnRateMultiplier?: number;
    customDailyBurn?: number;
    department?: string;
    anticipatedLumpSum?: number;
  }): BudgetProjectionSummary {
    const daysInMonthMap: Record<MonthShort, number> = {
      Jan: 31, Feb: 28, Mar: 31, Apr: 30, May: 31, Jun: 30,
      Jul: 31, Aug: 31, Sep: 30, Oct: 31, Nov: 30, Dec: 31,
    };
    const monthNamesMap: Record<MonthShort, string> = {
      Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April', May: 'May', Jun: 'June',
      Jul: 'July', Aug: 'August', Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
    };

    const month = params?.month || 'Sep';
    const year = params?.year || 2026;
    const department = params?.department || 'All';
    const burnRateMultiplier = params?.burnRateMultiplier ?? 1.0;
    const anticipatedLumpSum = params?.anticipatedLumpSum || 0;

    const daysInMonth = daysInMonthMap[month] || 30;
    const defaultDay = year === 2026 && month === 'Sep' ? 15 : Math.round(daysInMonth / 2);
    const asOfDay = params?.asOfDay !== undefined ? Math.max(1, Math.min(params.asOfDay, daysInMonth)) : defaultDay;
    const daysElapsed = asOfDay;
    const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

    const monthlyList = this.getMonthlyData(year, department);
    const monthData = monthlyList.find((m) => m.month === month) || {
      month,
      fullMonth: monthNamesMap[month] || month,
      monthIndex: 9,
      year,
      budgetLimit: 1400000,
      actualExpenditure: 0,
      variance: 80000,
      variancePercent: 94.3,
      status: 'Under Budget' as BudgetHealthStatus,
      categoryBreakdown: {},
    };

    const monthlyBudgetLimit = monthData.budgetLimit;
    const transactions = this.getTransactions().filter(
      (tx) => tx.month === month && tx.year === year && (department === 'All' || tx.department === department)
    );

    // Cumulative spend of recorded transactions up to asOfDay
    const txSpendUpToDay = transactions.reduce((acc, tx) => {
      const dayNum = parseInt(tx.date.split('-')[2] || '1', 10);
      if (dayNum <= daysElapsed) {
        return acc + tx.amount;
      }
      return acc;
    }, 0);

    let currentSpend = 0;
    if (txSpendUpToDay > 0) {
      currentSpend = txSpendUpToDay;
    } else {
      currentSpend = Math.round((monthData.actualExpenditure / daysInMonth) * daysElapsed);
    }

    const rawDailyBurn = daysElapsed > 0 ? currentSpend / daysElapsed : 0;
    const dailyBurnRate =
      params?.customDailyBurn !== undefined
        ? params.customDailyBurn
        : Math.round(rawDailyBurn * burnRateMultiplier);

    const idealLinearDailyBurn = Math.round(monthlyBudgetLimit / daysInMonth);
    const projectedEOMSpend = Math.round(currentSpend + dailyBurnRate * daysRemaining + anticipatedLumpSum);
    const projectedVariance = monthlyBudgetLimit - projectedEOMSpend;
    const projectedVariancePercent =
      monthlyBudgetLimit > 0 ? Math.round((projectedEOMSpend / monthlyBudgetLimit) * 1000) / 10 : 0;

    const status: BudgetHealthStatus =
      projectedVariancePercent > 100
        ? 'Over Budget'
        : projectedVariancePercent >= 95
        ? 'On Track'
        : 'Under Budget';

    const isBreachProjected = projectedEOMSpend > monthlyBudgetLimit;

    let depletionDay: number | null = null;
    if (currentSpend >= monthlyBudgetLimit) {
      depletionDay = daysElapsed;
    } else if (dailyBurnRate > 0) {
      const daysToExhaust = (monthlyBudgetLimit - currentSpend) / dailyBurnRate;
      const calculatedBreachDay = Math.ceil(daysElapsed + daysToExhaust);
      if (calculatedBreachDay <= daysInMonth) {
        depletionDay = calculatedBreachDay;
      }
    }

    const safeRemainingDailyBurn =
      daysRemaining > 0
        ? Math.max(0, Math.round((monthlyBudgetLimit - currentSpend - anticipatedLumpSum) / daysRemaining))
        : 0;

    const dailyTrajectory: DailyTrajectoryPoint[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const proratedBudget = Math.round((monthlyBudgetLimit / daysInMonth) * d);
      let actualVal: number | null = null;
      let projVal: number = 0;

      if (d <= daysElapsed) {
        if (txSpendUpToDay > 0) {
          const spendAtD = transactions.reduce((acc, tx) => {
            const dayNum = parseInt(tx.date.split('-')[2] || '1', 10);
            return dayNum <= d ? acc + tx.amount : acc;
          }, 0);
          actualVal = spendAtD;
          projVal = spendAtD;
        } else {
          const proratedActual = Math.round((currentSpend / daysElapsed) * d);
          actualVal = proratedActual;
          projVal = proratedActual;
        }
      } else {
        actualVal = null;
        projVal = Math.round(currentSpend + dailyBurnRate * (d - daysElapsed));
        if (anticipatedLumpSum > 0 && d >= Math.min(daysElapsed + 3, daysInMonth)) {
          projVal += anticipatedLumpSum;
        }
      }

      dailyTrajectory.push({
        day: d,
        dayLabel: `${month} ${d}`,
        actualSpend: actualVal,
        projectedSpend: projVal,
        budgetCeiling: monthlyBudgetLimit,
        proratedBudget,
        isBreach: projVal > monthlyBudgetLimit,
      });
    }

    // Category-wise projections
    const caps = this.getCategoryBudgetCaps();
    const categoryProjections: CategoryBurnProjection[] = caps.map((cap) => {
      const catMonthlyCap = cap.monthlyCaps[month] || Math.round(cap.annualCap / 12);
      const catTxs = transactions.filter((tx) => tx.category === cap.categoryName);
      const catTxSpend = catTxs.reduce((acc, tx) => {
        const dayNum = parseInt(tx.date.split('-')[2] || '1', 10);
        return dayNum <= daysElapsed ? acc + tx.amount : acc;
      }, 0);

      let catCurrentSpend = 0;
      if (catTxSpend > 0) {
        catCurrentSpend = catTxSpend;
      } else {
        const fullCatSpend = monthData.categoryBreakdown?.[cap.categoryName] ?? Math.round(catMonthlyCap * 0.92);
        catCurrentSpend = Math.round((fullCatSpend / daysInMonth) * daysElapsed);
      }

      const catDailyBurn = Math.round((daysElapsed > 0 ? catCurrentSpend / daysElapsed : 0) * burnRateMultiplier);
      const catProjectedEOM = Math.round(catCurrentSpend + catDailyBurn * daysRemaining);
      const catVariance = catMonthlyCap - catProjectedEOM;
      const catVariancePercent =
        catMonthlyCap > 0 ? Math.round((catProjectedEOM / catMonthlyCap) * 1000) / 10 : 0;

      const catStatus: BudgetHealthStatus =
        catVariancePercent > 100
          ? 'Over Budget'
          : catVariancePercent >= 95
          ? 'On Track'
          : 'Under Budget';

      let catDepletionDay: number | null = null;
      if (catCurrentSpend >= catMonthlyCap) {
        catDepletionDay = daysElapsed;
      } else if (catDailyBurn > 0) {
        const daysToDeplete = (catMonthlyCap - catCurrentSpend) / catDailyBurn;
        const breachDay = Math.ceil(daysElapsed + daysToDeplete);
        if (breachDay <= daysInMonth) {
          catDepletionDay = breachDay;
        }
      }

      const catSafeBurn =
        daysRemaining > 0 ? Math.max(0, Math.round((catMonthlyCap - catCurrentSpend) / daysRemaining)) : 0;

      return {
        categoryId: cap.categoryId,
        categoryName: cap.categoryName,
        code: cap.code,
        department: cap.department,
        monthlyCap: catMonthlyCap,
        currentSpend: catCurrentSpend,
        dailyBurnRate: catDailyBurn,
        projectedEOMSpend: catProjectedEOM,
        projectedVariance: catVariance,
        projectedVariancePercent: catVariancePercent,
        status: catStatus,
        depletionDay: catDepletionDay,
        safeRemainingDailyBurn: catSafeBurn,
        color: cap.color,
      };
    });

    return {
      month,
      fullMonth: monthNamesMap[month] || month,
      year,
      daysInMonth,
      daysElapsed,
      daysRemaining,
      currentSpend,
      monthlyBudgetLimit,
      dailyBurnRate,
      idealLinearDailyBurn,
      projectedEOMSpend,
      projectedVariance,
      projectedVariancePercent,
      status,
      depletionDay,
      isBreachProjected,
      safeRemainingDailyBurn,
      burnRateMultiplier,
      categoryProjections,
      dailyTrajectory,
    };
  }

  public getVendorSpendBudgetContributionAnalysis(params?: {
    timeframe?: 'Annual' | 'Monthly';
    month?: MonthShort;
    year?: number;
  }): VendorSpendAnalysisSummary {
    const timeframe = params?.timeframe || 'Annual';
    const month = params?.month || 'Sep';
    const year = params?.year || 2026;

    const vendors = this.getVendors();
    const invoices = this.getVendorInvoices();
    const payments = this.getVendorPayments();
    const caps = this.getCategoryBudgetCaps();
    const monthlyData = this.getMonthlyData(year, 'All');

    // Determine Total Institutional Budget
    let totalInstitutionBudget = 0;
    if (timeframe === 'Annual') {
      totalInstitutionBudget = caps.reduce((sum, c) => sum + (c.annualCap || 0), 0);
      if (totalInstitutionBudget === 0) {
        totalInstitutionBudget = monthlyData.reduce((sum, m) => sum + m.budgetLimit, 0);
      }
    } else {
      const targetMonthData = monthlyData.find((m) => m.month === month);
      totalInstitutionBudget = targetMonthData?.budgetLimit || 1400000;
    }

    // Category cap map
    const categoryCapMap: Record<string, number> = {};
    const categoryColorMap: Record<string, string> = {};
    caps.forEach((c) => {
      const capVal =
        timeframe === 'Annual'
          ? c.annualCap || 1000000
          : c.monthlyCaps?.[month] || Math.round((c.annualCap || 1200000) / 12);
      categoryCapMap[c.categoryId] = capVal;
      categoryCapMap[c.categoryName] = capVal;
      categoryColorMap[c.categoryName] = c.color || '#168A45';
      categoryColorMap[c.categoryId] = c.color || '#168A45';
    });

    // Strategy & Cost driver mappings for known procurement archetypes
    const vendorOptimizationKnowledge: Record<
      string,
      { driver: string; strategy: string; savingsPercent: number }
    > = {
      'AWS-IND': {
        driver: 'EC2 On-Demand Instances, RDS Multi-AZ & Cloud S3 Storage',
        strategy: 'Transition from on-demand to 1-Year Compute Savings Plans & enable S3 Intelligent-Tiering (-22% discount).',
        savingsPercent: 0.22,
      },
      'VOLTAS-FAC': {
        driver: 'Seasonal Centralized HVAC Maintenance & Chiller Plant Spares',
        strategy: 'Consolidate chiller plant AMC with GreenEarth waste into a multi-facility integrated contract (-12% cost).',
        savingsPercent: 0.12,
      },
      'APEX-MKT': {
        driver: 'High-Impact Outdoor Billboards, State Admissions Expo & Radio Spots',
        strategy: 'Shift 35% of offline print budget to programmatic digital campaigns with trackable ROAS; negotiate annual agency retainer.',
        savingsPercent: 0.18,
      },
      'ROBO-LAB': {
        driver: 'STEM Microcontroller Kits, Raspberry Pi 5 & Robotics Sensors',
        strategy: 'Consortium bulk hardware procurement with sister colleges; negotiate multi-batch educational volume tiers (-15%).',
        savingsPercent: 0.15,
      },
      'AIRTEL-TEL': {
        driver: 'Dual 1 Gbps Leased Line Optical Fiber Internet & Public Static IPs',
        strategy: 'Renegotiate DIA bandwidth contract against prevailing TRAI wholesale enterprise tariffs; merge campus SIM pool.',
        savingsPercent: 0.14,
      },
      'EY-COMPL': {
        driver: 'Statutory Financial Audit, Transfer Pricing & Governance Advisory',
        strategy: 'Fixed-fee multi-year audit engagement cap; extend credit terms to Net 60 to protect operational liquidity.',
        savingsPercent: 0.10,
      },
      'GREEN-FAC': {
        driver: 'Biomedical & Campus Organic Waste Hauling and Garden Landscaping',
        strategy: 'Deploy on-campus organic composting to cut waste hauling trips by 40%; audit weekend billing hours.',
        savingsPercent: 0.12,
      },
      'PEARSON-ACAD': {
        driver: 'Digital e-Library Annual Student Seat Licenses & Courseware Packs',
        strategy: 'Migrate underutilized static student licenses to floating concurrent digital seats; negotiate 3-year consortium pricing.',
        savingsPercent: 0.14,
      },
      'KPTCL-UTIL': {
        driver: 'High-Tension 11KV Grid Substation Tariff (42,800 kWh Monthly Peak)',
        strategy: 'Accelerate Phase-2 rooftop solar net-metering; install automatic power factor correction (APFC) to capture DISCOM rebate.',
        savingsPercent: 0.15,
      },
      'PAYROLL-GATE': {
        driver: 'Corporate Direct Salary Gateway & Banking Linkage Fees',
        strategy: 'Leverage corporate float balance with depository bank to waive all transaction surcharge and NEFT/RTGS gateway fees.',
        savingsPercent: 0.05,
      },
    };

    // Calculate spend per vendor
    const monthPrefix = `2026-${String(
      ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1
    ).padStart(2, '0')}`;

    const vendorSpendList: VendorSpendBudgetContribution[] = vendors.map((v) => {
      // Filter invoices for this vendor
      let vInvoices = invoices.filter((inv) => inv.vendorId === v.id);
      let vPayments = payments.filter((p) => p.vendorId === v.id);

      if (timeframe === 'Monthly') {
        vInvoices = vInvoices.filter(
          (inv) =>
            inv.invoiceDate.startsWith(monthPrefix) ||
            inv.dueDate.startsWith(monthPrefix) ||
            inv.pendingAmount > 0
        );
        vPayments = vPayments.filter((p) => p.paymentDate.startsWith(monthPrefix));
      }

      const totalInvoiced = vInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const totalPaid = vPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalPending = vInvoices.reduce((sum, inv) => sum + inv.pendingAmount, 0);

      // Effective spend represents the vendor's total financial demand/commitment
      const effectiveSpend = Math.max(totalInvoiced, totalPaid);

      const categoryBudgetCap = categoryCapMap[v.categoryId] || categoryCapMap[v.categoryName] || 1000000;
      const categorySpendSharePercent = categoryBudgetCap > 0 ? (effectiveSpend / categoryBudgetCap) * 100 : 0;
      const totalBudgetContributionPercent =
        totalInstitutionBudget > 0 ? (effectiveSpend / totalInstitutionBudget) * 100 : 0;

      // Knowledge mapping or fallback rule
      const knowledge = vendorOptimizationKnowledge[v.code] || {
        driver: `${v.categoryName} commercial deliverables & supplies`,
        strategy:
          categorySpendSharePercent > 30
            ? 'High category concentration: Conduct competitive benchmark RFP and negotiate volume rebate tiers.'
            : 'Review service level agreements (SLAs) and enforce prompt payment discounts (2/10 Net 30).',
        savingsPercent: categorySpendSharePercent > 30 ? 0.12 : 0.08,
      };

      // Risk level
      let concentrationRisk: 'High' | 'Moderate' | 'Low' = 'Low';
      if (totalBudgetContributionPercent >= 7 || categorySpendSharePercent >= 45) {
        concentrationRisk = 'High';
      } else if (totalBudgetContributionPercent >= 2.5 || categorySpendSharePercent >= 20) {
        concentrationRisk = 'Moderate';
      }

      const potentialAnnualSavings = Math.round(effectiveSpend * knowledge.savingsPercent * (timeframe === 'Monthly' ? 12 : 1));

      return {
        vendorId: v.id,
        vendorName: v.name,
        vendorCode: v.code,
        categoryName: v.categoryName,
        categoryId: v.categoryId,
        department: v.department,
        totalInvoiced,
        totalPaid,
        totalPending,
        effectiveSpend,
        categoryBudgetCap,
        categorySpendSharePercent: parseFloat(categorySpendSharePercent.toFixed(1)),
        totalInstitutionBudget,
        totalBudgetContributionPercent: parseFloat(totalBudgetContributionPercent.toFixed(2)),
        procurementSharePercent: 0, // calculated below after total procurement sum
        cumulativeProcurementPercent: 0,
        concentrationRisk,
        primaryCostDriver: knowledge.driver,
        costOptimizationStrategy: knowledge.strategy,
        potentialAnnualSavings,
        paymentTerms: v.paymentTerms,
        invoicesCount: vInvoices.length,
        paymentsCount: vPayments.length,
        color: categoryColorMap[v.categoryName] || '#168A45',
        rank: 0,
      };
    });

    // Sort descending by effective spend
    vendorSpendList.sort((a, b) => b.effectiveSpend - a.effectiveSpend);

    // Calculate total procurement spend
    const totalProcurementSpend = vendorSpendList.reduce((sum, v) => sum + v.effectiveSpend, 0);

    // Calculate procurement shares and cumulative Pareto percentages
    let runningSum = 0;
    vendorSpendList.forEach((v, idx) => {
      v.rank = idx + 1;
      v.procurementSharePercent =
        totalProcurementSpend > 0
          ? parseFloat(((v.effectiveSpend / totalProcurementSpend) * 100).toFixed(1))
          : 0;
      runningSum += v.effectiveSpend;
      v.cumulativeProcurementPercent =
        totalProcurementSpend > 0
          ? parseFloat(((runningSum / totalProcurementSpend) * 100).toFixed(1))
          : 0;
    });

    // Top 3 Vendors Concentration Ratio
    const top3Spend = vendorSpendList.slice(0, 3).reduce((sum, v) => sum + v.effectiveSpend, 0);
    const topVendorsConcentrationRatio =
      totalProcurementSpend > 0 ? parseFloat(((top3Spend / totalProcurementSpend) * 100).toFixed(1)) : 0;

    const procurementToBudgetRatio =
      totalInstitutionBudget > 0
        ? parseFloat(((totalProcurementSpend / totalInstitutionBudget) * 100).toFixed(1))
        : 0;

    const totalPotentialSavings = vendorSpendList.reduce((sum, v) => sum + v.potentialAnnualSavings, 0);

    // Group summaries by Category
    const categoryMap: Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        budgetCap: number;
        vendorSpend: number;
        vendorsCount: number;
        topVendorName: string;
        topVendorSpend: number;
        color: string;
      }
    > = {};

    caps.forEach((c) => {
      const capVal = categoryCapMap[c.categoryId] || 1000000;
      categoryMap[c.categoryId] = {
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        budgetCap: capVal,
        vendorSpend: 0,
        vendorsCount: 0,
        topVendorName: 'None',
        topVendorSpend: 0,
        color: c.color || '#168A45',
      };
    });

    vendorSpendList.forEach((v) => {
      const cat = categoryMap[v.categoryId];
      if (cat) {
        cat.vendorSpend += v.effectiveSpend;
        cat.vendorsCount++;
        if (v.effectiveSpend > cat.topVendorSpend) {
          cat.topVendorSpend = v.effectiveSpend;
          cat.topVendorName = v.vendorName;
        }
      }
    });

    const categorySummaries = Object.values(categoryMap).map((cat) => ({
      ...cat,
      vendorSpendSharePercent:
        cat.budgetCap > 0 ? parseFloat(((cat.vendorSpend / cat.budgetCap) * 100).toFixed(1)) : 0,
    }));

    return {
      timeframe,
      fiscalYear: year,
      month,
      totalInstitutionBudget,
      totalProcurementSpend,
      procurementToBudgetRatio,
      totalActiveVendors: vendors.filter((v) => v.status === 'Active').length,
      topVendorsConcentrationRatio,
      highestBudgetVendor: vendorSpendList[0] || null,
      totalPotentialSavings,
      vendorContributions: vendorSpendList,
      categorySummaries,
    };
  }

  public resetFinanceData(): void {
    localStorage.removeItem(STORAGE_KEYS.MONTHLY_DATA);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGET_CAPS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.VENDORS);
    localStorage.removeItem(STORAGE_KEYS.VENDOR_INVOICES);
    localStorage.removeItem(STORAGE_KEYS.VENDOR_PAYMENTS);
    window.dispatchEvent(new CustomEvent('mysar_finance_data_changed'));
  }
}

export const financeStorage = new FinanceStorageService();

// Export extended ERP accounting engine and unified storage
export { accountingEngine } from './finance/accountingEngine';
export { erpFinanceStorage, COMPANY_CONFIG } from './finance/erpFinanceStorage';
