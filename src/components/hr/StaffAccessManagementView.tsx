import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Check,
  X,
  UserCheck,
  Key,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
  Building2,
  MapPin,
  LogIn,
  Layers,
  Sliders,
  RefreshCw,
  BarChart3,
  ShieldAlert,
  PlusSquare,
  Edit3,
  Trash2,
  CheckCheck,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { StaffMember } from '../../types/hr';
import { User } from '../../types';
import { hrStorage } from '../../services/hrStorageService';
import { storage } from '../../services/storageService';
import {
  ONBOARDING_ASSIGNABLE_MODULES,
  resolveAssignedModulesToNavTabs,
  SIDE_MENU_DEFINITIONS,
  UserSideMenuPermission,
  getUserMenuPermissions,
  saveUserMenuPermissions,
} from '../../utils/menuPermissions';

interface StaffAccessManagementViewProps {
  staff?: StaffMember[];
  currentUser?: User | null;
  onSaveStaff?: (updatedStaff: Partial<StaffMember>) => void;
  onSwitchUser?: (user: User) => void;
}

const MODULE_DOMAIN_CONFIG: Array<{
  key: string;
  label: string;
  color: string;
  modules: string[];
}> = [
  {
    key: 'coreSelfService',
    label: 'Core & Self-Service',
    color: '#168A45',
    modules: ['Dashboard', 'Attendance & Leave', 'Operations & Schedules'],
  },
  {
    key: 'hrPeople',
    label: 'HR & People Ops',
    color: '#0D9488',
    modules: ['HR & Staff Directory', 'Payroll Management', 'KPI & Performance'],
  },
  {
    key: 'commercialCrm',
    label: 'CRM & Commercial',
    color: '#2563EB',
    modules: ['Leads & Admissions', 'Sales & Billing', 'Purchase & Procurement'],
  },
  {
    key: 'financeParty',
    label: 'Finance & Accounts',
    color: '#D97706',
    modules: ['Finance & Accounts', 'Party & Vendor Ledger'],
  },
  {
    key: 'assetsOps',
    label: 'Inventory, Assets & Compliance',
    color: '#7C3AED',
    modules: ['Inventory & Stock', 'Asset Management', 'Document & Expiry'],
  },
  {
    key: 'adminAnalytics',
    label: 'System Admin & Analytics',
    color: '#E11D48',
    modules: ['Reports & Analytics', 'System Settings'],
  },
];

