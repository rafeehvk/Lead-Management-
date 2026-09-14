import { LeaveBalance, LeaveRequest, LeaveType, StaffMember } from '../types/hr';

export interface LeaveCategoryBreakdown {
  leaveType: LeaveType;
  label: string;
  totalQuota: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  netAvailableDays: number;
  isExemptFromQuota: boolean;
  colorClass: string;
}

export interface LeaveValidationResult {
  isValid: boolean;
  canSubmit: boolean;
  errors: string[];
  warnings: string[];
  requestedDays: number;
  availableBalance: number;
  netAvailableBalance: number;
  balanceAfterRequest: number;
  exceededBy: number;
  category: LeaveCategoryBreakdown;
  allCategories: LeaveCategoryBreakdown[];
}

/**
 * Standard default institutional leave quotas when no explicit record exists
 */
export const DEFAULT_LEAVE_QUOTAS = {
  annualTotal: 15,
  casualTotal: 12,
  sickTotal: 10,
  emergencyTotal: 5,
  maternityTotal: 90,
  paternityTotal: 15,
};

/**
 * Get or synthesize leave balance for a given staff member
 */
export function getStaffLeaveBalance(
  balances: LeaveBalance[] = [],
  staffId: string,
  staffList: StaffMember[] = []
): LeaveBalance {
  const found = balances.find((b) => b.staffId === staffId);
  if (found) return found;

  const staff = staffList.find((s) => s.id === staffId);
  return {
    staffId,
    staffName: staff?.fullName || 'Staff Member',
    department: staff?.department || 'General',
    annualTotal: DEFAULT_LEAVE_QUOTAS.annualTotal,
    annualUsed: 0,
    casualTotal: DEFAULT_LEAVE_QUOTAS.casualTotal,
    casualUsed: 0,
    sickTotal: DEFAULT_LEAVE_QUOTAS.sickTotal,
    sickUsed: 0,
    emergencyTotal: DEFAULT_LEAVE_QUOTAS.emergencyTotal,
    emergencyUsed: 0,
  };
}

/**
 * Calculate duration in days between two ISO date strings (inclusive)
 */
export function calculateLeaveDuration(fromDate: string, toDate: string): number {
  if (!fromDate || !toDate) return 1;
  try {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  } catch {
    return 1;
  }
}

/**
 * Calculate end date given start date and duration in days
 */
