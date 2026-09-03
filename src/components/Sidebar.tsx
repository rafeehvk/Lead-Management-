import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  FileSpreadsheet,
  ArrowUpRight,
  Mail,
  Video,
  LogOut,
  ChevronDown,
  ChevronRight,
  Briefcase,
  UserCheck,
  UserSearch,
  Clock,
  CreditCard,
  Award,
  Sliders,
  Layers,
  Building2,
  Bell,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { hasPermission, ROLE_DEFINITIONS } from '../utils/rbac';

export type NavTab =
  | 'dashboard'
  | 'leads'
  | 'followups'
  | 'proposals'
  | 'meet'
  | 'gmail'
  | 'reports'
  | 'settings'
  | 'gashub'
  | 'hr-dashboard'
  | 'hr-recruitment'
  | 'hr-staff'
  | 'hr-attendance'
  | 'hr-payroll'
  | 'hr-kpi'
  | 'hr-settings';

export type SettingsSubTab = 'pricing' | 'company' | 'proposal' | 'users' | 'import' | 'integrations';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  leadsCount: number;
  followUpsTodayCount: number;
  proposalsPendingCount: number;
  pendingLeavesCount?: number;
  currentUser: User;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
  settingsSubTab?: SettingsSubTab;
  onSettingsSubTabChange?: (subTab: SettingsSubTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  leadsCount,
  followUpsTodayCount,
  proposalsPendingCount,
  pendingLeavesCount = 1,
  currentUser,
  onOpenNotifications,
  onLogout,
  settingsSubTab = 'pricing',
  onSettingsSubTabChange,
}) => {
  const canManageSettings = hasPermission.canManageSettings(currentUser);
  const roleDef = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.Salesperson;

  const isLeadTabActive = [
    'leads',
    'followups',
    'proposals',
    'meet',
    'gmail',
    'reports',
  ].includes(activeTab);

  const isHrTabActive = [
    'hr-dashboard',
    'hr-recruitment',
    'hr-staff',
    'hr-attendance',
    'hr-payroll',
    'hr-kpi',
    'hr-settings',
  ].includes(activeTab);

  const [isLeadManagementOpen, setIsLeadManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_lead_mgmt_open');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isHrManagementOpen, setIsHrManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_hr_mgmt_open');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_settings_open');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const toggleLeadManagement = () => {
    setIsLeadManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_lead_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const toggleHrManagement = () => {
    setIsHrManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_hr_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const toggleSettings = () => {
    setIsSettingsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_settings_open', String(next));
      } catch {}
      return next;
    });
  };

  const settingsItems: Array<{
    id: SettingsSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'pricing',
      label: 'Pricing Plan / Type Master',
      icon: Layers,
    },
    {
      id: 'proposal',
      label: 'Proposal Document Content',
      icon: FileText,
    },
    {
      id: 'company',
      label: 'Company & Branding',
      icon: Building2,
    },
    {
      id: 'import',
      label: 'Import Leads from CSV',
      icon: FileSpreadsheet,
    },
    {
      id: 'users',
      label: 'Team & RBAC Roles',
      icon: Users,
    },
    {
      id: 'integrations',
      label: 'Integrations & Automation',
      icon: Bell,
    },
  ];

  const leadManagementItems = [
    {
      id: 'leads' as NavTab,
      label: 'Leads',
      icon: Users,
      badge: leadsCount > 0 ? leadsCount : null,
      badgeColor: 'bg-slate-100 text-slate-700 border border-slate-200',
    },
    {
      id: 'followups' as NavTab,
      label: 'Follow-ups',
      icon: CalendarClock,
      badge: followUpsTodayCount > 0 ? followUpsTodayCount : null,
      badgeColor: 'bg-[#168A45] text-white font-bold',
    },
    {
      id: 'proposals' as NavTab,
      label: 'Proposals',
      icon: FileText,
      badge: proposalsPendingCount > 0 ? `${proposalsPendingCount} req` : null,
      badgeColor: 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]',
    },
    {
      id: 'meet' as NavTab,
      label: 'Google Meet',
      icon: Video,
      badge: 'Demos',
      badgeColor: 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200',
    },
    {
      id: 'gmail' as NavTab,
      label: 'Gmail Inbox',
      icon: Mail,
      badge: 'Live',
      badgeColor: 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200',
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports',
      icon: BarChart3,
      badge: null,
      badgeColor: undefined,
    },
  ];

  const hrManagementItems = [
    {
      id: 'hr-dashboard' as NavTab,
      label: 'HR Overview',
      icon: LayoutDashboard,
      badge: 'Active',
      badgeColor: 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200',
    },
    {
      id: 'hr-recruitment' as NavTab,
      label: 'Recruitment & Offers',
      icon: UserSearch,
      badge: 'Pipeline',
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
    },
    {
      id: 'hr-staff' as NavTab,
      label: 'Staff Directory',
      icon: UserCheck,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'hr-attendance' as NavTab,
      label: 'Attendance & Leave',
      icon: Clock,
      badge: pendingLeavesCount > 0 ? `${pendingLeavesCount} Req` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold',
    },
    {
      id: 'hr-payroll' as NavTab,
      label: 'Monthly Payroll',
      icon: CreditCard,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'hr-kpi' as NavTab,
      label: 'KPI & Appraisals',
      icon: Award,
      badge: 'Quarterly',
      badgeColor: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    },
    {
      id: 'hr-settings' as NavTab,
      label: 'HR Configuration',
      icon: Sliders,
      badge: null,
      badgeColor: undefined,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-3.5 select-none shrink-0">
      <div className="space-y-1.5 overflow-y-auto pr-0.5">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>ERP Navigation</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${roleDef.badgeClass}`}>
            {currentUser.role}
          </span>
        </div>

        {/* 1. Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-[#EAF7EF] text-[#0B5D2A] font-semibold border border-[#D9E5DD] shadow-2xs'
              : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
          }`}
        >
          <div className="flex items-center space-x-3">
            <LayoutDashboard
              className={`w-4 h-4 ${
                activeTab === 'dashboard' ? 'text-[#168A45]' : 'text-slate-400 group-hover:text-[#168A45]'
              }`}
            />
            <span>Dashboard</span>
          </div>
        </button>

        {/* 2. Group: Lead Management */}
        <div className="pt-1">
          {/* Group Header Button with Accordion Toggle */}
          <button
            type="button"
            onClick={toggleLeadManagement}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isLeadTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Toggle Lead Management Group"
          >
            <div className="flex items-center space-x-3">
              <Briefcase
                className={`w-4 h-4 ${
                  isLeadTabActive ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span>Lead Management</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {leadsCount > 0 && !isLeadManagementOpen && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                  {leadsCount}
                </span>
              )}
              {isLeadManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* Group Children */}
          {isLeadManagementOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {leadManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== null && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || 'bg-[#F7FAF8] text-slate-500 border border-gray-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Group: HR Management */}
        <div className="pt-1">
          <button
            type="button"
            onClick={toggleHrManagement}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isHrTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Toggle HR Management Group"
          >
            <div className="flex items-center space-x-3">
              <UserCheck
                className={`w-4 h-4 ${
                  isHrTabActive ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span>HR Management</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {pendingLeavesCount > 0 && !isHrManagementOpen && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                  {pendingLeavesCount}
                </span>
              )}
              {isHrManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* HR Group Children */}
          {isHrManagementOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {hrManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge !== null && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || 'bg-[#F7FAF8] text-slate-500 border border-gray-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Group: Settings */}
        <div className="pt-1">
          <button
            type="button"
            onClick={toggleSettings}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Toggle Settings Group"
          >
            <div className="flex items-center space-x-3">
              <SettingsIcon
                className={`w-4 h-4 ${
                  activeTab === 'settings' ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span>Settings</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {currentUser.role === 'Admin' && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                  Admin
                </span>
              )}
              {isSettingsOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* Group Children: Settings Sub-Buttons */}
          {isSettingsOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === 'settings' && settingsSubTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (onSettingsSubTabChange) {
                        onSettingsSubTabChange(item.id);
                      }
                      onTabChange('settings');
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-left ${
                      isActive
                        ? 'bg-[#168A45] text-white font-bold shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-white' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Google Sheets Sync status card */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <div className="bg-[#F7FAF8] border border-[#D9E5DD] rounded-xl p-3 shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#168A45]" />
              <span className="text-xs font-bold text-slate-800">Google Sheets</span>
            </div>
            <span className="flex items-center text-[10px] font-bold text-[#0B5D2A] bg-[#EAF7EF] px-1.5 py-0.5 rounded-full border border-[#D9E5DD]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#168A45] mr-1 animate-pulse"></span> Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            5 Tables connected with RBAC security & Gmail notification triggers.
          </p>
          <button
            onClick={() => onTabChange('gashub')}
            className="mt-2.5 w-full bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 text-xs font-semibold py-1.5 rounded-lg transition-colors text-center flex items-center justify-center space-x-1 shadow-2xs"
          >
            <span>Apps Script & Email Hub</span>
            <ArrowUpRight className="w-3 h-3 text-[#168A45]" />
          </button>
        </div>

        {/* User Card & Sign Out */}
        <div className="bg-slate-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#168A45] text-white flex items-center justify-center font-bold text-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                @{currentUser.userId || currentUser.id.toLowerCase()}
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign Out of CRM"
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="px-2 text-center text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          Casbiro Solutions &copy; {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
};
