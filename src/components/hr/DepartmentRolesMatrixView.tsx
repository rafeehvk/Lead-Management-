import React, { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  RotateCcw,
  Users,
  Award,
  ChevronRight,
  Sparkles,
  Info,
  BadgeCheck,
  Sliders,
  CalendarCheck,
  FileCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Eye,
} from 'lucide-react';
import { DepartmentMaster, DepartmentRole } from '../../types/hr';
import { hrStorage } from '../../services/hrStorageService';
import { SIDE_MENU_DEFINITIONS, SIDE_MENU_CATEGORIES } from '../../utils/menuPermissions';

const DEFAULT_DEPARTMENT_ROLES: DepartmentRole[] = [
  // Academic (101)
  {
    id: 'ROLE-101-01',
    departmentCode: '101',
    departmentName: 'Academic',
    roleTitle: 'Principal & Academic Director',
    accessLevel: 'Super Admin (Full Control)',
    reportingTo: 'Managing Director / Board of Trustees',
    description: 'Executive academic leadership, institutional accreditation, and final faculty evaluations.',
    keyResponsibilities: [
      'Institutional leadership & academic governance',
      'Final faculty evaluations & appointment sign-off',
      'Curriculum quality assurance and board compliance',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: true,
      canAccessPayroll: true,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 1,
  },
  {
    id: 'ROLE-101-02',
    departmentCode: '101',
    departmentName: 'Academic',
    roleTitle: 'Vice Principal & Academic Dean',
    accessLevel: 'Department Manager',
    reportingTo: 'Principal & Academic Director',
    description: 'Supervises academic timetable, instructional delivery, and faculty mentoring.',
    keyResponsibilities: [
      'Academic schedule & lecture timetable administration',
      'Faculty performance review & mentorship',
      'Student examination council oversight',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 2,
  },
  {
    id: 'ROLE-101-03',
    departmentCode: '101',
    departmentName: 'Academic',
    roleTitle: 'Professor & Head of Department (HOD)',
    accessLevel: 'Department Manager',
    reportingTo: 'Vice Principal & Academic Dean',
    description: 'Leads department curriculum, faculty workload allocation, and student evaluations.',
    keyResponsibilities: [
      'Course syllabus delivery & pedagogical standards',
      'Department faculty leave and attendance oversight',
      'Applicant interview evaluations for department vacancies',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: true,
      canApproveRequisitions: false,
    },
    headcount: 6,
  },
  {
    id: 'ROLE-101-04',
    departmentCode: '101',
    departmentName: 'Academic',
    roleTitle: 'Associate Professor / Faculty Member',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Professor & Head of Department (HOD)',
    description: 'Classroom instruction, digital attendance logging, and student mentoring.',
    keyResponsibilities: [
      'Conduct scheduled classroom lectures & laboratory practicals',
      'Maintain daily biometric attendance & lesson plans',
      'Student assignment assessments & progress reporting',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 28,
  },
  {
    id: 'ROLE-101-05',
    departmentCode: '101',
    departmentName: 'Academic',
    roleTitle: 'Laboratory & Workshop Instructor',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Professor & Head of Department (HOD)',
    description: 'Instructional lab sessions, technical apparatus safety, and consumable stock tracking.',
    keyResponsibilities: [
      'Operate instructional apparatus & safety protocols',
      'Assist students with laboratory experiments',
      'Report equipment maintenance needs to IT/Facilities',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 8,
  },

  // Administration (102)
  {
    id: 'ROLE-102-01',
    departmentCode: '102',
    departmentName: 'Administration',
    roleTitle: 'Managing Director / Corporate Trustee',
    accessLevel: 'Super Admin (Full Control)',
    reportingTo: 'Board of Governors',
    description: 'Overarching institutional governance, major capital approvals, and legal signing authority.',
    keyResponsibilities: [
      'Strategic corporate direction & campus expansions',
      'Institutional budget authorization & financial oversight',
      'Legal decrees, executive policies, and regulatory sign-off',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: true,
      canAccessPayroll: true,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 1,
  },
  {
    id: 'ROLE-102-02',
    departmentCode: '102',
    departmentName: 'Administration',
    roleTitle: 'Campus Administrator',
    accessLevel: 'Department Manager',
    reportingTo: 'Managing Director',
    description: 'Oversees campus daily operations, statutory document renewals, and cross-departmental coordination.',
    keyResponsibilities: [
      'Campus facilities coordination & security monitoring',
      'Statutory compliance filing with local municipal authorities',
      'Administrative material requisitions & approvals',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 2,
  },
  {
    id: 'ROLE-102-03',
    departmentCode: '102',
    departmentName: 'Administration',
    roleTitle: 'Executive Office Assistant',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Campus Administrator',
    description: 'Inward/outward dispatch, student enquiries, and institutional record filing.',
    keyResponsibilities: [
      'Front office reception & parent inquiry handling',
      'Government circular inward logs & archival',
      'Student certificate issuance logistics',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 5,
  },

  // Finance & Accounts (103)
  {
    id: 'ROLE-103-01',
    departmentCode: '103',
    departmentName: 'Finance & Accounts',
    roleTitle: 'Chief Financial Officer (CFO)',
    accessLevel: 'Department Manager',
    reportingTo: 'Managing Director',
    description: 'Institutional financial health, annual budget planning, and statutory tax audits.',
    keyResponsibilities: [
      'Fiscal budgeting, fund allocation, and cashflow management',
      'Payroll disbursement approval & statutory compliance (EPF/ESI)',
      'Statutory audit reports and financial statements sign-off',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: false,
      canAccessPayroll: true,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 1,
  },
  {
    id: 'ROLE-103-02',
    departmentCode: '103',
    departmentName: 'Finance & Accounts',
    roleTitle: 'Senior Accountant & Payroll Officer',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Chief Financial Officer (CFO)',
    description: 'Monthly payroll computation, bank reconciliations, and supplier voucher payments.',
    keyResponsibilities: [
      'Compute monthly staff payroll, deductions, and payslips',
      'Bank statement reconciliations & journal voucher entries',
      'Vendor invoice verification & TDS deductions',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: true,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 3,
  },
  {
    id: 'ROLE-103-03',
    departmentCode: '103',
    departmentName: 'Finance & Accounts',
    roleTitle: 'Internal Auditor & Compliance Analyst',
    accessLevel: 'View Only (Read-Only)',
    reportingTo: 'Chief Financial Officer (CFO)',
    description: 'Audits transaction journals, fee receipts, and inventory asset registers.',
    keyResponsibilities: [
      'Independent audit of financial journals and vouchers',
      'Review fee collection reports & arrears balances',
      'Inspect procurement purchase orders and GRN matches',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: true,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 1,
  },

  // Human Resources (104)
  {
    id: 'ROLE-104-01',
    departmentCode: '104',
    departmentName: 'Human Resources',
    roleTitle: 'Head of Human Resources / HR Director',
    accessLevel: 'Super Admin (Full Control)',
    reportingTo: 'Managing Director',
    description: 'Talent recruitment, employee relations, compensation slabs, and HR policy enforcement.',
    keyResponsibilities: [
      'Oversee institution-wide hiring campaigns & talent pipelines',
      'Issue and authorize Offer Letters & Appointment Letters',
      'Formulate leave rules, appraisal benchmarks, and salary structures',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: true,
      canAccessPayroll: true,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 1,
  },
  {
    id: 'ROLE-104-02',
    departmentCode: '104',
    departmentName: 'Human Resources',
    roleTitle: 'Recruitment & Onboarding Specialist',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Head of Human Resources',
    description: 'Candidate screening, interview panel coordination, offer generation, and onboarding paperwork.',
    keyResponsibilities: [
      'Screen applicant resumes & maintain talent database',
      'Schedule interview panels and coordinate applicant evaluations',
      'Prepare draft offer letters and appointment packages',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: true,
      canIssueLetters: true,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 2,
  },
  {
    id: 'ROLE-104-03',
    departmentCode: '104',
    departmentName: 'Human Resources',
    roleTitle: 'HR Operations & Welfare Executive',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Head of Human Resources',
    description: 'Biometric shift tracking, leave balance verification, digital ID cards, and PF/ESI compliance.',
    keyResponsibilities: [
      'Monitor daily biometric attendance & shift hours',
      'Process staff leave applications and calculate LOP days',
      'Generate digital staff ID cards and maintain personal files',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: true,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 2,
  },

  // Engineering & IT (105)
  {
    id: 'ROLE-105-01',
    departmentCode: '105',
    departmentName: 'Engineering & IT',
    roleTitle: 'IT Director & Systems Architect',
    accessLevel: 'Super Admin (Full Control)',
    reportingTo: 'Managing Director',
    description: 'ERP portal administration, database integrity, campus networking, and cloud services.',
    keyResponsibilities: [
      'Manage MYSAR ERP software, permissions, and database sync',
      'Oversee campus firewall, Wi-Fi network, and server hardware',
      'IT hardware procurement recommendations & vendor SLAs',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 1,
  },
  {
    id: 'ROLE-105-02',
    departmentCode: '105',
    departmentName: 'Engineering & IT',
    roleTitle: 'Systems & Network Engineer',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'IT Director & Systems Architect',
    description: 'Campus LAN/WAN support, staff workstations, printer maintenance, and classroom smartboards.',
    keyResponsibilities: [
      'Troubleshoot staff computer hardware and operating systems',
      'Manage classroom smart displays, projectors, and audio systems',
      'Perform scheduled data backups & antivirus updates',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 3,
  },

  // Sales & Marketing (106)
  {
    id: 'ROLE-106-01',
    departmentCode: '106',
    departmentName: 'Sales & Marketing',
    roleTitle: 'Head of Admissions & Institutional Growth',
    accessLevel: 'Department Manager',
    reportingTo: 'Managing Director',
    description: 'Admissions growth strategy, institutional partner tie-ups, and lead conversion targets.',
    keyResponsibilities: [
      'Drive student admissions campaigns and enrollment funnels',
      'Manage lead allocation to admissions counselors',
      'Approve fee quotations, concessions, and institutional proposals',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: true,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 1,
  },
  {
    id: 'ROLE-106-02',
    departmentCode: '106',
    departmentName: 'Sales & Marketing',
    roleTitle: 'Senior Admissions Counselor / Sales Rep',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Head of Admissions',
    description: 'Lead engagement, parent counseling, campus tours, and admission enrollment.',
    keyResponsibilities: [
      'Follow up on prospective leads via phone, email, and campus visits',
      'Conduct institutional presentation tours and counseling sessions',
      'Convert qualified leads and issue fee quotation proposals',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 6,
  },

  // Campus Operations (107)
  {
    id: 'ROLE-107-01',
    departmentCode: '107',
    departmentName: 'Campus Operations',
    roleTitle: 'Facilities & Estate Manager',
    accessLevel: 'Department Manager',
    reportingTo: 'Managing Director',
    description: 'Campus estate maintenance, electrical utilities, transport fleet, and physical security.',
    keyResponsibilities: [
      'Campus physical infrastructure, civil repairs, and sanitation',
      'Supervise institutional transport fleet, routes, and drivers',
      'Manage security personnel schedules & physical campus safety',
    ],
    capabilities: {
      canApproveLeaves: true,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: true,
      canApproveRequisitions: true,
    },
    headcount: 1,
  },
  {
    id: 'ROLE-107-02',
    departmentCode: '107',
    departmentName: 'Campus Operations',
    roleTitle: 'Procurement & Storekeeper',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Facilities & Estate Manager',
    description: 'Receives materials, issues store requisitions, and manages physical inventory.',
    keyResponsibilities: [
      'Inspect incoming materials against purchase orders (GRN)',
      'Store inventory binning & issuance to teaching departments',
      'Initiate replenishment purchase requisitions for low stock items',
    ],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 2,
  },
];

const STORAGE_ROLES_KEY = 'mysar_department_roles_matrix_v1';

interface DepartmentRolesMatrixViewProps {
  onResetData?: () => void;
}

export const DepartmentRolesMatrixView: React.FC<DepartmentRolesMatrixViewProps> = ({
  onResetData,
}) => {
  // Departments state
  const [departments, setDepartments] = useState<DepartmentMaster[]>(() =>
    hrStorage.getDepartmentsMaster()
  );

  // Roles state
  const [roles, setRoles] = useState<DepartmentRole[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ROLES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading roles matrix', e);
    }
    return DEFAULT_DEPARTMENT_ROLES;
  });

  // Filter & Search
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<DepartmentRole | null>(null);

  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentMaster | null>(null);

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  const showFeedback = (text: string, type: 'success' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Persist roles whenever updated
  const saveRolesList = (updated: DepartmentRole[]) => {
    setRoles(updated);
    try {
      localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed saving roles', e);
    }
  };

  // Role Menu Access Modal State
  const [viewingRoleForPermissions, setViewingRoleForPermissions] = useState<DepartmentRole | null>(null);
  const [roleMenuPermissions, setRoleMenuPermissions] = useState<
    Record<string, { view: boolean; entry: boolean; edit: boolean; delete: boolean }>
  >({});
  const [roleModalSearch, setRoleModalSearch] = useState('');
  const [roleModalCategory, setRoleModalCategory] = useState('All');
  const [rolePermSaveSuccess, setRolePermSaveSuccess] = useState(false);

  const handleOpenRolePermissionsModal = (role: DepartmentRole) => {
    const initialPerms: Record<string, { view: boolean; entry: boolean; edit: boolean; delete: boolean }> = {};
    const isSuperAdmin = role.accessLevel.includes('Super Admin');
    const isManager = role.accessLevel.includes('Manager');
    const isViewOnly = role.accessLevel.includes('View Only');

    SIDE_MENU_DEFINITIONS.forEach((item) => {
      if (role.menuPermissions && role.menuPermissions[item.id]) {
        initialPerms[item.id] = { ...role.menuPermissions[item.id] };
      } else if (isSuperAdmin) {
        initialPerms[item.id] = { view: true, entry: true, edit: true, delete: true };
      } else if (isViewOnly) {
        initialPerms[item.id] = { view: true, entry: false, edit: false, delete: false };
      } else if (isManager) {
        const isSensitive = item.category === 'Settings & Administration';
        initialPerms[item.id] = {
          view: true,
          entry: !isSensitive,
          edit: !isSensitive,
          delete: item.id.includes('leads') || item.id.includes('followups'),
        };
      } else {
        const isAllowedDept =
          role.departmentName.toLowerCase().includes('academic')
            ? item.category.includes('HR') || item.id === 'dashboard'
            : role.departmentName.toLowerCase().includes('finance')
            ? item.category.includes('Finance') || item.category.includes('Sales') || item.id === 'dashboard'
            : true;

        initialPerms[item.id] = {
          view: isAllowedDept,
          entry: isAllowedDept && !item.category.includes('Settings'),
          edit: isAllowedDept && !item.category.includes('Settings'),
          delete: false,
        };
      }
    });

    setRoleMenuPermissions(initialPerms);
    setRoleModalSearch('');
    setRoleModalCategory('All');
    setRolePermSaveSuccess(false);
    setViewingRoleForPermissions(role);
  };

  const handleToggleRolePermission = (
    menuId: string,
    field: 'view' | 'entry' | 'edit' | 'delete'
  ) => {
    setRoleMenuPermissions((prev) => {
      const current = prev[menuId] || { view: false, entry: false, edit: false, delete: false };
      const updated = { ...current, [field]: !current[field] };
      if ((field === 'entry' || field === 'edit' || field === 'delete') && updated[field]) {
        updated.view = true;
      }
      if (field === 'view' && !updated.view) {
        updated.entry = false;
        updated.edit = false;
        updated.delete = false;
      }
      return { ...prev, [menuId]: updated };
    });
  };

  const handleSaveRoleMenuPermissions = () => {
    if (!viewingRoleForPermissions) return;
    const updatedRole: DepartmentRole = {
      ...viewingRoleForPermissions,
      menuPermissions: roleMenuPermissions,
    };

    const updatedRoles = roles.map((r) =>
      r.id === updatedRole.id ? updatedRole : r
    );
    saveRolesList(updatedRoles);
    hrStorage.saveDepartmentRolePermissions(
      updatedRole.departmentCode,
      updatedRole.id,
      roleMenuPermissions
    );
    setViewingRoleForPermissions(updatedRole);
    setRolePermSaveSuccess(true);
    showFeedback(`Menu access permissions updated for ${updatedRole.roleTitle}`);
    setTimeout(() => {
      setViewingRoleForPermissions(null);
    }, 700);
  };

  // Form State for Role Modal
  const [roleForm, setRoleForm] = useState<Partial<DepartmentRole>>({
    roleTitle: '',
    departmentCode: '101',
    accessLevel: 'Operational (Entry & Edit)',
    reportingTo: 'Principal & Academic Director',
    description: '',
    keyResponsibilities: [],
    capabilities: {
      canApproveLeaves: false,
      canEvaluateInterviews: false,
      canIssueLetters: false,
      canAccessPayroll: false,
      canReviewKpi: false,
      canApproveRequisitions: false,
    },
    headcount: 1,
  });
  const [responsibilitiesInput, setResponsibilitiesInput] = useState('');

  // Form State for Department Modal
  const [deptForm, setDeptForm] = useState<Partial<DepartmentMaster>>({
    departmentCode: '',
    departmentName: '',
    headOfDepartment: '',
    reporting: '',
    description: '',
  });

  // Open Create Role Modal
  const handleOpenCreateRole = () => {
    setEditingRole(null);
    const defaultDept = departments[0] || { departmentCode: '101', departmentName: 'Academic' };
    setRoleForm({
      roleTitle: '',
      departmentCode: defaultDept.departmentCode,
      departmentName: defaultDept.departmentName,
      accessLevel: 'Operational (Entry & Edit)',
      reportingTo: defaultDept.reporting || 'Managing Director',
      description: '',
      keyResponsibilities: [],
      capabilities: {
        canApproveLeaves: false,
        canEvaluateInterviews: false,
        canIssueLetters: false,
        canAccessPayroll: false,
        canReviewKpi: false,
        canApproveRequisitions: false,
      },
      headcount: 1,
    });
    setResponsibilitiesInput('');
    setIsRoleModalOpen(true);
  };

  // Open Edit Role Modal
  const handleOpenEditRole = (r: DepartmentRole) => {
    setEditingRole(r);
    setRoleForm({ ...r });
    setResponsibilitiesInput(r.keyResponsibilities.join('\n'));
    setIsRoleModalOpen(true);
  };

  // Save Role
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.roleTitle?.trim()) return;

    const targetDept = departments.find((d) => d.departmentCode === roleForm.departmentCode);
    const deptName = targetDept?.departmentName || roleForm.departmentName || 'General';

    const respLines = responsibilitiesInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (editingRole) {
      const updated: DepartmentRole = {
        ...editingRole,
        ...roleForm,
        departmentName: deptName,
        keyResponsibilities: respLines.length > 0 ? respLines : editingRole.keyResponsibilities,
        capabilities: roleForm.capabilities || editingRole.capabilities,
      } as DepartmentRole;

      const nextRoles = roles.map((r) => (r.id === editingRole.id ? updated : r));
      saveRolesList(nextRoles);
      showFeedback(`Role "${updated.roleTitle}" updated successfully.`);
    } else {
      const newId = `ROLE-${roleForm.departmentCode}-${String(roles.length + 1).padStart(2, '0')}`;
      const created: DepartmentRole = {
        id: newId,
        departmentCode: roleForm.departmentCode || '101',
        departmentName: deptName,
        roleTitle: roleForm.roleTitle.trim(),
        accessLevel: roleForm.accessLevel || 'Operational (Entry & Edit)',
        reportingTo: roleForm.reportingTo?.trim() || 'Managing Director',
        description: roleForm.description?.trim() || 'Institutional departmental role.',
        keyResponsibilities:
          respLines.length > 0
            ? respLines
            : ['Deliver core departmental assignments and operations.'],
        capabilities: roleForm.capabilities || {
          canApproveLeaves: false,
          canEvaluateInterviews: false,
          canIssueLetters: false,
          canAccessPayroll: false,
          canReviewKpi: false,
          canApproveRequisitions: false,
        },
        headcount: Number(roleForm.headcount) || 1,
      };

      const nextRoles = [created, ...roles];
      saveRolesList(nextRoles);
      showFeedback(`New Role "${created.roleTitle}" defined for ${created.departmentName}.`);
    }

    setIsRoleModalOpen(false);
  };

  // Delete Role
  const handleDeleteRole = (roleId: string, roleTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the role "${roleTitle}"?`)) {
      const filtered = roles.filter((r) => r.id !== roleId);
      saveRolesList(filtered);
      showFeedback(`Role "${roleTitle}" removed.`, 'info');
    }
  };

  // Open Create Department Modal
  const handleOpenCreateDept = () => {
    setEditingDept(null);
    setDeptForm({
      departmentCode: String(100 + departments.length + 1),
      departmentName: '',
      headOfDepartment: '',
      reporting: 'Managing Director',
      description: '',
    });
    setIsDeptModalOpen(true);
  };

  // Open Edit Department Modal
  const handleOpenEditDept = (dept: DepartmentMaster) => {
    setEditingDept(dept);
    setDeptForm({ ...dept });
    setIsDeptModalOpen(true);
  };

  // Save Department
  const handleSaveDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.departmentName?.trim()) return;

    const saved = hrStorage.saveDepartment({
      ...deptForm,
      id: editingDept?.id,
    });

    const refreshed = hrStorage.getDepartmentsMaster();
    setDepartments(refreshed);

    // If department code changed, sync roles
    if (editingDept && editingDept.departmentCode !== saved.departmentCode) {
      const updatedRoles = roles.map((r) =>
        r.departmentCode === editingDept.departmentCode
          ? { ...r, departmentCode: saved.departmentCode, departmentName: saved.departmentName }
          : r
      );
      saveRolesList(updatedRoles);
    }

    setIsDeptModalOpen(false);
    showFeedback(`Department "${saved.departmentName}" saved.`);
  };

  // Delete Department
  const handleDeleteDept = (dept: DepartmentMaster) => {
    const rolesInDept = roles.filter((r) => r.departmentCode === dept.departmentCode);
    if (rolesInDept.length > 0) {
      alert(
        `Cannot delete department "${dept.departmentName}" because it has ${rolesInDept.length} defined roles. Reassign or delete those roles first.`
      );
      return;
    }

    if (window.confirm(`Delete department "${dept.departmentName}"?`)) {
      hrStorage.deleteDepartment(dept.id);
      setDepartments(hrStorage.getDepartmentsMaster());
      if (selectedDeptFilter === dept.departmentCode) {
        setSelectedDeptFilter('All');
      }
      showFeedback(`Department "${dept.departmentName}" deleted.`, 'info');
    }
  };

  // Reset to default roles
  const handleResetToDefaults = () => {
    if (
      window.confirm(
        'Reset all defined Department Roles back to standard institutional defaults?'
      )
    ) {
      saveRolesList(DEFAULT_DEPARTMENT_ROLES);
      showFeedback('Reset department roles matrix to institutional defaults.');
    }
  };

  // Filtered Roles
  const filteredRoles = roles.filter((r) => {
    const matchesDept =
      selectedDeptFilter === 'All' || r.departmentCode === selectedDeptFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      r.roleTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reportingTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.keyResponsibilities.some((duty) => duty.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDept && matchesSearch;
  });

  // Calculate summary metrics
  const totalRolesCount = roles.length;
  const adminRolesCount = roles.filter((r) => r.accessLevel.includes('Super Admin')).length;
  const managerRolesCount = roles.filter((r) => r.accessLevel.includes('Manager')).length;
  const operationalRolesCount = roles.filter((r) => r.accessLevel.includes('Operational')).length;

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#168A45]" />
            <span>Institutional Department & Roles Definition Matrix</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Define organizational departments, establish role titles, authority limits, reporting structures, and access boundaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreateDept}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Department</span>
          </button>
          <button
            type="button"
            onClick={handleOpenCreateRole}
            className="px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold rounded-xl text-xs flex items-center space-x-1.5 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Define New Role</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK BANNER */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-xl border text-xs font-bold flex items-center space-x-2 animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Departments</div>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">{departments.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active institutional units</div>
        </div>

        <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-[#0B5D2A]">Defined Roles</div>
          <div className="text-xl font-extrabold text-[#0B5D2A] mt-0.5">{totalRolesCount}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Designations configured</div>
        </div>

        <div className="bg-teal-50/50 border border-teal-200/70 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-teal-800">Management & Leads</div>
          <div className="text-xl font-extrabold text-teal-900 mt-0.5">
            {adminRolesCount + managerRolesCount}
          </div>
          <div className="text-[10px] text-teal-700 mt-0.5">Super Admin & Dept Managers</div>
        </div>

        <div className="bg-blue-50/50 border border-blue-200/70 rounded-xl p-3 shadow-2xs">
          <div className="text-[10px] font-bold uppercase text-blue-800">Operational Roles</div>
          <div className="text-xl font-extrabold text-blue-900 mt-0.5">
            {operationalRolesCount}
          </div>
          <div className="text-[10px] text-blue-700 mt-0.5">Faculty, support & staff</div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Department Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold">
            <button
              onClick={() => setSelectedDeptFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                selectedDeptFilter === 'All'
                  ? 'bg-[#168A45] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Departments ({roles.length})
            </button>
            {departments.map((d) => {
              const count = roles.filter((r) => r.departmentCode === d.departmentCode).length;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDeptFilter(d.departmentCode)}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center space-x-1.5 ${
                    selectedDeptFilter === d.departmentCode
                      ? 'bg-[#168A45] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75">{d.departmentCode}</span>
                  <span>{d.departmentName}</span>
                  <span
                    className={`text-[9px] px-1 rounded-full ${
                      selectedDeptFilter === d.departmentCode
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles, responsibilities, reporting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7FAF8] border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* If a specific department is selected, show Department Details bar */}
        {selectedDeptFilter !== 'All' && (
          (() => {
            const currentDept = departments.find((d) => d.departmentCode === selectedDeptFilter);
            if (!currentDept) return null;
            return (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fadeIn">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {currentDept.departmentName}
                    </span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-600">
                      Code: {currentDept.departmentCode}
                    </span>
                    {currentDept.headOfDepartment && (
                      <span className="text-slate-600 text-[11px]">
                        • Head: <strong>{currentDept.headOfDepartment}</strong>
                      </span>
                    )}
                  </div>
                  {currentDept.description && (
                    <p className="text-slate-500 text-[11px] leading-relaxed">
                      {currentDept.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenEditDept(currentDept)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded border border-slate-200 transition-colors"
                    title="Edit department details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDept(currentDept)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded border border-slate-200 transition-colors"
                    title="Delete department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* ROLES MATRIX LIST */}
      <div className="space-y-3">
        {filteredRoles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            No roles defined matching the current filter.
            <div className="mt-2">
              <button
                onClick={handleOpenCreateRole}
                className="text-[#168A45] font-bold hover:underline"
              >
                + Define a new role in this department
              </button>
            </div>
          </div>
        ) : (
          filteredRoles.map((role) => {
            const isSuperAdmin = role.accessLevel.includes('Super Admin');
            const isManager = role.accessLevel.includes('Manager');

            return (
              <div
                key={role.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-4 shadow-2xs transition-all space-y-3"
              >
                {/* Role Top Row: Title, Badges, Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start sm:items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSuperAdmin
                          ? 'bg-emerald-100 text-[#0B5D2A] border border-emerald-300'
                          : isManager
                          ? 'bg-teal-100 text-teal-800 border border-teal-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-sm">
                          {role.roleTitle}
                        </h4>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {role.id}
                        </span>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                          Dept: {role.departmentName} ({role.departmentCode})
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isSuperAdmin
                              ? 'bg-emerald-50 text-[#0B5D2A] border-emerald-200'
                              : isManager
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {role.accessLevel}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenRolePermissionsModal(role)}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors text-[10px] font-bold cursor-pointer"
                          title="View & configure side menu access permissions for this role"
                        >
                          <Eye className="w-3 h-3 text-[#168A45]" />
                          <span>View Access</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>Reports to: <strong className="text-slate-700">{role.reportingTo}</strong></span>
                        {role.headcount !== undefined && (
                          <span>• Standard Headcount: <strong>{role.headcount}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleOpenRolePermissionsModal(role)}
                      className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                      title="View & configure side menu access (View, Entry, Edit, Delete)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditRole(role)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                      title="Edit role definition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id, role.roleTitle)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-slate-200"
                      title="Delete role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Scope & Description */}
                {role.description && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    {role.description}
                  </p>
                )}

                {/* Key Responsibilities */}
                {role.keyResponsibilities.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Key Institutional Responsibilities
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700">
                      {role.keyResponsibilities.map((resp, idx) => (
                        <li key={idx} className="flex items-start space-x-1.5">
                          <Check className="w-3 h-3 text-[#168A45] shrink-0 mt-0.5" />
                          <span>{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Permitted Institutional Capabilities Badges */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="font-bold text-slate-400 mr-1">Institutional Boundaries:</span>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-semibold border ${
                      role.capabilities.canApproveLeaves
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <CalendarCheck className="w-3 h-3" />
                    <span>Leave Approvals</span>
                  </span>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-semibold border ${
                      role.capabilities.canEvaluateInterviews
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>Interview Evaluations</span>
                  </span>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-semibold border ${
                      role.capabilities.canIssueLetters
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <FileCheck className="w-3 h-3" />
                    <span>Offer / Appt Issuance</span>
                  </span>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-semibold border ${
                      role.capabilities.canAccessPayroll
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Payroll Access</span>
                  </span>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-semibold border ${
                      role.capabilities.canReviewKpi
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    <span>KPI & Appraisals</span>
                  </span>

                  <span
                    className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded font-semibold border ${
                      role.capabilities.canApproveRequisitions
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Requisition Approval</span>
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER ACTIONS: RESET ROLES MATRIX & RESET DEMO DATA */}
      <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center space-x-1.5 px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Restore Standard Institutional Roles</span>
          </button>
        </div>

        {onResetData && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (window.confirm('Reset all HR data to demo defaults?')) {
                  onResetData();
                  window.location.reload();
                }
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT ROLE */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-[#168A45]" />
                <h3 className="font-extrabold text-sm">
                  {editingRole ? 'Edit Institutional Role' : 'Define New Department Role'}
                </h3>
              </div>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRole} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Role Title / Designation *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vice Principal & Academic Dean"
                  value={roleForm.roleTitle || ''}
                  onChange={(e) => setRoleForm({ ...roleForm, roleTitle: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department *</label>
                  <select
                    value={roleForm.departmentCode || '101'}
                    onChange={(e) => setRoleForm({ ...roleForm, departmentCode: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.departmentCode}>
                        {d.departmentCode} - {d.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Access Level *</label>
                  <select
                    value={roleForm.accessLevel || 'Operational (Entry & Edit)'}
                    onChange={(e) => setRoleForm({ ...roleForm, accessLevel: e.target.value as any })}
                    className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                  >
                    <option value="Super Admin (Full Control)">Super Admin (Full Control)</option>
                    <option value="Department Manager">Department Manager</option>
                    <option value="Operational (Entry & Edit)">Operational (Entry & Edit)</option>
                    <option value="View Only (Read-Only)">View Only (Read-Only)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Reporting Hierarchy</label>
                  <input
                    type="text"
                    placeholder="e.g. Principal & Academic Director"
                    value={roleForm.reportingTo || ''}
                    onChange={(e) => setRoleForm({ ...roleForm, reportingTo: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimated Headcount</label>
                  <input
                    type="number"
                    min={1}
                    value={roleForm.headcount || 1}
                    onChange={(e) => setRoleForm({ ...roleForm, headcount: Number(e.target.value) })}
                    className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Description / Scope</label>
                <textarea
                  rows={2}
                  placeholder="Summary of this role's purpose within the department..."
                  value={roleForm.description || ''}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Key Responsibilities (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Classroom syllabus delivery&#10;Mentoring assigned student batches&#10;Evaluating semester coursework"
                  value={responsibilitiesInput}
                  onChange={(e) => setResponsibilitiesInput(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              {/* Operational Capabilities Checkboxes */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block font-bold text-slate-800">
                  Permitted Authority & Operational Approvals
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!roleForm.capabilities?.canApproveLeaves}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          capabilities: {
                            ...(roleForm.capabilities || {
                              canApproveLeaves: false,
                              canEvaluateInterviews: false,
                              canIssueLetters: false,
                              canAccessPayroll: false,
                              canReviewKpi: false,
                              canApproveRequisitions: false,
                            }),
                            canApproveLeaves: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45]"
                    />
                    <span className="font-semibold text-slate-700">Can Approve Staff Leaves</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!roleForm.capabilities?.canEvaluateInterviews}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          capabilities: {
                            ...(roleForm.capabilities || {
                              canApproveLeaves: false,
                              canEvaluateInterviews: false,
                              canIssueLetters: false,
                              canAccessPayroll: false,
                              canReviewKpi: false,
                              canApproveRequisitions: false,
                            }),
                            canEvaluateInterviews: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45]"
                    />
                    <span className="font-semibold text-slate-700">Can Evaluate Candidates</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!roleForm.capabilities?.canIssueLetters}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          capabilities: {
                            ...(roleForm.capabilities || {
                              canApproveLeaves: false,
                              canEvaluateInterviews: false,
                              canIssueLetters: false,
                              canAccessPayroll: false,
                              canReviewKpi: false,
                              canApproveRequisitions: false,
                            }),
                            canIssueLetters: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45]"
                    />
                    <span className="font-semibold text-slate-700">Can Issue Offer/Appt Letters</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!roleForm.capabilities?.canAccessPayroll}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          capabilities: {
                            ...(roleForm.capabilities || {
                              canApproveLeaves: false,
                              canEvaluateInterviews: false,
                              canIssueLetters: false,
                              canAccessPayroll: false,
                              canReviewKpi: false,
                              canApproveRequisitions: false,
                            }),
                            canAccessPayroll: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45]"
                    />
                    <span className="font-semibold text-slate-700">Can Access Payroll Slabs</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!roleForm.capabilities?.canReviewKpi}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          capabilities: {
                            ...(roleForm.capabilities || {
                              canApproveLeaves: false,
                              canEvaluateInterviews: false,
                              canIssueLetters: false,
                              canAccessPayroll: false,
                              canReviewKpi: false,
                              canApproveRequisitions: false,
                            }),
                            canReviewKpi: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45]"
                    />
                    <span className="font-semibold text-slate-700">Can Review Staff KPIs</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!roleForm.capabilities?.canApproveRequisitions}
                      onChange={(e) =>
                        setRoleForm({
                          ...roleForm,
                          capabilities: {
                            ...(roleForm.capabilities || {
                              canApproveLeaves: false,
                              canEvaluateInterviews: false,
                              canIssueLetters: false,
                              canAccessPayroll: false,
                              canReviewKpi: false,
                              canApproveRequisitions: false,
                            }),
                            canApproveRequisitions: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45]"
                    />
                    <span className="font-semibold text-slate-700">Can Approve Requisitions</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold rounded-xl shadow-xs"
                >
                  {editingRole ? 'Save Role Changes' : 'Define Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT DEPARTMENT */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#168A45]" />
                <h3 className="font-extrabold text-sm">
                  {editingDept ? 'Edit Institutional Department' : 'Create New Department'}
                </h3>
              </div>
              <button
                onClick={() => setIsDeptModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 108"
                    value={deptForm.departmentCode || ''}
                    onChange={(e) => setDeptForm({ ...deptForm, departmentCode: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold uppercase focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Research & Innovation"
                    value={deptForm.departmentName || ''}
                    onChange={(e) => setDeptForm({ ...deptForm, departmentName: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Head of Department (HOD)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. Radhakrishnan"
                  value={deptForm.headOfDepartment || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, headOfDepartment: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reporting Line</label>
                <input
                  type="text"
                  placeholder="e.g. Managing Director / Principal"
                  value={deptForm.reporting || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, reporting: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Department Scope</label>
                <textarea
                  rows={2}
                  placeholder="Operational remit and pedagogical duties..."
                  value={deptForm.description || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold rounded-xl shadow-xs"
                >
                  {editingDept ? 'Save Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW & CONFIGURE SIDE MENU ACCESS FOR ROLE */}
      {viewingRoleForPermissions && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-[#168A45]" />
                  <h3 className="font-extrabold text-sm sm:text-base">
                    Role Menu Access Matrix: {viewingRoleForPermissions.roleTitle}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="font-mono text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                    {viewingRoleForPermissions.id}
                  </span>
                  <span>
                    Dept: <strong>{viewingRoleForPermissions.departmentName}</strong>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    {viewingRoleForPermissions.accessLevel}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingRoleForPermissions(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search side menus by name, path..."
                    value={roleModalSearch}
                    onChange={(e) => setRoleModalSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                  />
                  {roleModalSearch && (
                    <button
                      type="button"
                      onClick={() => setRoleModalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Bulk helpers */}
                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">
                    Quick Sets:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleMenuPermissions((prev) => {
                        const next = { ...prev };
                        SIDE_MENU_DEFINITIONS.forEach((item) => {
                          if (roleModalCategory === 'All' || item.category === roleModalCategory) {
                            next[item.id] = { view: true, entry: true, edit: true, delete: true };
                          }
                        });
                        return next;
                      });
                    }}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Full All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleMenuPermissions((prev) => {
                        const next = { ...prev };
                        SIDE_MENU_DEFINITIONS.forEach((item) => {
                          if (roleModalCategory === 'All' || item.category === roleModalCategory) {
                            next[item.id] = { view: true, entry: true, edit: true, delete: false };
                          }
                        });
                        return next;
                      });
                    }}
                    className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    RW All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleMenuPermissions((prev) => {
                        const next = { ...prev };
                        SIDE_MENU_DEFINITIONS.forEach((item) => {
                          if (roleModalCategory === 'All' || item.category === roleModalCategory) {
                            next[item.id] = { view: true, entry: false, edit: false, delete: false };
                          }
                        });
                        return next;
                      });
                    }}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    View Only
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRoleMenuPermissions((prev) => {
                        const next = { ...prev };
                        SIDE_MENU_DEFINITIONS.forEach((item) => {
                          if (roleModalCategory === 'All' || item.category === roleModalCategory) {
                            next[item.id] = { view: false, entry: false, edit: false, delete: false };
                          }
                        });
                        return next;
                      });
                    }}
                    className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[11px] font-bold cursor-pointer transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Categories Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setRoleModalCategory('All')}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer shrink-0 ${
                    roleModalCategory === 'All'
                      ? 'bg-[#168A45] text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  All ({SIDE_MENU_DEFINITIONS.length})
                </button>
                {SIDE_MENU_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setRoleModalCategory(cat)}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer shrink-0 font-medium ${
                      roleModalCategory === cat
                        ? 'bg-[#168A45] text-white font-bold shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Table of side menus */}
            <div className="overflow-y-auto flex-1 p-0">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10">
                  <tr className="text-slate-700 font-extrabold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 w-[42%]">Side Navigation Menu</th>
                    <th className="py-2.5 px-3 text-center w-[12%]">View Only</th>
                    <th className="py-2.5 px-3 text-center w-[12%]">Entry</th>
                    <th className="py-2.5 px-3 text-center w-[12%]">Edit</th>
                    <th className="py-2.5 px-3 text-center w-[12%]">Delete</th>
                    <th className="py-2.5 px-3 text-right w-[10%] pr-4">Quick</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SIDE_MENU_DEFINITIONS.filter((item) => {
                    if (roleModalCategory !== 'All' && item.category !== roleModalCategory) {
                      return false;
                    }
                    if (roleModalSearch.trim()) {
                      const q = roleModalSearch.toLowerCase();
                      const match =
                        item.name.toLowerCase().includes(q) ||
                        item.id.toLowerCase().includes(q) ||
                        item.category.toLowerCase().includes(q);
                      if (!match) return false;
                    }
                    return true;
                  }).map((item) => {
                    const perm = roleMenuPermissions[item.id] || {
                      view: false,
                      entry: false,
                      edit: false,
                      delete: false,
                    };
                    const isFull = perm.view && perm.entry && perm.edit && perm.delete;
                    const isNone = !perm.view && !perm.entry && !perm.edit && !perm.delete;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 transition-colors ${
                          isNone ? 'opacity-60 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                            <span className="font-mono text-slate-400 bg-slate-100 px-1 rounded">
                              {item.id}
                            </span>
                            <span>• {item.category}</span>
                          </div>
                        </td>

                        {/* View Only */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.view}
                            onChange={() => handleToggleRolePermission(item.id, 'view')}
                            className="w-4 h-4 rounded text-[#168A45] border-slate-300 focus:ring-[#168A45] accent-[#168A45] cursor-pointer"
                          />
                        </td>

                        {/* Entry */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.entry}
                            onChange={() => handleToggleRolePermission(item.id, 'entry')}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                          />
                        </td>

                        {/* Edit */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.edit}
                            onChange={() => handleToggleRolePermission(item.id, 'edit')}
                            className="w-4 h-4 rounded text-amber-600 border-slate-300 focus:ring-amber-500 accent-amber-600 cursor-pointer"
                          />
                        </td>

                        {/* Delete */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={perm.delete}
                            onChange={() => handleToggleRolePermission(item.id, 'delete')}
                            className="w-4 h-4 rounded text-rose-600 border-slate-300 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                          />
                        </td>

                        {/* Quick Sets */}
                        <td className="py-2.5 px-3 text-right pr-4">
                          <div className="inline-flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => {
                                setRoleMenuPermissions((prev) => ({
                                  ...prev,
                                  [item.id]: { view: true, entry: true, edit: true, delete: true },
                                }));
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                isFull
                                  ? 'bg-[#168A45] text-white border-[#168A45]'
                                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              Full
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRoleMenuPermissions((prev) => ({
                                  ...prev,
                                  [item.id]: {
                                    view: false,
                                    entry: false,
                                    edit: false,
                                    delete: false,
                                  },
                                }));
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border cursor-pointer ${
                                isNone
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : 'bg-white hover:bg-slate-100 text-slate-400 border-slate-200'
                              }`}
                            >
                              None
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center space-x-2 text-slate-600 text-[11px]">
                <Info className="w-3.5 h-3.5 text-[#168A45]" />
                <span>
                  Permissions define module accessibility for staff members appointed under this designation.
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewingRoleForPermissions(null)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveRoleMenuPermissions}
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Role Access Matrix</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
