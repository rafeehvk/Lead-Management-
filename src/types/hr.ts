export type EmploymentType =
  | 'Full Time'
  | 'Part Time'
  | 'Contract'
  | 'Temporary'
  | 'Intern';

export type EmploymentStatus =
  | 'Active'
  | 'Probation'
  | 'On Leave'
  | 'Resigned'
  | 'Terminated'
  | 'Retired'
  | 'Inactive';

export type PositionStatus = 'Draft' | 'Open' | 'Interviewing' | 'Filled' | 'Closed';

export interface Position {
  id: string; // e.g. "POS-2026-001"
  name: string;
  code: string;
  division: string;
  department: string;
  vacancies: number;
  filled: number;
  remainingVacancies: number;
  employmentType: EmploymentType;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  experienceRequired: string;
  skills: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  jobLocation: string;
  closingDate: string; // YYYY-MM-DD
  status: PositionStatus;
  createdDate: string;
}

export type RecruitmentStage =
  | 'Applied'
  | 'Shortlisted'
  | 'Interview Scheduled'
  | 'Interviewed'
  | 'Selected'
  | 'Offer Sent'
  | 'Offer Accepted'
  | 'Appointment'
  | 'Joined'
  | 'Rejected';

export type ApplicantStage = RecruitmentStage;

export interface Applicant {
  id: string; // e.g. "APP-2026-001"
  name: string;
  positionId: string;
  positionName: string;
  department: string;
  phone: string;
  email: string;
  experience: number; // in years
  currentCompanyOrSchool?: string;
  highestQualification: string;
  skills: string[];
  applicationDate: string;
  stage: RecruitmentStage;
  interviewStatus: 'Not Scheduled' | 'Scheduled' | 'Completed' | 'Passed' | 'Failed';
  overallRating: number; // 1 to 5
  status: 'Active' | 'Rejected' | 'Joined';
  notes?: string;
  expectedSalary?: number;
  noticePeriod?: string;
  offerLetterId?: string;
  appointmentLetterId?: string;
  staffId?: string;
}

export type InterviewRound =
  | 'Round 1 - Screening'
  | 'Round 2 - Technical / Demo Class'
  | 'Round 3 - Principal / Final Panel';

export type InterviewType = 'Online' | 'Offline';

export interface InterviewEvaluation {
  communication: number; // 1-5
  technicalKnowledge: number; // 1-5
  subjectKnowledge: number; // 1-5
  experience: number; // 1-5
  problemSolving: number; // 1-5
  leadership: number; // 1-5
  teamwork: number; // 1-5
  overallPerformance: number; // calculated 1-5
  strengths: string;
  weaknesses: string;
  notes: string;
  recommendation: 'Strongly Recommend' | 'Recommend' | 'Hold' | 'Reject';
  finalDecision: 'Selected' | 'Rejected' | 'Further Interview Required';
  evaluatedBy: string;
  evaluatedDate: string;
}

export interface Interview {
  id: string; // e.g. "INT-2026-001"
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  positionId: string;
  positionName: string;
  department: string;
  round: InterviewRound | string;
  type: InterviewType;
  date: string; // YYYY-MM-DD
  startTime: string; // "10:30 AM"
  endTime: string; // "11:30 AM"
  locationOrLink: string;
  panelMembers: string[];
  notes?: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  evaluation?: InterviewEvaluation;
}

export type OfferStatus = 'Draft' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired';

export interface OfferLetter {
  id: string; // e.g. "OFFER-2026-001"
  offerNumber: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  position: string;
  department: string;
  joiningDate: string;
  employmentType: EmploymentType;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  workingHours: string;
  benefits: string[];
  termsAndConditions: string;
  expiryDate: string;
  issueDate: string;
  status: OfferStatus;
  notes?: string;
}

export type AppointmentStatus = 'Draft' | 'Generated' | 'Sent' | 'Signed' | 'Completed';

export interface AppointmentLetter {
  id: string; // e.g. "APPT-2026-001"
  appointmentNumber: string;
  applicantId: string;
  employeeName: string;
  employeeId: string; // Assigned or proposed
  position: string;
  department: string;
  division: string;
  joiningDate: string;
  employmentType: EmploymentType;
  basicSalary: number;
  allowances: number;
  grossSalary: number;
  probationPeriod: string;
  workingHours: string;
  workplace: string;
  responsibilities: string[];
  termsAndConditions: string;
  issueDate: string;
  status: AppointmentStatus;
}

export type DocumentCategory =
  | 'ID Proof'
  | 'Address Proof'
  | 'Educational Certificate'
  | 'Experience Certificate'
  | 'Passport Photo'
  | 'Resume'
  | 'Offer Letter'
  | 'Appointment Letter'
  | 'Other Documents';

