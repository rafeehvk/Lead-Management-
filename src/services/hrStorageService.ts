import {
  Position,
  Applicant,
  Interview,
  OfferLetter,
  AppointmentLetter,
  StaffMember,
  DailyAttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  MonthlyPayrollRecord,
  PositionKpiConfig,
  StaffPerformanceEvaluation,
  HrSettingsConfig,
  HrActivityLog,
  RecruitmentStage,
  AttendanceStatus,
  LeaveRequestStatus,
  PayrollStatus,
  OfferStatus,
  AppointmentStatus,
  InterviewEvaluation,
  DepartmentMaster,
  BranchMaster,
  DepartmentRole,
  RoleMenuPermission,
  IdCardTemplateSettings,
  AllowanceItem,
  DeductionItem,
} from '../types/hr';
import { validateLeaveRequest } from '../utils/leaveValidation';
import {
  initialPositions,
  initialApplicants,
  initialInterviews,
  initialOfferLetters,
  initialAppointmentLetters,
  initialStaffMembers,
  initialAttendanceRecords,
  initialLeaveRequests,
  initialLeaveBalances,
  initialMonthlyPayroll,
  initialPositionKpis,
  initialStaffPerformance,
  initialHrSettings,
  initialHrActivityLogs,
  initialDepartmentsMaster,
  initialDepartmentRoles,
  initialIdCardSettings,
} from '../data/hrMockData';

const HR_STORAGE_KEYS = {
  POSITIONS: 'mysar_hr_positions_v1',
  APPLICANTS: 'mysar_hr_applicants_v1',
  INTERVIEWS: 'mysar_hr_interviews_v1',
  OFFER_LETTERS: 'mysar_hr_offer_letters_v1',
  APPOINTMENT_LETTERS: 'mysar_hr_appointment_letters_v1',
  STAFF: 'mysar_hr_staff_v1',
  DEPARTMENTS: 'mysar_hr_departments_master_v1',
  BRANCHES: 'mysar_hr_branches_master_v1',
  DEPARTMENT_ROLES: 'mysar_department_roles_matrix_v1',
  ATTENDANCE: 'mysar_hr_attendance_v1',
  LEAVE_REQUESTS: 'mysar_hr_leave_requests_v1',
  LEAVE_BALANCES: 'mysar_hr_leave_balances_v1',
  PAYROLL: 'mysar_hr_payroll_v1',
  KPIS: 'mysar_hr_kpis_v1',
  PERFORMANCE: 'mysar_hr_performance_v1',
  SETTINGS: 'mysar_hr_settings_v1',
  LOGS: 'mysar_hr_activity_logs_v1',
  ID_CARD_TEMPLATE: 'mysar_hr_id_card_template_v1',
};

