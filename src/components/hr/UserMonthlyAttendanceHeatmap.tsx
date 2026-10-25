import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  CalendarX,
  XCircle,
  TrendingUp,
  UserCheck,
  AlertCircle,
  FileText,
  Info,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  CalendarCheck,
  Award,
  Zap,
} from 'lucide-react';
import {
  StaffMember,
  DailyAttendanceRecord,
  LeaveRequest,
  AttendanceStatus,
} from '../../types/hr';

interface UserMonthlyAttendanceHeatmapProps {
  staffMember: StaffMember | null;
  allStaff?: StaffMember[];
  attendance: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onApplyLeave?: (staffId?: string, defaultDate?: string) => void;
  onSelectStaff?: (staff: StaffMember) => void;
  embedded?: boolean;
}

type FilterStatus = 'All' | 'Present' | 'Late' | 'Half Day' | 'Leave' | 'Absent' | 'Weekend';

export const UserMonthlyAttendanceHeatmap: React.FC<UserMonthlyAttendanceHeatmapProps> = ({
  staffMember,
  allStaff = [],
  attendance = [],
  leaveRequests = [],
  onApplyLeave,
  onSelectStaff,
  embedded = false,
}) => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('All');
  const [selectedDateDetails, setSelectedDateDetails] = useState<string | null>(null);

  // Parse Year & Month
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

  const handlePrevMonth = () => {
    const d = new Date(yearNum, monthNum - 2, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDateDetails(null);
  };

  const handleNextMonth = () => {
    const d = new Date(yearNum, monthNum, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDateDetails(null);
  };

  const handleCurrentMonth = () => {
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
    setSelectedDateDetails(null);
  };

  // Days in selected month
  const daysInMonth = useMemo(() => {
    return new Date(yearNum, monthNum, 0).getDate();
  }, [yearNum, monthNum]);

  // First day of week (0=Sun, 1=Mon, ..., 6=Sat)
  const firstDayOfWeek = useMemo(() => {
    return new Date(yearNum, monthNum - 1, 1).getDay();
  }, [yearNum, monthNum]);

  const todayStr = useMemo(() => now.toISOString().split('T')[0], []);

  // Quick lookup of approved leaves for this staff
  const staffLeaves = useMemo(() => {
    if (!staffMember) return [];
    return leaveRequests.filter(
      (l) => l.staffId === staffMember.id && l.status === 'Approved'
    );
  }, [leaveRequests, staffMember]);

  // Map of daily attendance for this staff in selected month
  const attendanceMap = useMemo(() => {
    const map = new Map<string, DailyAttendanceRecord>();
    if (!staffMember) return map;

    attendance.forEach((rec) => {
      if (rec.staffId === staffMember.id && rec.date.startsWith(selectedMonth)) {
        map.set(rec.date, rec);
      }
    });
    return map;
  }, [attendance, staffMember, selectedMonth]);

  // Build day cards data
  interface CalendarDayData {
    dayNumber: number;
    dateStr: string;
    dayOfWeek: number; // 0=Sun, 6=Sat
    isWeekend: boolean;
    isSunday: boolean;
    isSaturday: boolean;
    isToday: boolean;
    isFuture: boolean;
    status: AttendanceStatus | 'Weekend' | 'Future' | 'Absent';
    attendanceRecord?: DailyAttendanceRecord;
    leaveRecord?: LeaveRequest;
    workingHours?: number;
    checkIn?: string;
    checkOut?: string;
  }

  const calendarDays = useMemo(() => {
    const days: CalendarDayData[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayDate = new Date(yearNum, monthNum - 1, day);
      const dayOfWeek = dayDate.getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const isWeekend = isSunday || isSaturday;
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      const attRecord = attendanceMap.get(dateStr);
      const matchingLeave = staffLeaves.find(
        (l) => dateStr >= l.fromDate && dateStr <= l.toDate
      );

      let status: AttendanceStatus | 'Weekend' | 'Future' | 'Absent' = 'Absent';

      if (isFuture) {
        if (matchingLeave) {
          status = 'Leave';
        } else if (isWeekend) {
          status = 'Weekend';
        } else {
          status = 'Future';
        }
      } else if (matchingLeave) {
        status = 'Leave';
      } else if (attRecord) {
        status = attRecord.status;
      } else if (isWeekend) {
        status = 'Weekend';
      } else {
        status = 'Absent';
      }

      days.push({
        dayNumber: day,
        dateStr,
        dayOfWeek,
        isWeekend,
        isSunday,
        isSaturday,
        isToday,
        isFuture,
        status,
        attendanceRecord: attRecord,
        leaveRecord: matchingLeave,
        workingHours: attRecord?.workingHours,
        checkIn: attRecord?.checkIn,
        checkOut: attRecord?.checkOut,
      });
    }

    return days;
  }, [daysInMonth, yearNum, monthNum, todayStr, attendanceMap, staffLeaves]);

  // Monthly Summary Metrics
  const monthlyMetrics = useMemo(() => {
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;
    let absentCount = 0;
    let totalWorkingHours = 0;
    let elapsedWorkingDays = 0;

    calendarDays.forEach((day) => {
      // Don't count purely future days in elapsed denominator unless on approved leave
      if (day.status === 'Present') {
        presentCount++;
        totalWorkingHours += day.workingHours || 8.0;
        elapsedWorkingDays++;
      } else if (day.status === 'Late') {
        lateCount++;
        presentCount++; // late is still present
        totalWorkingHours += day.workingHours || 7.5;
        elapsedWorkingDays++;
      } else if (day.status === 'Half Day') {
        halfDayCount++;
        totalWorkingHours += day.workingHours || 4.0;
        elapsedWorkingDays++;
      } else if (day.status === 'Leave') {
        leaveCount++;
        if (!day.isFuture) elapsedWorkingDays++;
      } else if (day.status === 'Absent' && !day.isWeekend && !day.isFuture) {
        absentCount++;
        elapsedWorkingDays++;
      }
    });

    const activeWorkDays = presentCount + (halfDayCount * 0.5);
    const attendanceRate = elapsedWorkingDays > 0
      ? Math.min(100, Math.round(((presentCount + (halfDayCount * 0.5)) / Math.max(1, elapsedWorkingDays - leaveCount)) * 100))
      : 100;

    const punctualityRate = presentCount > 0
      ? Math.round(((presentCount - lateCount) / presentCount) * 100)
      : 100;

    const avgHoursPerDay = presentCount > 0
      ? (totalWorkingHours / presentCount).toFixed(1)
      : '0.0';

    return {
      presentCount,
      lateCount,
      halfDayCount,
      leaveCount,
      absentCount,
      totalWorkingHours: totalWorkingHours.toFixed(1),
      attendanceRate,
      punctualityRate,
      avgHoursPerDay,
      elapsedWorkingDays,
    };
  }, [calendarDays]);

  // Selected Day Details for Drawer / Modal
  const activeDayData = useMemo(() => {
    if (!selectedDateDetails) return null;
    return calendarDays.find((d) => d.dateStr === selectedDateDetails) || null;
  }, [calendarDays, selectedDateDetails]);

  // Color helper based on status
  const getStatusColorConfig = (status: AttendanceStatus | 'Weekend' | 'Future' | 'Absent') => {
    switch (status) {
      case 'Present':
        return {
          bg: 'bg-emerald-500 hover:bg-emerald-600',
          text: 'text-white',
          border: 'border-emerald-600',
          lightBg: 'bg-emerald-50',
          lightText: 'text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          label: 'Present',
        };
      case 'Late':
        return {
          bg: 'bg-amber-500 hover:bg-amber-600',
          text: 'text-white',
          border: 'border-amber-600',
          lightBg: 'bg-amber-50',
          lightText: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          label: 'Late Arrival',
        };
      case 'Half Day':
        return {
          bg: 'bg-indigo-500 hover:bg-indigo-600',
          text: 'text-white',
          border: 'border-indigo-600',
          lightBg: 'bg-indigo-50',
          lightText: 'text-indigo-800',
          badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          label: 'Half Day',
        };
      case 'Leave':
        return {
          bg: 'bg-blue-500 hover:bg-blue-600',
          text: 'text-white',
          border: 'border-blue-600',
          lightBg: 'bg-blue-50',
          lightText: 'text-blue-800',
          badge: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'On Leave',
        };
      case 'Absent':
        return {
          bg: 'bg-rose-500 hover:bg-rose-600',
          text: 'text-white',
          border: 'border-rose-600',
          lightBg: 'bg-rose-50',
          lightText: 'text-rose-800',
          badge: 'bg-rose-100 text-rose-800 border-rose-200',
          label: 'Absent',
        };
      case 'Weekend':
        return {
          bg: 'bg-slate-100 hover:bg-slate-200',
          text: 'text-slate-400',
          border: 'border-slate-200',
          lightBg: 'bg-slate-50',
          lightText: 'text-slate-500',
          badge: 'bg-slate-100 text-slate-600 border-slate-200',
          label: 'Rest Day',
        };
      case 'Future':
      default:
        return {
          bg: 'bg-white hover:bg-slate-50',
          text: 'text-slate-300',
          border: 'border-slate-200 border-dashed',
          lightBg: 'bg-slate-50/50',
          lightText: 'text-slate-400',
          badge: 'bg-slate-50 text-slate-400 border-slate-200',
          label: 'Upcoming',
        };
    }
  };

  // Filter check
  const isDayMatchingFilter = (status: AttendanceStatus | 'Weekend' | 'Future' | 'Absent') => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Present') return status === 'Present';
    if (activeFilter === 'Late') return status === 'Late';
    if (activeFilter === 'Half Day') return status === 'Half Day';
    if (activeFilter === 'Leave') return status === 'Leave';
    if (activeFilter === 'Absent') return status === 'Absent';
    if (activeFilter === 'Weekend') return status === 'Weekend';
    return true;
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`space-y-4 ${embedded ? '' : 'animate-in fade-in duration-200'}`}>
      {/* Top Banner / Card Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* User Profile Info & Indicator */}
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center font-bold text-lg overflow-hidden shadow-2xs">
                {staffMember?.profilePhoto ? (
                  <img
                    src={staffMember.profilePhoto}
                    alt={staffMember.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {staffMember?.fullName
                      ? staffMember.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)
                      : 'ME'}
                  </span>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-[9px] text-white font-bold" title="Logged In Profile">
                ✓
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  My Attendance Heatmap
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {staffMember?.staffCode || staffMember?.id || 'CB-STAFF'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-0.5">
                {staffMember?.fullName || 'Staff Member'}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                <span>{staffMember?.position || 'Associate'}</span>
                <span>•</span>
                <span className="font-medium text-slate-700">{staffMember?.department || 'Operations'}</span>
                <span>•</span>
                <span>{staffMember?.branchLocation || 'Kochi Corporate HQ'}</span>
              </p>
            </div>
          </div>

          {/* Controls: Month Navigation & Staff Switcher (if admin) */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {allStaff.length > 1 && onSelectStaff && (
              <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500 font-medium">Viewing:</span>
                <select
                  value={staffMember?.id || ''}
                  onChange={(e) => {
                    const found = allStaff.find((s) => s.id === e.target.value);
                    if (found) onSelectStaff(found);
                  }}
                  className="bg-transparent text-slate-800 font-bold outline-hidden cursor-pointer"
                >
                  {allStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.department})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Navigation */}
            <div className="flex items-center space-x-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleCurrentMonth}
                className="px-2.5 py-1 text-xs font-black text-slate-800 hover:text-emerald-700 hover:bg-white rounded-lg transition-all cursor-pointer min-w-[120px] text-center"
              >
                {monthLabel}
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all cursor-pointer shadow-2xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {onApplyLeave && (
              <button
                type="button"
                onClick={() => onApplyLeave(staffMember?.id)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Apply Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* Monthly Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-100">
          {/* Metric 1: Days Present */}
          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Present</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-emerald-900">{monthlyMetrics.presentCount}</span>
              <span className="text-[10px] text-emerald-700 font-medium">days</span>
            </div>
            <div className="text-[10px] text-emerald-600/90 font-medium mt-0.5">
              {monthlyMetrics.totalWorkingHours} hrs logged
            </div>
          </div>

          {/* Metric 2: Attendance Rate */}
          <div className="bg-teal-50/70 border border-teal-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">Attendance Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1">
              <span className="text-xl font-black text-teal-900">{monthlyMetrics.attendanceRate}%</span>
            </div>
            <div className="text-[10px] text-teal-600/90 font-medium mt-0.5">
              Active working ratio
            </div>
          </div>

          {/* Metric 3: Late Arrivals */}
          <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Late Arrivals</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-amber-900">{monthlyMetrics.lateCount}</span>
              <span className="text-[10px] text-amber-700 font-medium">times</span>
            </div>
            <div className="text-[10px] text-amber-600/90 font-medium mt-0.5">
              {monthlyMetrics.punctualityRate}% on-time rate
            </div>
          </div>

          {/* Metric 4: Leave Days */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">On Leave</span>
              <CalendarX className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-blue-900">{monthlyMetrics.leaveCount}</span>
              <span className="text-[10px] text-blue-700 font-medium">days</span>
            </div>
            <div className="text-[10px] text-blue-600/90 font-medium mt-0.5">
              Approved leaves
            </div>
          </div>

          {/* Metric 5: Absences */}
          <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">Absences</span>
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-rose-900">{monthlyMetrics.absentCount}</span>
              <span className="text-[10px] text-rose-700 font-medium">days</span>
            </div>
            <div className="text-[10px] text-rose-600/90 font-medium mt-0.5">
              {monthlyMetrics.absentCount === 0 ? 'Zero unexcused' : 'Needs attention'}
            </div>
          </div>

          {/* Metric 6: Daily Avg Hours */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Daily Avg</span>
              <Zap className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-xl font-black text-slate-900">{monthlyMetrics.avgHoursPerDay}</span>
              <span className="text-[10px] text-slate-500 font-medium">hrs/day</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
              Target: 8.0 hrs/day
            </div>
          </div>
        </div>

        {/* Status Filter Chips / Interactive Legend */}
        <div className="flex items-center justify-between flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter Days:
            </span>
            {(['All', 'Present', 'Late', 'Leave', 'Absent', 'Weekend'] as FilterStatus[]).map((st) => {
              const isSelected = activeFilter === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveFilter(st)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all flex items-center space-x-1 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st === 'Present' && <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />}
                  {st === 'Late' && <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />}
                  {st === 'Leave' && <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />}
                  {st === 'Absent' && <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />}
                  {st === 'Weekend' && <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />}
                  <span>{st}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Click any day to view biometric punch logs & notes</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visual Matrix: Monthly Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-4 h-4 text-[#168A45]" />
            <h4 className="text-sm font-bold text-slate-800">
              {monthLabel} Attendance Heatmap
            </h4>
            <span className="text-xs text-slate-400">({daysInMonth} calendar days)</span>
          </div>

          {/* Quick Heat Intensity Legend */}
          <div className="hidden sm:flex items-center space-x-3 text-[11px] font-medium text-slate-500">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-md bg-emerald-500"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-md bg-amber-500"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-md bg-blue-500"></div>
              <span>Leave</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-md bg-rose-500"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-md bg-slate-200"></div>
              <span>Rest Day</span>
            </div>
          </div>
        </div>

        {/* 7-Column Calendar Heatmap Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
          {/* Day of Week Headers */}
          {dayNames.map((name, idx) => (
            <div
              key={name}
              className={`text-center py-1.5 text-xs font-black uppercase tracking-wider ${
                idx === 0 || idx === 6 ? 'text-slate-400' : 'text-slate-600'
              }`}
            >
              {name}
            </div>
          ))}

          {/* Empty cells before Day 1 */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[70px] sm:min-h-[85px] rounded-xl bg-slate-50/50 border border-dashed border-slate-100 p-1.5 opacity-40"
            />
          ))}

          {/* Day Cells */}
          {calendarDays.map((day) => {
            const config = getStatusColorConfig(day.status);
            const matchesFilter = isDayMatchingFilter(day.status);
            const isSelected = selectedDateDetails === day.dateStr;

            return (
              <div
                key={day.dateStr}
                onClick={() => setSelectedDateDetails(day.dateStr)}
                className={`relative min-h-[70px] sm:min-h-[88px] rounded-xl p-2 sm:p-2.5 border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 shadow-md scale-[1.02] z-10'
                    : 'hover:shadow-xs'
                } ${
                  day.isToday
                    ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/20'
                    : 'border-slate-200/80'
                } ${!matchesFilter ? 'opacity-25 grayscale-[60%]' : ''}`}
                style={{
                  backgroundColor:
                    day.status === 'Present'
                      ? '#F0FDF4'
                      : day.status === 'Late'
                      ? '#FFFBEB'
                      : day.status === 'Leave'
                      ? '#EFF6FF'
                      : day.status === 'Absent'
                      ? '#FEF2F2'
                      : day.status === 'Weekend'
                      ? '#F8FAFC'
                      : '#FFFFFF',
                }}
              >
                {/* Day Header: Number + Today indicator */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-black ${
                      day.isToday
                        ? 'w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center -ml-1 -mt-1 shadow-2xs'
                        : day.isWeekend
                        ? 'text-slate-400'
                        : 'text-slate-700'
                    }`}
                  >
                    {day.dayNumber}
                  </span>

                  {/* Status Indicator Dot/Badge */}
                  {day.status !== 'Future' && day.status !== 'Weekend' && (
                    <span
                      className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${
                        day.status === 'Present'
                          ? 'bg-emerald-500'
                          : day.status === 'Late'
                          ? 'bg-amber-500 animate-pulse'
                          : day.status === 'Leave'
                          ? 'bg-blue-500'
                          : 'bg-rose-500'
                      }`}
                      title={config.label}
                    />
                  )}
                </div>

                {/* Day Center: Visual Status Chip & Check-In */}
                <div className="my-1">
                  {day.status === 'Present' && (
                    <div className="space-y-0.5">
                      <div className="text-[10px] sm:text-[11px] font-bold text-emerald-800 flex items-center gap-0.5 truncate">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Present</span>
                      </div>
                      {day.checkIn && (
                        <div className="text-[9px] sm:text-[10px] text-emerald-700/90 font-medium truncate hidden sm:block">
                          {day.checkIn}
                        </div>
                      )}
                    </div>
                  )}

                  {day.status === 'Late' && (
                    <div className="space-y-0.5">
                      <div className="text-[10px] sm:text-[11px] font-bold text-amber-800 flex items-center gap-0.5 truncate">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Late</span>
                      </div>
                      {day.checkIn && (
                        <div className="text-[9px] sm:text-[10px] text-amber-700 font-medium truncate hidden sm:block">
                          In: {day.checkIn}
                        </div>
                      )}
                    </div>
                  )}

                  {day.status === 'Leave' && (
                    <div className="space-y-0.5">
                      <div className="text-[10px] sm:text-[11px] font-bold text-blue-800 flex items-center gap-0.5 truncate">
                        <CalendarX className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>Leave</span>
                      </div>
                      <div className="text-[9px] text-blue-700/80 font-medium truncate hidden sm:block">
                        {day.leaveRecord?.leaveType || 'Approved'}
                      </div>
                    </div>
                  )}

                  {day.status === 'Absent' && (
                    <div className="space-y-0.5">
                      <div className="text-[10px] sm:text-[11px] font-bold text-rose-800 flex items-center gap-0.5 truncate">
                        <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
                        <span>Absent</span>
                      </div>
                      <div className="text-[9px] text-rose-600/80 font-medium truncate hidden sm:block">
                        Unexcused
                      </div>
                    </div>
                  )}

                  {day.status === 'Weekend' && (
                    <div className="text-[10px] font-medium text-slate-400 italic">
                      Rest Day
                    </div>
                  )}

                  {day.status === 'Future' && (
                    <div className="text-[10px] text-slate-300 font-medium">
                      Upcoming
                    </div>
                  )}
                </div>

                {/* Day Footer: Working Hours Bar / Status Pill */}
                <div className="pt-0.5 border-t border-black/5 flex items-center justify-between text-[9px] text-slate-500 font-medium">
                  {day.workingHours ? (
                    <span className="font-bold text-slate-700">{day.workingHours}h</span>
                  ) : day.status === 'Present' ? (
                    <span className="font-bold text-slate-700">8.0h</span>
                  ) : day.status === 'Half Day' ? (
                    <span className="font-bold text-slate-700">4.0h</span>
                  ) : (
                    <span>-</span>
                  )}

                  {day.isToday && (
                    <span className="text-[8px] font-extrabold uppercase bg-emerald-600 text-white px-1 rounded-sm">
                      Today
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspection Drawer / Detail Card */}
      {activeDayData && (
        <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-md p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white ${
                  activeDayData.status === 'Present'
                    ? 'bg-emerald-600'
                    : activeDayData.status === 'Late'
                    ? 'bg-amber-500'
                    : activeDayData.status === 'Leave'
                    ? 'bg-blue-600'
                    : activeDayData.status === 'Absent'
                    ? 'bg-rose-600'
                    : 'bg-slate-500'
                }`}
              >
                {activeDayData.dayNumber}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-black text-slate-900">
                    {new Date(activeDayData.dateStr + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </h4>
                  {activeDayData.isToday && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-emerald-200">
                      Today
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Status:{' '}
                  <span className="font-bold text-slate-800">
                    {activeDayData.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {activeDayData.status === 'Absent' && onApplyLeave && (
                <button
                  type="button"
                  onClick={() => onApplyLeave(staffMember?.id, activeDayData.dateStr)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  <CalendarX className="w-3.5 h-3.5" />
                  <span>Regularize / Apply Leave</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDateDetails(null)}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>

          {/* Details Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clock In (Punch In)</span>
              <div className="mt-1 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-black text-slate-800">
                  {activeDayData.checkIn || (activeDayData.status === 'Present' ? '08:30 AM' : '--:--')}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Standard shift: 08:30 AM
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clock Out (Punch Out)</span>
              <div className="mt-1 flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-black text-slate-800">
                  {activeDayData.checkOut || (activeDayData.status === 'Present' ? '05:30 PM' : '--:--')}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Standard shift: 05:30 PM
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recorded Working Hours</span>
              <div className="mt-1 flex items-center space-x-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-black text-slate-800">
                  {activeDayData.workingHours || (activeDayData.status === 'Present' ? 8.0 : activeDayData.status === 'Half Day' ? 4.0 : 0.0)} hrs
                </span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Full-time expectation: 8.0 hrs
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks & Verification</span>
              <div className="mt-1 text-xs font-semibold text-slate-800 truncate">
                {activeDayData.attendanceRecord?.remarks ||
                  activeDayData.leaveRecord?.reason ||
                  (activeDayData.status === 'Weekend' ? 'Official Weekly Off' : 'No biometric anomalies')}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Source: Biometric biometric sync & portal
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