export const StaffAccessManagementView: React.FC<StaffAccessManagementViewProps> = ({
  staff: propStaff,
  currentUser,
  onSaveStaff,
  onSwitchUser,
}) => {
  const [staffList, setStaffList] = useState<StaffMember[]>(() =>
    propStaff && propStaff.length > 0 ? propStaff : hrStorage.getStaff()
  );
  const [selectedStaffId, setSelectedStaffId] = useState<string>(() => {
    const list = propStaff && propStaff.length > 0 ? propStaff : hrStorage.getStaff();
    return list[0]?.id || '';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Enabled' | 'Disabled'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [chartViewMode, setChartViewMode] = useState<'stacked' | 'average'>('stacked');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const branches = useMemo(() => hrStorage.getBranchesMaster(), []);

  useEffect(() => {
    if (propStaff) {
      setStaffList(propStaff);
      if (!selectedStaffId && propStaff.length > 0) {
        setSelectedStaffId(propStaff[0].id);
      }
    }
  }, [propStaff]);

  const refreshLocalStaff = () => {
    const fresh = propStaff && propStaff.length > 0 ? propStaff : hrStorage.getStaff();
    setStaffList(fresh);
  };

  useEffect(() => {
    const handleRefresh = () => {
      refreshLocalStaff();
    };
    window.addEventListener('mysar_staff_access_changed', handleRefresh);
    window.addEventListener('mysar_users_updated', handleRefresh);
    window.addEventListener('mysar_hr_data_updated', handleRefresh);
    return () => {
      window.removeEventListener('mysar_staff_access_changed', handleRefresh);
      window.removeEventListener('mysar_users_updated', handleRefresh);
      window.removeEventListener('mysar_hr_data_updated', handleRefresh);
    };
  }, [propStaff]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.systemAccess?.username || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q);

      const staffBranch = s.branchLocation || s.systemAccess?.branchAccess || 'Kochi Corporate HQ';
      const matchesBranch = branchFilter === 'All' || staffBranch.toLowerCase() === branchFilter.toLowerCase();

      const staffDept = s.department || 'Unassigned';
      const matchesDept = departmentFilter === 'All' || staffDept.toLowerCase() === departmentFilter.toLowerCase();

      const loginActive = s.employmentStatus === 'Active' && s.systemAccess?.enableLogin !== false;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Enabled' && loginActive) ||
        (statusFilter === 'Disabled' && !loginActive);

      return matchesSearch && matchesBranch && matchesDept && matchesStatus;
    });
  }, [staffList, searchQuery, branchFilter, departmentFilter, statusFilter]);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || filteredStaff[0] || null,
    [staffList, selectedStaffId, filteredStaff]
  );

  // Editable System Access state for the selected staff member
  const [enableLogin, setEnableLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [userType, setUserType] = useState('Staff');
  const [systemRole, setSystemRole] = useState('Staff');
  const [accessLevel, setAccessLevel] = useState<'Read-Only' | 'Standard' | 'Manager' | 'Administrator' | 'Super Admin'>('Standard');
  const [branchAccess, setBranchAccess] = useState('Kochi Corporate HQ');
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Pending' | 'Suspended'>('Active');
  const [assignedModules, setAssignedModules] = useState<string[]>(['Dashboard']);
  const [sideMenuPerms, setSideMenuPerms] = useState<Record<string, UserSideMenuPermission>>({});

  useEffect(() => {
    if (!selectedStaff) return;
    const sa = selectedStaff.systemAccess;
    setEnableLogin(sa?.enableLogin ?? true);
    const resolvedUname =
      sa?.username?.trim() ||
      (selectedStaff.email
        ? selectedStaff.email.split('@')[0].toLowerCase()
        : selectedStaff.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.'));

    // Find linked user to cross-check credentials and ensure 100% two-way link
    const allUsers = storage.getUsers();
    const matchedUser = allUsers.find(
      (u) =>
        u.staffId === selectedStaff.id ||
        (selectedStaff.staffCode && u.staffId === selectedStaff.staffCode) ||
        (u.userId && u.userId.toLowerCase() === resolvedUname.toLowerCase()) ||
        (u.email && selectedStaff.email && u.email.toLowerCase() === selectedStaff.email.toLowerCase()) ||
        ((u as any).personalEmail && selectedStaff.personalEmail && (u as any).personalEmail.toLowerCase() === selectedStaff.personalEmail.toLowerCase())
    );

    const linkedUsername = sa?.username?.trim() || matchedUser?.userId?.trim() || resolvedUname;
    const linkedPassword =
      sa?.password?.trim() ||
      matchedUser?.password?.trim() ||
      (sa as any)?.initialPassword?.trim() ||
      'Password@123';

    setUsername(linkedUsername);
    setPassword(linkedPassword);
    setUserType(sa?.userType || selectedStaff.employeeCategory || 'Staff');
    setSystemRole(sa?.role || 'Staff');
    const resolvedLevel = sa?.accessLevel || 'Standard';
    setAccessLevel(resolvedLevel);
    setBranchAccess(sa?.branchAccess || selectedStaff.branchLocation || 'Kochi Corporate HQ');
    setAccountStatus(
      selectedStaff.employmentStatus === 'Active' ? sa?.accountStatus || 'Active' : 'Suspended'
    );
    const resolvedMods =
      sa?.assignedModules && sa.assignedModules.length > 0
        ? sa.assignedModules
        : ['Dashboard', 'HR & Staff Directory', 'Attendance & Leave'];
    setAssignedModules(resolvedMods);

    // Find or build linked user to load granular side menu permissions
    const allowedTabSet = resolveAssignedModulesToNavTabs(resolvedMods, resolvedLevel);
    const existingPerms = matchedUser ? getUserMenuPermissions(matchedUser) : {};
    const initialMap: Record<string, UserSideMenuPermission> = {};

    SIDE_MENU_DEFINITIONS.forEach((item) => {
      const isAllowed = allowedTabSet.has(item.id);
      if (matchedUser && existingPerms[item.id] && isAllowed) {
        initialMap[item.id] = existingPerms[item.id];
      } else {
        initialMap[item.id] = {
          viewOnly: isAllowed,
          entry: isAllowed && resolvedLevel !== 'Read-Only',
          edit:
            isAllowed &&
            (resolvedLevel === 'Manager' ||
              resolvedLevel === 'Administrator' ||
              resolvedLevel === 'Super Admin'),
          delete:
            isAllowed &&
            (resolvedLevel === 'Administrator' || resolvedLevel === 'Super Admin'),
        };
      }
    });
    setSideMenuPerms(initialMap);
  }, [selectedStaff]);

  const handleToggleModule = (modId: string) => {
    const nextMods = assignedModules.includes(modId)
      ? assignedModules.filter((m) => m !== modId)
      : [...assignedModules, modId];
    setAssignedModules(nextMods);

    const allowedTabSet = resolveAssignedModulesToNavTabs(nextMods, accessLevel);
    setSideMenuPerms((prev) => {
      const next = { ...prev };
      SIDE_MENU_DEFINITIONS.forEach((item) => {
        const isAllowed = allowedTabSet.has(item.id);
        if (!isAllowed) {
          next[item.id] = { viewOnly: false, entry: false, edit: false, delete: false };
        } else if (
          !next[item.id] ||
          (!next[item.id].viewOnly && !next[item.id].entry && !next[item.id].edit && !next[item.id].delete)
        ) {
          next[item.id] = {
            viewOnly: true,
            entry: accessLevel !== 'Read-Only',
            edit:
              accessLevel === 'Manager' ||
              accessLevel === 'Administrator' ||
              accessLevel === 'Super Admin',
            delete: accessLevel === 'Administrator' || accessLevel === 'Super Admin',
          };
        }
      });
      return next;
    });
  };

  const handleToggleSideMenuCheckbox = (
    menuId: string,
    field: keyof UserSideMenuPermission
  ) => {
    setSideMenuPerms((prev) => {
      const current = prev[menuId] || { viewOnly: false, entry: false, edit: false, delete: false };
      return {
        ...prev,
        [menuId]: {
          ...current,
          [field]: !current[field],
        },
      };
    });
  };

  const handleSetRowSideMenuPreset = (
    menuId: string,
    preset: 'all' | 'viewOnly' | 'entryOnly' | 'editOnly' | 'deleteOnly' | 'none'
  ) => {
    setSideMenuPerms((prev) => ({
      ...prev,
      [menuId]:
        preset === 'all'
          ? { viewOnly: true, entry: true, edit: true, delete: true }
          : preset === 'viewOnly'
          ? { viewOnly: true, entry: false, edit: false, delete: false }
          : preset === 'entryOnly'
          ? { viewOnly: false, entry: true, edit: false, delete: false }
          : preset === 'editOnly'
          ? { viewOnly: false, entry: false, edit: true, delete: false }
          : preset === 'deleteOnly'
          ? { viewOnly: false, entry: false, edit: false, delete: true }
          : { viewOnly: false, entry: false, edit: false, delete: false },
    }));
  };

  const handleSaveStaffAccess = () => {
    if (!selectedStaff) return;

    const updatedPayload: Partial<StaffMember> = {
      ...selectedStaff,
      branchLocation: branchAccess,
      systemAccess: {
        enableLogin,
        userType,
        username: username.trim() || selectedStaff.id.toLowerCase(),
        password: password.trim() || 'Password@123',
        initialPassword: password.trim() || 'Password@123',
        role: systemRole,
        accessLevel,
        assignedModules: assignedModules.length > 0 ? assignedModules : ['Dashboard'],
        branchAccess,
        accountStatus: selectedStaff.employmentStatus === 'Active' && enableLogin ? accountStatus : 'Suspended',
      },
    };

    if (onSaveStaff) {
      onSaveStaff(updatedPayload);
    } else {
      hrStorage.saveStaff(updatedPayload, currentUser?.name || 'HR Admin');
    }

    // Ensure staff member is synced to User account and save granular Side Menu Item permissions
    hrStorage.syncStaffToUserAccount(updatedPayload as StaffMember);
    const allUsers = storage.getUsers();
    const sUsername = (username.trim() || selectedStaff.id).toLowerCase();
    const matchedUser = allUsers.find(
      (u) =>
        u.staffId === selectedStaff.id ||
        (u.userId && u.userId.toLowerCase() === sUsername) ||
        (u.email && selectedStaff.email && u.email.toLowerCase() === selectedStaff.email.toLowerCase())
    );
    if (matchedUser) {
      matchedUser.userId = sUsername;
      matchedUser.password = password.trim() || 'Password@123';
      storage.updateUser(matchedUser);
      saveUserMenuPermissions(matchedUser.id, sideMenuPerms);
    }

    refreshLocalStaff();
    window.dispatchEvent(new CustomEvent('mysar_staff_access_changed'));
    window.dispatchEvent(new CustomEvent('mysar_users_updated'));
    setFeedbackBanner(
      `Saved System Access, Assigned Modules (${assignedModules.length} modules), and Side Menu CRUD Permissions for ${selectedStaff.fullName} (${selectedStaff.id}).`
    );
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleLoginAsStaff = (staffMember: StaffMember) => {
    // First ensure the staff member is synced to a User record
    hrStorage.syncStaffToUserAccount(staffMember);
    const allUsers = storage.getUsers();
    const sUsername = (
      staffMember.systemAccess?.username ||
      (staffMember.email ? staffMember.email.split('@')[0] : staffMember.fullName)
    )
      .trim()
      .toLowerCase();

    const matchedUser = allUsers.find(
      (u) =>
        u.staffId === staffMember.id ||
        (u.userId && u.userId.toLowerCase() === sUsername) ||
        (u.email && staffMember.email && u.email.toLowerCase() === staffMember.email.toLowerCase())
    );

    if (matchedUser && onSwitchUser) {
      onSwitchUser(matchedUser);
    }
  };

  const handleCopyCredentials = (staffMember: StaffMember) => {
    const uName =
      staffMember.systemAccess?.username ||
      (staffMember.email ? staffMember.email.split('@')[0] : staffMember.id);
    const uPass = staffMember.systemAccess?.password || 'Password@123';
    const mods = (staffMember.systemAccess?.assignedModules || ['Dashboard']).join(', ');
    const text = `Staff Name: ${staffMember.fullName}\nEmployee ID: ${staffMember.id}\nLogin ID: ${uName}\nPassword: ${uPass}\nBranch: ${staffMember.branchLocation || 'Kochi Corporate HQ'}\nAssigned Modules: ${mods}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(staffMember.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resolvedNavTabsCount = useMemo(
    () => resolveAssignedModulesToNavTabs(assignedModules).size,
    [assignedModules]
  );

  // Summary KPIs
  const totalStaffCount = staffList.length;
  const activeLoginCount = staffList.filter(
    (s) => s.employmentStatus === 'Active' && s.systemAccess?.enableLogin !== false
  ).length;
  const restrictedCount = totalStaffCount - activeLoginCount;

  // Departmental Authorized Modules Distribution Analytics for Recharts
  const departmentDistributionData = useMemo(() => {
    const deptMap = new Map<
      string,
      {
        department: string;
        shortDept: string;
        staffCount: number;
        activeLoginStaff: number;
        totalAuthorizations: number;
        elevatedAdminCount: number;
        coreSelfService: number;
        hrPeople: number;
        commercialCrm: number;
        financeParty: number;
        assetsOps: number;
        adminAnalytics: number;
        moduleBreakdown: Record<string, number>;
      }
    >();

    const sourceList = branchFilter === 'All'
      ? staffList
      : staffList.filter(
          (s) =>
            (s.branchLocation || s.systemAccess?.branchAccess || 'Kochi Corporate HQ').toLowerCase() ===
            branchFilter.toLowerCase()
        );

    sourceList.forEach((s) => {
      const dept = (s.department || 'General Administration').trim();
      if (!deptMap.has(dept)) {
        deptMap.set(dept, {
          department: dept,
          shortDept: dept.length > 18 ? `${dept.slice(0, 16)}…` : dept,
          staffCount: 0,
          activeLoginStaff: 0,
          totalAuthorizations: 0,
          elevatedAdminCount: 0,
          coreSelfService: 0,
          hrPeople: 0,
          commercialCrm: 0,
          financeParty: 0,
          assetsOps: 0,
          adminAnalytics: 0,
          moduleBreakdown: {},
        });
      }

      const entry = deptMap.get(dept)!;
      entry.staffCount += 1;

      const isLoginEnabled = s.employmentStatus === 'Active' && s.systemAccess?.enableLogin !== false;
      if (isLoginEnabled) {
        entry.activeLoginStaff += 1;
      }

      const level = s.systemAccess?.accessLevel || 'Standard';
      if (level === 'Administrator' || level === 'Super Admin') {
        entry.elevatedAdminCount += 1;
      }

      const mods =
        s.systemAccess?.assignedModules && s.systemAccess.assignedModules.length > 0
          ? s.systemAccess.assignedModules
          : ['Dashboard', 'HR & Staff Directory', 'Attendance & Leave'];

      mods.forEach((m) => {
        entry.totalAuthorizations += 1;
        entry.moduleBreakdown[m] = (entry.moduleBreakdown[m] || 0) + 1;

        const domain = MODULE_DOMAIN_CONFIG.find((d) =>
          d.modules.some((modName) => modName.toLowerCase() === m.toLowerCase())
        );
        if (domain) {
          (entry as any)[domain.key] += 1;
        } else {
          entry.coreSelfService += 1;
        }
      });
    });

    return Array.from(deptMap.values())
      .map((d) => ({
        ...d,
        avgModulesPerStaff: d.staffCount > 0 ? Number((d.totalAuthorizations / d.staffCount).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.totalAuthorizations - a.totalAuthorizations);
  }, [staffList, branchFilter]);

  const totalModuleGrantsAcrossOrg = useMemo(
    () => departmentDistributionData.reduce((sum, d) => sum + d.totalAuthorizations, 0),
    [departmentDistributionData]
  );

  const privilegedAdminGrantsCount = useMemo(
    () => departmentDistributionData.reduce((sum, d) => sum + d.adminAnalytics, 0),
    [departmentDistributionData]
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-200 text-xs">
      {/* Top Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EAF7EF] border border-emerald-200 flex items-center justify-center text-[#168A45] shrink-0 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Staff Access &amp; Module Permissions Page
              </h2>
              <span className="text-[11px] font-medium text-slate-500">
                · Onboard Staff &gt; System Access Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure each staff member&apos;s ERP login credentials, branch access, and assigned modules. Logged-in staff will only view and access their assigned modules.
            </p>
          </div>
        </div>

        {/* Summary Counters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Staff</span>
            <span className="text-sm font-black text-slate-900 font-mono tabular-nums">{totalStaffCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Login Enabled</span>
            <span className="text-sm font-black text-emerald-900 font-mono tabular-nums">{activeLoginCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200/80">
            <span className="text-[10px] text-rose-700 font-bold uppercase block">Restricted / Inactive</span>
            <span className="text-sm font-black text-rose-900 font-mono tabular-nums">{restrictedCount}</span>
          </div>
        </div>
      </div>

      {/* Departmental Authorized Module Distribution Chart (Security Pattern Monitor) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-[#168A45]" />
              <h3 className="text-sm font-black text-slate-900">
                Authorized Module Distribution Across Departments
              </h3>
              <span className="text-[11px] text-slate-500">
                · {departmentDistributionData.length} Departments · {totalModuleGrantsAcrossOrg} Total Module Authorizations
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Monitor corporate security patterns, cross-departmental module entitlements, and administrative privilege concentration. Click any department bar to filter the staff list below.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {departmentFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setDepartmentFilter('All')}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center space-x-1 cursor-pointer hover:bg-emerald-100"
              >
                <span>Dept: {departmentFilter}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setChartViewMode('stacked')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  chartViewMode === 'stacked'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Domain Breakdown
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode('average')}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                  chartViewMode === 'average'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Avg Modules &amp; Admin Density
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Chart Container (9 cols) */}
          <div className="lg:col-span-9 h-72 w-full">
            {departmentDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartViewMode === 'stacked' ? (
                  <BarChart
                    data={departmentDistributionData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        const clickedDept = state.activePayload[0].payload.department;
                        setDepartmentFilter((prev) => (prev === clickedDept ? 'All' : clickedDept));
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="shortDept"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickLine={false}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: 'Authorized Module Grants',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: 10, fill: '#64748B', fontWeight: 600 },
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-lg border border-slate-700 text-xs space-y-2 min-w-[230px]">
                            <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                              <span className="font-bold text-white">{data.department}</span>
                              <span className="font-mono text-[11px] text-emerald-400">
                                {data.staffCount} Staff ({data.activeLoginStaff} Active)
                              </span>
                            </div>
                            <div className="space-y-1">
                              {MODULE_DOMAIN_CONFIG.map((dom) => {
                                const val = data[dom.key] || 0;
                                if (val === 0) return null;
                                return (
                                  <div key={dom.key} className="flex items-center justify-between text-[11px]">
                                    <span className="flex items-center space-x-1.5 text-slate-300">
                                      <span
                                        className="w-2 h-2 rounded-xs inline-block"
                                        style={{ backgroundColor: dom.color }}
                                      />
                                      <span>{dom.label}</span>
                                    </span>
                                    <span className="font-mono font-bold text-white tabular-nums">{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="pt-1.5 border-t border-slate-700 flex items-center justify-between text-[11px] text-slate-300">
                              <span>Total Authorizations</span>
                              <span className="font-mono font-bold text-emerald-400 tabular-nums">
                                {data.totalAuthorizations} ({data.avgModulesPerStaff} avg/staff)
                              </span>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                      iconType="circle"
                      iconSize={8}
                    />
                    {MODULE_DOMAIN_CONFIG.map((dom, idx) => (
                      <Bar
                        key={dom.key}
                        dataKey={dom.key}
                        name={dom.label}
                        stackId="modules"
                        fill={dom.color}
                        radius={idx === MODULE_DOMAIN_CONFIG.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        className="cursor-pointer"
                      />
                    ))}
                  </BarChart>
                ) : (
                  <BarChart
                    data={departmentDistributionData}
                    margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload[0]) {
                        const clickedDept = state.activePayload[0].payload.department;
                        setDepartmentFilter((prev) => (prev === clickedDept ? 'All' : clickedDept));
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="shortDept"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      axisLine={{ stroke: '#CBD5E1' }}
                      tickLine={false}
                      interval={0}
                      angle={-12}
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      formatter={(value: any, name: string) => [value, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} iconType="circle" iconSize={8} />
                    <Bar
                      dataKey="avgModulesPerStaff"
                      name="Avg Modules per Staff"
                      fill="#168A45"
                      radius={[4, 4, 0, 0]}
                      className="cursor-pointer"
                    >
                      {departmentDistributionData.map((entry) => (
                        <Cell
                          key={entry.department}
                          fill={departmentFilter === entry.department ? '#0B5D2A' : '#168A45'}
                        />
                      ))}
                    </Bar>
                    <Bar
                      dataKey="elevatedAdminCount"
                      name="Admin / Super Admin Staff"
                      fill="#E11D48"
                      radius={[4, 4, 0, 0]}
                      className="cursor-pointer"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">
                No department access data available for the selected branch filter.
              </div>
            )}
          </div>

          {/* Right Security Pattern Insights Summary (3 cols) */}
          <div className="lg:col-span-3 space-y-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-5">
            <div className="text-[11px] font-bold text-slate-800 flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-[#168A45]" />
              <span>Security Pattern Posture</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] text-slate-500 font-medium">Highest Module Concentration</div>
                <div className="text-xs font-black text-slate-900 mt-0.5 truncate">
                  {departmentDistributionData[0]?.department || 'N/A'}
                </div>
                <div className="text-[11px] text-emerald-700 font-mono tabular-nums mt-0.5">
                  {departmentDistributionData[0]?.totalAuthorizations || 0} grants ·{' '}
                  {departmentDistributionData[0]?.avgModulesPerStaff || 0} avg/staff
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] text-slate-500 font-medium">System Admin &amp; Analytics Grants</div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="text-sm font-black text-slate-900 font-mono tabular-nums">
                    {privilegedAdminGrantsCount}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    across {departmentDistributionData.filter((d) => d.adminAnalytics > 0).length} depts
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] text-slate-500 font-medium">Department Filter Selection</div>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full mt-1.5 border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800 font-semibold text-[11px]"
                >
                  <option value="All">All Departments ({staffList.length})</option>
                  {departmentDistributionData.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department} ({d.staffCount} staff · {d.totalAuthorizations} mods)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {feedbackBanner && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center space-x-2.5 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Split Grid: Left = Staff Directory List, Right = Staff System Access & Assigned Modules Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: Staff Access Directory (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-[#168A45]" />
                <span>Staff Credentials &amp; Access List ({filteredStaff.length})</span>
              </span>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, Employee ID, or Login ID..."
                className="w-full text-xs text-slate-800 focus:outline-hidden"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 font-semibold text-[11px]"
              >
                <option value="All">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.branchName}>
                    {b.branchName}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white text-slate-700 font-semibold text-[11px]"
              >
                <option value="All">All Access Status</option>
                <option value="Enabled">Login Enabled</option>
                <option value="Disabled">Restricted / Disabled</option>
              </select>
            </div>
          </div>

          {/* Staff Cards List */}
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[640px]">
            {filteredStaff.map((s) => {
              const isSelected = selectedStaff?.id === s.id;
              const isLoginActive = s.employmentStatus === 'Active' && s.systemAccess?.enableLogin !== false;
              const mods = s.systemAccess?.assignedModules || ['Dashboard', 'HR & Staff Directory', 'Attendance & Leave'];
              const uId =
                s.systemAccess?.username ||
                (s.email ? s.email.split('@')[0].toLowerCase() : s.fullName.toLowerCase().replace(/\s+/g, '.'));

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStaffId(s.id)}
                  className={`p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#EAF7EF]/70 border-l-4 border-l-[#168A45]'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden border border-emerald-200">
                        {s.profilePhoto ? (
                          <img src={s.profilePhoto} alt={s.fullName} className="w-full h-full object-cover" />
                        ) : (
                          s.fullName.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{s.fullName}</div>
                        <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {s.staffCode || s.id}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium truncate">
                            {s.department} • {s.position}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-[10px] text-slate-500">
                          <span className="font-mono text-slate-700 font-semibold">@{uId}</span>
                          <span>•</span>
                          <span className="flex items-center space-x-0.5 text-emerald-800 font-medium">
                            <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                            <span>{s.branchLocation || s.systemAccess?.branchAccess || 'Kochi Corporate HQ'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center space-x-1 ${
                          isLoginActive
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isLoginActive ? <Unlock className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        <span>{isLoginActive ? 'Active' : 'Restricted'}</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {mods.length} Modules
                      </span>
                    </div>
                  </div>

                  {/* Quick Assigned Modules Pills */}
                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-1">
                      {mods.includes('Attendance & Leave') ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          Punch &amp; Leaves
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-medium">
                          <X className="w-2.5 h-2.5 text-slate-400" />
                          No Leaves/Punch
                        </span>
                      )}
                      {mods.filter((m) => m !== 'Attendance & Leave').slice(0, 2).map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleCopyCredentials(s)}
                        title="Copy staff login credentials"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 cursor-pointer"
                      >
                        {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      {onSwitchUser && isLoginActive && (
                        <button
                          type="button"
                          onClick={() => handleLoginAsStaff(s)}
                          title={`Simulate login as ${s.fullName} to verify module visibility`}
                          className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold text-[10px] cursor-pointer shadow-2xs"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>Login As</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredStaff.length === 0 && (
              <div className="p-8 text-center text-slate-400 italic">
                No staff members match your current filter criteria.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Staff System Access & Assigned Modules Editor (7 cols) */}
        <div className="lg:col-span-7">
          {selectedStaff ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-5">
              {/* Selected Staff Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden border border-emerald-200">
                    {selectedStaff.profilePhoto ? (
                      <img
                        src={selectedStaff.profilePhoto}
                        alt={selectedStaff.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      selectedStaff.fullName.charAt(0)
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="text-sm font-black text-slate-900">{selectedStaff.fullName}</h3>
                      <span className="px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {selectedStaff.staffCode || selectedStaff.id}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedStaff.position} • {selectedStaff.department} ({selectedStaff.departmentCode || '101'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {onSwitchUser && enableLogin && selectedStaff.employmentStatus === 'Active' && (
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveStaffAccess();
                        handleLoginAsStaff({
                          ...selectedStaff,
                          branchLocation: branchAccess,
                          systemAccess: {
                            enableLogin,
                            userType,
                            username,
                            password,
                            role: systemRole,
                            accessLevel,
                            assignedModules,
                            branchAccess,
                            accountStatus,
                          },
                        });
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Save &amp; Switch to Staff View</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveStaffAccess}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Access Config</span>
                  </button>
                </div>
              </div>

              {/* Enable Portal Login Toggle */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <Key className="w-4 h-4 text-[#168A45]" />
                    <span>ERP Portal Login Access</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Enable or suspend this staff member&apos;s login credentials (synced with Onboard Staff &gt; 9. System &amp; Access).
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLogin}
                    onChange={(e) => setEnableLogin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#168A45]"></div>
                </label>
              </div>

              {/* Credentials & Branch Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="font-semibold text-slate-700">User ID / Login ID *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Login Password *</label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">User Type Profile</label>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold"
                  >
                    <option value="Manager">Manager</option>
                    <option value="Executive">Executive</option>
                    <option value="Staff">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Access Level Tier</label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold text-emerald-800"
                  >
                    <option value="Standard">Standard User (Assigned Modules Only)</option>
                    <option value="Read-Only">Read-Only Observer</option>
                    <option value="Manager">Department Manager</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Super Admin">Super Admin (All Modules)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Assigned Branch / Location *</label>
                  <select
                    value={branchAccess}
                    onChange={(e) => setBranchAccess(e.target.value)}
                    className="w-full mt-1 border border-emerald-300 bg-emerald-50/30 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.branchName}>
                        [{b.branchCode}] {b.branchName}
                      </option>
                    ))}
                    {!branches.some((b) => b.branchName === branchAccess) && branchAccess && (
                      <option value={branchAccess}>{branchAccess}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700">Account Status</label>
                  <select
                    value={accountStatus}
                    onChange={(e) => setAccountStatus(e.target.value as any)}
                    className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold"
                  >
                    <option value="Active">Active (Granted Access)</option>
                    <option value="Pending">Pending First Login</option>
                    <option value="Suspended">Suspended / Restricted</option>
                  </select>
                </div>
              </div>

              {/* Feature: Dedicated Attendance Marking & Leave Request Access */}
              <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#168A45] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                      <span>Attendance Marking & Leave Request Access</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          assignedModules.includes('Attendance & Leave')
                            ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-200 text-slate-700 border border-slate-300'
                        }`}
                      >
                        {assignedModules.includes('Attendance & Leave') ? 'ACCESS GRANTED' : 'ACCESS OFF'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-relaxed">
                      Allows <b>{selectedStaff.fullName}</b> to punch in/out daily (Check-In & Check-Out) and submit staff Leave Requests directly from their self-service account.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const isCurrentlyEnabled = assignedModules.includes('Attendance & Leave');
                    if (isCurrentlyEnabled) {
                      setAssignedModules(assignedModules.filter((m) => m !== 'Attendance & Leave'));
                    } else {
                      setAssignedModules([...new Set([...assignedModules, 'Attendance & Leave', 'Dashboard'])]);
                      setSideMenuPerms((prev) => ({
                        ...prev,
                        'hr-attendance': { viewOnly: true, entry: true, edit: true, delete: false },
                      }));
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs ${
                    assignedModules.includes('Attendance & Leave')
                      ? 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                      : 'bg-[#168A45] hover:bg-[#0B5D2A] text-white active:scale-98'
                  }`}
                >
                  {assignedModules.includes('Attendance & Leave')
                    ? 'Revoke Attendance & Leave'
                    : '+ Grant Attendance & Leave Access'}
                </button>
              </div>

              {/* Assigned Corporate Modules Selector */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                      <Layers className="w-4 h-4 text-[#168A45]" />
                      <span>
                        Assigned System Modules ({assignedModules.length} selected • {resolvedNavTabsCount} screens authorized)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When <b>{selectedStaff.fullName}</b> logs in with <code>@{username}</code>, the sidebar and workspace will restrict access strictly to these assigned modules.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setAssignedModules(ONBOARDING_ASSIGNABLE_MODULES.map((m) => m.id))}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] cursor-pointer"
                    >
                      Assign All Modules
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignedModules(['Dashboard', 'Attendance & Leave'])}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-[11px] cursor-pointer"
                    >
                      Self-Service Only
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {ONBOARDING_ASSIGNABLE_MODULES.map((modObj) => {
                    const isChecked = assignedModules.includes(modObj.id);
                    return (
                      <button
                        key={modObj.id}
                        type="button"
                        onClick={() => handleToggleModule(modObj.id)}
                        className={`p-3 rounded-xl border text-left flex items-start justify-between gap-2 cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{modObj.label}</div>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">{modObj.category}</div>
                          <div className="text-[9px] text-emerald-700 font-mono mt-1">
                            {modObj.navTabs.length} screen{modObj.navTabs.length > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            isChecked ? 'bg-[#168A45] text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Side Menu Item Checkboxes: View Only, Entry (New), Edit, Delete */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                      <Sliders className="w-4 h-4 text-[#168A45]" />
                      <span>
                        Side Menu Item Action Permissions (View Only • Entry (New) • Edit • Delete)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tick <b>View Only</b> for option to View, <b>Entry (New)</b> for Add New, <b>Edit</b> for Edit, <b>Delete</b> for Can Delete, or tick <b>All 4</b> to allow all actions.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const allowedSet = resolveAssignedModulesToNavTabs(assignedModules, accessLevel);
                        const next: Record<string, UserSideMenuPermission> = { ...sideMenuPerms };
                        SIDE_MENU_DEFINITIONS.filter((m) => allowedSet.has(m.id)).forEach((m) => {
                          next[m.id] = { viewOnly: true, entry: true, edit: true, delete: true };
                        });
                        setSideMenuPerms(next);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                    >
                      <CheckCheck className="w-3 h-3 text-emerald-600" />
                      <span>All 4 (Can Do All)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allowedSet = resolveAssignedModulesToNavTabs(assignedModules, accessLevel);
                        const next: Record<string, UserSideMenuPermission> = { ...sideMenuPerms };
                        SIDE_MENU_DEFINITIONS.filter((m) => allowedSet.has(m.id)).forEach((m) => {
                          next[m.id] = { viewOnly: true, entry: false, edit: false, delete: false };
                        });
                        setSideMenuPerms(next);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-[10px] flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3 text-blue-600" />
                      <span>View Only All</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allowedSet = resolveAssignedModulesToNavTabs(assignedModules, accessLevel);
                        const next: Record<string, UserSideMenuPermission> = { ...sideMenuPerms };
                        SIDE_MENU_DEFINITIONS.filter((m) => allowedSet.has(m.id)).forEach((m) => {
                          next[m.id] = { viewOnly: false, entry: true, edit: false, delete: false };
                        });
                        setSideMenuPerms(next);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[10px] cursor-pointer"
                    >
                      Entry Only All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allowedSet = resolveAssignedModulesToNavTabs(assignedModules, accessLevel);
                        const next: Record<string, UserSideMenuPermission> = { ...sideMenuPerms };
                        SIDE_MENU_DEFINITIONS.filter((m) => allowedSet.has(m.id)).forEach((m) => {
                          next[m.id] = { viewOnly: false, entry: false, edit: true, delete: false };
                        });
                        setSideMenuPerms(next);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold text-[10px] cursor-pointer"
                    >
                      Edit Only All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const allowedSet = resolveAssignedModulesToNavTabs(assignedModules, accessLevel);
                        const next: Record<string, UserSideMenuPermission> = { ...sideMenuPerms };
                        SIDE_MENU_DEFINITIONS.filter((m) => allowedSet.has(m.id)).forEach((m) => {
                          next[m.id] = { viewOnly: false, entry: false, edit: false, delete: true };
                        });
                        setSideMenuPerms(next);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-[10px] cursor-pointer"
                    >
                      Delete Only All
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                        <th className="py-2.5 px-4">Side Menu Item</th>
                        <th className="py-2.5 px-2.5 text-center w-24 text-blue-800 bg-blue-50/40">
                          <div className="flex items-center justify-center space-x-1">
                            <Eye className="w-3 h-3 text-blue-600" />
                            <span>View Only</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-2.5 text-center w-24 text-emerald-800 bg-emerald-50/40">
                          <div className="flex items-center justify-center space-x-1">
                            <PlusSquare className="w-3 h-3 text-emerald-600" />
                            <span>Entry (New)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-2.5 text-center w-20 text-teal-800 bg-teal-50/40">
                          <div className="flex items-center justify-center space-x-1">
                            <Edit3 className="w-3 h-3 text-teal-600" />
                            <span>Edit</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-2.5 text-center w-24 text-rose-800 bg-rose-50/40">
                          <div className="flex items-center justify-center space-x-1">
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            <span>Delete</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 text-right w-40">Quick</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {SIDE_MENU_DEFINITIONS.filter((item) =>
                        resolveAssignedModulesToNavTabs(assignedModules, accessLevel).has(item.id)
                      ).map((item) => {
                        const p = sideMenuPerms[item.id] || {
                          viewOnly: false,
                          entry: false,
                          edit: false,
                          delete: false,
                        };
                        const isAllChecked = p.viewOnly && p.entry && p.edit && p.delete;

                        return (
                          <tr key={item.id} className="hover:bg-[#F7FAF8] transition-colors">
                            <td className="py-2.5 px-4">
                              <div className="font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                                <span>{item.name}</span>
                                <span className="text-[10px] font-normal text-slate-400">
                                  · {item.category}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1 mt-1">
                                {isAllChecked ? (
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                                    Can Do All (View + Add New + Edit + Delete)
                                  </span>
                                ) : (
                                  <>
                                    {p.viewOnly && (
                                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                                        Option to View
                                      </span>
                                    )}
                                    {p.entry && (
                                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                        Add New
                                      </span>
                                    )}
                                    {p.edit && (
                                      <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                                        Edit
                                      </span>
                                    )}
                                    {p.delete && (
                                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                                        Can Delete
                                      </span>
                                    )}
                                    {!p.viewOnly && !p.entry && !p.edit && !p.delete && (
                                      <span className="text-[10px] text-slate-400 italic">
                                        No action checkbox ticked
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>

                            {/* View Only */}
                            <td className="py-2.5 px-2.5 text-center bg-blue-50/10">
                              <input
                                type="checkbox"
                                checked={p.viewOnly}
                                onChange={() => handleToggleSideMenuCheckbox(item.id, 'viewOnly')}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            {/* Entry (New) */}
                            <td className="py-2.5 px-2.5 text-center bg-emerald-50/10">
                              <input
                                type="checkbox"
                                checked={p.entry}
                                onChange={() => handleToggleSideMenuCheckbox(item.id, 'entry')}
                                className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45] cursor-pointer"
                              />
                            </td>

                            {/* Edit */}
                            <td className="py-2.5 px-2.5 text-center bg-teal-50/10">
                              <input
                                type="checkbox"
                                checked={p.edit}
                                onChange={() => handleToggleSideMenuCheckbox(item.id, 'edit')}
                                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                              />
                            </td>

                            {/* Delete */}
                            <td className="py-2.5 px-2.5 text-center bg-rose-50/10">
                              <input
                                type="checkbox"
                                checked={p.delete}
                                onChange={() => handleToggleSideMenuCheckbox(item.id, 'delete')}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                              />
                            </td>

                            {/* Quick Preset */}
                            <td className="py-2.5 px-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end space-x-1">
                                <button
                                  type="button"
                                  onClick={() => handleSetRowSideMenuPreset(item.id, 'all')}
                                  title="Tick All 4 (Can Do All)"
                                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded border cursor-pointer ${
                                    isAllChecked
                                      ? 'bg-[#168A45] text-white border-[#168A45]'
                                      : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                  }`}
                                >
                                  All
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRowSideMenuPreset(item.id, 'viewOnly')}
                                  title="View Only"
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200 hover:bg-blue-50 rounded cursor-pointer"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRowSideMenuPreset(item.id, 'entryOnly')}
                                  title="Entry Only (Add New)"
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-50 rounded cursor-pointer"
                                >
                                  Add
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRowSideMenuPreset(item.id, 'editOnly')}
                                  title="Edit Only"
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200 hover:bg-teal-50 rounded cursor-pointer"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSetRowSideMenuPreset(item.id, 'deleteOnly')}
                                  title="Delete Only"
                                  className="px-1.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200 hover:bg-rose-50 rounded cursor-pointer"
                                >
                                  Del
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
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              Select a staff member from the left directory to configure their System Access and Assigned Modules.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
