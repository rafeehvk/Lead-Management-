/**
 * budgetEngine.ts
 * 
 * Comprehensive Budgeting & Commitment Lifecycle Engine for Casbiro Solutions Private Limited (MYSAR).
 * 
 * Core Architectural Principles:
 * - Budget vs Committed vs Actual vs Available
 * - Committed: Open PO amounts not yet invoiced
 * - Actual: Posted invoices & direct expenses
 * - Available: Budget - Committed - Actual
 * - Utilization %: (Committed + Actual) / Budget * 100
 * - Variance: Budget - Actual (post-close metric)
 * - Rollup Rule: Most specific matching budget wins; parent-level totals are aggregates
 * - Revisions: Never overwrite original budget, maintain revision history
 * - Transfers: Block transfers that drive source Available below zero
 * - Configurable Controls: Block / Warning / Approval
 * - Configurable Alerts: Normal (<75%), Warning (75%), Critical (90%), Fully Utilized (100%), Over Budget (>100%)
 */

import {
  BudgetMasterRecord,
  BudgetAllocationRecord,
  BudgetCommitmentRecord,
  BudgetTransferRecord,
  BudgetRevisionRecord,
  BudgetControlConfig,
  BudgetAlertThresholds,
  BudgetType,
  BudgetPeriod,
  BudgetStatus,
  BudgetControlRule,
} from '../../types/finance';

export interface BudgetMetrics {
  totalBudget: number;
  totalCommitted: number;
  totalActual: number;
  totalAvailable: number;
  utilizationRate: number; // %
  variance: number; // Budget - Actual
  health: 'Normal' | 'Warning' | 'Critical' | 'OverBudget';
}

export const DEFAULT_BUDGET_ALERTS: BudgetAlertThresholds = {
  normalBelow: 75,
  warningAt: 75,
  criticalAt: 90,
  fullyUtilizedAt: 100,
  overBudgetAbove: 100,
  channels: {
    inApp: true,
    email: true,
    sms: false,
    push: true,
  },
};

export const DEFAULT_BUDGET_CONTROLS: BudgetControlConfig[] = [
  {
    id: 'CTRL-01',
    module: 'Purchase',
    department: 'IT & Tech',
    rule: 'Block',
    isActive: true,
    description: 'Hard block PO creation if committed + requested exceeds Available budget',
  },
  {
    id: 'CTRL-02',
    module: 'Expense',
    department: 'Operations',
    rule: 'Warning',
    isActive: true,
    description: 'Display warning prompt when direct expense exceeds department available budget',
  },
  {
    id: 'CTRL-03',
    module: 'All',
    department: 'Sales & Marketing',
    rule: 'Approval',
    isActive: true,
    description: 'Require CFO / Management Tier approval when Available budget is under 10%',
  },
];

