import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  Search,
  LayoutDashboard,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  CheckSquare,
  Eye,
  PlusCircle,
  Edit3,
  Trash2,
  Building2,
  Briefcase,
  UserCheck,
  Receipt,
  ShoppingBag,
  Boxes,
  Wallet,
  FileCheck,
  Laptop,
  Settings,
  Sliders,
  Sparkles,
  Users,
  Clock,
  CreditCard,
  Award,
  FileSpreadsheet,
  CalendarClock,
  FileText,
  Mail,
  Video,
  BarChart3,
  Landmark,
  ArrowRightLeft,
  Wrench,
  Calendar,
  Bell,
  History,
  Layers,
  UserCog,
} from 'lucide-react';
import { User } from '../types';
import { StaffMember, DepartmentMaster } from '../types/hr';
import { NavTab, SettingsSubTab } from './Sidebar';
import {
  SIDE_MENU_DEFINITIONS,
  getUserMenuPermissions,
  getAllowedNavTabsForUser,
  hasCustomUserMenuPermissions,
} from '../utils/menuPermissions';
import { ROLE_DEFINITIONS } from '../utils/rbac';

interface UserAuthorizedPagesPortalProps {
  currentUser: User;
  allUsers: User[];
  allStaff: StaffMember[];
  departments: DepartmentMaster[];
  onSwitchUser: (user: User) => void;
  onNavigateTab: (tab: NavTab, settingsSubTab?: SettingsSubTab) => void;
  onOpenMenuPermissionsModal?: (user: User) => void;
}

const SETTINGS_SUBTABS = new Set<string>([
  'pricing',
  'company',
  'proposal',
  'templates',
  'users',
  'import',
  'integrations',
  'themes',
]);

const getMenuIcon = (menuId: string, categoryIcon?: string) => {
  if (menuId === 'dashboard' || menuId.endsWith('-dashboard') || menuId === 'lead-overview' || menuId === 'asset-overview') {
    return LayoutDashboard;
  }
  if (menuId === 'hr-branch-dashboard') return Building2;
  if (menuId === 'leads' || menuId === 'party-management' || menuId === 'users') return Users;
  if (menuId === 'followups' || menuId === 'hr-recruitment-interviews') return CalendarClock;
  if (menuId === 'proposals' || menuId === 'sales-quotation' || menuId === 'purchase-request') return FileText;
  if (menuId === 'meet') return Video;
  if (menuId === 'gmail') return Mail;
  if (menuId === 'reports' || menuId.endsWith('-report') || menuId.endsWith('-reports')) return BarChart3;
  if (menuId === 'hr-staff') return UserCheck;
  if (menuId === 'hr-staff-access') return ShieldCheck;
  if (menuId === 'hr-attendance') return Clock;
  if (menuId === 'hr-payroll' || menuId === 'finance-cash-bank' || menuId === 'finance-payments') return CreditCard;
  if (menuId === 'hr-kpi' || menuId === 'purchase-quotation-comparison') return Award;
  if (menuId === 'hr-settings' || menuId === 'asset-settings' || menuId === 'finance-planner') return Sliders;
  if (menuId.startsWith('sales-')) return Receipt;
  if (menuId.startsWith('purchase-') || menuId === 'goods-receipt') return ShoppingBag;
  if (menuId.startsWith('inventory-')) return Boxes;
  if (menuId.startsWith('finance-')) return Wallet;
  if (menuId.startsWith('doc-')) return FileCheck;
  if (menuId.startsWith('asset-')) return Laptop;
  if (categoryIcon === 'Settings') return Settings;
  if (categoryIcon === 'Briefcase') return Briefcase;
  return Layers;
};

