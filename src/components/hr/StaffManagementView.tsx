import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  CreditCard,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  Mail,
  Building,
  MapPin,
  Clock,
  Printer,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Download,
  Share2,
  Award,
} from 'lucide-react';
import {
  StaffMember,
  EmploymentStatus,
  StaffDocument,
  DailyAttendanceRecord,
  LeaveRequest,
  StaffPerformanceEvaluation,
} from '../../types/hr';
import { StaffRegistrationModal } from './StaffRegistrationModal';

interface StaffManagementViewProps {
  staff: StaffMember[];
  attendanceRecords: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  performanceRecords: StaffPerformanceEvaluation[];
  onSaveStaff: (staffData: Partial<StaffMember>) => void;
  onDeleteStaff: (id: string) => void;
  onUploadDocument?: (staffId: string, doc: StaffDocument) => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staff = [],
  attendanceRecords = [],
  leaveRequests = [],
  performanceRecords = [],
  onSaveStaff,
  onDeleteStaff,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Active Selections
  const [selectedStaffForView, setSelectedStaffForView] = useState<StaffMember | null>(null);
  const [selectedStaffForIdCard, setSelectedStaffForIdCard] = useState<StaffMember | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    'profile' | 'experience' | 'qualifications' | 'family' | 'documents' | 'compensation' | 'attendance' | 'performance'
  >('profile');

  // Filtered staff
  const filteredStaff = staff.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = departmentFilter === 'All' || s.department === departmentFilter;
    const matchStatus = statusFilter === 'All' || s.employmentStatus === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Filter & Action Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name, employee ID, position or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs text-slate-800 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white"
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
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Probation">Probation</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
          </select>