export const SEED_BUDGET_MASTERS: BudgetMasterRecord[] = [
  {
    id: 'BDG-2026-001',
    budgetName: 'FY 2026-27 Corporate Operations Master',
    financialYear: '2026-2027',
    budgetPeriod: 'Annual',
    budgetType: 'Annual',
    branch: 'Kochi HQ',
    department: 'Operations',
    project: 'General',
    costCenter: 'CC-101 Corporate HQ',
    currency: 'INR',
    description: 'Primary corporate operational expenditure budget covering all headquarter facilities',
    totalBudget: 4500000,
    revisedBudget: 4800000,
    status: 'Active',
    approvedBy: 'Finance Director',
    approvedDate: '2026-03-28',
    createdAt: '2026-03-15',
    updatedAt: '2026-05-10',
  },
  {
    id: 'BDG-2026-002',
    budgetName: 'Cloud Infrastructure & Tech Expansion',
    financialYear: '2026-2027',
    budgetPeriod: 'Annual',
    budgetType: 'Department',
    branch: 'Kochi HQ',
    department: 'IT & Tech',
    project: 'Cloud Modernization',
    costCenter: 'CC-102 IT Infra',
    currency: 'INR',
    description: 'Server hardware, cloud hosting clusters, cybersecurity tooling and developer workstations',
    totalBudget: 2800000,
    revisedBudget: 2800000,
    status: 'Active',
    approvedBy: 'Chief Technology Officer',
    approvedDate: '2026-04-02',
    createdAt: '2026-03-20',
    updatedAt: '2026-04-02',
  },
  {
    id: 'BDG-2026-003',
    budgetName: 'Calicut Campus Facility Modernization',
    financialYear: '2026-2027',
    budgetPeriod: 'Annual',
    budgetType: 'Branch',
    branch: 'Calicut Branch',
    department: 'Administration',
    project: 'Campus Expansion',
    costCenter: 'CC-104 Logistics',
    currency: 'INR',
    description: 'Civil renovations, laboratory workstation fit-outs, and campus networking infrastructure',
    totalBudget: 1800000,
    revisedBudget: 1800000,
    status: 'Active',
    approvedBy: 'Operations Manager',
    approvedDate: '2026-04-05',
    createdAt: '2026-03-25',
    updatedAt: '2026-04-05',
  },
  {
    id: 'BDG-2026-004',
    budgetName: 'Digital Marketing & Academic Outreach Q1',
    financialYear: '2026-2027',
    budgetPeriod: 'Quarterly',
    budgetType: 'Expense',
    branch: 'Kochi HQ',
    department: 'Sales & Marketing',
    project: 'ERP Rollout',
    costCenter: 'CC-101 Corporate HQ',
    currency: 'INR',
    description: 'Digital advertising, conferences, educational seminars and collateral distribution',
    totalBudget: 900000,
    revisedBudget: 850000,
    status: 'Active',
    approvedBy: 'Marketing Lead',
    approvedDate: '2026-04-01',
    createdAt: '2026-03-28',
    updatedAt: '2026-04-18',
  },
];

export const SEED_BUDGET_ALLOCATIONS: BudgetAllocationRecord[] = [
  {
    id: 'ALC-001',
    budgetId: 'BDG-2026-002',
    budgetName: 'Cloud Infrastructure & Tech Expansion',
    category: 'Cloud Hosting & Servers',
    department: 'IT & Tech',
    branch: 'Kochi HQ',
    project: 'Cloud Modernization',
    costCenter: 'CC-102 IT Infra',
    period: 'FY 2026-27',
    budgetAmount: 1400000,
    remarks: 'AWS & Google Cloud Run dedicated allocations',
  },
  {
    id: 'ALC-002',
    budgetId: 'BDG-2026-002',
    budgetName: 'Cloud Infrastructure & Tech Expansion',
    category: 'Workstations & Laptops',
    department: 'IT & Tech',
    branch: 'Kochi HQ',
    project: 'Cloud Modernization',
    costCenter: 'CC-102 IT Infra',
    period: 'FY 2026-27',
    budgetAmount: 900000,
    remarks: 'High performance developer workstations',
  },
  {
    id: 'ALC-003',
    budgetId: 'BDG-2026-002',
    budgetName: 'Cloud Infrastructure & Tech Expansion',
    category: 'Software Licenses & SaaS',
    department: 'IT & Tech',
    branch: 'Kochi HQ',
    project: 'Cloud Modernization',
    costCenter: 'CC-102 IT Infra',
    period: 'FY 2026-27',
    budgetAmount: 500000,
    remarks: 'JetBrains, Figma, GitHub Enterprise licenses',
  },
  {
    id: 'ALC-004',
    budgetId: 'BDG-2026-001',
    budgetName: 'FY 2026-27 Corporate Operations Master',
    category: 'Facility Rent & Utilities',
    department: 'Operations',
    branch: 'Kochi HQ',
    project: 'General',
    costCenter: 'CC-101 Corporate HQ',
    period: 'FY 2026-27',
    budgetAmount: 2500000,
    remarks: 'Headquarters commercial lease & power',
  },
  {
    id: 'ALC-005',
    budgetId: 'BDG-2026-001',
    budgetName: 'FY 2026-27 Corporate Operations Master',
    category: 'Maintenance & Janitorial',
    department: 'Operations',
    branch: 'Kochi HQ',
    project: 'General',
    costCenter: 'CC-101 Corporate HQ',
    period: 'FY 2026-27',
    budgetAmount: 1200000,
    remarks: 'Preventative repairs & ongoing facility sanitization',
  },
  {
    id: 'ALC-006',
    budgetId: 'BDG-2026-001',
    budgetName: 'FY 2026-27 Corporate Operations Master',
    category: 'Office Supplies & Print',
    department: 'Operations',
    branch: 'Kochi HQ',
    project: 'General',
    costCenter: 'CC-101 Corporate HQ',
    period: 'FY 2026-27',
    budgetAmount: 1100000,
    remarks: 'Stationery and administrative consumables',
  },
];

