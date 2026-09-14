import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  ChevronRight,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  Paperclip,
} from 'lucide-react';
import { StaffMember, DailyAttendanceRecord, LeaveRequest } from '../../types/hr';

interface HrManagementSectionProps {
  staff: StaffMember[];
  attendance: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  onApproveLeave: (leaveId: string) => void;
  onRejectLeave: (leaveId: string) => void;
  onNavigateToStaffDirectory: () => void;
  onNavigateToAttendance: () => void;
  onNavigateToLeaveManagement: () => void;
}

export const HrManagementSection: React.FC<HrManagementSectionProps> = ({
  staff,
  attendance,
  leaveRequests,
  onApproveLeave,
  onRejectLeave,
  onNavigateToStaffDirectory,
  onNavigateToAttendance,
  onNavigateToLeaveManagement,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Staff summary metrics
  const totalEmployees = staff.length;
  const activeEmployees = staff.filter((s) => s.status !== 'Inactive' && s.status !== 'Terminated').length;

  const teachingCount = staff.filter((s) =>
    (s.division || s.department || '').toLowerCase().includes('academic') ||
    (s.position || '').toLowerCase().includes('teacher') ||
    (s.category || '').toLowerCase().includes('teaching')
  ).length;

  const adminCount = staff.filter((s) =>
    (s.department || '').toLowerCase().includes('admin') ||
    (s.department || '').toLowerCase().includes('hr') ||
    (s.department || '').toLowerCase().includes('finance')
  ).length;

  const supportCount = staff.filter((s) =>
    (s.department || '').toLowerCase().includes('operation') ||
    (s.department || '').toLowerCase().includes('system') ||
    (s.department || '').toLowerCase().includes('support')
  ).length;

  const nonTeachingCount = Math.max(0, totalEmployees - teachingCount);

  // New joiners (within last 30 days)
  const newJoinersCount = staff.filter((s) => {
    if (!s.joiningDate) return false;
    const diffDays = (new Date().getTime() - new Date(s.joiningDate).getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 60;
  }).length;

  // On notice period
  const noticePeriodCount = staff.filter((s) =>
    s.status === 'Notice Period' || (s.remarks || '').toLowerCase().includes('notice')
  ).length;

  // 2. Today's Attendance breakdown
  const todayRecords = attendance.filter((a) => a.date === todayStr);
  const presentCount = todayRecords.filter((a) => a.status === 'Present').length;
  const absentCount = todayRecords.filter((a) => a.status === 'Absent').length;
  const lateCount = todayRecords.filter((a) => a.status === 'Late').length;
  const halfDayCount = todayRecords.filter((a) => a.status === 'Half Day').length;
  const onLeaveAttendanceCount = todayRecords.filter((a) => a.status === 'Leave').length;

  // Not marked
  const markedStaffIds = new Set(todayRecords.map((r) => r.staffId));
  const notMarkedCount = Math.max(0, activeEmployees - markedStaffIds.size);

  const effectivePresent = presentCount + lateCount + halfDayCount * 0.5;
  const attendanceRate = activeEmployees > 0 ? Math.round((effectivePresent / activeEmployees) * 100) : 100;

  // 3. Leave Requests
  const pendingLeaves = leaveRequests.filter((l) => l.status === 'Pending');
  const approvedLeaves = leaveRequests.filter((l) => l.status === 'Approved');
  const rejectedLeaves = leaveRequests.filter((l) => l.status === 'Rejected');
  const currentlyOnLeave = approvedLeaves.filter(
    (l) => l.fromDate <= todayStr && l.toDate >= todayStr
  ).length;

  // 4. Department-wise count
  const departmentBreakdown = React.useMemo(() => {
    const map: Record<string, number> = {};
    staff.forEach((s) => {
      const dept = s.department || 'General';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [staff]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-6 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-800">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                Module 2: Human Resources & Staff Management
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {totalEmployees} Staff Members
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Workforce categorization, today's attendance roster, pending leave approvals, and department distribution.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onNavigateToAttendance}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            Attendance Roster
          </button>
          <button
            onClick={onNavigateToStaffDirectory}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#EAF7EF] hover:bg-[#D9E5DD] text-[#0B5D2A] text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <span>Staff Directory</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Row: 1. Staff Summary & 2. Today's Attendance Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Staff Summary Cards - 6 Cols */}
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
            <span>Staff Roster & Category Breakdown</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-left">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Total Staff
              </div>
              <div className="text-xl font-black text-emerald-950 mt-0.5">{totalEmployees}</div>
              <div className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                {activeEmployees} Active
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 text-left">
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                Teaching Staff
              </div>
              <div className="text-xl font-black text-blue-950 mt-0.5">{teachingCount}</div>
              <div className="text-[10px] text-blue-700 mt-0.5 font-medium">
                Faculty & Mentors
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200 text-left">
              <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                Non-Teaching
              </div>
              <div className="text-xl font-black text-indigo-950 mt-0.5">{nonTeachingCount}</div>
              <div className="text-[10px] text-indigo-700 mt-0.5 font-medium">
                Admin & Ops
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-200 text-left">
              <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                Administration
              </div>
              <div className="text-xl font-black text-sky-950 mt-0.5">{adminCount}</div>
              <div className="text-[10px] text-sky-700 mt-0.5 font-medium">Management</div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200 text-left">
              <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">
                New Joiners
              </div>
              <div className="text-xl font-black text-purple-950 mt-0.5">{newJoinersCount}</div>
              <div className="text-[10px] text-purple-700 mt-0.5 font-medium">Last 60 Days</div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-left">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Notice Period
              </div>
              <div className="text-xl font-black text-amber-950 mt-0.5">{noticePeriodCount}</div>
              <div className="text-[10px] text-amber-700 mt-0.5 font-medium">Transitioning</div>
            </div>
          </div>

          {/* Department breakdown mini-bars */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mt-3">
            <div className="text-[11px] font-bold text-slate-700 mb-2">Department Allocation</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {departmentBreakdown.slice(0, 4).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200/60">
                  <span className="font-semibold text-slate-700 truncate">{dept}</span>
                  <span className="font-black text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Attendance Visualizer - 6 Cols */}
        <div className="lg:col-span-6 bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Today's Attendance Overview
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                Date: <strong className="text-slate-800">{todayStr}</strong>
              </span>
            </div>

            {/* Attendance Rate Gauge Bar */}
            <div className="mb-4 bg-white p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700">Daily Attendance Rate</span>
                <span className="text-sm font-black text-emerald-700">{attendanceRate}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500"
                  style={{ width: `${(presentCount / (activeEmployees || 1)) * 100}%` }}
                  title={`Present: ${presentCount}`}
                />
                <div
                  className="bg-amber-500 h-full transition-all duration-500"
                  style={{ width: `${(lateCount / (activeEmployees || 1)) * 100}%` }}
                  title={`Late: ${lateCount}`}
                />
                <div
                  className="bg-purple-500 h-full transition-all duration-500"
                  style={{ width: `${(halfDayCount / (activeEmployees || 1)) * 100}%` }}
                  title={`Half Day: ${halfDayCount}`}
                />
                <div
                  className="bg-blue-500 h-full transition-all duration-500"
                  style={{ width: `${(onLeaveAttendanceCount / (activeEmployees || 1)) * 100}%` }}
                  title={`On Leave: ${onLeaveAttendanceCount}`}
                />
                <div
                  className="bg-red-500 h-full transition-all duration-500"
                  style={{ width: `${(absentCount / (activeEmployees || 1)) * 100}%` }}
                  title={`Absent: ${absentCount}`}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                <span>Total Active Roster: {activeEmployees}</span>
                <span>Effective Present: {effectivePresent}</span>
              </div>
            </div>

            {/* 6 Grid Metric Counters */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                <div className="text-[10px] font-bold text-emerald-800">Present</div>
                <div className="text-lg font-black text-emerald-950 mt-0.5">{presentCount}</div>
              </div>

              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                <div className="text-[10px] font-bold text-red-800">Absent</div>
                <div className="text-lg font-black text-red-950 mt-0.5">{absentCount}</div>
              </div>

              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <div className="text-[10px] font-bold text-amber-800">Late Entry</div>
                <div className="text-lg font-black text-amber-950 mt-0.5">{lateCount}</div>
              </div>

              <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-center">
                <div className="text-[10px] font-bold text-purple-800">Half Day</div>
                <div className="text-lg font-black text-purple-950 mt-0.5">{halfDayCount}</div>
              </div>

              <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <div className="text-[10px] font-bold text-blue-800">On Leave</div>
                <div className="text-lg font-black text-blue-950 mt-0.5">{onLeaveAttendanceCount}</div>
              </div>

              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-center">
                <div className="text-[10px] font-bold text-slate-700">Not Marked</div>
                <div className="text-lg font-black text-slate-900 mt-0.5">{notMarkedCount}</div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Shift timing: 08:30 AM – 04:30 PM</span>
            <button
              onClick={onNavigateToAttendance}
              className="font-bold text-[#0B5D2A] hover:text-[#168A45] flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Shift Check-ins</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Leave Management & Pending Leave Approval Table */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3">
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
              Pending Leave Approvals ({pendingLeaves.length})
            </h3>
          </div>

          {/* Quick status summary chips */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {pendingLeaves.length} Pending
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              {approvedLeaves.length} Approved
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
              {currentlyOnLeave} Currently on Leave
            </span>
          </div>
        </div>

        {pendingLeaves.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <th className="px-3.5 py-2.5">Employee Name</th>
                  <th className="px-3 py-2.5">Department</th>
                  <th className="px-3 py-2.5">Leave Type</th>
                  <th className="px-3 py-2.5">From Date</th>
                  <th className="px-3 py-2.5">To Date</th>
                  <th className="px-2.5 py-2.5 text-center">Days</th>
                  <th className="px-3 py-2.5">Reason</th>
                  <th className="px-2.5 py-2.5 text-center">Attachment</th>
                  <th className="px-3.5 py-2.5 text-right">Inline Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {pendingLeaves.map((req) => (
                  <tr key={req.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                      {req.staffName}
                      <span className="block text-[10px] font-normal text-slate-400 font-mono">
                        {req.staffId}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{req.department}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold whitespace-nowrap">
                        {req.leaveType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{req.fromDate}</td>
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{req.toDate}</td>
                    <td className="px-2.5 py-2.5 text-center font-black text-slate-900">
                      {req.numberOfDays}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate" title={req.reason}>
                      {req.reason || 'Personal reasons'}
                    </td>
                    <td className="px-2.5 py-2.5 text-center">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 mx-auto" />
                    </td>
                    <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => onApproveLeave(req.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#168A45] hover:bg-[#0B5D2A] text-white text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                          title="Approve Leave"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onRejectLeave(req.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                          title="Reject Leave"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
            No pending employee leave requests requiring management review.
          </div>
        )}
      </div>
    </div>
  );
};
