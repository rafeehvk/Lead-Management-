import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CheckSquare,
  ListTodo,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Shield,
  Building2,
  UserCheck,
  User as UserIcon,
  LogOut,
  MapPin,
  CalendarCheck2,
  CalendarX2,
  Sparkles,
  Search,
  Filter,
  FileText,
  Send,
  Plus,
  Play,
  RotateCcw,
  Check,
  AlertTriangle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { User } from '../../types';
import { StaffMember, DailyAttendanceRecord, LeaveRequest, LeaveType } from '../../types/hr';
import { AllocatedTask, TaskPriority, TaskStatus, TaskCategory } from '../../types/tasks';
import { hrStorage } from '../../services/hrStorageService';
import { taskAllocationStorage } from '../../services/taskAllocationStorageService';
import { TaskDetailModal } from '../tasks/TaskDetailModal';

interface StaffDashboardViewProps {
  currentUser: User;
  allStaff?: StaffMember[];
  attendance?: DailyAttendanceRecord[];
  onNavigateToTab?: (tab: string) => void;
  onLogout?: () => void;
}

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({
  currentUser,
  allStaff: propAllStaff,
  onNavigateToTab,
  onLogout,
}) => {
  // 1. Current Staff Resolution
  const [allStaff, setAllStaff] = useState<StaffMember[]>(() => propAllStaff || hrStorage.getStaff());

  useEffect(() => {
    if (propAllStaff) {
      setAllStaff(propAllStaff);
    }
  }, [propAllStaff]);

  const matchedStaff = useMemo(() => {
    const list = allStaff.length > 0 ? allStaff : hrStorage.getStaff();
    return (
      list.find(
        (s) =>
          (currentUser.staffId && s.id === currentUser.staffId) ||
          (currentUser.staffId && s.staffId === currentUser.staffId) ||
          (currentUser.userId &&
            s.systemAccess?.username?.toLowerCase() === currentUser.userId.toLowerCase()) ||
          (currentUser.email && s.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser.name && s.fullName?.toLowerCase() === currentUser.name.toLowerCase())
      ) || null
    );
  }, [allStaff, currentUser]);

  const staffId = matchedStaff?.id || currentUser.staffId || currentUser.id || 'STAFF-001';
  const staffName = matchedStaff?.fullName || currentUser.name || 'Staff Member';
  const staffDepartment = matchedStaff?.department || currentUser.department || 'Operations';
  const staffBranch = matchedStaff?.branchLocation || currentUser.branchAccess || 'Kochi Corporate HQ';
  const reportingManager = matchedStaff?.reportingManager || 'Department Head / Director';

  // 2. Real-time Live Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Attendance State
  const [todayAttendance, setTodayAttendance] = useState<DailyAttendanceRecord | undefined>(() =>
    hrStorage.getTodayAttendance(staffId)
  );
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendanceRecord[]>(() =>
    hrStorage.getAttendanceRecords()
  );
  const [checkInNotes, setCheckInNotes] = useState('');
  const [checkOutRemarks, setCheckOutRemarks] = useState('');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

  // Refresh attendance when storage changes
  const refreshAttendance = () => {
    setTodayAttendance(hrStorage.getTodayAttendance(staffId));
    setAttendanceRecords(hrStorage.getAttendanceRecords());
  };

  useEffect(() => {
    refreshAttendance();
    const handleUpdate = () => refreshAttendance();
    window.addEventListener('mysar_attendance_updated', handleUpdate);
    window.addEventListener('mysar_staff_updated', handleUpdate);
    window.addEventListener('mysar_hr_updated', handleUpdate);
    return () => {
      window.removeEventListener('mysar_attendance_updated', handleUpdate);
      window.removeEventListener('mysar_staff_updated', handleUpdate);
      window.removeEventListener('mysar_hr_updated', handleUpdate);
    };
  }, [staffId]);

  // Elapsed shift duration
  const elapsedShiftString = useMemo(() => {
    if (!todayAttendance || !todayAttendance.checkIn) return null;
    if (todayAttendance.checkOut) {
      return `${todayAttendance.workingHours || 8.0} hrs (Shift Completed)`;
    }

    try {
      // Calculate elapsed time from checkIn string (e.g. "09:30 AM")
      const today = new Date();
      const [timePart, modifier] = todayAttendance.checkIn.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const checkInDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0);
      const diffMs = Math.max(0, currentTime.getTime() - checkInDate.getTime());
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      return `${diffHrs}h ${String(diffMins).padStart(2, '0')}m ${String(diffSecs).padStart(2, '0')}s`;
    } catch {
      return 'Active Shift';
    }
  }, [todayAttendance, currentTime]);

  // Month stats for current staff
  const staffMonthAttendance = useMemo(() => {
    const currentMonthPrefix = new Date().toISOString().substring(0, 7); // YYYY-MM
    const staffRecords = attendanceRecords.filter(
      (r) => r.staffId === staffId && r.date.startsWith(currentMonthPrefix)
    );
    const present = staffRecords.filter((r) => r.status === 'Present').length;
    const late = staffRecords.filter((r) => r.status === 'Late').length;
    const halfDay = staffRecords.filter((r) => r.status === 'Half Day').length;
    const leave = staffRecords.filter((r) => r.status === 'Leave').length;
    return { present, late, halfDay, leave, total: staffRecords.length };
  }, [attendanceRecords, staffId]);

  // 4. Tasks State & Filtering
  const [tasks, setTasks] = useState<AllocatedTask[]>(() => taskAllocationStorage.getTasks());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState<string>('');
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<AllocatedTask | null>(null);

  // Deliverable Submission Modal
  const [deliverableModalTask, setDeliverableModalTask] = useState<AllocatedTask | null>(null);
  const [deliverableNotesInput, setDeliverableNotesInput] = useState('');
  const [deliverableLinkInput, setDeliverableLinkInput] = useState('');

  // Leave Request Modal
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveTypeInput, setLeaveTypeInput] = useState<LeaveType>('Casual Leave');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);
  const showToast = (type: 'success' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshTasks = () => {
    setTasks(taskAllocationStorage.getTasks());
  };

  useEffect(() => {
    refreshTasks();
    const handleUpdate = () => refreshTasks();
    window.addEventListener('mysar_tasks_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('mysar_tasks_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter tasks allocated to THIS staff member
  const myTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchId =
        t.assignedToStaffId &&
        (t.assignedToStaffId.toLowerCase() === staffId.toLowerCase() ||
          (matchedStaff?.staffId && t.assignedToStaffId.toLowerCase() === matchedStaff.staffId.toLowerCase()) ||
          (currentUser.staffId && t.assignedToStaffId.toLowerCase() === currentUser.staffId.toLowerCase()));

      const matchEmail =
        t.assignedToEmail &&
        currentUser.email &&
        t.assignedToEmail.toLowerCase() === currentUser.email.toLowerCase();

      const matchName =
        t.assignedToName &&
        staffName &&
        t.assignedToName.toLowerCase() === staffName.toLowerCase();

      return matchId || matchEmail || matchName;
    });
  }, [tasks, staffId, matchedStaff, currentUser, staffName]);

  const filteredTasks = useMemo(() => {
    return myTasks.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (taskSearchQuery.trim()) {
        const query = taskSearchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        const matchesCat = (t.category || '').toLowerCase().includes(query);
        const matchesAllocBy = (t.allocatedByName || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesCat && !matchesAllocBy) return false;
      }
      return true;
    });
  }, [myTasks, statusFilter, priorityFilter, taskSearchQuery]);

  // Task statistics
  const taskCounts = useMemo(() => {
    const total = myTasks.length;
    const inProgress = myTasks.filter((t) => t.status === 'In Progress').length;
    const pending = myTasks.filter((t) => t.status === 'Pending' || t.status === 'Assigned').length;
    const underReview = myTasks.filter((t) => t.status === 'Under Review').length;
    const completed = myTasks.filter((t) => t.status === 'Completed').length;
    const urgent = myTasks.filter((t) => t.priority === 'Urgent' || t.priority === 'Critical').length;
    return { total, inProgress, pending, underReview, completed, urgent };
  }, [myTasks]);

  // --------------------------------------------------------------------------
  // Handlers: Attendance In / Out
  // --------------------------------------------------------------------------
  const handleCheckIn = () => {
    const record = hrStorage.checkInStaff(staffId, checkInNotes || 'Office Desk Self Check-In');
    if (record) {
      refreshAttendance();
      setIsCheckInModalOpen(false);
      setCheckInNotes('');
      showToast('success', `Checked in successfully at ${record.checkIn}! Have a productive day.`);
    } else {
      showToast('info', 'Unable to record check-in. Please ensure staff profile is active.');
    }
  };

  const handleCheckOut = () => {
    const record = hrStorage.checkOutStaff(staffId, checkOutRemarks || 'Shift Completed Self Check-Out');
    if (record) {
      refreshAttendance();
      setIsCheckOutModalOpen(false);
      setCheckOutRemarks('');
      showToast('success', `Checked out successfully at ${record.checkOut}. Total shift: ${record.workingHours} hrs.`);
    } else {
      showToast('info', 'Unable to record check-out.');
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Task Actions
  // --------------------------------------------------------------------------
  const handleToggleChecklist = (taskId: string, chkId: string) => {
    const updated = taskAllocationStorage.toggleChecklistItem(
      taskId,
      chkId,
      staffName,
      'Staff'
    );
    if (updated) {
      refreshTasks();
    }
  };

  const handleQuickProgress = (task: AllocatedTask, deltaOrExact: number, isExact = false) => {
    const newProgress = isExact ? deltaOrExact : Math.min(100, Math.max(0, task.progress + deltaOrExact));
    const updated = taskAllocationStorage.updateProgress(
      task.id,
      newProgress,
      staffName,
      'Staff',
      `Updated progress to ${newProgress}%`
    );
    if (updated) {
      refreshTasks();
      showToast('success', `Updated task progress to ${newProgress}%.`);
    }
  };

  const handleStartTask = (taskId: string) => {
    const updated = taskAllocationStorage.updateTask(
      taskId,
      { status: 'In Progress' },
      staffName,
      'Staff',
      'Status Changed',
      'Started working on allocated task.'
    );
    if (updated) {
      refreshTasks();
      showToast('success', 'Task moved to In Progress!');
    }
  };

  const handleOpenSubmitDeliverable = (task: AllocatedTask) => {
    setDeliverableModalTask(task);
    setDeliverableNotesInput(task.deliverableNotes || '');
    setDeliverableLinkInput(task.deliverableLink || '');
  };

  const handleSubmitDeliverable = () => {
    if (!deliverableModalTask) return;
    const updated = taskAllocationStorage.updateTask(
      deliverableModalTask.id,
      {
        deliverableNotes: deliverableNotesInput,
        deliverableLink: deliverableLinkInput,
        status: 'Under Review',
        progress: 100,
      },
      staffName,
      'Staff',
      'Deliverables Submitted',
      'Submitted deliverables for manager/director review.'
    );
    if (updated) {
      refreshTasks();
      setDeliverableModalTask(null);
      showToast('success', 'Deliverables submitted for Manager/Director review!');
    }
  };

  const handleMarkComplete = (taskId: string) => {
    const updated = taskAllocationStorage.updateTask(
      taskId,
      { status: 'Completed', progress: 100 },
      staffName,
      'Staff',
      'Task Completed',
      'Task marked completed by staff.'
    );
    if (updated) {
      refreshTasks();
      showToast('success', 'Task marked completed!');
    }
  };

  // --------------------------------------------------------------------------
  // Handlers: Leave Submission
  // --------------------------------------------------------------------------
  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) {
      showToast('info', 'Please enter a reason for the leave request.');
      return;
    }

    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    try {
      hrStorage.submitLeaveRequest(
        {
          staffId,
          staffName,
          department: staffDepartment,
          position: matchedStaff?.position || 'Staff Role',
          leaveType: leaveTypeInput,
          fromDate: leaveStartDate,
          toDate: leaveEndDate,
          numberOfDays: days,
          reason: leaveReason,
        },
        staffName
      );
      setIsLeaveModalOpen(false);
      setLeaveReason('');
      showToast('success', `Leave application for ${days} day(s) submitted for approval.`);
    } catch (err: any) {
      showToast('info', err?.message || 'Could not submit leave request.');
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border flex items-center space-x-2 text-sm font-semibold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-slate-800 text-white border-slate-900'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            ) : (
              <Info className="w-5 h-5 text-blue-200" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Staff Profile & Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B5D2A] via-[#127237] to-[#168A45] rounded-2xl p-6 text-white shadow-sm border border-[#0B5D2A]/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-2xl shadow-inner shrink-0">
              {matchedStaff?.profilePhoto ? (
                <img
                  src={matchedStaff.profilePhoto}
                  alt={staffName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span>{staffName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight">{staffName}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/20 text-white border border-white/30">
                  {staffId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-400/20 text-emerald-100 border border-emerald-300/30">
                  Staff Workspace
                </span>
              </div>
              <p className="text-emerald-100 text-xs md:text-sm mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {staffDepartment}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {staffBranch}
                </span>
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  Reporting: {reportingManager}
                </span>
              </p>
            </div>
          </div>

          {/* Right Live Clock & Actions */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-right">
              <div className="text-[10px] text-emerald-100 font-semibold uppercase tracking-wider">
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className="text-xl font-mono font-black text-white tracking-wide">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLeaveModalOpen(true)}
              className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>Apply Leave</span>
            </button>

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('my-allowed-pages')}
                className="px-4 py-2.5 bg-white text-[#0B5D2A] hover:bg-emerald-50 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
              >
                <span>My Allowed Pages</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PROMINENT ATTENDANCE CARD (DEFAULT CHECK-IN & CHECK-OUT)              */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl -z-0 opacity-70"></div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-[#EAF7EF] text-[#168A45] rounded-xl border border-[#168A45]/20">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-slate-800">
                    Daily Attendance & Shift Control
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Default check-in and check-out tracking for staff access
                  </p>
                </div>
              </div>
            </div>

            {/* Attendance Status Badge */}
            <div className="flex items-center space-x-3">
              {!todayAttendance?.checkIn ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>Not Checked In Today</span>
                </div>
              ) : !todayAttendance?.checkOut ? (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>Active Shift: Checked In at {todayAttendance.checkIn}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Shift Completed ({todayAttendance.workingHours} hrs)</span>
                </div>
              )}
            </div>
          </div>

          {/* Main Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-5">
            {/* Left Shift Status & Elapsed Timer */}
            <div className="md:col-span-6 bg-slate-50 rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Today's Shift Timer
                </div>
                <div className="mt-2 flex items-baseline space-x-3">
                  <div className="text-2xl md:text-3xl font-black font-mono text-slate-800">
                    {elapsedShiftString || '0h 00m 00s'}
                  </div>
                  {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  {todayAttendance?.checkIn
                    ? `Check In: ${todayAttendance.checkIn} ${
                        todayAttendance.checkOut ? `• Check Out: ${todayAttendance.checkOut}` : '• Running'
                      }`
                    : 'Standard Shift: 09:00 AM – 05:30 PM (8.0 Hours)'}
                </p>
                {todayAttendance?.remarks && (
                  <p className="text-[11px] text-slate-500 mt-1 italic">
                    Note: "{todayAttendance.remarks}"
                  </p>
                )}
              </div>

              {/* Month stats quick badges */}
              <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-200">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Present</div>
                  <div className="text-sm font-black text-emerald-700">{staffMonthAttendance.present}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Late</div>
                  <div className="text-sm font-black text-amber-700">{staffMonthAttendance.late}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Half Day</div>
                  <div className="text-sm font-black text-blue-700">{staffMonthAttendance.halfDay}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 font-semibold">Leaves</div>
                  <div className="text-sm font-black text-rose-700">{staffMonthAttendance.leave}</div>
                </div>
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="md:col-span-6 flex flex-col justify-center space-y-3">
              {/* Check In Button */}
              <button
                type="button"
                disabled={Boolean(todayAttendance?.checkIn)}
                onClick={() => setIsCheckInModalOpen(true)}
                className={`w-full py-4 px-6 rounded-xl font-black text-sm md:text-base flex items-center justify-between transition-all cursor-pointer shadow-sm ${
                  !todayAttendance?.checkIn
                    ? 'bg-[#168A45] hover:bg-[#0B5D2A] text-white hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`p-2 rounded-lg ${
                      !todayAttendance?.checkIn ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                  <div className="text-left">
                    <div>Mark Attendance In (Check In)</div>
                    <div className="text-[11px] font-normal opacity-90">
                      {!todayAttendance?.checkIn
                        ? 'Click to register shift start timestamp'
                        : `Already checked in at ${todayAttendance.checkIn}`}
                    </div>
                  </div>
                </div>
                {!todayAttendance?.checkIn && <ChevronRight className="w-5 h-5" />}
              </button>

              {/* Check Out Button */}
              <button
                type="button"
                disabled={!todayAttendance?.checkIn || Boolean(todayAttendance?.checkOut)}
                onClick={() => setIsCheckOutModalOpen(true)}
                className={`w-full py-4 px-6 rounded-xl font-black text-sm md:text-base flex items-center justify-between transition-all cursor-pointer shadow-sm ${
                  todayAttendance?.checkIn && !todayAttendance?.checkOut
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-md'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`p-2 rounded-lg ${
                      todayAttendance?.checkIn && !todayAttendance?.checkOut
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    <LogOut className="w-5 h-5" />
                  </span>
                  <div className="text-left">
                    <div>Mark Attendance Out (Check Out)</div>
                    <div className="text-[11px] font-normal opacity-90">
                      {todayAttendance?.checkOut
                        ? `Shift completed at ${todayAttendance.checkOut}`
                        : todayAttendance?.checkIn
                        ? 'Click to conclude shift & compute total working hours'
                        : 'Requires check-in first'}
                    </div>
                  </div>
                </div>
                {todayAttendance?.checkIn && !todayAttendance?.checkOut && (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* ALLOCATED TASKS DASHBOARD SECTION                                     */}
      {/* -------------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#EAF7EF] text-[#168A45] rounded-xl border border-[#168A45]/20">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                My Allocated Tasks & Deliverables
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tasks allocated to you by Department Managers & Directors
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold">
              Total Assigned: {taskCounts.total}
            </span>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
              Completed: {taskCounts.completed}
            </span>
          </div>
        </div>

        {/* Task Summary Stat Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div
            onClick={() => setStatusFilter('all')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">All Tasks</div>
            <div className="text-xl font-black mt-1">{taskCounts.total}</div>
          </div>

          <div
            onClick={() => setStatusFilter('In Progress')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'In Progress'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-blue-50/60 text-blue-900 hover:bg-blue-100/60 border-blue-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">In Progress</div>
            <div className="text-xl font-black mt-1 text-blue-700">{taskCounts.inProgress}</div>
          </div>

          <div
            onClick={() => setStatusFilter('Pending')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Pending'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100/60 border-amber-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Pending</div>
            <div className="text-xl font-black mt-1 text-amber-700">{taskCounts.pending}</div>
          </div>

          <div
            onClick={() => setStatusFilter('Under Review')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Under Review'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-purple-50/60 text-purple-900 hover:bg-purple-100/60 border-purple-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Under Review</div>
            <div className="text-xl font-black mt-1 text-purple-700">{taskCounts.underReview}</div>
          </div>

          <div
            onClick={() => setStatusFilter('Completed')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === 'Completed'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/60 border-emerald-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Completed</div>
            <div className="text-xl font-black mt-1 text-emerald-700">{taskCounts.completed}</div>
          </div>

          <div
            onClick={() => setPriorityFilter(priorityFilter === 'Urgent' ? 'all' : 'Urgent')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              priorityFilter === 'Urgent'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-rose-50/60 text-rose-900 hover:bg-rose-100/60 border-rose-200'
            }`}
          >
            <div className="text-[11px] font-semibold opacity-80">Urgent / High</div>
            <div className="text-xl font-black mt-1 text-rose-700">{taskCounts.urgent}</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search my allocated tasks..."
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
              className="w-full bg-[#F7FAF8] border border-gray-200 text-slate-800 text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#168A45] focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#168A45]"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Under Review">Under Review</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-white border border-gray-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:border-[#168A45]"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Task Cards List / Empty State */}
        {filteredTasks.length === 0 ? (
          <div className="bg-[#F7FAF8] rounded-2xl p-10 text-center border-2 border-dashed border-gray-200">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white shadow-xs border border-gray-200 flex items-center justify-center text-slate-400 mb-3">
              <CheckSquare className="w-7 h-7 text-[#168A45]" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Allocated Tasks Found
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {myTasks.length === 0
                ? 'You do not have any tasks allocated at the moment. When your manager or director assigns new work items or project milestones, they will appear right here.'
                : 'No tasks match your current filter criteria. Try clearing the filters.'}
            </p>
            {myTasks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setPriorityFilter('all');
                  setTaskSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const priorityColors: Record<TaskPriority, string> = {
                Critical: 'bg-red-50 text-red-800 border-red-200',
                Urgent: 'bg-rose-50 text-rose-800 border-rose-200',
                High: 'bg-amber-50 text-amber-800 border-amber-200',
                Medium: 'bg-blue-50 text-blue-800 border-blue-200',
                Low: 'bg-slate-100 text-slate-700 border-slate-200',
              };

              const statusColors: Record<TaskStatus, string> = {
                Pending: 'bg-amber-50 text-amber-800 border-amber-200',
                Assigned: 'bg-sky-50 text-sky-800 border-sky-200',
                'In Progress': 'bg-blue-50 text-blue-800 border-blue-200',
                'Under Review': 'bg-purple-50 text-purple-800 border-purple-200',
                'Needs Revision': 'bg-orange-50 text-orange-800 border-orange-200',
                Completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                Overdue: 'bg-red-50 text-red-800 border-red-200',
                Cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
              };

              const completedChecklists = (task.checklists || []).filter((c) => c.completed).length;
              const totalChecklists = (task.checklists || []).length;

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-xl p-5 border border-gray-200 hover:border-[#168A45]/40 transition-all shadow-xs hover:shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {task.id}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            priorityColors[task.priority] || priorityColors.Medium
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            statusColors[task.status] || statusColors.Pending
                          }`}
                        >
                          {task.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                          {task.category}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 mt-2">
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 font-medium">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          Allocated By: <strong className="text-slate-700">{task.allocatedByName}</strong> ({task.allocatedByRole})
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due: <strong className="text-slate-800">{task.dueDate}</strong>
                        </span>
                        {task.estimatedHours > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Est. {task.estimatedHours} hrs
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Actions */}
                    <div className="w-full md:w-56 shrink-0 pt-2 md:pt-0">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className={`h-full transition-all duration-300 ${
                            task.progress >= 100
                              ? 'bg-emerald-600'
                              : task.progress >= 50
                              ? 'bg-blue-600'
                              : 'bg-[#168A45]'
                          }`}
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>

                      {/* Quick progress buttons */}
                      {task.status !== 'Completed' && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => handleQuickProgress(task, 10)}
                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            +10%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickProgress(task, 25)}
                            className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            +25%
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickProgress(task, 100, true)}
                            className="flex-1 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            100%
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Checklists Preview (if available) */}
                  {totalChecklists > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-xl">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                        <span className="flex items-center gap-1.5">
                          <ListTodo className="w-4 h-4 text-[#168A45]" />
                          Checklist Items ({completedChecklists}/{totalChecklists})
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {task.checklists.map((chk) => (
                          <label
                            key={chk.id}
                            className={`flex items-start space-x-2 text-xs p-2 rounded-lg border transition-all cursor-pointer ${
                              chk.completed
                                ? 'bg-emerald-50/60 border-emerald-200 text-slate-500 line-through'
                                : 'bg-white border-gray-200 text-slate-800 hover:border-[#168A45]/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={chk.completed}
                              onChange={() => handleToggleChecklist(task.id, chk.id)}
                              className="mt-0.5 rounded text-[#168A45] focus:ring-[#168A45] cursor-pointer"
                            />
                            <span className="font-medium leading-snug">{chk.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Task Action Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {task.status === 'Pending' && (
                        <button
                          type="button"
                          onClick={() => handleStartTask(task.id)}
                          className="px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Start Working</span>
                        </button>
                      )}

                      {task.status !== 'Completed' && (
                        <button
                          type="button"
                          onClick={() => handleOpenSubmitDeliverable(task)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Deliverable / Notes</span>
                        </button>
                      )}

                      {task.status !== 'Completed' && task.progress >= 90 && (
                        <button
                          type="button"
                          onClick={() => handleMarkComplete(task.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Completed</span>
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedTaskForDetail(task)}
                      className="px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-gray-100 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                    >
                      <span>Full Details & History</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 1: CHECK-IN CONFIRMATION                                        */}
      {/* -------------------------------------------------------------------- */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Confirm Shift Check-In
                </h3>
                <p className="text-xs text-slate-500">
                  Register your presence for today ({new Date().toLocaleDateString()})
                </p>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div>
                Staff: <strong>{staffName}</strong> ({staffId})
              </div>
              <div>
                Location: <strong>{staffBranch}</strong>
              </div>
              <div>
                Time: <strong>{currentTime.toLocaleTimeString()}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Optional Work Location / Notes
              </label>
              <input
                type="text"
                placeholder="e.g. Office Desk, Kakkanad Campus, On-site meeting"
                value={checkInNotes}
                onChange={(e) => setCheckInNotes(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckInModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckIn}
                className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Check In</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 2: CHECK-OUT CONFIRMATION                                       */}
      {/* -------------------------------------------------------------------- */}
      {isCheckOutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                <LogOut className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Confirm Shift Check-Out
                </h3>
                <p className="text-xs text-slate-500">
                  Conclude your shift and compute today's work hours
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 text-xs text-blue-900 space-y-1">
              <div>
                Shift In Time: <strong>{todayAttendance?.checkIn || '09:00 AM'}</strong>
              </div>
              <div>
                Current Check Out Time: <strong>{currentTime.toLocaleTimeString()}</strong>
              </div>
              <div>
                Total Elapsed: <strong>{elapsedShiftString}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shift Concluding Remarks / Tasks Completed Today
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Completed documentation, resolved client queries"
                value={checkOutRemarks}
                onChange={(e) => setCheckOutRemarks(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCheckOutModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCheckOut}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Confirm Check Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 3: SUBMIT DELIVERABLE                                           */}
      {/* -------------------------------------------------------------------- */}
      {deliverableModalTask && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-gray-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-black text-slate-900">
                Submit Task Deliverable
              </h3>
              <button
                type="button"
                onClick={() => setDeliverableModalTask(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-500">Task Title</div>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                {deliverableModalTask.title}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deliverable Link (Google Drive / GitHub / Sheet / Docs URL)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/..."
                value={deliverableLinkInput}
                onChange={(e) => setDeliverableLinkInput(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Summary Notes / Output Description
              </label>
              <textarea
                rows={3}
                placeholder="Explain the work done, milestone reached, or instructions for the manager review..."
                value={deliverableNotesInput}
                onChange={(e) => setDeliverableNotesInput(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeliverableModalTask(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitDeliverable}
                className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
                <span>Submit for Review</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 4: LEAVE REQUEST MODAL                                          */}
      {/* -------------------------------------------------------------------- */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitLeave}
            className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-[#168A45]" />
                <h3 className="text-base font-black text-slate-900">
                  Submit Leave Request
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Leave Type
              </label>
              <select
                value={leaveTypeInput}
                onChange={(e) => setLeaveTypeInput(e.target.value as LeaveType)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#168A45]"
              >
                <option value="Casual Leave">Casual Leave (CL)</option>
                <option value="Sick Leave">Sick Leave (SL)</option>
                <option value="Annual Leave">Annual Leave (AL)</option>
                <option value="Emergency Leave">Emergency Leave</option>
                <option value="Unpaid Leave">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  required
                  value={leaveStartDate}
                  onChange={(e) => setLeaveStartDate(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  required
                  value={leaveEndDate}
                  onChange={(e) => setLeaveEndDate(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Leave
              </label>
              <textarea
                required
                rows={3}
                placeholder="Specify reason for leave application..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
              ></textarea>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
                <span>Submit Leave</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MODAL 5: FULL TASK DETAIL MODAL                                       */}
      {/* -------------------------------------------------------------------- */}
      {selectedTaskForDetail && (
        <TaskDetailModal
          task={selectedTaskForDetail}
          isOpen={Boolean(selectedTaskForDetail)}
          onClose={() => setSelectedTaskForDetail(null)}
          currentUser={currentUser}
          onTaskUpdated={(updated) => {
            setSelectedTaskForDetail(updated);
            refreshTasks();
          }}
        />
      )}
    </div>
  );
};
