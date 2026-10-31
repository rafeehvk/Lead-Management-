import React, { useState, useEffect } from 'react';
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
  AlertTriangle,
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
import { DepartmentMasterTable } from './DepartmentMasterTable';
import { BranchMasterTable } from './BranchMasterTable';
import { StaffIdCardRenderer } from './StaffIdCardRenderer';
import { ProfilePhotoUploader } from '../ProfilePhotoUploader';
import { generateHrPdfFromElement, printHrDocument } from '../../utils/hrPdfGenerator';
import { hrStorage } from '../../services/hrStorageService';
import { UserSideMenuPermission } from '../../utils/menuPermissions';

interface StaffManagementViewProps {
  staff: StaffMember[];
  attendanceRecords: DailyAttendanceRecord[];
  leaveRequests: LeaveRequest[];
  performanceRecords: StaffPerformanceEvaluation[];
  onSaveStaff: (staffData: Partial<StaffMember>) => void;
  onDeleteStaff: (id: string) => void;
  onUploadDocument?: (staffId: string, doc: StaffDocument) => void;
  onClearAllDummyData?: () => void;
  onNavigateToHrConfiguration?: () => void;
  prefillStaffData?: Partial<StaffMember> | null;
  onClearPrefillStaffData?: () => void;
  menuPermission?: UserSideMenuPermission;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staff = [],
  attendanceRecords = [],
  leaveRequests = [],
  performanceRecords = [],
  onSaveStaff,
  onDeleteStaff,
  onClearAllDummyData,
  onNavigateToHrConfiguration,
  prefillStaffData,
  onClearPrefillStaffData,
  menuPermission,
}) => {
  const canViewOption = menuPermission ? menuPermission.viewOnly || menuPermission.entry || menuPermission.edit || menuPermission.delete : true;
  const canEntryOption = menuPermission ? menuPermission.entry : true;
  const canEditOption = menuPermission ? menuPermission.edit : true;
  const canDeleteOption = menuPermission ? menuPermission.delete : true;

  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Staff Edit & Registration Modal State
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);

  // Department Master Table state
  const [departmentsList, setDepartmentsList] = useState<DepartmentMaster[]>(() => hrStorage.getDepartmentsMaster());
  const [isDeptMasterModalOpen, setIsDeptMasterModalOpen] = useState(false);
  const [isBranchMasterModalOpen, setIsBranchMasterModalOpen] = useState(false);

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

  // Delete Staff Confirmation Modal State
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
  const [editValidationErrors, setEditValidationErrors] = useState<string[] | null>(null);
  const [saveSuccessFeedback, setSaveSuccessFeedback] = useState<string | null>(null);

  const handleConfirmDeleteStaff = () => {
    if (!staffToDelete) return;
    const name = staffToDelete.fullName;
    const id = staffToDelete.id;
    onDeleteStaff(id);
    setStaffToDelete(null);
    setDeleteFeedback(`Staff member "${name}" (${id}) was successfully and permanently removed.`);
    setTimeout(() => setDeleteFeedback(null), 3500);
  };

  // Department Master handlers
  const handleOpenDeptMaster = () => {
    setDepartmentsList(hrStorage.getDepartmentsMaster());
    setIsDeptMasterModalOpen(true);
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
          branchAccess: 'Kochi Corporate HQ',
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
  useEffect(() => {
    if (prefillStaffData) {
      setStaffToEdit(null);
      setIsAddStaffOpen(true);
    }
  }, [prefillStaffData]);

  const handleOpenAddStaff = () => {
    if (onClearPrefillStaffData) onClearPrefillStaffData();
    setStaffToEdit(null);
    setIsAddStaffOpen(true);
  };

  const handleEditStaff = (staffMember: StaffMember) => {
    if (onClearPrefillStaffData) onClearPrefillStaffData();
    setStaffToEdit(staffMember);
    setIsAddStaffOpen(true);
  };

  /**
   * Explicit null-check handler for Edit Mode:
   * Reconciles incoming staff payload with existing record to ensure that empty,
   * null, or incomplete fields do NOT overwrite existing data with default fallbacks.
   */
  const reconcileStaffEditData = (
    existing: StaffMember,
    incoming: Partial<StaffMember>
  ): Partial<StaffMember> => {
    // 1. Reconcile Emergency Contact with explicit null/empty checks
    const safeEmergencyContact = {
      name: (incoming.emergencyContact?.name !== undefined && incoming.emergencyContact.name.trim() !== '')
        ? incoming.emergencyContact.name.trim()
        : (existing.emergencyContact?.name || ''),
      relationship: (incoming.emergencyContact?.relationship !== undefined && incoming.emergencyContact.relationship.trim() !== '')
        ? incoming.emergencyContact.relationship.trim()
        : (existing.emergencyContact?.relationship || ''),
      phone: (incoming.emergencyContact?.phone !== undefined && incoming.emergencyContact.phone.trim() !== '')
        ? incoming.emergencyContact.phone.trim()
        : (existing.emergencyContact?.phone || ''),
    };

    // 2. Reconcile Permanent Address with explicit null/empty checks
    const safePermanentAddress = {
      addressLine1: (incoming.permanentAddress?.addressLine1 !== undefined && incoming.permanentAddress.addressLine1.trim() !== '')
        ? incoming.permanentAddress.addressLine1.trim()
        : (existing.permanentAddress?.addressLine1 || ''),
      addressLine2: (incoming.permanentAddress?.addressLine2 !== undefined && incoming.permanentAddress.addressLine2.trim() !== '')
        ? incoming.permanentAddress.addressLine2.trim()
        : (existing.permanentAddress?.addressLine2 || ''),
      city: (incoming.permanentAddress?.city !== undefined && incoming.permanentAddress.city.trim() !== '')
        ? incoming.permanentAddress.city.trim()
        : (existing.permanentAddress?.city || ''),
      district: (incoming.permanentAddress?.district !== undefined && incoming.permanentAddress.district.trim() !== '')
        ? incoming.permanentAddress.district.trim()
        : (existing.permanentAddress?.district || ''),
      state: (incoming.permanentAddress?.state !== undefined && incoming.permanentAddress.state.trim() !== '')
        ? incoming.permanentAddress.state.trim()
        : (existing.permanentAddress?.state || ''),
      country: incoming.permanentAddress?.country || existing.permanentAddress?.country || 'India',
      pinCode: (incoming.permanentAddress?.pinCode !== undefined && incoming.permanentAddress.pinCode.trim() !== '')
        ? incoming.permanentAddress.pinCode.trim()
        : (existing.permanentAddress?.pinCode || ''),
    };

    // 3. Reconcile Communication Address
    const safeCommunicationAddress = {
      sameAsPermanent: incoming.communicationAddress?.sameAsPermanent ?? existing.communicationAddress?.sameAsPermanent ?? true,
      addressLine1: (incoming.communicationAddress?.addressLine1 !== undefined && incoming.communicationAddress.addressLine1.trim() !== '')
        ? incoming.communicationAddress.addressLine1.trim()
        : (existing.communicationAddress?.addressLine1 || ''),
      addressLine2: (incoming.communicationAddress?.addressLine2 !== undefined && incoming.communicationAddress.addressLine2.trim() !== '')
        ? incoming.communicationAddress.addressLine2.trim()
        : (existing.communicationAddress?.addressLine2 || ''),
      city: (incoming.communicationAddress?.city !== undefined && incoming.communicationAddress.city.trim() !== '')
        ? incoming.communicationAddress.city.trim()
        : (existing.communicationAddress?.city || ''),
      district: (incoming.communicationAddress?.district !== undefined && incoming.communicationAddress.district.trim() !== '')
        ? incoming.communicationAddress.district.trim()
        : (existing.communicationAddress?.district || ''),
      state: (incoming.communicationAddress?.state !== undefined && incoming.communicationAddress.state.trim() !== '')
        ? incoming.communicationAddress.state.trim()
        : (existing.communicationAddress?.state || ''),
      country: incoming.communicationAddress?.country || existing.communicationAddress?.country || 'India',
      pinCode: (incoming.communicationAddress?.pinCode !== undefined && incoming.communicationAddress.pinCode.trim() !== '')
        ? incoming.communicationAddress.pinCode.trim()
        : (existing.communicationAddress?.pinCode || ''),
    };

    // 4. Reconcile Bank & Compensation Details
    const existingSal = existing.salary;
    const incomingSal = incoming.salary;
    const safeSalary = {
      ...existingSal,
      ...incomingSal,
      basicSalary: (incomingSal?.basicSalary !== undefined && incomingSal.basicSalary > 0)
        ? incomingSal.basicSalary
        : (existingSal?.basicSalary || 0),
      hra: (incomingSal?.hra !== undefined && incomingSal.hra > 0)
        ? incomingSal.hra
        : (existingSal?.hra || 0),
      allowances: (incomingSal?.allowances !== undefined && incomingSal.allowances > 0)
        ? incomingSal.allowances
        : (existingSal?.allowances || 0),
      specialAllowance: (incomingSal?.specialAllowance !== undefined && incomingSal.specialAllowance > 0)
        ? incomingSal.specialAllowance
        : (existingSal?.specialAllowance || 0),
      grossSalary: (incomingSal?.grossSalary !== undefined && incomingSal.grossSalary > 0)
        ? incomingSal.grossSalary
        : (existingSal?.grossSalary || 0),
      allowanceItems: (incomingSal?.allowanceItems && incomingSal.allowanceItems.length > 0)
        ? incomingSal.allowanceItems
        : (existingSal?.allowanceItems || []),
      deductionItems: (incomingSal?.deductionItems && incomingSal.deductionItems.length > 0)
        ? incomingSal.deductionItems
        : (existingSal?.deductionItems || []),
      bankDetails: {
        bankName: (incomingSal?.bankDetails?.bankName && incomingSal.bankDetails.bankName.trim() !== '')
          ? incomingSal.bankDetails.bankName.trim()
          : (existingSal?.bankDetails?.bankName || existing.bankPayroll?.bankName || ''),
        accountNo: (incomingSal?.bankDetails?.accountNo && incomingSal.bankDetails.accountNo.trim() !== '')
          ? incomingSal.bankDetails.accountNo.trim()
          : (existingSal?.bankDetails?.accountNo || existing.bankPayroll?.accountNo || ''),
        ifscCode: (incomingSal?.bankDetails?.ifscCode && incomingSal.bankDetails.ifscCode.trim() !== '')
          ? incomingSal.bankDetails.ifscCode.trim()
          : (existingSal?.bankDetails?.ifscCode || existing.bankPayroll?.ifscCode || ''),
        branch: (incomingSal?.bankDetails?.branch && incomingSal.bankDetails.branch.trim() !== '')
          ? incomingSal.bankDetails.branch.trim()
          : (existingSal?.bankDetails?.branch || existing.bankPayroll?.branch || ''),
      },
    };

    const safeBankPayroll = {
      ...existing.bankPayroll,
      ...incoming.bankPayroll,
      bankName: incoming.bankPayroll?.bankName?.trim() || safeSalary.bankDetails.bankName || existing.bankPayroll?.bankName || '',
      accountHolderName: incoming.bankPayroll?.accountHolderName?.trim() || existing.bankPayroll?.accountHolderName || existing.fullName,
      accountNo: incoming.bankPayroll?.accountNo?.trim() || safeSalary.bankDetails.accountNo || existing.bankPayroll?.accountNo || '',
      ifscCode: incoming.bankPayroll?.ifscCode?.trim() || safeSalary.bankDetails.ifscCode || existing.bankPayroll?.ifscCode || '',
      branch: incoming.bankPayroll?.branch?.trim() || safeSalary.bankDetails.branch || existing.bankPayroll?.branch || '',
      uan: incoming.bankPayroll?.uan?.trim() || existing.bankPayroll?.uan || '',
      pfNumber: incoming.bankPayroll?.pfNumber?.trim() || existing.bankPayroll?.pfNumber || '',
      esiNumber: incoming.bankPayroll?.esiNumber?.trim() || existing.bankPayroll?.esiNumber || '',
    };

    // 5. Reconcile System Access & Credentials (Never let password or username reset to defaults)
    const existingSys = existing.systemAccess;
    const incomingSys = incoming.systemAccess;

    const safeUsername = (incomingSys?.username && incomingSys.username.trim() !== '' && incomingSys.username.trim() !== 'staff.user')
      ? incomingSys.username.trim().toLowerCase()
      : (existingSys?.username || existing.email.split('@')[0].toLowerCase());

    const safePassword = (incomingSys?.password && incomingSys.password.trim() !== '' && incomingSys.password.trim() !== 'Password@123')
      ? incomingSys.password.trim()
      : (existingSys?.password || (existingSys as any)?.initialPassword || 'Password@123');

    const safeSystemAccess = {
      ...existingSys,
      ...incomingSys,
      enableLogin: incomingSys?.enableLogin ?? existingSys?.enableLogin ?? true,
      userType: incomingSys?.userType || existingSys?.userType || 'Staff',
      username: safeUsername,
      password: safePassword,
      role: incomingSys?.role || existingSys?.role || 'Staff',
      accessLevel: incomingSys?.accessLevel || existingSys?.accessLevel || 'Standard',
      assignedModules: (incomingSys?.assignedModules && incomingSys.assignedModules.length > 0)
        ? incomingSys.assignedModules
        : (existingSys?.assignedModules || ['Dashboard', 'HR & Staff Directory', 'Attendance & Leave']),
      branchAccess: incomingSys?.branchAccess?.trim() || existingSys?.branchAccess || incoming.branchLocation || existing.branchLocation || 'Kochi Corporate HQ',
      accountStatus: incomingSys?.accountStatus || existingSys?.accountStatus || 'Active',
    };

    // 6. Reconcile Audit & Verification
    const safeVerification = {
      registrationDate: incoming.verification?.registrationDate || existing.verification?.registrationDate || existing.createdDate || '',
      registeredBy: incoming.verification?.registeredBy?.trim() || existing.verification?.registeredBy || '',
      verificationStatus: incoming.verification?.verificationStatus || existing.verification?.verificationStatus || 'Pending',
      verifiedBy: incoming.verification?.verifiedBy?.trim() || existing.verification?.verifiedBy || '',
      verificationDate: incoming.verification?.verificationDate || existing.verification?.verificationDate || '',
      remarks: incoming.verification?.remarks?.trim() || existing.verification?.remarks || existing.notes || '',
    };

    // 7. Reconcile Documents & References
    const safeDocs = (incoming.documents && incoming.documents.length > 0)
      ? incoming.documents
      : (existing.documents || []);

    const safeDocRefs = (incoming.documentReferences && incoming.documentReferences.length > 0)
      ? incoming.documentReferences
      : (existing.documentReferences || []);

    // 8. Reconcile Records
    const safeExperiences = (incoming.experiences && incoming.experiences.length > 0)
      ? incoming.experiences
      : (existing.experiences || []);

    const safeQualifications = (incoming.qualifications && incoming.qualifications.length > 0)
      ? incoming.qualifications
      : (existing.qualifications || []);

    const safeFamilyMembers = (incoming.familyMembers && incoming.familyMembers.length > 0)
      ? incoming.familyMembers
      : (existing.familyMembers || []);

    return {
      ...existing,
      ...incoming,
      id: existing.id,
      staffCode: existing.staffCode || existing.id,
      fullName: incoming.fullName?.trim() || existing.fullName,
      email: incoming.email?.trim() || existing.email,
      personalEmail: (incoming.personalEmail !== undefined && incoming.personalEmail.trim() !== '')
        ? incoming.personalEmail.trim()
        : (existing.personalEmail || ''),
      contactNumber: incoming.contactNumber?.trim() || existing.contactNumber,
      whatsappNumber: (incoming.whatsappNumber !== undefined && incoming.whatsappNumber.trim() !== '')
        ? incoming.whatsappNumber.trim()
        : (existing.whatsappNumber || ''),
      gender: incoming.gender || existing.gender,
      dateOfBirth: incoming.dateOfBirth?.trim() || existing.dateOfBirth,
      bloodGroup: incoming.bloodGroup?.trim() || existing.bloodGroup,
      nationality: (incoming.nationality !== undefined && incoming.nationality.trim() !== '')
        ? incoming.nationality.trim()
        : (existing.nationality || ''),
      maritalStatus: incoming.maritalStatus || existing.maritalStatus,
      joiningDate: incoming.joiningDate || existing.joiningDate,
      department: incoming.department || existing.department,
      departmentCode: incoming.departmentCode || existing.departmentCode,
      position: incoming.position?.trim() || existing.position,
      employeeCategory: incoming.employeeCategory || existing.employeeCategory,
      employmentType: incoming.employmentType || existing.employmentType,
      reportingManager: incoming.reportingManager?.trim() || incoming.reportingTo?.trim() || existing.reportingManager || existing.reportingTo || '',
      reportingTo: incoming.reportingTo?.trim() || incoming.reportingManager?.trim() || existing.reportingTo || existing.reportingManager || '',
      branchLocation: incoming.branchLocation?.trim() || existing.branchLocation,
      workLocation: (incoming.workLocation !== undefined && incoming.workLocation.trim() !== '')
        ? incoming.workLocation.trim()
        : (existing.workLocation || ''),
      probationPeriod: (incoming.probationPeriod !== undefined && incoming.probationPeriod.trim() !== '')
        ? incoming.probationPeriod.trim()
        : (existing.probationPeriod || ''),
      previousEmployeeId: (incoming.previousEmployeeId !== undefined && incoming.previousEmployeeId.trim() !== '')
        ? incoming.previousEmployeeId.trim()
        : (existing.previousEmployeeId || ''),
      aadhaarNumber: (incoming.aadhaarNumber !== undefined && incoming.aadhaarNumber.trim() !== '')
        ? incoming.aadhaarNumber.trim()
        : (existing.aadhaarNumber || ''),
      panNumber: (incoming.panNumber !== undefined && incoming.panNumber.trim() !== '')
        ? incoming.panNumber.trim()
        : (existing.panNumber || ''),
      notes: (incoming.notes !== undefined && incoming.notes.trim() !== '')
        ? incoming.notes.trim()
        : (existing.notes || ''),
      emergencyContact: safeEmergencyContact,
      permanentAddress: safePermanentAddress,
      communicationAddress: safeCommunicationAddress,
      salary: safeSalary,
      bankPayroll: safeBankPayroll,
      systemAccess: safeSystemAccess,
      verification: safeVerification,
      documents: safeDocs,
      documentReferences: safeDocRefs,
      experiences: safeExperiences,
      qualifications: safeQualifications,
      familyMembers: safeFamilyMembers,
      profilePhoto: incoming.profilePhoto || existing.profilePhoto,
      updatedDate: new Date().toISOString().split('T')[0],
    };
  };

  /**
   * Explicit form validation handler for Staff Save:
   * Validates required data points before allowing a save operation.
   */
  const validateStaffFormData = (
    staffData: Partial<StaffMember>,
    isEdit: boolean
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!staffData.fullName || !staffData.fullName.trim()) {
      errors.push('Full Name is required and cannot be empty.');
    }
    if (!staffData.id && !staffData.staffCode) {
      errors.push('Employee ID is required.');
    }
    if (!staffData.department || !staffData.department.trim()) {
      errors.push('Department selection is required.');
    }
    if (!staffData.branchLocation || !staffData.branchLocation.trim()) {
      errors.push('Branch Location is required.');
    }

    if (staffData.email && staffData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffData.email.trim())) {
        errors.push('Official Email format is invalid.');
      }
    }

    if (staffData.personalEmail && staffData.personalEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(staffData.personalEmail.trim())) {
        errors.push('Personal Email format is invalid.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Main save handler for Staff Edit & Add:
   * Performs explicit validation, null-checks, and safely invokes onSaveStaff.
   */
  const handleSaveStaffFromModal = (staffData: Partial<StaffMember>) => {
    const isEdit = !!staffToEdit || staff.some((s) => s.id === staffData.id || s.staffCode === staffData.staffCode);
    const existing = staffToEdit || staff.find((s) => s.id === staffData.id || s.staffCode === staffData.staffCode);

    // 1. Explicit Form Validation
    const validation = validateStaffFormData(staffData, isEdit);
    if (!validation.isValid) {
      setEditValidationErrors(validation.errors);
      setTimeout(() => setEditValidationErrors(null), 6000);
      return false;
    }

    // 2. Explicit Null-Check & Default Fallback Guard for Edit Mode
    let finalPayload: Partial<StaffMember> = staffData;
    if (isEdit && existing) {
      finalPayload = reconcileStaffEditData(existing, staffData);
    }

    // 3. Clear errors, save and provide positive feedback
    setEditValidationErrors(null);
    onSaveStaff(finalPayload);
    setIsAddStaffOpen(false);
    setStaffToEdit(null);
    if (onClearPrefillStaffData) onClearPrefillStaffData();

    if (selectedStaffForView && (selectedStaffForView.id === finalPayload.id || selectedStaffForView.staffCode === finalPayload.staffCode)) {
      setSelectedStaffForView(finalPayload as StaffMember);
    }

    setSaveSuccessFeedback(
      `Staff profile for "${finalPayload.fullName}" (${finalPayload.staffCode || finalPayload.id}) was successfully ${isEdit ? 'updated' : 'created'} with verified data integrity.`
    );
    setTimeout(() => setSaveSuccessFeedback(null), 4000);
    return true;
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
      {/* FEEDBACK NOTICE */}
      {deleteFeedback && (
        <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-xs font-bold text-rose-900 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{deleteFeedback}</span>
        </div>
      )}

      {/* FORM VALIDATION ERRORS BANNER */}
      {editValidationErrors && editValidationErrors.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-900 animate-in fade-in space-y-1.5 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Staff Form Validation Failed: Please correct the following issues before saving</span>
          </div>
          <ul className="list-disc pl-6 space-y-0.5 text-[11px] text-rose-700 font-medium">
            {editValidationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* SAVE SUCCESS NOTICE */}
      {saveSuccessFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center space-x-2 animate-in fade-in shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessFeedback}</span>
        </div>
      )}

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
            title="Manage Department Master Table: Code, Name, Reporting Manager and Menu Permissions"
          >
            <Building className="w-4 h-4 text-emerald-700" />
            <span>Department Master</span>
          </button>

          <button
            type="button"
            onClick={() => setIsBranchMasterModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border border-slate-300"
            title="Manage Branch / Location Master Table"
          >
            <MapPin className="w-4 h-4 text-emerald-700" />
            <span>Branch Master</span>
          </button>

          {onNavigateToHrConfiguration && (
            <button
              type="button"
              onClick={onNavigateToHrConfiguration}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#EAF7EF] hover:bg-[#D4EFE0] text-[#0B5D2A] rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer border border-emerald-300"
              title="Configure Department Access Control Matrix in HR Configuration"
            >
              <ShieldCheck className="w-4 h-4 text-[#168A45]" />
              <span>Access Control Matrix</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadCsvReport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer border border-slate-300"
            title="Download CSV Report of current staff directory including auto-generated Employee IDs"
          >
            <Download className="w-4 h-4 text-[#168A45]" />
            <span>Download Report</span>
          </button>

          {canEntryOption ? (
            <button
              onClick={handleOpenAddStaff}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New / Onboard Staff</span>
            </button>
          ) : (
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200"
              title="Entry Only checkbox is not ticked for this menu"
            >
              Add New Disabled
            </span>
          )}
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
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 px-4 text-slate-500">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-700">No staff members in directory</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Click "+ Add New / Onboard Staff" to add staff members to your organization.
                    </p>
                  </td>
                </tr>
              )}
              {filteredStaff.map((staffMember) => (
                <tr key={staffMember.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-emerald-200/70">
                        {staffMember.profilePhoto ? (
                          <img
                            src={staffMember.profilePhoto}
                            alt={staffMember.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          staffMember.fullName.charAt(0)
                        )}
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
                    {staffMember.branchLocation && (
                      <div className="text-[10px] text-emerald-800 font-semibold flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span className="truncate max-w-[160px]">{staffMember.branchLocation}</span>
                      </div>
                    )}
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
                      {canEditOption && (
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
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {canViewOption && (
                        <button
                          onClick={() => {
                            setSelectedStaffForView(staffMember);
                            setActiveProfileTab('profile');
                          }}
                          title="View Full Profile"
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      )}
                      {canEditOption && (
                        <button
                          onClick={() => handleEditStaff(staffMember)}
                          title="Edit Staff Member"
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer border border-amber-200/60 inline-flex items-center gap-1 font-bold text-[11px]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedStaffForIdCard(staffMember)}
                        title="Print Staff ID Card"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B5D2A] rounded-lg transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                      </button>
                      {canDeleteOption && (
                        <button
                          onClick={() => setStaffToDelete(staffMember)}
                          title="Delete Staff"
                          className="px-2 py-1 hover:bg-rose-50 text-rose-600 border border-rose-200/70 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 font-bold text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
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
                      {selectedStaffForView.employeeCategory || 'Operations & Admin'}
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
                  {/* Direct Profile Photo Upload inside Staff Profile View */}
                  <div className="bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
                    <ProfilePhotoUploader
                      currentAvatar={selectedStaffForView.profilePhoto}
                      userName={selectedStaffForView.fullName}
                      onAvatarChange={(newPhotoUrl) => {
                        const updated = { ...selectedStaffForView, profilePhoto: newPhotoUrl };
                        setSelectedStaffForView(updated);
                        onSaveStaff(updated);
                      }}
                      onAvatarRemove={() => {
                        const updated = { ...selectedStaffForView, profilePhoto: '' };
                        setSelectedStaffForView(updated);
                        onSaveStaff(updated);
                      }}
                      label="Staff Profile Photo"
                      description="Upload a photo from your device, choose a preset, or paste an image URL."
                      size="md"
                    />
                  </div>

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
                      <div className="font-semibold text-slate-800">{selectedStaffForView.workLocation || 'Kochi Corporate HQ'}</div>
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
                  <span className="font-bold text-slate-800">Educational & Professional Qualifications</span>
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
                  <span className="font-bold text-slate-800">Family Contacts & Company Dependents</span>
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

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div>
                        <div className="font-bold text-slate-800 mb-2">Deductions Breakdown</div>
                        <div className="space-y-1.5">
                          {selectedStaffForView.salary.deductionItems && selectedStaffForView.salary.deductionItems.length > 0 ? (
                            selectedStaffForView.salary.deductionItems.map((item, i) => (
                              <div key={i} className="flex justify-between text-[11px] text-rose-700">
                                <span>• {item.name}:</span>
                                <span className="font-semibold text-rose-800">₹{item.amount.toLocaleString('en-IN')}</span>
                              </div>
                            ))
                          ) : (
                            <>
                              <div className="flex justify-between">
                                <span className="text-slate-500">PF Deduction:</span>
                                <span className="font-semibold text-rose-700">
                                  ₹{(selectedStaffForView.salary.pfDeduction || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Tax / PT Deduction:</span>
                                <span className="font-semibold text-rose-700">
                                  ₹{(selectedStaffForView.salary.taxDeduction || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                              {(selectedStaffForView.salary.otherDeductions || 0) > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Other Deductions:</span>
                                  <span className="font-semibold text-rose-700">
                                    ₹{(selectedStaffForView.salary.otherDeductions || 0).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="flex justify-between pt-1.5 border-t border-slate-200 font-bold text-rose-800">
                            <span>Total Deductions:</span>
                            <span>₹{(selectedStaffForView.salary.totalDeductions || 0).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <div className="font-bold text-slate-800 mb-2">Bank &amp; Statutory Details</div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Bank:</span>
                            <span className="font-semibold text-slate-800">
                              {selectedStaffForView.salary?.bankDetails?.bankName || selectedStaffForView.bankPayroll?.bankName || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account:</span>
                            <span className="font-semibold text-slate-800 font-mono">
                              {selectedStaffForView.salary?.bankDetails?.accountNo || selectedStaffForView.bankPayroll?.accountNo || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">IFSC &amp; Branch:</span>
                            <span className="font-semibold text-slate-800">
                              {selectedStaffForView.salary?.bankDetails?.ifscCode || selectedStaffForView.bankPayroll?.ifscCode || '—'}
                              {selectedStaffForView.salary?.bankDetails?.branch || selectedStaffForView.bankPayroll?.branch ? ` (${selectedStaffForView.salary?.bankDetails?.branch || selectedStaffForView.bankPayroll?.branch})` : ''}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">UAN / PF:</span>
                            <span className="font-semibold text-slate-800 font-mono text-[10px]">
                              {selectedStaffForView.bankPayroll?.uan || '—'} / {selectedStaffForView.bankPayroll?.pfNumber || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">ESI / PAN:</span>
                            <span className="font-semibold text-slate-800 font-mono text-[10px]">
                              {selectedStaffForView.bankPayroll?.esiNumber || '—'} / {selectedStaffForView.panNumber || '—'}
                            </span>
                          </div>
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
                    Comprehensive annual and quarterly project execution effectiveness assessment, client delivery record logs,
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
                          ? 'This staff member is marked as Active. Associated ERP login credentials are authenticated and valid for all assigned company modules.'
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
                              'Staff'}
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
                <h3 className="font-bold text-slate-900 text-sm">Staff Company ID Badge</h3>
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

      {/* MODAL: DEPARTMENT MASTER TABLE WITH MENU ACCESS SELECTION */}
      {isDeptMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
            <div className="overflow-y-auto p-4 sm:p-6">
              <DepartmentMasterTable
                isModal={true}
                onClose={() => {
                  setIsDeptMasterModalOpen(false);
                  setDepartmentsList(hrStorage.getDepartmentsMaster());
                }}
                onNavigateToStaff={() => setIsDeptMasterModalOpen(false)}
                onNavigateToConfiguration={() => {
                  setIsDeptMasterModalOpen(false);
                  if (onNavigateToHrConfiguration) onNavigateToHrConfiguration();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BRANCH / LOCATION MASTER TABLE */}
      {isBranchMasterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
            <div className="overflow-y-auto p-4 sm:p-6">
              <BranchMasterTable
                isModal={true}
                onClose={() => setIsBranchMasterModalOpen(false)}
              />
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
          if (onClearPrefillStaffData) onClearPrefillStaffData();
        }}
        onSave={(staffData) => {
          handleSaveStaffFromModal(staffData);
        }}
        existingStaffCount={staff.length}
        staffToEdit={staffToEdit}
        prefillStaffData={prefillStaffData}
      />
      {/* MODAL: IN-APP CONFIRMATION DIALOG FOR STAFF DELETION */}
      {staffToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-rose-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-extrabold text-base">Confirm Staff Deletion</h3>
              </div>
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-[#0B5D2A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {staffToDelete.fullName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{staffToDelete.fullName}</h4>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: <b>{staffToDelete.staffCode || staffToDelete.id}</b> • {staffToDelete.department} ({staffToDelete.position})
                  </div>
                </div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <div className="font-bold text-xs flex items-center space-x-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Permanent Record Removal</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Are you sure you want to delete this staff member? This will permanently remove them from the Staff Directory, revoke their ERP system access login credentials, and clean up their cloud records.
                </p>
              </div>

              <p className="text-[11px] text-slate-400">
                This action cannot be undone. Active employee ID sequence continuity will be preserved.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setStaffToDelete(null)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteStaff}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete Staff</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
