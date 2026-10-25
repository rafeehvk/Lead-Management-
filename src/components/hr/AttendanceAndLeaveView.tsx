import React, { useState, useMemo } from 'react';
import {
  Clock,
  CalendarX,
  CalendarCheck,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  AlertCircle,
  FileText,
  UserCheck,
  Building,
  TrendingUp,
  Download,
  Printer,
  ShieldAlert,
  CheckCircle2,
  Info,
  Calendar,
  Sparkles,
  ArrowRight,
  User,
  LayoutGrid,
  LogIn,
  LogOut,
  MapPin,
  Fingerprint,
} from 'lucide-react';
import { User as UserType } from '../../types';
import { WeeklyAttendanceHeatmap } from './WeeklyAttendanceHeatmap';
import { TeamLeaveCalendar } from './TeamLeaveCalendar';
import { UserMonthlyAttendanceHeatmap } from './UserMonthlyAttendanceHeatmap';
import {
  DailyAttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  StaffMember,
  AttendanceStatus,
  LeaveRequestStatus,
  LeaveType,
} from '../../types/hr';
import {
  validateLeaveRequest,
  getStaffLeaveBalance,
  calculateLeaveDuration,
  calculateEndDate,
  LeaveValidationResult,
  DEFAULT_LEAVE_QUOTAS,
} from '../../utils/leaveValidation';

interface AttendanceAndLeaveViewProps {
  staff: StaffMember[];
  attendance: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  currentUser?: UserType | null;
  onMarkAttendance: (
    staffId: string,
    date: string,
    status: AttendanceStatus,
    checkIn?: string,
    checkOut?: string,
    remarks?: string
  ) => void;
  onBulkMarkAttendance: (date: string, status: AttendanceStatus) => void;
  onSubmitLeaveRequest: (data: Partial<LeaveRequest>) => void;
  onUpdateLeaveStatus: (id: string, status: LeaveRequestStatus, remarks?: string) => void;
}