export const SEED_BUDGET_COMMITMENTS: BudgetCommitmentRecord[] = [
  {
    id: 'CMT-001',
    budgetId: 'BDG-2026-002',
    poId: 'po-201',
    poNumber: 'PO-2026-0048',
    categoryCode: 'Workstations & Laptops',
    categoryName: 'Workstations & Laptops',
    department: 'IT & Tech',
    branch: 'Kochi HQ',
    project: 'Cloud Modernization',
    costCenter: 'CC-102 IT Infra',
    vendorName: 'Apex Cloud Systems Private Limited',
    originalAmount: 420000,
    releasedAmount: 240000,
    activeCommitment: 180000, // 420,000 - 240,000
    date: '2026-05-14',
    status: 'Partially Released',
    invoicedActualAmount: 240000,
    varianceAmount: 0,
  },
  {
    id: 'CMT-002',
    budgetId: 'BDG-2026-001',
    poId: 'po-202',
    poNumber: 'PO-2026-0052',
    categoryCode: 'Office Supplies & Print',
    categoryName: 'Office Supplies & Print',
    department: 'Operations',
    branch: 'Kochi HQ',
    project: 'General',
    costCenter: 'CC-101 Corporate HQ',
    vendorName: 'Sterling Facility & Maintenance Works',
    originalAmount: 150000,
    releasedAmount: 0,
    activeCommitment: 150000,
    date: '2026-06-02',
    status: 'Active',
    invoicedActualAmount: 0,
  },
  {
    id: 'CMT-003',
    budgetId: 'BDG-2026-002',
    poId: 'po-203',
    poNumber: 'PO-2026-0061',
    categoryCode: 'Cloud Hosting & Servers',
    categoryName: 'Cloud Hosting & Servers',
    department: 'IT & Tech',
    branch: 'Kochi HQ',
    project: 'Cloud Modernization',
    costCenter: 'CC-102 IT Infra',
    vendorName: 'Apex Cloud Systems Private Limited',
    originalAmount: 300000,
    releasedAmount: 300000,
    activeCommitment: 0,
    date: '2026-04-10',
    status: 'Fully Released',
    invoicedActualAmount: 310000, // +10,000 price variance flowed into Actual
    varianceAmount: 10000,
  },
];

export const SEED_BUDGET_REVISIONS: BudgetRevisionRecord[] = [
  {
    id: 'REV-001',
    budgetId: 'BDG-2026-001',
    budgetName: 'FY 2026-27 Corporate Operations Master',
    categoryCode: 'Maintenance & Janitorial',
    categoryName: 'Maintenance & Janitorial',
    originalCap: 4500000,
    revisedCap: 4800000,
    revisionAmount: 300000,
    reason: 'Emergency electrical and HVAC overhaul approval per Board resolution #24',
    requestedBy: 'Operations Manager',
    approvedBy: 'Finance Director',
    date: '2026-05-10',
    revisionDate: '2026-05-10',
  },
  {
    id: 'REV-002',
    budgetId: 'BDG-2026-004',
    budgetName: 'Digital Marketing & Academic Outreach Q1',
    categoryCode: 'Digital Outreach',
    categoryName: 'Digital Outreach',
    originalCap: 900000,
    revisedCap: 850000,
    revisionAmount: -50000,
    reason: 'Internal reallocation towards IT developer workstations',
    requestedBy: 'Marketing Lead',
    approvedBy: 'CFO',
    date: '2026-04-18',
    revisionDate: '2026-04-18',
  },
];

