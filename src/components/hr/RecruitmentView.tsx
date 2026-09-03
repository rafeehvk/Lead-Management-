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
} from '../../types/hr';

interface RecruitmentViewProps {
  positions: Position[];
  applicants: Applicant[];
  interviews: Interview[];
  offerLetters: OfferLetter[];
  appointmentLetters: AppointmentLetter[];
  initialSubTab?: 'positions' | 'applicants' | 'interview' | 'offers' | 'appointments';
  onSavePosition: (pos: Partial<Position>) => void;
  onDeletePosition: (id: string) => void;
  onSaveApplicant: (app: Partial<Applicant>) => void;
  onUpdateApplicantStage: (id: string, stage: RecruitmentStage) => void;
  onDeleteApplicant: (id: string) => void;
  onScheduleInterview: (intData: Partial<Interview>) => void;
  onSaveInterviewEvaluation: (id: string, evaluation: InterviewEvaluation) => void;
  onGenerateOffer: (data: Partial<OfferLetter>) => void;
  onUpdateOfferStatus: (id: string, status: OfferStatus) => void;
  onGenerateAppointment: (data: Partial<AppointmentLetter>) => void;
  onUpdateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
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
  onGenerateAppointment,
  onUpdateAppointmentStatus,
  onConvertApplicantToStaff,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'applicants' | 'interview' | 'offers' | 'appointments'>(initialSubTab);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [stageFilter, setStageFilter] = useState('All');
  const [applicantViewMode, setApplicantViewMode] = useState<'kanban' | 'table'>('kanban');

  // Modals
  const [isCreatePosOpen, setIsCreatePosOpen] = useState(false);
  const [isScheduleIntOpen, setIsScheduleIntOpen] = useState(false);
  const [isEvaluateIntOpen, setIsEvaluateIntOpen] = useState(false);
  const [selectedInterviewForEval, setSelectedInterviewForEval] = useState<Interview | null>(null);

  const [isGenerateOfferOpen, setIsGenerateOfferOpen] = useState(false);
  const [selectedApplicantForOffer, setSelectedApplicantForOffer] = useState<Applicant | null>(null);
  const [previewOffer, setPreviewOffer] = useState<OfferLetter | null>(null);

  const [isGenerateApptOpen, setIsGenerateApptOpen] = useState(false);
  const [selectedApplicantForAppt, setSelectedApplicantForAppt] = useState<Applicant | null>(null);
  const [previewAppt, setPreviewAppt] = useState<AppointmentLetter | null>(null);

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

  // Offer Form State
  const [offerForm, setOfferForm] = useState<Partial<OfferLetter>>({
    basicSalary: 30000,
    allowances: 15000,
    joiningDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    employmentType: 'Full Time',
    workingHours: '8:15 AM – 4:00 PM (Monday to Friday)',
    benefits: ['EPF & Gratuity', 'Health Insurance', 'Conveyance Allowance'],
    termsAndConditions: 'Subject to clean document verification and standard 6-month probation period.',
    expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });

