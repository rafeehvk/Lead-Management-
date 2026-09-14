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
  IdCardTemplateSettings,
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
  public getOfferLetters(): OfferLetter[] {
    return this.getStorage<OfferLetter[]>(HR_STORAGE_KEYS.OFFER_LETTERS, initialOfferLetters);
  }

  public generateOfferLetter(data: Partial<OfferLetter>, actorName = 'Admin'): OfferLetter {
    const offers = this.getOfferLetters();
    const count = offers.length + 1;
    const basic = data.basicSalary || 30000;
    const allowances = data.allowances || 15000;
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
      allowanceItems: data.allowanceItems,
      grossSalary: basic + allowances,
      workingHours: data.workingHours || '8:15 AM – 4:00 PM (Monday to Friday)',
      benefits: data.benefits || ['EPF & Gratuity', 'Medical Coverage', 'Performance Bonus'],
      termsAndConditions: data.termsAndConditions || 'Subject to document verification and 6-month probation period.',
      expiryDate: data.expiryDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      issueDate: new Date().toISOString().split('T')[0],
      status: 'Sent',
    };

    offers.unshift(newOffer);
    this.setStorage(HR_STORAGE_KEYS.OFFER_LETTERS, offers);

    // Link with applicant
    if (newOffer.applicantId) {
      const apps = this.getApplicants();
      const app = apps.find((a) => a.id === newOffer.applicantId);
      if (app) {
        app.offerLetterId = newOffer.id;
        app.stage = 'Offer Sent';
        this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
      }
    }

    this.addActivity(actorName, 'HR Admin', 'Generated Offer Letter', 'Recruitment', `${newOffer.offerNumber} for ${newOffer.applicantName}`);
    return newOffer;
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
    const appts = this.getAppointmentLetters();
    const count = appts.length + 1;
    const basic = data.basicSalary || 30000;
    const allowances = data.allowances || 15000;
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
      allowanceItems: data.allowanceItems,
      grossSalary: basic + allowances,
      probationPeriod: data.probationPeriod || '6 Months',
      workingHours: data.workingHours || '8:15 AM – 4:00 PM',
      workplace: data.workplace || 'Kochi Campus',
      responsibilities: data.responsibilities || ['Fulfill institutional duties and classroom mentorship.'],
      termsAndConditions: data.termsAndConditions || 'Formal appointment subject to institutional service rules.',
      issueDate: new Date().toISOString().split('T')[0],
      status: 'Generated',
    };

    appts.unshift(newAppt);
    this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);

    // Update applicant stage
    if (newAppt.applicantId) {
      const apps = this.getApplicants();
      const app = apps.find((a) => a.id === newAppt.applicantId);
      if (app) {
        app.appointmentLetterId = newAppt.id;
        app.stage = 'Appointment';
        this.setStorage(HR_STORAGE_KEYS.APPLICANTS, apps);
      }
    }

    this.addActivity(actorName, 'HR Admin', 'Generated Appointment Letter', 'Recruitment', `${newAppt.appointmentNumber} for ${newAppt.employeeName}`);
    return newAppt;
  }

  public updateAppointmentStatus(id: string, status: AppointmentStatus, actorName = 'Admin'): void {
    const appts = this.getAppointmentLetters();
    const appt = appts.find((a) => a.id === id);
    if (!appt) return;

    appt.status = status;
    this.setStorage(HR_STORAGE_KEYS.APPOINTMENT_LETTERS, appts);
    this.addActivity(actorName, 'HR Admin', `Updated Appointment Letter status to ${status}`, 'Recruitment', appt.appointmentNumber);
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

    const basic = appt?.basicSalary || offer?.basicSalary || 30000;
    const allowances = appt?.allowances || offer?.allowances || 15000;
    const hra = Math.round(basic * 0.4);
    const gross = basic + allowances;
    const pf = 1800;
    const tax = gross > 50000 ? Math.round(gross * 0.05) : 0;
    const totalDeductions = pf + tax;
    const net = gross - totalDeductions;

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
        allowances: allowances - hra > 0 ? allowances - hra : 5000,
        allowanceItems: appt?.allowanceItems || offer?.allowanceItems || [
          { id: 'all-room', name: 'Room Allowance', amount: 3000 },
          { id: 'all-trans', name: 'Transportation', amount: 2000 },
          { id: 'all-ot', name: 'Over time', amount: 1000 },
        ],
        specialAllowance: 2000,
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
    return this.getStorage<DepartmentMaster[]>(HR_STORAGE_KEYS.DEPARTMENTS, initialDepartmentsMaster);
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
          status: isStaffActive ? 'Active' : 'Inactive',
          avatar: staff.profilePhoto || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          staffId: sId,
          department: staff.department,
          departmentCode: staff.departmentCode,
        };
        users.push(newUser);
      }

      localStorage.setItem('mysar_users_data_v1', JSON.stringify(users));
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

  // --- RESET TO DEMO ---
  public resetHrData(): void {
    localStorage.removeItem(HR_STORAGE_KEYS.POSITIONS);
    localStorage.removeItem(HR_STORAGE_KEYS.APPLICANTS);
    localStorage.removeItem(HR_STORAGE_KEYS.INTERVIEWS);
    localStorage.removeItem(HR_STORAGE_KEYS.OFFER_LETTERS);
    localStorage.removeItem(HR_STORAGE_KEYS.APPOINTMENT_LETTERS);
    localStorage.removeItem(HR_STORAGE_KEYS.STAFF);
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
