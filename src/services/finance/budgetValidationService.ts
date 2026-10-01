import { budgetEngine } from './budgetEngine';
import { BudgetControlRule } from '../../types/finance';

export type DepartmentEnforcementLevel = 'Block' | 'Warning' | 'Approval';

export interface DepartmentBudgetPolicy {
  id: string;
  department: string;
  enforcementLevel: DepartmentEnforcementLevel;
  isActive: boolean;
  tolerancePercent: number; // e.g. 0% (strict), 5% (buffer allowed before action)
  designatedApprover: string; // e.g. 'Finance Director' or 'CFO'
  notificationEmail?: string;
  description: string;
  lastUpdated: string;
}

export interface BudgetValidationRequest {
  module: 'PurchaseOrder' | 'DirectExpense';
  department: string;
  amount: number;
  referenceId?: string;
  referenceNumber?: string;
  category?: string;
  branch?: string;
  costCenter?: string;
  description?: string;
}

export interface BudgetValidationResult {
  allowed: boolean;
  requiresApproval: boolean;
  status: 'PASS' | 'WARNING' | 'NEEDS_APPROVAL' | 'BLOCKED';
  enforcementLevel: DepartmentEnforcementLevel;
  department: string;
  module: 'PurchaseOrder' | 'DirectExpense';
  requestedAmount: number;
  totalBudget: number;
  committedAmount: number;
  actualExpenditure: number;
  availableBudget: number;
  effectiveAvailableBudget: number; // availableBudget with tolerance buffer
  headroomAfter: number; // effectiveAvailableBudget - requestedAmount
  exceededAmount: number; // max(0, requestedAmount - effectiveAvailableBudget)
  toleranceBufferAmount: number;
  utilizationPercentBefore: number;
  utilizationPercentAfter: number;
  title: string;
  message: string;
  badgeClass: string;
  timestamp: string;
}

export interface BudgetValidationAuditRecord {
  id: string;
  timestamp: string;
  module: 'PurchaseOrder' | 'DirectExpense';
  department: string;
  requestedAmount: number;
  availableBudget: number;
  status: 'PASS' | 'WARNING' | 'NEEDS_APPROVAL' | 'BLOCKED';
  enforcementLevel: DepartmentEnforcementLevel;
  referenceNumber?: string;
  message: string;
}

const STORAGE_KEY_POLICIES = 'mysar_erp_budget_department_policies_v1';
const STORAGE_KEY_AUDIT_LOGS = 'mysar_erp_budget_validation_logs_v1';

export const DEFAULT_DEPARTMENT_POLICIES: DepartmentBudgetPolicy[] = [
  {
    id: 'POL-DEPT-OPS',
    department: 'Operations',
    enforcementLevel: 'Block',
    isActive: true,
    tolerancePercent: 0,
    designatedApprover: 'Chief Operating Officer',
    notificationEmail: 'ops.budget@mysargroup.com',
    description: 'Strict hard block on operational POs and direct expenses exceeding remaining Available budget.',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'POL-DEPT-IT',
    department: 'IT & Tech',
    enforcementLevel: 'Approval',
    isActive: true,
    tolerancePercent: 5,
    designatedApprover: 'Chief Information Officer',
    notificationEmail: 'cio@mysargroup.com',
    description: 'Cloud and infrastructure requests exceeding headroom are routed to CIO/CFO approval workflow.',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'POL-DEPT-MKT',
    department: 'Sales & Marketing',
    enforcementLevel: 'Warning',
    isActive: true,
    tolerancePercent: 10,
    designatedApprover: 'Marketing Director',
    notificationEmail: 'marketing.finance@mysargroup.com',
    description: 'Campaign and advertising demands trigger visual budget overrun prompts but permit urgent execution.',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'POL-DEPT-ADM',
    department: 'Administration',
    enforcementLevel: 'Approval',
    isActive: true,
    tolerancePercent: 0,
    designatedApprover: 'Finance Controller',
    notificationEmail: 'admin.approvals@mysargroup.com',
    description: 'Campus facility upgrades and administrative overhead require dual-signoff on budget deficits.',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'POL-DEPT-RD',
    department: 'Research & Development',
    enforcementLevel: 'Block',
    isActive: true,
    tolerancePercent: 0,
    designatedApprover: 'Head of Research',
    notificationEmail: 'rd.grants@mysargroup.com',
    description: 'Grant and research allocation caps are strictly enforced against grant milestones.',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'POL-DEPT-FIN',
    department: 'Finance & Accounts',
    enforcementLevel: 'Approval',
    isActive: true,
    tolerancePercent: 5,
    designatedApprover: 'Chief Financial Officer',
    notificationEmail: 'cfo@mysargroup.com',
    description: 'Audit, legal, and financial advisory expenditures require executive management escalation.',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'POL-DEPT-FAC',
    department: 'Facilities & Logistics',
    enforcementLevel: 'Warning',
    isActive: true,
    tolerancePercent: 5,
    designatedApprover: 'Logistics Head',
    notificationEmail: 'fleet.logistics@mysargroup.com',
    description: 'Vehicle fleet maintenance and urgent facility repairs permit flexible overrun with logged warnings.',
    lastUpdated: '2026-04-01',
  },
];

