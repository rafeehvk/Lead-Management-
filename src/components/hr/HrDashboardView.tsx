import React from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  CalendarX,
  Clock,
  Briefcase,
  UserSearch,
  FileCheck2,
  FileText,
  AlertCircle,
  PlusCircle,
  CalendarCheck,
  CreditCard,
  DollarSign,
  TrendingUp,
  Award,
  ChevronRight,
  BarChart3,
  Building,
  GraduationCap,
  Target,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  Position,
  Applicant,
  StaffMember,
  DailyAttendanceRecord,
  LeaveRequest,
  OfferLetter,
  AppointmentLetter,
  MonthlyPayrollRecord,
  StaffPerformanceEvaluation,
  HrActivityLog,
} from '../../types/hr';

interface HrDashboardViewProps {
  positions?: Position[];
  applicants?: Applicant[];
  staff?: StaffMember[];
  attendance?: DailyAttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  offerLetters?: OfferLetter[];
  appointmentLetters?: AppointmentLetter[];
  payroll?: MonthlyPayrollRecord[];
  performance?: StaffPerformanceEvaluation[];
  activityLogs?: HrActivityLog[];
  onNavigate?: (tab: string, subTab?: string) => void;
  onOpenAddStaff?: () => void;
  onOpenCreatePosition?: () => void;
  onOpenNewInterview?: () => void;
  onOpenMarkAttendance?: () => void;
  onOpenLeaveApproval?: () => void;
  onOpenProcessPayroll?: () => void;
}

interface KpiTooltipPayload {
  department: string;
  overallScore: number;
  staffCount: number;
  evaluatedCount: number;
  ratingTier: string;
  color: string;
  varianceFromTarget: number;
}

interface KpiTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomPerformanceTooltip: React.FC<KpiTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const first = payload[0];
  const data = (first?.payload || {}) as Partial<KpiTooltipPayload>;
  const departmentName = data.department || (typeof label === 'string' && label ? label : '') || first?.name || 'Department';
  const score = typeof data.overallScore === 'number'
    ? data.overallScore
    : (typeof first?.value === 'number' ? first.value : 0);
  const color = data.color || (score >= 90 ? '#168A45' : score >= 85 ? '#0D9488' : score >= 75 ? '#2563EB' : '#E11D48');
  const ratingTier = data.ratingTier || (score >= 90 ? 'Outstanding' : score >= 85 ? 'Excellent' : score >= 75 ? 'Good' : 'Needs Improvement');
  const variance = typeof data.varianceFromTarget === 'number' ? data.varianceFromTarget : (score - 85);
  const isAbove = variance >= 0;
  const evaluatedCount = data.evaluatedCount ?? data.staffCount ?? 1;

  return (
    <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200/90 shadow-xl text-xs min-w-[230px] pointer-events-none transition-all">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <span className="font-bold text-slate-900 text-sm tracking-tight">{departmentName}</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {ratingTier}
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-slate-500 font-medium">Exact KPI Score:</span>
          <div className="flex items-baseline space-x-0.5">
            <span className="font-extrabold text-slate-900 text-lg leading-none">{score}</span>
            <span className="text-xs font-semibold text-slate-500">%</span>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: color }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100">
          <span className="text-slate-500">Benchmark Target (85%):</span>
          <span className={`font-bold ${isAbove ? 'text-emerald-700' : 'text-rose-600'}`}>
            {isAbove ? `+${variance}% above` : `${variance}% below`}
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px] text-slate-400">
          <span>Evaluated Staff:</span>
          <span className="font-semibold text-slate-700">{evaluatedCount} Active Members</span>
        </div>
      </div>
    </div>
  );
};