export const SEED_BUDGET_TRANSFERS: BudgetTransferRecord[] = [
  {
    id: 'TRF-001',
    transferNumber: 'TRF-2026-001',
    date: '2026-05-15',
    sourceBudgetId: 'BDG-2026-001',
    sourceCategoryCode: 'Office Supplies & Print',
    sourceCategoryName: 'Office Supplies & Print',
    destinationBudgetId: 'BDG-2026-002',
    destinationCategoryCode: 'Software Licenses & SaaS',
    destinationCategoryName: 'Software Licenses & SaaS',
    amount: 75000,
    reason: 'Reallocate administrative paper savings to cloud monitoring SaaS tooling',
    requestedBy: 'Operations Officer',
    approvedBy: 'Finance Manager',
    status: 'Approved',
    auditNotes: 'Verified source Available headroom was ₹480,000 before ₹75,000 transfer',
  },
];

/**
 * Budget Calculation Engine Service
 */
class BudgetEngineService {
  private budgets: BudgetMasterRecord[] = [];
  private allocations: BudgetAllocationRecord[] = [];
  private commitments: BudgetCommitmentRecord[] = [];
  private revisions: BudgetRevisionRecord[] = [];
  private transfers: BudgetTransferRecord[] = [];
  private controls: BudgetControlConfig[] = [];
  private alertSettings: BudgetAlertThresholds = DEFAULT_BUDGET_ALERTS;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const b = localStorage.getItem('mysar_erp_budget_masters_v1');
      this.budgets = b ? JSON.parse(b) : [...SEED_BUDGET_MASTERS];

      const a = localStorage.getItem('mysar_erp_budget_allocations_v1');
      this.allocations = a ? JSON.parse(a) : [...SEED_BUDGET_ALLOCATIONS];

      const c = localStorage.getItem('mysar_erp_budget_commitments_v2');
      this.commitments = c ? JSON.parse(c) : [...SEED_BUDGET_COMMITMENTS];

      const r = localStorage.getItem('mysar_erp_budget_revisions_v2');
      this.revisions = r ? JSON.parse(r) : [...SEED_BUDGET_REVISIONS];

      const t = localStorage.getItem('mysar_erp_budget_transfers_v2');
      this.transfers = t ? JSON.parse(t) : [...SEED_BUDGET_TRANSFERS];

      const ctrl = localStorage.getItem('mysar_erp_budget_controls_v1');
      this.controls = ctrl ? JSON.parse(ctrl) : [...DEFAULT_BUDGET_CONTROLS];