class HrStorageService {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultVal;
      return JSON.parse(item) as T;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save HR data to localStorage', e);
    }
  }

  private activityCounter = 0;

  // Activity Log
  public addActivity(
    user: string,
    role: string,
    action: string,
    module: HrActivityLog['module'],
    record: string,
    details?: string
  ): void {
    const logs = this.getStorage<HrActivityLog[]>(HR_STORAGE_KEYS.LOGS, initialHrActivityLogs);
    this.activityCounter += 1;
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const newLog: HrActivityLog = {
      id: `ACT-${Date.now()}-${this.activityCounter}-${randomSuffix}`,
      user,
      role,
      action,
      module,
      record,
      timestamp: new Date().toLocaleString('en-US', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
      details,
    };
    logs.unshift(newLog);
    this.setStorage(HR_STORAGE_KEYS.LOGS, logs.slice(0, 100)); // keep last 100
  }

  public getActivityLogs(): HrActivityLog[] {
    const rawLogs = this.getStorage<HrActivityLog[]>(HR_STORAGE_KEYS.LOGS, initialHrActivityLogs);
    const seenIds = new Set<string>();
    let hasDuplicates = false;

    const sanitized = rawLogs.map((log, index) => {
      if (!log.id || seenIds.has(log.id)) {
        hasDuplicates = true;
        const freshId = `ACT-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`;
        seenIds.add(freshId);
        return { ...log, id: freshId };
      }
      seenIds.add(log.id);
      return log;
    });

    if (hasDuplicates) {
      this.setStorage(HR_STORAGE_KEYS.LOGS, sanitized);
    }

    return sanitized;
  }

  // --- POSITIONS ---
  public getPositions(): Position[] {
    return this.getStorage<Position[]>(HR_STORAGE_KEYS.POSITIONS, initialPositions);
  }

  public savePosition(posData: Partial<Position>, actorName = 'Admin'): Position {
    const positions = this.getPositions();
    if (posData.id) {
      const index = positions.findIndex((p) => p.id === posData.id);
      if (index !== -1) {
        const updated: Position = {
          ...positions[index],
          ...posData,
          remainingVacancies: Math.max(0, (posData.vacancies ?? positions[index].vacancies) - (posData.filled ?? positions[index].filled)),
        };
        positions[index] = updated;
        this.setStorage(HR_STORAGE_KEYS.POSITIONS, positions);
        this.addActivity(actorName, 'HR Admin', 'Updated Position', 'Recruitment', `${updated.id} - ${updated.name}`);
        return updated;
      }
    }

    const count = positions.length + 1;
    const newId = `POS-2026-${String(count).padStart(3, '0')}`;
    const vacancies = posData.vacancies || 1;
    const filled = posData.filled || 0;
    const newPos: Position = {
      id: newId,
      name: posData.name || 'New Position',
      code: posData.code || `POS-${String(count).padStart(2, '0')}`,
      division: posData.division || 'Academic Wing',
      department: posData.department || 'Academic',
      vacancies,
      filled,
      remainingVacancies: Math.max(0, vacancies - filled),
      employmentType: posData.employmentType || 'Full Time',
      description: posData.description || '',
      requirements: posData.requirements || [],
      responsibilities: posData.responsibilities || [],
      qualifications: posData.qualifications || [],
      experienceRequired: posData.experienceRequired || '1-3 years',
      skills: posData.skills || [],
      salaryRange: posData.salaryRange || { min: 30000, max: 45000, currency: 'INR' },
      jobLocation: posData.jobLocation || 'Kochi Campus',
      closingDate: posData.closingDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: posData.status || 'Open',
      createdDate: new Date().toISOString().split('T')[0],
    };

    positions.unshift(newPos);
    this.setStorage(HR_STORAGE_KEYS.POSITIONS, positions);
    this.addActivity(actorName, 'HR Admin', 'Created Position', 'Recruitment', `${newPos.id} - ${newPos.name}`);
    return newPos;
  }

  public deletePosition(id: string, actorName = 'Admin'): void {
    const positions = this.getPositions().filter((p) => p.id !== id);
    this.setStorage(HR_STORAGE_KEYS.POSITIONS, positions);
    this.addActivity(actorName, 'HR Admin', 'Deleted Position', 'Recruitment', id);
  }

  // --- APPLICANTS ---
  public getApplicants(): Applicant[] {
    return this.getStorage<Applicant[]>(HR_STORAGE_KEYS.APPLICANTS, initialApplicants);
  }

  public saveApplicant(appData: Partial<Applicant>, actorName = 'Admin'): Applicant {
    const applicants = this.getApplicants();
    if (appData.id) {
      const idx = applicants.findIndex((a) => a.id === appData.id);
      if (idx !== -1) {
        const updated = { ...applicants[idx], ...appData };
        applicants[idx] = updated;
        this.setStorage(HR_STORAGE_KEYS.APPLICANTS, applicants);
        this.addActivity(actorName, 'HR Admin', 'Updated Applicant', 'Recruitment', `${updated.name} (${updated.stage})`);
        return updated;
      }
    }

    const count = applicants.length + 1;
    const newId = `APP-2026-${String(count).padStart(3, '0')}`;
    const newApplicant: Applicant = {
      id: newId,
      name: appData.name || 'Candidate Name',
      positionId: appData.positionId || '',
      positionName: appData.positionName || 'Staff Role',
      department: appData.department || 'Academic',
      phone: appData.phone || '',
      email: appData.email || '',
      experience: appData.experience || 0,
      currentCompanyOrSchool: appData.currentCompanyOrSchool || '',
      highestQualification: appData.highestQualification || 'Graduate',
      skills: appData.skills || [],
      applicationDate: new Date().toISOString().split('T')[0],
      stage: appData.stage || 'Applied',
      interviewStatus: appData.interviewStatus || 'Not Scheduled',
      overallRating: appData.overallRating || 3.0,
      status: appData.status || 'Active',
      notes: appData.notes || '',
      expectedSalary: appData.expectedSalary || 35000,
      noticePeriod: appData.noticePeriod || 'Immediate',
    };

    applicants.unshift(newApplicant);
    this.setStorage(HR_STORAGE_KEYS.APPLICANTS, applicants);
    this.addActivity(actorName, 'HR Admin', 'Received Application', 'Recruitment', `${newApplicant.name} for ${newApplicant.positionName}`);
    return newApplicant;
  }

  public updateApplicantStage(id: string, stage: RecruitmentStage, actorName = 'Admin'): void {
    const applicants = this.getApplicants();
    const target = applicants.find((a) => a.id === id);
    if (!target) return;

    target.stage = stage;
    if (stage === 'Rejected') {
      target.status = 'Rejected';
    } else if (stage === 'Joined') {
      target.status = 'Joined';
    }
    this.setStorage(HR_STORAGE_KEYS.APPLICANTS, applicants);
    this.addActivity(actorName, 'HR Admin', 'Moved Applicant Stage', 'Recruitment', `${target.name} → ${stage}`);
  }

  public deleteApplicant(id: string, actorName = 'Admin'): void {
    const applicants = this.getApplicants().filter((a) => a.id !== id);
    this.setStorage(HR_STORAGE_KEYS.APPLICANTS, applicants);
    this.addActivity(actorName, 'HR Admin', 'Removed Applicant', 'Recruitment', id);
  }

  // --- INTERVIEWS ---
  public getInterviews(): Interview[] {
    return this.getStorage<Interview[]>(HR_STORAGE_KEYS.INTERVIEWS, initialInterviews);
  }

  public scheduleInterview(data: Partial<Interview>, actorName = 'Admin'): Interview {
    const interviews = this.getInterviews();
    const count = interviews.length + 1;
    const newInterview: Interview = {
      id: `INT-2026-${String(count).padStart(3, '0')}`,
      applicantId: data.applicantId || '',
      applicantName: data.applicantName || '',
      applicantEmail: data.applicantEmail || '',
      positionId: data.positionId || '',
      positionName: data.positionName || '',
      department: data.department || 'Academic',
      round: data.round || 'Round 1 - Screening',
      type: data.type || 'Online',
      date: data.date || new Date().toISOString().split('T')[0],
      startTime: data.startTime || '10:00 AM',
      endTime: data.endTime || '11:00 AM',
      locationOrLink: data.locationOrLink || 'Google Meet',
      panelMembers: data.panelMembers || ['Interview Panel'],
      notes: data.notes || '',
      status: 'Scheduled',
    };

    interviews.unshift(newInterview);
    this.setStorage(HR_STORAGE_KEYS.INTERVIEWS, interviews);

    // Update applicant stage if needed
    if (newInterview.applicantId) {
      this.updateApplicantStage(newInterview.applicantId, 'Interview Scheduled', actorName);
      const apps = this.getApplicants();
      const app = apps.find((a) => a.id === newInterview.applicantId);
      if (app) {
        app.interviewStatus = 'Scheduled';
        this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
      }
    }

    this.addActivity(actorName, 'HR Admin', 'Scheduled Interview', 'Recruitment', `${newInterview.applicantName} - ${newInterview.round}`);
    return newInterview;
  }

  public saveInterviewEvaluation(interviewId: string, evaluation: InterviewEvaluation, actorName = 'Admin'): void {
    const interviews = this.getInterviews();
    const interview = interviews.find((i) => i.id === interviewId);
    if (!interview) return;

    interview.status = 'Completed';
    interview.evaluation = evaluation;
    this.setStorage(HR_STORAGE_KEYS.INTERVIEWS, interviews);

    // Also update applicant rating & stage
    const applicants = this.getApplicants();
    const app = applicants.find((a) => a.id === interview.applicantId);
    if (app) {
      app.overallRating = evaluation.overallPerformance;
      if (evaluation.finalDecision === 'Selected') {
        app.stage = 'Selected';
        app.interviewStatus = 'Passed';
      } else if (evaluation.finalDecision === 'Rejected') {
        app.stage = 'Rejected';
        app.interviewStatus = 'Failed';
        app.status = 'Rejected';
      } else {
        app.stage = 'Interviewed';
      }
      this.setStorage(HR_STORAGE_KEYS.APPLICANTS, applicants);
    }

    this.addActivity(actorName, 'Interviewer', 'Submitted Interview Evaluation', 'Recruitment', `${interview.applicantName} (${evaluation.finalDecision})`);
  }

  // --- OFFER LETTERS ---
  private normalizeOfferLetter(offer: OfferLetter): OfferLetter {
    const basic = Number(offer.basicSalary) || 0;

    // Normalize allowanceItems
    let allowanceItems = Array.isArray(offer.allowanceItems)
      ? offer.allowanceItems
          .filter((item) => item && (item.name || Number(item.amount) > 0))
          .map((item, idx) => ({
            id: item.id || `all-norm-${idx}`,
            name: item.name || 'Allowance',
            amount: Number(item.amount) || 0,
          }))
      : [];

    const legacyAllowancesSum =
      (Number(offer.hra) || 0) +
      (Number(offer.conveyanceAllowance) || 0) +
      (Number(offer.communicationAllowance) || 0) +
      (Number(offer.specialAllowance) || 0) +
      (Number(offer.otherAllowance) || 0);

    if (allowanceItems.length === 0) {
      if (legacyAllowancesSum > 0) {
        if (Number(offer.hra) > 0) {
          allowanceItems.push({ id: 'all-hra', name: 'House Rent / Accommodation Allowance', amount: Number(offer.hra) });
        }
        if (Number(offer.conveyanceAllowance) > 0) {
          allowanceItems.push({ id: 'all-conv', name: 'Travel / Conveyance Allowance', amount: Number(offer.conveyanceAllowance) });
        }
        if (Number(offer.communicationAllowance) > 0) {
          allowanceItems.push({ id: 'all-comm', name: 'Communication Allowance', amount: Number(offer.communicationAllowance) });
        }
        if (Number(offer.specialAllowance) > 0) {
          allowanceItems.push({ id: 'all-spl', name: 'Special Allowance', amount: Number(offer.specialAllowance) });
        }
        if (Number(offer.otherAllowance) > 0) {
          allowanceItems.push({ id: 'all-oth', name: 'Other Allowance', amount: Number(offer.otherAllowance) });
        }
      } else if (Number(offer.allowances) > 0) {
        allowanceItems = [
          { id: 'all-total', name: 'Monthly Allowances', amount: Number(offer.allowances) },
        ];
      }
    } else if (offer.allowances !== undefined) {
      // If manual total allowances exceeds or differs from itemized sum, keep them reconciled
      const itemizedSum = allowanceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const explicitAllowances = Number(offer.allowances) || 0;
      if (explicitAllowances > itemizedSum) {
        allowanceItems.push({
          id: `all-bal-${Date.now()}`,
          name: 'Other Allowance',
          amount: explicitAllowances - itemizedSum,
        });
      }
    }

    const totalAllowances =
      allowanceItems.length > 0
        ? allowanceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        : Number(offer.allowances) || 0;

    // Normalize deductionItems
    let deductionItems = Array.isArray(offer.deductionItems)
      ? offer.deductionItems
          .filter((item) => item && (item.name || Number(item.amount) > 0))
          .map((item, idx) => ({
            id: item.id || `ded-norm-${idx}`,
            name: item.name || 'Deduction',
            amount: Number(item.amount) || 0,
          }))
      : [];

    const legacyDeductionsSum =
      (Number(offer.pfDeduction) || 0) +
      (Number(offer.ptDeduction) || 0) +
      (Number(offer.tdsDeduction) || 0) +
      (Number(offer.otherDeductions) || 0);

    if (deductionItems.length === 0) {
      if (legacyDeductionsSum > 0) {
        if (Number(offer.pfDeduction) > 0) {
          deductionItems.push({ id: 'ded-pf', name: 'Employee PF Contribution', amount: Number(offer.pfDeduction) });
        }
        if (Number(offer.ptDeduction) > 0) {
          deductionItems.push({ id: 'ded-pt', name: 'Professional Tax', amount: Number(offer.ptDeduction) });
        }
        if (Number(offer.tdsDeduction) > 0) {
          deductionItems.push({ id: 'ded-tds', name: 'TDS / Income Tax', amount: Number(offer.tdsDeduction) });
        }
        if (Number(offer.otherDeductions) > 0) {
          deductionItems.push({ id: 'ded-oth', name: 'Other Applicable Deductions', amount: Number(offer.otherDeductions) });
        }
      } else if (Number(offer.deductions) > 0) {
        deductionItems = [
          { id: 'ded-total', name: 'Applicable Deductions', amount: Number(offer.deductions) },
        ];
      }
    } else if (offer.deductions !== undefined) {
      const itemizedDedSum = deductionItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
      const explicitDeductions = Number(offer.deductions) || 0;
      if (explicitDeductions > itemizedDedSum) {
        deductionItems.push({
          id: `ded-bal-${Date.now()}`,
          name: 'Other Applicable Deductions',
          amount: explicitDeductions - itemizedDedSum,
        });
      }
    }

    const totalDeductions =
      deductionItems.length > 0
        ? deductionItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        : Number(offer.deductions) || 0;

    const grossSalary = basic + totalAllowances;
    const netSalary = Math.max(0, grossSalary - totalDeductions);

    return {
      ...offer,
      basicSalary: basic,
      allowances: totalAllowances,
      allowanceItems,
      deductions: totalDeductions,
      deductionItems,
      grossSalary,
      netSalary,
    };
  }

  public getOfferLetters(): OfferLetter[] {
    const rawOffers = this.getStorage<OfferLetter[]>(HR_STORAGE_KEYS.OFFER_LETTERS, initialOfferLetters);
    let changed = false;
    const normalized = rawOffers.map((offer) => {
      const norm = this.normalizeOfferLetter(offer);
      if (
        norm.grossSalary !== offer.grossSalary ||
        norm.allowances !== offer.allowances ||
        norm.deductions !== offer.deductions ||
        norm.netSalary !== offer.netSalary ||
        !Array.isArray(offer.allowanceItems) ||
        !Array.isArray(offer.deductionItems)
      ) {
        changed = true;
      }
      return norm;
    });
    if (changed) {
      this.setStorage(HR_STORAGE_KEYS.OFFER_LETTERS, normalized);
    }
    return normalized;
  }

  public generateOfferLetter(data: Partial<OfferLetter>, actorName = 'Admin'): OfferLetter {
    return this.saveOfferLetter(data, actorName);
  }

  public saveOfferLetter(data: Partial<OfferLetter>, actorName = 'Admin'): OfferLetter {
    const offers = this.getOfferLetters();
    const basic = data.basicSalary !== undefined ? Number(data.basicSalary) : 30000;

    // Reconcile allowanceItems and total allowances
    let allowanceItems: AllowanceItem[] = Array.isArray(data.allowanceItems)
      ? data.allowanceItems
          .filter((item) => item && (item.name || Number(item.amount) > 0))
          .map((item, idx) => ({
            id: item.id || `all-${Date.now()}-${idx}`,
            name: item.name || 'Allowance',
            amount: Number(item.amount) || 0,
          }))
      : [];

    const itemizedAllowancesSum = allowanceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    let allowances =
      allowanceItems.length > 0
        ? itemizedAllowancesSum
        : data.allowances !== undefined
        ? Number(data.allowances)
        : 0;

    // If user typed a larger manual total in `allowances` than the sum of `allowanceItems`
    if (data.allowances !== undefined && Number(data.allowances) > itemizedAllowancesSum && allowanceItems.length > 0) {
      const diff = Number(data.allowances) - itemizedAllowancesSum;
      allowanceItems.push({
        id: `all-bal-${Date.now()}`,
        name: 'Other Allowance',
        amount: diff,
      });
      allowances = Number(data.allowances);
    } else if (allowanceItems.length === 0 && allowances > 0) {
      allowanceItems = [{ id: `all-default-${Date.now()}`, name: 'Monthly Allowances', amount: allowances }];
    }

    // Reconcile deductionItems and total deductions
    let deductionItems: DeductionItem[] = Array.isArray(data.deductionItems)
      ? data.deductionItems
          .filter((item) => item && (item.name || Number(item.amount) > 0))
          .map((item, idx) => ({
            id: item.id || `ded-${Date.now()}-${idx}`,
            name: item.name || 'Deduction',
            amount: Number(item.amount) || 0,
          }))
      : [];

    const itemizedDeductionsSum = deductionItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    let deductions =
      deductionItems.length > 0
        ? itemizedDeductionsSum
        : data.deductions !== undefined
        ? Number(data.deductions)
        : 0;

    if (data.deductions !== undefined && Number(data.deductions) > itemizedDeductionsSum && deductionItems.length > 0) {
      const diff = Number(data.deductions) - itemizedDeductionsSum;
      deductionItems.push({
        id: `ded-bal-${Date.now()}`,
        name: 'Other Applicable Deductions',
        amount: diff,
      });
      deductions = Number(data.deductions);
    } else if (deductionItems.length === 0 && deductions > 0) {
      deductionItems = [{ id: `ded-default-${Date.now()}`, name: 'Applicable Deductions', amount: deductions }];
    }

    const grossSalary = basic + allowances;
    const netSalary = Math.max(0, grossSalary - deductions);

    // Sync legacy breakdown fields from itemized lists so any consumer reading legacy properties gets matching values
    const hra = allowanceItems.find((i) => /room|hra|house|accommodation/i.test(i.name))?.amount || 0;
    const conveyanceAllowance = allowanceItems.find((i) => /conveyance|travel|transport/i.test(i.name))?.amount || 0;
    const communicationAllowance = allowanceItems.find((i) => /comm|phone|mobile|internet/i.test(i.name))?.amount || 0;
    const specialAllowance = allowanceItems.find((i) => /special/i.test(i.name))?.amount || 0;
    const otherAllowance = Math.max(0, allowances - (hra + conveyanceAllowance + communicationAllowance + specialAllowance));

    const pfDeduction = deductionItems.find((i) => /pf|provident/i.test(i.name))?.amount || 0;
    const ptDeduction = deductionItems.find((i) => /pt|professional/i.test(i.name))?.amount || 0;
    const tdsDeduction = deductionItems.find((i) => /tds|income tax/i.test(i.name))?.amount || 0;
    const otherDeductions = Math.max(0, deductions - (pfDeduction + ptDeduction + tdsDeduction));

    if (data.id) {
      const index = offers.findIndex((o) => o.id === data.id);
      if (index !== -1) {
        const existing = offers[index];
        const updatedOffer: OfferLetter = {
          ...existing,
          ...data,
          basicSalary: basic,
          allowances,
          allowanceItems,
          deductions,
          deductionItems,
          grossSalary,
          netSalary,
          hra,
          conveyanceAllowance,
          communicationAllowance,
          specialAllowance,
          otherAllowance,
          pfDeduction,
          ptDeduction,
          tdsDeduction,
          otherDeductions,
        };
        offers[index] = updatedOffer;
        this.setStorage(HR_STORAGE_KEYS.OFFER_LETTERS, offers);

        if (updatedOffer.applicantId) {
          const apps = this.getApplicants();
          const app = apps.find((a) => a.id === updatedOffer.applicantId);
          if (app) {
            app.offerLetterId = updatedOffer.id;
            this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
          }
        }

        this.addActivity(
          actorName,
          'HR Admin',
          'Updated Offer Letter',
          'Recruitment',
          `${updatedOffer.offerNumber} for ${updatedOffer.applicantName}`
        );
        return updatedOffer;
      }
    }

    const count = offers.length + 1;
    const newOffer: OfferLetter = {
      id: `OFFER-2026-${String(count).padStart(3, '0')}`,
      offerNumber: `CAS-OFFER-2026-${String(count).padStart(3, '0')}`,
      applicantId: data.applicantId || '',
      applicantName: data.applicantName || 'Candidate',
      applicantEmail: data.applicantEmail || '',
      applicantPhone: data.applicantPhone || '',
      position: data.position || 'Staff Role',
      department: data.department || 'Academic',
      joiningDate: data.joiningDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      employmentType: data.employmentType || 'Full Time',
      basicSalary: basic,
      allowances,
      allowanceItems,
      deductions,
      deductionItems,
      grossSalary,
      netSalary,
      workingDays: data.workingDays || 'Monday to Saturday',
      workingHours: data.workingHours || '09:30 AM to 06:00 PM',
      benefits: data.benefits || ['EPF & Gratuity', 'Medical Coverage', 'Performance Bonus'],
      termsAndConditions: data.termsAndConditions || 'Subject to document verification and 6-month probation period.',
      expiryDate: data.expiryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Sent',
      businessOrProduct: data.businessOrProduct || 'MYSAR / Casbiro',
      reportingTo: data.reportingTo || 'Department Head / Operations Lead',
      workLocation: data.workLocation || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021',
      reportingTime: data.reportingTime || '09:30 AM',
      reportingPerson: data.reportingPerson || 'Department Head / HR Operations',
      trainingPeriod: data.trainingPeriod || '30 Days',
      probationPeriod: data.probationPeriod || '6 Months',
      noticePeriod: data.noticePeriod || '30 Days',
      employeeAddress: data.employeeAddress || 'Door No. 12/48A, Green Valley Avenue',
      cityStatePin: data.cityStatePin || 'Kakkanad, Ernakulam, Kerala – 682030',
      hra,
      conveyanceAllowance,
      communicationAllowance,
      specialAllowance,
      otherAllowance,
      pfDeduction,
      ptDeduction,
      tdsDeduction,
      otherDeductions,
    };

    offers.unshift(newOffer);
    this.setStorage(HR_STORAGE_KEYS.OFFER_LETTERS, offers);

    // Link with applicant and update stage if needed
    if (newOffer.applicantId) {
      const apps = this.getApplicants();
      const app = apps.find((a) => a.id === newOffer.applicantId);
      if (app) {
        app.offerLetterId = newOffer.id;
        if (app.stage === 'Selected' || app.stage === 'Applied' || app.stage === 'Shortlisted' || app.stage === 'Interviewed') {
          app.stage = 'Offer Sent';
        }
        this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
      }
    }

    this.addActivity(actorName, 'HR Admin', 'Generated Offer Letter', 'Recruitment', `${newOffer.offerNumber} for ${newOffer.applicantName}`);
    return newOffer;
  }

  public deleteOfferLetter(id: string, actorName = 'Admin'): void {
    const offers = this.getOfferLetters().filter((o) => o.id !== id);
    this.setStorage(HR_STORAGE_KEYS.OFFER_LETTERS, offers);

    const apps = this.getApplicants();
    const app = apps.find((a) => a.offerLetterId === id);
    if (app) {
      app.offerLetterId = undefined;
      this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
    }
    this.addActivity(actorName, 'HR Admin', 'Deleted Offer Letter', 'Recruitment', id);
  }

  public updateOfferStatus(id: string, status: OfferStatus, actorName = 'Admin'): void {
    const offers = this.getOfferLetters();
    const offer = offers.find((o) => o.id === id);
    if (!offer) return;

    offer.status = status;
    this.setStorage(HR_STORAGE_KEYS.OFFER_LETTERS, offers);

    // Update applicant stage
    if (offer.applicantId) {
      const apps = this.getApplicants();
      const app = apps.find((a) => a.id === offer.applicantId);
      if (app) {
        if (status === 'Accepted') {
          app.stage = 'Offer Accepted';
        } else if (status === 'Rejected') {
          app.stage = 'Rejected';
          app.status = 'Rejected';
        }
        this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
      }
    }

    this.addActivity(actorName, 'HR Admin', `Updated Offer Status to ${status}`, 'Recruitment', offer.offerNumber);
  }

  // --- APPOINTMENT LETTERS ---
  public getAppointmentLetters(): AppointmentLetter[] {
    return this.getStorage<AppointmentLetter[]>(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, initialAppointmentLetters);
  }

  public generateAppointmentLetter(data: Partial<AppointmentLetter>, actorName = 'Admin'): AppointmentLetter {
    return this.saveAppointmentLetter(data, actorName);
  }

  public saveAppointmentLetter(data: Partial<AppointmentLetter>, actorName = 'Admin'): AppointmentLetter {
    const appts = this.getAppointmentLetters();
    const basic = data.basicSalary !== undefined ? Number(data.basicSalary) : 30000;

    let allowanceItems: AllowanceItem[] = Array.isArray(data.allowanceItems)
      ? data.allowanceItems
          .filter((item) => item && (item.name || Number(item.amount) > 0))
          .map((item, idx) => ({
            id: item.id || `all-appt-${Date.now()}-${idx}`,
            name: item.name || 'Allowance',
            amount: Number(item.amount) || 0,
          }))
      : [];

    const itemizedAllowancesSum = allowanceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    let allowances =
      allowanceItems.length > 0
        ? itemizedAllowancesSum
        : data.allowances !== undefined
        ? Number(data.allowances)
        : 0;

    if (data.allowances !== undefined && Number(data.allowances) > itemizedAllowancesSum && allowanceItems.length > 0) {
      allowanceItems.push({
        id: `all-appt-bal-${Date.now()}`,
        name: 'Other Allowance',
        amount: Number(data.allowances) - itemizedAllowancesSum,
      });
      allowances = Number(data.allowances);
    } else if (allowanceItems.length === 0 && allowances > 0) {
      allowanceItems = [{ id: `all-appt-default-${Date.now()}`, name: 'Monthly Allowances', amount: allowances }];
    }

    let deductionItems: DeductionItem[] = Array.isArray(data.deductionItems)
      ? data.deductionItems
          .filter((item) => item && (item.name || Number(item.amount) > 0))
          .map((item, idx) => ({
            id: item.id || `ded-appt-${Date.now()}-${idx}`,
            name: item.name || 'Deduction',
            amount: Number(item.amount) || 0,
          }))
      : [];

    const itemizedDeductionsSum = deductionItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const deductions =
      deductionItems.length > 0
        ? itemizedDeductionsSum
        : data.deductions !== undefined
        ? Number(data.deductions)
        : 0;

    const grossSalary = basic + allowances;
    const netSalary = Math.max(0, grossSalary - deductions);

    if (data.id) {
      const index = appts.findIndex((a) => a.id === data.id);
      if (index !== -1) {
        const existing = appts[index];
        const updatedAppt: AppointmentLetter = {
          ...existing,
          ...data,
          basicSalary: basic,
          allowances,
          allowanceItems,
          deductions,
          deductionItems,
          grossSalary,
          netSalary,
        };
        appts[index] = updatedAppt;
        this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);

        if (updatedAppt.applicantId) {
          const apps = this.getApplicants();
          const app = apps.find((a) => a.id === updatedAppt.applicantId);
          if (app) {
            app.appointmentLetterId = updatedAppt.id;
            this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
          }
        }

        this.addActivity(
          actorName,
          'HR Admin',
          'Updated Appointment Letter',
          'Recruitment',
          `${updatedAppt.appointmentNumber} for ${updatedAppt.employeeName}`
        );
        return updatedAppt;
      }
    }

    const count = appts.length + 1;
    const proposedEmpId = data.employeeId || `EMP-2026-${String(this.getStaff().length + 1).padStart(3, '0')}`;

    const newAppt: AppointmentLetter = {
      id: `APPT-2026-${String(count).padStart(3, '0')}`,
      appointmentNumber: `CAS-APPT-2026-${String(count).padStart(3, '0')}`,
      applicantId: data.applicantId || '',
      employeeName: data.employeeName || 'Staff Member',
      employeeId: proposedEmpId,
      position: data.position || 'Teacher',
      department: data.department || 'Academic',
      division: data.division || 'Academic Wing',
      joiningDate: data.joiningDate || new Date().toISOString().split('T')[0],
      employmentType: data.employmentType || 'Full Time',
      basicSalary: basic,
      allowances,
      allowanceItems,
      deductions,
      deductionItems,
      grossSalary,
      netSalary,
      probationPeriod: data.probationPeriod || '6 Months',
      workingHours: data.workingHours || '8:15 AM – 4:00 PM',
      workplace: data.workplace || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021',
      responsibilities: data.responsibilities || ['Fulfill institutional duties and classroom mentorship.'],
      termsAndConditions: data.termsAndConditions || 'Formal appointment subject to institutional service rules.',
      issueDate: data.issueDate || new Date().toISOString().split('T')[0],
      status: data.status || 'Generated',
    };

    appts.unshift(newAppt);
    this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);

    // Update applicant stage
    if (newAppt.applicantId) {
      const apps = this.getApplicants();
      const app = apps.find((a) => a.id === newAppt.applicantId);
      if (app) {
        app.appointmentLetterId = newAppt.id;
        if (app.stage !== 'Joined') {
          app.stage = 'Appointment';
        }
        this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
      }
    }

    this.addActivity(actorName, 'HR Admin', 'Generated Appointment Letter', 'Recruitment', `${newAppt.appointmentNumber} for ${newAppt.employeeName}`);
    return newAppt;
  }

  public deleteAppointmentLetter(id: string, actorName = 'Admin'): void {
    const appts = this.getAppointmentLetters().filter((a) => a.id !== id);
    this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);

    const apps = this.getApplicants();
    const app = apps.find((a) => a.appointmentLetterId === id);
    if (app) {
      app.appointmentLetterId = undefined;
      this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
    }
    this.addActivity(actorName, 'HR Admin', 'Deleted Appointment Letter', 'Recruitment', id);
  }

  public updateAppointmentStatus(id: string, status: AppointmentStatus, actorName = 'Admin'): void {
    const appts = this.getAppointmentLetters();
    const appt = appts.find((a) => a.id === id);
    if (!appt) return;

    appt.status = status;
    this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);
    this.addActivity(actorName, 'HR Admin', `Updated Appointment Letter status to ${status}`, 'Recruitment', appt.appointmentNumber);
  }

  // --- BUILD PREFILLED STAFF PAYLOAD FOR ONBOARDING MODAL ---
  public buildPrefilledStaffFromCandidate(applicantId: string, appointmentId?: string): Partial<StaffMember> {
    const applicants = this.getApplicants();
    const appts = this.getAppointmentLetters();
    const offers = this.getOfferLetters();

    const appt = appointmentId
      ? appts.find((ap) => ap.id === appointmentId)
      : appts.find((ap) => ap.applicantId === applicantId);

    const applicant =
      applicants.find((a) => a.id === (applicantId || appt?.applicantId)) ||
      (appt?.employeeName
        ? applicants.find((a) => a.name.trim().toLowerCase() === appt.employeeName.trim().toLowerCase())
        : undefined);

    const offer =
      offers.find((o) => o.applicantId === (applicant?.id || applicantId || appt?.applicantId)) ||
      (appt?.employeeName
        ? offers.find((o) => o.applicantName.trim().toLowerCase() === appt.employeeName.trim().toLowerCase())
        : undefined);

    const fullName = appt?.employeeName || offer?.applicantName || applicant?.name || '';
    const email = offer?.applicantEmail || applicant?.email || '';
    const phone = offer?.applicantPhone || applicant?.phone || '';
    const deptName = appt?.department || offer?.department || applicant?.department || 'Academic';
    const deptCode = this.getDepartmentCodeByNameOrCode(deptName);
    const deptMaster = this.getDepartmentsMaster().find(
      (d) => d.departmentCode === deptCode || d.departmentName.toLowerCase() === deptName.toLowerCase()
    );
    const reportingManager = deptMaster?.reporting || offer?.reportingTo || 'Dr. Ramesh Nambiar';
    const position = appt?.position || offer?.position || applicant?.positionName || 'Staff Member';
    const joiningDate = appt?.joiningDate || offer?.joiningDate || new Date().toISOString().split('T')[0];
    const employmentType = appt?.employmentType || offer?.employmentType || 'Full Time';
    const workplace = appt?.workplace || offer?.workplace || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021';
    const probationPeriod = appt?.probationPeriod || offer?.probationPeriod || '6 Months';
    const assignedStaffId = appt?.employeeId || this.generateNextEmployeeId(deptCode);

    // Salary & Compensation from Appointment Letter / Offer Letter
    const basic = appt?.basicSalary ?? offer?.basicSalary ?? 30000;
    const rawAllowanceItems =
      appt?.allowanceItems && appt.allowanceItems.length > 0
        ? appt.allowanceItems
        : offer?.allowanceItems && offer.allowanceItems.length > 0
        ? offer.allowanceItems
        : [];
    const allowanceItems = rawAllowanceItems.map((item, idx) => ({
      id: item.id || `all-onb-${Date.now()}-${idx}`,
      name: item.name,
      amount: Number(item.amount) || 0,
    }));
    const allowances =
      allowanceItems.length > 0
        ? allowanceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        : appt?.allowances ?? offer?.allowances ?? 0;

    const rawDeductionItems =
      appt?.deductionItems && appt.deductionItems.length > 0
        ? appt.deductionItems
        : offer?.deductionItems && offer.deductionItems.length > 0
        ? offer.deductionItems
        : [];
    const deductionItems = rawDeductionItems.map((item, idx) => ({
      id: item.id || `ded-onb-${Date.now()}-${idx}`,
      name: item.name,
      amount: Number(item.amount) || 0,
    }));
    const totalDeductions =
      deductionItems.length > 0
        ? deductionItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        : appt?.deductions ?? offer?.deductions ?? 0;

    const pf =
      deductionItems
        .filter((i) => /pf|provident/i.test(i.name))
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0) ||
      Number(offer?.pfDeduction) ||
      0;
    const tax = Math.max(0, totalDeductions - pf);
    const gross = basic + allowances;
    const net = Math.max(0, gross - totalDeductions);

    // Build prefilled Experience & Qualifications from Applicant record
    const prefilledExperiences =
      applicant?.experience && !/fresher|^0\b/i.test(applicant.experience)
        ? [
            {
              id: `exp-prefill-${Date.now()}`,
              organization: 'Previous Organization',
              designation: position,
              department: deptName,
              employmentType: employmentType,
              dateOfJoining: '',
              dateOfLeaving: '',
              totalExperience: applicant.experience,
              reasonForLeaving: 'Career Advancement',
              remarks: applicant.notes || 'Verified during recruitment interview.',
            },
          ]
        : [];

    const prefilledQualifications = applicant?.qualification
      ? [
          {
            id: `qual-prefill-${Date.now()}`,
            level: /m\.|master|pg|mba|mca|msc|ma|phd|ph\.d/i.test(applicant.qualification)
              ? ('Postgraduate' as const)
              : ('Undergraduate' as const),
            courseName: applicant.qualification,
            specialization: deptName,
            institution: '',
            yearOfPassing: '',
            grade: '',
            remarks: 'Verified during recruitment screening.',
          },
        ]
      : [];

    // Build prefilled Document References from Appointment Letter, Offer Letter, and Resume
    const prefilledDocRefs = [];
    if (appt) {
      prefilledDocRefs.push({
        id: `doc-ref-appt-${Date.now()}`,
        name: `Institutional Appointment Letter (${appt.appointmentNumber})`,
        category: 'Appointment Letter',
        fileName: `${appt.appointmentNumber.replace(/\//g, '_')}.pdf`,
        fileSize: '1.2 MB',
        verificationStatus: 'Verified' as const,
        uploadDate: appt.issueDate || new Date().toISOString().split('T')[0],
        documentNumber: appt.appointmentNumber,
        notes: `Issued on ${appt.issueDate || joiningDate} for ${position}`,
      });
    }
    if (offer) {
      prefilledDocRefs.push({
        id: `doc-ref-offer-${Date.now() + 1}`,
        name: `Accepted Offer Letter (${offer.offerNumber})`,
        category: 'Appointment Letter',
        fileName: `${offer.offerNumber.replace(/\//g, '_')}.pdf`,
        fileSize: '1.1 MB',
        verificationStatus: 'Verified' as const,
        uploadDate: offer.issueDate || new Date().toISOString().split('T')[0],
        documentNumber: offer.offerNumber,
        notes: `Offer Accepted • Gross ₹${gross.toLocaleString('en-IN')}/mo`,
      });
    }
    if (applicant?.resumeUrl) {
      prefilledDocRefs.push({
        id: `doc-ref-resume-${Date.now() + 2}`,
        name: 'Candidate Curriculum Vitae / Resume',
        category: 'Other',
        fileName: applicant.resumeUrl,
        fileSize: '0.9 MB',
        verificationStatus: 'Verified' as const,
        uploadDate: applicant.appliedDate || new Date().toISOString().split('T')[0],
        notes: 'Submitted during recruitment application',
      });
    }

    const suggestedUsername = fullName
      ? fullName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '.')
          .replace(/\.+/g, '.')
          .replace(/^\.|\.$/g, '')
      : 'staff.user';

    return {
      id: assignedStaffId,
      staffId: assignedStaffId,
      staffCode: assignedStaffId,
      fullName,
      profilePhoto: '',
      gender: 'Female',
      dateOfBirth: '1994-06-15',
      email: email || `${suggestedUsername}@casbiro.com`,
      personalEmail: email,
      contactNumber: phone,
      whatsappNumber: phone,
      emergencyContact: {
        name: '',
        relationship: 'Spouse',
        phone: '',
      },
      permanentAddress: {
        addressLine1: '',
        addressLine2: '',
        city: 'Kochi',
        district: 'Ernakulam',
        state: 'Kerala',
        country: 'India',
        pinCode: '',
      },
      communicationAddress: {
        sameAsPermanent: true,
        addressLine1: '',
        addressLine2: '',
        city: 'Kochi',
        district: 'Ernakulam',
        state: 'Kerala',
        country: 'India',
        pinCode: '',
      },
      joiningDate,
      division: appt?.division || `${deptName} Wing`,
      department: deptName,
      departmentCode: deptCode,
      position,
      employmentType,
      reportingManager,
      reportingTo: reportingManager,
      workLocation: workplace,
      branchLocation: 'Kochi Main Campus',
      probationPeriod,
      employmentStatus: 'Active',
      experiences: prefilledExperiences,
      qualifications: prefilledQualifications,
      familyMembers: [],
      documentReferences: prefilledDocRefs,
      salary: {
        basicSalary: basic,
        hra: 0,
        allowances,
        allowanceItems,
        deductionItems,
        specialAllowance: 0,
        bonus: 0,
        otherEarnings: 0,
        grossSalary: gross,
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions: 0,
        totalDeductions,
        netSalary: net,
        salaryFrequency: 'Monthly',
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          bankName: 'State Bank of India',
          accountNo: '',
          ifscCode: 'SBIN0002144',
          branch: 'Edappally, Kochi',
        },
      },
      bankPayroll: {
        bankName: 'State Bank of India',
        accountHolderName: fullName,
        accountNo: '',
        ifscCode: 'SBIN0002144',
        branch: 'Edappally, Kochi',
        uan: '',
        pfNumber: '',
        esiNumber: '',
        salaryStructure: `As per Appointment Letter (Gross ₹${gross.toLocaleString('en-IN')}/mo)`,
      },
      systemAccess: {
        enableLogin: true,
        userType: 'Faculty / Staff',
        username: suggestedUsername,
        role: 'Staff',
        accessLevel: 'Standard',
        assignedModules: ['Dashboard', 'HR & Staff Directory', 'Attendance & Leave'],
        branchAccess: 'Kochi Main Campus',
        accountStatus: 'Active',
      },
      notes: appt
        ? `Onboarded from Appointment Letter ${appt.appointmentNumber}${offer ? ` & Offer Letter ${offer.offerNumber}` : ''}.`
        : 'Onboarded from Recruitment Pipeline.',
    };
  }

  public completeCandidateConversionToStaff(
    applicantId?: string,
    appointmentId?: string,
    staffId?: string,
    actorName = 'Admin'
  ): void {
    const applicants = this.getApplicants();
    const appts = this.getAppointmentLetters();

    const appt = appointmentId
      ? appts.find((ap) => ap.id === appointmentId)
      : applicantId
      ? appts.find((ap) => ap.applicantId === applicantId)
      : undefined;

    const applicant = applicantId
      ? applicants.find((a) => a.id === applicantId)
      : appt?.applicantId
      ? applicants.find((a) => a.id === appt.applicantId)
      : undefined;

    if (applicant) {
      applicant.stage = 'Joined';
      applicant.status = 'Joined';
      if (staffId) {
        applicant.staffId = staffId;
      }
      this.setStorage(HR_STORAGE_KEYS.APPLICANTS, applicants);

      if (applicant.positionId) {
        const positions = this.getPositions();
        const pos = positions.find((p) => p.id === applicant.positionId);
        if (pos) {
          pos.filled += 1;
          pos.remainingVacancies = Math.max(0, pos.vacancies - pos.filled);
          if (pos.remainingVacancies === 0) {
            pos.status = 'Filled';
          }
          this.setStorage(HR_STORAGE_KEYS.POSITIONS, positions);
        }
      }
    }

    if (appt) {
      appt.status = 'Completed';
      if (staffId) {
        appt.employeeId = staffId;
      }
      this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);
    }

    this.addActivity(
      actorName,
      'HR Admin',
      'Onboarded Appointed Candidate as Staff Member',
      'Staff',
      `${appt?.employeeName || applicant?.name || 'Candidate'} → Employee ID ${staffId || appt?.employeeId || ''}`
    );
  }

  // --- CONVERT APPLICANT TO STAFF (Automated Workflow) ---
  public convertApplicantToStaff(applicantId: string, appointmentId?: string, actorName = 'Admin'): StaffMember | null {
    const applicants = this.getApplicants();
    const applicant = applicants.find((a) => a.id === applicantId);
    if (!applicant) return null;

    const appts = this.getAppointmentLetters();
    const appt = appointmentId
      ? appts.find((ap) => ap.id === appointmentId)
      : appts.find((ap) => ap.applicantId === applicantId);

    const offers = this.getOfferLetters();
    const offer = offers.find((o) => o.applicantId === applicantId);

    const staffList = this.getStaff();
    const newStaffId = appt?.employeeId || this.generateNextEmployeeId(applicant.department || 'Academic');

    const basic = appt?.basicSalary ?? offer?.basicSalary ?? 30000;
    const allowanceItems = appt?.allowanceItems || offer?.allowanceItems || [];
    const allowances =
      allowanceItems.length > 0
        ? allowanceItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        : appt?.allowances ?? offer?.allowances ?? 0;
    const hra = allowanceItems.find((i) => /room|hra|house|accommodation/i.test(i.name))?.amount || 0;
    const specialAllowance = allowanceItems.find((i) => /special/i.test(i.name))?.amount || 0;
    const gross = basic + allowances;

    const deductionItems = appt?.deductionItems || offer?.deductionItems || [];
    const pf = deductionItems.find((i) => /pf|provident/i.test(i.name))?.amount ?? offer?.pfDeduction ?? 0;
    const tax =
      deductionItems.find((i) => /pt|professional|tds|tax/i.test(i.name))?.amount ??
      ((offer?.ptDeduction || 0) + (offer?.tdsDeduction || 0));
    const totalDeductions =
      deductionItems.length > 0
        ? deductionItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
        : appt?.deductions ?? offer?.deductions ?? (pf + tax);
    const otherDeductions = Math.max(0, totalDeductions - (pf + tax));
    const net = Math.max(0, gross - totalDeductions);

    const newStaff: StaffMember = {
      id: newStaffId,
      fullName: applicant.name,
      dateOfBirth: '1992-05-15',
      gender: 'Female',
      email: applicant.email,
      contactNumber: applicant.phone,
      whatsappNumber: applicant.phone,
      emergencyContact: {
        name: 'Family Contact',
        relationship: 'Guardian',
        phone: applicant.phone,
      },
      permanentAddress: {
        addressLine1: 'Main Road',
        city: 'Kochi',
        state: 'Kerala',
        country: 'India',
        pinCode: '682020',
      },
      communicationAddress: {
        sameAsPermanent: true,
        addressLine1: 'Main Road',
        city: 'Kochi',
        state: 'Kerala',
        country: 'India',
        pinCode: '682020',
      },
      joiningDate: appt?.joiningDate || offer?.joiningDate || new Date().toISOString().split('T')[0],
      division: appt?.division || 'Academic Wing',
      department: applicant.department || 'Academic',
      position: applicant.positionName || 'Teacher',
      employmentType: appt?.employmentType || 'Full Time',
      reportingManager: 'Dr. Ramesh Nambiar',
      workLocation: appt?.workplace || 'Kochi Campus',
      probationPeriod: appt?.probationPeriod || '6 Months',
      employmentStatus: 'Active',
      documents: [
        {
          id: `DOC-${Date.now()}`,
          category: 'Appointment Letter',
          fileName: `${appt?.appointmentNumber || 'Appointment_Letter'}.pdf`,
          verificationStatus: 'Verified',
          uploadDate: new Date().toISOString().split('T')[0],
        },
      ],
      salary: {
        basicSalary: basic,
        hra,
        allowances,
        allowanceItems,
        deductionItems,
        specialAllowance,
        bonus: 0,
        otherEarnings: 0,
        grossSalary: gross,
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions,
        totalDeductions,
        netSalary: net,
        salaryFrequency: 'Monthly',
        paymentMethod: 'Bank Transfer',
        bankDetails: {
          bankName: 'State Bank of India',
          accountNo: '••••••••8821',
          ifscCode: 'SBIN0008441',
          branch: 'Edappally, Kochi',
        },
      },
      todayAttendanceStatus: 'Present',
      overallKpiScore: 90,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };

    // Save to staff
    staffList.push(newStaff);
    this.setStorage(HR_STORAGE_KEYS.STAFF, staffList);
    this.syncStaffToUserAccount(newStaff);

    // Update applicant record
    applicant.stage = 'Joined';
    applicant.status = 'Joined';
    applicant.staffId = newStaffId;
    this.setStorage(HR_STORAGE_KEYS.APPLICANTS, applicants);

    // Update appointment letter status
    if (appt) {
      appt.status = 'Completed';
      this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);
    }

    // Update position filled count
    if (applicant.positionId) {
      const positions = this.getPositions();
      const pos = positions.find((p) => p.id === applicant.positionId);
      if (pos) {
        pos.filled += 1;
        pos.remainingVacancies = Math.max(0, pos.vacancies - pos.filled);
        if (pos.remainingVacancies === 0) {
          pos.status = 'Filled';
        }
        this.setStorage(HR_STORAGE_KEYS.POSITIONS, positions);
      }
    }

    this.addActivity(
      actorName,
      'HR Admin',
      'Converted Applicant to Staff Member',
      'Staff',
      `${applicant.name} → Employee ID ${newStaffId}`
    );

    return newStaff;
  }

  // --- DEPARTMENT MASTER ---
  public getDepartmentsMaster(): DepartmentMaster[] {
    const list = this.getStorage<DepartmentMaster[]>(HR_STORAGE_KEYS.DEPARTMENTS, initialDepartmentsMaster);
    // Ensure all departments have allowedMenuIds populated
    let modified = false;
    const sanitized = list.map((d) => {
      if (!d.allowedMenuIds || d.allowedMenuIds.length === 0) {
        const foundInitial = initialDepartmentsMaster.find(
          (init) => init.departmentCode === d.departmentCode || init.id === d.id
        );
        if (foundInitial?.allowedMenuIds) {
          modified = true;
          return { ...d, allowedMenuIds: foundInitial.allowedMenuIds };
        }
      }
      return d;
    });

    if (modified) {
      this.setStorage(HR_STORAGE_KEYS.DEPARTMENTS, sanitized);
    }
    return sanitized;
  }

  public saveDepartment(data: Partial<DepartmentMaster>, actorName = 'Admin'): DepartmentMaster {
    const depts = this.getDepartmentsMaster();
    if (data.id) {
      const idx = depts.findIndex((d) => d.id === data.id);
      if (idx !== -1) {
        const updated: DepartmentMaster = {
          ...depts[idx],
          ...data,
          departmentCode: (data.departmentCode || depts[idx].departmentCode).toUpperCase().trim(),
          allowedMenuIds: data.allowedMenuIds !== undefined ? data.allowedMenuIds : depts[idx].allowedMenuIds,
        };
        depts[idx] = updated;
        this.setStorage(HR_STORAGE_KEYS.DEPARTMENTS, depts);
        this.addActivity(actorName, 'HR Admin', 'Updated Department Master', 'Settings', `${updated.departmentCode} - ${updated.departmentName}`);
        return updated;
      }
    }

    const count = depts.length + 1;
    const newCode = (data.departmentCode || `DEP${count}`).toUpperCase().trim();
    const newDept: DepartmentMaster = {
      id: data.id || `DEPT-${String(count).padStart(3, '0')}`,
      departmentCode: newCode,
      departmentName: data.departmentName || 'New Department',
      reporting: data.reporting || 'Managing Director',
      headOfDepartment: data.headOfDepartment || '',
      description: data.description || '',
      status: data.status || 'Active',
      createdDate: new Date().toISOString().split('T')[0],
      allowedMenuIds: data.allowedMenuIds || [],
    };

    depts.push(newDept);
    this.setStorage(HR_STORAGE_KEYS.DEPARTMENTS, depts);
    this.addActivity(actorName, 'HR Admin', 'Created Department Master Record', 'Settings', `${newDept.departmentCode} - ${newDept.departmentName}`);
    return newDept;
  }

  public deleteDepartment(id: string, actorName = 'Admin'): boolean {
    const depts = this.getDepartmentsMaster();
    const target = depts.find((d) => d.id === id);
    if (!target) return false;

    // Check if staff exists in department
    const staff = this.getStaff();
    const hasStaff = staff.some(
      (s) => (s.departmentCode && s.departmentCode.toUpperCase() === target.departmentCode.toUpperCase()) ||
             (s.department && s.department.toLowerCase() === target.departmentName.toLowerCase())
    );

    if (hasStaff) {
      // Soft-deactivate if staff exists
      target.status = 'Inactive';
      this.setStorage(HR_STORAGE_KEYS.DEPARTMENTS, depts);
      this.addActivity(actorName, 'HR Admin', 'Deactivated Department (Staff Assigned)', 'Settings', target.departmentCode);
      return false;
    }

    const filtered = depts.filter((d) => d.id !== id);
    this.setStorage(HR_STORAGE_KEYS.DEPARTMENTS, filtered);
    this.addActivity(actorName, 'HR Admin', 'Deleted Department Master', 'Settings', target.departmentCode);
    return true;
  }

  // --- BRANCH / LOCATION MASTER ---
  public getBranchesMaster(): BranchMaster[] {
    const defaultBranches: BranchMaster[] = [
      {
        id: 'BR-001',
        branchCode: 'KCH-01',
        branchName: 'Kochi Main Campus',
        city: 'Kochi',
        address: 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
        contactPerson: 'Dr. Ramesh Nambiar',
        contactPhone: '+91 7994 807 907',
        status: 'Active',
        createdDate: '2026-01-01',
      },
      {
        id: 'BR-002',
        branchCode: 'CLT-02',
        branchName: 'Calicut Regional Centre',
        city: 'Calicut',
        address: 'Mavoor Road, Kozhikode, Kerala – 673004',
        contactPerson: 'Sri. Ananthan K.',
        contactPhone: '+91 94471 22334',
        status: 'Active',
        createdDate: '2026-01-01',
      },
      {
        id: 'BR-003',
        branchCode: 'TVM-03',
        branchName: 'Trivandrum South Wing',
        city: 'Trivandrum',
        address: 'Technopark Phase 1 Campus Rd, Kazhakkoottam, Trivandrum – 695581',
        contactPerson: 'Smt. Deepa Nair',
        contactPhone: '+91 98460 55667',
        status: 'Active',
        createdDate: '2026-01-01',
      },
      {
        id: 'BR-004',
        branchCode: 'WYD-04',
        branchName: 'Wayanad Academic Outreach',
        city: 'Kalpetta',
        address: 'Civil Station Road, Kalpetta North, Wayanad – 673122',
        contactPerson: 'Sri. Vijayan P.',
        contactPhone: '+91 94462 88990',
        status: 'Active',
        createdDate: '2026-01-01',
      },
    ];
    return this.getStorage<BranchMaster[]>(HR_STORAGE_KEYS.BRANCHES, defaultBranches);
  }

  public saveBranch(data: Partial<BranchMaster>, actorName = 'Admin'): BranchMaster {
    const branches = this.getBranchesMaster();
    if (data.id) {
      const idx = branches.findIndex((b) => b.id === data.id);
      if (idx !== -1) {
        const updated: BranchMaster = {
          ...branches[idx],
          ...data,
          branchCode: (data.branchCode || branches[idx].branchCode).toUpperCase().trim(),
          branchName: (data.branchName || branches[idx].branchName).trim(),
        };
        branches[idx] = updated;
        this.setStorage(HR_STORAGE_KEYS.BRANCHES, branches);
        this.addActivity(actorName, 'HR Admin', 'Updated Branch / Location Master', 'Settings', `${updated.branchCode} - ${updated.branchName}`);
        return updated;
      }
    }

    const count = branches.length + 1;
    const newCode = (data.branchCode || `BR-${String(count).padStart(2, '0')}`).toUpperCase().trim();
    const newBranch: BranchMaster = {
      id: data.id || `BR-${String(count).padStart(3, '0')}-${Date.now().toString(36).slice(-3)}`,
      branchCode: newCode,
      branchName: (data.branchName || 'New Campus Branch').trim(),
      city: data.city || 'Kochi',
      address: data.address || '',
      contactPerson: data.contactPerson || '',
      contactPhone: data.contactPhone || '',
      status: data.status || 'Active',
      createdDate: new Date().toISOString().split('T')[0],
    };

    branches.push(newBranch);
    this.setStorage(HR_STORAGE_KEYS.BRANCHES, branches);

    // Also sync to attendanceLocations in HrSettingsConfig
    const hrSettings = this.getHrSettings();
    if (hrSettings.workingHours) {
      const locs = hrSettings.workingHours.attendanceLocations || [];
      if (!locs.includes(newBranch.branchName)) {
        hrSettings.workingHours.attendanceLocations = [...locs, newBranch.branchName];
        this.setStorage(HR_STORAGE_KEYS.SETTINGS, hrSettings);
      }
    }

    this.addActivity(actorName, 'HR Admin', 'Created Branch / Location Master', 'Settings', `${newBranch.branchCode} - ${newBranch.branchName}`);
    return newBranch;
  }

  public deleteBranch(id: string, actorName = 'Admin'): boolean {
    const branches = this.getBranchesMaster();
    const target = branches.find((b) => b.id === id);
    if (!target) return false;

    const filtered = branches.filter((b) => b.id !== id);
    this.setStorage(HR_STORAGE_KEYS.BRANCHES, filtered);
    this.addActivity(actorName, 'HR Admin', 'Deleted Branch / Location Master', 'Settings', `${target.branchCode} - ${target.branchName}`);
    return true;
  }

  public getDepartmentCodeByNameOrCode(departmentCodeOrName?: string): string {
    const clean = (departmentCodeOrName || '').trim();
    if (!clean) return '101';

    const lower = clean.toLowerCase();
    const standardMap: { [key: string]: string } = {
      academic: '101',
      acad: '101',
      '101': '101',
      administration: '102',
      admin: '102',
      admi: '102',
      adm: '102',
      '102': '102',
      'finance & accounts': '103',
      finance: '103',
      accounts: '103',
      fin: '103',
      '103': '103',
      'human resources': '104',
      hr: '104',
      '104': '104',
      'engineering & it': '105',
      it: '105',
      tech: '105',
      '105': '105',
      'sales & marketing': '106',
      sales: '106',
      marketing: '106',
      mkt: '106',
      '106': '106',
      'campus operations': '107',
      operations: '107',
      ops: '107',
      '107': '107',
    };

    if (standardMap[lower]) {
      return standardMap[lower];
    }

    const depts = this.getDepartmentsMaster();
    const foundDept = depts.find(
      (d) =>
        d.departmentCode.toLowerCase() === lower ||
        d.departmentName.toLowerCase() === lower ||
        d.id.toLowerCase() === lower
    );
    if (foundDept) return foundDept.departmentCode.toUpperCase();
    if (clean.length <= 4) return clean.toUpperCase();
    return clean.substring(0, 4).toUpperCase();
  }

  public getNextContinuousSequenceNumber(staffListOverride?: StaffMember[]): number {
    const staff = staffListOverride || this.getStaff();
    let maxNum = 0;

    for (const s of staff) {
      const sId = (s.id || s.staffCode || '').trim();
      const match = sId.match(/(\d+)$/);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    return maxNum + 1;
  }

  public generateNextEmployeeId(departmentCodeOrName?: string, staffListOverride?: StaffMember[]): string {
    const code = this.getDepartmentCodeByNameOrCode(departmentCodeOrName);
    const nextNumber = this.getNextContinuousSequenceNumber(staffListOverride);
    return `CB/${code}/${String(nextNumber).padStart(3, '0')}`;
  }

  public formatOrValidateEmployeeId(
    rawId?: string,
    departmentCodeOrName?: string,
    existingStaffList?: StaffMember[]
  ): string {
    const deptCode = this.getDepartmentCodeByNameOrCode(departmentCodeOrName);
    const cleaned = (rawId || '').trim();

    // Check if rawId matches CB/{DEPT}/{number} or CB{DEPT}/{number}
    const match = cleaned.match(/^CB\/?([A-Za-z0-9_-]+)\/(\d+)$/i);
    if (match) {
      const parsedDept = this.getDepartmentCodeByNameOrCode(match[1]);
      const num = parseInt(match[2], 10);
      return `CB/${parsedDept}/${String(num).padStart(3, '0')}`;
    }

    // Otherwise generate the next available employee ID in global continuous sequence
    return this.generateNextEmployeeId(deptCode, existingStaffList);
  }

  // --- STAFF MANAGEMENT ---
  public getStaff(): StaffMember[] {
    const rawList = this.getStorage<StaffMember[]>(HR_STORAGE_KEYS.STAFF, initialStaffMembers);
    
    // Automatically migrate/standardize any legacy IDs to CB/{DeptCode}/{GlobalContinuousNumber}
    // Ensures global continuous numbering without department-wise reset (e.g. CB/101/001, CB101/002, CB/102/003, CB/103/004)
    let hasChanges = false;
    const seenNumbers = new Set<number>();
    let hasDuplicateNumbersOrLegacy = false;

    for (const s of rawList) {
      const sId = (s.id || s.staffCode || '').trim();
      const match = sId.match(/^CB\/?([A-Za-z0-9_-]+)\/(\d+)$/i);
      if (match) {
        const dept = match[1];
        const num = parseInt(match[2], 10);
        // If the department code is still legacy alpha (e.g. ACAD, ADMI, IT) or number is repeated across different staff
        if (['ACAD', 'ADM', 'ADMI', 'FIN', 'HR', 'IT', 'MKT', 'OPS'].includes(dept.toUpperCase()) || seenNumbers.has(num)) {
          hasDuplicateNumbersOrLegacy = true;
          break;
        }
        seenNumbers.add(num);
      } else {
        hasDuplicateNumbersOrLegacy = true;
        break;
      }
    }

    let runningSeq = 0;
    const validatedList = rawList.map((s) => {
      const deptCode = this.getDepartmentCodeByNameOrCode(s.departmentCode || s.department || 'Academic');
      let id = (s.id || s.staffCode || '').trim();
      const match = id.match(/^CB\/?([A-Za-z0-9_-]+)\/(\d+)$/i);

      let seqNum: number;
      let effectiveDept = deptCode;

      if (!hasDuplicateNumbersOrLegacy && match) {
        seqNum = parseInt(match[2], 10);
        effectiveDept = this.getDepartmentCodeByNameOrCode(match[1]);
      } else {
        runningSeq += 1;
        seqNum = runningSeq;
        hasChanges = true;
      }

      const normalized = `CB/${effectiveDept}/${String(seqNum).padStart(3, '0')}`;
      if (id !== normalized || s.staffCode !== normalized || s.departmentCode !== effectiveDept) {
        hasChanges = true;
      }

      return {
        ...s,
        id: normalized,
        staffCode: normalized,
        departmentCode: effectiveDept,
      };
    });

    if (hasChanges) {
      this.setStorage(HR_STORAGE_KEYS.STAFF, validatedList);
    }
    return validatedList;
  }

  public clearAllDummyData(actorName = 'Admin'): void {
    this.setStorage(HR_STORAGE_KEYS.STAFF, []);
    this.setStorage(HR_STORAGE_KEYS.ATTENDANCE, []);
    this.setStorage(HR_STORAGE_KEYS.LEAVE_REQUESTS, []);
    this.setStorage(HR_STORAGE_KEYS.LEAVE_BALANCES, []);
    this.setStorage(HR_STORAGE_KEYS.PERFORMANCE, []);
    this.setStorage(HR_STORAGE_KEYS.APPLICANTS, []);
    this.setStorage(HR_STORAGE_KEYS.INTERVIEWS, []);
    this.setStorage(HR_STORAGE_KEYS.OFFER_LETTERS, []);
    this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, []);
    this.addActivity(actorName, 'HR Admin', 'Cleared all dummy records and staff data', 'Settings', 'Clean Slate');
  }

  public saveStaff(staffData: Partial<StaffMember>, actorName = 'Admin'): StaffMember {
    const staffList = this.getStaff();
    const deptParam = staffData.departmentCode || staffData.department || 'Academic';
    const deptCode = this.getDepartmentCodeByNameOrCode(deptParam);

    if (staffData.id) {
      const idx = staffList.findIndex((s) => s.id === staffData.id || (staffData.previousEmployeeId && s.id === staffData.previousEmployeeId));
      if (idx !== -1) {
        const current = staffList[idx];
        const otherStaff = staffList.filter((_, i) => i !== idx);
        const finalId = this.formatOrValidateEmployeeId(
          staffData.id || current.id,
          deptCode,
          otherStaff
        );

        const updated: StaffMember = {
          ...current,
          ...staffData,
          id: finalId,
          staffCode: finalId,
          departmentCode: deptCode,
          updatedDate: new Date().toISOString().split('T')[0],
        };
        staffList[idx] = updated;
        this.setStorage(HR_STORAGE_KEYS.STAFF, staffList);
        this.addActivity(actorName, 'HR Admin', 'Updated Staff Record', 'Staff', `${updated.id} - ${updated.fullName}`);
        this.syncStaffToUserAccount(updated);
        return updated;
      }
    }

    const newId = this.formatOrValidateEmployeeId(staffData.id || staffData.staffCode, deptCode, staffList);
    const basic = staffData.salary?.basicSalary || 30000;
    const hra = staffData.salary?.hra || Math.round(basic * 0.4);
    const allowances = staffData.salary?.allowances || 8000;
    const special = staffData.salary?.specialAllowance || 2000;
    const bonus = staffData.salary?.bonus || 0;
    const gross = basic + hra + allowances + special + bonus;
    const pf = staffData.salary?.pfDeduction ?? 1800;
    const tax = staffData.salary?.taxDeduction ?? 1000;
    const otherDed = staffData.salary?.otherDeductions ?? 0;
    const totalDeductions = pf + tax + otherDed;
    const net = gross - totalDeductions;

    const newStaff: StaffMember = {
      ...staffData,
      id: newId,
      staffCode: newId,
      departmentCode: deptCode,
      reportingTo: staffData.reportingTo || staffData.reportingManager,
      fullName: staffData.fullName || 'New Staff',
      dateOfBirth: staffData.dateOfBirth || '1990-01-01',
      gender: staffData.gender || 'Male',
      email: staffData.email || '',
      contactNumber: staffData.contactNumber || '',
      whatsappNumber: staffData.whatsappNumber || staffData.contactNumber || '',
      emergencyContact: staffData.emergencyContact || {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '',
      },
      permanentAddress: staffData.permanentAddress || {
        addressLine1: 'Address Line 1',
        city: 'Kochi',
        state: 'Kerala',
        country: 'India',
        pinCode: '682001',
      },
      communicationAddress: staffData.communicationAddress || {
        sameAsPermanent: true,
        addressLine1: 'Address Line 1',
        city: 'Kochi',
        state: 'Kerala',
        country: 'India',
        pinCode: '682001',
      },
      joiningDate: staffData.joiningDate || new Date().toISOString().split('T')[0],
      division: staffData.division || 'Academic Wing',
      department: staffData.department || 'Academic',
      position: staffData.position || 'Teacher',
      employeeCategory: staffData.employeeCategory || 'Administrator',
      employmentType: staffData.employmentType || 'Full Time',
      reportingManager: staffData.reportingManager || 'Dr. Ramesh Nambiar',
      workLocation: staffData.workLocation || 'Kochi Main Campus',
      probationPeriod: staffData.probationPeriod || '6 Months',
      employmentStatus: staffData.employmentStatus || 'Active',
      documents: staffData.documents || [],
      salary: {
        basicSalary: basic,
        hra,
        allowances,
        specialAllowance: special,
        bonus,
        otherEarnings: 0,
        grossSalary: gross,
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions: otherDed,
        totalDeductions,
        netSalary: net,
        salaryFrequency: 'Monthly',
        paymentMethod: staffData.salary?.paymentMethod || 'Bank Transfer',
        bankDetails: staffData.salary?.bankDetails || {
          bankName: 'State Bank of India',
          accountNo: '••••••••1234',
          ifscCode: 'SBIN0001234',
          branch: 'Kochi',
        },
      },
      todayAttendanceStatus: staffData.todayAttendanceStatus || 'Present',
      overallKpiScore: staffData.overallKpiScore || 90,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };

    staffList.unshift(newStaff);
    this.setStorage(HR_STORAGE_KEYS.STAFF, staffList);
    this.addActivity(actorName, 'HR Admin', 'Onboarded New Staff', 'Staff', `${newStaff.id} - ${newStaff.fullName}`);
    this.syncStaffToUserAccount(newStaff);
    return newStaff;
  }

  public deleteStaff(id: string, actorName = 'Admin'): void {
    const list = this.getStaff().filter((s) => s.id !== id);
    this.setStorage(HR_STORAGE_KEYS.STAFF, list);
    this.addActivity(actorName, 'HR Admin', 'Removed Staff Member', 'Staff', id);

    // Deactivate linked user in system
    try {
      const rawUsers = localStorage.getItem('mysar_users_data_v1');
      if (rawUsers) {
        const users = JSON.parse(rawUsers);
        const updatedUsers = users.map((u: any) => {
          if (u.staffId === id) {
            return { ...u, status: 'Inactive' };
          }
          return u;
        });
        localStorage.setItem('mysar_users_data_v1', JSON.stringify(updatedUsers));
      }
    } catch {
      // ignore
    }
  }

  /**
   * Automatically connect User Creation and Staff Creation
   * Syncs staff details, username, password, userType, and restricts access if staff is Inactive
   */
  public syncStaffToUserAccount(staff: StaffMember): void {
    try {
      const rawUsers = localStorage.getItem('mysar_users_data_v1');
      let users: any[] = rawUsers ? JSON.parse(rawUsers) : [];

      const sId = staff.id;
      const sUsername =
        staff.systemAccess?.username?.trim().toLowerCase() ||
        (staff.email ? staff.email.split('@')[0].toLowerCase() : staff.fullName.toLowerCase().replace(/\s+/g, '.'));
      const sPassword = staff.systemAccess?.password?.trim() || 'Password@123';
      const sEmail = staff.email || staff.personalEmail || `${sUsername}@casbiro.com`;
      const isStaffActive = staff.employmentStatus === 'Active';
      const isLoginEnabled = staff.systemAccess?.enableLogin !== false;

      // Determine User Role
      let userRole: 'Admin' | 'Manager' | 'Salesperson' | 'Staff' = 'Staff';
      const userTypeStr = (staff.systemAccess?.userType || staff.systemAccess?.role || staff.position || '').toLowerCase();
      if (userTypeStr.includes('admin') || userTypeStr.includes('principal') || userTypeStr.includes('director')) {
        userRole = 'Admin';
      } else if (userTypeStr.includes('manager') || userTypeStr.includes('coordinator') || userTypeStr.includes('lead')) {
        userRole = 'Manager';
      } else if (userTypeStr.includes('sales') || userTypeStr.includes('marketing') || userTypeStr.includes('csr')) {
        userRole = 'Salesperson';
      } else {
        userRole = 'Staff';
      }

      // Check for existing user account
      const existingIdx = users.findIndex(
        (u) =>
          u.staffId === sId ||
          (staff.staffCode && u.staffId === staff.staffCode) ||
          (u.userId && u.userId.toLowerCase() === sUsername) ||
          (u.email && u.email.toLowerCase() === sEmail.toLowerCase())
      );

      if (existingIdx !== -1) {
        // Update existing user account
        users[existingIdx] = {
          ...users[existingIdx],
          staffId: sId,
          department: staff.department,
          departmentCode: staff.departmentCode,
          name: staff.fullName,
          email: sEmail,
          mobile: staff.contactNumber || users[existingIdx].mobile,
          role: userRole,
          userType: staff.systemAccess?.userType || users[existingIdx].userType || 'Staff',
          assignedModules: staff.systemAccess?.assignedModules || users[existingIdx].assignedModules || ['Dashboard'],
          branchAccess: staff.systemAccess?.branchAccess || staff.branchLocation || users[existingIdx].branchAccess,
          accessLevel: staff.systemAccess?.accessLevel || users[existingIdx].accessLevel || 'Standard',
          // Access restricted if staff is Inactive!
          status: isStaffActive && isLoginEnabled ? 'Active' : 'Inactive',
          password: sPassword || users[existingIdx].password || 'Password@123',
          avatar: staff.profilePhoto || users[existingIdx].avatar,
        };
      } else if (isLoginEnabled) {
        // Create new user account automatically during onboarding
        const cleanStaffIdPart = sId.replace(/[^a-zA-Z0-9]/g, '-');
        const newUser = {
          id: `USR-${cleanStaffIdPart}`,
          userId: sUsername,
          password: sPassword,
          name: staff.fullName,
          email: sEmail,
          mobile: staff.contactNumber || '+91 98470 00000',
          role: userRole,
          userType: staff.systemAccess?.userType || 'Staff',
          assignedModules: staff.systemAccess?.assignedModules || ['Dashboard', 'HR & Staff Directory', 'Attendance & Leave'],
          branchAccess: staff.systemAccess?.branchAccess || staff.branchLocation || 'Kochi Main Campus',
          accessLevel: staff.systemAccess?.accessLevel || 'Standard',
          status: isStaffActive ? 'Active' : 'Inactive',
          avatar: staff.profilePhoto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          staffId: sId,
          department: staff.department,
          departmentCode: staff.departmentCode,
        };
        users.push(newUser);
      }

      localStorage.setItem('mysar_users_data_v1', JSON.stringify(users));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mysar_staff_access_changed'));
      }
    } catch (e) {
      console.error('Failed to sync staff to user account', e);
    }
  }

  // --- ATTENDANCE ---
  public getAttendanceRecords(date?: string): DailyAttendanceRecord[] {
    const records = this.getStorage<DailyAttendanceRecord[]>(HR_STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
    if (!date) return records;
    return records.filter((r) => r.date === date);
  }

  public markAttendance(
    staffId: string,
    date: string,
    status: AttendanceStatus,
    checkIn?: string,
    checkOut?: string,
    remarks?: string,
    actorName = 'Admin'
  ): void {
    const records = this.getStorage<DailyAttendanceRecord[]>(HR_STORAGE_KEYS.ATTENDANCE, initialAttendanceRecords);
    const staff = this.getStaff().find((s) => s.id === staffId);
    if (!staff) return;

    const existingIdx = records.findIndex((r) => r.staffId === staffId && r.date === date);
    const newRecord: DailyAttendanceRecord = {
      id: `ATT-${date}-${staffId}`,
      staffId,
      staffName: staff.fullName,
      department: staff.department,
      position: staff.position,
      date,
      checkIn: checkIn || (status === 'Present' || status === 'Late' ? '08:30 AM' : undefined),
      checkOut: checkOut || (status === 'Present' ? '04:30 PM' : undefined),
      workingHours: status === 'Present' ? 8.0 : status === 'Half Day' ? 4.0 : 0,
      status,
      remarks,
    };

    if (existingIdx !== -1) {
      records[existingIdx] = newRecord;
    } else {
      records.unshift(newRecord);
    }
    this.setStorage(HR_STORAGE_KEYS.ATTENDANCE, records);

    // Update staff member's today attendance status if date is today
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const staffList = this.getStaff();
      const s = staffList.find((item) => item.id === staffId);
      if (s) {
        s.todayAttendanceStatus = status === 'Leave' ? 'On Leave' : status;
        this.setStorage(HR_STORAGE_KEYS.STAFF, staffList);
      }
    }

    this.addActivity(actorName, 'HR Admin', `Marked Attendance: ${status}`, 'Attendance', `${staff.fullName} on ${date}`);
  }

  public bulkMarkAttendance(date: string, status: AttendanceStatus, actorName = 'Admin'): void {
    const staffList = this.getStaff();
    staffList.forEach((s) => {
      this.markAttendance(s.id, date, status, undefined, undefined, 'Bulk Marked by HR', actorName);
    });
    this.addActivity(actorName, 'HR Admin', `Bulk Marked All Staff as ${status}`, 'Attendance', `Date: ${date}`);
  }

  // --- LEAVE MANAGEMENT ---
  public getLeaveRequests(): LeaveRequest[] {
    return this.getStorage<LeaveRequest[]>(HR_STORAGE_KEYS.LEAVE_REQUESTS, initialLeaveRequests);
  }

  public submitLeaveRequest(data: Partial<LeaveRequest>, actorName = 'Staff'): LeaveRequest {
    const requests = this.getLeaveRequests();
    const balances = this.getLeaveBalances();
    const staffList = this.getStaff();

    // Enforce validation check against available leave balance
    const validation = validateLeaveRequest({
      staffId: data.staffId || '',
      leaveType: data.leaveType || 'Casual Leave',
      numberOfDays: data.numberOfDays || 1,
      fromDate: data.fromDate,
      toDate: data.toDate,
      reason: data.reason,
      balances,
      pendingRequests: requests,
      staffList,
    });

    if (!validation.canSubmit && !validation.category.isExemptFromQuota) {
      const errMsg = validation.errors[0] || 'Requested leave duration exceeds employee available leave balance.';
      throw new Error(errMsg);
    }

    const count = requests.length + 1;
    const newReq: LeaveRequest = {
      id: `LR-2026-${String(count).padStart(3, '0')}`,
      staffId: data.staffId || '',
      staffName: data.staffName || '',
      department: data.department || 'Academic',
      position: data.position || 'Teacher',
      leaveType: data.leaveType || 'Casual Leave',
      fromDate: data.fromDate || new Date().toISOString().split('T')[0],
      toDate: data.toDate || new Date().toISOString().split('T')[0],
      numberOfDays: data.numberOfDays || 1,
      reason: data.reason || 'Personal reasons',
      substituteStaff: data.substituteStaff || '',
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    requests.unshift(newReq);
    this.setStorage(HR_STORAGE_KEYS.LEAVE_REQUESTS, requests);
    this.addActivity(actorName, 'Staff', 'Applied for Leave', 'Leave', `${newReq.staffName} (${newReq.leaveType}, ${newReq.numberOfDays} days)`);
    return newReq;
  }

  public updateLeaveStatus(id: string, status: LeaveRequestStatus, remarks?: string, approverName = 'Dr. Ramesh Nambiar'): void {
    const requests = this.getLeaveRequests();
    const req = requests.find((r) => r.id === id);
    if (!req) return;

    req.status = status;
    req.remarks = remarks || req.remarks;
    req.approvedBy = approverName;
    req.actionDate = new Date().toISOString().split('T')[0];
    this.setStorage(HR_STORAGE_KEYS.LEAVE_REQUESTS, requests);

    // If approved, deduct leave balance
    if (status === 'Approved') {
      const balances = this.getLeaveBalances();
      let bal = balances.find((b) => b.staffId === req.staffId);
      if (!bal) {
        bal = {
          staffId: req.staffId,
          staffName: req.staffName,
          department: req.department,
          annualTotal: 15,
          annualUsed: 0,
          casualTotal: 12,
          casualUsed: 0,
          sickTotal: 10,
          sickUsed: 0,
          emergencyTotal: 5,
          emergencyUsed: 0,
        };
        balances.push(bal);
      }
      if (req.leaveType === 'Casual Leave') bal.casualUsed = (bal.casualUsed || 0) + req.numberOfDays;
      else if (req.leaveType === 'Sick Leave') bal.sickUsed = (bal.sickUsed || 0) + req.numberOfDays;
      else if (req.leaveType === 'Annual Leave') bal.annualUsed = (bal.annualUsed || 0) + req.numberOfDays;
      else if (req.leaveType === 'Emergency Leave') bal.emergencyUsed = (bal.emergencyUsed || 0) + req.numberOfDays;
      this.setStorage(HR_STORAGE_KEYS.LEAVE_BALANCES, balances);
    }

    this.addActivity(approverName, 'Principal / HR', `Leave ${status}`, 'Leave', `${req.staffName} - ${req.leaveType}`);
  }

  public getLeaveBalances(): LeaveBalance[] {
    return this.getStorage<LeaveBalance[]>(HR_STORAGE_KEYS.LEAVE_BALANCES, initialLeaveBalances);
  }

  // --- PAYROLL MANAGEMENT ---
  public getPayrollRecords(): MonthlyPayrollRecord[] {
    return this.getStorage<MonthlyPayrollRecord[]>(HR_STORAGE_KEYS.PAYROLL, initialMonthlyPayroll);
  }

  public generateMonthlyPayroll(month: string, year: number, actorName = 'Finance Officer'): MonthlyPayrollRecord[] {
    const staffList = this.getStaff();
    const existingPayroll = this.getPayrollRecords();

    // Filter out existing ones for that month/year to prevent duplicate generation
    const recordsForMonth = staffList.map((staff, idx) => {
      const basic = staff.salary.basicSalary;
      const hra = staff.salary.hra;
      const allowances = staff.salary.allowances + staff.salary.specialAllowance;
      const bonus = staff.salary.bonus || 0;
      const overtime = staff.department === 'IT' ? 1000 : 0;
      const gross = basic + hra + allowances + bonus + overtime;
      const pf = staff.salary.pfDeduction;
      const tax = staff.salary.taxDeduction;
      const totalDed = pf + tax;
      const net = gross - totalDed;

      const recordId = `PAY-${year}-${String(month).slice(0, 3).toUpperCase()}-${staff.id}`;
      const existing = existingPayroll.find((p) => p.staffId === staff.id && p.month === month && p.year === year);

      if (existing) return existing;

      return {
        id: recordId,
        month,
        year,
        staffId: staff.id,
        staffName: staff.fullName,
        department: staff.department,
        position: staff.position,
        basicSalary: basic,
        hra,
        allowances,
        overtime,
        bonus,
        grossSalary: gross,
        leaveDeductions: 0,
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions: 0,
        totalDeductions: totalDed,
        netSalary: net,
        status: 'Processed' as PayrollStatus,
        payslipNumber: `CAS-PAY-${year}${String(idx + 1).padStart(2, '0')}-${staff.id.slice(-3)}`,
        processedDate: new Date().toISOString().split('T')[0],
        paymentMethod: staff.salary.paymentMethod,
        bankAccountMasked: staff.salary.bankDetails.accountNo,
      };
    });

    // Merge
    const nonMonthRecords = existingPayroll.filter((p) => !(p.month === month && p.year === year));
    const merged = [...recordsForMonth, ...nonMonthRecords];
    this.setStorage(HR_STORAGE_KEYS.PAYROLL, merged);
    this.addActivity(actorName, 'Finance Officer', `Generated Monthly Payroll for ${month} ${year}`, 'Payroll', `${recordsForMonth.length} Employees Processed`);
    return merged;
  }

  public updatePayrollStatus(id: string, status: PayrollStatus, actorName = 'Finance Officer'): void {
    const payroll = this.getPayrollRecords();
    const record = payroll.find((p) => p.id === id);
    if (!record) return;

    record.status = status;
    this.setStorage(HR_STORAGE_KEYS.PAYROLL, payroll);
    this.addActivity(actorName, 'Finance Officer', `Updated Payroll status to ${status}`, 'Payroll', `${record.payslipNumber} (${record.staffName})`);
  }

  // --- POSITION KPIS & PERFORMANCE ---
  public getPositionKpis(): PositionKpiConfig[] {
    return this.getStorage<PositionKpiConfig[]>(HR_STORAGE_KEYS.KPIS, initialPositionKpis);
  }

  public savePositionKpiConfig(config: PositionKpiConfig, actorName = 'HR Admin'): void {
    const list = this.getPositionKpis();
    const idx = list.findIndex((k) => k.positionId === config.positionId);
    if (idx !== -1) {
      list[idx] = config;
    } else {
      list.push(config);
    }
    this.setStorage(HR_STORAGE_KEYS.KPIS, list);
    this.addActivity(actorName, 'HR Admin', 'Updated Position KPI Configuration', 'Performance', config.positionName);
  }

  public getStaffPerformance(): StaffPerformanceEvaluation[] {
    return this.getStorage<StaffPerformanceEvaluation[]>(HR_STORAGE_KEYS.PERFORMANCE, initialStaffPerformance);
  }

  public saveStaffPerformance(evalData: Partial<StaffPerformanceEvaluation>, actorName = 'Principal'): StaffPerformanceEvaluation {
    const list = this.getStaffPerformance();
    const count = list.length + 1;
    const newEval: StaffPerformanceEvaluation = {
      id: evalData.id || `PERF-2026-${String(count).padStart(3, '0')}`,
      staffId: evalData.staffId || '',
      staffName: evalData.staffName || '',
      department: evalData.department || 'Academic',
      position: evalData.position || 'Faculty',
      period: evalData.period || 'Q3 2026',
      overallScore: evalData.overallScore || 90,
      rating: evalData.rating || 'Good',
      attendanceScore: evalData.attendanceScore || 95,
      leaveScore: evalData.leaveScore || 90,
      kpiScores: evalData.kpiScores || {},
      managerReview: evalData.managerReview || '',
      selfReview: evalData.selfReview,
      evaluatedBy: actorName,
      evaluatedDate: new Date().toISOString().split('T')[0],
    };

    const existingIdx = list.findIndex((p) => p.id === newEval.id);
    if (existingIdx !== -1) {
      list[existingIdx] = newEval;
    } else {
      list.unshift(newEval);
    }
    this.setStorage(HR_STORAGE_KEYS.PERFORMANCE, list);

    // Update staff overall score
    const staffList = this.getStaff();
    const staff = staffList.find((s) => s.id === newEval.staffId);
    if (staff) {
      staff.overallKpiScore = newEval.overallScore;
      this.setStorage(HR_STORAGE_KEYS.STAFF, staffList);
    }

    this.addActivity(actorName, 'Evaluator', 'Recorded Performance Review', 'Performance', `${newEval.staffName} (${newEval.rating} - ${newEval.overallScore}%)`);
    return newEval;
  }

  // --- HR SETTINGS ---
  public getHrSettings(): HrSettingsConfig {
    const settings = this.getStorage<HrSettingsConfig>(HR_STORAGE_KEYS.SETTINGS, initialHrSettings);
    if (!settings.idCardSettings) {
      settings.idCardSettings = this.getIdCardSettings();
    }
    return settings;
  }

  public saveHrSettings(settings: HrSettingsConfig, actorName = 'Admin'): void {
    if (settings.idCardSettings) {
      this.setStorage(HR_STORAGE_KEYS.ID_CARD_TEMPLATE, settings.idCardSettings);
    }
    this.setStorage(HR_STORAGE_KEYS.SETTINGS, settings);
    this.addActivity(actorName, 'Admin', 'Updated HR Global Settings', 'Settings', 'Organization & Rules');
  }

  // --- ID CARD TEMPLATE SETTINGS ---
  public getIdCardSettings(): IdCardTemplateSettings {
    return this.getStorage<IdCardTemplateSettings>(
      HR_STORAGE_KEYS.ID_CARD_TEMPLATE,
      initialIdCardSettings
    );
  }

  public saveIdCardSettings(settings: IdCardTemplateSettings, actorName = 'Admin'): void {
    this.setStorage(HR_STORAGE_KEYS.ID_CARD_TEMPLATE, settings);
    const hrConfig = this.getHrSettings();
    hrConfig.idCardSettings = settings;
    this.setStorage(HR_STORAGE_KEYS.SETTINGS, hrConfig);
    this.addActivity(actorName, 'Admin', 'Updated Staff ID Card Template & Fields', 'Settings', settings.templateName);
  }

  // --- DEPARTMENT ROLES & GRANULAR PERMISSIONS ---
  public getDepartmentRoles(): DepartmentRole[] {
    return this.getStorage<DepartmentRole[]>(
      HR_STORAGE_KEYS.DEPARTMENT_ROLES,
      initialDepartmentRoles
    );
  }

  public getDepartmentRolesByDepartment(deptCodeOrName: string): DepartmentRole[] {
    const roles = this.getDepartmentRoles();
    const clean = (deptCodeOrName || '').trim().toLowerCase();
    return roles.filter(
      (r) =>
        r.departmentCode.toLowerCase() === clean ||
        r.departmentName.toLowerCase() === clean
    );
  }

  public saveDepartmentRole(roleData: Partial<DepartmentRole>, actorName = 'Admin'): DepartmentRole {
    const roles = this.getDepartmentRoles();
    if (roleData.id) {
      const idx = roles.findIndex((r) => r.id === roleData.id);
      if (idx !== -1) {
        const updated: DepartmentRole = {
          ...roles[idx],
          ...roleData,
          departmentCode: (roleData.departmentCode || roles[idx].departmentCode).trim(),
          departmentName: roleData.departmentName || roles[idx].departmentName,
          roleTitle: roleData.roleTitle || roles[idx].roleTitle,
          accessLevel: roleData.accessLevel || roles[idx].accessLevel,
          capabilities: {
            ...roles[idx].capabilities,
            ...(roleData.capabilities || {}),
          },
        };
        roles[idx] = updated;
        this.setStorage(HR_STORAGE_KEYS.DEPARTMENT_ROLES, roles);
        this.addActivity(
          actorName,
          'HR Admin',
          'Updated Department Role',
          'Settings',
          `${updated.departmentName} (${updated.departmentCode}) - ${updated.roleTitle}`
        );
        return updated;
      }
    }

    const count = roles.length + 1;
    const deptCode = (roleData.departmentCode || '101').trim();
    const newRole: DepartmentRole = {
      id: roleData.id || `ROLE-${deptCode}-${String(count).padStart(2, '0')}`,
      departmentCode: deptCode,
      departmentName: roleData.departmentName || 'Academic',
      roleTitle: roleData.roleTitle || 'New Department Role',
      accessLevel: roleData.accessLevel || 'Operational (Entry & Edit)',
      reportingTo: roleData.reportingTo || 'Department Head',
      description: roleData.description || 'Department specific responsibilities and operational tasks.',
      keyResponsibilities: roleData.keyResponsibilities || [
        'Execute assigned departmental workflows',
        'Maintain accurate logs and reports',
      ],
      capabilities: roleData.capabilities || {
        canApproveLeaves: false,
        canEvaluateInterviews: false,
        canIssueLetters: false,
        canAccessPayroll: false,
        canReviewKpi: false,
        canApproveRequisitions: false,
      },
      headcount: roleData.headcount || 1,
      menuPermissions: roleData.menuPermissions,
    };

    roles.push(newRole);
    this.setStorage(HR_STORAGE_KEYS.DEPARTMENT_ROLES, roles);
    this.addActivity(
      actorName,
      'HR Admin',
      'Created Department Role',
      'Settings',
      `${newRole.departmentName} (${newRole.departmentCode}) - ${newRole.roleTitle}`
    );
    return newRole;
  }

  public deleteDepartmentRole(id: string, actorName = 'Admin'): boolean {
    const roles = this.getDepartmentRoles();
    const target = roles.find((r) => r.id === id);
    if (!target) return false;

    const filtered = roles.filter((r) => r.id !== id);
    this.setStorage(HR_STORAGE_KEYS.DEPARTMENT_ROLES, filtered);
    this.addActivity(
      actorName,
      'HR Admin',
      'Deleted Department Role',
      'Settings',
      `${target.departmentName} - ${target.roleTitle}`
    );
    return true;
  }

  public getDepartmentRolePermissions(
    departmentCode: string,
    roleId: string
  ): Record<string, RoleMenuPermission> {
    const settings = this.getHrSettings();
    const cleanDept = (departmentCode || '').trim();
    
    // Check hrSettings departmentRolePermissions mapping
    if (settings.departmentRolePermissions?.[cleanDept]?.[roleId]) {
      return settings.departmentRolePermissions[cleanDept][roleId];
    }

    // Check directly in the stored role object
    const roles = this.getDepartmentRoles();
    const role = roles.find((r) => r.id === roleId);
    if (role?.menuPermissions && Object.keys(role.menuPermissions).length > 0) {
      return role.menuPermissions;
    }

    // Fallback to rolePermissions from settings or default
    return settings.rolePermissions || {};
  }

  public saveDepartmentRolePermissions(
    departmentCode: string,
    roleId: string,
    permissions: Record<string, RoleMenuPermission>,
    actorName = 'Admin'
  ): void {
    const cleanDept = (departmentCode || '').trim();

    // 1. Update in HrSettingsConfig
    const settings = this.getHrSettings();
    if (!settings.departmentRolePermissions) {
      settings.departmentRolePermissions = {};
    }
    if (!settings.departmentRolePermissions[cleanDept]) {
      settings.departmentRolePermissions[cleanDept] = {};
    }
    settings.departmentRolePermissions[cleanDept][roleId] = permissions;
    this.setStorage(HR_STORAGE_KEYS.SETTINGS, settings);

    // 2. Also update in the DepartmentRole object in DEPARTMENT_ROLES
    const roles = this.getDepartmentRoles();
    const role = roles.find((r) => r.id === roleId);
    if (role) {
      role.menuPermissions = permissions;
      this.setStorage(HR_STORAGE_KEYS.DEPARTMENT_ROLES, roles);
    }

    this.addActivity(
      actorName,
      'HR Admin',
      'Updated Granular Permissions for Department Role',
      'Settings',
      `Dept ${cleanDept} - Role ${role?.roleTitle || roleId}`
    );
  }

  public getAllDepartmentRolePermissions(): Record<string, Record<string, Record<string, RoleMenuPermission>>> {
    const settings = this.getHrSettings();
    return settings.departmentRolePermissions || {};
  }

  // --- RESET TO DEMO ---
  public resetHrData(): void {
    localStorage.removeItem(HR_STORAGE_KEYS.POSITIONS);
    localStorage.removeItem(HR_STORAGE_KEYS.APPLICANTS);
    localStorage.removeItem(HR_STORAGE_KEYS.INTERVIEWS);
    localStorage.removeItem(HR_STORAGE_KEYS.OFFER_LETTERS);
    localStorage.removeItem(HR_STORAGE_KEYS.APPOINTMENT_LETTERS);
    localStorage.removeItem(HR_STORAGE_KEYS.STAFF);
    localStorage.removeItem(HR_STORAGE_KEYS.DEPARTMENTS);
    localStorage.removeItem(HR_STORAGE_KEYS.BRANCHES);
    localStorage.removeItem(HR_STORAGE_KEYS.DEPARTMENT_ROLES);
    localStorage.removeItem(HR_STORAGE_KEYS.ATTENDANCE);
    localStorage.removeItem(HR_STORAGE_KEYS.LEAVE_REQUESTS);
    localStorage.removeItem(HR_STORAGE_KEYS.LEAVE_BALANCES);
    localStorage.removeItem(HR_STORAGE_KEYS.PAYROLL);
    localStorage.removeItem(HR_STORAGE_KEYS.KPIS);
    localStorage.removeItem(HR_STORAGE_KEYS.PERFORMANCE);
    localStorage.removeItem(HR_STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(HR_STORAGE_KEYS.LOGS);
    localStorage.removeItem(HR_STORAGE_KEYS.ID_CARD_TEMPLATE);
  }
}

export const hrStorage = new HrStorageService();