export interface StaffDocument {
  id: string;
  category: DocumentCategory;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  fileName: string;
  fileSize?: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  uploadDate: string;
}

export interface StaffSalaryDetails {
  basicSalary: number;
  hra: number;
  allowances: number;
  specialAllowance: number;
  bonus: number;
  otherEarnings: number;
  grossSalary: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  salaryFrequency: 'Monthly';
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash';
  bankDetails: {
    bankName: string;
    accountNo: string;
    ifscCode: string;
    branch: string;
  };
}

export interface StaffExperienceRecord {
  id: string;
  organization: string;
  designation: string;
  department: string;
  employmentType: string;
  dateOfJoining: string;
  dateOfLeaving: string;
  totalExperience: string;
  reasonForLeaving: string;
  certificateDoc?: string;
  remarks?: string;
}

export interface StaffQualificationRecord {
  id: string;
  level:
    | 'SSLC / 10th'
    | 'Plus Two / 12th'
    | 'Diploma'
    | 'Undergraduate'
    | 'Postgraduate'
    | 'M.Phil'
    | 'Ph.D.'
    | 'Other';
  courseName: string;
  specialization: string;
  institution: string;
  yearOfPassing: string;
  grade: string;
  certificateDoc?: string;
  remarks?: string;
}

export interface StaffFamilyContact {
  id: string;
  name: string;
  relationship: string;
  dateOfBirth?: string;
  contactNumber: string;
  whatsappNumber?: string;
  email?: string;
  occupation?: string;
  address?: string;
  isEmergencyContact: boolean;
  isDependent: boolean;
}

export interface StaffBankPayroll {
  bankName: string;
  accountHolderName: string;
  accountNo: string;
  ifscCode: string;
  branch: string;
  uan?: string;
  pfNumber?: string;
  esiNumber?: string;
  salaryStructure?: string;
}

export interface StaffSystemAccess {
  enableLogin: boolean;
  username: string;
  role: string;
  accessLevel: 'Read-Only' | 'Standard' | 'Manager' | 'Administrator' | 'Super Admin';
  assignedModules: string[];
  branchAccess: string;
  accountStatus: 'Active' | 'Pending' | 'Suspended';
}

export interface StaffVerificationDetails {
  registrationDate: string;
  registeredBy: string;
  verificationStatus: 'Pending' | 'Verified' | 'Under Review' | 'Rejected';
  verifiedBy?: string;
  verificationDate?: string;
  remarks?: string;
}

export interface StaffMember {
  id: string; // e.g. "EMP-2026-001"
  staffId?: string;
  profilePhoto?: string;
  fullName: string;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup?: string;
  nationality?: string;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  email: string;
  personalEmail?: string;
  contactNumber: string;
  whatsappNumber: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  permanentAddress: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district?: string;
    state: string;
    country: string;
    pinCode: string;
  };
  communicationAddress: {
    sameAsPermanent: boolean;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    district?: string;
    state: string;
    country: string;
    pinCode: string;
  };
  joiningDate: string;
  division: string;
  department: string;
  position: string;
  employeeCategory?: 'Administrator' | 'Manager' | 'Accountant' | 'CSR' | 'Marketing' | 'Sales' | 'Other';
  employmentType: EmploymentType;
  branchLocation?: string;
  reportingManager: string;
  workLocation: string;
  previousEmployeeId?: string;
  probationPeriod: string;
  employmentStatus: EmploymentStatus;
  documents: StaffDocument[];
  salary: StaffSalaryDetails;
  todayAttendanceStatus?: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave' | 'Not Marked';
  overallKpiScore?: number; // percentage e.g. 91
  notes?: string;
  createdDate: string;
  updatedDate: string;

  // Additional 10-section fields
  experiences?: StaffExperienceRecord[];
  qualifications?: StaffQualificationRecord[];
  familyMembers?: StaffFamilyContact[];
  bankPayroll?: StaffBankPayroll;
  systemAccess?: StaffSystemAccess;
  verification?: StaffVerificationDetails;
  aadhaarNumber?: string;
  aadhaarDoc?: string;
  panNumber?: string;
  panDoc?: string;
  resumeDoc?: string;
  joiningDocs?: string;
  otherDocs?: string;
}

export interface StaffOnboardingTask {
  id: string;
  staffId?: string;
  title: string;
  category: 'Documentation' | 'IT Setup' | 'Compliance' | 'Induction' | 'Training';
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  assignedTo?: string;
}

export type AttendanceStatus =
  | 'Present'
  | 'Absent'
  | 'Late'
  | 'Half Day'
  | 'Leave'
  | 'Not Marked';