export const UserAuthorizedPagesPortal: React.FC<UserAuthorizedPagesPortalProps> = ({
  currentUser,
  allUsers,
  allStaff,
  departments,
  onSwitchUser,
  onNavigateTab,
  onOpenMenuPermissionsModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [previewUserId, setPreviewUserId] = useState<string>(currentUser.id);

  // Sync previewUserId when currentUser changes
  React.useEffect(() => {
    setPreviewUserId(currentUser.id);
  }, [currentUser.id]);

  const isCurrentUserAdmin =
    currentUser.role === 'Admin' ||
    currentUser.accessLevel === 'Admin' ||
    currentUser.accessLevel === 'Administrator' ||
    currentUser.accessLevel === 'Super Admin';

  const targetUser = useMemo(() => {
    if (!isCurrentUserAdmin) return currentUser;
    return allUsers.find((u) => u.id === previewUserId) || currentUser;
  }, [isCurrentUserAdmin, allUsers, previewUserId, currentUser]);

  const matchedStaff = useMemo(() => {
    return (
      allStaff.find(
        (s) =>
          (targetUser.staffId && s.staffId === targetUser.staffId) ||
          (targetUser.userId &&
            s.systemAccess?.username?.toLowerCase() === targetUser.userId.toLowerCase()) ||
          (targetUser.email && s.email?.toLowerCase() === targetUser.email.toLowerCase())
      ) || null
    );
  }, [allStaff, targetUser]);

  const targetUserDept = useMemo(() => {
    const deptCode = matchedStaff?.department || targetUser.departmentCode || targetUser.department;
    if (!deptCode) return null;
    return (
      departments.find(
        (d) =>
          d.departmentCode.toLowerCase() === deptCode.toLowerCase() ||
          d.departmentName.toLowerCase() === deptCode.toLowerCase()
      ) || null
    );
  }, [departments, matchedStaff, targetUser]);

  const allowedNavTabsSet = useMemo(() => {
    return getAllowedNavTabsForUser(
      targetUser,
      matchedStaff,
      targetUserDept?.allowedMenuIds || null
    );
  }, [targetUser, matchedStaff, targetUserDept]);

  const detailedMenuPerms = useMemo(() => {
    return getUserMenuPermissions(targetUser);
  }, [targetUser, matchedStaff]);

  const isCustomConfigured = useMemo(() => {
    return hasCustomUserMenuPermissions(targetUser.id);
  }, [targetUser.id]);

  // Filter SIDE_MENU_DEFINITIONS so ONLY allowed menus are shown, and all others are strictly hidden
  const authorizedMenus = useMemo(() => {
    return SIDE_MENU_DEFINITIONS.filter((menu) => {
      // Check if allowed by master resolver (null = unrestricted Admin)
      const isAllowed =
        allowedNavTabsSet === null ? true : allowedNavTabsSet.has(menu.id);
      if (!isAllowed) return false;

      if (selectedCategory !== 'ALL' && menu.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          menu.name.toLowerCase().includes(q) ||
          menu.category.toLowerCase().includes(q) ||
          menu.description.toLowerCase().includes(q) ||
          menu.id.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allowedNavTabsSet, selectedCategory, searchQuery]);

  // Categories that actually have at least 1 allowed menu for this user (hide empty categories!)
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    SIDE_MENU_DEFINITIONS.forEach((menu) => {
      const isAllowed =
        allowedNavTabsSet === null ? true : allowedNavTabsSet.has(menu.id);
      if (isAllowed) {
        cats.add(menu.category);
      }
    });
    return Array.from(cats);
  }, [allowedNavTabsSet]);

  const groupedMenus = useMemo(() => {
    const groups: Record<string, typeof SIDE_MENU_DEFINITIONS> = {};
    authorizedMenus.forEach((menu) => {
      if (!groups[menu.category]) {
        groups[menu.category] = [];
      }
      groups[menu.category].push(menu);
    });
    return groups;
  }, [authorizedMenus]);

  const totalAuthorizedCount = useMemo(() => {
    return SIDE_MENU_DEFINITIONS.filter((m) =>
      allowedNavTabsSet === null ? true : allowedNavTabsSet.has(m.id)
    ).length;
  }, [allowedNavTabsSet]);

  const totalHiddenCount = SIDE_MENU_DEFINITIONS.length - totalAuthorizedCount;

  const handleOpenPage = (menuId: string) => {
    // If admin is previewing another user and clicks a page, optionally switch to that user or navigate directly
    if (SETTINGS_SUBTABS.has(menuId)) {
      onNavigateTab('settings', menuId as SettingsSubTab);
      return;
    }
    onNavigateTab(menuId as NavTab);
  };

  const roleDef = ROLE_DEFINITIONS[targetUser.role] || ROLE_DEFINITIONS.Staff;

  return (
    <div className="space-y-6">
      {/* Top User Access Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="bg-gradient-to-r from-[#0B5D2A] via-[#137539] to-[#168A45] px-6 py-5 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-center text-lg font-black shrink-0">
                {targetUser.avatar || targetUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-100 border border-white/20">
                    Authorized User Workspace
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-100 border border-amber-300/30">
                    {targetUser.accessLevel || targetUser.role}
                  </span>
                  {matchedStaff?.staffCode && (
                    <span className="text-[11px] font-mono bg-black/20 px-2.5 py-0.5 rounded-full text-emerald-100">
                      {matchedStaff.staffCode}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold tracking-tight mt-1">
                  {targetUser.name} &mdash; Allowed Pages &amp; Menus
                </h2>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Showing <strong className="text-white">{totalAuthorizedCount} allowed menus</strong> assigned to this account.
                  {totalHiddenCount > 0 && (
                    <span>
                      {' '}
                      <strong className="text-amber-200">{totalHiddenCount} unauthorized menus</strong> are strictly hidden from navigation and blocked.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Admin User Switcher / Customizer Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isCurrentUserAdmin && (
                <div className="flex items-center bg-black/20 border border-white/20 rounded-xl px-3 py-1.5 space-x-2">
                  <UserCog className="w-4 h-4 text-emerald-200 shrink-0" />
                  <div className="text-left">
                    <label className="block text-[9px] uppercase tracking-wider text-emerald-200 font-bold">
                      Inspect / Switch User
                    </label>
                    <select
                      value={targetUser.id}
                      onChange={(e) => {
                        const nextUser = allUsers.find((u) => u.id === e.target.value);
                        if (nextUser) {
                          setPreviewUserId(nextUser.id);
                          setSelectedCategory('ALL');
                        }
                      }}
                      className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer pr-2"
                    >
                      {allUsers.map((u) => (
                        <option key={u.id} value={u.id} className="text-slate-900 font-medium">
                          {u.name} ({u.role}{u.department ? ` • ${u.department}` : ''})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {isCurrentUserAdmin && targetUser.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={() => onSwitchUser(targetUser)}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Login as {targetUser.name.split(' ')[0]}</span>
                </button>
              )}

              {isCurrentUserAdmin && onOpenMenuPermissionsModal && (
                <button
                  type="button"
                  onClick={() => onOpenMenuPermissionsModal(targetUser)}
                  className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-semibold text-xs transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Configure Allowed Menus</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className="px-3.5 py-2 rounded-xl bg-white text-[#0B5D2A] hover:bg-emerald-50 font-bold text-xs transition-all cursor-pointer shadow-xs flex items-center space-x-1.5"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#168A45]" />
                <span>Staff Dashboard & Attendance</span>
              </button>
            </div>
          </div>
        </div>

        {/* Access Summary Bar */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-1.5 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Visible Pages: <strong className="text-slate-900">{totalAuthorizedCount}</strong>
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-600">
              <Lock className="w-3.5 h-3.5 text-rose-500" />
              <span>
                Hidden Menus: <strong className="text-rose-600">{totalHiddenCount}</strong>
              </span>
            </div>
            {(matchedStaff?.branchName || targetUser.department) && (
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Branch / Dept:{' '}
                  <strong className="text-slate-800">
                    {[matchedStaff?.branchName, matchedStaff?.department || targetUser.department]
                      .filter(Boolean)
                      .join(' • ')}
                  </strong>
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Permission Policy:{' '}
                <strong className="text-slate-800">
                  {isCustomConfigured
                    ? 'Custom User Menu Matrix'
                    : matchedStaff?.systemAccess?.assignedModules?.length || targetUser.assignedModules?.length
                    ? 'Staff Onboarding Assigned Modules'
                    : targetUserDept
                    ? `Department Policy (${targetUserDept.departmentName})`
                    : `${roleDef.label} Role Policy`}
                </strong>
              </span>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search allowed pages..."
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 w-52"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Tabs (Only shows categories where user has at least 1 allowed menu) */}
        {availableCategories.length > 1 && (
          <div className="px-6 py-2.5 bg-white flex items-center gap-1.5 overflow-x-auto border-b border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-[#0B5D2A] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All Allowed Categories ({totalAuthorizedCount})
            </button>
            {availableCategories.map((cat) => {
              const count = SIDE_MENU_DEFINITIONS.filter(
                (m) =>
                  m.category === cat &&
                  (allowedNavTabsSet === null ? true : allowedNavTabsSet.has(m.id))
              ).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#0B5D2A] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Authorized Pages Cards Grouped by Category */}
      {Object.keys(groupedMenus).length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Allowed Menus Match Your Filter</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Only menus explicitly authorized for {targetUser.name} are displayed here. All unauthorized modules are hidden.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedMenus) as [string, typeof SIDE_MENU_DEFINITIONS][]).map(([categoryName, menus]) => (
            <div
              key={categoryName}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#168A45]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    {categoryName}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  {menus.length} {menus.length === 1 ? 'Allowed Menu' : 'Allowed Menus'}
                </span>
              </div>

              <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {menus.map((menu) => {
                  const Icon = getMenuIcon(menu.id, menu.categoryIcon);
                  const perm = detailedMenuPerms[menu.id] || {
                    viewOnly: true,
                    entry: targetUser.accessLevel !== 'Read-Only',
                    edit: targetUser.role === 'Admin' || targetUser.role === 'Manager',
                    delete: targetUser.role === 'Admin',
                  };

                  const isAllFourTicked = perm.viewOnly && perm.entry && perm.edit && perm.delete;

                  return (
                    <div
                      key={menu.id}
                      onClick={() => handleOpenPage(menu.id)}
                      className="group relative rounded-xl border border-slate-200/90 hover:border-[#168A45] bg-white hover:bg-[#F7FAF8]/60 p-4 transition-all cursor-pointer shadow-2xs hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#168A45] group-hover:bg-[#168A45] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0B5D2A] transition-colors">
                                {menu.name}
                              </h4>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400">
                                  /{menu.id}
                                </span>
                                {isAllFourTicked && (
                                  <span className="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-200 px-1.5 py-0.2 rounded">
                                    Full Access (Can Do All)
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-[#168A45] group-hover:bg-emerald-50 transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                          {menu.description}
                        </p>
                      </div>

                      {/* Granular Action Rights Footer: View, Add New, Edit, Delete based on ticked checkboxes */}
                      <div
                        className="mt-4 pt-3 border-t border-slate-100 space-y-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span className="font-semibold">
                            {isAllFourTicked
                              ? 'All 4 Ticked — Can Do All:'
                              : 'Authorized Action Options:'}
                          </span>
                        </div>
                        <div className="flex items-center flex-wrap gap-1.5">
                          {perm.viewOnly && (
                            <button
                              type="button"
                              onClick={() => handleOpenPage(menu.id)}
                              title={`View ${menu.name}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          )}
                          {perm.entry && (
                            <button
                              type="button"
                              onClick={() => handleOpenPage(menu.id)}
                              title={`Add New in ${menu.name}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-[#168A45] text-emerald-800 hover:text-white border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <PlusCircle className="w-3 h-3" />
                              <span>Add New</span>
                            </button>
                          )}
                          {perm.edit && (
                            <button
                              type="button"
                              onClick={() => handleOpenPage(menu.id)}
                              title={`Edit records in ${menu.name}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 hover:bg-teal-600 text-teal-800 hover:text-white border border-teal-200 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          )}
                          {perm.delete && (
                            <button
                              type="button"
                              onClick={() => handleOpenPage(menu.id)}
                              title={`Delete records in ${menu.name}`}
                              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
