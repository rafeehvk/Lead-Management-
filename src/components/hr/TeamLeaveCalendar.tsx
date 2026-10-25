import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  MapPin,
  CalendarDays,
  Plus,
  X,
  FileText,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { StaffMember, LeaveRequest, LeaveType } from '../../types/hr';

interface TeamLeaveCalendarProps {
  staff: StaffMember[];
  leaveRequests: LeaveRequest[];
  onApplyLeave?: (staffId?: string) => void;
}

// Color schemes and badge styles for each leave type
export const LEAVE_TYPE_STYLES: Record<
  string,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
    badgeBg: string;
    label: string;
  }
> = {
  'Annual Leave': {
    bg: 'bg-emerald-50 hover:bg-emerald-100/90',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    label: 'Annual Leave',
  },
  'Casual Leave': {
    bg: 'bg-amber-50 hover:bg-amber-100/90',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    badgeBg: 'bg-amber-100 text-amber-800',
    label: 'Casual Leave',
  },
  'Sick Leave': {
    bg: 'bg-rose-50 hover:bg-rose-100/90',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    badgeBg: 'bg-rose-100 text-rose-800',
    label: 'Sick Leave',
  },
  'Emergency Leave': {
    bg: 'bg-red-50 hover:bg-red-100/90',
    text: 'text-red-900 font-semibold',
    border: 'border-red-300',
    dot: 'bg-red-600',
    badgeBg: 'bg-red-100 text-red-900',
    label: 'Emergency Leave',
  },
  'Maternity Leave': {
    bg: 'bg-purple-50 hover:bg-purple-100/90',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    badgeBg: 'bg-purple-100 text-purple-800',
    label: 'Maternity Leave',
  },
  'Paternity Leave': {
    bg: 'bg-indigo-50 hover:bg-indigo-100/90',
    text: 'text-indigo-800',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500',
    badgeBg: 'bg-indigo-100 text-indigo-800',
    label: 'Paternity Leave',
  },
  'Unpaid Leave': {
    bg: 'bg-slate-100 hover:bg-slate-200/90',
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500',
    badgeBg: 'bg-slate-200 text-slate-800',
    label: 'Unpaid Leave',
  },
  Other: {
    bg: 'bg-sky-50 hover:bg-sky-100/90',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
    badgeBg: 'bg-sky-100 text-sky-800',
    label: 'Other',
  },
};

export const getLeaveStyle = (leaveType: string) => {
  return LEAVE_TYPE_STYLES[leaveType] || LEAVE_TYPE_STYLES['Other'];
};

// Helper: Normalize date string to YYYY-MM-DD
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Checks if a target date string (YYYY-MM-DD) falls within [fromDate, toDate] inclusive
function isDateWithinRange(dateStr: string, fromDate: string, toDate: string): boolean {
  return dateStr >= fromDate && dateStr <= toDate;
}