  // Appt Form State
  const [apptForm, setApptForm] = useState<Partial<AppointmentLetter>>({
    employeeId: `EMP-2026-${String(applicants.length + 10).padStart(3, '0')}`,
    basicSalary: 30000,
    allowances: 15000,
    joiningDate: new Date().toISOString().split('T')[0],
    probationPeriod: '6 Months',
    workingHours: '8:15 AM – 4:00 PM',
    workplace: 'Kochi Main Campus',
    responsibilities: [
      'Deliver pedagogical excellence and classroom guidance',
      'Maintain digital attendance and test records in MYSAR ERP',
    ],
    termsAndConditions: 'Formal institutional appointment pursuant to MYSAR and Casbiro service bylaws.',
  });

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
      a.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = departmentFilter === 'All' || a.department === departmentFilter;
    const matchStage = stageFilter === 'All' || a.stage === stageFilter;
    return matchSearch && matchDept && matchStage;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Sub-Navigation Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('positions')}
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
            onClick={() => setActiveSubTab('applicants')}
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
            onClick={() => setActiveSubTab('interview')}
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
            onClick={() => setActiveSubTab('offers')}
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
            onClick={() => setActiveSubTab('appointments')}
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
        <div>
          {activeSubTab === 'positions' && (
            <button
              onClick={() => {
                setPosForm({
                  name: '',
                  code: `POS-2026-${String(positions.length + 1).padStart(3, '0')}`,
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
                setIsCreatePosOpen(true);
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Position</span>
            </button>
          )}

          {activeSubTab === 'applicants' && (
            <div className="flex items-center space-x-2">
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
                    <th className="px-4 py-3">Closing Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPositions.map((pos) => (
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
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => {
                              onSavePosition({
                                ...pos,
                                id: undefined,
                                name: `${pos.name} (Copy)`,
                                code: `${pos.code}-CPY`,
                              });
                            }}
                            title="Duplicate Position"
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
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
                  ))}
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
                placeholder="Search applicant by name, email, role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2">
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
          </div>

          {/* Kanban Board View */}
          {applicantViewMode === 'kanban' && (
            <div className="overflow-x-auto pb-4">
              <div className="flex items-start space-x-3.5 min-w-[1300px]">
                {RECRUITMENT_STAGES.map((stage) => {
                  const stageApplicants = applicants.filter((a) => a.stage === stage);
                  return (
                    <div
                      key={stage}
                      className="w-72 bg-slate-100/70 border border-slate-200/70 rounded-2xl p-3 flex flex-col shrink-0 min-h-[460px]"
                    >
                      <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-bold text-slate-800">{stage}</span>
                        <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                          {stageApplicants.length}
                        </span>
                      </div>

                      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[580px] pr-0.5">
                        {stageApplicants.map((app) => (
                          <div
                            key={app.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all text-xs"
                          >
                            <div className="flex items-start justify-between">
                              <div className="font-bold text-slate-900">{app.name}</div>
                              <span className="text-amber-500 font-bold flex items-center space-x-0.5 text-[11px]">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{app.overallRating.toFixed(1)}</span>
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-0.5 font-medium truncate">
                              {app.positionName}
                            </div>

                            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Exp: {app.experience} Yrs</span>
                              <span>{app.phone}</span>
                            </div>

                            {/* Stage Transition Quick Actions */}
                            <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1">
                              <select
                                value={app.stage}
                                onChange={(e) => onUpdateApplicantStage(app.id, e.target.value as RecruitmentStage)}
                                className="text-[10px] bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 text-slate-700 font-medium"
                              >
                                {RECRUITMENT_STAGES.map((s) => (
                                  <option key={s} value={s}>
                                    Move to: {s}
                                  </option>
                                ))}
                              </select>

                              {app.stage === 'Selected' && !app.offerLetterId && (
                                <button
                                  onClick={() => {
                                    setSelectedApplicantForOffer(app);
                                    setIsGenerateOfferOpen(true);
                                  }}
                                  className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-md hover:bg-emerald-200"
                                >
                                  + Offer
                                </button>
                              )}

                              {app.stage === 'Offer Accepted' && !app.appointmentLetterId && (
                                <button
                                  onClick={() => {
                                    setSelectedApplicantForAppt(app);
                                    setIsGenerateApptOpen(true);
                                  }}
                                  className="text-[10px] bg-teal-100 text-teal-800 font-bold px-1.5 py-0.5 rounded-md hover:bg-teal-200"
                                >
                                  + Appt Letter
                                </button>
                              )}

                              {(app.stage === 'Appointment' || app.stage === 'Offer Accepted') && !app.staffId && (
                                <button
                                  onClick={() => onConvertApplicantToStaff(app.id)}
                                  className="text-[10px] bg-[#168A45] text-white font-bold px-2 py-0.5 rounded-md hover:bg-[#0B5D2A] transition-colors"
                                >
                                  Convert → Staff
                                </button>
                              )}
                            </div>
                          </div>
                        ))}

                        {stageApplicants.length === 0 && (
                          <div className="text-center py-8 text-slate-400 text-xs italic">
                            No candidates in this stage
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
                        <td className="px-4 py-3 font-medium text-slate-800">{app.positionName}</td>
                        <td className="px-4 py-3">
                          <div className="text-slate-800">{app.phone}</div>
                          <div className="text-[10px] text-slate-400">{app.email}</div>
                        </td>
                        <td className="px-4 py-3">{app.experience} Years</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                            {app.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-amber-500">
                          ★ {app.overallRating.toFixed(1)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            {app.stage === 'Appointment' && !app.staffId && (
                              <button
                                onClick={() => onConvertApplicantToStaff(app.id)}
                                className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                              >
                                Convert to Staff
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteApplicant(app.id)}
                              className="p-1 hover:bg-rose-50 text-rose-500 rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
                          {offer.status !== 'Accepted' && (
                            <button
                              onClick={() => onUpdateOfferStatus(offer.id, 'Accepted')}
                              title="Mark Accepted"
                              className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: APPOINTMENT LETTERS */}
      {activeSubTab === 'appointments' && (
        <div className="space-y-4">
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
                          {appt.status !== 'Completed' && (
                            <button
                              onClick={() => onConvertApplicantToStaff(appt.applicantId, appt.id)}
                              className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                            >
                              Convert to Staff
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE POSITION */}
      {isCreatePosOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create New Position</h2>
            <p className="text-xs text-slate-500 mb-4">Define institutional vacancy, qualifications, and salary bandwidth.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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

              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700">Job Description</label>
                <textarea
                  rows={3}
                  value={posForm.description}
                  onChange={(e) => setPosForm({ ...posForm, description: e.target.value })}
                  placeholder="Outline key expectations, syllabus coverage, and institutional duties..."
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsCreatePosOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!posForm.name) return;
                  onSavePosition(posForm);
                  setIsCreatePosOpen(false);
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Create Position
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
              Generate Offer Letter: {selectedApplicantForOffer.name}
            </h2>
            <p className="text-slate-500 mb-4">{selectedApplicantForOffer.positionName}</p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Basic Salary (₹ / Month)</label>
                  <input
                    type="number"
                    value={offerForm.basicSalary}
                    onChange={(e) => setOfferForm({ ...offerForm, basicSalary: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Allowances (₹ / Month)</label>
                  <input
                    type="number"
                    value={offerForm.allowances}
                    onChange={(e) => setOfferForm({ ...offerForm, allowances: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-900 font-bold flex justify-between">
                <span>Calculated Gross Compensation:</span>
                <span>₹{((offerForm.basicSalary || 0) + (offerForm.allowances || 0)).toLocaleString('en-IN')} / mo</span>
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

              <div>
                <label className="font-semibold text-slate-700">Working Hours</label>
                <input
                  type="text"
                  value={offerForm.workingHours}
                  onChange={(e) => setOfferForm({ ...offerForm, workingHours: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
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
                    applicantId: selectedApplicantForOffer.id,
                    applicantName: selectedApplicantForOffer.name,
                    applicantEmail: selectedApplicantForOffer.email,
                    applicantPhone: selectedApplicantForOffer.phone,
                    position: selectedApplicantForOffer.positionName,
                    department: selectedApplicantForOffer.department,
                    ...offerForm,
                  });
                  setIsGenerateOfferOpen(false);
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Generate & Dispatch Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW OFFER LETTER */}
      {previewOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto text-xs font-serif leading-relaxed">
            <div className="border-b-2 border-[#168A45] pb-4 mb-6 flex justify-between items-start font-sans">
              <div>
                <h1 className="text-xl font-bold text-[#0B5D2A]">MYSAR – My Student Analysis Record</h1>
                <p className="text-xs text-slate-500">Casbiro Solutions Private Limited</p>
                <p className="text-[10px] text-slate-400">Valamkattil Tower, Judgemukku, Kakkanad, Kochi – 682021</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold bg-emerald-50 text-[#0B5D2A] px-2.5 py-1 rounded-full border border-emerald-200">
                  OFFER OF EMPLOYMENT
                </span>
                <p className="text-[10px] text-slate-500 mt-1">Ref: {previewOffer.offerNumber}</p>
                <p className="text-[10px] text-slate-500">Date: {previewOffer.issueDate}</p>
              </div>
            </div>

            <div className="space-y-4 text-slate-800">
              <p>
                Dear <strong className="font-bold text-slate-900">{previewOffer.applicantName}</strong>,
              </p>
              <p>
                Casbiro Solutions Private Limited is pleased to offer you the position of{' '}
                <strong className="font-bold text-slate-900">{previewOffer.position}</strong> in our{' '}
                <strong>{previewOffer.department}</strong> department, starting on{' '}
                <strong className="text-[#0B5D2A]">{previewOffer.joiningDate}</strong>.
              </p>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 my-3 font-sans">
                <div className="font-bold text-slate-900 mb-2">Compensation Summary:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Basic Salary: ₹{previewOffer.basicSalary.toLocaleString()}/month</div>
                  <div>Allowances: ₹{previewOffer.allowances.toLocaleString()}/month</div>
                  <div className="col-span-2 font-bold text-[#0B5D2A] pt-1 border-t border-slate-200">
                    Gross Monthly Emoluments: ₹{previewOffer.grossSalary.toLocaleString()}/month
                  </div>
                </div>
              </div>
              <p>
                <strong>Working Hours:</strong> {previewOffer.workingHours}
              </p>
              <p>
                <strong>Benefits:</strong> {previewOffer.benefits.join(', ')}
              </p>
              <p>
                <strong>Terms:</strong> {previewOffer.termsAndConditions} This offer is valid until{' '}
                <strong>{previewOffer.expiryDate}</strong>.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between font-sans">
              <div>
                <div className="font-bold text-slate-900">Muhammed Rafeeh</div>
                <div className="text-[10px] text-slate-500">Authorized Signatory • Casbiro Solutions</div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setPreviewOffer(null)}
                  className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
