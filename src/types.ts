export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Follow-up'
  | 'Qualified'
  | 'Demo Scheduled'
  | 'Demo Completed'
  | 'Send Proposal'
  | 'Proposal Sent'
  | 'Negotiation'
  | 'Won'
  | 'Lost'
  | 'On Hold';

export type LeadPriority = 'High' | 'Medium' | 'Low';

export type ActivityType =
  | 'change'
  | 'email'
  | 'followup'
  | 'proposal'
  | 'note'
  | 'system';

export interface LeadActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  title: string;
  description: string;
  actor: string;
  actorRole?: string;
  timestamp: string;
  metadata?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    emailTo?: string;
    emailSubject?: string;
    followUpType?: FollowUpType;
    proposalNumber?: string;
    proposalAmount?: number;
    statusBadge?: string;
    version?: number;
  };
}

export type PricingType =
  | 'School Premium'
  | 'School Premium with ID'
  | 'Parent Premium'
  | 'Special Price'
  | 'Introduction Trial Price'
  | string;

export interface PricingPlan {
  id: string; // e.g. "PLAN-001"
  name: string; // e.g. "School Premium"
  code: string; // e.g. "SCH-PREM"
  defaultPrice: number; // e.g. 80 (₹ per student)
  billingCycle: string; // "Per Student / Year" | "Per Student / Term" | "One-Time"
  description: string; // Scope / deliverables summary
  features: string[]; // List of included module features
  isActive: boolean; // Status toggle
  isPreset?: boolean; // Whether included in the 3-Tier comparison preset
  minStudents?: number; // Minimum student batch size
  sortOrder?: number;
  createdDate?: string;
  updatedDate?: string;
}

export interface Lead {
  id: string; // e.g. "LEAD-2026-001"
  leadDate: string; // YYYY-MM-DD
  instituteName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  address: string;
  studentCount: number;
  leadSource: string; // "Website", "Referral", "Cold Call", "Exhibition", "Social Media", "Field Visit"
  assignedTo: string;
  priority: LeadPriority;
  status: LeadStatus;
  followUpDate: string; // YYYY-MM-DD
  remarks: string;
  createdBy: string;
  createdDate: string;
  updatedDate: string;
}

export type ProposalStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Negotiating';

export interface ProposalAgreementDetails {
  agreementPeriod: string; // e.g. "5 Years"
  registrationFee: number; // e.g. 30000
  trialPrice: number; // e.g. 30 (per student)
  trialAcademicYear: string; // e.g. "2026–2027 Academic Year"
  planChosen: string; // e.g. "Institute Payment" or "School Premium with ID"
  hasSpecialPrice?: boolean;
  specialPrice?: number; // e.g. 65
  specialPriceLabel?: string; // e.g. "Institute Subscription (Special Price)"
  agreementClause?: string;
  acceptanceClause?: string;
  paymentSchedule?: string[];
  paymentTerms: string[];
  clientAuthorizedPerson?: string;
  clientDesignation?: string;
  companyAuthorizedPerson?: string;
  companyDesignation?: string;
}

export interface ProposalPricingItem {
  id: string;
  pricingType: PricingType | string;
  pricePerStudent: number;
  studentCount?: number;
  totalAmount: number;
  description?: string;
  isPrimary?: boolean;
}

export interface ProposalVersionEntry {
  version: number;
  updatedAt: string;
  updatedBy: string;
  pricingType?: PricingType;
  pricePerStudent?: number;
  studentCount?: number;
  totalAmount?: number;
  changesSummary?: string;
  notes?: string;
}

export type PaymentStageKey = 'registration' | 'onboarding' | 'two_months';
export type PaymentStageStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';
export type OverallPaymentStatus = 'Unpaid' | 'Partially Paid' | 'Fully Paid' | 'Overdue';

export interface PaymentTransactionRecord {
  id: string;
  stageKey: PaymentStageKey;
  amount: number;
  paidDate: string;
  paymentMode: string; // 'Bank Transfer' | 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'Cash'
  referenceNumber?: string;
  receiptNumber?: string;
  recordedBy?: string;
  notes?: string;
}