export const AttendanceAndLeaveView: React.FC<AttendanceAndLeaveViewProps> = ({
  staff = [],
  attendance = [],
  leaveRequests = [],
  leaveBalances = [],
  currentUser,
  onMarkAttendance,
  onBulkMarkAttendance,
  onSubmitLeaveRequest,
  onUpdateLeaveStatus,
}) => {
  const [activeTab, setActiveTab] = useState<
    'attendance' | 'my-heatmap' | 'leave-calendar' | 'heatmap' | 'leave-requests' | 'leave-balances'
  >('attendance');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedStaffForHeatmap, setSelectedStaffForHeatmap] = useState<StaffMember | null>(null);

  // Resolve logged-in staff member for Self-Service Punching and Leave Application
  const loggedInStaff = useMemo(() => {
    if (!currentUser) return null;
    return (
      staff.find((s) => s.id === currentUser.staffId) ||
      staff.find(
        (s) =>
          (s.systemAccess?.username && s.systemAccess.username.toLowerCase() === currentUser.userId?.toLowerCase()) ||
          (s.email && s.email.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (s.personalEmail && s.personalEmail.toLowerCase() === currentUser.email?.toLowerCase()) ||
          (s.fullName && s.fullName.toLowerCase() === currentUser.name?.toLowerCase())
      ) ||
      null
    );
  }, [currentUser, staff]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const myTodayRecord = useMemo(() => {
    if (!loggedInStaff) return null;
    return attendance.find((a) => a.staffId === loggedInStaff.id && a.date === todayStr);
  }, [loggedInStaff, attendance, todayStr]);

  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);

  const handleSelfPunchIn = () => {
    if (!loggedInStaff) return;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    onMarkAttendance(
      loggedInStaff.id,
      todayStr,
      'Present',
      nowTime,
      undefined,
      'Self-Punch In via Staff Portal'
    );
    setPunchFeedback(`Punched In successfully at ${nowTime}!`);
    setTimeout(() => setPunchFeedback(null), 4000);
  };

  const handleSelfPunchOut = () => {
    if (!loggedInStaff || !myTodayRecord) return;
    const nowTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    onMarkAttendance(
      loggedInStaff.id,
      todayStr,
      myTodayRecord.status || 'Present',
      myTodayRecord.checkIn || '08:30 AM',
      nowTime,
      'Self-Punch Out via Staff Portal'
    );
    setPunchFeedback(`Punched Out successfully at ${nowTime}! Shift completed.`);
    setTimeout(() => setPunchFeedback(null), 4000);
  };

  // Modal for Applying Leave
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRequest>>({
    staffId: staff[0]?.id || '',
    leaveType: 'Casual Leave',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    numberOfDays: 1,
    reason: '',
    substituteStaff: '',
  });

  const selectedStaffId = leaveForm.staffId || staff[0]?.id || '';
  const selectedStaff = staff.find((s) => s.id === selectedStaffId) || staff[0];

  // Dynamic Validation Layer: Checks requested leave duration against available balance
  const validation: LeaveValidationResult = useMemo(() => {
    return validateLeaveRequest({
      staffId: selectedStaffId,
      leaveType: (leaveForm.leaveType as LeaveType) || 'Casual Leave',
      numberOfDays: leaveForm.numberOfDays || 1,
      fromDate: leaveForm.fromDate,
      toDate: leaveForm.toDate,
      reason: leaveForm.reason,
      balances: leaveBalances,
      pendingRequests: leaveRequests,
      staffList: staff,
    });
  }, [
    selectedStaffId,
    leaveForm.leaveType,
    leaveForm.numberOfDays,
    leaveForm.fromDate,
    leaveForm.toDate,
    leaveForm.reason,
    leaveBalances,
    leaveRequests,
    staff,
  ]);

  const handleOpenApplyLeave = (targetStaffId?: string, defaultDate?: string) => {
    const defaultStaff = loggedInStaff || staff[0];
    const st = (targetStaffId ? staff.find((s) => s.id === targetStaffId) : defaultStaff) || staff[0];
    const targetDate = defaultDate || new Date().toISOString().split('T')[0];
    setLeaveForm({
      staffId: st?.id || '',
      staffName: st?.fullName || '',
      department: st?.department || '',
      position: st?.position || '',
      leaveType: 'Casual Leave',
      fromDate: targetDate,
      toDate: targetDate,
      numberOfDays: 1,
      reason: '',
      substituteStaff: '',
    });
    setSubmitAttempted(false);
    setSubmitError(null);
    setIsApplyLeaveOpen(true);
  };

  const handleSetDuration = (days: number) => {
    const validDays = Math.max(1, days);
    const newTo = calculateEndDate(leaveForm.fromDate || new Date().toISOString().split('T')[0], validDays);
    setLeaveForm({
      ...leaveForm,
      numberOfDays: validDays,
      toDate: newTo,
    });
  };

  // Calculate stats for selected date
  const recordsForDate = attendance.filter((r) => r.date === selectedDate);
  const totalRoster = staff.length;
  const presentCount = recordsForDate.filter((r) => r.status === 'Present').length;
  const lateCount = recordsForDate.filter((r) => r.status === 'Late').length;
  const leaveCount = recordsForDate.filter((r) => r.status === 'Leave').length;
  const absentCount = recordsForDate.filter((r) => r.status === 'Absent').length;

  // Filtered attendance rows
  const filteredStaffAttendance = staff.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === 'All' || s.department === deptFilter;
    const rec = recordsForDate.find((r) => r.staffId === s.id);
    const effectiveStatus = rec?.status || 'Present';
    const matchStatus = statusFilter === 'All' || effectiveStatus === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* STAFF SELF-SERVICE PORTAL: Quick Punch In/Out & Leave Application */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-sm border border-emerald-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* User Identity & Live Date */}
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {loggedInStaff?.profilePhoto ? (
                <img
                  src={loggedInStaff.profilePhoto}
                  alt={loggedInStaff.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCheck className="w-6 h-6 text-emerald-300" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  Staff Self-Service Access
                </span>
                <span className="text-xs text-emerald-200">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight mt-1">
                {loggedInStaff ? loggedInStaff.fullName : currentUser?.name || 'Staff Member'}
              </h2>
              <p className="text-xs text-emerald-100/80 flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span>ID: {loggedInStaff?.staffCode || loggedInStaff?.id || currentUser?.staffId || 'CB-STAFF'}</span>
                <span>•</span>
                <span>{loggedInStaff?.department || 'Operations'}</span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-emerald-200">
                  <MapPin className="w-3 h-3" />
                  {loggedInStaff?.branchLocation || 'Kochi Corporate HQ'}
                </span>
              </p>
            </div>
          </div>

          {/* Action Hub: Punch In/Out & Apply Leave */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Punch In / Out Button */}
            {!myTodayRecord?.checkIn ? (
              <button
                type="button"
                onClick={handleSelfPunchIn}
                className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 active:scale-98 text-slate-950 font-black text-xs flex items-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Fingerprint className="w-4 h-4 text-emerald-950" />
                <span>Punch In (Check-In)</span>
              </button>
            ) : !myTodayRecord?.checkOut ? (
              <div className="flex items-center space-x-2 bg-white/10 border border-white/20 p-1.5 rounded-xl">
                <div className="px-2.5 py-1 text-left">
                  <div className="text-[10px] text-emerald-200 font-medium">In: {myTodayRecord.checkIn}</div>
                  <div className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    On Duty
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSelfPunchOut}
                  className="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Punch Out</span>
                </button>
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-left">
                <div className="text-[10px] text-emerald-200 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  Shift Completed Today
                </div>
                <div className="text-xs font-bold text-white mt-0.5">
                  In: {myTodayRecord.checkIn} • Out: {myTodayRecord.checkOut}
                </div>
              </div>
            )}

            {/* View Monthly Attendance Heatmap Button */}
            <button
              type="button"
              onClick={() => setActiveTab('my-heatmap')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs ${
                activeTab === 'my-heatmap'
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-md'
                  : 'bg-white/15 hover:bg-white/25 active:scale-98 text-white border border-white/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>My Attendance Heatmap</span>
            </button>

            {/* Apply Leave Request Button */}
            <button
              type="button"
              onClick={() => handleOpenApplyLeave(loggedInStaff?.id)}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-98 text-white border border-white/30 font-bold text-xs flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
            >
              <CalendarCheck className="w-4 h-4 text-emerald-300" />
              <span>Apply For Leave</span>
            </button>
          </div>
        </div>

        {/* Punch Notification Feedback */}
        {punchFeedback && (
          <div className="mt-3 bg-emerald-400/20 border border-emerald-400/40 text-emerald-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{punchFeedback}</span>
          </div>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="w-4 h-4 text-[#168A45]" />
            <span>Daily Biometric Attendance</span>
          </button>

          <button
            onClick={() => setActiveTab('my-heatmap')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my-heatmap'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#168A45]" />
            <span>My Monthly Heatmap</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-300">
              Personal
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leave-calendar')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leave-calendar'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#168A45]" />
            <span>Team Leave Calendar</span>
            {leaveRequests.filter((l) => l.status === 'Approved').length > 0 && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-300">
                {leaveRequests.filter((l) => l.status === 'Approved').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'heatmap'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-[#168A45]" />
            <span>Weekly Attendance Heatmap</span>
          </button>

          <button
            onClick={() => setActiveTab('leave-requests')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leave-requests'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CalendarX className="w-4 h-4 text-[#168A45]" />
            <span>
              Leave Requests (
              {leaveRequests.filter((l) => l.status === 'Pending').length} Pending)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leave-balances')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leave-balances'
                ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] shadow-2xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-[#168A45]" />
            <span>Staff Leave Balances</span>
          </button>
        </div>

        {(activeTab === 'leave-requests' || activeTab === 'leave-balances' || activeTab === 'leave-calendar' || activeTab === 'my-heatmap') && (
          <button
            onClick={() => handleOpenApplyLeave()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Apply Leave</span>
          </button>
        )}
      </div>

      {/* SUB-TAB 1: DAILY BIOMETRIC ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          {/* Quick Jump to My Monthly Heatmap Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border border-emerald-200/80 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Track Your Personal Attendance Patterns
                </h4>
                <p className="text-[11px] text-slate-500">
                  View daily status (Present, Late, Leave, Absent), hours worked, and monthly compliance metrics for {loggedInStaff?.fullName || 'your profile'}.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('my-heatmap')}
              className="px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>View My Monthly Heatmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Metrics Bar for Selected Date */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-slate-500 font-medium">Total Roster</span>
              <div className="text-xl font-bold text-slate-900 mt-0.5">{totalRoster}</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-emerald-600 font-medium">Present Today</span>
              <div className="text-xl font-bold text-emerald-700 mt-0.5">{presentCount}</div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-amber-600 font-medium">Late Punches</span>
              <div className="text-xl font-bold text-amber-700 mt-0.5">{lateCount}</div>
            </div>
            <div
              onClick={() => setActiveTab('leave-calendar')}
              className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer group"
              title="Click to view Team Leave Calendar"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-blue-600 font-medium">On Leave</span>
                <Calendar className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="text-xl font-bold text-blue-700 mt-0.5 flex items-baseline justify-between">
                <span>{leaveCount}</span>
                <span className="text-[10px] text-blue-500 font-normal group-hover:underline">View Calendar →</span>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-rose-600 font-medium">Absent</span>
              <div className="text-xl font-bold text-rose-700 mt-0.5">{absentCount}</div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                <span>Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 bg-white"
                />
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white"
              >
                <option value="All">All Departments</option>
                <option value="Operations">Operations</option>
                <option value="Administration">Administration</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="IT">IT</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onBulkMarkAttendance(selectedDate, 'Present')}
                className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark All Present</span>
              </button>
            </div>
          </div>

          {/* Attendance Daily Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Employee ID & Staff</th>
                    <th className="px-4 py-3">Department & Position</th>
                    <th className="px-4 py-3">Biometric Check-In</th>
                    <th className="px-4 py-3">Biometric Check-Out</th>
                    <th className="px-4 py-3">Effective Hours</th>
                    <th className="px-4 py-3">Attendance Status</th>
                    <th className="px-4 py-3 text-right">Change Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaffAttendance.map((s) => {
                    const rec = recordsForDate.find((r) => r.staffId === s.id);
                    const status = rec?.status || 'Present';
                    const checkIn = rec?.checkIn || (status === 'Present' ? '08:25 AM' : status === 'Late' ? '08:52 AM' : '—');
                    const checkOut = rec?.checkOut || (status === 'Present' ? '04:30 PM' : '—');

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{s.fullName}</div>
                          <div className="text-[10px] text-slate-400">{s.id}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{s.position}</div>
                          <div className="text-[10px] text-slate-400">{s.department}</div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{checkIn}</td>
                        <td className="px-4 py-3 text-slate-700">{checkOut}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {status === 'Present' ? '8.0 hrs' : status === 'Half Day' ? '4.0 hrs' : '0.0 hrs'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : status === 'Leave'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={status}
                            onChange={(e) =>
                              onMarkAttendance(s.id, selectedDate, e.target.value as AttendanceStatus)
                            }
                            className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 text-slate-700 bg-white font-medium"
                          >
                            <option value="Present">Present</option>
                            <option value="Late">Late</option>
                            <option value="Half Day">Half Day</option>
                            <option value="Leave">Leave</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Attendance Heatmap inside Attendance Overview */}
          <WeeklyAttendanceHeatmap
            staff={staff}
            attendance={attendance}
            leaveRequests={leaveRequests}
            onMarkAttendance={onMarkAttendance}
          />
        </div>
      )}

      {/* SUB-TAB: USER MONTHLY ATTENDANCE HEATMAP (LOGGED-IN USER) */}
      {activeTab === 'my-heatmap' && (
        <UserMonthlyAttendanceHeatmap
          staffMember={selectedStaffForHeatmap || loggedInStaff || staff[0] || null}
          allStaff={staff}
          attendance={attendance}
          leaveRequests={leaveRequests}
          onApplyLeave={(staffId, defaultDate) => handleOpenApplyLeave(staffId, defaultDate)}
          onSelectStaff={(s) => setSelectedStaffForHeatmap(s)}
        />
      )}

      {/* SUB-TAB: WEEKLY ATTENDANCE HEATMAP */}
      {activeTab === 'heatmap' && (
        <WeeklyAttendanceHeatmap
          staff={staff}
          attendance={attendance}
          leaveRequests={leaveRequests}
          onMarkAttendance={onMarkAttendance}
        />
      )}

      {/* SUB-TAB: TEAM LEAVE & AVAILABILITY CALENDAR */}
      {activeTab === 'leave-calendar' && (
        <TeamLeaveCalendar
          staff={staff}
          leaveRequests={leaveRequests}
          onApplyLeave={(staffId) => handleOpenApplyLeave(staffId)}
        />
      )}

      {/* SUB-TAB 2: LEAVE REQUESTS */}
      {activeTab === 'leave-requests' && (
        <div className="space-y-4">
          {/* Quick Switch to Calendar Header */}
          <div className="bg-white p-3 px-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 text-xs">Leave Requests Management</span>
              <span className="text-[11px] text-slate-400">• Review, approve, and track staff leaves</span>
            </div>
            <button
              onClick={() => setActiveTab('leave-calendar')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Calendar className="w-3.5 h-3.5 text-[#168A45]" />
              <span>View Team Availability Calendar →</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Request ID</th>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Leave Type</th>
                    <th className="px-4 py-3">Duration (From - To)</th>
                    <th className="px-4 py-3 text-center">Days</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Substitute Staff</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Approval Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{req.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{req.staffName}</div>
                        <div className="text-[10px] text-slate-400">
                          {req.position} • {req.department}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">{req.leaveType}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {req.fromDate} to {req.toDate}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">{req.numberOfDays}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{req.reason}</td>
                      <td className="px-4 py-3 text-slate-500">{req.substituteStaff || '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            req.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => onUpdateLeaveStatus(req.id, 'Approved')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onUpdateLeaveStatus(req.id, 'Rejected', 'Company schedule priority')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Actioned by {req.approvedBy || 'Admin'}
                          </span>
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

      {/* SUB-TAB 3: LEAVE BALANCES */}
      {activeTab === 'leave-balances' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Company Staff Leave Balances</h3>
                <p className="text-[11px] text-slate-500">Live quotas, consumed leaves, and available quotas across company departments.</p>
              </div>
              <button
                onClick={() => handleOpenApplyLeave()}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply Staff Leave</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Staff ID & Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-center">Casual (Used / Left)</th>
                    <th className="px-4 py-3 text-center">Sick (Used / Left)</th>
                    <th className="px-4 py-3 text-center">Annual / Earned</th>
                    <th className="px-4 py-3 text-center">Emergency</th>
                    <th className="px-4 py-3 text-center">Net Remaining</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveBalances.map((bal) => {
                    const casualTotal = bal.casualTotal ?? bal.casualAllowed ?? DEFAULT_LEAVE_QUOTAS.casualTotal;
                    const casualUsed = bal.casualUsed || 0;
                    const casualLeft = Math.max(0, casualTotal - casualUsed);

                    const sickTotal = bal.sickTotal ?? bal.sickAllowed ?? DEFAULT_LEAVE_QUOTAS.sickTotal;
                    const sickUsed = bal.sickUsed || 0;
                    const sickLeft = Math.max(0, sickTotal - sickUsed);

                    const annualTotal = bal.annualTotal ?? bal.annualAllowed ?? DEFAULT_LEAVE_QUOTAS.annualTotal;
                    const annualUsed = bal.annualUsed || 0;
                    const annualLeft = Math.max(0, annualTotal - annualUsed);

                    const emergencyTotal = bal.emergencyTotal ?? DEFAULT_LEAVE_QUOTAS.emergencyTotal;
                    const emergencyUsed = bal.emergencyUsed || 0;
                    const emergencyLeft = Math.max(0, emergencyTotal - emergencyUsed);

                    const totalRemaining = casualLeft + sickLeft + annualLeft + emergencyLeft;

                    return (
                      <tr key={bal.staffId || bal.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{bal.staffName}</div>
                          <div className="text-[10px] text-slate-400">{bal.staffId}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{bal.department}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-500">{casualUsed} used</span> /{' '}
                          <span className={`font-bold ${casualLeft > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{casualLeft} left</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-500">{sickUsed} used</span> /{' '}
                          <span className={`font-bold ${sickLeft > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{sickLeft} left</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-500">{annualUsed} used</span> /{' '}
                          <span className={`font-bold ${annualLeft > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{annualLeft} left</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-500">{emergencyUsed} used</span> /{' '}
                          <span className={`font-bold ${emergencyLeft > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>{emergencyLeft} left</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            {totalRemaining} Days
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleOpenApplyLeave(bal.staffId)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0B5D2A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Apply</span>
                          </button>
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

      {/* MODAL: APPLY LEAVE WITH VALIDATION LAYER */}
      {isApplyLeaveOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-slate-200 text-xs my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Apply for Staff Leave</span>
                  <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Balance Verified
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">Submit leave request with real-time balance quota validation.</p>
              </div>
              <button
                onClick={() => setIsApplyLeaveOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 pt-4">
              {/* Staff Member Selector & Profile Card */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Staff Member</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={leaveForm.staffId}
                    onChange={(e) => {
                      const st = staff.find((s) => s.id === e.target.value);
                      setLeaveForm({
                        ...leaveForm,
                        staffId: e.target.value,
                        staffName: st?.fullName,
                        department: st?.department,
                        position: st?.position,
                      });
                      setSubmitError(null);
                    }}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#168A45]"
                  >
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.position} — {s.department})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedStaff && (
                  <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EAF7EF] text-[#0B5D2A] flex items-center justify-center font-bold text-xs">
                        {selectedStaff.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900">{selectedStaff.fullName}</span>
                        <span className="text-slate-400 ml-1.5">ID: {selectedStaff.id}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-medium">
                      {selectedStaff.department}
                    </span>
                  </div>
                )}
              </div>

              {/* Real-time Category Balances Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700">Available Leave Quotas</label>
                  <span className="text-[10px] text-slate-400">Click a category to select</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {validation.allCategories.map((cat) => {
                    const isSelected = leaveForm.leaveType === cat.leaveType;
                    const isExhausted = cat.availableDays <= 0;

                    return (
                      <button
                        key={cat.leaveType}
                        type="button"
                        onClick={() => {
                          setLeaveForm({ ...leaveForm, leaveType: cat.leaveType });
                          setSubmitError(null);
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#168A45] bg-[#EAF7EF] ring-2 ring-[#168A45]/20'
                            : isExhausted
                            ? 'border-slate-200 bg-slate-50/60 opacity-80 hover:border-slate-300'
                            : 'border-slate-200 bg-white hover:border-[#168A45]/50 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold ${isSelected ? 'text-[#0B5D2A]' : 'text-slate-800'}`}>
                            {cat.label.replace(' Leave', '')}
                          </span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#168A45]" />}
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span
                            className={`text-sm font-bold ${
                              isExhausted ? 'text-rose-600' : isSelected ? 'text-[#0B5D2A]' : 'text-slate-900'
                            }`}
                          >
                            {cat.availableDays}
                          </span>
                          <span className="text-[10px] text-slate-400">/ {cat.totalQuota} left</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Category Inspection Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-800 text-[11px]">{validation.category.label}</span>
                    {validation.category.isExemptFromQuota && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-800">
                        Loss of Pay
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Annual Quota: <strong className="text-slate-800">{validation.category.isExemptFromQuota ? 'Uncapped' : `${validation.category.totalQuota} Days`}</strong>
                  </span>
                </div>
                {!validation.category.isExemptFromQuota && (
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="text-slate-400">Quota</div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">{validation.category.totalQuota}d</div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="text-slate-400">Approved</div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5">{validation.category.usedDays}d</div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-slate-200">
                      <div className="text-slate-400">In Review</div>
                      <div className={`font-bold text-xs mt-0.5 ${validation.category.pendingDays > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {validation.category.pendingDays}d
                      </div>
                    </div>
                    <div className="bg-white p-1.5 rounded-lg border border-emerald-200 bg-emerald-50/50">
                      <div className="text-emerald-700 font-medium">Available</div>
                      <div className="font-bold text-emerald-800 text-xs mt-0.5">{validation.category.availableDays}d</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Controls: Leave Type & Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => {
                      setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType });
                      setSubmitError(null);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#168A45]"
                  >
                    {validation.allCategories.map((cat) => (
                      <option key={cat.leaveType} value={cat.leaveType}>
                        {cat.label} ({cat.availableDays} days available)
                      </option>
                    ))}
                    <option value="Maternity Leave">Maternity Leave (Subject to management approval)</option>
                    <option value="Paternity Leave">Paternity Leave (Subject to management approval)</option>
                    <option value="Unpaid Leave">Unpaid Leave (Loss of Pay - Exempt from quota)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Duration (Days)</label>
                    <span className="text-[10px] text-slate-400">Available: {validation.category.isExemptFromQuota ? '∞' : `${validation.availableBalance}d`}</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={validation.category.isExemptFromQuota ? 90 : undefined}
                    value={leaveForm.numberOfDays || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      const from = leaveForm.fromDate || new Date().toISOString().split('T')[0];
                      const newTo = val > 0 ? calculateEndDate(from, val) : leaveForm.toDate;
                      setLeaveForm({
                        ...leaveForm,
                        numberOfDays: val,
                        toDate: newTo,
                      });
                      setSubmitError(null);
                    }}
                    className={`w-full border rounded-xl px-3 py-2 text-slate-900 font-bold focus:outline-none focus:ring-2 ${
                      !validation.isValid && !validation.category.isExemptFromQuota
                        ? 'border-rose-300 bg-rose-50/40 text-rose-900 focus:ring-rose-400'
                        : 'border-slate-200 bg-white focus:ring-[#168A45]'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Duration Preset Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-400 mr-1">Quick Select:</span>
                {[1, 2, 3].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleSetDuration(d)}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-semibold transition-all cursor-pointer ${
                      leaveForm.numberOfDays === d
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {d} {d === 1 ? 'Day' : 'Days'}
                  </button>
                ))}
                {!validation.category.isExemptFromQuota && validation.availableBalance > 0 && validation.availableBalance !== 1 && (
                  <button
                    type="button"
                    onClick={() => handleSetDuration(validation.availableBalance)}
                    className="px-2 py-0.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold transition-all cursor-pointer"
                  >
                    Max Available ({validation.availableBalance}d)
                  </button>
                )}
              </div>

              {/* Date Ranges (Bi-directionally synced) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">From Date</label>
                  <input
                    type="date"
                    value={leaveForm.fromDate}
                    onChange={(e) => {
                      const newFrom = e.target.value;
                      const days = leaveForm.numberOfDays || 1;
                      const newTo = calculateEndDate(newFrom, days);
                      setLeaveForm({
                        ...leaveForm,
                        fromDate: newFrom,
                        toDate: newTo,
                      });
                      setSubmitError(null);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#168A45]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">To Date</label>
                  <input
                    type="date"
                    value={leaveForm.toDate}
                    min={leaveForm.fromDate}
                    onChange={(e) => {
                      const newTo = e.target.value;
                      const from = leaveForm.fromDate || newTo;
                      const calculatedDays = calculateLeaveDuration(from, newTo);
                      setLeaveForm({
                        ...leaveForm,
                        toDate: newTo,
                        numberOfDays: calculatedDays,
                      });
                      setSubmitError(null);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#168A45]"
                  />
                </div>
              </div>

              {/* DYNAMIC VALIDATION FEEDBACK LAYER */}
              <div>
                {!validation.isValid && !validation.category.isExemptFromQuota ? (
                  /* EXCEEDED QUOTA / VALIDATION ERROR STATE */
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2.5 animate-in fade-in duration-200">
                    <div className="flex items-start space-x-2.5">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-bold text-xs text-rose-800">
                          Leave Balance Quota Exceeded — Submission Blocked
                        </div>
                        <div className="text-[11px] text-rose-700 mt-0.5">
                          {validation.availableBalance === 0 ? (
                            <span>
                              <strong>{selectedStaff?.fullName}</strong> has <strong>0 days</strong> of {validation.category.label} remaining for this annual cycle.
                            </span>
                          ) : (
                            <span>
                              Requested duration of <strong>{validation.requestedDays} day(s)</strong> exceeds available {validation.category.label} balance (
                              <strong>{validation.availableBalance} day(s)</strong> available) by <strong>{validation.exceededBy} day(s)</strong>.
                            </span>
                          )}
                        </div>
                        {validation.category.pendingDays > 0 && (
                          <div className="text-[10px] text-rose-600 mt-1">
                            Note: {validation.category.pendingDays} day(s) are currently under review in another pending application.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quick Remediation Actions */}
                    <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold text-rose-800">Recommended Resolution:</span>
                      {validation.availableBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => handleSetDuration(validation.availableBalance)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-2xs"
                        >
                          ⚡ Limit to {validation.availableBalance} Available Day{validation.availableBalance === 1 ? '' : 's'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setLeaveForm({ ...leaveForm, leaveType: 'Unpaid Leave' });
                          setSubmitError(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-100/70 border border-rose-300 text-rose-800 font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        🔄 Switch to Unpaid Leave (Loss of Pay)
                      </button>
                      {/* Suggest alternative category with quota */}
                      {validation.allCategories
                        .filter((c) => !c.isExemptFromQuota && c.leaveType !== leaveForm.leaveType && c.availableDays >= (leaveForm.numberOfDays || 1))
                        .slice(0, 1)
                        .map((alt) => (
                          <button
                            key={alt.leaveType}
                            type="button"
                            onClick={() => {
                              setLeaveForm({ ...leaveForm, leaveType: alt.leaveType });
                              setSubmitError(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-[10px] transition-colors cursor-pointer"
                          >
                            Switch to {alt.label} ({alt.availableDays}d left)
                          </button>
                        ))}
                    </div>
                  </div>
                ) : validation.category.isExemptFromQuota ? (
                  /* UNPAID / EXEMPT LEAVE INFO BANNER */
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start space-x-2.5">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <span className="font-bold block text-amber-800">Loss of Pay (Unpaid Leave) Policy:</span>
                      This application is exempt from quota balance limits. It will be submitted for management review and recorded as a prorated deduction in monthly payroll calculation.
                    </div>
                  </div>
                ) : (
                  /* VALID / VERIFIED BALANCE STATE */
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="text-[11px]">
                      <span className="font-bold text-emerald-800">Balance Verified: </span>
                      {validation.requestedDays} day(s) requested within available {validation.category.label} quota (
                      {validation.availableBalance} days available). Balance remaining after approval: <strong>{validation.balanceAfterRequest} day(s)</strong>.
                    </div>
                  </div>
                )}
              </div>

              {/* Handover / Substitute Colleague */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Handover / Duty Colleague</label>
                <input
                  type="text"
                  placeholder="e.g. Arvind Menon (will cover assigned tasks)"
                  value={leaveForm.substituteStaff}
                  onChange={(e) => setLeaveForm({ ...leaveForm, substituteStaff: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#168A45]"
                />
              </div>

              {/* Reason for Absence */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Reason for Absence</label>
                  <span className="text-[10px] text-slate-400">Required for management review</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="State reason for absence (e.g. Medical appointment, family event, personal travel)..."
                  value={leaveForm.reason}
                  onChange={(e) => {
                    setLeaveForm({ ...leaveForm, reason: e.target.value });
                    setSubmitError(null);
                  }}
                  className="w-full border border-slate-200 rounded-xl p-3 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#168A45]"
                />
              </div>

              {/* Generic error banner if submission failed */}
              {submitError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{submitError}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {!validation.canSubmit ? (
                  <span className="text-rose-600 font-semibold flex items-center space-x-1">
                    <ShieldAlert className="w-3.5 h-3.5 inline" />
                    <span>Duration exceeds balance. Submission locked.</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                    <CheckCircle className="w-3.5 h-3.5 inline" />
                    <span>Ready for submission ({validation.requestedDays} days)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsApplyLeaveOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!validation.canSubmit}
                  onClick={() => {
                    setSubmitAttempted(true);
                    if (!validation.canSubmit) {
                      setSubmitError(validation.errors[0] || 'Cannot submit: Leave balance exceeded.');
                      return;
                    }
                    const targetStaff = staff.find((s) => s.id === leaveForm.staffId) || staff[0];
                    try {
                      onSubmitLeaveRequest({
                        ...leaveForm,
                        staffId: targetStaff.id,
                        staffName: targetStaff.fullName,
                        department: targetStaff.department,
                        position: targetStaff.position,
                      });
                      setIsApplyLeaveOpen(false);
                      setSubmitError(null);
                    } catch (err: any) {
                      setSubmitError(err.message || 'Failed to submit leave application.');
                    }
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all ${
                    !validation.canSubmit
                      ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                      : 'bg-[#168A45] hover:bg-[#0B5D2A] text-white cursor-pointer shadow-xs'
                  }`}
                >
                  {!validation.canSubmit
                    ? validation.exceededBy > 0
                      ? 'Blocked: Exceeds Balance'
                      : 'Submit Application'
                    : `Submit Application (${validation.requestedDays} Day${validation.requestedDays === 1 ? '' : 's'})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
