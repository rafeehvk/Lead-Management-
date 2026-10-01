import { Lead, Proposal, FollowUp, User, Settings, PricingPlan, LeadActivity, ScheduledMeeting } from './types';
import { DEFAULT_PROPOSAL_CONTENT } from './utils/defaultProposalContent';

export const initialPricingPlans: PricingPlan[] = [
  {
    id: 'PLAN-001',
    name: 'School Premium with ID',
    code: 'SCH-ID',
    defaultPrice: 150,
    billingCycle: 'Per Student / Year',
    description: 'School ERP + Smart RFID/NFC Student Cards & Instant Gate Synchronization',
    features: [
      'Smart RFID / NFC Contactless Student ID Cards',
      'Instant Turnstile / Gate Reader Hardware Sync',
      'Complete Academic ERP & Timetable',
      'Student & Staff Biometric Attendance',
      'Parent & Student Mobile Apps (Android/iOS)',
      'Live Bus Route GPS Tracking & Automated SMS Alerts',
    ],
    isActive: true,
    isPreset: true,
    minStudents: 100,
    sortOrder: 1,
    createdDate: '2026-01-10',
    updatedDate: '2026-08-27',
  },
  {
    id: 'PLAN-002',
    name: 'School Premium',
    code: 'SCH-PREM',
    defaultPrice: 100,
    billingCycle: 'Per Student / Year',
    description: 'Complete School ERP + Student & Staff Mobile Apps + Attendance + Fees + Academic Reports',
    features: [
      'Complete Academic ERP & Timetable',
      'Student & Staff Biometric Attendance',
      'Fee Management & Online Receipts',
      'Parent & Student Mobile Apps (Android/iOS)',
      'Exam & Continuous Evaluation Gradebook',
      'Instant SMS & App Notifications',
    ],
    isActive: true,
    isPreset: true,
    minStudents: 100,
    sortOrder: 2,
    createdDate: '2026-01-10',
    updatedDate: '2026-08-27',
  },
  {
    id: 'PLAN-003',
    name: 'Parent Payment',
    code: 'PARENT-PAY',
    defaultPrice: 200,
    billingCycle: 'Per Student / Year',
    description: 'Parent-oriented communication, digital diaries, direct fee payment gateway & media broadcast',
    features: [
      'Dedicated Parent Portal Mobile App',
      'Integrated Direct Fee Payment Gateway (UPI/Netbanking)',
      'Direct Teacher-Parent Secure Chat',
      'Daily Digital Homework Diary & Announcements',
      'School Event Photo Gallery & Circulars',
    ],
    isActive: true,
    isPreset: true,
    minStudents: 100,
    sortOrder: 3,
    createdDate: '2026-01-10',
    updatedDate: '2026-08-27',
  },
  {
    id: 'PLAN-004',
    name: 'Introduction Trial Price',
    code: 'TRIAL',
    defaultPrice: 45,
    billingCycle: 'Per Student / Term',
    description: '1-Term evaluation pilot package with standard modules for quick onboarding and evaluation',
    features: [
      'Standard ERP & Attendance',
      '1-Term Evaluation Pilot',
      'Basic Cloud Hosting & Backups',
      '48-Hour Rapid Setup',
      'Email & WhatsApp Support',
    ],
    isActive: true,
    isPreset: false,
    minStudents: 100,
    sortOrder: 4,
    createdDate: '2026-01-10',
    updatedDate: '2026-08-27',
  },
  {
    id: 'PLAN-005',
    name: 'Special Price',
    code: 'SPECIAL-VOL',
    defaultPrice: 75,
    billingCycle: 'Per Student / Year',
    description: 'Custom institutional discount package for group institutions, trusts, or high-volume schools',
    features: [
      'Multi-Campus Centralized Management Dashboard',
      'Dedicated Key Account Manager & Technical Lead',
      'Custom ERP Report Builders & Data Export APIs',
      'Priority 99.9% Cloud Uptime SLA Guarantee',
      'Subsidized Additional Smart RFID Hardware',
    ],
    isActive: true,
    isPreset: false,
    minStudents: 500,
    sortOrder: 5,
    createdDate: '2026-01-10',
    updatedDate: '2026-08-27',
  },
];