export const HrDashboardView: React.FC<HrDashboardViewProps> = ({
  positions = [],
  applicants = [],
  staff = [],
  attendance = [],
  leaveRequests = [],
  offerLetters = [],
  appointmentLetters = [],
  payroll = [],
  performance = [],
  activityLogs = [],
  onNavigate = (_tab: string, _subTab?: string) => {},
  onOpenAddStaff = () => {},
  onOpenCreatePosition = () => {},
  onOpenNewInterview = () => {},
  onOpenMarkAttendance = () => {},
  onOpenLeaveApproval = () => {},
  onOpenProcessPayroll = () => {},
}) => {
  // Metrics calculation
  const totalStaff = (staff || []).length;
  const activeStaff = (staff || []).filter((s) => s.employmentStatus === 'Active' || s.employmentStatus === 'Probation').length;
  const newJoiners = (staff || []).filter((s) => {
    const diffDays = (Date.now() - new Date(s.joiningDate).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 45;
  }).length;

  const onLeaveToday = (attendance || []).filter((a) => a.status === 'Leave').length;
  const presentToday = (attendance || []).filter((a) => a.status === 'Present').length;
  const absentToday = (attendance || []).filter((a) => a.status === 'Absent').length;
  const lateToday = (attendance || []).filter((a) => a.status === 'Late').length;

  const pendingLeaveRequests = (leaveRequests || []).filter((l) => l.status === 'Pending').length;
  const openPositions = (positions || []).filter((p) => p.status === 'Open' || p.status === 'Interviewing').length;
  const candidatesInInterview = (applicants || []).filter(
    (a) => a.stage === 'Interview Scheduled' || a.stage === 'Interviewed'
  ).length;
  const pendingOffers = (offerLetters || []).filter((o) => o.status === 'Sent' || o.status === 'Draft').length;
  const pendingAppointments = (appointmentLetters || []).filter((a) => a.status === 'Generated' || a.status === 'Draft').length;

  // Department counts
  const deptCounts: { [dept: string]: number } = {};
  (staff || []).forEach((s) => {
    deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
  });

  // Payroll summary
  const latestPayroll = (payroll || []).slice(0, 10);
  const totalPayrollGross = latestPayroll.reduce((acc, p) => acc + p.grossSalary, 0);
  const totalPayrollNet = latestPayroll.reduce((acc, p) => acc + p.netSalary, 0);

  // Performance average
  const avgKpi = (performance || []).length > 0
    ? Math.round((performance || []).reduce((acc, p) => acc + p.overallScore, 0) / performance.length)
    : 91;

  // Sorting state for Performance Overview
  const [kpiSortBy, setKpiSortBy] = React.useState<'score' | 'alphabetical'>('score');

  // Departmental Overall KPI Score distribution
  const departmentKpiData = React.useMemo(() => {
    const defaultDepts = ['Academic', 'Administration', 'Finance', 'HR', 'IT', 'Support Services'];
    const allDepts = Array.from(
      new Set([
        ...defaultDepts,
        ...(staff || []).map((s) => s.department).filter(Boolean),
        ...(performance || []).map((p) => p.department).filter(Boolean),
      ])
    );

    const data = allDepts.map((dept) => {
      const deptEvals = (performance || []).filter(
        (p) => p.department?.trim().toLowerCase() === dept.trim().toLowerCase()
      );
      const deptStaff = (staff || []).filter(
        (s) => s.department?.trim().toLowerCase() === dept.trim().toLowerCase()
      );

      let avgScore = 0;
      let totalEvaluated = deptEvals.length;

      if (deptEvals.length > 0) {
        avgScore = Math.round(
          deptEvals.reduce((sum, e) => sum + (e.overallScore || 0), 0) / deptEvals.length
        );
      } else if (deptStaff.length > 0 && deptStaff.some((s) => typeof s.overallKpiScore === 'number')) {
        const staffWithScores = deptStaff.filter((s) => typeof s.overallKpiScore === 'number');
        avgScore = Math.round(
          staffWithScores.reduce((sum, s) => sum + (s.overallKpiScore || 0), 0) / (staffWithScores.length || 1)
        );
        totalEvaluated = staffWithScores.length;
      } else {
        const fallbackMap: Record<string, number> = {
          Academic: 92,
          Administration: 95,
          Finance: 91,
          HR: 89,
          IT: 88,
          'Support Services': 86,
          Support: 86,
          'Sales & Marketing': 87,
        };
        avgScore = fallbackMap[dept] || 88;
        totalEvaluated = deptStaff.length || 1;
      }

      let ratingTier = 'Good';
      let color = '#2563EB'; // Blue
      if (avgScore >= 90) {
        ratingTier = 'Outstanding';
        color = '#168A45'; // Emerald
      } else if (avgScore >= 85) {
        ratingTier = 'Excellent';
        color = '#0D9488'; // Teal
      } else if (avgScore >= 75) {
        ratingTier = 'Good';
        color = '#2563EB'; // Blue
      } else {
        ratingTier = 'Needs Improvement';
        color = '#E11D48'; // Rose
      }

      return {
        department: dept,
        overallScore: avgScore,
        staffCount: deptStaff.length,
        evaluatedCount: totalEvaluated || deptStaff.length || 1,
        ratingTier,
        color,
        varianceFromTarget: avgScore - 85,
      };
    });

    if (kpiSortBy === 'score') {
      return [...data].sort((a, b) => b.overallScore - a.overallScore);
    } else {
      return [...data].sort((a, b) => a.department.localeCompare(b.department));
    }
  }, [staff, performance, kpiSortBy]);

  const topDepartment = React.useMemo(() => {
    if (!departmentKpiData.length) return null;
    return [...departmentKpiData].sort((a, b) => b.overallScore - a.overallScore)[0];
  }, [departmentKpiData]);

  const departmentsMeetingTarget = React.useMemo(() => {
    return departmentKpiData.filter((d) => d.overallScore >= 85).length;
  }, [departmentKpiData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner with Quick Actions Only */}
      <div className="bg-gradient-to-r from-[#0B5D2A] via-[#127237] to-[#168A45] rounded-2xl p-3.5 sm:p-4 text-white shadow-sm flex flex-wrap items-center gap-2.5">
        <button
          onClick={onOpenAddStaff}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white text-[#0B5D2A] hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#168A45]" />
          <span>+ Add Staff</span>
        </button>
        <button
          onClick={onOpenCreatePosition}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <Briefcase className="w-4 h-4" />
          <span>+ Create Position</span>
        </button>
        <button
          onClick={onOpenNewInterview}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <CalendarCheck className="w-4 h-4" />
          <span>+ Schedule Interview</span>
        </button>
        <button
          onClick={onOpenMarkAttendance}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <Clock className="w-4 h-4" />
          <span>Mark Attendance</span>
        </button>
        <button
          onClick={onOpenLeaveApproval}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-semibold transition-all cursor-pointer"
        >
          <CalendarX className="w-4 h-4" />
          <span>Leave Approval ({pendingLeaveRequests})</span>
        </button>
        <button
          onClick={onOpenProcessPayroll}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          <DollarSign className="w-4 h-4" />
          <span>Process Payroll</span>
        </button>
      </div>

      {/* 12 Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
        {/* Total Staff */}
        <div
          onClick={() => onNavigate('hr-staff')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Staff</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalStaff}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Faculty & Admin</span>
        </div>

        {/* Active Staff */}
        <div
          onClick={() => onNavigate('hr-staff')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Staff</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeStaff}</div>
          <span className="text-[11px] text-slate-500">Confirmed roster</span>
        </div>

        {/* New Joiners */}
        <div
          onClick={() => onNavigate('hr-staff')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">New Joiners</span>
            <UserPlus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{newJoiners}</div>
          <span className="text-[11px] text-blue-600 font-medium">Last 45 days</span>
        </div>

        {/* Present Today */}
        <div
          onClick={() => onNavigate('hr-attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Present Today</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{presentToday}</div>
          <span className="text-[11px] text-emerald-600 font-medium">Biometric punched</span>
        </div>

        {/* Late Today */}
        <div
          onClick={() => onNavigate('hr-attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Late Today</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{lateToday}</div>
          <span className="text-[11px] text-amber-600 font-medium">&gt; 15 min grace</span>
        </div>

        {/* On Leave Today */}
        <div
          onClick={() => onNavigate('hr-attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-orange-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">On Leave Today</span>
            <CalendarX className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-700">{onLeaveToday}</div>
          <span className="text-[11px] text-orange-600 font-medium">Approved leaves</span>
        </div>

        {/* Absent Today */}
        <div
          onClick={() => onNavigate('hr-attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-rose-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Absent Today</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{absentToday}</div>
          <span className="text-[11px] text-rose-600 font-medium">Unexcused</span>
        </div>

        {/* Pending Leave Requests */}
        <div
          onClick={() => onNavigate('hr-attendance')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-amber-500 hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Leaves</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{pendingLeaveRequests}</div>
          <span className="text-[11px] text-amber-700 font-semibold">Needs Approval</span>
        </div>

        {/* Open Positions */}
        <div
          onClick={() => onNavigate('hr-recruitment', 'positions')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Open Positions</span>
            <Briefcase className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">{openPositions}</div>
          <span className="text-[11px] text-indigo-600 font-medium">Active vacancies</span>
        </div>

        {/* Candidates in Interview */}
        <div
          onClick={() => onNavigate('hr-recruitment', 'interview')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">In Interview</span>
            <UserSearch className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{candidatesInInterview}</div>
          <span className="text-[11px] text-purple-600 font-medium">Rounds 1-3</span>
        </div>

        {/* Pending Offer Letters */}
        <div
          onClick={() => onNavigate('hr-recruitment', 'offers')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Offers</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{pendingOffers}</div>
          <span className="text-[11px] text-emerald-700 font-medium">Awaiting acceptance</span>
        </div>

        {/* Pending Appointment Letters */}
        <div
          onClick={() => onNavigate('hr-recruitment', 'appointments')}
          className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-[#168A45] hover:shadow-xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pending Appt</span>
            <FileCheck2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-teal-700">{pendingAppointments}</div>
          <span className="text-[11px] text-teal-600 font-medium">Formal letters</span>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Performance Overview Card (Recharts-based Bar Chart) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-[#168A45] shadow-2xs shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Performance Overview</h3>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Cycle Q2-Q3 2026
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overall KPI score distribution & benchmark achievement across institutional departments.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Target Benchmark Badge */}
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700">
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Target: ≥85%</span>
              </div>

              {/* Sort Toggle */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 text-xs">
                <button
                  type="button"
                  onClick={() => setKpiSortBy('score')}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    kpiSortBy === 'score'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ArrowUpDown className="w-3 h-3" />
                  <span>By Score</span>
                </button>
                <button
                  type="button"
                  onClick={() => setKpiSortBy('alphabetical')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    kpiSortBy === 'alphabetical'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span>A–Z</span>
                </button>
              </div>

              {/* KPI Hub Link */}
              <button
                type="button"
                onClick={() => onNavigate('hr-kpi')}
                className="flex items-center space-x-1 px-3 py-1.5 text-xs font-bold text-[#0B5D2A] bg-[#EAF7EF] hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
              >
                <span>KPI Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500">Campus KPI Average</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xl font-bold text-slate-900">{avgKpi}%</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  +{avgKpi - 85}% vs Target
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500">Benchmark Target Met</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xl font-bold text-emerald-800">
                  {departmentsMeetingTarget} / {departmentKpiData.length}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  {Math.round((departmentsMeetingTarget / (departmentKpiData.length || 1)) * 100)}% Depts
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500">Top Performing Dept</span>
              <div className="flex items-baseline space-x-1.5 mt-1">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {topDepartment?.department || 'Administration'}
                </span>
                <span className="text-xs font-bold text-[#168A45]">
                  ({topDepartment?.overallScore || 95}%)
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70">
              <span className="text-[11px] font-medium text-slate-500">Evaluated Units</span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-xl font-bold text-slate-900">{departmentKpiData.length}</span>
                <span className="text-[10px] text-slate-500">Departments Active</span>
              </div>
            </div>
          </div>

          {/* Recharts Bar Chart Container */}
          <div id="hr-dashboard-kpi-chart" className="w-full h-72 sm:h-80 min-w-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={departmentKpiData}
                margin={{ top: 20, right: 16, left: -14, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="department"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  interval={0}
                  dy={8}
                />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 85, 100]}
                  tick={{ fill: '#64748B', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  content={<CustomPerformanceTooltip />}
                  cursor={{ fill: '#F1F5F9', opacity: 0.6 }}
                  wrapperStyle={{ outline: 'none', zIndex: 50 }}
                />
                <ReferenceLine
                  y={85}
                  stroke="#059669"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Target: 85%',
                    position: 'insideTopRight',
                    fill: '#059669',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                />
                <Bar
                  dataKey="overallScore"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={48}
                  animationDuration={600}
                >
                  {departmentKpiData.map((entry) => (
                    <Cell key={entry.department} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Department Breakdown Chips */}
          <div className="mt-2 pt-3.5 border-t border-slate-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {departmentKpiData.map((d) => (
                <div
                  key={d.department}
                  className="p-2 bg-slate-50/60 rounded-xl border border-slate-200/60 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-semibold text-slate-700 truncate" title={d.department}>
                      {d.department}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.2 rounded"
                      style={{ backgroundColor: `${d.color}15`, color: d.color }}
                    >
                      {d.overallScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{d.ratingTier}</span>
                    <span className={d.varianceFromTarget >= 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                      {d.varianceFromTarget >= 0 ? `+${d.varianceFromTarget}%` : `${d.varianceFromTarget}%`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart Footer: Legend and Subtext */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-xs">
            {/* Color Tier Legend */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Tiers:</span>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#168A45]" />
                <span>Outstanding (≥90%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#0D9488]" />
                <span>Excellent (85–89%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                <span>Good (75–84%)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                <span className="inline-block w-3.5 h-0.5 border-t-2 border-dashed border-emerald-600" />
                <span>85% Benchmark Target</span>
              </div>
            </div>

            {/* Micro summary */}
            <div className="text-[11px] text-slate-500">
              Department scores reflect active evaluations and KPIs for <span className="font-bold text-slate-800">{totalStaff} staff</span>
            </div>
          </div>
        </div>

        {/* 1. Monthly Staff Attendance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#168A45]" />
              <span>Monthly Staff Attendance</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              96.2% Overall
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Daily punch rate across institutional departments.</p>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-700">
                <span>Present On-Time</span>
                <span className="font-bold text-emerald-700">88%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#168A45] rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-700">
                <span>Late Punches</span>
                <span className="font-bold text-amber-600">8%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-700">
                <span>Approved Leaves</span>
                <span className="font-bold text-blue-600">3%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '3%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-medium mb-1 text-slate-700">
                <span>Unexcused Absences</span>
                <span className="font-bold text-rose-600">1%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '1%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Department-wise Staff Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Building className="w-4 h-4 text-[#168A45]" />
              <span>Department-wise Staff</span>
            </h3>
            <span className="text-xs text-slate-500">{Object.keys(deptCounts).length} Departments</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Faculty and administrative distribution.</p>

          <div className="space-y-2.5">
            {Object.entries(deptCounts).map(([dept, count]) => {
              const pct = Math.round((count / (totalStaff || 1)) * 100);
              return (
                <div key={dept}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">{dept}</span>
                    <span className="text-slate-500 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.max(15, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Position-wise Vacancies & Filled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Briefcase className="w-4 h-4 text-[#168A45]" />
              <span>Position-wise Hiring</span>
            </h3>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {positions.reduce((acc, p) => acc + p.remainingVacancies, 0)} Vacant
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Capacity utilization per requisition.</p>

          <div className="space-y-3 overflow-y-auto max-h-48 pr-1">
            {positions.map((pos) => (
              <div key={pos.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="flex justify-between items-start mb-1.5">
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[180px]">
                    {pos.name}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      pos.status === 'Filled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : pos.status === 'Interviewing'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {pos.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Vacancies: {pos.vacancies}</span>
                  <span className="font-semibold text-emerald-700">Filled: {pos.filled}</span>
                  <span className="text-amber-700 font-semibold">Remaining: {pos.remainingVacancies}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Monthly New Joiners & Turnover */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-[#168A45]" />
              <span>Retention & Turnover</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              98% Retention
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Annualized faculty retention metrics.</p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
              <span className="text-[11px] text-emerald-700 font-medium">Quarterly Joiners</span>
              <div className="text-xl font-bold text-emerald-900 mt-0.5">+{staff.length}</div>
              <span className="text-[10px] text-emerald-600">Onboarding active</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-[11px] text-slate-500 font-medium">Turnover Rate</span>
              <div className="text-xl font-bold text-slate-800 mt-0.5">1.8%</div>
              <span className="text-[10px] text-emerald-600 font-medium">Well below benchmark</span>
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            Average employee institutional tenure: <span className="font-bold text-slate-800">2.6 Years</span>
          </div>
        </div>

        {/* 5. Payroll Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-[#168A45]" />
              <span>Payroll Summary</span>
            </h3>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full">
              August 2026 Run
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Statutory payroll disbursement summary.</p>

          <div className="space-y-2 mb-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Gross Salary Pool:</span>
              <span className="font-bold text-slate-900">₹{totalPayrollGross.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Statutory Deductions (PF/TDS):</span>
              <span className="font-bold text-rose-600">
                ₹{(totalPayrollGross - totalPayrollNet).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-2">
              <span className="font-bold text-slate-800">Net Disbursed:</span>
              <span className="font-bold text-emerald-700 text-sm">₹{totalPayrollNet.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('hr-payroll')}
            className="w-full text-center text-xs text-[#0B5D2A] hover:text-[#168A45] font-bold py-1.5 bg-[#EAF7EF] rounded-xl hover:bg-emerald-100 transition-colors"
          >
            View Monthly Payroll & Payslips →
          </button>
        </div>

        {/* 6. KPI & Performance Overview */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <Award className="w-4 h-4 text-[#168A45]" />
              <span>Institutional KPI Index</span>
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {avgKpi}% Avg
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Evaluation across faculty & administration.</p>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Outstanding (≥90%)</span>
              <span className="font-bold text-emerald-700">3 Faculty</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full" style={{ width: '70%' }} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Excellent (80-89%)</span>
              <span className="font-bold text-blue-700">2 Faculty</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '30%' }} />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">Next evaluation cycle:</span>
            <span className="text-xs font-bold text-slate-800">Q3 2026 (End of Sept)</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Recruitment Funnel & Live HR Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recruitment Funnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <UserSearch className="w-4 h-4 text-[#168A45]" />
              <span>Active Recruitment Pipeline</span>
            </h3>
            <button
              onClick={() => onNavigate('hr-recruitment', 'applicants')}
              className="text-xs text-[#168A45] hover:text-[#0B5D2A] font-bold"
            >
              Open Kanban Board →
            </button>
          </div>

          <div className="space-y-2.5">
            {applicants.slice(0, 5).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-[#F7FAF8] rounded-xl border border-slate-200/60 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{app.name}</div>
                  <div className="text-[11px] text-slate-500">{app.positionName}</div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      app.stage === 'Joined'
                        ? 'bg-emerald-100 text-emerald-800'
                        : app.stage === 'Offer Accepted' || app.stage === 'Selected'
                        ? 'bg-teal-100 text-teal-800'
                        : app.stage === 'Interview Scheduled'
                        ? 'bg-purple-100 text-purple-800'
                        : app.stage === 'Rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {app.stage}
                  </span>
                  <span className="text-xs text-amber-500 font-bold">★ {app.overallRating.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live HR Activity & Audit Log */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-[#168A45]" />
              <span>HR Activity & Compliance Log</span>
            </h3>
            <span className="text-[11px] text-slate-400">Audited Actions</span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
            {(activityLogs || []).map((log, index) => (
              <div key={log.id ? `${log.id}-${index}` : `hr-log-${index}`} className="flex items-start space-x-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-[#168A45] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">{log.timestamp}</span>
                  </div>
                  <div className="text-xs text-slate-600 truncate">{log.record}</div>
                  <div className="text-[10px] text-slate-400">by {log.user} ({log.role})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
