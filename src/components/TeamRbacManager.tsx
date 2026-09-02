import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Search,
  Filter,
  Check,
  RotateCcw,
  Save,
  Lock,
  Mail,
  Phone,
  Sliders,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { User, UserRole } from '../types';
import {
  ROLE_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSION_METADATA,
  RolePermissionConfig,
  getEffectivePermissions,
  hasPermission,
} from '../utils/rbac';
import { storage } from '../services/storageService';

interface TeamRbacManagerProps {
  users: User[];
  currentUser: User;
  onSaveUser: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
}

export const TeamRbacManager: React.FC<TeamRbacManagerProps> = ({
  users,
  currentUser,
  onSaveUser,
  onUpdateUser,
  onDeleteUser,
}) => {
  const canManage = hasPermission.canManageUsers(currentUser);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | UserRole>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);

  // Form state for adding member
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '',
    email: '',
    mobile: '',
    role: 'Salesperson',
    status: 'Active',
  });

  // Custom RBAC state
  const [isCustomizingRbac, setIsCustomizingRbac] = useState(false);
  const [rbacConfig, setRbacConfig] = useState<Record<UserRole, RolePermissionConfig>>(() => {
    const stored = storage.getRolePermissions();
    return {
      Admin: stored?.Admin ? (stored.Admin as any) : { ...DEFAULT_ROLE_PERMISSIONS.Admin },
      Manager: stored?.Manager ? (stored.Manager as any) : { ...DEFAULT_ROLE_PERMISSIONS.Manager },
      Salesperson: stored?.Salesperson ? (stored.Salesperson as any) : { ...DEFAULT_ROLE_PERMISSIONS.Salesperson },
    };
  });
  const [hasCustomOverrides, setHasCustomOverrides] = useState<boolean>(() => {
    return storage.getRolePermissions() !== null;
  });

  // Toast / feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync users list whenever props update
  const [userList, setUserList] = useState<User[]>(users);
  useEffect(() => {
    setUserList(users);
  }, [users]);

  // Filtered users
  const filteredUsers = userList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.mobile.includes(searchQuery) ||
      u.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // User Stats
  const activeCount = userList.filter((u) => u.status === 'Active').length;
  const adminCount = userList.filter((u) => u.role === 'Admin').length;
  const managerCount = userList.filter((u) => u.role === 'Manager').length;
  const repCount = userList.filter((u) => u.role === 'Salesperson').length;

  // --- Handlers ---
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Only administrators can add new team accounts.');
      return;
    }
    if (!newUser.name?.trim()) {
      alert('Please enter member full name.');
      return;
    }

    const nextId = `USR-${String(userList.length + 1).padStart(3, '0')}`;
    const userToSave: User = {
      id: nextId,
      name: newUser.name.trim(),
      email: newUser.email?.trim() || '',
      mobile: newUser.mobile?.trim() || '',
      role: (newUser.role as UserRole) || 'Salesperson',
      status: (newUser.status as 'Active' | 'Inactive') || 'Active',
    };

    onSaveUser(userToSave);
    setUserList((prev) => [...prev, userToSave]);
    setIsAddModalOpen(false);
    setNewUser({
      name: '',
      email: '',
      mobile: '',
      role: 'Salesperson',
      status: 'Active',
    });
    showToast(`Team member "${userToSave.name}" (${userToSave.role}) created successfully!`);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Only administrators can update team member details.');
      return;
    }
    if (!editingUser) return;

    if (onUpdateUser) {
      onUpdateUser(editingUser);
    } else {
      onSaveUser(editingUser);
    }

    setUserList((prev) => prev.map((u) => (u.id === editingUser.id ? editingUser : u)));
    setEditingUser(null);
    showToast(`Member "${editingUser.name}" details updated successfully.`);
  };

  const handleInlineRoleChange = (user: User, newRole: UserRole) => {
    if (!canManage) {
      alert('Only administrators can reassign user roles.');
      return;
    }
    const updated = { ...user, role: newRole };
    if (onUpdateUser) {
      onUpdateUser(updated);
    } else {
      onSaveUser(updated);
    }
    setUserList((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    showToast(`Updated ${user.name}'s role to ${newRole}.`);
  };

  const handleToggleStatus = (user: User) => {
    if (!canManage) {
      alert('Only administrators can activate or deactivate accounts.');
      return;
    }
    const newStatus: 'Active' | 'Inactive' = user.status === 'Active' ? 'Inactive' : 'Active';
    const updated = { ...user, status: newStatus };
    if (onUpdateUser) {
      onUpdateUser(updated);
    } else {
      onSaveUser(updated);
    }
    setUserList((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
    showToast(`${user.name} is now ${newStatus}.`);
  };

  const handleDeleteConfirm = () => {
    if (!canManage) {
      alert('Only administrators can delete team accounts.');
      return;
    }
    if (!deleteTargetUser) return;

    if (deleteTargetUser.id === currentUser.id) {
      alert('Cannot delete your own active administrator account.');
      setDeleteTargetUser(null);
      return;
    }

    if (onDeleteUser) {
      onDeleteUser(deleteTargetUser.id);
    } else {
      storage.deleteUser(deleteTargetUser.id);
    }

    setUserList((prev) => prev.filter((u) => u.id !== deleteTargetUser.id));
    showToast(`Team member "${deleteTargetUser.name}" has been removed.`);
    setDeleteTargetUser(null);
  };

  // --- RBAC Customizer Handlers ---
  const handleTogglePermission = (role: UserRole, key: keyof RolePermissionConfig) => {
    if (!canManage) return;
    setRbacConfig((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: !prev[role][key],
      },
    }));
  };

  const handleSaveRbac = () => {
    if (!canManage) {
      alert('Only administrators can modify system RBAC rules.');
      return;
    }
    storage.saveRolePermissions(rbacConfig);
    setHasCustomOverrides(true);
    setIsCustomizingRbac(false);
    showToast('Role-Based Access Control permissions updated and active!');
  };

  const handleResetRbac = () => {
    if (!canManage) return;
    if (confirm('Reset all RBAC role permissions back to default recommended settings?')) {
      storage.resetRolePermissions();
      setRbacConfig({
        Admin: { ...DEFAULT_ROLE_PERMISSIONS.Admin },
        Manager: { ...DEFAULT_ROLE_PERMISSIONS.Manager },
        Salesperson: { ...DEFAULT_ROLE_PERMISSIONS.Salesperson },
      });
      setHasCustomOverrides(false);
      setIsCustomizingRbac(false);
      showToast('RBAC permissions reset to system default standards.');
    }
  };

  // Group permission metadata by category
  const categories = Array.from(new Set(PERMISSION_METADATA.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="bg-[#EAF7EF] border border-[#168A45] text-[#0B5D2A] text-xs font-bold px-4 py-3 rounded-xl flex items-center justify-between shadow-xs transition-all animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-[#0B5D2A] hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-slate-400 block text-[11px] font-medium">Total Team</span>
          <div className="text-lg font-bold text-slate-800 mt-0.5 flex items-center justify-between">
            <span>{userList.length}</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-slate-400 block text-[11px] font-medium">Active Accounts</span>
          <div className="text-lg font-bold text-[#168A45] mt-0.5 flex items-center justify-between">
            <span>{activeCount}</span>
            <span className="w-2 h-2 rounded-full bg-[#168A45]"></span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-slate-400 block text-[11px] font-medium">Admins</span>
          <div className="text-lg font-bold text-[#0B5D2A] mt-0.5">
            <span>{adminCount}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <span className="text-slate-400 block text-[11px] font-medium">Managers</span>
          <div className="text-lg font-bold text-teal-800 mt-0.5">
            <span>{managerCount}</span>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs col-span-2 sm:col-span-1">
          <span className="text-slate-400 block text-[11px] font-medium">Sales Reps</span>
          <div className="text-lg font-bold text-emerald-800 mt-0.5">
            <span>{repCount}</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#168A45]" />
                Role-Based Access Control (RBAC) Permissions Matrix
              </h3>
              {hasCustomOverrides && (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Customized Overrides
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Defines operational boundaries, data visibility, and lead/proposal control across user roles
            </p>
          </div>

          {canManage && (
            <div className="flex items-center space-x-2">
              {isCustomizingRbac ? (
                <>
                  <button
                    type="button"
                    onClick={handleResetRbac}
                    className="bg-white hover:bg-slate-50 text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Defaults</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRbac}
                    className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all active:scale-98"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Permissions</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCustomizingRbac(true)}
                  className="bg-[#EAF7EF] hover:bg-[#168A45] text-[#0B5D2A] hover:text-white border border-[#D9E5DD] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Customize Permissions</span>
                </button>
              )}
            </div>
          )}
        </div>

        {isCustomizingRbac && (
          <div className="bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Editing Permissions Mode:</strong> Click any checkbox in the matrix below to enable or disable specific operational capabilities for each role. Click <strong>Save Permissions</strong> when done.
              </span>
            </div>
            <button
              onClick={() => setIsCustomizingRbac(false)}
              className="text-emerald-700 hover:text-emerald-900 font-bold ml-3"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Permissions Table Grouped by Category */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-slate-500 uppercase text-[10px] font-bold bg-slate-50/80">
                <th className="py-2.5 px-3">Capability / Operation</th>
                <th className="py-2.5 px-3 w-32 text-center bg-emerald-50/40 text-[#0B5D2A]">
                  Admin
                </th>
                <th className="py-2.5 px-3 w-32 text-center text-teal-800">
                  Manager
                </th>
                <th className="py-2.5 px-3 w-32 text-center text-emerald-800">
                  Salesperson
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {categories.map((category) => {
                const perms = PERMISSION_METADATA.filter((p) => p.category === category);
                return (
                  <React.Fragment key={category}>
                    <tr className="bg-slate-100/60 font-bold text-slate-800 text-[11px]">
                      <td colSpan={4} className="py-2 px-3 tracking-wide">
                        {category}
                      </td>
                    </tr>
                    {perms.map((p) => {
                      const adminVal = rbacConfig.Admin[p.key];
                      const managerVal = rbacConfig.Manager[p.key];
                      const salesVal = rbacConfig.Salesperson[p.key];

                      return (
                        <tr key={p.key} className="hover:bg-[#F7FAF8] transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{p.label}</div>
                            <div className="text-[11px] text-slate-400">{p.description}</div>
                          </td>

                          {/* Admin Cell */}
                          <td className="py-2.5 px-3 text-center bg-emerald-50/20">
                            {isCustomizingRbac ? (
                              <input
                                type="checkbox"
                                checked={adminVal}
                                onChange={() => handleTogglePermission('Admin', p.key)}
                                className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45] cursor-pointer"
                              />
                            ) : adminVal ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                                <Check className="w-3 h-3 mr-0.5 inline" /> Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">
                                Restricted
                              </span>
                            )}
                          </td>

                          {/* Manager Cell */}
                          <td className="py-2.5 px-3 text-center">
                            {isCustomizingRbac ? (
                              <input
                                type="checkbox"
                                checked={managerVal}
                                onChange={() => handleTogglePermission('Manager', p.key)}
                                className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45] cursor-pointer"
                              />
                            ) : managerVal ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                                <Check className="w-3 h-3 mr-0.5 inline" /> Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">
                                Restricted
                              </span>
                            )}
                          </td>

                          {/* Salesperson Cell */}
                          <td className="py-2.5 px-3 text-center">
                            {isCustomizingRbac ? (
                              <input
                                type="checkbox"
                                checked={salesVal}
                                onChange={() => handleTogglePermission('Salesperson', p.key)}
                                className="w-4 h-4 rounded text-[#168A45] focus:ring-[#168A45] cursor-pointer"
                              />
                            ) : salesVal ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF7EF] text-[#168A45] border border-[#D9E5DD]">
                                <Check className="w-3 h-3 mr-0.5 inline" /> Allowed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-400">
                                Restricted
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: TEAM MEMBERS & ACCOUNTS MANAGEMENT */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#168A45]" />
              Team Members & Role Assignments (Google Sheets Users Table)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit individual member roles, contact details, status, or onboard new representatives
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Add Team Member</span>
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member by name, email, phone, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
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

          <div className="flex items-center space-x-2 text-xs">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#168A45]"
            >
              <option value="All">All Roles ({userList.length})</option>
              <option value="Admin">Admins ({adminCount})</option>
              <option value="Manager">Managers ({managerCount})</option>
              <option value="Salesperson">Sales Reps ({repCount})</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-[#168A45]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only ({activeCount})</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-slate-500 uppercase text-[10px] font-bold bg-slate-50">
                <th className="py-2.5 px-3">User ID</th>
                <th className="py-2.5 px-3">Member Name</th>
                <th className="py-2.5 px-3">Email & Contact</th>
                <th className="py-2.5 px-3">Role & Access Level</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                {canManage && <th className="py-2.5 px-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No team members found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-[#F7FAF8] transition-colors ${
                        isCurrent ? 'bg-[#EAF7EF]/30 font-medium' : ''
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-[#0B5D2A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {u.id}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-[#168A45] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {ROLE_DEFINITIONS[u.role]?.title || u.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center space-x-1 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email || '—'}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{u.mobile || '—'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {canManage ? (
                          <select
                            value={u.role}
                            onChange={(e) => handleInlineRoleChange(u, e.target.value as UserRole)}
                            className={`text-[11px] font-bold px-2 py-1 rounded border cursor-pointer focus:outline-none ${
                              u.role === 'Admin'
                                ? 'bg-emerald-50 text-[#0B5D2A] border-emerald-300'
                                : u.role === 'Manager'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-[#EAF7EF] text-[#168A45] border-[#D9E5DD]'
                            }`}
                          >
                            <option value="Admin">Admin (Full Control)</option>
                            <option value="Manager">Manager (Team View)</option>
                            <option value="Salesperson">Salesperson (Own Leads)</option>
                          </select>
                        ) : (
                          <span
                            className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                              u.role === 'Admin'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : u.role === 'Manager'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : 'bg-[#EAF7EF] text-[#168A45] border-[#D9E5DD]'
                            }`}
                          >
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {canManage ? (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              u.status === 'Active'
                                ? 'bg-[#EAF7EF] text-[#0B5D2A] border-emerald-300 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-gray-200 hover:bg-slate-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {u.status === 'Active' ? '● Active' : '○ Inactive'}
                          </button>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              u.status === 'Active'
                                ? 'bg-[#EAF7EF] text-[#0B5D2A] border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-gray-200'
                            }`}
                          >
                            {u.status}
                          </span>
                        )}
                      </td>

                      {canManage && (
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingUser({ ...u })}
                              className="p-1.5 text-slate-400 hover:text-[#168A45] hover:bg-emerald-50 rounded-md transition-colors"
                              title="Edit Member Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isCurrent}
                              onClick={() => setDeleteTargetUser(u)}
                              className={`p-1.5 rounded-md transition-colors ${
                                isCurrent
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                              title={isCurrent ? 'Cannot delete logged in user' : 'Delete Member'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD NEW TEAM MEMBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4 text-[#168A45]" />
                <h4 className="font-bold text-sm text-slate-800">Add Team Member</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. rahul.v@casbiro.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98450 11223"
                    value={newUser.mobile}
                    onChange={(e) => setNewUser({ ...newUser, mobile: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assigned RBAC Role <span className="text-red-500">*</span>
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-[#168A45]"
                >
                  <option value="Admin">Admin (Full Control, Reassign & System Settings)</option>
                  <option value="Manager">Manager (Team Leads Overview & Reassign)</option>
                  <option value="Salesperson">Salesperson (Assigned Leads & Follow-ups)</option>
                </select>
              </div>

              {/* Role Scope Card Preview */}
              {newUser.role && (
                <div className="bg-[#F7FAF8] border border-gray-200 rounded-lg p-3 text-[11px] text-slate-600 space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#168A45]" />
                    {ROLE_DEFINITIONS[newUser.role as UserRole]?.title} Access Scope:
                  </div>
                  <p>{ROLE_DEFINITIONS[newUser.role as UserRole]?.description}</p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={newUser.status}
                  onChange={(e) => setNewUser({ ...newUser, status: e.target.value as any })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                >
                  <option value="Active">Active (Can log in & receive leads)</option>
                  <option value="Inactive">Inactive (Disabled)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Save Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING MEMBER */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-50 border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-4 h-4 text-[#168A45]" />
                <h4 className="font-bold text-sm text-slate-800">
                  Edit Member: <span className="text-[#0B5D2A]">{editingUser.name}</span>
                </h4>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-gray-200">
                <span className="font-bold text-slate-600">User ID:</span>
                <span className="font-mono font-bold text-[#0B5D2A]">{editingUser.id}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={editingUser.mobile}
                    onChange={(e) => setEditingUser({ ...editingUser, mobile: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-[#168A45]"
                >
                  <option value="Admin">Admin (Full Unrestricted Access)</option>
                  <option value="Manager">Manager (Pipeline Management & Reassignment)</option>
                  <option value="Salesperson">Salesperson (Assigned Leads & Follow-ups)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg text-xs shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm shadow-xl p-5 space-y-4 animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="font-bold text-sm text-slate-800">Delete Team Member?</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to remove <strong>{deleteTargetUser.name}</strong> ({deleteTargetUser.id}) from the CRM?
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-3.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Yes, Delete Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
