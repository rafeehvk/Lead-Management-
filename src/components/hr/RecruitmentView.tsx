import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  CalendarCheck,
  FileText,
  FileCheck2,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Star,
  Download,
  Printer,
  Mail,
  Share2,
  Send,
  MessageCircle,
  ArrowRight,
  Sparkles,
  Clock,
  MapPin,
  Building,
  UserCheck,
  UserPlus,
  X,
  ChevronRight,
  Tag,
  Check,
} from 'lucide-react';
import {
  Position,
  Applicant,
  Interview,
  OfferLetter,
  AppointmentLetter,
  RecruitmentStage,
  InterviewRound,
  InterviewType,
  InterviewEvaluation,
  OfferStatus,
  AppointmentStatus,
  EmploymentType,
  AllowanceItem,
} from '../../types/hr';

interface RecruitmentViewProps {
  positions: Position[];
  applicants: Applicant[];
  interviews: Interview[];
  offerLetters: OfferLetter[];
  appointmentLetters: AppointmentLetter[];
  initialSubTab?: 'positions' | 'applicants' | 'interview' | 'offers' | 'appointments';
  onSubTabChange?: (tab: 'positions' | 'applicants' | 'interview' | 'offers' | 'appointments') => void;
  onSavePosition: (pos: Partial<Position>) => void;
  onDeletePosition: (id: string) => void;
  onSaveApplicant: (app: Partial<Applicant>) => void;
  onUpdateApplicantStage: (id: string, stage: RecruitmentStage) => void;
  onDeleteApplicant: (id: string) => void;
  onScheduleInterview: (intData: Partial<Interview>) => void;
  onSaveInterviewEvaluation: (id: string, evaluation: InterviewEvaluation) => void;
  onGenerateOffer: (data: Partial<OfferLetter>) => void;
  onUpdateOfferStatus: (id: string, status: OfferStatus) => void;
  onDeleteOffer?: (id: string) => void;
  onGenerateAppointment: (data: Partial<AppointmentLetter>) => void;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  onDeleteAppointment?: (id: string) => void;
  onConvertApplicantToStaff: (applicantId: string, appointmentId?: string) => void;
}

const RECRUITMENT_STAGES: RecruitmentStage[] = [
  'Applied',
  'Shortlisted',
  'Interview Scheduled',
  'Interviewed',
  'Selected',
  'Offer Sent',
  'Offer Accepted',
  'Appointment',
  'Joined',
  'Rejected',
];