export class BudgetValidationService {
  private policies: DepartmentBudgetPolicy[] = [];
  private auditLogs: BudgetValidationAuditRecord[] = [];

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      const storedPolicies = localStorage.getItem(STORAGE_KEY_POLICIES);
      if (storedPolicies) {
        this.policies = JSON.parse(storedPolicies);
      } else {
        this.policies = [...DEFAULT_DEPARTMENT_POLICIES];
        this.persistPolicies();
      }

      const storedLogs = localStorage.getItem(STORAGE_KEY_AUDIT_LOGS);
      this.auditLogs = storedLogs ? JSON.parse(storedLogs) : [];
    } catch {
      this.policies = [...DEFAULT_DEPARTMENT_POLICIES];
      this.auditLogs = [];
    }
  }

  private persistPolicies(): void {
    try {
      localStorage.setItem(STORAGE_KEY_POLICIES, JSON.stringify(this.policies));
    } catch {
      // ignore
    }
  }

  private persistLogs(): void {
    try {
      // Keep most recent 100 logs
      const trimmed = this.auditLogs.slice(0, 100);
      localStorage.setItem(STORAGE_KEY_AUDIT_LOGS, JSON.stringify(trimmed));
    } catch {
      // ignore
    }
  }

  // --- POLICIES CRUD ---
  public getDepartmentPolicies(): DepartmentBudgetPolicy[] {
    return [...this.policies];
  }

  public getDepartmentPolicy(departmentName: string): DepartmentBudgetPolicy {
    const normalized = (departmentName || 'Operations').trim().toLowerCase();
    const policy = this.policies.find(
      (p) => p.department.trim().toLowerCase() === normalized
    );

    if (policy) return policy;

    // Fuzzy partial match
    const fuzzy = this.policies.find((p) =>
      normalized.includes(p.department.toLowerCase()) || p.department.toLowerCase().includes(normalized)
    );
    if (fuzzy) return fuzzy;

    // Fallback default policy
    return {
      id: `POL-CUSTOM-${Date.now()}`,
      department: departmentName || 'General',
      enforcementLevel: 'Warning',
      isActive: true,
      tolerancePercent: 0,
      designatedApprover: 'Finance Controller',
      description: 'Default dynamic policy for unconfigured department.',
      lastUpdated: new Date().toISOString().split('T')[0],
    };
  }

  public setDepartmentPolicy(
    department: string,
    updates: Partial<DepartmentBudgetPolicy>
  ): DepartmentBudgetPolicy {
    const normalized = department.trim().toLowerCase();
    const idx = this.policies.findIndex(
      (p) => p.department.trim().toLowerCase() === normalized
    );

    let updatedPolicy: DepartmentBudgetPolicy;
    if (idx >= 0) {
      updatedPolicy = {
        ...this.policies[idx],
        ...updates,
        department: this.policies[idx].department, // keep canonical casing
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      this.policies[idx] = updatedPolicy;
    } else {
      updatedPolicy = {
        id: `POL-DEPT-${Date.now().toString().slice(-4)}`,
        department: department.trim(),
        enforcementLevel: updates.enforcementLevel || 'Warning',
        isActive: updates.isActive !== undefined ? updates.isActive : true,
        tolerancePercent: updates.tolerancePercent || 0,
        designatedApprover: updates.designatedApprover || 'Finance Manager',
        notificationEmail: updates.notificationEmail || '',
        description: updates.description || `Enforcement policy for ${department}`,
        lastUpdated: new Date().toISOString().split('T')[0],
      };
      this.policies.push(updatedPolicy);
    }

    this.persistPolicies();
    return updatedPolicy;
  }

  public resetToDefaults(): void {
    this.policies = [...DEFAULT_DEPARTMENT_POLICIES];
    this.persistPolicies();
  }

  // --- CORE VALIDATION ENGINE ---
  public validateTransaction(req: BudgetValidationRequest): BudgetValidationResult {
    const policy = this.getDepartmentPolicy(req.department);
    const amount = Number(req.amount) || 0;

    // Resolve Department Budget Metrics from Budget Engine
    const budgets = budgetEngine.getBudgets();
    const matchingBudgets = budgets.filter(
      (b) =>
        b.status === 'Active' &&
        (b.department.toLowerCase() === req.department.toLowerCase() ||
          req.department.toLowerCase().includes(b.department.toLowerCase()) ||
          b.department.toLowerCase().includes(req.department.toLowerCase()))
    );

    let totalBudget = 0;
    let totalCommitted = 0;
    let totalActual = 0;

    if (matchingBudgets.length > 0) {
      matchingBudgets.forEach((b) => {
        const m = budgetEngine.computeBudgetMetrics(b.id);
        totalBudget += m.totalBudget;
        totalCommitted += m.totalCommitted;
        totalActual += m.totalActual;
      });
    } else {
      // Fallback to primary master budget if department is not specifically designated
      const first = budgets[0];
      if (first) {
        const m = budgetEngine.computeBudgetMetrics(first.id);
        totalBudget = m.totalBudget;
        totalCommitted = m.totalCommitted;
        totalActual = m.totalActual;
      } else {
        totalBudget = 5000000;
        totalCommitted = 1200000;
        totalActual = 1800000;
      }
    }

    const availableBudget = Math.max(0, totalBudget - totalCommitted - totalActual);
    const tolerancePercent = policy.isActive ? policy.tolerancePercent || 0 : 0;
    const toleranceBufferAmount = Math.round((availableBudget * tolerancePercent) / 100);
    const effectiveAvailableBudget = availableBudget + toleranceBufferAmount;

    const headroomAfter = effectiveAvailableBudget - amount;
    const isExceeded = amount > effectiveAvailableBudget;
    const exceededAmount = isExceeded ? amount - effectiveAvailableBudget : 0;

    const spentBefore = totalCommitted + totalActual;
    const spentAfter = spentBefore + amount;
    const utilizationPercentBefore = totalBudget > 0 ? Math.round((spentBefore / totalBudget) * 1000) / 10 : 0;
    const utilizationPercentAfter = totalBudget > 0 ? Math.round((spentAfter / totalBudget) * 1000) / 10 : 0;

    const enforcement = policy.isActive ? policy.enforcementLevel : 'Warning';

    let status: 'PASS' | 'WARNING' | 'NEEDS_APPROVAL' | 'BLOCKED' = 'PASS';
    let allowed = true;
    let requiresApproval = false;
    let title = 'Budget Validation Passed';
    let message = `Transaction of ₹${amount.toLocaleString('en-IN')} is within ${req.department} available headroom (₹${availableBudget.toLocaleString('en-IN')}).`;
    let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

    if (isExceeded) {
      if (enforcement === 'Block') {
        status = 'BLOCKED';
        allowed = false;
        requiresApproval = false;
        title = 'Transaction Blocked (Hard Budget Cap)';
        message = `Transaction of ₹${amount.toLocaleString('en-IN')} exceeds ${req.department} Available Budget (₹${availableBudget.toLocaleString('en-IN')}) by ₹${exceededAmount.toLocaleString('en-IN')}. Hard Block policy is active.`;
        badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';
      } else if (enforcement === 'Approval') {
        status = 'NEEDS_APPROVAL';
        allowed = true; // May proceed into workflow but requires explicit approval
        requiresApproval = true;
        title = 'Budget Overrun - Approval Required';
        message = `Transaction exceeds Available Budget by ₹${exceededAmount.toLocaleString('en-IN')}. Submitted to ${policy.designatedApprover} for sign-off.`;
        badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
      } else {
        // Warning
        status = 'WARNING';
        allowed = true;
        requiresApproval = false;
        title = 'Budget Warning (Soft Cap Exceeded)';
        message = `Warning: Transaction of ₹${amount.toLocaleString('en-IN')} exceeds Available headroom (₹${availableBudget.toLocaleString('en-IN')}) by ₹${exceededAmount.toLocaleString('en-IN')}. Proceeding under Warning policy.`;
        badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
      }
    } else if (effectiveAvailableBudget > 0 && amount > effectiveAvailableBudget * 0.85) {
      // Approaching capacity threshold
      status = 'WARNING';
      title = 'Caution: Consuming >85% of Remaining Headroom';
      message = `This transaction will consume ${Math.round((amount / effectiveAvailableBudget) * 100)}% of remaining available funds for ${req.department}.`;
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    const result: BudgetValidationResult = {
      allowed,
      requiresApproval,
      status,
      enforcementLevel: enforcement,
      department: req.department,
      module: req.module,
      requestedAmount: amount,
      totalBudget,
      committedAmount: totalCommitted,
      actualExpenditure: totalActual,
      availableBudget,
      effectiveAvailableBudget,
      headroomAfter,
      exceededAmount,
      toleranceBufferAmount,
      utilizationPercentBefore,
      utilizationPercentAfter,
      title,
      message,
      badgeClass,
      timestamp: new Date().toISOString(),
    };

    // Log to audit history
    this.recordAuditLog({
      module: req.module,
      department: req.department,
      requestedAmount: amount,
      availableBudget,
      status,
      enforcementLevel: enforcement,
      referenceNumber: req.referenceNumber,
      message,
    });

    return result;
  }

  public validatePurchaseOrder(po: {
    department?: string;
    grandTotal?: number;
    items?: { rate: number; quantity: number }[];
    poNumber?: string;
  }): BudgetValidationResult {
    let amount = po.grandTotal || 0;
    if (!amount && po.items && po.items.length > 0) {
      amount = po.items.reduce((s, i) => s + (i.rate || 0) * (i.quantity || 1), 0);
    }

    return this.validateTransaction({
      module: 'PurchaseOrder',
      department: po.department || 'Operations',
      amount,
      referenceNumber: po.poNumber,
    });
  }

  public validateDirectExpense(expense: {
    department?: string;
    amount: number;
    category?: string;
    description?: string;
    referenceNumber?: string;
  }): BudgetValidationResult {
    return this.validateTransaction({
      module: 'DirectExpense',
      department: expense.department || 'Operations',
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      referenceNumber: expense.referenceNumber,
    });
  }

  // --- AUDIT LOGS ---
  private recordAuditLog(log: Omit<BudgetValidationAuditRecord, 'id' | 'timestamp'>): void {
    const entry: BudgetValidationAuditRecord = {
      ...log,
      id: `LOG-BVAL-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    this.persistLogs();
  }

  public getValidationAuditLogs(): BudgetValidationAuditRecord[] {
    return [...this.auditLogs];
  }

  public clearValidationAuditLogs(): void {
    this.auditLogs = [];
    this.persistLogs();
  }
}

export const budgetValidationService = new BudgetValidationService();