export interface ProposalPaymentStage {
  stageKey: PaymentStageKey;
  stageName: string; // "Registration", "Onboarding", "2-Month Mark"
  title: string; // "Stage 1: Registration Fee", "Stage 2: Student Onboarding (60%)", "Stage 3: 2-Month Mark (40%)"
  description: string;
  percentage?: number; // 60, 40 or undefined for fixed
  targetAmount: number;
  paidAmount: number;
  status: PaymentStageStatus;
  dueDate?: string;
  paidDate?: string;
  paymentMode?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ProposalPaymentTracking {
  totalAgreedAmount: number;
  totalPaidAmount: number;
  balanceAmount: number;
  overallPaymentStatus: OverallPaymentStatus;
  stages: ProposalPaymentStage[];
  transactions?: PaymentTransactionRecord[];
  lastUpdated?: string;
  paymentNotes?: string;
}

export interface Proposal {
  id: string; // e.g. "PROP-2026-001"
  leadId: string;
  proposalNumber: string; // e.g. "MYSAR/PROP/2026/042"
  proposalDate: string; // YYYY-MM-DD
  instituteName: string;
  contactPerson: string;
  leadEmail?: string;
  studentCount: number;
  pricingType: PricingType;
  pricePerStudent: number;
  totalAmount: number;
  pricingItems?: ProposalPricingItem[];
  agreementDetails?: ProposalAgreementDetails;
  proposalStatus: ProposalStatus;
  version?: number;
  versionHistory?: ProposalVersionEntry[];
  paymentTracking?: ProposalPaymentTracking;
  pdfFileId?: string;
  pdfUrl?: string;
  createdBy: string;
  createdDate: string;
  sentDate?: string;
  notes?: string;
  validUntil?: string;
}

export type FollowUpType = 'Call' | 'Meeting' | 'Demo' | 'Email' | 'WhatsApp' | 'Site Visit';

export interface FollowUp {
  id: string; // e.g. "FUP-2026-001"
  leadId: string;
  instituteName?: string;
  followUpDate: string; // YYYY-MM-DD
  staff: string;
  followUpType: FollowUpType;
  discussion: string;
  nextFollowUpDate: string;
  status: 'Completed' | 'Pending' | 'Rescheduled' | 'Cancelled';
  remarks: string;
  createdDate: string;
}

export type UserRole = 'Admin' | 'Manager' | 'Salesperson' | 'Staff';

export interface User {
  id: string;
  userId?: string;
  password?: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  userType?: string;
  status: 'Active' | 'Inactive';
  avatar?: string;
  staffId?: string; // e.g. "CB/101/001"
  department?: string;
  departmentCode?: string;
}

export interface FollowUpNotification {
  id: string;
  followUpId: string;
  leadId: string;
  instituteName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  salespersonName: string;
  salespersonEmail: string;
  followUpDate: string;
  followUpType: FollowUpType;
  discussion: string;
  remarks: string;
  studentCount: number;
  urgency: 'Today' | 'Tomorrow' | 'Overdue' | 'Upcoming';
  sentAt?: string;
  status: 'Pending' | 'Sent' | 'Failed';
}

export interface ProposalModuleItem {
  id: string;
  name: string;
  category?: string;
  features: string[];
  isLive: boolean;
}

export interface ProposalReportCategory {
  id: string;
  categoryName: string;
  reports: string[];
}

export interface ProposalServiceItem {
  id: string;
  title: string;
  points: string[];
}

export interface ProposalPricingNote {
  parentPaymentNote: string;
  schoolPaymentNote: string;
  trialOfferNote: string;
}

export interface ProposalContactPerson {
  name: string;
  designation: string;
  phone: string;
}

export interface ProposalContentConfig {
  aboutCompanyTitle?: string;
  aboutCompanyText1: string;
  aboutCompanyText2: string;
  companyObjectives: string[];
  companyScaleNote: string;

  aboutProductTitle?: string;
  aboutProductText: string;
  productHighlights: string[];
  productSummaryQuote: string;

  modulesIntroText: string;
  modules: ProposalModuleItem[];

  reportsIntroText: string;
  reportCategories: ProposalReportCategory[];

  servicesIntroText: string;
  services: ProposalServiceItem[];

  pricingIntroText: string;
  pricingNotes: ProposalPricingNote;

  contactIntroText: string;
  officeAddressLines: string[];
  contactPersons: ProposalContactPerson[];
  contactEmail: string;
  supportPoints: string[];
  closingNote: string;

  conclusionTitle?: string;
  conclusionParagraphs: string[];
  upcomingModulesIntro: string;
  upcomingModules: string[];
  studentAppNote: string;
  finalCallToAction: string;

  // Dedicated Signatory & Acceptance section (Page 14)
  signatoryTitle?: string;
  signatoryAgreementText?: string;
  clientSignatoryLabel?: string;
  clientSignatoryDesignation?: string;
  companySignatoryLabel?: string;
  companySignatoryName?: string;
  companySignatoryDesignation?: string;
}

export interface Settings {
  companyName: string;
  brandName: string;
  tagline: string;
  companyLogo?: string; // Master / General fallback logo
  navbarLogo?: string; // Top-Left App Navigation / Header logo
  documentLogo?: string; // Document, PDF proposal & print header logo
  invoiceLogo?: string; // Invoice, Bills, and Vouchers logo
  loginLogo?: string; // Login screen central emblem badge logo
  address: string;
  phone: string;
  email: string;
  website: string;
  gstNumber: string;
  proposalPrefix: string;
  proposalSequence: number;
  driveFolderId: string;
  gasWebAppUrl: string;
  spreadsheetId: string;
  currencySymbol: string;
  pricingTypes: {
    name: PricingType;
    description: string;
    suggestedFeatures: string[];
  }[];
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  proposalContent?: ProposalContentConfig;
}

export interface DashboardMetrics {
  totalLeads: number;
  newLeads: number;
  followUpsToday: number;
  qualifiedLeads: number;
  proposalsPending: number;
  proposalsSent: number;
  negotiation: number;
  won: number;
  lost: number;
  totalPipelineValue: number;
  wonValue: number;
}

export interface GoogleMeetSpace {
  name: string;
  meetingUri: string;
  meetingCode: string;
  config?: {
    accessType?: 'OPEN' | 'TRUSTED' | 'RESTRICTED' | string;
    entryPointAccess?: 'ALL' | 'CREATOR_APP_ONLY' | string;
  };
  activeConference?: {
    conferenceRecord?: string;
  };
}

export interface ScheduledMeeting {
  id: string;
  title: string;
  leadId?: string;
  instituteName?: string;
  contactPerson?: string;
  participantEmails: string[];
  meetingUri: string;
  meetingCode: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  agenda: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  spaceName?: string;
  createdDate: string;
  createdBy: string;
}

export interface GoogleMeetConferenceRecord {
  name: string;
  startTime: string;
  endTime?: string;
  expireTime?: string;
  space?: string;
}