export interface DailyAttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  position: string;
  date: string; // YYYY-MM-DD
  checkIn?: string;
  checkOut?: string;
  workingHours?: number;
  status: AttendanceStatus;
  remarks?: string;
}

export type LeaveType =
  | 'Annual Leave'
  | 'Casual Leave'
  | 'Sick Leave'
  | 'Emergency Leave'
  | 'Maternity Leave'
  | 'Unpaid Leave'
  | 'Other';

export type LeaveRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Modified';

export interface LeaveRequest {
  id: string; // e.g. "LR-2026-001"
  staffId: string;
  staffName: string;
  department: string;
  position: string;
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  numberOfDays: number;
  reason: string;
  attachmentName?: string;
  substituteStaff?: string;
  remarks?: string;
  status: LeaveRequestStatus;
  appliedDate: string;
  approvedBy?: string;
  actionDate?: string;
}

export interface LeaveBalance {
  staffId: string;
  staffName: string;
  annualTotal: number;
  annualUsed: number;
  casualTotal: number;
  casualUsed: number;
  sickTotal: number;
  sickUsed: number;
  emergencyTotal: number;
  emergencyUsed: number;
}

export type PayrollStatus = 'Draft' | 'Processing' | 'Processed' | 'Approved' | 'Paid';

export interface MonthlyPayrollRecord {
  id: string; // e.g. "PAY-2026-09-001"
  month: string; // "September"
  year: number; // 2026
  staffId: string;
  staffName: string;
  department: string;
  position: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  overtime: number;
  bonus: number;
  grossSalary: number;
  leaveDeductions: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: PayrollStatus;
  payslipNumber: string;
  processedDate?: string;
  paymentMethod: string;
  bankAccountMasked: string;
}

export interface KpiMetricItem {
  id: string;
  name: string;
  weightage: number; // e.g. 25
  targetMetric: string;
  description: string;
}

export interface PositionKpiItem {
  id: string;
  name: string;
  description: string;
  weightage: number; // e.g. 20 (percent)
  measurementType?: 'Rating (1-5)' | 'Percentage' | 'Score (0-100)';
  target?: string;
  minScore?: number;
  maxScore?: number;
  evaluationFrequency?: 'Monthly' | 'Quarterly' | 'Annual';
  isActive?: boolean;
}

export interface PositionKpiConfig {
  positionId: string;
  positionName: string;
  department: string;
  kpis?: PositionKpiItem[];
  metrics?: KpiMetricItem[];
  totalWeightage?: number;
  reviewFrequency?: string;
}

export type PerformanceRatingLevel =
  | 'Outstanding'
  | 'Excellent'
  | 'Good'
  | 'Needs Improvement'
  | 'Unsatisfactory';

export interface StaffPerformanceEvaluation {
  id: string;
  staffId: string;
  staffName: string;
  department: string;
  position: string;
  period: string; // e.g. "Q3 2026" or "Annual 2026"
  overallScore: number; // e.g. 92 (out of 100)
  rating: PerformanceRatingLevel;
  attendanceScore: number;
  leaveScore: number;
  kpiScores: { [kpiId: string]: number };
  managerReview: string;
  selfReview?: string;
  evaluatedBy: string;
  evaluatedDate: string;
}

export interface HrSettingsConfig {
  divisions: string[];
  departments: string[];
  positionCategories: string[];
  workingHours: {
    officeStartTime: string; // e.g. "08:30 AM"
    officeEndTime: string; // e.g. "04:30 PM"
    gracePeriodMinutes: number; // e.g. 15
    minimumWorkingHours: number; // e.g. 8
    halfDayHours: number; // e.g. 4
    attendanceLocations: string[];
  };
  weeklyOff: {
    primaryDay: string; // e.g. "Sunday"
    alternateDay?: string; // e.g. "Second Saturday"
    customOffType: string;
  };
  annualLeaveQuotas: {
    casualLeave: number;
    sickLeave: number;
    annualLeave: number;
    emergencyLeave: number;
    maternityLeaveDays: number;
    maxCarryForward: number;
  };
  payrollSettings: {
    payrollCycleDay: number; // e.g. 30
    pfRatePercent: number; // e.g. 12
    esiRatePercent: number; // e.g. 0.75
    standardHraPercent: number; // e.g. 40
  };
}

export interface HrActivityLog {
  id: string;
  user: string;
  role: string;
  action: string;
  module: 'Recruitment' | 'Staff' | 'Attendance' | 'Leave' | 'Payroll' | 'Performance' | 'Settings';
  record: string;
  timestamp: string;
  details?: string;
}
