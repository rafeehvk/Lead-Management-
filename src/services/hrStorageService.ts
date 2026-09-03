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
} from '../types/hr';
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
} from '../data/hrMockData';

const HR_STORAGE_KEYS = {
  POSITIONS: 'mysar_hr_positions_v1',
  APPLICANTS: 'mysar_hr_applicants_v1',
  INTERVIEWS: 'mysar_hr_interviews_v1',
  OFFER_LETTERS: 'mysar_hr_offer_letters_v1',
  APPOINTMENT_LETTERS: 'mysar_hr_appointment_letters_v1',
  STAFF: 'mysar_hr_staff_v1',
  ATTENDANCE: 'mysar_hr_attendance_v1',
  LEAVE_REQUESTS: 'mysar_hr_leave_requests_v1',
  LEAVE_BALANCES: 'mysar_hr_leave_balances_v1',
  PAYROLL: 'mysar_hr_payroll_v1',
  KPIS: 'mysar_hr_kpis_v1',
  PERFORMANCE: 'mysar_hr_performance_v1',
  SETTINGS: 'mysar_hr_settings_v1',
  LOGS: 'mysar_hr_activity_logs_v1',
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
    const newStaffId = appt?.employeeId || `EMP-2026-${String(staffList.length + 1).padStart(3, '0')}`;

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

  // --- STAFF MANAGEMENT ---
  public getStaff(): StaffMember[] {
    return this.getStorage<StaffMember[]>(HR_STORAGE_KEYS.STAFF, initialStaffMembers);
  }

  public saveStaff(staffData: Partial<StaffMember>, actorName = 'Admin'): StaffMember {
    const staffList = this.getStaff();
    if (staffData.id) {
      const idx = staffList.findIndex((s) => s.id === staffData.id);
      if (idx !== -1) {
        const updated: StaffMember = {
          ...staffList[idx],
          ...staffData,
          updatedDate: new Date().toISOString().split('T')[0],
        };
        staffList[idx] = updated;
        this.setStorage(HR_STORAGE_KEYS.STAFF, staffList);
        this.addActivity(actorName, 'HR Admin', 'Updated Staff Record', 'Staff', `${updated.id} - ${updated.fullName}`);
        return updated;
      }
    }

    const count = staffList.length + 1;
    const newId = staffData.id || `EMP-2026-${String(count).padStart(3, '0')}`;
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
    return newStaff;
  }

  public deleteStaff(id: string, actorName = 'Admin'): void {
    const list = this.getStaff().filter((s) => s.id !== id);
    this.setStorage(HR_STORAGE_KEYS.STAFF, list);
    this.addActivity(actorName, 'HR Admin', 'Removed Staff Member', 'Staff', id);
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
      const bal = balances.find((b) => b.staffId === req.staffId);
      if (bal) {
        if (req.leaveType === 'Casual Leave') bal.casualUsed += req.numberOfDays;
        else if (req.leaveType === 'Sick Leave') bal.sickUsed += req.numberOfDays;
        else if (req.leaveType === 'Annual Leave') bal.annualUsed += req.numberOfDays;
        else if (req.leaveType === 'Emergency Leave') bal.emergencyUsed += req.numberOfDays;
        this.setStorage(HR_STORAGE_KEYS.LEAVE_BALANCES, balances);
      }
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
    return this.getStorage<HrSettingsConfig>(HR_STORAGE_KEYS.SETTINGS, initialHrSettings);
  }

  public saveHrSettings(settings: HrSettingsConfig, actorName = 'Admin'): void {
    this.setStorage(HR_STORAGE_KEYS.SETTINGS, settings);
    this.addActivity(actorName, 'Admin', 'Updated HR Global Settings', 'Settings', 'Organization & Rules');
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
  }
}

export const hrStorage = new HrStorageService();
