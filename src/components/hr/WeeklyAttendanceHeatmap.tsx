import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  CalendarX,
  XCircle,
  Search,
  Filter,
  TrendingUp,
  Users,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  StaffMember,
  DailyAttendanceRecord,
  LeaveRequest,
  AttendanceStatus,
} from '../../types/hr';

interface WeeklyAttendanceHeatmapProps {
  staff: StaffMember[];
  attendance: DailyAttendanceRecord[];
  leaveRequests?: LeaveRequest[];
  onMarkAttendance?: (
    staffId: string,
    date: string,
    status: AttendanceStatus,
    checkIn?: string,
    checkOut?: string,
    remarks?: string
  ) => void;
}

interface DayInfo {
  dateStr: string;
  dayNumber: number;
  dayNameShort: string;
  isSunday: boolean;
  isFuture: boolean;
  isToday: boolean;
  weekIndex: number;
}

interface WeekGroup {
  weekNumber: number;
  label: string;
  dateRangeLabel: string;
  days: DayInfo[];
}

export const WeeklyAttendanceHeatmap: React.FC<WeeklyAttendanceHeatmapProps> = ({
  staff = [],
  attendance = [],
  leaveRequests = [],
  onMarkAttendance,
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWeekFilter, setSelectedWeekFilter] = useState<number | 'all'>('all');
  const [activePopover, setActivePopover] = useState<{
    staffId: string;
    staffName: string;
    dateStr: string;
    currentStatus: AttendanceStatus;
  } | null>(null);

  // Parse selected year & month
  const [yearNum, monthNum] = useMemo(() => {
    const parts = selectedMonth.split('-');
    return [
      parseInt(parts[0], 10) || now.getFullYear(),
      parseInt(parts[1], 10) || now.getMonth() + 1,
    ];
  }, [selectedMonth]);

  const monthLabel = useMemo(() => {
    const d = new Date(yearNum, monthNum - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [yearNum, monthNum]);

  // Navigate prev/next month
  const handlePrevMonth = () => {
    const d = new Date(yearNum, monthNum - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedWeekFilter('all');
  };

  const handleNextMonth = () => {
    const d = new Date(yearNum, monthNum, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedWeekFilter('all');
  };

  const handleCurrentMonth = () => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
    setSelectedWeekFilter('all');
  };

  // Build days and weekly groups for the selected month
  const { allDays, weekGroups } = useMemo(() => {
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    const todayStr = new Date().toISOString().split('T')[0];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const days: DayInfo[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(yearNum, monthNum - 1, day);
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dow = dateObj.getDay();
      const weekIdx = Math.floor((day - 1) / 7) + 1;

      days.push({
        dateStr,
        dayNumber: day,
        dayNameShort: dayNames[dow],
        isSunday: dow === 0,
        isFuture: dateStr > todayStr,
        isToday: dateStr === todayStr,
        weekIndex: weekIdx,
      });
    }

    const groupsMap = new Map<number, DayInfo[]>();
    days.forEach((d) => {
      const list = groupsMap.get(d.weekIndex) || [];
      list.push(d);
      groupsMap.set(d.weekIndex, list);
    });

    const groups: WeekGroup[] = Array.from(groupsMap.entries()).map(([weekNumber, wDays]) => {
      const firstDay = wDays[0].dayNumber;
      const lastDay = wDays[wDays.length - 1].dayNumber;
      const shortMonth = new Date(yearNum, monthNum - 1, 1).toLocaleDateString('en-US', {
        month: 'short',
      });
      return {
        weekNumber,
        label: `Week ${weekNumber}`,
        dateRangeLabel: `${shortMonth} ${firstDay}–${lastDay}`,
        days: wDays,
      };
    });

    return { allDays: days, weekGroups: groups };
  }, [yearNum, monthNum]);

  // Lookup map for attendance records: `${staffId}_${dateStr}` -> DailyAttendanceRecord
  const attendanceMap = useMemo(() => {
    const map = new Map<string, DailyAttendanceRecord>();
    attendance.forEach((rec) => {
      map.set(`${rec.staffId}_${rec.date}`, rec);
    });
    return map;
  }, [attendance]);

  // Approved leave lookup helper
  const isStaffOnApprovedLeave = (staffId: string, dateStr: string): LeaveRequest | undefined => {
    return leaveRequests.find(
      (req) =>
        req.staffId === staffId &&
        req.status === 'Approved' &&
        req.fromDate <= dateStr &&
        req.toDate >= dateStr
    );
  };

  // Resolve effective attendance status for a staff member on a given date
  const resolveCellStatus = (
    member: StaffMember,
    day: DayInfo
  ): {
    status: AttendanceStatus | 'Weekend' | 'Upcoming';
    checkIn?: string;
    checkOut?: string;
    remarks?: string;
    isExplicitRecord: boolean;
  } => {
    const explicit = attendanceMap.get(`${member.id}_${day.dateStr}`);
    if (explicit) {
      return {
        status: explicit.status,
        checkIn: explicit.checkIn,
        checkOut: explicit.checkOut,
        remarks: explicit.remarks,
        isExplicitRecord: true,
      };
    }

    const approvedLeave = isStaffOnApprovedLeave(member.id, day.dateStr);
    if (approvedLeave) {
      return {
        status: 'Leave',
        remarks: `${approvedLeave.leaveType}: ${approvedLeave.reason}`,
        isExplicitRecord: true,
      };
    }

    if (day.isSunday) {
      return { status: 'Weekend', isExplicitRecord: false };
    }

    if (day.isFuture) {
      return { status: 'Upcoming', isExplicitRecord: false };
    }

    // If staff joined after this date, mark Upcoming
    if (member.joiningDate && member.joiningDate > day.dateStr) {
      return { status: 'Upcoming', isExplicitRecord: false };
    }

    // Default working day status for active roster
    return {
      status: 'Present',
      checkIn: '08:30 AM',
      checkOut: '04:30 PM',
      isExplicitRecord: false,
    };
  };

  // Departments list
  const departments = useMemo(() => {
    const set = new Set<string>();
    staff.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return ['All', ...Array.from(set)];
  }, [staff]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchDept = deptFilter === 'All' || s.department === deptFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.position && s.position.toLowerCase().includes(q));
      return matchDept && matchSearch;
    });
  }, [staff, deptFilter, searchQuery]);

  // Visible week groups
  const visibleWeekGroups = useMemo(() => {
    if (selectedWeekFilter === 'all') return weekGroups;
    return weekGroups.filter((w) => w.weekNumber === selectedWeekFilter);
  }, [weekGroups, selectedWeekFilter]);

  // Calculate overall monthly & weekly consistency metrics across filteredStaff
  const summaryStats = useMemo(() => {
    let present = 0;
    let late = 0;
    let halfDay = 0;
    let leave = 0;
    let absent = 0;
    let totalTrackedDays = 0;

    const weeklyBreakdown = weekGroups.map((wg) => {
      let wPresent = 0;
      let wLate = 0;
      let wLeave = 0;
      let wAbsent = 0;
      let wTotal = 0;

      filteredStaff.forEach((member) => {
        wg.days.forEach((day) => {
          const cell = resolveCellStatus(member, day);
          if (cell.status === 'Weekend' || cell.status === 'Upcoming') return;
          wTotal++;
          totalTrackedDays++;
          if (cell.status === 'Present') {
            present++;
            wPresent++;
          } else if (cell.status === 'Late') {
            late++;
            wLate++;
          } else if (cell.status === 'Half Day') {
            halfDay++;
            wLate++;
          } else if (cell.status === 'Leave') {
            leave++;
            wLeave++;
          } else if (cell.status === 'Absent') {
            absent++;
            wAbsent++;
          }
        });
      });

      const consistencyScore =
        wTotal > 0 ? Math.round(((wPresent + wLate * 0.75) / wTotal) * 100) : 100;

      return {
        weekNumber: wg.weekNumber,
        label: wg.label,
        dateRangeLabel: wg.dateRangeLabel,
        present: wPresent,
        late: wLate,
        leave: wLeave,
        absent: wAbsent,
        total: wTotal,
        consistencyScore,
      };
    });

    const overallConsistency =
      totalTrackedDays > 0
        ? Math.round(((present + late * 0.75 + halfDay * 0.5) / totalTrackedDays) * 100)
        : 100;

    return {
      present,
      late,
      halfDay,
      leave,
      absent,
      totalTrackedDays,
      overallConsistency,
      weeklyBreakdown,
    };
  }, [filteredStaff, weekGroups, attendanceMap, leaveRequests]);

  // Style helper for each heatmap cell
  const getCellBadgeStyle = (status: AttendanceStatus | 'Weekend' | 'Upcoming') => {
    switch (status) {
      case 'Present':
        return {
          bg: 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600',
          code: 'P',
          label: 'Present',
        };
      case 'Late':
        return {
          bg: 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500',
          code: 'L',
          label: 'Late',
        };
      case 'Half Day':
        return {
          bg: 'bg-orange-400 hover:bg-orange-500 text-white border-orange-500',
          code: 'HD',
          label: 'Half Day',
        };
      case 'Leave':
        return {
          bg: 'bg-sky-500 hover:bg-sky-600 text-white border-sky-600',
          code: 'LV',
          label: 'On Leave',
        };
      case 'Absent':
        return {
          bg: 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600',
          code: 'A',
          label: 'Absent',
        };
      case 'Weekend':
        return {
          bg: 'bg-slate-100 text-slate-400 border-slate-200',
          code: 'W',
          label: 'Weekend (Sunday)',
        };
      case 'Upcoming':
      default:
        return {
          bg: 'bg-slate-50 text-slate-300 border-slate-200/70',
          code: '·',
          label: 'Upcoming / Not Marked',
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Month Selector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
              <Sparkles className="w-3 h-3 text-[#168A45]" />
              <span>Monthly Consistency Matrix</span>
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-600">
              {filteredStaff.length} Staff Members
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
            Weekly Attendance Heatmap — {monthLabel}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualizes week-by-week attendance consistency (Present, Late, Leave, Absent) across the entire staff. Click any cell to update attendance status.
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonth(e.target.value);
                  setSelectedWeekFilter('all');
                }
              }}
              className="px-2.5 py-1 text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            />
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleCurrentMonth}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Current Month
          </button>
        </div>
      </div>

      {/* Weekly Consistency Summary Cards (Weeks 1 to 5 + Monthly KPI) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Overall Monthly Consistency Card */}
        <div
          onClick={() => setSelectedWeekFilter('all')}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
            selectedWeekFilter === 'all'
              ? 'bg-[#0B5D2A] text-white border-[#0B5D2A] shadow-sm'
              : 'bg-white text-slate-800 border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                selectedWeekFilter === 'all' ? 'text-emerald-200' : 'text-slate-400'
              }`}
            >
              Full Month
            </span>
            <TrendingUp
              className={`w-3.5 h-3.5 ${
                selectedWeekFilter === 'all' ? 'text-emerald-300' : 'text-[#168A45]'
              }`}
            />
          </div>
          <div className="text-xl font-extrabold mt-1">{summaryStats.overallConsistency}%</div>
          <div
            className={`text-[10px] mt-1 flex items-center gap-1.5 flex-wrap ${
              selectedWeekFilter === 'all' ? 'text-emerald-100' : 'text-slate-500'
            }`}
          >
            <span>P: {summaryStats.present}</span>
            <span>•</span>
            <span>L: {summaryStats.late}</span>
            <span>•</span>
            <span>LV: {summaryStats.leave}</span>
          </div>
        </div>

        {/* Week-by-Week Cards */}
        {summaryStats.weeklyBreakdown.map((wb) => {
          const isSelected = selectedWeekFilter === wb.weekNumber;
          return (
            <div
              key={wb.weekNumber}
              onClick={() =>
                setSelectedWeekFilter(isSelected ? 'all' : wb.weekNumber)
              }
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#EAF7EF] border-[#168A45] ring-2 ring-[#168A45]/20 shadow-2xs'
                  : 'bg-white border-slate-200/80 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{wb.label}</span>
                <span className="text-[10px] font-medium text-slate-400">
                  {wb.dateRangeLabel}
                </span>
              </div>

              <div className="flex items-baseline justify-between mt-1.5">
                <span
                  className={`text-lg font-extrabold ${
                    wb.consistencyScore >= 90
                      ? 'text-emerald-700'
                      : wb.consistencyScore >= 75
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {wb.consistencyScore}%
                </span>
                <span className="text-[10px] text-slate-400">consistency</span>
              </div>

              {/* Mini stacked progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex mt-2">
                {wb.total > 0 ? (
                  <>
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(wb.present / wb.total) * 100}%` }}
                    />
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: `${(wb.late / wb.total) * 100}%` }}
                    />
                    <div
                      className="bg-sky-500 h-full"
                      style={{ width: `${(wb.leave / wb.total) * 100}%` }}
                    />
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${(wb.absent / wb.total) * 100}%` }}
                    />
                  </>
                ) : (
                  <div className="bg-slate-200 h-full w-full" />
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 font-medium">
                <span className="text-emerald-700">P: {wb.present}</span>
                <span className="text-amber-600">L: {wb.late}</span>
                <span className="text-sky-600">LV: {wb.leave}</span>
                <span className="text-rose-600">A: {wb.absent}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Legend Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Staff */}
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff name or ID..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:border-[#168A45]"
            />
          </div>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 bg-white font-medium"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === 'All' ? 'All Departments' : d}
              </option>
            ))}
          </select>

          {/* Week Filter Pills */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setSelectedWeekFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedWeekFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Weeks
            </button>
            {weekGroups.map((wg) => (
              <button
                key={wg.weekNumber}
                type="button"
                onClick={() => setSelectedWeekFilter(wg.weekNumber)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedWeekFilter === wg.weekNumber
                    ? 'bg-white text-[#0B5D2A] shadow-2xs font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                W{wg.weekNumber}
              </button>
            ))}
          </div>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-flex items-center justify-center text-[9px] text-white font-bold">
              P
            </span>
            <span className="text-slate-700">Present</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-400 inline-flex items-center justify-center text-[9px] text-slate-950 font-bold">
              L
            </span>
            <span className="text-slate-700">Late</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-orange-400 inline-flex items-center justify-center text-[9px] text-white font-bold">
              HD
            </span>
            <span className="text-slate-700">Half Day</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-sky-500 inline-flex items-center justify-center text-[9px] text-white font-bold">
              LV
            </span>
            <span className="text-slate-700">Leave</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-500 inline-flex items-center justify-center text-[9px] text-white font-bold">
              A
            </span>
            <span className="text-slate-700">Absent</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-200 inline-flex items-center justify-center text-[9px] text-slate-400 font-bold">
              W
            </span>
            <span className="text-slate-500">Sunday</span>
          </div>
        </div>
      </div>

      {/* Main Weekly Attendance Heatmap Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredStaff.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-700">No Staff Members Found</div>
            <p className="text-xs text-slate-400">
              Add staff members in the Staff Directory or adjust your search/department filters to view the monthly attendance heatmap.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                {/* Row 1: Weekly Group Headers */}
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-20 bg-slate-100 px-4 py-3 min-w-[210px] border-r border-slate-200"
                  >
                    Staff Member &amp; Role
                  </th>
                  {visibleWeekGroups.map((wg) => (
                    <th
                      key={wg.weekNumber}
                      colSpan={wg.days.length}
                      className="px-2 py-2 text-center border-r border-slate-200 bg-slate-100/90 text-slate-800"
                    >
                      <div className="flex items-center justify-center space-x-1.5">
                        <span className="font-extrabold text-[#0B5D2A]">{wg.label}</span>
                        <span className="text-[9px] font-medium text-slate-500">
                          ({wg.dateRangeLabel})
                        </span>
                      </div>
                    </th>
                  ))}
                  <th
                    rowSpan={2}
                    className="px-3 py-3 text-center bg-slate-100 border-l border-slate-200 min-w-[155px]"
                  >
                    Monthly Summary
                  </th>
                </tr>

                {/* Row 2: Individual Day Numbers & Day Initials */}
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500">
                  {visibleWeekGroups.map((wg) =>
                    wg.days.map((day, idx) => (
                      <th
                        key={day.dateStr}
                        className={`px-1 py-1.5 text-center min-w-[30px] ${
                          idx === wg.days.length - 1 ? 'border-r border-slate-200' : ''
                        } ${
                          day.isToday
                            ? 'bg-emerald-100/90 text-[#0B5D2A] font-extrabold'
                            : day.isSunday
                            ? 'bg-slate-100/60 text-slate-400'
                            : ''
                        }`}
                      >
                        <div className="text-[9px] leading-none">{day.dayNameShort.slice(0, 2)}</div>
                        <div className="font-bold text-[11px] mt-0.5">{day.dayNumber}</div>
                      </th>
                    ))
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredStaff.map((member) => {
                  let staffPresent = 0;
                  let staffLate = 0;
                  let staffLeave = 0;
                  let staffAbsent = 0;
                  let staffTracked = 0;

                  allDays.forEach((d) => {
                    const c = resolveCellStatus(member, d);
                    if (c.status === 'Weekend' || c.status === 'Upcoming') return;
                    staffTracked++;
                    if (c.status === 'Present') staffPresent++;
                    else if (c.status === 'Late' || c.status === 'Half Day') staffLate++;
                    else if (c.status === 'Leave') staffLeave++;
                    else if (c.status === 'Absent') staffAbsent++;
                  });

                  const staffConsistency =
                    staffTracked > 0
                      ? Math.round(((staffPresent + staffLate * 0.75) / staffTracked) * 100)
                      : 100;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Sticky Staff Info Column */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-2.5 border-r border-slate-200">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#EAF7EF] text-[#0B5D2A] font-bold text-xs flex items-center justify-center shrink-0 border border-[#D9E5DD]">
                            {member.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate max-w-[150px]">
                              {member.fullName}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {member.position} • {member.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Heatmap Day Cells grouped by Week */}
                      {visibleWeekGroups.map((wg) =>
                        wg.days.map((day, idx) => {
                          const cell = resolveCellStatus(member, day);
                          const badge = getCellBadgeStyle(cell.status);

                          return (
                            <td
                              key={day.dateStr}
                              className={`p-1 text-center ${
                                idx === wg.days.length - 1 ? 'border-r border-slate-200' : ''
                              } ${day.isToday ? 'bg-emerald-50/50' : ''}`}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (!onMarkAttendance) return;
                                  setActivePopover({
                                    staffId: member.id,
                                    staffName: member.fullName,
                                    dateStr: day.dateStr,
                                    currentStatus:
                                      cell.status === 'Weekend' || cell.status === 'Upcoming'
                                        ? 'Present'
                                        : cell.status,
                                  });
                                }}
                                title={`${member.fullName} • ${day.dateStr} (${day.dayNameShort})\nStatus: ${badge.label}${
                                  cell.checkIn ? `\nCheck-In: ${cell.checkIn}` : ''
                                }${cell.remarks ? `\nNote: ${cell.remarks}` : ''}`}
                                className={`w-6 h-6 mx-auto rounded-md text-[10px] font-extrabold border flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${badge.bg}`}
                              >
                                {badge.code}
                              </button>
                            </td>
                          );
                        })
                      )}

                      {/* Staff Monthly Consistency Summary Cell */}
                      <td className="px-3 py-2.5 border-l border-slate-200 bg-slate-50/40">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold">
                            <span
                              className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800"
                              title="Present Days"
                            >
                              P:{staffPresent}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800"
                              title="Late / Half Days"
                            >
                              L:{staffLate}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded bg-sky-100 text-sky-800"
                              title="Leave Days"
                            >
                              LV:{staffLeave}
                            </span>
                            {staffAbsent > 0 && (
                              <span
                                className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800"
                                title="Absent Days"
                              >
                                A:{staffAbsent}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-extrabold ${
                              staffConsistency >= 90
                                ? 'text-emerald-700'
                                : staffConsistency >= 75
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {staffConsistency}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Cell Status Update Modal */}
      {activePopover && onMarkAttendance && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-200 text-xs space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{activePopover.staffName}</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Update Attendance for <strong>{activePopover.dateStr}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActivePopover(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { status: 'Present', label: 'Present (P)', cls: 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100' },
                  { status: 'Late', label: 'Late (L)', cls: 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100' },
                  { status: 'Half Day', label: 'Half Day (HD)', cls: 'border-orange-300 bg-orange-50 text-orange-900 hover:bg-orange-100' },
                  { status: 'Leave', label: 'On Leave (LV)', cls: 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100' },
                  { status: 'Absent', label: 'Absent (A)', cls: 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100' },
                ] as Array<{ status: AttendanceStatus; label: string; cls: string }>
              ).map((opt) => (
                <button
                  key={opt.status}
                  type="button"
                  onClick={() => {
                    const defaultCheckIn =
                      opt.status === 'Present'
                        ? '08:25 AM'
                        : opt.status === 'Late'
                        ? '08:55 AM'
                        : opt.status === 'Half Day'
                        ? '08:30 AM'
                        : undefined;
                    const defaultCheckOut =
                      opt.status === 'Present' || opt.status === 'Late'
                        ? '04:30 PM'
                        : opt.status === 'Half Day'
                        ? '12:30 PM'
                        : undefined;
                    onMarkAttendance(
                      activePopover.staffId,
                      activePopover.dateStr,
                      opt.status,
                      defaultCheckIn,
                      defaultCheckOut
                    );
                    setActivePopover(null);
                  }}
                  className={`p-2.5 rounded-xl border font-bold text-left transition-all cursor-pointer flex items-center justify-between ${opt.cls} ${
                    activePopover.currentStatus === opt.status ? 'ring-2 ring-slate-900' : ''
                  }`}
                >
                  <span>{opt.label}</span>
                  {activePopover.currentStatus === opt.status && (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
