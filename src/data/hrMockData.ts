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
  DepartmentMaster,
  DepartmentRole,
  IdCardTemplateSettings,
} from '../types/hr';

export const initialPositions: Position[] = [];

export const initialApplicants: Applicant[] = [];

export const initialInterviews: Interview[] = [];

export const initialOfferLetters: OfferLetter[] = [];

export const initialAppointmentLetters: AppointmentLetter[] = [];

export const initialDepartmentsMaster: DepartmentMaster[] = [];

export const initialStaffMembers: StaffMember[] = [];

export const initialAttendanceRecords: DailyAttendanceRecord[] = [];

export const initialLeaveRequests: LeaveRequest[] = [];

export const initialLeaveBalances: LeaveBalance[] = [];

export const initialMonthlyPayroll: MonthlyPayrollRecord[] = [];

export const initialPositionKpis: PositionKpiConfig[] = [];

export const initialStaffPerformance: StaffPerformanceEvaluation[] = [];

export const initialIdCardSettings: IdCardTemplateSettings = {
  templateName: 'Casbiro Executive Emerald',
  orientation: 'portrait',
  useFullBackgroundArtwork: false,
  headerBgColor: '#0B5D2A',
  headerTextColor: '#FFFFFF',
  accentColor: '#168A45',
  institutionName: 'CASBIRO SOLUTIONS PVT LTD',
  institutionSubtitle: 'Corporate Operations & Staff Management',
  cardCornerRadius: 16,
  photoShape: 'circle',
  photoBorderColor: '#168A45',
  photoBorderWidth: 3,
  photoSize: 84,
  authorizedSignatoryTitle: 'Authorized Signatory',
  backTermsAndConditions:
    '1. This card is the official property of Casbiro Solutions Pvt Ltd.\n2. The cardholder must wear this card visibly while on office premises.\n3. If found, please return to Casbiro HR or nearest security desk.\n4. Non-transferable and subject to corporate code of conduct.',
  backReturnAddress: 'Casbiro Corporate HQ, Infopark Phase II, Kochi, Kerala 682042',
  backEmergencyHelpline: '+91 98470 55667 / hr@casbiro.com',
  fields: [
    {
      id: 'photo',
      label: 'Staff Photo',
      type: 'photo',
      visible: true,
      x: 50,
      y: 22,
      shape: 'circle',
      borderWidth: 3,
      borderColor: '#168A45',
    },
    {
      id: 'fullName',
      label: 'Full Name',
      type: 'text',
      visible: true,
      x: 50,
      y: 43,
      fontSize: 15,
      fontWeight: 'bold',
      color: '#0F172A',
      textAlign: 'center',
    },
    {
      id: 'position',
      label: 'Designation / Position',
      type: 'text',
      visible: true,
      x: 50,
      y: 48,
      fontSize: 12,
      fontWeight: 'semibold',
      color: '#168A45',
      textAlign: 'center',
    },
    {
      id: 'department',
      label: 'Department',
      type: 'text',
      visible: true,
      x: 50,
      y: 53,
      fontSize: 11,
      fontWeight: 'medium',
      color: '#475569',
      textAlign: 'center',
    },
    {
      id: 'staffId',
      label: 'Employee ID',
      type: 'text',
      visible: true,
      x: 50,
      y: 60,
      fontSize: 13,
      fontWeight: 'bold',
      color: '#0B5D2A',
      textAlign: 'center',
      showLabel: true,
      customPrefix: 'ID: ',
    },
    {
      id: 'bloodGroup',
      label: 'Blood Group',
      type: 'text',
      visible: true,
      x: 25,
      y: 68,
      fontSize: 11,
      fontWeight: 'semibold',
      color: '#B91C1C',
      textAlign: 'left',
      showLabel: true,
      customPrefix: 'Blood: ',
    },
    {
      id: 'emergencyPhone',
      label: 'Emergency Contact',
      type: 'text',
      visible: true,
      x: 75,
      y: 68,
      fontSize: 11,
      fontWeight: 'semibold',
      color: '#1E293B',
      textAlign: 'right',
      showLabel: true,
      customPrefix: 'Emerg: ',
    },
    {
      id: 'validUntil',
      label: 'Valid Until',
      type: 'text',
      visible: true,
      x: 50,
      y: 74,
      fontSize: 10,
      fontWeight: 'medium',
      color: '#64748B',
      textAlign: 'center',
      showLabel: true,
      customPrefix: 'Valid Upto: ',
    },
    {
      id: 'qrCode',
      label: 'QR Code (Digital Auth)',
      type: 'qrcode',
      visible: true,
      x: 50,
      y: 85,
      width: 44,
      height: 44,
    },
    {
      id: 'signature',
      label: 'Authorized Signatory',
      type: 'signature',
      visible: true,
      x: 82,
      y: 88,
      fontSize: 9,
      fontWeight: 'semibold',
      color: '#475569',
      textAlign: 'center',
    },
    {
      id: 'joiningDate',
      label: 'Date of Joining',
      type: 'text',
      visible: false,
      x: 50,
      y: 77,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#64748B',
      textAlign: 'center',
      showLabel: true,
      customPrefix: 'Joined: ',
    },
    {
      id: 'barcode',
      label: 'Gate Barcode',
      type: 'barcode',
      visible: false,
      x: 50,
      y: 93,
      width: 140,
      height: 24,
    },
  ],
};

export const initialHrSettings: HrSettingsConfig = {
  divisions: [],
  departments: [],
  positionCategories: [
    'Executive Leadership',
    'Operations & Delivery',
    'Technical / IT',
    'Finance & Accounts',
    'Administrative Staff',
    'Support Staff',
  ],
  workingHours: {
    officeStartTime: '08:30 AM',
    officeEndTime: '04:30 PM',
    gracePeriodMinutes: 15,
    minimumWorkingHours: 8,
    halfDayHours: 4,
    attendanceLocations: [],
  },
  weeklyOff: {
    primaryDay: 'Sunday',
    alternateDay: 'Second Saturday',
    customOffType: 'Sunday & 2nd Saturday Off',
  },
  annualLeaveQuotas: {
    casualLeave: 12,
    sickLeave: 10,
    annualLeave: 15,
    emergencyLeave: 5,
    maternityLeaveDays: 180,
    maxCarryForward: 10,
  },
  payrollSettings: {
    payrollCycleDay: 30,
    pfRatePercent: 12,
    esiRatePercent: 0.75,
    standardHraPercent: 40,
  },
  idCardSettings: initialIdCardSettings,
};

export const initialHrActivityLogs: HrActivityLog[] = [];

export const initialDepartmentRoles: DepartmentRole[] = [];