export const TeamLeaveCalendar: React.FC<TeamLeaveCalendarProps> = ({
  staff = [],
  leaveRequests = [],
  onApplyLeave,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatDate(today), [today]);

  // Current calendar state
  const [currentYear, setCurrentYear] = useState<number>(() => today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(() => today.getMonth()); // 0-indexed
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');

  // Filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [branchFilter, setBranchFilter] = useState<string>('All');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'Approved' | 'All'>('Approved');

  // Selected day detail modal
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  // Extract unique departments & branches from staff and leave requests
  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    leaveRequests.forEach((l) => {
      if (l.department) set.add(l.department);
    });
    return Array.from(set).sort();
  }, [staff, leaveRequests]);

  const uniqueBranches = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => {
      if (s.branchLocation) set.add(s.branchLocation);
      if (s.workLocation) set.add(s.workLocation);
    });
    return Array.from(set).sort();
  }, [staff]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Month label
  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentYear, currentMonth]);

  // Filter staff lookup by search and department/branch
  const staffById = useMemo(() => {
    const map = new Map<string, StaffMember>();
    staff.forEach((s) => map.set(s.id, s));
    return map;
  }, [staff]);

  // Filtered leave requests
  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter((req) => {
      // Status filter: defaults to 'Approved'
      if (statusFilter === 'Approved' && req.status !== 'Approved') return false;

      // Department filter
      if (departmentFilter !== 'All' && req.department !== departmentFilter) return false;

      // Branch filter
      if (branchFilter !== 'All') {
        const staffObj = staffById.get(req.staffId);
        const staffBranch = staffObj?.branchLocation || staffObj?.workLocation;
        if (staffBranch !== branchFilter) return false;
      }

      // Leave type filter
      if (leaveTypeFilter !== 'All' && req.leaveType !== leaveTypeFilter) return false;

      // Search query (Staff name or ID)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = req.staffName?.toLowerCase().includes(q);
        const matchesId = req.staffId?.toLowerCase().includes(q);
        const matchesDept = req.department?.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept) return false;
      }

      return true;
    });
  }, [
    leaveRequests,
    statusFilter,
    departmentFilter,
    branchFilter,
    leaveTypeFilter,
    searchQuery,
    staffById,
  ]);

  // Calendar matrix calculation for the selected month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const totalDaysInMonth = lastDayOfMonth.getDate();
    // 0 = Sunday, 1 = Monday, etc.
    const startDayOfWeek = firstDayOfMonth.getDay();

    // Previous month filler days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
      leaves: LeaveRequest[];
    }[] = [];

    // Fill previous month days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const d = new Date(currentYear, currentMonth - 1, dayNum);
      const dStr = formatDate(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const matchingLeaves = filteredLeaveRequests.filter((req) =>
        isDateWithinRange(dStr, req.fromDate, req.toDate)
      );

      days.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isWeekend,
        leaves: matchingLeaves,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(currentYear, currentMonth, dayNum);
      const dStr = formatDate(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const matchingLeaves = filteredLeaveRequests.filter((req) =>
        isDateWithinRange(dStr, req.fromDate, req.toDate)
      );

      days.push({
        dateStr: dStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isWeekend,
        leaves: matchingLeaves,
      });
    }

    // Next month filler days to complete standard 35 or 42 grid
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      const dStr = formatDate(d);
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const matchingLeaves = filteredLeaveRequests.filter((req) =>
        isDateWithinRange(dStr, req.fromDate, req.toDate)
      );

      days.push({
        dateStr: dStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        isWeekend,
        leaves: matchingLeaves,
      });
    }

    return days;
  }, [currentYear, currentMonth, filteredLeaveRequests, todayStr]);

  // Overall statistics for current month and today
  const stats = useMemo(() => {
    const totalStaffCount = staff.length || 1;

    // Staff currently on approved leave today
    const onLeaveToday = filteredLeaveRequests.filter((req) =>
      isDateWithinRange(todayStr, req.fromDate, req.toDate)
    );
    const uniqueStaffOnLeaveToday = new Set(onLeaveToday.map((r) => r.staffId)).size;
    const availableToday = Math.max(0, totalStaffCount - uniqueStaffOnLeaveToday);
    const availabilityRate = Math.round((availableToday / totalStaffCount) * 100);

    // Leaves scheduled in the selected month
    const monthStart = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
    const monthEnd = formatDate(new Date(currentYear, currentMonth + 1, 0));

    const monthLeaves = filteredLeaveRequests.filter(
      (r) => r.fromDate <= monthEnd && r.toDate >= monthStart
    );

    // High coverage alert: days with >= 2 staff on leave in the same department
    const highImpactDays: { dateStr: string; department: string; count: number }[] = [];
    calendarDays.forEach((day) => {
      if (!day.isCurrentMonth) return;
      const deptCounts = new Map<string, number>();
      day.leaves.forEach((l) => {
        const d = l.department || 'General';
        deptCounts.set(d, (deptCounts.get(d) || 0) + 1);
      });
      deptCounts.forEach((count, dept) => {
        if (count >= 2) {
          highImpactDays.push({ dateStr: day.dateStr, department: dept, count });
        }
      });
    });

    return {
      totalStaffCount,
      onLeaveTodayCount: uniqueStaffOnLeaveToday,
      availableTodayCount: availableToday,
      availabilityRate,
      monthTotalLeavesCount: monthLeaves.length,
      highImpactDays,
    };
  }, [staff, filteredLeaveRequests, todayStr, currentYear, currentMonth, calendarDays]);

  // Modal data when a date is selected
  const modalDateData = useMemo(() => {
    if (!selectedDayModal) return null;
    const leavesOnDate = filteredLeaveRequests.filter((req) =>
      isDateWithinRange(selectedDayModal, req.fromDate, req.toDate)
    );

    // Department-level availability breakdown on this specific date
    const deptAvailability = uniqueDepartments.map((dept) => {
      const deptStaff = staff.filter((s) => s.department === dept);
      const deptTotal = deptStaff.length || 1;
      const deptOnLeave = leavesOnDate.filter((l) => l.department === dept);
      const onLeaveCount = deptOnLeave.length;
      const availableCount = Math.max(0, deptTotal - onLeaveCount);
      const percent = Math.round((availableCount / deptTotal) * 100);

      return {
        department: dept,
        total: deptTotal,
        onLeave: onLeaveCount,
        available: availableCount,
        percent,
      };
    });

    const parsedDate = new Date(`${selectedDayModal}T00:00:00`);
    const formattedHeader = parsedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      dateStr: selectedDayModal,
      formattedHeader,
      leaves: leavesOnDate,
      deptAvailability,
    };
  }, [selectedDayModal, filteredLeaveRequests, uniqueDepartments, staff]);

  // Weekly Timeline days (7 days of currently active week or current week in month)
  const [selectedTimelineWeekIndex, setSelectedTimelineWeekIndex] = useState<number>(0);

  const timelineWeeks = useMemo(() => {
    const weeks: {
      weekIndex: number;
      label: string;
      days: { dateStr: string; dayName: string; dayNumber: number; isWeekend: boolean }[];
    }[] = [];

    for (let i = 0; i < calendarDays.length; i += 7) {
      const slice = calendarDays.slice(i, i + 7);
      if (slice.length === 0) continue;
      const first = slice[0];
      const last = slice[slice.length - 1];
      const weekIdx = Math.floor(i / 7);
      weeks.push({
        weekIndex: weekIdx,
        label: `Week ${weekIdx + 1} (${first.dateStr} to ${last.dateStr})`,
        days: slice.map((d) => {
          const dt = new Date(`${d.dateStr}T00:00:00`);
          return {
            dateStr: d.dateStr,
            dayName: dt.toLocaleDateString('en-US', { weekday: 'short' }),
            dayNumber: d.dayNumber,
            isWeekend: d.isWeekend,
          };
        }),
      });
    }
    return weeks;
  }, [calendarDays]);

  const activeTimelineWeek = useMemo(() => {
    return timelineWeeks[selectedTimelineWeekIndex] || timelineWeeks[0] || null;
  }, [timelineWeeks, selectedTimelineWeekIndex]);

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Roster */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-medium">Total Staff Roster</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.totalStaffCount}
            <span className="text-[11px] font-normal text-slate-500 ml-1.5">members</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active across departments</div>
        </div>

        {/* On Leave Today */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 text-xs">
            <span className="font-semibold">On Leave Today</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            {stats.onLeaveTodayCount}
            <span className="text-[11px] font-normal text-slate-500 ml-1.5">approved</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.onLeaveTodayCount === 0
              ? 'Full team active today'
              : `${stats.onLeaveTodayCount} team member${stats.onLeaveTodayCount > 1 ? 's' : ''} away`}
          </div>
        </div>

        {/* Team Availability */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs">
            <span className="font-semibold">Team Availability</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {stats.availabilityRate}%
            <span className="text-[11px] font-normal text-slate-500 ml-1.5">
              ({stats.availableTodayCount} on duty)
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {stats.availableTodayCount} of {stats.totalStaffCount} staff ready
          </div>
        </div>

        {/* Month Approved Leaves */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-600 text-xs">
            <span className="font-semibold">{monthName.split(' ')[0]} Leaves</span>
            <CalendarDays className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-1">
            {stats.monthTotalLeavesCount}
            <span className="text-[11px] font-normal text-slate-500 ml-1.5">scheduled</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {stats.highImpactDays.length > 0 ? (
              <span className="text-rose-600 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.highImpactDays.length} overlap alert
                {stats.highImpactDays.length > 1 ? 's' : ''}
              </span>
            ) : (
              'Smooth coverage anticipated'
            )}
          </div>
        </div>
      </div>

      {/* High-Impact Overlap Alert Banner (if any overlapping leaves in department) */}
      {stats.highImpactDays.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-200/80 rounded-xl text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold">Team Coverage Alert: </span>
              Multiple staff members are on leave on the same date ({stats.highImpactDays.length} day
              {stats.highImpactDays.length > 1 ? 's' : ''} with department overlap:
              {stats.highImpactDays.slice(0, 3).map((item, idx) => (
                <span key={idx} className="ml-1 font-semibold underline cursor-pointer" onClick={() => setSelectedDayModal(item.dateStr)}>
                  {item.dateStr} ({item.department}: {item.count})
                  {idx < Math.min(2, stats.highImpactDays.length - 1) ? ',' : ''}
                </span>
              ))}
              {stats.highImpactDays.length > 3 ? ` and ${stats.highImpactDays.length - 3} more` : ''}).
            </div>
          </div>
          <button
            onClick={() => setSelectedDayModal(stats.highImpactDays[0].dateStr)}
            className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 rounded-lg text-[11px] font-bold text-amber-900 transition-colors cursor-pointer"
          >
            Review Date
          </button>
        </div>
      )}

      {/* Control Bar: Month Navigation, Filters, and View Switch */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer shadow-2xs hover:text-slate-900"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer shadow-2xs hover:text-slate-900"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base font-bold text-slate-900 ml-1 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-[#168A45]" />
              <span>{monthName}</span>
            </h2>
          </div>

          {/* View Mode Toggle & Quick Apply */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Monthly Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Weekly Roster
              </button>
            </div>

            {onApplyLeave && (
              <button
                type="button"
                onClick={() => onApplyLeave()}
                className="px-3 py-1.5 rounded-xl bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Apply Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff name / ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Departments</option>
              {uniqueDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Branch Filter */}
            {uniqueBranches.length > 0 && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="All">All Branches</option>
                {uniqueBranches.map((br) => (
                  <option key={br} value={br}>
                    {br}
                  </option>
                ))}
              </select>
            )}

            {/* Leave Type Filter */}
            <select
              value={leaveTypeFilter}
              onChange={(e) => setLeaveTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="All">All Leave Types</option>
              {Object.keys(LEAVE_TYPE_STYLES).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {/* Status Toggle */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200/80">
              <input
                type="checkbox"
                id="approvedOnlyToggle"
                checked={statusFilter === 'Approved'}
                onChange={(e) => setStatusFilter(e.target.checked ? 'Approved' : 'All')}
                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="approvedOnlyToggle" className="cursor-pointer select-none font-medium">
                Approved Only
              </label>
            </div>
          </div>

          {/* Quick Active Count Indicator */}
          <div className="text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredLeaveRequests.length}</strong> leave record
            {filteredLeaveRequests.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: MONTHLY CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Day of Week Headers (Sunday to Saturday) */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider py-2.5">
            <div className="text-rose-600">Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-slate-500">Sat</div>
          </div>

          {/* 7-column Calendar Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200/70">
            {calendarDays.map((day, idx) => {
              const hasLeaves = day.leaves.length > 0;
              const isOverloaded = day.leaves.length >= 2;

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => setSelectedDayModal(day.dateStr)}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-all cursor-pointer relative group ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                  } ${day.isWeekend && day.isCurrentMonth ? 'bg-slate-50/30' : ''} ${
                    day.isToday ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-50/20' : ''
                  } hover:bg-emerald-50/30`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        day.isToday
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {/* Day status badge */}
                    {day.isCurrentMonth && (
                      <div>
                        {hasLeaves ? (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                              isOverloaded
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {day.leaves.length} off
                          </span>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/50 block" title="Full availability"></span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Staff on Leave Pills */}
                  <div className="space-y-1 flex-1 overflow-hidden">
                    {day.leaves.slice(0, 3).map((leave) => {
                      const style = getLeaveStyle(leave.leaveType);
                      return (
                        <div
                          key={`${leave.id}-${day.dateStr}`}
                          className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate font-medium flex items-center space-x-1 ${style.bg} ${style.text} ${style.border} shadow-2xs transition-transform hover:scale-[1.02]`}
                          title={`${leave.staffName} (${leave.department}) - ${leave.leaveType}: ${leave.fromDate} to ${leave.toDate} (${leave.numberOfDays} days)`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`}></span>
                          <span className="font-bold truncate">{leave.staffName}</span>
                          <span className="text-[9px] opacity-75 shrink-0 hidden sm:inline">
                            • {leave.leaveType.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })}

                    {day.leaves.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded text-center transition-colors">
                        +{day.leaves.length - 3} more on leave
                      </div>
                    )}
                  </div>

                  {/* Day Footer Availability Hint on Hover */}
                  <div className="text-[9px] text-slate-400 text-right opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                    Click for details
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: WEEKLY TIMELINE ROSTER */}
      {viewMode === 'timeline' && activeTimelineWeek && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Week Selector Bar */}
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-700">Select Week:</span>
              <select
                value={selectedTimelineWeekIndex}
                onChange={(e) => setSelectedTimelineWeekIndex(Number(e.target.value))}
                className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800"
              >
                {timelineWeeks.map((w) => (
                  <option key={w.weekIndex} value={w.weekIndex}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-slate-500">
              Horizontal availability timeline across all staff
            </div>
          </div>

          {/* Timeline Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 text-[11px] font-bold uppercase">
                  <th className="p-3 w-56 sticky left-0 bg-slate-100/95 z-10 border-r border-slate-200">
                    Employee & Department
                  </th>
                  {activeTimelineWeek.days.map((day) => (
                    <th
                      key={day.dateStr}
                      className={`p-2.5 text-center min-w-[110px] border-r border-slate-200 last:border-r-0 ${
                        day.dateStr === todayStr
                          ? 'bg-emerald-50 text-emerald-800 font-extrabold'
                          : day.isWeekend
                          ? 'bg-slate-100 text-slate-500'
                          : ''
                      }`}
                    >
                      <div>{day.dayName}</div>
                      <div className="text-[12px] font-bold text-slate-900 mt-0.5">
                        {day.dayNumber}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff
                  .filter((s) => {
                    if (departmentFilter !== 'All' && s.department !== departmentFilter) return false;
                    if (branchFilter !== 'All' && s.branchLocation !== branchFilter && s.workLocation !== branchFilter) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      return (
                        s.fullName?.toLowerCase().includes(q) ||
                        s.id?.toLowerCase().includes(q) ||
                        s.department?.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((emp) => {
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-900 sticky left-0 bg-white/95 z-10 border-r border-slate-200 shadow-2xs">
                          <div className="font-bold text-slate-900 truncate max-w-[200px]">{emp.fullName}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{emp.id}</span>
                            <span>•</span>
                            <span className="truncate max-w-[100px]">{emp.department}</span>
                          </div>
                        </td>

                        {activeTimelineWeek.days.map((day) => {
                          const leave = filteredLeaveRequests.find(
                            (r) => r.staffId === emp.id && isDateWithinRange(day.dateStr, r.fromDate, r.toDate)
                          );

                          if (leave) {
                            const style = getLeaveStyle(leave.leaveType);
                            return (
                              <td
                                key={day.dateStr}
                                onClick={() => setSelectedDayModal(day.dateStr)}
                                className={`p-1.5 text-center border-r border-slate-200 last:border-r-0 cursor-pointer ${style.bg}`}
                                title={`${emp.fullName} - ${leave.leaveType} (${leave.fromDate} to ${leave.toDate})`}
                              >
                                <div
                                  className={`px-1.5 py-1 rounded-md text-[10px] font-bold border ${style.border} ${style.text} flex items-center justify-center space-x-1 shadow-2xs`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                                  <span className="truncate">{leave.leaveType.split(' ')[0]}</span>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={day.dateStr}
                              onClick={() => setSelectedDayModal(day.dateStr)}
                              className={`p-2 text-center border-r border-slate-200 last:border-r-0 cursor-pointer ${
                                day.isWeekend ? 'bg-slate-50/50 text-slate-400' : 'hover:bg-slate-50'
                              }`}
                            >
                              {day.isWeekend ? (
                                <span className="text-[10px] text-slate-400 font-medium">Off</span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                  Available
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Leave Type Color Legend */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#168A45]" />
            Leave Type Legend:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {Object.entries(LEAVE_TYPE_STYLES).map(([type, style]) => (
              <div
                key={type}
                className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${style.bg} ${style.text} ${style.border}`}
              >
                <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                <span>{type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DAY DETAIL & TEAM COVERAGE MODAL */}
      {selectedDayModal && modalDateData && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  Team Availability Roster
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {modalDateData.formattedHeader}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Daily Coverage Overview Bar */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="text-[11px] text-slate-500 font-medium">Total Staff</div>
                  <div className="text-xl font-bold text-slate-900 mt-0.5">
                    {staff.length}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                  <div className="text-[11px] text-amber-700 font-medium">On Leave</div>
                  <div className="text-xl font-bold text-amber-800 mt-0.5">
                    {modalDateData.leaves.length}
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <div className="text-[11px] text-emerald-700 font-medium">Available On Duty</div>
                  <div className="text-xl font-bold text-emerald-800 mt-0.5">
                    {Math.max(0, staff.length - modalDateData.leaves.length)}
                  </div>
                </div>
              </div>

              {/* Staff on Leave on this Date */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Approved Leave Requests Active on this Date ({modalDateData.leaves.length})</span>
                  {modalDateData.leaves.length > 0 && (
                    <span className="text-[11px] font-normal text-slate-500">
                      Spans across this day
                    </span>
                  )}
                </h4>

                {modalDateData.leaves.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-slate-200/80">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-800">Full Team Active</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      No staff leaves scheduled for this date. All team members are available.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {modalDateData.leaves.map((leave) => {
                      const style = getLeaveStyle(leave.leaveType);
                      const staffInfo = staffById.get(leave.staffId);

                      return (
                        <div
                          key={leave.id}
                          className={`p-3.5 rounded-2xl border ${style.bg} ${style.border} shadow-2xs space-y-2`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></span>
                              <div className="font-bold text-sm text-slate-900">
                                {leave.staffName}
                              </div>
                              <span className="text-xs text-slate-500">({leave.staffId})</span>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${style.border} ${style.text} bg-white`}
                            >
                              {leave.leaveType}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Department:</span>
                              <span className="font-semibold text-slate-800">
                                {leave.department || staffInfo?.department || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Role / Position:</span>
                              <span className="font-semibold text-slate-800">
                                {leave.position || staffInfo?.position || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Duration:</span>
                              <span className="font-semibold text-slate-800">
                                {leave.fromDate} to {leave.toDate} ({leave.numberOfDays}d)
                              </span>
                            </div>
                          </div>

                          {leave.reason && (
                            <div className="text-xs bg-white/70 p-2 rounded-xl text-slate-700 border border-slate-200/50">
                              <span className="font-semibold text-slate-900">Reason: </span>
                              {leave.reason}
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                            <div>
                              Substitute / Handover:{' '}
                              <strong className="text-slate-700">
                                {leave.substituteStaff || 'None assigned'}
                              </strong>
                            </div>
                            <div>
                              Approved By:{' '}
                              <strong className="text-slate-700">
                                {leave.approvedBy || 'HR Admin'}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Department Availability Breakdown */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Department Availability Coverage
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {modalDateData.deptAvailability.map((dept) => {
                    const isFull = dept.onLeave === 0;
                    const isSevere = dept.percent < 50;

                    return (
                      <div
                        key={dept.department}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                          isSevere
                            ? 'bg-rose-50 border-rose-200'
                            : isFull
                            ? 'bg-emerald-50/50 border-emerald-200/60'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800">{dept.department}</div>
                          <div className="text-[10px] text-slate-500">
                            {dept.available} of {dept.total} available ({dept.percent}%)
                          </div>
                        </div>
                        <div>
                          {dept.onLeave > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                              {dept.onLeave} On Leave
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              100% Active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Data reflects approved leave requests across all synced devices.
              </span>
              <button
                type="button"
                onClick={() => setSelectedDayModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