export const RecruitmentView: React.FC<RecruitmentViewProps> = ({
  positions = [],
  applicants = [],
  interviews = [],
  offerLetters = [],
  appointmentLetters = [],
  initialSubTab = 'positions',
  onSavePosition,
  onDeletePosition,
  onSaveApplicant,
  onUpdateApplicantStage,
  onDeleteApplicant,
  onScheduleInterview,
  onSaveInterviewEvaluation,
  onGenerateOffer,
  onUpdateOfferStatus,
  onDeleteOffer,
  onGenerateAppointment,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onConvertApplicantToStaff,
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'applicants' | 'interview' | 'offers' | 'appointments'>(initialSubTab);

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSelectSubTab = (tab: 'positions' | 'applicants' | 'interview' | 'offers' | 'appointments') => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [positionFilter, setPositionFilter] = useState('All');
  const [applicantViewMode, setApplicantViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals
  const [isCreatePosOpen, setIsCreatePosOpen] = useState(false);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [isViewPosOpen, setIsViewPosOpen] = useState(false);
  const [selectedPositionForView, setSelectedPositionForView] = useState<Position | null>(null);
  const [newReqBullet, setNewReqBullet] = useState('');
  const [isAddApplicantOpen, setIsAddApplicantOpen] = useState(false);
  const [editingApplicantId, setEditingApplicantId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScheduleIntOpen, setIsScheduleIntOpen] = useState(false);
  const [isEvaluateIntOpen, setIsEvaluateIntOpen] = useState(false);
  const [selectedInterviewForEval, setSelectedInterviewForEval] = useState<Interview | null>(null);

  const [isGenerateOfferOpen, setIsGenerateOfferOpen] = useState(false);
  const [selectedApplicantForOffer, setSelectedApplicantForOffer] = useState<Applicant | null>(null);
  const [previewOffer, setPreviewOffer] = useState<OfferLetter | null>(null);
  const [copiedOfferLetter, setCopiedOfferLetter] = useState(false);
  const [editingOfferId, setEditingOfferId] = useState<string | null>(null);

  const [isGenerateApptOpen, setIsGenerateApptOpen] = useState(false);
  const [selectedApplicantForAppt, setSelectedApplicantForAppt] = useState<Applicant | null>(null);
  const [previewAppt, setPreviewAppt] = useState<AppointmentLetter | null>(null);
  const [editingApptId, setEditingApptId] = useState<string | null>(null);

  // Position Form State
  const [posForm, setPosForm] = useState<Partial<Position>>({
    name: '',
    code: '',
    division: 'Academic Wing',
    department: 'Academic',
    vacancies: 1,
    employmentType: 'Full Time',
    description: '',
    responsibilities: [],
    qualifications: [],
    experienceRequired: '2-4 years',
    skills: [],
    salaryRange: { min: 30000, max: 45000, currency: 'INR' },
    jobLocation: 'Kochi Campus',
    closingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    status: 'Open',
  });

  // Interview Schedule Form State
  const [intForm, setIntForm] = useState<Partial<Interview>>({
    applicantId: '',
    round: 'Round 1 - Screening',
    type: 'Online',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '11:00 AM',
    locationOrLink: 'https://meet.google.com/mysar-interview',
    panelMembers: ['Principal', 'HOD'],
    notes: '',
  });

  // Evaluation Form State
  const [evalForm, setEvalForm] = useState<InterviewEvaluation>({
    communication: 4,
    technicalKnowledge: 4,
    subjectKnowledge: 4,
    experience: 4,
    problemSolving: 4,
    leadership: 4,
    teamwork: 4,
    overallPerformance: 4.0,
    strengths: '',
    weaknesses: '',
    notes: '',
    recommendation: 'Recommend',
    finalDecision: 'Selected',
    evaluatedBy: 'Dr. Ramesh Nambiar',
    evaluatedDate: new Date().toISOString().split('T')[0],
  });

  // Offer Form State with Casbiro Solutions Format Support
  const [offerForm, setOfferForm] = useState<Partial<OfferLetter>>({
    basicSalary: 24000,
    allowances: 12000,
    allowanceItems: [
      { id: 'all-1', name: 'House Rent / Accommodation Allowance', amount: 6000 },
      { id: 'all-2', name: 'Travel / Conveyance Allowance', amount: 2500 },
      { id: 'all-3', name: 'Communication Allowance', amount: 1500 },
      { id: 'all-4', name: 'Special Allowance', amount: 2000 },
    ],
    joiningDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    employmentType: 'Full-Time',
    businessOrProduct: 'MYSAR / Casbiro',
    reportingTo: 'Reporting Manager / Department Head',
    workLocation: 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021',
    reportingTime: '09:30 AM',
    reportingPerson: 'Department Head / HR Operations',
    trainingPeriod: '30 Days',
    probationPeriod: '3 Months',
    noticePeriod: '30 Days',
    workingDays: 'Monday to Saturday',
    workingHours: '09:30 AM to 06:00 PM',
    benefits: ['Health Insurance', 'EPF Contribution', 'Skill Certification Sponsorship'],
    termsAndConditions: 'Subject to clean document verification and standard probation period.',
    expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    employeeAddress: 'Door No. 18/52, Green Meadows',
    cityStatePin: 'Kakkanad, Kochi, Kerala – 682021',
  });

  const defaultApptForm: Partial<AppointmentLetter> = {
    employeeName: '',
    employeeId: '',
    position: '',
    department: '',
    division: 'Academic Wing',
    joiningDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    employmentType: 'Full Time',
    basicSalary: 30000,
    allowances: 15000,
    allowanceItems: [
      { id: 'all-room', name: 'Room Allowance', amount: 6000 },
      { id: 'all-trans', name: 'Transportation', amount: 4000 },
      { id: 'all-ot', name: 'Over time', amount: 2000 },
      { id: 'all-spl', name: 'Special Allowance', amount: 3000 },
    ],
    probationPeriod: '6 Months',
    workingHours: '8:15 AM – 4:00 PM (Monday to Friday)',
    workplace: 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021',
    responsibilities: [
      'Fulfill institutional duties and classroom mentorship.',
      'Participate actively in departmental curriculum review and institutional initiatives.',
      'Maintain exemplary professional conduct and adhere strictly to institutional compliance standards.',
    ],
    termsAndConditions: 'Formal institutional appointment subject to institutional service rules and background verification.',
    status: 'Generated',
  };

  const [apptForm, setApptForm] = useState<Partial<AppointmentLetter>>(defaultApptForm);

  const handleAddApptAllowance = (name: string, amount: number) => {
    const newItems = [...(apptForm.allowanceItems || []), { id: `all-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name, amount }];
    const total = newItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    setApptForm({ ...apptForm, allowanceItems: newItems, allowances: total });
  };

  const handleUpdateApptAllowance = (id: string, updates: Partial<AllowanceItem>) => {
    const newItems = (apptForm.allowanceItems || []).map((it) => (it.id === id ? { ...it, ...updates } : it));
    const total = newItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    setApptForm({ ...apptForm, allowanceItems: newItems, allowances: total });
  };

  const handleRemoveApptAllowance = (id: string) => {
    const newItems = (apptForm.allowanceItems || []).filter((it) => it.id !== id);
    const total = newItems.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    setApptForm({ ...apptForm, allowanceItems: newItems, allowances: total });
  };

  // Helper openers for Offer & Appointment Modals
  const handleOpenCreateOffer = (applicant: Applicant) => {
    setSelectedApplicantForOffer(applicant);
    setEditingOfferId(null);
    const basic = applicant.expectedSalary ? Math.round(applicant.expectedSalary * 0.6) : 24000;
    const allowances = applicant.expectedSalary ? Math.round(applicant.expectedSalary * 0.4) : 12000;
    setOfferForm({
      applicantName: applicant.name,
      applicantEmail: applicant.email,
      applicantPhone: applicant.phone,
      position: applicant.positionName,
      department: applicant.department,
      basicSalary: basic,
      allowances,
      allowanceItems: [
        { id: 'all-1', name: 'House Rent / Accommodation Allowance', amount: Math.round(allowances * 0.5) },
        { id: 'all-2', name: 'Travel / Conveyance Allowance', amount: Math.round(allowances * 0.2) },
        { id: 'all-3', name: 'Communication Allowance', amount: Math.round(allowances * 0.15) },
        { id: 'all-4', name: 'Special Allowance', amount: Math.round(allowances * 0.15) },
      ],
      joiningDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      employmentType: 'Full-Time',
      businessOrProduct: 'MYSAR / Casbiro',
      reportingTo: 'Reporting Manager / Department Head',
      workLocation: 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021',
      reportingTime: '09:30 AM',
      reportingPerson: 'Department Head / HR Operations',
      trainingPeriod: '30 Days',
      probationPeriod: '3 Months',
      noticePeriod: '30 Days',
      workingDays: 'Monday to Saturday',
      workingHours: '09:30 AM to 06:00 PM',
      benefits: ['Health Insurance', 'EPF Contribution', 'Skill Certification Sponsorship'],
      termsAndConditions: 'Subject to clean document verification and standard probation period.',
      expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      employeeAddress: 'Door No. 18/52, Green Meadows',
      cityStatePin: 'Kakkanad, Kochi, Kerala – 682021',
    });
    setIsGenerateOfferOpen(true);
  };

  const handleOpenEditOffer = (offer: OfferLetter) => {
    const applicant = applicants.find((a) => a.id === offer.applicantId) || ({
      id: offer.applicantId || 'app-unknown',
      name: offer.applicantName,
      positionName: offer.position,
      department: offer.department,
      phone: offer.applicantPhone,
      email: offer.applicantEmail,
      stage: 'Offer Sent',
    } as Applicant);
    setSelectedApplicantForOffer(applicant);
    setEditingOfferId(offer.id);
    setOfferForm({ ...offer });
    setIsGenerateOfferOpen(true);
  };

  const handleOpenCreateAppt = (applicant: Applicant) => {
    setSelectedApplicantForAppt(applicant);
    setEditingApptId(null);
    const matchingOffer = offerLetters.find((o) => o.applicantId === applicant.id || o.id === applicant.offerLetterId);
    const basic = matchingOffer?.basicSalary || 30000;
    const allowances = matchingOffer?.allowances || 15000;
    setApptForm({
      employeeName: applicant.name,
      employeeId: `EMP-2026-${String(appointmentLetters.length + 101).padStart(3, '0')}`,
      position: applicant.positionName,
      department: applicant.department,
      division: 'Academic Wing',
      joiningDate: matchingOffer?.joiningDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      employmentType: matchingOffer?.employmentType || 'Full Time',
      basicSalary: basic,
      allowances,
      allowanceItems: matchingOffer?.allowanceItems && matchingOffer.allowanceItems.length > 0 ? matchingOffer.allowanceItems : defaultApptForm.allowanceItems,
      probationPeriod: matchingOffer?.probationPeriod || '6 Months',
      workingHours: matchingOffer?.workingHours || '8:15 AM – 4:00 PM (Monday to Friday)',
      workplace: matchingOffer?.workLocation || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021',
      responsibilities: [
        'Fulfill institutional duties and classroom mentorship.',
        'Participate actively in departmental curriculum review and institutional initiatives.',
        'Maintain exemplary professional conduct and adhere strictly to institutional compliance standards.',
      ],
      termsAndConditions: 'Formal institutional appointment subject to institutional service rules and background verification.',
      status: 'Generated',
    });
    setIsGenerateApptOpen(true);
  };

  const handleOpenEditAppt = (appt: AppointmentLetter) => {
    const applicant = applicants.find((a) => a.id === appt.applicantId) || ({
      id: appt.applicantId || 'app-unknown',
      name: appt.employeeName,
      positionName: appt.position,
      department: appt.department,
      stage: 'Appointment',
    } as Applicant);
    setSelectedApplicantForAppt(applicant);
    setEditingApptId(appt.id);
    setApptForm({ ...appt });
    setIsGenerateApptOpen(true);
  };

  const formatOfferLetterDate = (dateStr?: string) => {
    if (!dateStr) return '28/08/2026';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getOfferTrainingPeriod = (joiningDateStr?: string, period = '30 Days') => {
    let days = 30;
    if (period.includes('15')) days = 15;
    else if (period.includes('60') || period.includes('2 Month')) days = 60;
    else if (period.includes('90') || period.includes('3 Month')) days = 90;
    else if (period.includes('6 Month')) days = 180;

    let start = '15/09/2026';
    let end = '15/10/2026';
    if (joiningDateStr) {
      try {
        const dStart = new Date(joiningDateStr);
        const dEnd = new Date(dStart.getTime() + days * 86400000);
        const fmt = (d: Date) =>
          `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        start = fmt(dStart);
        end = fmt(dEnd);
      } catch {
        start = joiningDateStr;
        end = joiningDateStr;
      }
    }
    return { start, end, duration: period || `${days} Days` };
  };

  const calculateOfferSalaryBreakdown = (offer: OfferLetter) => {
    const gross =
      Number(offer.grossSalary) ||
      (Number(offer.basicSalary) || 0) + (Number(offer.allowances) || 0) ||
      36000;
    const basic = Number(offer.basicSalary) || Math.round(gross * 0.6);

    const items = offer.allowanceItems || [];
    const hraItem = items.find((i) => /room|hra|house|accommodation/i.test(i.name))?.amount;
    const convItem = items.find((i) => /conveyance|travel|transport/i.test(i.name))?.amount;
    const commItem = items.find((i) => /comm|phone|mobile|internet/i.test(i.name))?.amount;
    const specItem = items.find((i) => /special/i.test(i.name))?.amount;

    const hra = offer.hra ?? (hraItem !== undefined ? hraItem : Math.round(basic * 0.25));
    const conveyance = offer.conveyanceAllowance ?? (convItem !== undefined ? convItem : 2500);
    const communication = offer.communicationAllowance ?? (commItem !== undefined ? commItem : 1500);

    const allocated = basic + hra + conveyance + communication;
    const remaining = Math.max(0, gross - allocated);
    const special =
      offer.specialAllowance ??
      (specItem !== undefined ? specItem : Math.round(remaining * 0.6));
    const other =
      offer.otherAllowance ?? Math.max(0, gross - (allocated + special));

    const totalGross = basic + hra + conveyance + communication + special + other;

    const pf = offer.pfDeduction ?? Math.min(1800, Math.round(basic * 0.12));
    const pt = offer.ptDeduction ?? 200;
    const tds =
      offer.tdsDeduction ?? (gross > 50000 ? Math.round((gross - 50000) * 0.05) : 0);
    const otherDeductions = offer.otherDeductions ?? 0;
    const totalDeductions = pf + pt + tds + otherDeductions;
    const netSalary = Math.max(0, totalGross - totalDeductions);

    return {
      basic,
      hra,
      conveyance,
      communication,
      special,
      other,
      gross: totalGross,
      pf,
      pt,
      tds,
      otherDeductions,
      totalDeductions,
      netSalary,
    };
  };

  const getOfferLetterMarkdownText = (offer: OfferLetter) => {
    const sal = calculateOfferSalaryBreakdown(offer);
    const training = getOfferTrainingPeriod(offer.joiningDate, offer.trainingPeriod);
    const issueDateFormatted = formatOfferLetterDate(offer.issueDate);
    const joiningDateFormatted = formatOfferLetterDate(offer.joiningDate);

    return `# CASBIRO SOLUTIONS PRIVATE LIMITED

**Offer Letter**

**Date:** ${issueDateFormatted}
**Offer Letter No.:** ${offer.offerNumber || 'CAS-OFFER-2026-001'}

### To,

**${offer.applicantName || '[Employee Name]'}**
${offer.employeeAddress || 'Door No. 18/52, Green Meadows'}
${offer.cityStatePin || 'Kakkanad, Kochi, Kerala – 682021'}

### Subject: Offer of Employment

Dear **${offer.applicantName || '[Employee Name]'}**,

We are pleased to offer you employment with **Casbiro Solutions Private Limited** for the position of **${offer.position || '[Designation]'}**, based on the discussions and understanding between you and the company.

You will be associated with:

**Business / Product:** ${offer.businessOrProduct || 'MYSAR / Casbiro / Both'}
**Department:** ${offer.department || '[Department Name]'}
**Designation:** ${offer.position || '[Designation]'}
**Reporting To:** ${offer.reportingTo || 'Reporting Manager / Department Head'}
**Work Location:** ${offer.workLocation || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021'}
**Employment Type:** ${offer.employmentType || 'Full-Time'}

Your employment will be subject to the terms and conditions mentioned below.

---

## 1. Date of Joining

Your expected date of joining will be:

**Joining Date:** ${joiningDateFormatted}

You are required to report to **${offer.reportingPerson || 'Reporting Person / Department'}** at **${offer.reportingTime || '09:30 AM'}** on your joining date.

---

## 2. Training Period

You will undergo an initial training period of **${training.duration}** from **${training.start}** to **${training.end}**.

The training period is intended to familiarize you with:

* Company policies and procedures
* Your assigned department and responsibilities
* MYSAR / Casbiro products and services
* Internal systems and software
* Work processes and reporting procedures
* Customer and internal communication standards
* Role-specific technical and operational requirements

During the training period, your performance, learning ability, discipline, attendance and suitability for the assigned role will be evaluated.

---

## 3. Probation Period

You will be on probation for a period of **${offer.probationPeriod || '3 / 6 Months'}** from your date of joining.

During the probation period, your performance, conduct, attendance, job responsibilities and overall suitability for the position will be reviewed.

Based on the evaluation, the company may:

* Confirm your employment;
* Extend the probation period; or
* Take other employment-related action in accordance with company policy.

Successful completion of the probation period does not automatically imply a change in designation or salary unless specifically communicated by the company.

---

# 4. Salary & Compensation

Your gross monthly salary will be **₹${sal.gross.toLocaleString('en-IN')}**, structured as follows:

### A. Earnings

| Salary Component | Monthly (₹) | Annual (₹) |
| --- | ---: | ---: |
| Basic Salary | ₹${sal.basic.toLocaleString('en-IN')} | ₹${(sal.basic * 12).toLocaleString('en-IN')} |
| House Rent / Accommodation Allowance | ₹${sal.hra.toLocaleString('en-IN')} | ₹${(sal.hra * 12).toLocaleString('en-IN')} |
| Travel / Conveyance Allowance | ₹${sal.conveyance.toLocaleString('en-IN')} | ₹${(sal.conveyance * 12).toLocaleString('en-IN')} |
| Communication Allowance | ₹${sal.communication.toLocaleString('en-IN')} | ₹${(sal.communication * 12).toLocaleString('en-IN')} |
| Special Allowance | ₹${sal.special.toLocaleString('en-IN')} | ₹${(sal.special * 12).toLocaleString('en-IN')} |
| Other Allowance | ₹${sal.other.toLocaleString('en-IN')} | ₹${(sal.other * 12).toLocaleString('en-IN')} |
| **Gross Salary** | **₹${sal.gross.toLocaleString('en-IN')}** | **₹${(sal.gross * 12).toLocaleString('en-IN')}** |

### B. Deductions

Applicable deductions may include, as per company policy and applicable law:

| Deduction | Monthly (₹) | Annual (₹) |
| --- | ---: | ---: |
| Employee PF Contribution | ₹${sal.pf.toLocaleString('en-IN')} | ₹${(sal.pf * 12).toLocaleString('en-IN')} |
| Professional Tax | ₹${sal.pt.toLocaleString('en-IN')} | ₹${(sal.pt * 12).toLocaleString('en-IN')} |
| TDS / Income Tax | ₹${sal.tds.toLocaleString('en-IN')} | ₹${(sal.tds * 12).toLocaleString('en-IN')} |
| Other Applicable Deductions | ₹${sal.otherDeductions.toLocaleString('en-IN')} | ₹${(sal.otherDeductions * 12).toLocaleString('en-IN')} |
| **Total Deductions** | **₹${sal.totalDeductions.toLocaleString('en-IN')}** | **₹${(sal.totalDeductions * 12).toLocaleString('en-IN')}** |

### C. Net Salary

**Gross Salary:** ₹${sal.gross.toLocaleString('en-IN')} / Month
**Less: Total Deductions:** ₹${sal.totalDeductions.toLocaleString('en-IN')} / Month

**Estimated Net Salary:** **₹${sal.netSalary.toLocaleString('en-IN')} / Month**

The actual net salary may vary depending on applicable statutory deductions, tax provisions, attendance, leave without pay and other authorized deductions.

---

# 5. Salary Payment

Salary will normally be processed and paid on a monthly basis through the company's designated salary payment process.

Salary will be credited to the bank account provided by you and verified by the company.

---

# 6. Roles & Responsibilities

You will be responsible for performing the duties associated with your position and any other reasonable responsibilities assigned by your reporting manager or management.

Your responsibilities may include activities related to:

* **MYSAR – My Student Analysis Record**
* **Casbiro business operations**
* Customer support and communication
* Product implementation and training
* Internal administration
* Technology and software operations
* Reporting and documentation
* Other activities relevant to your assigned role

The exact responsibilities will depend on your designation and department.

---

# 7. Work Location & Transfer

Your initial work location will be:

**${offer.workLocation || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021'}**

Depending on business requirements, you may be required to work from another company location, client location, school/institution location or remotely, subject to management approval and company policy.

---

# 8. Working Hours

Your normal working hours will be:

**Working Days:** ${offer.workingHours?.includes('Friday') ? 'Monday to Friday' : 'Monday to Saturday'}
**Working Hours:** ${offer.workingHours || '09:30 AM to 06:00 PM'}

Working hours may be changed depending on operational requirements and company policy.

---

# 9. Leave & Holidays

You will be eligible for leave and holidays according to the company's applicable leave policy.

Leave must be applied for and approved through the prescribed company process.

---

# 10. Company Policies & Code of Conduct

During your employment, you are required to comply with all applicable policies, procedures and instructions of **Casbiro Solutions Private Limited**.

You are expected to maintain:

* Professional conduct
* Confidentiality
* Punctuality and attendance
* Appropriate workplace behaviour
* Proper handling of company assets
* Responsible use of company systems and data
* Professional communication with customers, schools, employees and management

---

# 11. Confidentiality

During your employment, you may have access to confidential information relating to the company, MYSAR, Casbiro, customers, schools, employees, business operations, software, databases, pricing, financial information and other proprietary information.

You must not disclose, share, copy, misuse or distribute such information to any unauthorized person during or after your employment.

---

# 12. Company Property & Data

All company property, documents, credentials, software access, devices, data, files and other resources provided to you shall remain the property of **Casbiro Solutions Private Limited**.

Upon resignation or termination of employment, all company property and confidential information must be returned to the company.

---

# 13. Performance Review

Your performance may be evaluated periodically based on factors including:

* Job performance
* Quality of work
* Productivity
* Attendance and punctuality
* Behaviour and discipline
* Teamwork
* Customer interaction
* Achievement of assigned targets/KPIs
* Compliance with company procedures

Salary revisions, incentives or promotions, where applicable, will be based on company policy and management decisions.

---

# 14. Termination / Notice Period

Either party may terminate the employment by providing the applicable notice period as specified in the company's employment policy or as separately communicated to the employee.

The company reserves the right to take appropriate action in cases of serious misconduct, breach of confidentiality, violation of company policies or other grounds permitted under applicable law.

**Notice Period:** ${offer.noticePeriod || '30 Days'}

---

# 15. Documents Required at Joining

You are required to submit the following documents, as applicable:

* Aadhaar Card / Government ID
* PAN Card
* Passport-size photograph
* Educational certificates
* Previous employment documents
* Bank account details
* Address proof
* Experience certificate, if applicable
* Other documents requested by the company

---

# 16. Acceptance of Offer

We are pleased to welcome you to **Casbiro Solutions Private Limited** and look forward to your contribution to the growth of **MYSAR and Casbiro**.

Please sign and return a copy of this letter as confirmation of your acceptance of the offer and the terms mentioned above.

We wish you a successful and rewarding career with Casbiro Solutions Private Limited.

Sincerely,

**For Casbiro Solutions Private Limited**

**Authorized Signatory**
Name: Muhammed Rafeeh
Designation: Managing Director
Signature: ___________________________
Date: ${issueDateFormatted}

---

# Employee Acceptance

I, **${offer.applicantName || '[Employee Name]'}**, hereby accept the offer of employment with **Casbiro Solutions Private Limited** and agree to comply with the terms and conditions mentioned in this Offer Letter and the applicable company policies.

**Employee Name:** __________________________
**Signature:** _______________________________
**Date:** ____________________________________
**Place:** ___________________________________

---

## Annexure A – Salary & Benefits Structure

**Employee Name:** ${offer.applicantName || '[Employee Name]'}
**Designation:** ${offer.position || '[Designation]'}
**Department:** ${offer.department || '[Department Name]'}
**Business / Product:** ${offer.businessOrProduct || 'MYSAR / Casbiro'}
**Joining Date:** ${joiningDateFormatted}

| Component | Monthly (₹) | Annual (₹) |
| --- | ---: | ---: |
| Basic Salary | ₹${sal.basic.toLocaleString('en-IN')} | ₹${(sal.basic * 12).toLocaleString('en-IN')} |
| HRA / Accommodation | ₹${sal.hra.toLocaleString('en-IN')} | ₹${(sal.hra * 12).toLocaleString('en-IN')} |
| Conveyance / Travel | ₹${sal.conveyance.toLocaleString('en-IN')} | ₹${(sal.conveyance * 12).toLocaleString('en-IN')} |
| Communication | ₹${sal.communication.toLocaleString('en-IN')} | ₹${(sal.communication * 12).toLocaleString('en-IN')} |
| Special Allowance | ₹${sal.special.toLocaleString('en-IN')} | ₹${(sal.special * 12).toLocaleString('en-IN')} |
| Other Allowance | ₹${sal.other.toLocaleString('en-IN')} | ₹${(sal.other * 12).toLocaleString('en-IN')} |
| **Gross Salary** | **₹${sal.gross.toLocaleString('en-IN')}** | **₹${(sal.gross * 12).toLocaleString('en-IN')}** |
| Employee PF | ₹${sal.pf.toLocaleString('en-IN')} | ₹${(sal.pf * 12).toLocaleString('en-IN')} |
| Professional Tax | ₹${sal.pt.toLocaleString('en-IN')} | ₹${(sal.pt * 12).toLocaleString('en-IN')} |
| TDS | ₹${sal.tds.toLocaleString('en-IN')} | ₹${(sal.tds * 12).toLocaleString('en-IN')} |
| Other Deductions | ₹${sal.otherDeductions.toLocaleString('en-IN')} | ₹${(sal.otherDeductions * 12).toLocaleString('en-IN')} |
| **Total Deductions** | **₹${sal.totalDeductions.toLocaleString('en-IN')}** | **₹${(sal.totalDeductions * 12).toLocaleString('en-IN')}** |
| **Estimated Net Salary** | **₹${sal.netSalary.toLocaleString('en-IN')}** | **₹${(sal.netSalary * 12).toLocaleString('en-IN')}** |

**Training Period:** ${training.duration}
**Probation Period:** ${offer.probationPeriod || '3 / 6 Months'}
**Notice Period:** ${offer.noticePeriod || '30 Days'}

---

**CASBIRO SOLUTIONS PRIVATE LIMITED**
*MYSAR – My Student Analysis Record*
**Beyond marks, Complete student growth**
`;
  };

  const handleAddOfferAllowance = (name = 'Room Allowance', amount = 3000) => {
    const currentItems = offerForm.allowanceItems || [];
    const newItems: AllowanceItem[] = [
      ...currentItems,
      { id: `all-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, name, amount },
    ];
    const total = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setOfferForm({ ...offerForm, allowanceItems: newItems, allowances: total });
  };

  const handleUpdateOfferAllowance = (id: string, updates: Partial<AllowanceItem>) => {
    const currentItems = offerForm.allowanceItems || [];
    const newItems = currentItems.map((item) => (item.id === id ? { ...item, ...updates } : item));
    const total = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setOfferForm({ ...offerForm, allowanceItems: newItems, allowances: total });
  };

  const handleRemoveOfferAllowance = (id: string) => {
    const currentItems = offerForm.allowanceItems || [];
    const newItems = currentItems.filter((item) => item.id !== id);
    const total = newItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    setOfferForm({ ...offerForm, allowanceItems: newItems, allowances: total });
  };

  // Position Handlers
  const handleOpenCreatePosition = () => {
    setEditingPosId(null);
    setNewReqBullet('');
    setPosForm({
      name: '',
      code: `POS-2026-${String(positions.length + 1).padStart(3, '0')}`,
      division: 'Academic Wing',
      department: 'Academic',
      vacancies: 1,
      filled: 0,
      remainingVacancies: 1,
      employmentType: 'Full Time',
      description: '',
      requirements: [
        "Master's Degree / B.Ed in relevant subject or institutional discipline",
        'Minimum 2+ years proven classroom instruction or institutional experience',
        'Strong pedagogical communication and collaborative skills',
      ],
      responsibilities: [
        'Deliver curriculum instruction according to institutional bylaws',
        'Maintain student performance and academic evaluation records in ERP',
      ],
      qualifications: ['B.Ed / M.Ed or Post Graduate Qualification'],
      experienceRequired: '2-4 years',
      skills: ['Classroom Management', 'Curriculum Planning'],
      salaryRange: { min: 30000, max: 45000, currency: 'INR' },
      jobLocation: 'Kochi Campus',
      closingDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'Open',
    });
    setIsCreatePosOpen(true);
  };

  const handleOpenEditPosition = (pos: Position) => {
    setEditingPosId(pos.id);
    setNewReqBullet('');
    setPosForm({
      ...pos,
      requirements:
        pos.requirements && pos.requirements.length > 0
          ? [...pos.requirements]
          : [
              "Master's Degree / B.Ed in relevant subject or institutional discipline",
              'Minimum 2+ years proven institutional experience',
            ],
    });
    setIsCreatePosOpen(true);
  };

  const handleViewPosition = (pos: Position) => {
    setSelectedPositionForView(pos);
    setIsViewPosOpen(true);
  };

  const handleCopyPosition = (pos: Position) => {
    onSavePosition({
      ...pos,
      id: undefined,
      name: `${pos.name} (Copy)`,
      code: `${pos.code}-CPY`,
      filled: 0,
      remainingVacancies: pos.vacancies,
    });
    setToastMessage(`Position "${pos.name}" copied successfully!`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleAddRequirementBullet = () => {
    if (!newReqBullet.trim()) return;
    const trimmed = newReqBullet.trim();
    const currentReqs = posForm.requirements || [];
    if (!currentReqs.includes(trimmed)) {
      setPosForm({
        ...posForm,
        requirements: [...currentReqs, trimmed],
      });
    }
    setNewReqBullet('');
  };

  const handleRemoveRequirementBullet = (index: number) => {
    const currentReqs = [...(posForm.requirements || [])];
    currentReqs.splice(index, 1);
    setPosForm({
      ...posForm,
      requirements: currentReqs,
    });
  };

  // Applicant Form State
  const initialApplicantForm: Partial<Applicant> = {
    name: '',
    positionId: '',
    positionName: '',
    department: 'Academic',
    phone: '',
    email: '',
    experience: 2,
    currentCompanyOrSchool: '',
    highestQualification: "Post Graduate / Master's Degree",
    skills: ['Communication', 'Teamwork'],
    applicationDate: new Date().toISOString().split('T')[0],
    stage: 'Applied',
    interviewStatus: 'Not Scheduled',
    overallRating: 4.0,
    status: 'Active',
    noticePeriod: '15 Days',
    notes: '',
  };

  const [applicantForm, setApplicantForm] = useState<Partial<Applicant>>(initialApplicantForm);
  const [skillInput, setSkillInput] = useState('');

  const handleOpenAddApplicantForPosition = (pos?: Position) => {
    setEditingApplicantId(null);
    const targetPos = pos || (positions.length > 0 ? positions[0] : undefined);
    setApplicantForm({
      ...initialApplicantForm,
      positionId: targetPos ? targetPos.id : '',
      positionName: targetPos ? targetPos.name : '',
      department: targetPos ? targetPos.department : 'Academic',
      skills: targetPos?.skills && targetPos.skills.length > 0 ? [...targetPos.skills] : ['Communication', 'Teamwork'],
    });
    setSkillInput('');
    setIsAddApplicantOpen(true);
  };

  const handleEditApplicant = (app: Applicant) => {
    setEditingApplicantId(app.id);
    setApplicantForm({
      ...app,
    });
    setSkillInput('');
    setIsAddApplicantOpen(true);
  };

  const handleSaveApplicantSubmit = () => {
    if (!applicantForm.name || !applicantForm.name.trim()) {
      alert('Please enter applicant full name');
      return;
    }
    if (!applicantForm.positionId) {
      alert('Please select a position for this application');
      return;
    }

    const selectedPos = positions.find((p) => p.id === applicantForm.positionId);
    const fullData: Partial<Applicant> = {
      ...applicantForm,
      id: editingApplicantId || undefined,
      name: applicantForm.name.trim(),
      positionName: selectedPos?.name || applicantForm.positionName || 'Staff Role',
      department: selectedPos?.department || applicantForm.department || 'Academic',
      overallRating: applicantForm.overallRating || 4.0,
      stage: applicantForm.stage || 'Applied',
      status: applicantForm.status || 'Active',
      interviewStatus: applicantForm.interviewStatus || 'Not Scheduled',
    };

    onSaveApplicant(fullData);
    setIsAddApplicantOpen(false);

    setToastMessage(
      editingApplicantId
        ? `Application for "${fullData.name}" updated successfully!`
        : `Applicant "${fullData.name}" successfully added to position "${fullData.positionName}"!`
    );

    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // Filtered Lists
  const filteredPositions = positions.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = departmentFilter === 'All' || p.department === departmentFilter;
    return matchSearch && matchDept;
  });

  const filteredApplicants = applicants.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.positionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.phone && a.phone.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchDept = departmentFilter === 'All' || a.department === departmentFilter;
    const matchStage = stageFilter === 'All' || a.stage === stageFilter;
    const matchPosition = positionFilter === 'All' || a.positionId === positionFilter;
    return matchSearch && matchDept && matchStage && matchPosition;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B5D2A] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
              HR Module
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500 font-medium">Casbiro Solutions Private Limited</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1.5">
            Recruitments
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage open positions, applicants, interview management, offer letters, and appointment letters.
          </p>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleSelectSubTab('positions')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'positions'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#168A45]" />
            <span>Positions ({positions.length})</span>
          </button>

          <button
            onClick={() => handleSelectSubTab('applicants')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'applicants'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-[#168A45]" />
            <span>Applicants ({applicants.length})</span>
          </button>

          <button
            onClick={() => handleSelectSubTab('interview')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'interview'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarCheck className="w-4 h-4 text-[#168A45]" />
            <span>Interview Management ({interviews.length})</span>
          </button>

          <button
            onClick={() => handleSelectSubTab('offers')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'offers'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-[#168A45]" />
            <span>Offer Letters ({offerLetters.length})</span>
          </button>

          <button
            onClick={() => handleSelectSubTab('appointments')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'appointments'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileCheck2 className="w-4 h-4 text-[#168A45]" />
            <span>Appointment Letters ({appointmentLetters.length})</span>
          </button>
        </div>

        {/* Action button corresponding to sub-tab */}
        <div className="flex items-center space-x-2">
          {activeSubTab === 'positions' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenAddApplicantForPosition()}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                title="Add candidate application to a position"
              >
                <UserPlus className="w-4 h-4 text-emerald-700" />
                <span>+ Add Applicant</span>
              </button>
              <button
                onClick={handleOpenCreatePosition}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Position</span>
              </button>
            </div>
          )}

          {activeSubTab === 'applicants' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleOpenAddApplicantForPosition(positionFilter !== 'All' ? positions.find(p => p.id === positionFilter) : undefined)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Add Applicant</span>
              </button>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setApplicantViewMode('kanban')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    applicantViewMode === 'kanban' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setApplicantViewMode('table')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
                    applicantViewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          )}

          {activeSubTab === 'interview' && (
            <button
              onClick={() => {
                const firstAvailable = applicants.find((a) => a.stage === 'Shortlisted' || a.stage === 'Applied');
                setIntForm({
                  applicantId: firstAvailable?.id || applicants[0]?.id || '',
                  round: 'Round 1 - Screening',
                  type: 'Online',
                  date: new Date().toISOString().split('T')[0],
                  startTime: '10:30 AM',
                  endTime: '11:30 AM',
                  locationOrLink: 'https://meet.google.com/mysar-interview',
                  panelMembers: ['Principal Dr. Ramesh Nambiar', 'HOD'],
                  notes: '',
                });
                setIsScheduleIntOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 rounded-md hover:bg-emerald-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUB-TAB 1: POSITIONS LIST */}
      {activeSubTab === 'positions' && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search position by title, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white"
              >
                <option value="All">All Departments</option>
                <option value="Academic">Academic</option>
                <option value="Administration">Administration</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
              </select>
            </div>
          </div>

          {/* Positions Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Position ID / Code</th>
                    <th className="px-4 py-3">Position Title</th>
                    <th className="px-4 py-3">Department & Division</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-center">Vacancies</th>
                    <th className="px-4 py-3 text-center">Filled</th>
                    <th className="px-4 py-3 text-center">Remaining</th>
                    <th className="px-4 py-3 text-center">Applicants</th>
                    <th className="px-4 py-3">Closing Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPositions.map((pos) => {
                    const posApplicants = applicants.filter(
                      (a) => a.positionId === pos.id || (a.positionName && pos.name && a.positionName.toLowerCase() === pos.name.toLowerCase())
                    );
                    return (
                      <tr key={pos.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{pos.id}</div>
                          <div className="text-[10px] text-slate-400">{pos.code}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{pos.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{pos.jobLocation}</span>
                            <span className="text-slate-300">•</span>
                            <span>₹{pos.salaryRange.min.toLocaleString()} - ₹{pos.salaryRange.max.toLocaleString()}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-800">{pos.department}</span>
                          <div className="text-[10px] text-slate-400">{pos.division}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700">{pos.employmentType}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">{pos.vacancies}</td>
                        <td className="px-4 py-3 text-center font-bold text-emerald-700">{pos.filled}</td>
                        <td className="px-4 py-3 text-center font-bold text-amber-700">{pos.remainingVacancies}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setPositionFilter(pos.id);
                              setActiveSubTab('applicants');
                            }}
                            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              posApplicants.length > 0
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title={`View ${posApplicants.length} applicants for ${pos.name}`}
                          >
                            <Users className="w-3 h-3" />
                            <span>{posApplicants.length}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{pos.closingDate}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              pos.status === 'Filled'
                                ? 'bg-emerald-100 text-emerald-800'
                                : pos.status === 'Interviewing'
                                ? 'bg-purple-100 text-purple-800'
                                : pos.status === 'Closed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {pos.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handleViewPosition(pos)}
                              title="View Position Details"
                              className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditPosition(pos)}
                              title="Edit Position"
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopyPosition(pos)}
                              title="Copy Position"
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenAddApplicantForPosition(pos)}
                              title="Add Application"
                              className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg transition-colors cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeletePosition(pos.id)}
                              title="Delete Position"
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: APPLICANTS (KANBAN & TABLE) */}
      {activeSubTab === 'applicants' && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search applicant by name, email, phone, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500 font-medium">Position:</span>
                <select
                  value={positionFilter}
                  onChange={(e) => setPositionFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white max-w-[220px] truncate"
                >
                  <option value="All">All Positions ({positions.length})</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500 font-medium">Department:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white"
                >
                  <option value="All">All Departments</option>
                  <option value="Academic">Academic</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                </select>
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-500 font-medium">Stage:</span>
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white"
                >
                  <option value="All">All Stages</option>
                  {RECRUITMENT_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() =>
                  handleOpenAddApplicantForPosition(
                    positionFilter !== 'All' ? positions.find((p) => p.id === positionFilter) : undefined
                  )
                }
                className="flex items-center space-x-1 px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer ml-1"
                title="Add applicant to position"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                <span>+ Add Applicant</span>
              </button>
            </div>
          </div>

          {/* Active Position Filter Banner */}
          {positionFilter !== 'All' && (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs text-emerald-900">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-emerald-700" />
                <span>
                  Filtering candidates for position:{' '}
                  <strong>{positions.find((p) => p.id === positionFilter)?.name || positionFilter}</strong>{' '}
                  <span className="text-emerald-700 font-normal">
                    ({filteredApplicants.length} candidate{filteredApplicants.length === 1 ? '' : 's'})
                  </span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleOpenAddApplicantForPosition(positions.find((p) => p.id === positionFilter))
                  }
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                >
                  + Add Applicant to this Position
                </button>
                <button
                  onClick={() => setPositionFilter('All')}
                  className="text-emerald-700 hover:text-emerald-950 font-bold underline cursor-pointer text-xs"
                >
                  Show All Positions
                </button>
              </div>
            </div>
          )}

          {/* Kanban Board View */}
          {applicantViewMode === 'kanban' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start space-x-3.5 min-w-[1300px]">
                {RECRUITMENT_STAGES.map((stage) => {
                  const stageApplicants = filteredApplicants.filter((a) => a.stage === stage);
                  return (
                    <div
                      key={stage}
                      className="w-72 bg-slate-100/70 border border-slate-200/70 rounded-2xl p-3 flex flex-col shrink-0 min-h-[460px]"
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-bold text-slate-800">{stage}</span>
                        <div className="flex items-center space-x-1.5">
                          {stage === 'Applied' && (
                            <button
                              onClick={() =>
                                handleOpenAddApplicantForPosition(
                                  positionFilter !== 'All' ? positions.find((p) => p.id === positionFilter) : undefined
                                )
                              }
                              className="p-1 hover:bg-emerald-100 text-emerald-700 rounded-md transition-colors cursor-pointer"
                              title="Add new applicant"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                            {stageApplicants.length}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[580px] pr-0.5">
                        {stageApplicants.map((app) => (
                          <div
                            key={app.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all text-xs"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-bold text-slate-900">{app.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{app.id}</div>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="text-amber-500 font-bold flex items-center space-x-0.5 text-[11px]">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{app.overallRating.toFixed(1)}</span>
                                </span>
                                <button
                                  onClick={() => handleEditApplicant(app)}
                                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                                  title="Edit Applicant"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-600 mt-1 font-semibold truncate flex items-center space-x-1">
                              <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{app.positionName}</span>
                            </div>

                            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                              <span>Exp: {app.experience} Yrs</span>
                              <span>{app.phone}</span>
                            </div>

                            {/* Stage Transition Quick Actions & Workflow Controls */}
                            <div className="mt-3 pt-2 border-t border-slate-100 space-y-2">
                              {/* Stage Selector (Always available to freely change / revert if wrongly set) */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[10px] text-slate-400 font-medium">Stage:</span>
                                <select
                                  value={app.stage}
                                  onChange={(e) => onUpdateApplicantStage(app.id, e.target.value as RecruitmentStage)}
                                  title="Change / Revert Stage"
                                  className="text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 font-semibold cursor-pointer max-w-[130px]"
                                >
                                  {RECRUITMENT_STAGES.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Offer, Appointment & Convert Actions */}
                              <div className="flex flex-wrap items-center justify-end gap-1 pt-0.5">
                                {/* Offer Letter Action */}
                                {(() => {
                                  const existingOffer = offerLetters.find((o) => o.id === app.offerLetterId || o.applicantId === app.id);
                                  if (existingOffer) {
                                    return (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleOpenEditOffer(existingOffer)}
                                          title="Edit Offer Letter"
                                          className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 cursor-pointer"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                          <span>Edit Offer</span>
                                        </button>
                                        <button
                                          onClick={() => setPreviewOffer(existingOffer)}
                                          title="Preview Offer Letter"
                                          className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 p-1 rounded-md cursor-pointer"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    );
                                  } else if (['Selected', 'Offer Sent', 'Offer Accepted', 'Appointment', 'Joined'].includes(app.stage)) {
                                    return (
                                      <button
                                        onClick={() => handleOpenCreateOffer(app)}
                                        title="Create / Issue Offer Letter"
                                        className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md hover:bg-emerald-200 flex items-center space-x-0.5 cursor-pointer"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        <span>Offer</span>
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Appointment Letter Action */}
                                {(() => {
                                  const existingAppt = appointmentLetters.find((a) => a.id === app.appointmentLetterId || a.applicantId === app.id);
                                  if (existingAppt) {
                                    return (
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleOpenEditAppt(existingAppt)}
                                          title="Edit Appointment Letter"
                                          className="text-[10px] bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 font-bold px-1.5 py-0.5 rounded-md flex items-center space-x-0.5 cursor-pointer"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                          <span>Edit Appt</span>
                                        </button>
                                        <button
                                          onClick={() => setPreviewAppt(existingAppt)}
                                          title="Preview Appointment Letter"
                                          className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 p-1 rounded-md cursor-pointer"
                                        >
                                          <Eye className="w-2.5 h-2.5" />
                                        </button>
                                      </div>
                                    );
                                  } else if (['Offer Sent', 'Offer Accepted', 'Appointment', 'Joined', 'Selected'].includes(app.stage)) {
                                    return (
                                      <button
                                        onClick={() => handleOpenCreateAppt(app)}
                                        title="Create Appointment Letter"
                                        className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded-md hover:bg-teal-200 flex items-center space-x-0.5 cursor-pointer"
                                      >
                                        <Plus className="w-2.5 h-2.5" />
                                        <span>Appt</span>
                                      </button>
                                    );
                                  }
                                  return null;
                                })()}

                                {/* Convert to Staff Button */}
                                {!app.staffId && ['Selected', 'Offer Sent', 'Offer Accepted', 'Appointment', 'Joined'].includes(app.stage) && (
                                  <button
                                    onClick={() => {
                                      const matchingAppt = appointmentLetters.find((a) => a.applicantId === app.id || a.id === app.appointmentLetterId);
                                      onConvertApplicantToStaff(app.id, matchingAppt?.id);
                                    }}
                                    title="Convert this applicant to official Staff directory"
                                    className="text-[10px] bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold px-2 py-0.5 rounded-md transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                                  >
                                    <UserCheck className="w-2.5 h-2.5" />
                                    <span>Convert → Staff</span>
                                  </button>
                                )}
                                {app.staffId && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                                    ✓ Staff: {app.staffId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}

                        {stageApplicants.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-xs">
                            <p className="italic mb-2">No candidates in this stage</p>
                            {stage === 'Applied' && (
                              <button
                                onClick={() =>
                                  handleOpenAddApplicantForPosition(
                                    positionFilter !== 'All' ? positions.find((p) => p.id === positionFilter) : undefined
                                  )
                                }
                                className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer"
                              >
                                <UserPlus className="w-3 h-3 text-emerald-600" />
                                <span>Add First Applicant</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Table View */}
          {applicantViewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Applicant ID</th>
                      <th className="px-4 py-3">Applicant Name</th>
                      <th className="px-4 py-3">Position Applied</th>
                      <th className="px-4 py-3">Contact Details</th>
                      <th className="px-4 py-3">Experience</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3 text-center">Rating</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplicants.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">{app.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{app.name}</div>
                          <div className="text-[10px] text-slate-400">{app.highestQualification}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          <div className="font-semibold">{app.positionName}</div>
                          <div className="text-[10px] text-slate-400">{app.department}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{app.phone}</div>
                          <div className="text-[10px] text-slate-400">{app.email}</div>
                        </td>
                        <td className="px-4 py-3">{app.experience} Years</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col space-y-1">
                            <select
                              value={app.stage}
                              onChange={(e) => onUpdateApplicantStage(app.id, e.target.value as RecruitmentStage)}
                              title="Change / Revert Stage"
                              className={`text-[11px] font-bold rounded-lg px-2 py-1 border transition-all cursor-pointer ${
                                app.stage === 'Joined'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : app.stage === 'Appointment'
                                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                                  : app.stage === 'Offer Accepted'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                  : app.stage === 'Offer Sent'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : app.stage === 'Selected'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : app.stage === 'Rejected'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-slate-50 text-slate-700 border-slate-300'
                              }`}
                            >
                              {RECRUITMENT_STAGES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            {/* Workflow Badges */}
                            <div className="flex items-center flex-wrap gap-1 text-[10px]">
                              {app.offerLetterId && (
                                <span
                                  onClick={() => {
                                    const off = offerLetters.find((o) => o.id === app.offerLetterId || o.applicantId === app.id);
                                    if (off) setPreviewOffer(off);
                                  }}
                                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-1.5 py-0.2 rounded cursor-pointer font-semibold border border-blue-200"
                                  title="Click to preview offer letter"
                                >
                                  Offer ✓
                                </span>
                              )}
                              {app.appointmentLetterId && (
                                <span
                                  onClick={() => {
                                    const ap = appointmentLetters.find((a) => a.id === app.appointmentLetterId || a.applicantId === app.id);
                                    if (ap) setPreviewAppt(ap);
                                  }}
                                  className="bg-teal-50 text-teal-700 hover:bg-teal-100 px-1.5 py-0.2 rounded cursor-pointer font-semibold border border-teal-200"
                                  title="Click to preview appointment letter"
                                >
                                  Appt ✓
                                </span>
                              )}
                              {app.staffId && (
                                <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded font-bold border border-emerald-200">
                                  Staff: {app.staffId}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-500">
                          ★ {app.overallRating.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end flex-wrap gap-1">
                            {/* Offer Letter Action */}
                            {(() => {
                              const existingOffer = offerLetters.find((o) => o.id === app.offerLetterId || o.applicantId === app.id);
                              if (existingOffer) {
                                return (
                                  <div className="flex items-center space-x-0.5">
                                    <button
                                      onClick={() => handleOpenEditOffer(existingOffer)}
                                      title="Edit Offer Letter"
                                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1"
                                    >
                                      <Edit2 className="w-3 h-3 text-blue-600" />
                                      <span>Edit Offer</span>
                                    </button>
                                    <button
                                      onClick={() => setPreviewOffer(existingOffer)}
                                      title="View Offer Letter"
                                      className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              } else if (['Selected', 'Offer Sent', 'Offer Accepted', 'Appointment', 'Joined'].includes(app.stage)) {
                                return (
                                  <button
                                    onClick={() => handleOpenCreateOffer(app)}
                                    title="Create / Issue Offer Letter"
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1"
                                  >
                                    <Plus className="w-3 h-3 text-emerald-600" />
                                    <span>+ Offer</span>
                                  </button>
                                );
                              }
                              return null;
                            })()}

                            {/* Appointment Letter Action */}
                            {(() => {
                              const existingAppt = appointmentLetters.find((a) => a.id === app.appointmentLetterId || a.applicantId === app.id);
                              if (existingAppt) {
                                return (
                                  <div className="flex items-center space-x-0.5">
                                    <button
                                      onClick={() => handleOpenEditAppt(existingAppt)}
                                      title="Edit Appointment Letter"
                                      className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1"
                                    >
                                      <Edit2 className="w-3 h-3 text-teal-600" />
                                      <span>Edit Appt</span>
                                    </button>
                                    <button
                                      onClick={() => setPreviewAppt(existingAppt)}
                                      title="View Appointment Letter"
                                      className="p-1 hover:bg-teal-50 text-teal-600 rounded-lg cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                );
                              } else if (['Offer Sent', 'Offer Accepted', 'Appointment', 'Joined', 'Selected'].includes(app.stage)) {
                                return (
                                  <button
                                    onClick={() => handleOpenCreateAppt(app)}
                                    title="Create Appointment Letter"
                                    className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1"
                                  >
                                    <Plus className="w-3 h-3 text-teal-600" />
                                    <span>+ Appt</span>
                                  </button>
                                );
                              }
                              return null;
                            })()}

                            {/* Convert to Staff Button */}
                            {!app.staffId && ['Selected', 'Offer Sent', 'Offer Accepted', 'Appointment', 'Joined'].includes(app.stage) && (
                              <button
                                onClick={() => {
                                  const matchingAppt = appointmentLetters.find((a) => a.applicantId === app.id || a.id === app.appointmentLetterId);
                                  onConvertApplicantToStaff(app.id, matchingAppt?.id);
                                }}
                                title="Convert this applicant to official Staff directory"
                                className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1"
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>Convert to Staff</span>
                              </button>
                            )}
                            {app.staffId && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold border border-emerald-300">
                                ✓ Staff: {app.staffId}
                              </span>
                            )}

                            <button
                              onClick={() => handleEditApplicant(app)}
                              title="Edit Applicant"
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setIntForm({
                                  applicantId: app.id,
                                  round: 'Round 1 - Screening',
                                  type: 'Online',
                                  date: new Date().toISOString().split('T')[0],
                                  startTime: '10:00 AM',
                                  endTime: '11:00 AM',
                                  locationOrLink: 'https://meet.google.com/mysar-interview',
                                  panelMembers: ['Principal', 'HOD'],
                                  notes: '',
                                });
                                setIsScheduleIntOpen(true);
                              }}
                              title="Schedule Interview"
                              className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-lg cursor-pointer transition-colors"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteApplicant(app.id)}
                              title="Delete Applicant"
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredApplicants.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                          <p className="italic mb-2">No applicants match the current filters.</p>
                          <button
                            onClick={() =>
                              handleOpenAddApplicantForPosition(
                                positionFilter !== 'All' ? positions.find((p) => p.id === positionFilter) : undefined
                              )
                            }
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add New Applicant</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: INTERVIEW MANAGEMENT */}
      {activeSubTab === 'interview' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Interview ID</th>
                    <th className="px-4 py-3">Applicant Name</th>
                    <th className="px-4 py-3">Position & Round</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Type & Location</th>
                    <th className="px-4 py-3">Panel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Evaluation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interviews.map((intItem) => (
                    <tr key={intItem.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{intItem.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{intItem.applicantName}</div>
                        <div className="text-[10px] text-slate-400">{intItem.applicantEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{intItem.positionName}</div>
                        <div className="text-[10px] text-purple-700 font-semibold">{intItem.round}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{intItem.date}</div>
                        <div className="text-[10px] text-slate-400">{intItem.startTime} - {intItem.endTime}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-700">{intItem.type}</span>
                        <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                          {intItem.locationOrLink}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{intItem.panelMembers.join(', ')}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            intItem.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {intItem.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {intItem.evaluation ? (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              {intItem.evaluation.finalDecision} (★{intItem.evaluation.overallPerformance.toFixed(1)})
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {intItem.evaluation.recommendation}
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedInterviewForEval(intItem);
                              setIsEvaluateIntOpen(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer shadow-xs"
                          >
                            Evaluate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: OFFER LETTERS */}
      {activeSubTab === 'offers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Offer Letters Issued</h3>
              <p className="text-xs text-slate-500">
                Track, edit, and dispatch formal institutional offer letters. If applicant stage was wrongly set, you can edit or regenerate offers anytime.
              </p>
            </div>
            {applicants.length > 0 && (
              <button
                onClick={() => {
                  const target = applicants.find((a) => ['Selected', 'Offer Sent', 'Offer Accepted'].includes(a.stage)) || applicants[0];
                  handleOpenCreateOffer(target);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Generate Offer Letter</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Offer Number</th>
                    <th className="px-4 py-3">Candidate Name</th>
                    <th className="px-4 py-3">Position & Dept</th>
                    <th className="px-4 py-3">Joining Date</th>
                    <th className="px-4 py-3">Gross Salary</th>
                    <th className="px-4 py-3">Issue / Expiry</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {offerLetters.map((offer) => (
                    <tr key={offer.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{offer.offerNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{offer.applicantName}</div>
                        <div className="text-[10px] text-slate-400">{offer.applicantPhone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{offer.position}</div>
                        <div className="text-[10px] text-slate-400">{offer.department}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{offer.joiningDate}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        ₹{offer.grossSalary.toLocaleString()} / mo
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-500">
                        <div>Issue: {offer.issueDate}</div>
                        <div className="text-amber-600">Exp: {offer.expiryDate}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            offer.status === 'Accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : offer.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {offer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setPreviewOffer(offer)}
                            title="Preview Letter"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditOffer(offer)}
                            title="Edit Offer Letter"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {offer.status !== 'Accepted' && (
                            <button
                              onClick={() => onUpdateOfferStatus(offer.id, 'Accepted')}
                              title="Mark Accepted"
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteOffer && (
                            <button
                              onClick={() => onDeleteOffer(offer.id)}
                              title="Delete Offer Letter"
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {offerLetters.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                        No offer letters generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: APPOINTMENT LETTERS */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div>
              <h3 className="text-base font-bold text-slate-900">Institutional Appointment Letters</h3>
              <p className="text-xs text-slate-500">
                Official service appointment letters. You can edit appointment terms or convert appointed candidates directly into staff members.
              </p>
            </div>
            {applicants.length > 0 && (
              <button
                onClick={() => {
                  const target = applicants.find((a) => ['Offer Accepted', 'Appointment', 'Offer Sent'].includes(a.stage)) || applicants[0];
                  handleOpenCreateAppt(target);
                }}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Issue Appointment Letter</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Appointment No.</th>
                    <th className="px-4 py-3">Employee Name</th>
                    <th className="px-4 py-3">Assigned ID</th>
                    <th className="px-4 py-3">Designation</th>
                    <th className="px-4 py-3">Joining Date</th>
                    <th className="px-4 py-3">Gross Salary</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointmentLetters.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{appt.appointmentNumber}</td>
                      <td className="px-4 py-3 font-bold text-slate-900">{appt.employeeName}</td>
                      <td className="px-4 py-3 font-bold text-indigo-700">{appt.employeeId}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{appt.position}</div>
                        <div className="text-[10px] text-slate-400">{appt.department}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{appt.joiningDate}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">
                        ₹{appt.grossSalary.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            appt.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-teal-100 text-teal-800'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => setPreviewAppt(appt)}
                            title="Preview Appointment Letter"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditAppt(appt)}
                            title="Edit Appointment Letter"
                            className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {appt.status !== 'Completed' && (
                            <button
                              onClick={() => onConvertApplicantToStaff(appt.applicantId, appt.id)}
                              className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Convert to Staff</span>
                            </button>
                          )}
                          {onDeleteAppointment && (
                            <button
                              onClick={() => onDeleteAppointment(appt.id)}
                              title="Delete Appointment Letter"
                              className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {appointmentLetters.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                        No appointment letters generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VIEW POSITION DETAILS */}
      {isViewPosOpen && selectedPositionForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedPositionForView.name}</h2>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedPositionForView.status === 'Filled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedPositionForView.status === 'Interviewing'
                        ? 'bg-purple-100 text-purple-800'
                        : selectedPositionForView.status === 'Closed'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedPositionForView.status}
                  </span>
                </div>
                <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                  Code: {selectedPositionForView.code} • ID: {selectedPositionForView.id}
                </div>
              </div>
              <button
                onClick={() => setIsViewPosOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Vacancies</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{selectedPositionForView.vacancies}</div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-700">Filled</span>
                <div className="text-lg font-bold text-emerald-900 mt-0.5">{selectedPositionForView.filled}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-amber-700">Remaining</span>
                <div className="text-lg font-bold text-amber-900 mt-0.5">{selectedPositionForView.remainingVacancies}</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-blue-700">Applicants</span>
                <div className="text-lg font-bold text-blue-900 mt-0.5">
                  {applicants.filter((a) => a.positionId === selectedPositionForView.id || a.positionName === selectedPositionForView.name).length}
                </div>
              </div>
            </div>

            {/* Position Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/60 p-4 rounded-xl border border-slate-200/80 mb-4">
              <div>
                <span className="text-slate-400 font-medium">Department & Division:</span>
                <div className="font-semibold text-slate-800">{selectedPositionForView.department} ({selectedPositionForView.division})</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Employment Type:</span>
                <div className="font-semibold text-slate-800">{selectedPositionForView.employmentType}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Job Location:</span>
                <div className="font-semibold text-slate-800">{selectedPositionForView.jobLocation || 'Kochi Campus'}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Salary Bandwidth:</span>
                <div className="font-semibold text-emerald-800">
                  ₹{selectedPositionForView.salaryRange.min.toLocaleString()} – ₹{selectedPositionForView.salaryRange.max.toLocaleString()} / month
                </div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Closing Date:</span>
                <div className="font-semibold text-slate-800">{selectedPositionForView.closingDate}</div>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Experience Required:</span>
                <div className="font-semibold text-slate-800">{selectedPositionForView.experienceRequired || 'Not specified'}</div>
              </div>
            </div>

            {/* Description */}
            {selectedPositionForView.description && (
              <div className="mb-4">
                <h4 className="font-bold text-slate-800 mb-1">Job Description</h4>
                <p className="text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-200/60">
                  {selectedPositionForView.description}
                </p>
              </div>
            )}

            {/* Requirements Bullet Points */}
            <div className="mb-4">
              <h4 className="font-bold text-slate-800 mb-2 flex items-center space-x-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Requirements & Key Prerequisites</span>
              </h4>
              {selectedPositionForView.requirements && selectedPositionForView.requirements.length > 0 ? (
                <ul className="space-y-1.5 bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100">
                  {selectedPositionForView.requirements.map((req, i) => (
                    <li key={i} className="flex items-start space-x-2 text-slate-800">
                      <span className="text-emerald-600 font-bold text-sm leading-4">•</span>
                      <span className="leading-relaxed font-medium">{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  No specific requirements bullet points listed for this position.
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setIsViewPosOpen(false);
                  handleOpenEditPosition(selectedPositionForView);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer flex items-center space-x-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Position</span>
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsViewPosOpen(false)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewPosOpen(false);
                    handleOpenAddApplicantForPosition(selectedPositionForView);
                  }}
                  className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add Application</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT POSITION */}
      {isCreatePosOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingPosId ? 'Edit Position' : 'Create New Position'}
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Define institutional vacancy, requirements (bullet points), and compensation bandwidth.
                </p>
              </div>
              <button
                onClick={() => setIsCreatePosOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-slate-700">Position Name *</label>
                <input
                  type="text"
                  value={posForm.name}
                  onChange={(e) => setPosForm({ ...posForm, name: e.target.value })}
                  placeholder="e.g. Senior Mathematics Teacher"
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Position Code</label>
                <input
                  type="text"
                  value={posForm.code}
                  onChange={(e) => setPosForm({ ...posForm, code: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Department</label>
                <select
                  value={posForm.department}
                  onChange={(e) => setPosForm({ ...posForm, department: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                >
                  <option value="Academic">Academic</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="IT">IT</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Number of Vacancies</label>
                <input
                  type="number"
                  min={1}
                  value={posForm.vacancies}
                  onChange={(e) => setPosForm({ ...posForm, vacancies: parseInt(e.target.value) || 1 })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Employment Type</label>
                <select
                  value={posForm.employmentType}
                  onChange={(e) => setPosForm({ ...posForm, employmentType: e.target.value as EmploymentType })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                >
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Temporary">Temporary</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Closing Date</label>
                <input
                  type="date"
                  value={posForm.closingDate}
                  onChange={(e) => setPosForm({ ...posForm, closingDate: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Salary Range (₹ Min – Max)</label>
                <div className="flex items-center space-x-2 mt-1">
                  <input
                    type="number"
                    step={1000}
                    placeholder="Min (e.g. 30000)"
                    value={posForm.salaryRange?.min ?? 30000}
                    onChange={(e) =>
                      setPosForm({
                        ...posForm,
                        salaryRange: {
                          currency: 'INR',
                          max: posForm.salaryRange?.max ?? 45000,
                          min: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-1/2 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                  <span className="text-slate-400 font-bold">–</span>
                  <input
                    type="number"
                    step={1000}
                    placeholder="Max (e.g. 45000)"
                    value={posForm.salaryRange?.max ?? 45000}
                    onChange={(e) =>
                      setPosForm({
                        ...posForm,
                        salaryRange: {
                          currency: 'INR',
                          min: posForm.salaryRange?.min ?? 30000,
                          max: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-1/2 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Job Location</label>
                <input
                  type="text"
                  value={posForm.jobLocation || 'Kochi Campus'}
                  onChange={(e) => setPosForm({ ...posForm, jobLocation: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700">Job Description</label>
                <textarea
                  rows={2}
                  value={posForm.description}
                  onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
                  placeholder="Outline key expectations, syllabus coverage, and institutional duties..."
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </div>

              {/* REQUIREMENTS SECTION (BULLET POINTS) */}
              <div className="md:col-span-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <span>Requirements / Eligibility Criteria (Bullet Points)</span>
                    <span className="text-slate-400 font-normal">
                      ({(posForm.requirements || []).length} items)
                    </span>
                  </label>
                </div>

                {/* Input to add a new requirement bullet point */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-emerald-600 font-bold">•</span>
                    <input
                      type="text"
                      placeholder="Add a requirement bullet point (e.g. Master's in relevant discipline with 2+ yrs experience)..."
                      value={newReqBullet}
                      onChange={(e) => setNewReqBullet(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddRequirementBullet();
                        }
                      }}
                      className="w-full pl-6 pr-3 py-2 border border-slate-200 rounded-xl text-slate-900 focus:outline-emerald-600 text-xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRequirementBullet}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-2xs text-xs whitespace-nowrap"
                  >
                    + Add Bullet
                  </button>
                </div>

                {/* List of Requirement Bullet Points */}
                <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto">
                  {(posForm.requirements || []).map((req, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 rounded-xl p-2.5 transition-colors group"
                    >
                      <div className="flex items-start space-x-2.5 text-slate-800 text-xs pr-2">
                        <span className="text-emerald-600 font-black text-sm leading-4 shrink-0">•</span>
                        <span className="font-medium leading-relaxed">{req}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveRequirementBullet(idx)}
                        title="Remove requirement bullet"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-white transition-colors cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(!posForm.requirements || posForm.requirements.length === 0) && (
                    <div className="text-center py-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs italic">
                      No requirements added yet. Enter a requirement above and click "+ Add Bullet".
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                You can add candidate applications immediately after saving.
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsCreatePosOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!posForm.name) {
                      alert('Please provide a position name');
                      return;
                    }
                    const newPosId =
                      editingPosId || posForm.id || `POS-2026-${String(positions.length + 1).padStart(3, '0')}`;
                    const fullPos: Partial<Position> = {
                      ...posForm,
                      id: newPosId,
                      filled: posForm.filled || 0,
                      remainingVacancies: Math.max(0, (posForm.vacancies || 1) - (posForm.filled || 0)),
                    };
                    onSavePosition(fullPos);
                    setIsCreatePosOpen(false);
                    // Automatically open Add Applicant modal pre-selected for this position!
                    handleOpenAddApplicantForPosition(fullPos as Position);
                  }}
                  className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer flex items-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{editingPosId ? 'Save & Add Applicant' : 'Create & Add Applicant'}</span>
                </button>
                <button
                  onClick={() => {
                    if (!posForm.name) {
                      alert('Please provide a position name');
                      return;
                    }
                    const newPosId =
                      editingPosId || posForm.id || `POS-2026-${String(positions.length + 1).padStart(3, '0')}`;
                    const fullPos: Partial<Position> = {
                      ...posForm,
                      id: newPosId,
                      filled: posForm.filled || 0,
                      remainingVacancies: Math.max(0, (posForm.vacancies || 1) - (posForm.filled || 0)),
                    };
                    onSavePosition(fullPos);
                    setIsCreatePosOpen(false);
                    setToastMessage(
                      editingPosId
                        ? `Position "${fullPos.name}" updated successfully!`
                        : `Position "${fullPos.name}" created! You can now add applications using the + icon.`
                    );
                    setTimeout(() => setToastMessage(null), 6000);
                  }}
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  {editingPosId ? 'Update Position' : 'Create Position'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT APPLICANT */}
      {isAddApplicantOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingApplicantId ? 'Edit Candidate Application' : 'Add Candidate Application'}
                </h2>
                <p className="text-slate-500 mt-0.5">
                  Link candidate profile, qualifications, and credentials to an institutional vacancy.
                </p>
              </div>
              <button
                onClick={() => setIsAddApplicantOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Position Selection */}
              <div>
                <label className="font-semibold text-slate-800 block mb-1">
                  Target Position *
                </label>
                <select
                  value={applicantForm.positionId || ''}
                  onChange={(e) => {
                    const posId = e.target.value;
                    const targetPos = positions.find((p) => p.id === posId);
                    if (targetPos) {
                      setApplicantForm((prev) => ({
                        ...prev,
                        positionId: targetPos.id,
                        positionName: targetPos.name,
                        department: targetPos.department,
                        expectedSalary: prev.expectedSalary || targetPos.salaryRange.min,
                        skills: targetPos.skills?.length
                          ? Array.from(new Set([...(prev.skills || []), ...targetPos.skills]))
                          : prev.skills,
                      }));
                    } else {
                      setApplicantForm((prev) => ({ ...prev, positionId: posId }));
                    }
                  }}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-medium focus:outline-emerald-600"
                >
                  <option value="">-- Choose Position --</option>
                  {positions.map((pos) => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name} ({pos.code}) — {pos.department} [{pos.remainingVacancies} open / {pos.vacancies} total]
                    </option>
                  ))}
                </select>

                {/* Selected Position Quick Info */}
                {(() => {
                  const selPos = positions.find((p) => p.id === applicantForm.positionId);
                  if (!selPos) return null;
                  return (
                    <div className="mt-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between flex-wrap gap-2 text-[11px]">
                      <div>
                        <div className="font-bold text-emerald-950 flex items-center space-x-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{selPos.name}</span>
                          <span className="font-mono bg-emerald-200 text-emerald-900 px-1 rounded text-[10px]">
                            {selPos.code}
                          </span>
                        </div>
                        <div className="text-emerald-800 mt-0.5">
                          Dept: {selPos.department} • Type: {selPos.employmentType} • Location: {selPos.jobLocation}
                        </div>
                      </div>
                      <div className="text-right text-emerald-900 font-medium">
                        <div>Salary Band: ₹{selPos.salaryRange.min.toLocaleString()} - ₹{selPos.salaryRange.max.toLocaleString()}</div>
                        <div className="text-emerald-700 font-bold">{selPos.remainingVacancies} Vacancies Remaining</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Personal & Contact Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700">Applicant Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anjali Menon"
                    value={applicantForm.name || ''}
                    onChange={(e) => setApplicantForm({ ...applicantForm, name: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. anjali.menon@example.com"
                    value={applicantForm.email || ''}
                    onChange={(e) => setApplicantForm({ ...applicantForm, email: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 98470 12345"
                    value={applicantForm.phone || ''}
                    onChange={(e) => setApplicantForm({ ...applicantForm, phone: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Current Organization / School / Institute</label>
                  <input
                    type="text"
                    placeholder="e.g. St. Thomas Academy / TCS / Freelance"
                    value={applicantForm.currentCompanyOrSchool || ''}
                    onChange={(e) => setApplicantForm({ ...applicantForm, currentCompanyOrSchool: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-emerald-600"
                  />
                </div>
              </div>

              {/* Qualifications & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700">Highest Qualification</label>
                  <select
                    value={applicantForm.highestQualification || ''}
                    onChange={(e) => setApplicantForm({ ...applicantForm, highestQualification: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Post Graduate / Master's Degree">Post Graduate / Master's Degree (M.Sc / M.A / M.Tech / MBA / M.Ed)</option>
                    <option value="Bachelor's Degree">Bachelor's Degree (B.Sc / B.A / B.Com / B.Tech / B.Ed)</option>
                    <option value="Doctorate / Ph.D">Doctorate / Ph.D</option>
                    <option value="Diploma / Polytechnic">Diploma / Polytechnic</option>
                    <option value="Higher Secondary / Intermediate">Higher Secondary (12th / Plus Two)</option>
                    <option value="Professional Certification">Professional Certification (CA / CMA / CS / PMP)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Total Experience (Years)</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={applicantForm.experience ?? 2}
                    onChange={(e) => setApplicantForm({ ...applicantForm, experience: Number(e.target.value) || 0 })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="font-semibold text-slate-700">Key Skills & Competencies</label>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="text"
                      placeholder="Add a skill (e.g. Digital Marketing, SEO, Mathematics, Python)..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (skillInput.trim()) {
                            const trimmed = skillInput.trim();
                            if (!applicantForm.skills?.includes(trimmed)) {
                              setApplicantForm({
                                ...applicantForm,
                                skills: [...(applicantForm.skills || []), trimmed],
                              });
                            }
                            setSkillInput('');
                          }
                        }
                      }}
                      className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (skillInput.trim()) {
                          const trimmed = skillInput.trim();
                          if (!applicantForm.skills?.includes(trimmed)) {
                            setApplicantForm({
                              ...applicantForm,
                              skills: [...(applicantForm.skills || []), trimmed],
                            });
                          }
                          setSkillInput('');
                        }
                      }}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Skills badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(applicantForm.skills || []).map((sk) => (
                      <span
                        key={sk}
                        className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-full text-[11px] font-medium border border-slate-200"
                      >
                        <span>{sk}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setApplicantForm({
                              ...applicantForm,
                              skills: applicantForm.skills?.filter((s) => s !== sk),
                            });
                          }}
                          className="text-slate-400 hover:text-rose-600 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="font-semibold text-slate-700">Application Date</label>
                  <input
                    type="date"
                    value={applicantForm.applicationDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setApplicantForm({ ...applicantForm, applicationDate: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Notice Period</label>
                  <select
                    value={applicantForm.noticePeriod || 'Immediate'}
                    onChange={(e) => setApplicantForm({ ...applicantForm, noticePeriod: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Immediate">Immediate Joiner</option>
                    <option value="15 Days">15 Days</option>
                    <option value="30 Days">30 Days (1 Month)</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days (2 Months)</option>
                    <option value="90 Days">90 Days (3 Months)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Initial Stage</label>
                  <select
                    value={applicantForm.stage || 'Applied'}
                    onChange={(e) => setApplicantForm({ ...applicantForm, stage: e.target.value as RecruitmentStage })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    {RECRUITMENT_STAGES.map((stg) => (
                      <option key={stg} value={stg}>
                        {stg}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Initial Candidate Rating</label>
                  <div className="flex items-center space-x-1.5 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setApplicantForm({ ...applicantForm, overallRating: star })}
                        className="cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${
                            star <= (applicantForm.overallRating || 4)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-1">
                      {(applicantForm.overallRating || 4.0).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes / Remarks */}
              <div className="pt-1 border-t border-slate-100">
                <label className="font-semibold text-slate-700">Initial Notes / Resume Summary / Portfolio URL</label>
                <textarea
                  rows={2}
                  placeholder="Notes from resume screening, portfolio link, referral info..."
                  value={applicantForm.notes || ''}
                  onChange={(e) => setApplicantForm({ ...applicantForm, notes: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsAddApplicantOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveApplicantSubmit}
                className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>{editingApplicantId ? 'Update Application' : 'Save Application'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE INTERVIEW */}
      {isScheduleIntOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl border border-slate-200 text-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Schedule Interview Round</h2>
            <p className="text-slate-500 mb-4">Set panel, meeting venue / Google Meet link, and slot.</p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Select Applicant</label>
                <select
                  value={intForm.applicantId}
                  onChange={(e) => {
                    const app = applicants.find((a) => a.id === e.target.value);
                    setIntForm({
                      ...intForm,
                      applicantId: e.target.value,
                      applicantName: app?.name,
                      applicantEmail: app?.email,
                      positionId: app?.positionId,
                      positionName: app?.positionName,
                      department: app?.department,
                    });
                  }}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                >
                  {applicants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.positionName}) - Currently: {a.stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Interview Round</label>
                  <select
                    value={intForm.round}
                    onChange={(e) => setIntForm({ ...intForm, round: e.target.value as InterviewRound })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Round 1 - Screening">Round 1 - Screening</option>
                    <option value="Round 2 - Technical / Demo Class">Round 2 - Technical / Demo Class</option>
                    <option value="Round 3 - Principal / Final Panel">Round 3 - Principal / Final Panel</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Interview Type</label>
                  <select
                    value={intForm.type}
                    onChange={(e) => setIntForm({ ...intForm, type: e.target.value as InterviewType })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Online">Online (Google Meet)</option>
                    <option value="Offline">Offline (Campus)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Date</label>
                  <input
                    type="date"
                    value={intForm.date}
                    onChange={(e) => setIntForm({ ...intForm, date: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Start Time</label>
                  <input
                    type="text"
                    value={intForm.startTime}
                    onChange={(e) => setIntForm({ ...intForm, startTime: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">End Time</label>
                  <input
                    type="text"
                    value={intForm.endTime}
                    onChange={(e) => setIntForm({ ...intForm, endTime: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Meeting Link / Room Location</label>
                <input
                  type="text"
                  value={intForm.locationOrLink}
                  onChange={(e) => setIntForm({ ...intForm, locationOrLink: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsScheduleIntOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onScheduleInterview(intForm);
                  setIsScheduleIntOpen(false);
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INTERVIEW EVALUATION (1-5 STARS) */}
      {isEvaluateIntOpen && selectedInterviewForEval && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-slate-200 text-xs max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              Interview Evaluation: {selectedInterviewForEval.applicantName}
            </h2>
            <p className="text-slate-500 mb-4">
              {selectedInterviewForEval.positionName} • {selectedInterviewForEval.round}
            </p>

            {/* 1-5 Star Criteria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Communication & Delivery', key: 'communication' },
                { label: 'Technical & Pedagogy', key: 'technicalKnowledge' },
                { label: 'Subject Matter Mastery', key: 'subjectKnowledge' },
                { label: 'Experience Alignment', key: 'experience' },
                { label: 'Problem Solving', key: 'problemSolving' },
                { label: 'Leadership', key: 'leadership' },
                { label: 'Teamwork & Culture Fit', key: 'teamwork' },
              ].map(({ label, key }) => {
                const currentVal = (evalForm as any)[key] || 3;
                return (
                  <div key={key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="flex justify-between items-center mb-1.5 font-semibold text-slate-700">
                      <span>{label}</span>
                      <span className="text-amber-600 font-bold">{currentVal} / 5</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => {
                            setEvalForm({ ...evalForm, [key]: star });
                          }}
                          className="p-1 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= currentVal
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Notes & Decisions */}
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Candidate Strengths</label>
                <input
                  type="text"
                  value={evalForm.strengths}
                  onChange={(e) => setEvalForm({ ...evalForm, strengths: e.target.value })}
                  placeholder="e.g. Excellent blackboard work, crisp explanation of Calculus concepts"
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Recommendation</label>
                  <select
                    value={evalForm.recommendation}
                    onChange={(e) => setEvalForm({ ...evalForm, recommendation: e.target.value as any })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Strongly Recommend">Strongly Recommend</option>
                    <option value="Recommend">Recommend</option>
                    <option value="Hold">Hold</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Final Decision</label>
                  <select
                    value={evalForm.finalDecision}
                    onChange={(e) => setEvalForm({ ...evalForm, finalDecision: e.target.value as any })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Selected">Selected</option>
                    <option value="Further Interview Required">Further Interview Required</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsEvaluateIntOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onSaveInterviewEvaluation(selectedInterviewForEval.id, evalForm);
                  setIsEvaluateIntOpen(false);
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Evaluation & Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE OFFER LETTER */}
      {isGenerateOfferOpen && selectedApplicantForOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-xl border border-slate-200 text-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              {editingOfferId ? 'Edit Offer Letter: ' : 'Generate Offer Letter: '}
              {offerForm.applicantName || selectedApplicantForOffer.name}
            </h2>
            <p className="text-slate-500 mb-4">
              {offerForm.position || selectedApplicantForOffer.positionName} • {offerForm.department || selectedApplicantForOffer.department}
            </p>

            <div className="space-y-3">
              {!editingOfferId && applicants.length > 1 && (
                <div>
                  <label className="font-semibold text-slate-700">Applicant / Candidate</label>
                  <select
                    value={selectedApplicantForOffer.id}
                    onChange={(e) => {
                      const app = applicants.find((a) => a.id === e.target.value);
                      if (app) handleOpenCreateOffer(app);
                    }}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-medium"
                  >
                    {applicants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.positionName} - {a.stage})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Basic Salary (₹ / Month)</label>
                  <input
                    type="number"
                    value={offerForm.basicSalary}
                    onChange={(e) => setOfferForm({ ...offerForm, basicSalary: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Total Allowances (₹ / Month)</label>
                    <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {(offerForm.allowanceItems || []).length} Components
                    </span>
                  </div>
                  <input
                    type="number"
                    value={offerForm.allowances}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setOfferForm({ ...offerForm, allowances: val });
                    }}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              {/* MULTIPLE ALLOWANCES COMPONENT BUILDER */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="font-bold text-slate-800 text-xs">
                      Multiple Allowances (Room, Transportation, Overtime, etc.)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddOfferAllowance('Custom Allowance', 2000)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center space-x-1 cursor-pointer bg-white px-2 py-0.5 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Allowance</span>
                  </button>
                </div>

                {/* Quick Add Chips */}
                <div className="flex items-center flex-wrap gap-1.5 pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Quick Add:</span>
                  {[
                    { label: '+ Room Allowance', name: 'Room Allowance', amount: 5000 },
                    { label: '+ Transportation', name: 'Transportation', amount: 4000 },
                    { label: '+ Over time', name: 'Over time', amount: 3000 },
                    { label: '+ Food / Meal', name: 'Food Allowance', amount: 2500 },
                    { label: '+ Medical Allowance', name: 'Medical Allowance', amount: 2000 },
                    { label: '+ Special Allowance', name: 'Special Allowance', amount: 2000 },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAddOfferAllowance(preset.name, preset.amount)}
                      className="text-[10px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Dynamic Allowance Rows */}
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {(offerForm.allowanceItems || []).length === 0 ? (
                    <div className="text-center py-2.5 text-[11px] text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
                      No individual allowances added. Click a &quot;Quick Add&quot; chip above or &quot;Add Allowance&quot; to specify Room, Transportation, Overtime, etc.
                    </div>
                  ) : (
                    (offerForm.allowanceItems || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border border-slate-200"
                      >
                        <input
                          type="text"
                          value={item.name}
                          placeholder="Allowance Name (e.g. Room Allowance)"
                          onChange={(e) => handleUpdateOfferAllowance(item.id, { name: e.target.value })}
                          className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-emerald-500"
                        />
                        <div className="relative w-32">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                            ₹
                          </span>
                          <input
                            type="number"
                            value={item.amount}
                            placeholder="Amount"
                            onChange={(e) =>
                              handleUpdateOfferAllowance(item.id, { amount: parseInt(e.target.value) || 0 })
                            }
                            className="w-full border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs text-slate-900 font-semibold focus:outline-emerald-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOfferAllowance(item.id)}
                          title="Remove Allowance"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-500">
                    Subtotal of {offerForm.allowanceItems?.length || 0} allowances:
                  </span>
                  <span className="font-bold text-slate-900">
                    ₹{(offerForm.allowances || 0).toLocaleString('en-IN')} / mo
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-900 font-bold flex justify-between">
                <span>Calculated Gross Compensation:</span>
                <span>₹{((offerForm.basicSalary || 0) + (offerForm.allowances || 0)).toLocaleString('en-IN')} / mo</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Business / Product</label>
                  <input
                    type="text"
                    value={offerForm.businessOrProduct || 'MYSAR / Casbiro'}
                    placeholder="MYSAR / Casbiro / Both"
                    onChange={(e) => setOfferForm({ ...offerForm, businessOrProduct: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Reporting To</label>
                  <input
                    type="text"
                    value={offerForm.reportingTo || 'Reporting Manager / Department Head'}
                    placeholder="Reporting Manager / Department Head"
                    onChange={(e) => setOfferForm({ ...offerForm, reportingTo: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Work Location</label>
                  <input
                    type="text"
                    value={offerForm.workLocation || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021'}
                    onChange={(e) => setOfferForm({ ...offerForm, workLocation: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Employment Type</label>
                  <select
                    value={offerForm.employmentType || 'Full-Time'}
                    onChange={(e) => setOfferForm({ ...offerForm, employmentType: e.target.value as any })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Joining Date</label>
                  <input
                    type="date"
                    value={offerForm.joiningDate}
                    onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Offer Expiry Date</label>
                  <input
                    type="date"
                    value={offerForm.expiryDate}
                    onChange={(e) => setOfferForm({ ...offerForm, expiryDate: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Reporting Person / Dept on Joining</label>
                  <input
                    type="text"
                    value={offerForm.reportingPerson || 'Department Head / HR Operations'}
                    placeholder="Reporting Person / Department"
                    onChange={(e) => setOfferForm({ ...offerForm, reportingPerson: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Reporting Time on Joining</label>
                  <input
                    type="text"
                    value={offerForm.reportingTime || '09:30 AM'}
                    placeholder="e.g. 09:30 AM"
                    onChange={(e) => setOfferForm({ ...offerForm, reportingTime: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Training Period</label>
                  <input
                    type="text"
                    value={offerForm.trainingPeriod || '30 Days'}
                    placeholder="e.g. 30 Days / 1 Month"
                    onChange={(e) => setOfferForm({ ...offerForm, trainingPeriod: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Probation Period</label>
                  <select
                    value={offerForm.probationPeriod || '3 Months'}
                    onChange={(e) => setOfferForm({ ...offerForm, probationPeriod: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Month">1 Month</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Notice Period</label>
                  <select
                    value={offerForm.noticePeriod || '30 Days'}
                    onChange={(e) => setOfferForm({ ...offerForm, noticePeriod: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="60 Days">60 Days</option>
                    <option value="90 Days">90 Days</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Working Hours & Days</label>
                  <input
                    type="text"
                    value={offerForm.workingHours || '09:30 AM to 06:00 PM (Monday to Saturday)'}
                    onChange={(e) => setOfferForm({ ...offerForm, workingHours: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Employee Residential Address</label>
                  <input
                    type="text"
                    value={offerForm.employeeAddress || selectedApplicantForOffer.location || 'Door No. 18/52, Green Meadows'}
                    placeholder="Candidate Address"
                    onChange={(e) => setOfferForm({ ...offerForm, employeeAddress: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsGenerateOfferOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onGenerateOffer({
                    id: editingOfferId || undefined,
                    applicantId: selectedApplicantForOffer.id,
                    applicantName: offerForm.applicantName || selectedApplicantForOffer.name,
                    applicantEmail: offerForm.applicantEmail || selectedApplicantForOffer.email,
                    applicantPhone: offerForm.applicantPhone || selectedApplicantForOffer.phone,
                    position: offerForm.position || selectedApplicantForOffer.positionName,
                    department: offerForm.department || selectedApplicantForOffer.department,
                    ...offerForm,
                  });
                  setIsGenerateOfferOpen(false);
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                {editingOfferId ? 'Save Changes' : 'Generate & Dispatch Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GENERATE / EDIT APPOINTMENT LETTER */}
      {isGenerateApptOpen && selectedApplicantForAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-slate-200 text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingApptId ? 'Edit Appointment Letter: ' : 'Generate Appointment Letter: '}
                  {apptForm.employeeName || selectedApplicantForAppt.name}
                </h2>
                <p className="text-slate-500 mt-0.5">
                  {apptForm.position || selectedApplicantForAppt.positionName} • {apptForm.department || selectedApplicantForAppt.department}
                </p>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg border border-teal-200">
                Official Institutional Letter
              </span>
            </div>

            <div className="space-y-4 mt-4">
              {!editingApptId && applicants.length > 1 && (
                <div>
                  <label className="font-semibold text-slate-700">Select Candidate / Appointee</label>
                  <select
                    value={selectedApplicantForAppt.id}
                    onChange={(e) => {
                      const app = applicants.find((a) => a.id === e.target.value);
                      if (app) handleOpenCreateAppt(app);
                    }}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-medium"
                  >
                    {applicants.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.positionName} - {a.stage})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Employee & Designation Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Employee Full Legal Name</label>
                  <input
                    type="text"
                    value={apptForm.employeeName || ''}
                    onChange={(e) => setApptForm({ ...apptForm, employeeName: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Assigned Institutional Employee ID</label>
                  <input
                    type="text"
                    value={apptForm.employeeId || ''}
                    placeholder="e.g. EMP-2026-088"
                    onChange={(e) => setApptForm({ ...apptForm, employeeId: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-bold text-indigo-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Designation / Role</label>
                  <input
                    type="text"
                    value={apptForm.position || ''}
                    onChange={(e) => setApptForm({ ...apptForm, position: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Department</label>
                  <input
                    type="text"
                    value={apptForm.department || ''}
                    onChange={(e) => setApptForm({ ...apptForm, department: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Division / Wing</label>
                  <input
                    type="text"
                    value={apptForm.division || 'Academic Wing'}
                    onChange={(e) => setApptForm({ ...apptForm, division: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Salary & Allowances */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
                    <span>Remuneration & Monthly Allowances</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">Gross Monthly Remuneration:</span>
                    <span className="ml-1.5 text-xs font-extrabold text-emerald-700">
                      ₹{((apptForm.basicSalary || 0) + (apptForm.allowances || 0)).toLocaleString()} / mo
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700">Basic Monthly Salary (₹)</label>
                    <input
                      type="number"
                      value={apptForm.basicSalary || 0}
                      onChange={(e) => setApptForm({ ...apptForm, basicSalary: parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700">Total Monthly Allowances (₹)</label>
                    <input
                      type="number"
                      value={apptForm.allowances || 0}
                      onChange={(e) => setApptForm({ ...apptForm, allowances: parseInt(e.target.value) || 0 })}
                      className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-slate-100 font-semibold"
                    />
                  </div>
                </div>

                {/* Multiple Allowances Items */}
                <div className="space-y-2 pt-2 border-t border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-700">
                      Detailed Allowance Components:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => handleAddApptAllowance('Room Allowance', 6000)}
                        className="text-[10px] bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer font-medium"
                      >
                        + Room (₹6K)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddApptAllowance('Transportation', 4000)}
                        className="text-[10px] bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer font-medium"
                      >
                        + Travel (₹4K)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddApptAllowance('Over time', 2000)}
                        className="text-[10px] bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer font-medium"
                      >
                        + OT (₹2K)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddApptAllowance('Special Allowance', 3000)}
                        className="text-[10px] bg-white hover:bg-teal-50 text-teal-800 border border-slate-200 rounded-md px-1.5 py-0.5 cursor-pointer font-medium"
                      >
                        + Special (₹3K)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(apptForm.allowanceItems || []).map((item) => (
                      <div key={item.id} className="flex items-center space-x-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleUpdateApptAllowance(item.id, { name: e.target.value })}
                          placeholder="Allowance description"
                          className="flex-1 px-2 py-1 text-slate-800 text-xs border border-slate-100 rounded-lg"
                        />
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400 font-medium">₹</span>
                          <input
                            type="number"
                            value={item.amount}
                            onChange={(e) => handleUpdateApptAllowance(item.id, { amount: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 text-slate-800 font-bold text-xs border border-slate-100 rounded-lg text-right"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveApptAllowance(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Appointment Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Joining Date</label>
                  <input
                    type="date"
                    value={apptForm.joiningDate || ''}
                    onChange={(e) => setApptForm({ ...apptForm, joiningDate: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Probation Period</label>
                  <select
                    value={apptForm.probationPeriod || '6 Months'}
                    onChange={(e) => setApptForm({ ...apptForm, probationPeriod: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="3 Months">3 Months</option>
                    <option value="6 Months">6 Months</option>
                    <option value="1 Year">1 Year</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Employment Type</label>
                  <select
                    value={apptForm.employmentType || 'Full Time'}
                    onChange={(e) => setApptForm({ ...apptForm, employmentType: e.target.value as any })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Part Time">Part Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Working Hours & Days</label>
                  <input
                    type="text"
                    value={apptForm.workingHours || '8:15 AM – 4:00 PM (Monday to Friday)'}
                    onChange={(e) => setApptForm({ ...apptForm, workingHours: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Workplace / Campus</label>
                  <input
                    type="text"
                    value={apptForm.workplace || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021'}
                    onChange={(e) => setApptForm({ ...apptForm, workplace: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Responsibilities */}
              <div>
                <label className="font-semibold text-slate-700">Institutional Key Responsibilities (One per line)</label>
                <textarea
                  rows={3}
                  value={(apptForm.responsibilities || []).join('\n')}
                  onChange={(e) =>
                    setApptForm({
                      ...apptForm,
                      responsibilities: e.target.value.split('\n').filter((l) => l.trim()),
                    })
                  }
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-slate-900 bg-white font-mono text-[11px]"
                />
              </div>

              {/* Terms & Conditions */}
              <div>
                <label className="font-semibold text-slate-700">Institutional Terms & Conditions</label>
                <textarea
                  rows={2}
                  value={apptForm.termsAndConditions || ''}
                  onChange={(e) => setApptForm({ ...apptForm, termsAndConditions: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl p-2.5 text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsGenerateApptOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const gross = (apptForm.basicSalary || 0) + (apptForm.allowances || 0);
                  onGenerateAppointment({
                    ...apptForm,
                    grossSalary: gross,
                    id: editingApptId || undefined,
                    applicantId: selectedApplicantForAppt.id,
                  });
                  setIsGenerateApptOpen(false);
                }}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center space-x-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>{editingApptId ? 'Save Changes' : 'Generate & Issue Appointment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW OFFER LETTER */}
      {previewOffer && (() => {
        const sal = calculateOfferSalaryBreakdown(previewOffer);
        const training = getOfferTrainingPeriod(previewOffer.joiningDate, previewOffer.trainingPeriod);
        const issueDateStr = formatOfferLetterDate(previewOffer.issueDate);
        const joiningDateStr = formatOfferLetterDate(previewOffer.joiningDate);
        const employeeName = previewOffer.applicantName || '[Employee Name]';
        const designation = previewOffer.position || '[Designation]';
        const departmentName = previewOffer.department || '[Department Name]';
        const businessProduct = previewOffer.businessOrProduct || 'MYSAR / Casbiro / Both';
        const reportingTo = previewOffer.reportingTo || 'Reporting Manager / Department Head';
        const workLocation = previewOffer.workLocation || 'Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021';
        const employmentType = previewOffer.employmentType || 'Full-Time';
        const reportingPerson = previewOffer.reportingPerson || 'Reporting Person / Department';
        const reportingTime = previewOffer.reportingTime || '09:30 AM';
        const probationPeriod = previewOffer.probationPeriod || '3 / 6 Months';
        const noticePeriod = previewOffer.noticePeriod || '30 Days';
        const employeeAddress = previewOffer.employeeAddress || 'Door No. 18/52, Green Meadows';
        const cityStatePin = previewOffer.cityStatePin || 'Kakkanad, Kochi, Kerala – 682021';
        const workingDays = previewOffer.workingHours?.includes('Friday') ? 'Monday to Friday' : 'Monday to Saturday';
        const workingHours = previewOffer.workingHours || '09:30 AM to 06:00 PM';

        const copyOfferLetterText = () => {
          const text = getOfferLetterMarkdownText(previewOffer);
          navigator.clipboard.writeText(text);
          setCopiedOfferLetter(true);
          setTimeout(() => setCopiedOfferLetter(false), 2500);
        };

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
              {/* Modal Top Toolbar (Non-printable) */}
              <div className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  <span className="font-bold text-sm tracking-wide">Casbiro Solutions – Official Offer Letter</span>
                  <span className="text-xs text-slate-400 font-mono hidden sm:inline">({previewOffer.offerNumber})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyOfferLetterText}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
                  >
                    {copiedOfferLetter ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOfferLetter ? 'Copied!' : 'Copy Letter Text'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={() => setPreviewOffer(null)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Document Scrollable Area */}
              <div className="overflow-y-auto flex-1 p-6 sm:p-10 md:p-12 text-slate-800 text-[13px] leading-relaxed bg-white font-sans selection:bg-emerald-100">
                <div id="casbiro-offer-doc" className="max-w-3xl mx-auto space-y-6">
                  {/* Company Header */}
                  <div className="border-b-2 border-slate-900 pb-5">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-slate-950 uppercase font-serif">
                      CASBIRO SOLUTIONS PRIVATE LIMITED
                    </h1>
                    <div className="text-base font-bold text-slate-700 uppercase tracking-wider mt-1">
                      Offer Letter
                    </div>
                  </div>

                  {/* Date & Ref */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs font-medium text-slate-700 gap-1 pt-1">
                    <div>
                      <span className="font-bold text-slate-900">Date:</span> {issueDateStr}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Offer Letter No.:</span> {previewOffer.offerNumber}
                    </div>
                  </div>

                  {/* To Address */}
                  <div className="pt-2 space-y-1 text-xs">
                    <h3 className="font-bold text-slate-900 text-sm">To,</h3>
                    <div className="font-bold text-slate-900 text-sm">{employeeName}</div>
                    <div className="text-slate-700">{employeeAddress}</div>
                    <div className="text-slate-700">{cityStatePin}</div>
                  </div>

                  {/* Subject */}
                  <div className="pt-2">
                    <h3 className="font-bold text-slate-950 text-sm underline decoration-slate-400 decoration-1 underline-offset-4">
                      Subject: Offer of Employment
                    </h3>
                  </div>

                  {/* Greeting & Introductory Offer */}
                  <div className="space-y-3">
                    <p>
                      Dear <strong className="font-bold text-slate-950">{employeeName}</strong>,
                    </p>
                    <p className="text-justify">
                      We are pleased to offer you employment with <strong className="font-bold text-slate-950">Casbiro Solutions Private Limited</strong> for the position of <strong className="font-bold text-slate-950">{designation}</strong>, based on the discussions and understanding between you and the company.
                    </p>
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 my-2 text-xs space-y-1.5">
                      <div className="font-bold text-slate-800 mb-2">You will be associated with:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                        <div>
                          <span className="font-bold text-slate-900">Business / Product:</span> {businessProduct}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Department:</span> {departmentName}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Designation:</span> {designation}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Reporting To:</span> {reportingTo}
                        </div>
                        <div className="sm:col-span-2">
                          <span className="font-bold text-slate-900">Work Location:</span> {workLocation}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900">Employment Type:</span> {employmentType}
                        </div>
                      </div>
                    </div>
                    <p>
                      Your employment will be subject to the terms and conditions mentioned below.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 1. Date of Joining */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      1. Date of Joining
                    </h2>
                    <p>Your expected date of joining will be:</p>
                    <p className="font-bold text-slate-900 pl-2">
                      Joining Date: <span className="text-[#0B5D2A]">{joiningDateStr}</span>
                    </p>
                    <p>
                      You are required to report to <strong className="font-bold text-slate-900">{reportingPerson}</strong> at <strong className="font-bold text-slate-900">{reportingTime}</strong> on your joining date.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 2. Training Period */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      2. Training Period
                    </h2>
                    <p>
                      You will undergo an initial training period of <strong className="font-bold text-slate-900">{training.duration}</strong> from <strong className="font-bold text-slate-900">{training.start}</strong> to <strong className="font-bold text-slate-900">{training.end}</strong>.
                    </p>
                    <p>The training period is intended to familiarize you with:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Company policies and procedures</li>
                      <li>Your assigned department and responsibilities</li>
                      <li>MYSAR / Casbiro products and services</li>
                      <li>Internal systems and software</li>
                      <li>Work processes and reporting procedures</li>
                      <li>Customer and internal communication standards</li>
                      <li>Role-specific technical and operational requirements</li>
                    </ul>
                    <p>
                      During the training period, your performance, learning ability, discipline, attendance and suitability for the assigned role will be evaluated.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 3. Probation Period */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      3. Probation Period
                    </h2>
                    <p>
                      You will be on probation for a period of <strong className="font-bold text-slate-900">{probationPeriod}</strong> from your date of joining.
                    </p>
                    <p>
                      During the probation period, your performance, conduct, attendance, job responsibilities and overall suitability for the position will be reviewed.
                    </p>
                    <p>Based on the evaluation, the company may:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Confirm your employment;</li>
                      <li>Extend the probation period; or</li>
                      <li>Take other employment-related action in accordance with company policy.</li>
                    </ul>
                    <p>
                      Successful completion of the probation period does not automatically imply a change in designation or salary unless specifically communicated by the company.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 4. Salary & Compensation */}
                  <div className="space-y-4">
                    <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">
                      4. Salary & Compensation
                    </h2>
                    <p>
                      Your gross monthly salary will be <strong className="font-bold text-slate-950">₹{sal.gross.toLocaleString('en-IN')}</strong>, structured as follows:
                    </p>

                    {/* A. Earnings Table */}
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-emerald-800">
                        A. Earnings
                      </h3>
                      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                            <tr>
                              <th className="px-3 py-2 border-r border-slate-300">Salary Component</th>
                              <th className="px-3 py-2 text-right border-r border-slate-300 w-36">Monthly (₹)</th>
                              <th className="px-3 py-2 text-right w-36">Annual (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Basic Salary</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.basic.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.basic * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">House Rent / Accommodation Allowance</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.hra.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.hra * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Travel / Conveyance Allowance</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.conveyance.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.conveyance * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Communication Allowance</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.communication.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.communication * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Special Allowance</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.special.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.special * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Other Allowance</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.other.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.other * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr className="bg-emerald-50/70 font-bold text-slate-900 border-t-2 border-slate-300">
                              <td className="px-3 py-2 border-r border-slate-300 text-emerald-950 font-bold">Gross Salary</td>
                              <td className="px-3 py-2 text-right border-r border-slate-300 font-mono text-emerald-900 font-bold">₹{sal.gross.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-2 text-right font-mono text-emerald-900 font-bold">₹{(sal.gross * 12).toLocaleString('en-IN')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* B. Deductions Table */}
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-rose-800">
                        B. Deductions
                      </h3>
                      <p className="text-slate-600 text-xs">
                        Applicable deductions may include, as per company policy and applicable law:
                      </p>
                      <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                            <tr>
                              <th className="px-3 py-2 border-r border-slate-300">Deduction</th>
                              <th className="px-3 py-2 text-right border-r border-slate-300 w-36">Monthly (₹)</th>
                              <th className="px-3 py-2 text-right w-36">Annual (₹)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Employee PF Contribution</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.pf.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.pf * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Professional Tax</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.pt.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.pt * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">TDS / Income Tax</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.tds.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.tds * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr>
                              <td className="px-3 py-1.5 border-r border-slate-300 font-medium">Other Applicable Deductions</td>
                              <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.otherDeductions.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-1.5 text-right font-mono">₹{(sal.otherDeductions * 12).toLocaleString('en-IN')}</td>
                            </tr>
                            <tr className="bg-rose-50/70 font-bold text-slate-900 border-t-2 border-slate-300">
                              <td className="px-3 py-2 border-r border-slate-300 text-rose-950 font-bold">Total Deductions</td>
                              <td className="px-3 py-2 text-right border-r border-slate-300 font-mono text-rose-900 font-bold">₹{sal.totalDeductions.toLocaleString('en-IN')}</td>
                              <td className="px-3 py-2 text-right font-mono text-rose-900 font-bold">₹{(sal.totalDeductions * 12).toLocaleString('en-IN')}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* C. Net Salary Summary */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1.5">
                      <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                        C. Net Salary
                      </h3>
                      <div>
                        <span className="font-bold text-slate-800">Gross Salary:</span> ₹{sal.gross.toLocaleString('en-IN')} / Month
                      </div>
                      <div>
                        <span className="font-bold text-slate-800">Less: Total Deductions:</span> ₹{sal.totalDeductions.toLocaleString('en-IN')} / Month
                      </div>
                      <div className="pt-1.5 border-t border-slate-200 text-sm font-bold text-[#0B5D2A]">
                        Estimated Net Salary: ₹{sal.netSalary.toLocaleString('en-IN')} / Month
                      </div>
                      <p className="text-[11px] text-slate-500 pt-1">
                        The actual net salary may vary depending on applicable statutory deductions, tax provisions, attendance, leave without pay and other authorized deductions.
                      </p>
                    </div>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 5. Salary Payment */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      5. Salary Payment
                    </h2>
                    <p>
                      Salary will normally be processed and paid on a monthly basis through the company&apos;s designated salary payment process.
                    </p>
                    <p>
                      Salary will be credited to the bank account provided by you and verified by the company.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 6. Roles & Responsibilities */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      6. Roles & Responsibilities
                    </h2>
                    <p>
                      You will be responsible for performing the duties associated with your position and any other reasonable responsibilities assigned by your reporting manager or management.
                    </p>
                    <p>Your responsibilities may include activities related to:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li><strong className="text-slate-900">MYSAR – My Student Analysis Record</strong></li>
                      <li><strong className="text-slate-900">Casbiro business operations</strong></li>
                      <li>Customer support and communication</li>
                      <li>Product implementation and training</li>
                      <li>Internal administration</li>
                      <li>Technology and software operations</li>
                      <li>Reporting and documentation</li>
                      <li>Other activities relevant to your assigned role</li>
                    </ul>
                    <p>
                      The exact responsibilities will depend on your designation and department.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 7. Work Location & Transfer */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      7. Work Location & Transfer
                    </h2>
                    <p>Your initial work location will be:</p>
                    <p className="font-bold text-slate-900 pl-2">
                      {workLocation}
                    </p>
                    <p>
                      Depending on business requirements, you may be required to work from another company location, client location, school/institution location or remotely, subject to management approval and company policy.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 8. Working Hours */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      8. Working Hours
                    </h2>
                    <p>Your normal working hours will be:</p>
                    <div className="pl-2 space-y-1 font-medium text-slate-900">
                      <div><strong className="text-slate-900">Working Days:</strong> {workingDays}</div>
                      <div><strong className="text-slate-900">Working Hours:</strong> {workingHours}</div>
                    </div>
                    <p>
                      Working hours may be changed depending on operational requirements and company policy.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 9. Leave & Holidays */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      9. Leave & Holidays
                    </h2>
                    <p>
                      You will be eligible for leave and holidays according to the company&apos;s applicable leave policy.
                    </p>
                    <p>
                      Leave must be applied for and approved through the prescribed company process.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 10. Company Policies & Code of Conduct */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      10. Company Policies & Code of Conduct
                    </h2>
                    <p>
                      During your employment, you are required to comply with all applicable policies, procedures and instructions of <strong className="text-slate-950">Casbiro Solutions Private Limited</strong>.
                    </p>
                    <p>You are expected to maintain:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Professional conduct</li>
                      <li>Confidentiality</li>
                      <li>Punctuality and attendance</li>
                      <li>Appropriate workplace behaviour</li>
                      <li>Proper handling of company assets</li>
                      <li>Responsible use of company systems and data</li>
                      <li>Professional communication with customers, schools, employees and management</li>
                    </ul>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 11. Confidentiality */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      11. Confidentiality
                    </h2>
                    <p className="text-justify">
                      During your employment, you may have access to confidential information relating to the company, MYSAR, Casbiro, customers, schools, employees, business operations, software, databases, pricing, financial information and other proprietary information.
                    </p>
                    <p>
                      You must not disclose, share, copy, misuse or distribute such information to any unauthorized person during or after your employment.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 12. Company Property & Data */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      12. Company Property & Data
                    </h2>
                    <p>
                      All company property, documents, credentials, software access, devices, data, files and other resources provided to you shall remain the property of <strong className="text-slate-950">Casbiro Solutions Private Limited</strong>.
                    </p>
                    <p>
                      Upon resignation or termination of employment, all company property and confidential information must be returned to the company.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 13. Performance Review */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      13. Performance Review
                    </h2>
                    <p>Your performance may be evaluated periodically based on factors including:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Job performance</li>
                      <li>Quality of work</li>
                      <li>Productivity</li>
                      <li>Attendance and punctuality</li>
                      <li>Behaviour and discipline</li>
                      <li>Teamwork</li>
                      <li>Customer interaction</li>
                      <li>Achievement of assigned targets/KPIs</li>
                      <li>Compliance with company procedures</li>
                    </ul>
                    <p>
                      Salary revisions, incentives or promotions, where applicable, will be based on company policy and management decisions.
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 14. Termination / Notice Period */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      14. Termination / Notice Period
                    </h2>
                    <p className="text-justify">
                      Either party may terminate the employment by providing the applicable notice period as specified in the company&apos;s employment policy or as separately communicated to the employee.
                    </p>
                    <p>
                      The company reserves the right to take appropriate action in cases of serious misconduct, breach of confidentiality, violation of company policies or other grounds permitted under applicable law.
                    </p>
                    <p className="font-bold text-slate-900 pl-2">
                      Notice Period: <span className="text-slate-950">{noticePeriod}</span>
                    </p>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 15. Documents Required at Joining */}
                  <div className="space-y-2">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      15. Documents Required at Joining
                    </h2>
                    <p>You are required to submit the following documents, as applicable:</p>
                    <ul className="list-disc pl-5 space-y-1 text-slate-700">
                      <li>Aadhaar Card / Government ID</li>
                      <li>PAN Card</li>
                      <li>Passport-size photograph</li>
                      <li>Educational certificates</li>
                      <li>Previous employment documents</li>
                      <li>Bank account details</li>
                      <li>Address proof</li>
                      <li>Experience certificate, if applicable</li>
                      <li>Other documents requested by the company</li>
                    </ul>
                  </div>

                  <hr className="border-slate-200 my-4" />

                  {/* 16. Acceptance of Offer */}
                  <div className="space-y-4">
                    <h2 className="text-sm font-bold text-slate-950 uppercase tracking-wide">
                      16. Acceptance of Offer
                    </h2>
                    <p>
                      We are pleased to welcome you to <strong className="text-slate-950">Casbiro Solutions Private Limited</strong> and look forward to your contribution to the growth of <strong className="text-slate-950">MYSAR and Casbiro</strong>.
                    </p>
                    <p>
                      Please sign and return a copy of this letter as confirmation of your acceptance of the offer and the terms mentioned above.
                    </p>
                    <p>
                      We wish you a successful and rewarding career with Casbiro Solutions Private Limited.
                    </p>
                    <div className="pt-2">
                      <p>Sincerely,</p>
                      <p className="font-bold text-slate-950 mt-1">For Casbiro Solutions Private Limited</p>
                      <div className="mt-4 border-l-2 border-slate-300 pl-3 space-y-1 text-xs text-slate-700">
                        <div className="font-bold text-slate-900">Authorized Signatory</div>
                        <div>Name: Muhammed Rafeeh</div>
                        <div>Designation: Managing Director</div>
                        <div>Signature: ___________________________</div>
                        <div>Date: {issueDateStr}</div>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-400 border-dashed my-6" />

                  {/* Employee Acceptance Section */}
                  <div className="space-y-4 bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
                    <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">
                      Employee Acceptance
                    </h2>
                    <p className="text-justify text-xs">
                      I, <strong className="font-bold text-slate-950">{employeeName}</strong>, hereby accept the offer of employment with <strong className="font-bold text-slate-950">Casbiro Solutions Private Limited</strong> and agree to comply with the terms and conditions mentioned in this Offer Letter and the applicable company policies.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 pt-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">Employee Name:</span> {employeeName}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Signature:</span> _______________________________
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Date:</span> ____________________________________
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">Place:</span> ___________________________________
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-400 border-dashed my-6" />

                  {/* Annexure A – Salary & Benefits Structure */}
                  <div className="space-y-4">
                    <div className="border-b border-slate-300 pb-2">
                      <h2 className="text-base font-bold text-slate-950 tracking-wide">
                        Annexure A – Salary &amp; Benefits Structure
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div><strong className="text-slate-900">Employee Name:</strong> {employeeName}</div>
                      <div><strong className="text-slate-900">Designation:</strong> {designation}</div>
                      <div><strong className="text-slate-900">Department:</strong> {departmentName}</div>
                      <div><strong className="text-slate-900">Business / Product:</strong> {businessProduct}</div>
                      <div><strong className="text-slate-900">Joining Date:</strong> {joiningDateStr}</div>
                    </div>

                    <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                          <tr>
                            <th className="px-3 py-2 border-r border-slate-300">Component</th>
                            <th className="px-3 py-2 text-right border-r border-slate-300 w-36">Monthly (₹)</th>
                            <th className="px-3 py-2 text-right w-36">Annual (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Basic Salary</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.basic.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.basic * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">HRA / Accommodation</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.hra.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.hra * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Conveyance / Travel</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.conveyance.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.conveyance * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Communication</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.communication.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.communication * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Special Allowance</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.special.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.special * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Other Allowance</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.other.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.other * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr className="bg-emerald-50/70 font-bold border-t-2 border-slate-300 text-emerald-950">
                            <td className="px-3 py-2 border-r border-slate-300 font-bold">Gross Salary</td>
                            <td className="px-3 py-2 text-right border-r border-slate-300 font-mono font-bold">₹{sal.gross.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold">₹{(sal.gross * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Employee PF</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.pf.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.pf * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Professional Tax</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.pt.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.pt * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">TDS</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.tds.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.tds * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-1.5 border-r border-slate-300">Other Deductions</td>
                            <td className="px-3 py-1.5 text-right border-r border-slate-300 font-mono">₹{sal.otherDeductions.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-1.5 text-right font-mono">₹{(sal.otherDeductions * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr className="bg-rose-50/70 font-bold border-t border-slate-300 text-rose-950">
                            <td className="px-3 py-2 border-r border-slate-300 font-bold">Total Deductions</td>
                            <td className="px-3 py-2 text-right border-r border-slate-300 font-mono font-bold">₹{sal.totalDeductions.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold">₹{(sal.totalDeductions * 12).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr className="bg-emerald-100/60 font-black border-t-2 border-slate-400 text-emerald-950">
                            <td className="px-3 py-2 border-r border-slate-300 font-bold">Estimated Net Salary</td>
                            <td className="px-3 py-2 text-right border-r border-slate-300 font-mono font-bold">₹{sal.netSalary.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2 text-right font-mono font-bold">₹{(sal.netSalary * 12).toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 text-xs space-y-1">
                      <div><strong className="text-slate-900">Training Period:</strong> {training.duration}</div>
                      <div><strong className="text-slate-900">Probation Period:</strong> {probationPeriod}</div>
                      <div><strong className="text-slate-900">Notice Period:</strong> {noticePeriod}</div>
                    </div>
                  </div>

                  <hr className="border-slate-300 my-6" />

                  {/* Company Closing Branding */}
                  <div className="text-center pt-2 pb-4 space-y-1">
                    <div className="font-black text-slate-900 tracking-wider text-sm uppercase">
                      CASBIRO SOLUTIONS PRIVATE LIMITED
                    </div>
                    <div className="text-xs font-semibold text-emerald-800 italic">
                      MYSAR – My Student Analysis Record
                    </div>
                    <div className="text-[11px] font-bold text-slate-600">
                      Beyond marks, Complete student growth
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls (Non-printable) */}
              <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">
                  Status: <span className="font-bold text-emerald-700">{previewOffer.status}</span> • Ref: {previewOffer.offerNumber}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyOfferLetterText}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-300 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedOfferLetter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedOfferLetter ? 'Copied' : 'Copy Text'}</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Document</span>
                  </button>
                  <button
                    onClick={() => setPreviewOffer(null)}
                    className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: PREVIEW APPOINTMENT LETTER */}
      {previewAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs font-serif leading-relaxed">
            <div className="border-b-2 border-teal-600 pb-4 mb-6 flex justify-between items-start font-sans">
              <div>
                <h1 className="text-xl font-bold text-teal-800">MYSAR – Institutional Services</h1>
                <p className="text-xs text-slate-500">Casbiro Solutions Private Limited</p>
                <p className="text-[10px] text-slate-400">Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-teal-50 text-teal-800 px-2.5 py-1 rounded-full border border-teal-200">
                  APPOINTMENT LETTER
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Ref: {previewAppt.appointmentNumber}</p>
                <p className="text-[10px] text-indigo-700 font-bold">Emp ID: {previewAppt.employeeId}</p>
              </div>
            </div>

            <div className="space-y-4 text-slate-800">
              <p>
                Dear <strong className="font-bold text-slate-900">{previewAppt.employeeName}</strong>,
              </p>
              <p>
                Pursuant to your acceptance of the offer letter, we are delighted to formally appoint you as{' '}
                <strong className="text-teal-900">{previewAppt.position}</strong> under the{' '}
                <strong>{previewAppt.division}</strong>, effective from{' '}
                <strong className="text-teal-800">{previewAppt.joiningDate}</strong>.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 my-3 font-sans">
                <div className="font-bold text-slate-900 mb-2">Terms of Institutional Appointment:</div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                  <li>Workplace Location: {previewAppt.workplace}</li>
                  <li>Probation Period: {previewAppt.probationPeriod}</li>
                  <li>Gross Monthly Remuneration: ₹{previewAppt.grossSalary.toLocaleString()}</li>
                  <li>Working Hours: {previewAppt.workingHours}</li>
                </ul>
              </div>
              <p>
                <strong>Responsibilities:</strong> {previewAppt.responsibilities.join(' • ')}
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between font-sans">
              <div>
                <div className="font-bold text-slate-900">Dr. Ramesh Nambiar</div>
                <div className="text-[10px] text-slate-500">Director of Academics & Administration</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setPreviewAppt(null)}
                  className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