          <button
            onClick={() => setIsAddStaffOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Staff</span>
          </button>
        </div>
      </div>

      {/* Staff Members Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Employee ID & Staff</th>
                <th className="px-4 py-3">Department & Position</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Date of Joining</th>
                <th className="px-4 py-3">Attendance Today</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staffMember) => (
                <tr key={staffMember.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {staffMember.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{staffMember.fullName}</div>
                        <div className="text-[10px] text-slate-400">{staffMember.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{staffMember.position}</div>
                    <div className="text-[10px] text-slate-400">{staffMember.department}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-800 font-medium">{staffMember.contactNumber}</div>
                    <div className="text-[10px] text-slate-400">{staffMember.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{staffMember.joiningDate}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        staffMember.todayAttendanceStatus === 'Present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : staffMember.todayAttendanceStatus === 'Late'
                          ? 'bg-amber-100 text-amber-800'
                          : staffMember.todayAttendanceStatus === 'On Leave'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {staffMember.todayAttendanceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        staffMember.employmentStatus === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : staffMember.employmentStatus === 'Probation'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {staffMember.employmentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => {
                          setSelectedStaffForView(staffMember);
                          setActiveProfileTab('profile');
                        }}
                        title="View Full Profile"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedStaffForIdCard(staffMember)}
                        title="Print Staff ID Card"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B5D2A] rounded-lg transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteStaff(staffMember.id)}
                        title="Delete Staff"
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

      {/* MODAL: FULL PROFILE / 360-DEGREE VIEW */}
      {selectedStaffForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col text-xs overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] p-5 text-white flex items-center justify-between">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-white text-[#0B5D2A] font-bold text-lg flex items-center justify-center shadow-md">
                  {selectedStaffForView.fullName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold">{selectedStaffForView.fullName}</h2>
                  <div className="text-emerald-100 text-xs">
                    {selectedStaffForView.position} • {selectedStaffForView.department}
                  </div>
                  <div className="text-[11px] text-emerald-200 mt-0.5">
                    ID: {selectedStaffForView.id} | Joined: {selectedStaffForView.joiningDate}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStaffForView(null)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Profile Tabs */}
            <div className="flex items-center space-x-2 px-5 pt-3 border-b border-slate-200 bg-slate-50 font-semibold overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveProfileTab('profile')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'profile'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Personal & Work
              </button>
              <button
                onClick={() => setActiveProfileTab('experience')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'experience'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Experience ({selectedStaffForView.experiences?.length || 0})
              </button>
              <button
                onClick={() => setActiveProfileTab('qualifications')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'qualifications'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Qualifications ({selectedStaffForView.qualifications?.length || 0})
              </button>
              <button
                onClick={() => setActiveProfileTab('family')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'family'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Family ({selectedStaffForView.familyMembers?.length || 0})
              </button>
              <button
                onClick={() => setActiveProfileTab('documents')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'documents'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Documents ({selectedStaffForView.documents.length})
              </button>
              <button
                onClick={() => setActiveProfileTab('compensation')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'compensation'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Salary & Bank
              </button>
              <button
                onClick={() => setActiveProfileTab('attendance')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'attendance'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Attendance Log
              </button>
              <button
                onClick={() => setActiveProfileTab('performance')}
                className={`pb-2.5 px-2 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                  activeProfileTab === 'performance'
                    ? 'border-[#168A45] text-[#0B5D2A]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                KPI & Performance
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              {activeProfileTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Date of Birth</div>
                      <div className="font-semibold text-slate-800">{selectedStaffForView.dateOfBirth}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Gender</div>
                      <div className="font-semibold text-slate-800">{selectedStaffForView.gender}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Blood Group</div>
                      <div className="font-semibold text-rose-700">{selectedStaffForView.bloodGroup || 'O+ Positive'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Nationality & Marital</div>
                      <div className="font-semibold text-slate-800">
                        {selectedStaffForView.nationality || 'Indian'} • {selectedStaffForView.maritalStatus || 'Married'}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Cadre / Category</div>
                      <div className="font-semibold text-emerald-800">{selectedStaffForView.employeeCategory || 'Administrator'}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Employment Status</div>
                      <div className="font-semibold text-emerald-700">{selectedStaffForView.employmentStatus}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Contact / WhatsApp</div>
                      <div className="font-semibold text-slate-800">{selectedStaffForView.contactNumber}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <div className="text-[10px] text-slate-400">Branch & Work Location</div>
                      <div className="font-semibold text-slate-800">{selectedStaffForView.workLocation || 'Kochi Main Campus'}</div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="font-bold text-slate-800 mb-1">Permanent Residential Address</div>
                    <p className="text-slate-600">
                      {selectedStaffForView.permanentAddress.addressLine1},{' '}
                      {selectedStaffForView.permanentAddress.city}, {selectedStaffForView.permanentAddress.state} –{' '}
                      {selectedStaffForView.permanentAddress.pinCode}
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
                    <div className="font-bold text-slate-800 mb-1">Emergency Contact</div>
                    <p className="text-slate-600">
                      {selectedStaffForView.emergencyContact.name} ({selectedStaffForView.emergencyContact.relationship}) –{' '}
                      {selectedStaffForView.emergencyContact.phone}
                    </p>
                  </div>
                </div>
              )}

              {activeProfileTab === 'experience' && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-800">Employment History & Previous Organizations</span>
                  {!selectedStaffForView.experiences || selectedStaffForView.experiences.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      No prior organization experience records logged.
                    </div>
                  ) : (
                    selectedStaffForView.experiences.map((exp, idx) => (
                      <div key={exp.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-900">{exp.organization}</div>
                            <div className="text-xs text-emerald-700 font-semibold">{exp.designation} • {exp.department}</div>
                          </div>
                          <span className="text-[10px] font-bold bg-white px-2.5 py-1 rounded-full border border-slate-200 text-slate-700">
                            {exp.totalExperience || `${exp.dateOfJoining} to ${exp.dateOfLeaving || 'Present'}`}
                          </span>
                        </div>
                        {exp.reasonForLeaving && (
                          <div className="text-[11px] text-slate-500">
                            <b>Reason for Leaving:</b> {exp.reasonForLeaving}
                          </div>
                        )}
                        {exp.remarks && (
                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/80">
                            {exp.remarks}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'qualifications' && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-800">Academic & Professional Qualifications</span>
                  {!selectedStaffForView.qualifications || selectedStaffForView.qualifications.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      No qualification credentials cataloged.
                    </div>
                  ) : (
                    selectedStaffForView.qualifications.map((q, idx) => (
                      <div key={q.id || idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{q.courseName}</div>
                          <div className="text-xs text-slate-500">
                            {q.institution} • Passed {q.yearOfPassing}
                          </div>
                          {q.specialization && <div className="text-[10px] text-slate-400">Specialization: {q.specialization}</div>}
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {q.grade}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">{q.level}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'family' && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-800">Family Contacts & Institutional Dependents</span>
                  {!selectedStaffForView.familyMembers || selectedStaffForView.familyMembers.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      No family contacts recorded.
                    </div>
                  ) : (
                    selectedStaffForView.familyMembers.map((fam, idx) => (
                      <div key={fam.id || idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{fam.name}</div>
                          <div className="text-xs text-slate-500">
                            {fam.relationship} • {fam.contactNumber} {fam.occupation ? `(${fam.occupation})` : ''}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {fam.isEmergencyContact && (
                            <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                              Emergency Contact
                            </span>
                          )}
                          {fam.isDependent && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              Dependent
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeProfileTab === 'documents' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800">Verified Employee Documents</span>
                    <button className="flex items-center space-x-1 text-xs text-[#0B5D2A] font-bold">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload New File</span>
                    </button>
                  </div>

                  {selectedStaffForView.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-emerald-600" />
                        <div>
                          <div className="font-bold text-slate-900">{doc.category}</div>
                          <div className="text-[10px] text-slate-400">
                            {doc.fileName} • Uploaded {doc.uploadDate}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.verificationStatus === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.verificationStatus}
                        </span>
                        <button className="p-1 hover:bg-slate-200 rounded-md text-slate-600">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeProfileTab === 'compensation' && (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <div className="text-xs text-emerald-800 font-semibold">Net Disbursed Monthly Salary</div>
                      <div className="text-2xl font-bold text-emerald-900 mt-0.5">
                        ₹{selectedStaffForView.salary.netSalary.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right text-xs text-emerald-700">
                      <div>Gross: ₹{selectedStaffForView.salary.grossSalary.toLocaleString()}</div>
                      <div>Deductions: ₹{selectedStaffForView.salary.totalDeductions.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-800 mb-2">Earnings Breakdown</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Basic Salary:</span>
                          <span className="font-semibold text-slate-800">
                            ₹{selectedStaffForView.salary.basicSalary.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">HRA:</span>
                          <span className="font-semibold text-slate-800">
                            ₹{selectedStaffForView.salary.hra.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Allowances:</span>
                          <span className="font-semibold text-slate-800">
                            ₹{selectedStaffForView.salary.allowances.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-800 mb-2">Bank & Statutory Details</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bank:</span>
                          <span className="font-semibold text-slate-800">
                            {selectedStaffForView.salary.bankDetails.bankName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account:</span>
                          <span className="font-semibold text-slate-800">
                            {selectedStaffForView.salary.bankDetails.accountNo}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">IFSC:</span>
                          <span className="font-semibold text-slate-800">
                            {selectedStaffForView.salary.bankDetails.ifscCode}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeProfileTab === 'attendance' && (
                <div className="space-y-3">
                  <div className="font-bold text-slate-800">Recent Attendance Logs</div>
                  <div className="space-y-2">
                    {attendanceRecords
                      .filter((r) => r.staffId === selectedStaffForView.id)
                      .slice(0, 5)
                      .map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{rec.date}</div>
                            <div className="text-[10px] text-slate-400">
                              In: {rec.checkIn || '—'} | Out: {rec.checkOut || '—'}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              rec.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rec.status === 'Late'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeProfileTab === 'performance' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">KPI Performance Index</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      Score: {selectedStaffForView.overallKpiScore}%
                    </span>
                  </div>

                  <p className="text-slate-600">
                    Comprehensive annual and quarterly classroom effectiveness assessment, student analysis record logs,
                    and compliance score.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRINT STAFF ID CARD */}
      {selectedStaffForIdCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="border border-slate-300 rounded-2xl overflow-hidden shadow-md bg-white">
              {/* ID Card Header */}
              <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] p-3 text-white text-center">
                <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">MYSAR Staff ID Card</div>
                <div className="text-sm font-bold">Casbiro Solutions Private Limited</div>
              </div>

              {/* ID Card Body */}
              <div className="p-4 text-center space-y-2">
                <div className="w-20 h-20 mx-auto rounded-full bg-slate-100 border-2 border-emerald-600 flex items-center justify-center text-xl font-bold text-emerald-800 shadow-xs">
                  {selectedStaffForIdCard.fullName.charAt(0)}
                </div>

                <div>
                  <div className="text-sm font-bold text-slate-900">{selectedStaffForIdCard.fullName}</div>
                  <div className="text-xs text-emerald-700 font-semibold">{selectedStaffForIdCard.position}</div>
                  <div className="text-[11px] text-slate-500">{selectedStaffForIdCard.department}</div>
                </div>

                <div className="pt-2 border-t border-slate-200 text-left space-y-1 text-[11px] text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Employee ID:</span>
                    <span className="font-bold text-slate-900">{selectedStaffForIdCard.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blood Group:</span>
                    <span className="font-semibold text-rose-700">O+ Positive</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emergency:</span>
                    <span className="font-semibold text-slate-800">{selectedStaffForIdCard.emergencyContact.phone}</span>
                  </div>
                </div>

                {/* QR Code Graphic */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-center space-x-2 text-slate-400">
                  <QrCode className="w-8 h-8 text-slate-800" />
                  <div className="text-[9px] text-left leading-tight text-slate-500">
                    Scan for digital authentication & emergency profile
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setSelectedStaffForIdCard(null)}
                className="px-3 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print ID Card</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPREHENSIVE 10-SECTION ONBOARD STAFF WIZARD */}
      <StaffRegistrationModal
        isOpen={isAddStaffOpen}
        onClose={() => setIsAddStaffOpen(false)}
        onSave={(staffData) => {
          onSaveStaff(staffData);
        }}
        existingStaffCount={staff.length}
      />
    </div>
  );
};