export function calculateEndDate(fromDate: string, durationDays: number): string {
  if (!fromDate) return new Date().toISOString().split('T')[0];
  try {
    const start = new Date(fromDate);
    if (isNaN(start.getTime())) return fromDate;
    const daysToAdd = Math.max(1, durationDays) - 1;
    const end = new Date(start.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return end.toISOString().split('T')[0];
  } catch {
    return fromDate;
  }
}

/**
 * Compute the category breakdown for a given staff member and leave type
 */
export function getLeaveCategoryBreakdown(
  balance: LeaveBalance,
  leaveType: LeaveType,
  pendingRequests: LeaveRequest[] = []
): LeaveCategoryBreakdown {
  const staffPending = pendingRequests.filter(
    (r) => r.staffId === balance.staffId && r.status === 'Pending' && r.leaveType === leaveType
  );
  const pendingDays = staffPending.reduce((sum, r) => sum + (r.numberOfDays || 1), 0);

  switch (leaveType) {
    case 'Casual Leave': {
      const total = balance.casualTotal ?? balance.casualAllowed ?? DEFAULT_LEAVE_QUOTAS.casualTotal;
      const used = balance.casualUsed || 0;
      const available = Math.max(0, total - used);
      const netAvailable = Math.max(0, available - pendingDays);
      return {
        leaveType,
        label: 'Casual Leave',
        totalQuota: total,
        usedDays: used,
        pendingDays,
        availableDays: available,
        netAvailableDays: netAvailable,
        isExemptFromQuota: false,
        colorClass: 'emerald',
      };
    }

    case 'Sick Leave': {
      const total = balance.sickTotal ?? balance.sickAllowed ?? DEFAULT_LEAVE_QUOTAS.sickTotal;
      const used = balance.sickUsed || 0;
      const available = Math.max(0, total - used);
      const netAvailable = Math.max(0, available - pendingDays);
      return {
        leaveType,
        label: 'Sick Leave',
        totalQuota: total,
        usedDays: used,
        pendingDays,
        availableDays: available,
        netAvailableDays: netAvailable,
        isExemptFromQuota: false,
        colorClass: 'amber',
      };
    }

    case 'Annual Leave': {
      const total = balance.annualTotal ?? balance.annualAllowed ?? DEFAULT_LEAVE_QUOTAS.annualTotal;
      const used = balance.annualUsed || 0;
      const available = Math.max(0, total - used);
      const netAvailable = Math.max(0, available - pendingDays);
      return {
        leaveType,
        label: 'Annual Leave',
        totalQuota: total,
        usedDays: used,
        pendingDays,
        availableDays: available,
        netAvailableDays: netAvailable,
        isExemptFromQuota: false,
        colorClass: 'blue',
      };
    }

    case 'Emergency Leave': {
      const total = balance.emergencyTotal ?? DEFAULT_LEAVE_QUOTAS.emergencyTotal;
      const used = balance.emergencyUsed || 0;
      const available = Math.max(0, total - used);
      const netAvailable = Math.max(0, available - pendingDays);
      return {
        leaveType,
        label: 'Emergency Leave',
        totalQuota: total,
        usedDays: used,
        pendingDays,
        availableDays: available,
        netAvailableDays: netAvailable,
        isExemptFromQuota: false,
        colorClass: 'rose',
      };
    }

    case 'Maternity Leave': {
      const total = balance.maternityTotal ?? DEFAULT_LEAVE_QUOTAS.maternityTotal;
      const used = balance.maternityUsed || 0;
      const available = Math.max(0, total - used);
      const netAvailable = Math.max(0, available - pendingDays);
      return {
        leaveType,
        label: 'Maternity Leave',
        totalQuota: total,
        usedDays: used,
        pendingDays,
        availableDays: available,
        netAvailableDays: netAvailable,
        isExemptFromQuota: false,
        colorClass: 'purple',
      };
    }

    case 'Paternity Leave': {
      const total = balance.paternityTotal ?? DEFAULT_LEAVE_QUOTAS.paternityTotal;
      const used = balance.paternityUsed || 0;
      const available = Math.max(0, total - used);
      const netAvailable = Math.max(0, available - pendingDays);
      return {
        leaveType,
        label: 'Paternity Leave',
        totalQuota: total,
        usedDays: used,
        pendingDays,
        availableDays: available,
        netAvailableDays: netAvailable,
        isExemptFromQuota: false,
        colorClass: 'indigo',
      };
    }

    case 'Unpaid Leave': {
      return {
        leaveType,
        label: 'Unpaid Leave (Loss of Pay)',
        totalQuota: Infinity,
        usedDays: 0,
        pendingDays,
        availableDays: Infinity,
        netAvailableDays: Infinity,
        isExemptFromQuota: true,
        colorClass: 'slate',
      };
    }

    default: {
      // Other
      return {
        leaveType,
        label: 'Other Discretionary Leave',
        totalQuota: 5,
        usedDays: 0,
        pendingDays,
        availableDays: 5,
        netAvailableDays: Math.max(0, 5 - pendingDays),
        isExemptFromQuota: false,
        colorClass: 'slate',
      };
    }
  }
}

/**
 * Get all major leave category breakdowns for an employee
 */
export function getAllLeaveCategoryBreakdowns(
  balance: LeaveBalance,
  pendingRequests: LeaveRequest[] = []
): LeaveCategoryBreakdown[] {
  const types: LeaveType[] = [
    'Casual Leave',
    'Sick Leave',
    'Annual Leave',
    'Emergency Leave',
  ];
  return types.map((t) => getLeaveCategoryBreakdown(balance, t, pendingRequests));
}

/**
 * Validation Layer: Validates leave request duration against available balance
 */
export function validateLeaveRequest(params: {
  staffId: string;
  leaveType: LeaveType;
  numberOfDays: number;
  fromDate?: string;
  toDate?: string;
  reason?: string;
  balances: LeaveBalance[];
  pendingRequests?: LeaveRequest[];
  staffList?: StaffMember[];
}): LeaveValidationResult {
  const {
    staffId,
    leaveType,
    numberOfDays,
    fromDate,
    toDate,
    reason,
    balances = [],
    pendingRequests = [],
    staffList = [],
  } = params;

  const errors: string[] = [];
  const warnings: string[] = [];

  const balance = getStaffLeaveBalance(balances, staffId, staffList);
  const category = getLeaveCategoryBreakdown(balance, leaveType, pendingRequests);
  const allCategories = getAllLeaveCategoryBreakdowns(balance, pendingRequests);

  const duration = Number(numberOfDays) || 0;

  // 1. Duration check
  if (duration <= 0) {
    errors.push('Leave duration must be at least 1 day.');
  }

  // 2. Date checks
  if (fromDate && toDate) {
    const fromTime = new Date(fromDate).getTime();
    const toTime = new Date(toDate).getTime();
    if (!isNaN(fromTime) && !isNaN(toTime) && toTime < fromTime) {
      errors.push('The "To Date" cannot be earlier than the "From Date".');
    }
  }

  // 3. Reason check
  if (!reason || reason.trim().length < 3) {
    errors.push('Please provide a reason for the leave request (at least 3 characters).');
  }

  // 4. CORE VALIDATION: Leave balance check
  let exceededBy = 0;
  let balanceAfterRequest = 0;

  if (!category.isExemptFromQuota) {
    const available = category.availableDays;
    const netAvailable = category.netAvailableDays;

    if (available <= 0) {
      exceededBy = duration;
      errors.push(
        `Insufficient leave balance: Employee has 0 days of ${category.label} available. The quota is exhausted.`
      );
    } else if (duration > available) {
      exceededBy = duration - available;
      errors.push(
        `Requested leave duration (${duration} days) exceeds available ${category.label} balance (${available} days available) by ${exceededBy} day(s).`
      );
    } else if (duration > netAvailable) {
      // Duration exceeds net available due to pending requests
      const pendingExceeded = duration - netAvailable;
      errors.push(
        `Requested duration (${duration} days) exceeds net available ${category.label} balance (${netAvailable} days available), as ${category.pendingDays} day(s) are already pending approval.`
      );
    } else {
      balanceAfterRequest = Math.max(0, netAvailable - duration);
    }
  } else {
    // Unpaid leave warning
    warnings.push(
      'Unpaid Leave (Loss of Pay) is exempt from quota limits, but will result in prorated salary deduction during payroll processing.'
    );
  }

  const isValid = errors.length === 0;
  const canSubmit = isValid && duration > 0;

  return {
    isValid,
    canSubmit,
    errors,
    warnings,
    requestedDays: duration,
    availableBalance: category.availableDays,
    netAvailableBalance: category.netAvailableDays,
    balanceAfterRequest,
    exceededBy,
    category,
    allCategories,
  };
}