      const alrt = localStorage.getItem('mysar_erp_budget_alert_settings_v1');
      this.alertSettings = alrt ? JSON.parse(alrt) : DEFAULT_BUDGET_ALERTS;
    } catch {
      this.budgets = [...SEED_BUDGET_MASTERS];
      this.allocations = [...SEED_BUDGET_ALLOCATIONS];
      this.commitments = [...SEED_BUDGET_COMMITMENTS];
      this.revisions = [...SEED_BUDGET_REVISIONS];
      this.transfers = [...SEED_BUDGET_TRANSFERS];
      this.controls = [...DEFAULT_BUDGET_CONTROLS];
      this.alertSettings = DEFAULT_BUDGET_ALERTS;
    }
  }

  private persistBudgets() {
    localStorage.setItem('mysar_erp_budget_masters_v1', JSON.stringify(this.budgets));
  }

  private persistAllocations() {
    localStorage.setItem('mysar_erp_budget_allocations_v1', JSON.stringify(this.allocations));
  }

  private persistCommitments() {
    localStorage.setItem('mysar_erp_budget_commitments_v2', JSON.stringify(this.commitments));
  }

  private persistRevisions() {
    localStorage.setItem('mysar_erp_budget_revisions_v2', JSON.stringify(this.revisions));
  }

  private persistTransfers() {
    localStorage.setItem('mysar_erp_budget_transfers_v2', JSON.stringify(this.transfers));
  }

  private persistControls() {
    localStorage.setItem('mysar_erp_budget_controls_v1', JSON.stringify(this.controls));
  }

  public persistAlerts(newSettings: BudgetAlertThresholds) {
    this.alertSettings = newSettings;
    localStorage.setItem('mysar_erp_budget_alert_settings_v1', JSON.stringify(this.alertSettings));
  }

  // --- CORE FORMULAS & METRICS ---
  /**
   * Calculates Committed, Actual, Available, Utilization and Variance for a given budget or aggregate
   */
  public computeBudgetMetrics(budgetId?: string): BudgetMetrics {
    const relevantBudgets = budgetId
      ? this.budgets.filter((b) => b.id === budgetId)
      : this.budgets.filter((b) => b.status === 'Active' || b.status === 'Approved');

    const totalBudget = relevantBudgets.reduce(
      (sum, b) => sum + (b.revisedBudget || b.totalBudget),
      0
    );

    // Sum of open PO amounts not yet invoiced
    const relevantCommitments = budgetId
      ? this.commitments.filter((c) => c.budgetId === budgetId)
      : this.commitments;

    const totalCommitted = relevantCommitments
      .filter((c) => c.status === 'Active' || c.status === 'Partially Released')
      .reduce((sum, c) => sum + c.activeCommitment, 0);

    // Actual invoiced amounts + direct expenses
    const totalActual = relevantCommitments.reduce(
      (sum, c) => sum + (c.invoicedActualAmount || c.releasedAmount || 0),
      0
    ) + (budgetId ? 0 : 540000); // include simulated direct non-PO expenses

    // Available: Budget − Committed − Actual
    const totalAvailable = Math.max(0, totalBudget - totalCommitted - totalActual);

    // Utilization: (Committed + Actual) / Budget * 100
    const utilizationRate = totalBudget > 0
      ? Math.round(((totalCommitted + totalActual) / totalBudget) * 1000) / 10
      : 0;

    // Variance: Budget − Actual (post-close metric)
    const variance = totalBudget - totalActual;

    let health: 'Normal' | 'Warning' | 'Critical' | 'OverBudget' = 'Normal';
    if (utilizationRate > 100) health = 'OverBudget';
    else if (utilizationRate >= 90) health = 'Critical';
    else if (utilizationRate >= 75) health = 'Warning';

    return {
      totalBudget,
      totalCommitted,
      totalActual,
      totalAvailable,
      utilizationRate,
      variance,
      health,
    };
  }

  // --- COMMITMENT LIFECYCLE ---
  /**
   * PO Approved -> Committed += po.amount
   */
  public onPoApproved(params: {
    poId: string;
    poNumber: string;
    department: string;
    amount: number;
    categoryCode?: string;
    vendorName?: string;
    budgetId?: string;
  }): BudgetCommitmentRecord {
    // Rollup rule: Find matching budget
    const targetBudgetId = params.budgetId || this.findMatchingBudget({
      department: params.department,
      category: params.categoryCode,
    })?.id || this.budgets[0]?.id || 'BDG-2026-001';

    const record: BudgetCommitmentRecord = {
      id: `CMT-${Date.now().toString().slice(-4)}`,
      budgetId: targetBudgetId,
      poId: params.poId,
      poNumber: params.poNumber,
      categoryCode: params.categoryCode || 'General Procurement',
      categoryName: params.categoryCode || 'General Procurement',
      department: params.department,
      vendorName: params.vendorName,
      originalAmount: params.amount,
      releasedAmount: 0,
      activeCommitment: params.amount,
      date: new Date().toISOString().split('T')[0],
      status: 'Active',
      invoicedActualAmount: 0,
    };

    this.commitments.unshift(record);
    this.persistCommitments();
    return record;
  }

  /**
   * PO Invoiced -> Committed -= invoicedAmount; Actual += finalAmount (price variance flows into Actual)
   */
  public onPoInvoiced(params: {
    poId: string;
    invoicedAmountReleased: number;
    finalBilledAmount: number;
  }): boolean {
    const commitment = this.commitments.find((c) => c.poId === params.poId);
    if (!commitment) return false;

    commitment.releasedAmount += params.invoicedAmountReleased;
    commitment.activeCommitment = Math.max(0, commitment.originalAmount - commitment.releasedAmount);
    commitment.invoicedActualAmount = (commitment.invoicedActualAmount || 0) + params.finalBilledAmount;
    commitment.varianceAmount = commitment.invoicedActualAmount - commitment.releasedAmount;

    if (commitment.activeCommitment <= 0) {
      commitment.status = 'Fully Released';
    } else {
      commitment.status = 'Partially Released';
    }

    this.persistCommitments();
    return true;
  }

  /**
   * PO Cancelled -> Committed -= un-invoiced amount only
   */
  public onPoCancelled(poId: string): boolean {
    const commitment = this.commitments.find((c) => c.poId === poId);
    if (!commitment) return false;

    // Release remaining un-invoiced commitment
    commitment.activeCommitment = 0;
    commitment.status = 'Cancelled';
    this.persistCommitments();
    return true;
  }

  /**
   * Direct expense or bill without prior PO encumbrance posts straight to Actual
   */
  public recordActualExpenditure(params: {
    category?: string;
    department?: string;
    branch?: string;
    costCenter?: string;
    amount: number;
    referenceType?: string;
    referenceId?: string;
    referenceNumber?: string;
  }): void {
    const budget = this.findMatchingBudget({
      department: params.department,
      branch: params.branch,
      costCenter: params.costCenter,
      category: params.category,
    });

    const entry: BudgetCommitmentRecord = {
      id: `DIR-EXP-${Date.now().toString().slice(-4)}`,
      poId: params.referenceId || `exp-${Date.now()}`,
      poNumber: params.referenceNumber || `EXP-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      department: params.department || budget?.department || 'Operations',
      branch: params.branch || budget?.branch || 'Kochi HQ',
      costCenter: params.costCenter || budget?.costCenter || 'CC-OPERATIONS',
      categoryCode: params.category || 'Direct Expense',
      budgetId: budget?.id,
      originalAmount: 0,
      releasedAmount: 0,
      activeCommitment: 0,
      invoicedActualAmount: params.amount,
      varianceAmount: 0,
      status: 'Fully Released',
    };
    this.commitments.unshift(entry);
    this.persistCommitments();
  }

  // --- ROLLUP MATCHING RULE ---
  /**
   * A transaction posts to the most specific matching budget (Dept + Branch + Cost Center if it exists).
   * Parent-level (Branch/Company) totals are aggregates of children, not independently tracked ceilings.
   */
  public findMatchingBudget(criteria: {
    department?: string;
    branch?: string;
    costCenter?: string;
    category?: string;
  }): BudgetMasterRecord | undefined {
    // 1. Exact match (Dept + Branch + Cost Center)
    if (criteria.department && criteria.branch && criteria.costCenter) {
      const match = this.budgets.find(
        (b) =>
          b.department.toLowerCase() === criteria.department!.toLowerCase() &&
          b.branch.toLowerCase() === criteria.branch!.toLowerCase() &&
          b.costCenter.toLowerCase() === criteria.costCenter!.toLowerCase()
      );
      if (match) return match;
    }

    // 2. Dept + Branch match
    if (criteria.department && criteria.branch) {
      const match = this.budgets.find(
        (b) =>
          b.department.toLowerCase() === criteria.department!.toLowerCase() &&
          b.branch.toLowerCase() === criteria.branch!.toLowerCase()
      );
      if (match) return match;
    }

    // 3. Dept match
    if (criteria.department) {
      const match = this.budgets.find(
        (b) => b.department.toLowerCase() === criteria.department!.toLowerCase()
      );
      if (match) return match;
    }

    // 4. Default to first active budget
    return this.budgets.find((b) => b.status === 'Active') || this.budgets[0];
  }

  // --- BUDGET REVISION (NEVER OVERWRITE ORIGINAL) ---
  public createBudgetRevision(params: {
    budgetId: string;
    newTotalAmount: number;
    reason: string;
    requestedBy: string;
    approvedBy: string;
  }): { success: boolean; revision?: BudgetRevisionRecord; error?: string } {
    const budget = this.budgets.find((b) => b.id === params.budgetId);
    if (!budget) return { success: false, error: 'Budget not found' };

    const originalCap = budget.revisedBudget || budget.totalBudget;
    const revisionAmount = params.newTotalAmount - originalCap;

    const revision: BudgetRevisionRecord = {
      id: `REV-${Date.now().toString().slice(-4)}`,
      budgetId: budget.id,
      budgetName: budget.budgetName,
      categoryCode: budget.department,
      categoryName: budget.department,
      originalCap,
      revisedCap: params.newTotalAmount,
      revisionAmount,
      reason: params.reason,
      requestedBy: params.requestedBy,
      approvedBy: params.approvedBy,
      date: new Date().toISOString().split('T')[0],
      revisionDate: new Date().toISOString().split('T')[0],
    };

    // Update revised amount only; never mutate initial totalBudget
    budget.revisedBudget = params.newTotalAmount;
    budget.updatedAt = new Date().toISOString().split('T')[0];

    this.revisions.unshift(revision);
    this.persistBudgets();
    this.persistRevisions();

    return { success: true, revision };
  }

  // --- BUDGET TRANSFER (SOURCE BALANCE PROTECTION) ---
  public createBudgetTransfer(params: {
    sourceBudgetId: string;
    destinationBudgetId: string;
    amount: number;
    reason: string;
    requestedBy: string;
    approvedBy?: string;
    overrideProtection?: boolean;
  }): { success: boolean; transfer?: BudgetTransferRecord; error?: string } {
    const source = this.budgets.find((b) => b.id === params.sourceBudgetId);
    const destination = this.budgets.find((b) => b.id === params.destinationBudgetId);

    if (!source || !destination) {
      return { success: false, error: 'Source or destination budget not found' };
    }

    if (source.id === destination.id) {
      return { success: false, error: 'Cannot transfer between the same budget' };
    }

    // Live Available check on Source Budget
    const sourceMetrics = this.computeBudgetMetrics(source.id);
    if (!params.overrideProtection && sourceMetrics.totalAvailable < params.amount) {
      return {
        success: false,
        error: `Insufficient Available headroom in '${source.budgetName}'. Available: ₹${sourceMetrics.totalAvailable.toLocaleString('en-IN')}, Requested: ₹${params.amount.toLocaleString('en-IN')}. Transfer blocked.`,
      };
    }

    const transferNumber = `TRF-${new Date().getFullYear()}-${(this.transfers.length + 1).toString().padStart(3, '0')}`;

    const transfer: BudgetTransferRecord = {
      id: `TRF-${Date.now().toString().slice(-4)}`,
      transferNumber,
      date: new Date().toISOString().split('T')[0],
      sourceBudgetId: source.id,
      sourceCategoryCode: source.department,
      sourceCategoryName: `${source.budgetName} (${source.department})`,
      destinationBudgetId: destination.id,
      destinationCategoryCode: destination.department,
      destinationCategoryName: `${destination.budgetName} (${destination.department})`,
      amount: params.amount,
      reason: params.reason,
      requestedBy: params.requestedBy,
      approvedBy: params.approvedBy || 'Finance Director',
      status: 'Approved',
      auditNotes: `Transferred ₹${params.amount.toLocaleString('en-IN')} from ${source.id} to ${destination.id}`,
    };

    // Apply transfer to revised figures
    source.revisedBudget = (source.revisedBudget || source.totalBudget) - params.amount;
    destination.revisedBudget = (destination.revisedBudget || destination.totalBudget) + params.amount;

    this.transfers.unshift(transfer);
    this.persistBudgets();
    this.persistTransfers();

    return { success: true, transfer };
  }

  // --- BUDGET CONTROL CHECKER ---
  public checkBudgetControl(params: {
    module: 'Purchase' | 'Expense';
    department: string;
    requestedAmount: number;
    budgetId?: string;
  }): {
    allowed: boolean;
    rule: BudgetControlRule;
    availableHeadroom: number;
    message?: string;
  } {
    const budget = params.budgetId
      ? this.budgets.find((b) => b.id === params.budgetId)
      : this.findMatchingBudget({ department: params.department });

    const metrics = this.computeBudgetMetrics(budget?.id);
    const available = metrics.totalAvailable;

    // Match control config
    const control = this.controls.find(
      (c) =>
        c.isActive &&
        (c.module === 'All' || c.module === params.module) &&
        (!c.department || c.department.toLowerCase() === params.department.toLowerCase())
    ) || { rule: 'Warning' as BudgetControlRule };

    const exceeds = params.requestedAmount > available;

    if (!exceeds) {
      return { allowed: true, rule: control.rule, availableHeadroom: available };
    }

    if (control.rule === 'Block') {
      return {
        allowed: false,
        rule: 'Block',
        availableHeadroom: available,
        message: `Transaction BLOCKED: Requested amount ₹${params.requestedAmount.toLocaleString('en-IN')} exceeds Available budget ₹${available.toLocaleString('en-IN')} for ${params.department}.`,
      };
    }

    if (control.rule === 'Approval') {
      return {
        allowed: true,
        rule: 'Approval',
        availableHeadroom: available,
        message: `REQUIRES APPROVAL: Transaction exceeds Available budget by ₹${(params.requestedAmount - available).toLocaleString('en-IN')}. Escalated to Finance Management.`,
      };
    }

    return {
      allowed: true,
      rule: 'Warning',
      availableHeadroom: available,
      message: `WARNING: Transaction of ₹${params.requestedAmount.toLocaleString('en-IN')} exceeds Available headroom of ₹${available.toLocaleString('en-IN')}. Proceeding under Warning policy.`,
    };
  }

  // --- GETTERS ---
  public getBudgets(): BudgetMasterRecord[] {
    return this.budgets;
  }

  public getAllocations(): BudgetAllocationRecord[] {
    return this.allocations;
  }

  public getCommitments(): BudgetCommitmentRecord[] {
    return this.commitments;
  }

  public getRevisions(): BudgetRevisionRecord[] {
    return this.revisions;
  }

  public getTransfers(): BudgetTransferRecord[] {
    return this.transfers;
  }

  public getControls(): BudgetControlConfig[] {
    return this.controls;
  }

  public getAlertSettings(): BudgetAlertThresholds {
    return this.alertSettings;
  }

  public saveBudget(budget: Partial<BudgetMasterRecord> & { budgetName: string; totalBudget: number }): BudgetMasterRecord {
    const id = budget.id || `BDG-${new Date().getFullYear()}-${(this.budgets.length + 1).toString().padStart(3, '0')}`;
    const record: BudgetMasterRecord = {
      id,
      budgetName: budget.budgetName,
      financialYear: budget.financialYear || '2026-2027',
      budgetPeriod: budget.budgetPeriod || 'Annual',
      budgetType: budget.budgetType || 'Annual',
      branch: budget.branch || 'Kochi HQ',
      department: budget.department || 'Operations',
      project: budget.project || 'General',
      costCenter: budget.costCenter || 'CC-101 Corporate HQ',
      currency: 'INR',
      description: budget.description || '',
      totalBudget: Number(budget.totalBudget),
      revisedBudget: Number(budget.revisedBudget || budget.totalBudget),
      status: budget.status || 'Active',
      approvedBy: budget.approvedBy || 'Management',
      approvedDate: budget.approvedDate || new Date().toISOString().split('T')[0],
      createdAt: budget.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const idx = this.budgets.findIndex((b) => b.id === id);
    if (idx >= 0) {
      this.budgets[idx] = record;
    } else {
      this.budgets.unshift(record);
    }

    this.persistBudgets();
    return record;
  }

  public saveAllocation(allocation: Omit<BudgetAllocationRecord, 'id'>): BudgetAllocationRecord {
    const record: BudgetAllocationRecord = {
      ...allocation,
      id: `ALC-${Date.now().toString().slice(-4)}`,
    };
    this.allocations.push(record);
    this.persistAllocations();
    return record;
  }

  public updateControl(config: BudgetControlConfig): void {
    const idx = this.controls.findIndex((c) => c.id === config.id);
    if (idx >= 0) {
      this.controls[idx] = config;
    } else {
      this.controls.push(config);
    }
    this.persistControls();
  }
}

export const budgetEngine = new BudgetEngineService();
