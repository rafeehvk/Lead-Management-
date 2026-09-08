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
  Maximize2,
  Minimize2,
  Lock,
  ShieldAlert,
  Key,
  RefreshCw,
} from 'lucide-react';
import {
  StaffMember,
  EmploymentStatus,
  StaffDocument,
  DailyAttendanceRecord,
  LeaveRequest,
  StaffPerformanceEvaluation,
  DepartmentMaster,
} from '../../types/hr';
import { StaffRegistrationModal } from './StaffRegistrationModal';
import { PrintableStaffProfile } from './PrintableStaffProfile';
import { StaffIdCardRenderer } from './StaffIdCardRenderer';
import { generateHrPdfFromElement, printHrDocument } from '../../utils/hrPdfGenerator';
import { hrStorage } from '../../services/hrStorageService';

interface StaffManagementViewProps {
  staff: StaffMember[];
  attendanceRecords: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  performanceRecords: StaffPerformanceEvaluation[];
  onSaveStaff: (staffData: Partial<StaffMember>) => void;
  onDeleteStaff: (id: string) => void;
  onUploadDocument?: (staffId: string, doc: StaffDocument) => void;
  onClearAllDummyData?: () => void;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staff = [],
  attendanceRecords = [],
  leaveRequests = [],
  performanceRecords = [],
  onSaveStaff,
  onDeleteStaff,
  onClearAllDummyData,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Staff Edit & Registration Modal State
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);

  // Department Master Table state
  const [departmentsList, setDepartmentsList] = useState<DepartmentMaster[]>(() => hrStorage.getDepartmentsMaster());
  const [isDeptMasterModalOpen, setIsDeptMasterModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentMaster | null>(null);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptReporting, setNewDeptReporting] = useState('');
  const [deptFormError, setDeptFormError] = useState('');

  // Modals & Active Selections
  const [selectedStaffForView, setSelectedStaffForView] = useState<StaffMember | null>(null);
  const [isStaffViewFullScreen, setIsStaffViewFullScreen] = useState(true);
  const [isGeneratingProfilePdf, setIsGeneratingProfilePdf] = useState(false);
  const [pdfExportMessage, setPdfExportMessage] = useState('');
  const [selectedStaffForIdCard, setSelectedStaffForIdCard] = useState<StaffMember | null>(null);
  const [idCardSide, setIdCardSide] = useState<'front' | 'back'>('front');
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<
    'profile' | 'experience' | 'qualifications' | 'family' | 'documents' | 'compensation' | 'attendance' | 'performance' | 'systemAccess'
  >('profile');

  // Department Master handlers
  const handleOpenDeptMaster = () => {
    setDepartmentsList(hrStorage.getDepartmentsMaster());
    setEditingDept(null);
    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptReporting('');
    setDeptFormError('');
    setIsDeptMasterModalOpen(true);
  };

  const handleEditDeptInit = (dept: DepartmentMaster) => {
    setEditingDept(dept);
    setNewDeptCode(dept.departmentCode);
    setNewDeptName(dept.departmentName);
    setNewDeptReporting(dept.reporting);
    setDeptFormError('');
  };

  const handleCancelDeptEdit = () => {
    setEditingDept(null);
    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptReporting('');
    setDeptFormError('');
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode.trim() || !newDeptName.trim() || !newDeptReporting.trim()) {
      setDeptFormError('Please fill all fields: Department Code, Department Name, and Reporting.');
      return;
    }
    const cleanCode = newDeptCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleanCode.length < 2) {
      setDeptFormError('Department Code must be at least 2 characters (e.g. 101, 102, 103).');
      return;
    }

    if (editingDept) {
      hrStorage.saveDepartment({
        id: editingDept.id,
        departmentCode: cleanCode,
        departmentName: newDeptName.trim(),
        reporting: newDeptReporting.trim(),
        status: 'Active',
      });
      setDepartmentsList(hrStorage.getDepartmentsMaster());
      setEditingDept(null);
    } else {
      if (departmentsList.some((d) => d.departmentCode.toUpperCase() === cleanCode)) {
        setDeptFormError(`Department Code "${cleanCode}" already exists in Master Table.`);
        return;
      }
      hrStorage.saveDepartment({
        departmentCode: cleanCode,
        departmentName: newDeptName.trim(),
        reporting: newDeptReporting.trim(),
        status: 'Active',
      });
      setDepartmentsList(hrStorage.getDepartmentsMaster());
    }

    setNewDeptCode('');
    setNewDeptName('');
    setNewDeptReporting('');
    setDeptFormError('');
  };

  const handleDeleteDepartment = (id: string) => {
    if (departmentsList.length <= 1) {
      alert('At least one department must remain in the Department Master Table.');
      return;
    }
    if (window.confirm('Are you sure you want to remove this department from Master Table?')) {
      hrStorage.deleteDepartment(id);
      setDepartmentsList(hrStorage.getDepartmentsMaster());
    }
  };

  // Staff status toggle handler (Active <-> Inactive) to show instant access restriction
  const handleToggleStaffStatus = (staffMember: StaffMember) => {
    const newStatus: EmploymentStatus = staffMember.employmentStatus === 'Active' ? 'Inactive' : 'Active';
    const updatedStaff: Partial<StaffMember> = {
      ...staffMember,
      employmentStatus: newStatus,
      systemAccess: {
        ...(staffMember.systemAccess || {
          enableLogin: true,
          username: staffMember.email.split('@')[0],
          role: 'Staff',
          accessLevel: 'Standard',
          assignedModules: ['Dashboard'],
          branchAccess: 'Kochi Main Campus',
        }),
        accountStatus: newStatus === 'Active' ? 'Active' : 'Suspended',
      },
    };
    onSaveStaff(updatedStaff);
    if (selectedStaffForView && selectedStaffForView.id === staffMember.id) {
      setSelectedStaffForView({ ...selectedStaffForView, ...updatedStaff } as StaffMember);
    }
  };

  // PDF Export Handler for Staff Profile
  const handleDownloadStaffProfilePdf = async () => {
    if (!selectedStaffForView) return;
    setIsGeneratingProfilePdf(true);
    setPdfExportMessage('Rendering PDF pages...');
    try {
      const sanitizedName = selectedStaffForView.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `MYSAR_Staff_Profile_${selectedStaffForView.id}_${sanitizedName}.pdf`;
      await generateHrPdfFromElement('printable-staff-profile-doc', {
        filename,
        onProgress: (msg) => setPdfExportMessage(msg),
      });
    } catch (err) {
      console.error('Failed to generate staff profile PDF', err);
      printHrDocument('printable-staff-profile-doc');
    } finally {
      setIsGeneratingProfilePdf(false);
      setPdfExportMessage('');
    }
  };

  // Staff Edit & Creation Handlers
  const handleOpenAddStaff = () => {
    setStaffToEdit(null);
    setIsAddStaffOpen(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    setStaffToEdit(staffMember);
    setIsAddStaffOpen(true);
  };

  // Clear Dummy Data Handler
  const handleClearDummyData = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all dummy/mock data? This will clear sample staff members and sample records from storage.'
      )
    ) {
      if (onClearAllDummyData) {
        onClearAllDummyData();
      } else {
        hrStorage.clearAllDummyData('HR Admin');
      }
      setDepartmentsList(hrStorage.getDepartmentsMaster());
    }
  };

  // Download CSV Report Handler (includes auto-generated Employee ID)
  const handleDownloadCsvReport = () => {
    if (!staff || staff.length === 0) {
      alert('No staff records found to export.');
      return;
    }

    const headers = [
      'Employee ID',
      'Full Name',
      'Department',
      'Department Code',
      'Designation / Position',
      'Employment Status',
      'Employment Type',
      'Category',
      'Date of Joining',
      'Official Email',
      'Personal Email',
      'Contact Number',
      'WhatsApp Number',
      'Gross Salary (INR)',
      'Basic Salary (INR)',
      'Net Salary (INR)',
      'Bank Name',
      'Account Number',
      'IFSC Code',
      'PAN Number',
      'Aadhaar Number',
      'Reporting Manager',
      'Work Location',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Document Attachments Count',
      'System Username',
      'System Role',
      'System Access Status',
      'Last Updated',
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const clean = String(val).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = staff.map((s) => {
      const empId = s.staffCode || s.id;
      const docsCount = (s.documentReferences?.length || 0) + (s.documents?.length || 0);
      return [
        escapeCsv(empId),
        escapeCsv(s.fullName),
        escapeCsv(s.department),
        escapeCsv(s.departmentCode || ''),
        escapeCsv(s.position),
        escapeCsv(s.employmentStatus),
        escapeCsv(s.employmentType),
        escapeCsv(s.employeeCategory || ''),
        escapeCsv(s.joiningDate),
        escapeCsv(s.email),
        escapeCsv(s.personalEmail || ''),
        escapeCsv(s.contactNumber),
        escapeCsv(s.whatsappNumber || ''),
        escapeCsv(s.salary?.grossSalary || 0),
        escapeCsv(s.salary?.basicSalary || 0),
        escapeCsv(s.salary?.netSalary || 0),
        escapeCsv(s.salary?.bankDetails?.bankName || s.bankPayroll?.bankName || ''),
        escapeCsv(s.salary?.bankDetails?.accountNo || s.bankPayroll?.accountNo || ''),
        escapeCsv(s.salary?.bankDetails?.ifscCode || s.bankPayroll?.ifscCode || ''),
        escapeCsv(s.panNumber || ''),
        escapeCsv(s.aadhaarNumber || ''),
        escapeCsv(s.reportingTo || s.reportingManager || ''),
        escapeCsv(s.workLocation || s.branchLocation || ''),
        escapeCsv(s.emergencyContact?.name || ''),
        escapeCsv(s.emergencyContact?.phone || ''),
        escapeCsv(docsCount),
        escapeCsv(s.systemAccess?.username || ''),
        escapeCsv(s.systemAccess?.role || ''),
        escapeCsv(s.systemAccess?.accountStatus || s.employmentStatus),
        escapeCsv(s.updatedDate || s.createdDate || s.joiningDate),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `MYSAR_Staff_Directory_Report_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
            <option value="All">All Departments ({departmentsList.length})</option>
            {departmentsList.map((d) => (
              <option key={d.id} value={d.departmentName}>
                [{d.departmentCode}] {d.departmentName}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active (Access Granted)</option>
            <option value="Inactive">Inactive (Access Restricted)</option>
            <option value="Probation">Probation</option>
            <option value="Resigned">Resigned (Blocked)</option>
            <option value="Terminated">Terminated (Blocked)</option>
          </select>

          <button
            type="button"
            onClick={handleOpenDeptMaster}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border border-slate-300"
            title="Manage Department Master Table: Department Code, Department Name, and Reporting Manager"
          >
            <Building className="w-4 h-4 text-emerald-700" />
            <span>Department Master</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCsvReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border border-slate-300"
            title="Download CSV Report of current staff directory including auto-generated Employee IDs"
          >
            <Download className="w-4 h-4 text-[#168A45]" />
            <span>Download Report</span>
          </button>

          <button
            type="button"
            onClick={handleClearDummyData}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer border border-rose-200"
            title="Clear all dummy and mock staff data from database"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Clear Dummy Data</span>
          </button>

          <button
            onClick={handleOpenAddStaff}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
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
                        <div className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50/80 px-1.5 py-0.2 rounded border border-emerald-200/60 inline-block mt-0.5">
                          {staffMember.staffCode || staffMember.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-slate-800">{staffMember.position}</div>
                    <div className="text-[11px] text-slate-600 flex items-center space-x-1 mt-0.5">
                      <span className="font-mono font-bold text-emerald-700 bg-slate-100 px-1 rounded text-[10px]">
                        {staffMember.departmentCode || staffMember.department.substring(0, 4).toUpperCase()}
                      </span>
                      <span>{staffMember.department}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                      Reports: {staffMember.reportingTo || staffMember.reportingManager || 'Principal'}
                    </div>
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
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block w-fit ${
                          staffMember.employmentStatus === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : staffMember.employmentStatus === 'Probation'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-rose-100 text-rose-800 font-bold'
                        }`}
                      >
                        {staffMember.employmentStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleStaffStatus(staffMember)}
                        title={
                          staffMember.employmentStatus === 'Active'
                            ? 'ERP Login Granted. Click to mark Inactive and restrict access.'
                            : 'ERP Access Restricted! Click to reactivate.'
                        }
                        className={`inline-flex items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer w-fit ${
                          staffMember.employmentStatus === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 font-bold animate-pulse'
                        }`}
                      >
                        {staffMember.employmentStatus === 'Active' ? (
                          <>
                            <Lock className="w-2.5 h-2.5" />
                            <span>Login: Granted</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-2.5 h-2.5" />
                            <span>Access: Blocked</span>
                          </>
                        )}
                      </button>
                    </div>
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
                        onClick={() => handleEditStaff(staffMember)}
                        title="Edit Staff Member"
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors cursor-pointer border border-amber-200/60"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
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
        <div
          className={
            isStaffViewFullScreen
              ? 'fixed inset-0 z-50 bg-white flex flex-col w-screen h-screen overflow-hidden text-xs'
              : 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto'
          }
        >
          <div
            className={
              isStaffViewFullScreen
                ? 'bg-white w-full h-full flex flex-col overflow-hidden text-xs'
                : 'bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col text-xs overflow-hidden'
            }
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center space-x-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-white text-[#0B5D2A] font-black text-xl flex items-center justify-center shadow-md shrink-0 overflow-hidden">
                  {selectedStaffForView.profilePhoto ? (
                    <img
                      src={selectedStaffForView.profilePhoto}
                      alt={selectedStaffForView.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    selectedStaffForView.fullName.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h2 className="text-base sm:text-lg font-bold truncate">{selectedStaffForView.fullName}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                      {selectedStaffForView.employmentStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-900/40 text-emerald-100">
                      {selectedStaffForView.employeeCategory || 'Academic & Admin'}
                    </span>
                  </div>
                  <div className="text-emerald-100 text-xs truncate">
                    {selectedStaffForView.position} • {selectedStaffForView.department} Department
                  </div>
                  <div className="text-[11px] text-emerald-200 mt-0.5 flex items-center space-x-2">
                    <span>ID: {selectedStaffForView.id}</span>
                    <span>•</span>
                    <span>Joined: {selectedStaffForView.joiningDate}</span>
                    <span>•</span>
                    <span>{selectedStaffForView.employmentType}</span>
                  </div>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const member = selectedStaffForView;
                    setSelectedStaffForView(null);
                    handleEditStaff(member);
                  }}
                  title="Edit Staff Member Details"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl shadow-xs transition-all cursor-pointer text-xs"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-900" />
                  <span>Edit Staff</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadStaffProfilePdf}
                  disabled={isGeneratingProfilePdf}
                  title="Download complete confidential staff profile as PDF"
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white text-[#0B5D2A] hover:bg-emerald-50 font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-60 text-xs"
                >
                  <Download className="w-4 h-4 text-[#168A45]" />
                  <span>{isGeneratingProfilePdf ? (pdfExportMessage || 'Exporting...') : 'Download PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => printHrDocument('printable-staff-profile-doc')}
                  title="Print Staff Profile Document"
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl transition-all cursor-pointer text-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsStaffViewFullScreen(!isStaffViewFullScreen)}
                  title={isStaffViewFullScreen ? 'Exit Full Screen' : 'View Full Screen'}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white font-semibold rounded-xl transition-all cursor-pointer text-xs"
                >
                  {isStaffViewFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span className="hidden md:inline">{isStaffViewFullScreen ? 'Windowed' : 'Full Screen'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStaffForView(null)}
                  title="Close Profile"
                  className="text-white hover:bg-white/20 p-2 rounded-xl cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
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
              <button
                onClick={() => setActiveProfileTab('systemAccess')}
                className={`pb-2.5 px-2.5 border-b-2 cursor-pointer transition-colors whitespace-nowrap flex items-center space-x-1.5 ${
                  activeProfileTab === 'systemAccess'
                    ? 'border-[#168A45] text-[#0B5D2A] font-bold bg-emerald-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                <span>ERP Access & Security</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
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
                        {selectedStaffForView.salary.allowanceItems && selectedStaffForView.salary.allowanceItems.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 bg-white/70 p-2 rounded-lg border border-slate-100">
                            <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                              <span>Multiple Allowances Breakdown</span>
                              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded text-[9px]">
                                {selectedStaffForView.salary.allowanceItems.length} Items
                              </span>
                            </div>
                            <div className="space-y-1 pl-1">
                              {selectedStaffForView.salary.allowanceItems.map((item, i) => (
                                <div key={i} className="flex justify-between text-[11px] text-slate-600">
                                  <span>• {item.name}:</span>
                                  <span className="font-medium text-slate-800">₹{item.amount.toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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

              {activeProfileTab === 'systemAccess' && (
                <div className="space-y-4">
                  {/* Access Status Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-start space-x-3.5 ${
                      selectedStaffForView.employmentStatus === 'Active'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-300 text-rose-950'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                        selectedStaffForView.employmentStatus === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {selectedStaffForView.employmentStatus === 'Active' ? (
                        <ShieldCheck className="w-6 h-6" />
                      ) : (
                        <ShieldAlert className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="font-bold text-sm">
                          {selectedStaffForView.employmentStatus === 'Active'
                            ? 'ERP Portal Access: GRANTED & ACTIVE'
                            : 'ERP Portal Access: RESTRICTED & BLOCKED'}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleStaffStatus(selectedStaffForView)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5 ${
                            selectedStaffForView.employmentStatus === 'Active'
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>
                            {selectedStaffForView.employmentStatus === 'Active'
                              ? 'Mark Inactive (Restrict Access)'
                              : 'Mark Active (Restore Access)'}
                          </span>
                        </button>
                      </div>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">
                        {selectedStaffForView.employmentStatus === 'Active'
                          ? 'This staff member is marked as Active. Associated ERP login credentials are authenticated and valid for all assigned campus modules.'
                          : 'CRITICAL SECURITY RESTRICTION: This staff member is currently marked as Inactive/Resigned/Terminated. All login sessions, module permissions, and portal credentials are automatically blocked.'}
                      </p>
                    </div>
                  </div>

                  {/* Account Identity Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-200 pb-2">
                        <Key className="w-4 h-4 text-emerald-700" />
                        <span>Connected ERP User Credentials</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Assigned User Type:</span>
                          <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {selectedStaffForView.systemAccess?.userType ||
                              selectedStaffForView.employeeCategory ||
                              'Faculty / Staff'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">System Username:</span>
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {selectedStaffForView.systemAccess?.username || selectedStaffForView.email.split('@')[0]}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Default Password:</span>
                          <span className="font-mono text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {selectedStaffForView.systemAccess?.initialPassword
                              ? selectedStaffForView.systemAccess.initialPassword
                              : '•••••••••••• (Encrypted on Onboarding)'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Account Authorization:</span>
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                              selectedStaffForView.employmentStatus === 'Active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {selectedStaffForView.employmentStatus === 'Active' ? 'Enabled (Active)' : 'Suspended (Inactive)'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-200 pb-2">
                        <Building className="w-4 h-4 text-emerald-700" />
                        <span>Department Master & ID Mapping</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Department Code:</span>
                          <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {selectedStaffForView.departmentCode ||
                              selectedStaffForView.department.substring(0, 4).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Department Name:</span>
                          <span className="font-semibold text-slate-800">{selectedStaffForView.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Reporting Manager:</span>
                          <span className="font-semibold text-slate-800">
                            {selectedStaffForView.reportingTo || selectedStaffForView.reportingManager || 'Principal'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Employee ID Format:</span>
                          <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {selectedStaffForView.staffCode || selectedStaffForView.id} (CB/Dept/Seq)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2 text-slate-500 text-xs">
                <span>Employee ID: <b className="text-slate-800">{selectedStaffForView.id}</b></span>
                <span>•</span>
                <span>Department: <b className="text-slate-800">{selectedStaffForView.department}</b></span>
              </div>

              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedStaffForIdCard(selectedStaffForView)}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B5D2A] border border-emerald-200 rounded-xl font-semibold cursor-pointer text-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Print ID Card</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadStaffProfilePdf}
                  disabled={isGeneratingProfilePdf}
                  className="flex items-center space-x-1.5 px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer shadow-xs transition-all text-xs disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingProfilePdf ? (pdfExportMessage || 'Generating PDF...') : 'Download PDF Dossier'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStaffForView(null)}
                  className="px-4 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer text-xs"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Printable Profile Component for PDF Generation and Print */}
      {selectedStaffForView && (
        <div className="fixed left-[-9999px] top-[-9999px] pointer-events-none opacity-0">
          <PrintableStaffProfile staff={selectedStaffForView} id="printable-staff-profile-doc" />
        </div>
      )}

      {/* MODAL: PRINT STAFF ID CARD */}
      {selectedStaffForIdCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-xs flex flex-col items-center max-w-md w-full">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Staff Institutional ID Badge</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedStaffForIdCard.fullName} • {selectedStaffForIdCard.id}
                </p>
              </div>

              {/* Side toggle */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setIdCardSide('front')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    idCardSide === 'front'
                      ? 'bg-[#168A45] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => setIdCardSide('back')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    idCardSide === 'back'
                      ? 'bg-[#168A45] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Back
                </button>
              </div>
            </div>

            {/* Rendered Template ID Card */}
            <div className="py-2 flex justify-center w-full">
              <StaffIdCardRenderer
                template={hrStorage.getIdCardSettings()}
                staff={selectedStaffForIdCard}
                side={idCardSide}
                scale={1}
                isInteractive={false}
              />
            </div>

            {/* Bottom Actions */}
            <div className="w-full mt-5 pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  setSelectedStaffForIdCard(null);
                  setIdCardSide('front');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer text-xs"
              >
                Close
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer shadow-xs text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Badge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DEPARTMENT MASTER TABLE */}
      {isDeptMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col text-xs max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] px-5 py-4 text-white flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Department Master Table</h3>
                  <p className="text-emerald-100 text-xs mt-0.5">
                    Configure institutional departments, code prefixes, and reporting managers. Controls automatic ID generation: <span className="font-mono font-bold text-white bg-white/20 px-1.5 py-0.5 rounded">CB/[DeptCode]/[Continuous#]</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeptMasterModalOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5">
              {/* Add / Edit Department Form */}
              <form onSubmit={handleSaveDepartment} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center space-x-1.5">
                    {editingDept ? <Edit2 className="w-3.5 h-3.5 text-emerald-700" /> : <Plus className="w-3.5 h-3.5 text-emerald-700" />}
                    <span>{editingDept ? `Edit Department (${editingDept.departmentCode})` : 'Add New Department'}</span>
                  </span>
                  {editingDept && (
                    <button
                      type="button"
                      onClick={handleCancelDeptEdit}
                      className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                {deptFormError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    {deptFormError}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Department Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. 101, 102, 103"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                    />
                    <span className="text-[10px] text-slate-400">Used for ID: CB/{newDeptCode || '101'}/### (continuous sequence)</span>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Department Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Academic, Administration"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Reporting *</label>
                    <input
                      type="text"
                      placeholder="e.g. Principal / Director"
                      value={newDeptReporting}
                      onChange={(e) => setNewDeptReporting(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    {editingDept ? 'Update Department' : 'Save Department'}
                  </button>
                </div>
              </form>

              {/* Master Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Configured Master Departments ({departmentsList.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Continuous Sequence pattern: <b className="text-emerald-800">CB / [Dept Code] / [Seq]</b>
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Department Code</th>
                        <th className="px-3 py-2.5">Department Name</th>
                        <th className="px-3 py-2.5">Reporting</th>
                        <th className="px-3 py-2.5">Staff Count</th>
                        <th className="px-3 py-2.5">Employee ID Continuous Format</th>
                        <th className="px-3 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {departmentsList.map((dept) => {
                        const count = staff.filter(
                          (s) =>
                            s.department.toLowerCase() === dept.departmentName.toLowerCase() ||
                            s.departmentCode?.toUpperCase() === dept.departmentCode.toUpperCase()
                        ).length;

                        return (
                          <tr key={dept.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-3 py-2.5">
                              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
                                {dept.departmentCode}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-slate-800">{dept.departmentName}</td>
                            <td className="px-3 py-2.5 text-slate-600 font-medium">{dept.reporting}</td>
                            <td className="px-3 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                {count} {count === 1 ? 'member' : 'members'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="font-mono text-xs text-emerald-900 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                CB/{dept.departmentCode}/001, 002...
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleEditDeptInit(dept)}
                                  title="Edit Department"
                                  className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDepartment(dept.id)}
                                  title="Delete Department"
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-500">
                Changes persist automatically into ERP Local Storage and onboarding forms.
              </div>
              <button
                type="button"
                onClick={() => setIsDeptMasterModalOpen(false)}
                className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer transition-colors text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: COMPREHENSIVE 10-SECTION ONBOARD / EDIT STAFF WIZARD */}
      <StaffRegistrationModal
        isOpen={isAddStaffOpen}
        onClose={() => {
          setIsAddStaffOpen(false);
          setStaffToEdit(null);
        }}
        onSave={(staffData) => {
          onSaveStaff(staffData);
          setStaffToEdit(null);
        }}
        existingStaffCount={staff.length}
        staffToEdit={staffToEdit}
      />
    </div>
  );
};
