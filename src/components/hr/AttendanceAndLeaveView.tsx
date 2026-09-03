import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  DailyAttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  StaffMember,
  AttendanceStatus,
  LeaveRequestStatus,
  LeaveType,
} from '../../types/hr';

interface AttendanceAndLeaveViewProps {
  staff: StaffMember[];
  attendance: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
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
  onMarkAttendance,
  onBulkMarkAttendance,
  onSubmitLeaveRequest,
  onUpdateLeaveStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave-requests' | 'leave-balances'>('attendance');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal for Applying Leave
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRequest>>({
    staffId: staff[0]?.id || '',
    leaveType: 'Casual Leave',
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    numberOfDays: 1,
    reason: '',
    substituteStaff: '',
  });

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
      {/* Sub-tab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
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

        {activeTab === 'leave-requests' && (
          <button
            onClick={() => setIsApplyLeaveOpen(true)}
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
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] text-blue-600 font-medium">On Leave</span>
              <div className="text-xl font-bold text-blue-700 mt-0.5">{leaveCount}</div>
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
                <option value="Academic">Academic</option>
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
        </div>
      )}

      {/* SUB-TAB 2: LEAVE REQUESTS */}
      {activeTab === 'leave-requests' && (
        <div className="space-y-4">
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
                              onClick={() => onUpdateLeaveStatus(req.id, 'Rejected', 'Institutional schedule priority')}
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Staff ID & Name</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-center">Annual Total</th>
                    <th className="px-4 py-3 text-center">Casual (Used / Left)</th>
                    <th className="px-4 py-3 text-center">Sick (Used / Left)</th>
                    <th className="px-4 py-3 text-center">Earned / Annual</th>
                    <th className="px-4 py-3 text-center">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveBalances.map((bal) => {
                    const casualLeft = bal.casualAllowed - bal.casualUsed;
                    const sickLeft = bal.sickAllowed - bal.sickUsed;
                    const annualLeft = bal.annualAllowed - bal.annualUsed;
                    const totalRemaining = casualLeft + sickLeft + annualLeft;

                    return (
                      <tr key={bal.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{bal.staffName}</div>
                          <div className="text-[10px] text-slate-400">{bal.staffId}</div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{bal.department}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{bal.totalAllowed} Days</td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-500">{bal.casualUsed} used</span> /{' '}
                          <span className="font-bold text-emerald-700">{casualLeft} left</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-500">{bal.sickUsed} used</span> /{' '}
                          <span className="font-bold text-emerald-700">{sickLeft} left</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-500">{bal.annualUsed} used</span> /{' '}
                          <span className="font-bold text-emerald-700">{annualLeft} left</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-sm text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {totalRemaining} Days
                          </span>
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

      {/* MODAL: APPLY LEAVE */}
      {isApplyLeaveOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-xl border border-slate-200 text-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Apply for Staff Leave</h2>
            <p className="text-slate-500 mb-4">Submit leave application for institutional review.</p>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700">Staff Member</label>
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
                  }}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.position} - {s.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as LeaveType })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Annual Leave">Annual Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                    <option value="Unpaid Leave">Unpaid Leave</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Number of Days</label>
                  <input
                    type="number"
                    min={1}
                    value={leaveForm.numberOfDays}
                    onChange={(e) => setLeaveForm({ ...leaveForm, numberOfDays: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">From Date</label>
                  <input
                    type="date"
                    value={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">To Date</label>
                  <input
                    type="date"
                    value={leaveForm.toDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Substitute Faculty / Colleague</label>
                <input
                  type="text"
                  placeholder="e.g. Smt. Suma Varma"
                  value={leaveForm.substituteStaff}
                  onChange={(e) => setLeaveForm({ ...leaveForm, substituteStaff: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700">Reason</label>
                <textarea
                  rows={2}
                  placeholder="State reason for absence..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full mt-1 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end space-x-2">
              <button
                onClick={() => setIsApplyLeaveOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const targetStaff = staff.find((s) => s.id === leaveForm.staffId) || staff[0];
                  onSubmitLeaveRequest({
                    ...leaveForm,
                    staffId: targetStaff.id,
                    staffName: targetStaff.fullName,
                    department: targetStaff.department,
                    position: targetStaff.position,
                  });
                  setIsApplyLeaveOpen(false);
                }}
                className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