export const initialSettings: Settings = {
  companyName: 'Casbiro Solutions Private Limited',
  brandName: 'MYSAr',
  tagline: 'My Student Analysis Record (MYSAR) - Transforming Education Through Smart Digital Solutions',
  address: 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
  phone: '+91 7994 807 907 / +91 7994 806 906 / +91 7994 805 905',
  email: 'support@casbiro.com / sales@mysar.in',
  website: 'https://mysar.in',
  gstNumber: '32AABCC8921F1ZX',
  proposalPrefix: 'MYSAR/PROP/2026/',
  proposalSequence: 1,
  driveFolderId: '1AbCdEfGhIjKlMnOpQrStUvWxYz_MYSAR_Proposals',
  gasWebAppUrl: '',
  spreadsheetId: '1MYSAR_LEAD_MANAGEMENT_GOOGLE_SHEET_ID_XXXX',
  currencySymbol: '₹',
  pricingTypes: [
    {
      name: 'Special Offer (School Payment)',
      description: 'Special discounted institutional rate for complete student profile & continuous development (₹75/student/yr)',
      suggestedFeatures: ['Complete Student Digital Record', 'Attendance & Leave Management', 'Fee & Online Collection', 'Report Card & Analytics'],
    },
    {
      name: 'Standard Pricing (Parent Payment)',
      description: 'Parent-subscribed model with mobile app access, OTP login, live diary & notifications (₹150/student/yr)',
      suggestedFeatures: ['Parent & Teacher Mobile Apps', 'Live Homework & Diary', 'Online Fee Payment', 'Real-time Alerts'],
    },
    {
      name: 'Standard Pricing (School Payment)',
      description: 'Full school ERP & teacher dashboard for comprehensive academic monitoring (₹100/student/yr)',
      suggestedFeatures: ['Teacher Dashboard', 'School Administration', 'Exam & Assessment System', 'ID Card & Certification'],
    },
    {
      name: 'Introductory Trial Offer',
      description: '1st Year promotional onboarding package with complete modules & data setup support (₹40/student/yr)',
      suggestedFeatures: ['Full 12 MYSAR Modules', 'Free Data Migration', 'Teacher & Parent Orientation', 'First Year Special Rate'],
    },
  ],
  emailSubjectTemplate: 'MYSAR Proposal for Implementation - {{INSTITUTE_NAME}}',
  emailBodyTemplate: `Dear {{CONTACT_PERSON}},

Greetings from Casbiro Solutions Private Limited.

Thank you for your interest in the MYSAR (My Student Analysis Record) platform for {{INSTITUTE_NAME}}.

Please find attached our official Proposal for Implementation (Ref: {{PROPOSAL_NUMBER}}).

Key Details:
• Institution: {{INSTITUTE_NAME}}
• Student Enrollment: {{STUDENT_COUNT}}
• Pricing Plan: {{PRICING_TYPE}}
• Rate: {{PRICE_PER_STUDENT}} / student / year
• Total Investment: {{TOTAL_AMOUNT}}

Our team provides end-to-end setup, data onboarding, teacher training, and continuous technical support.

Feel free to reach out to us directly for live demonstrations or discussion.

Warm regards,
Team MYSAR | Casbiro Solutions Private Limited
No. 4/461, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021
Phone: +91 7994 807 907 / +91 7994 806 906
Email: support@casbiro.com | https://mysar.in`,
  proposalContent: DEFAULT_PROPOSAL_CONTENT,
};

export const initialUsers: User[] = [
  {
    id: 'USR-001',
    userId: 'rafeeh.vk',
    password: 'Password@123',
    name: 'Rafeeh V K',
    email: 'rafeeh.vk@casbiro.com',
    mobile: '+91 7994 807 907',
    role: 'Admin',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'USR-002',
    userId: 'sakeer',
    password: 'Password@123',
    name: 'Sakeer Ali V',
    email: 'sakeer@casbiro.com',
    mobile: '+91 7994 806 906',
    role: 'Manager',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  },
];

export const initialLeads: Lead[] = [];

export const initialProposals: Proposal[] = [];

export const initialFollowUps: FollowUp[] = [];

export const initialActivities: LeadActivity[] = [];

export const initialScheduledMeetings: ScheduledMeeting[] = [];
