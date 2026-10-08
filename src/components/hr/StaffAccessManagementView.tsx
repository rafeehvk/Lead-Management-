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
} from 'lucide-react';
import { StaffMember } from '../../types/hr';
import { User } from '../../types';
import { hrStorage } from '../../services/hrStorageService';
import { storage } from '../../services/storageService';
import { ONBOARDING_ASSIGNABLE_MODULES, resolveAssignedModulesToNavTabs } from '../../utils/menuPermissions';

interface StaffAccessManagementViewProps {
  staff?: StaffMember[];
  currentUser?: User | null;
  onSaveStaff?: (updatedStaff: Partial<StaffMember>) => void;
  onSwitchUser?: (user: User) => void;
}

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
    const fresh = hrStorage.getStaff();
    setStaffList(fresh);
  };

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q) ||
        (s.systemAccess?.username || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q);

      const staffBranch = s.branchLocation || s.systemAccess?.branchAccess || 'Kochi Main Campus';
      const matchesBranch = branchFilter === 'All' || staffBranch.toLowerCase() === branchFilter.toLowerCase();

      const loginActive = s.employmentStatus === 'Active' && s.systemAccess?.enableLogin !== false;
      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Enabled' && loginActive) ||
        (statusFilter === 'Disabled' && !loginActive);

      return matchesSearch && matchesBranch && matchesStatus;
    });
  }, [staffList, searchQuery, branchFilter, statusFilter]);

  const selectedStaff = useMemo(
    () => staffList.find((s) => s.id === selectedStaffId) || filteredStaff[0] || null,
    [staffList, selectedStaffId, filteredStaff]
  );

  // Editable System Access state for the selected staff member
  const [enableLogin, setEnableLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [userType, setUserType] = useState('Faculty / Staff');
  const [systemRole, setSystemRole] = useState('Staff');
  const [accessLevel, setAccessLevel] = useState<'Read-Only' | 'Standard' | 'Manager' | 'Administrator' | 'Super Admin'>('Standard');
  const [branchAccess, setBranchAccess] = useState('Kochi Main Campus');
  const [accountStatus, setAccountStatus] = useState<'Active' | 'Pending' | 'Suspended'>('Active');
  const [assignedModules, setAssignedModules] = useState<string[]>(['Dashboard']);

  useEffect(() => {
    if (!selectedStaff) return;
    const sa = selectedStaff.systemAccess;
    setEnableLogin(sa?.enableLogin ?? true);
    setUsername(
      sa?.username ||
        (selectedStaff.email
          ? selectedStaff.email.split('@')[0].toLowerCase()
          : selectedStaff.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.'))
    );
    setPassword(sa?.password || sa?.initialPassword || 'Password@123');
    setUserType(sa?.userType || selectedStaff.employeeCategory || 'Faculty / Staff');
    setSystemRole(sa?.role || 'Staff');
    setAccessLevel(sa?.accessLevel || 'Standard');
    setBranchAccess(sa?.branchAccess || selectedStaff.branchLocation || 'Kochi Main Campus');
    setAccountStatus(
      selectedStaff.employmentStatus === 'Active' ? sa?.accountStatus || 'Active' : 'Suspended'
    );
    setAssignedModules(
      sa?.assignedModules && sa.assignedModules.length > 0
        ? sa.assignedModules
        : ['Dashboard', 'HR & Staff Directory', 'Attendance & Leave']
    );
  }, [selectedStaff]);

  const handleToggleModule = (modId: string) => {
    if (assignedModules.includes(modId)) {
      setAssignedModules(assignedModules.filter((m) => m !== modId));
    } else {
      setAssignedModules([...assignedModules, modId]);
    }
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

    refreshLocalStaff();
    window.dispatchEvent(new CustomEvent('mysar_staff_access_changed'));
    setFeedbackBanner(
      `Saved System Access & Assigned Modules (${assignedModules.length} modules) for ${selectedStaff.fullName} (${selectedStaff.id}).`
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
    const text = `Staff Name: ${staffMember.fullName}\nEmployee ID: ${staffMember.id}\nLogin ID: ${uName}\nPassword: ${uPass}\nBranch: ${staffMember.branchLocation || 'Kochi Main Campus'}\nAssigned Modules: ${mods}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(staffMember.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resolvedNavTabsCount = useMemo(
    () => resolveAssignedModulesToNavTabs(assignedModules).length,
    [assignedModules]
  );

  // Summary KPIs
  const totalStaffCount = staffList.length;
  const activeLoginCount = staffList.filter(
    (s) => s.employmentStatus === 'Active' && s.systemAccess?.enableLogin !== false
  ).length;
  const restrictedCount = totalStaffCount - activeLoginCount;

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
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Onboard Staff &gt; System Access Sync
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
            <span className="text-sm font-black text-slate-900">{totalStaffCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Login Enabled</span>
            <span className="text-sm font-black text-emerald-900">{activeLoginCount}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200/80">
            <span className="text-[10px] text-rose-700 font-bold uppercase block">Restricted / Inactive</span>
            <span className="text-sm font-black text-rose-900">{restrictedCount}</span>
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
                            <span>{s.branchLocation || s.systemAccess?.branchAccess || 'Kochi Main Campus'}</span>
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
                    <div className="flex flex-wrap gap-1">
                      {mods.slice(0, 3).map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-semibold"
                        >
                          {m}
                        </span>
                      ))}
                      {mods.length > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          +{mods.length - 3} more
                        </span>
                      )}
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
                    <option value="Faculty / Staff">Faculty / Teaching Staff</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Manager">Department / Campus Manager</option>
                    <option value="Sales / Admissions">Sales / Admission Counselor</option>
                    <option value="Marketing">Marketing Executive</option>
                    <option value="CSR / Front Office">CSR / Front Office Desk</option>
                    <option value="Accountant">Finance &amp; Accountant</option>
                    <option value="HR Admin">HR Specialist / Admin</option>
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

              {/* Assigned Institutional Modules Selector */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
                      <Layers className="w-4 h-4 text-[#168A45]" />
                      <span>
                        Assigned Institutional Modules ({assignedModules.length} selected • {resolvedNavTabsCount} screens authorized)
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
