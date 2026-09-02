import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  FileText,
  BarChart3,
  Settings as SettingsIcon,
  FileSpreadsheet,
  CheckCircle2,
  Database,
  ArrowUpRight,
  Shield,
  Bell,
  Mail,
  Video,
  LogOut,
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
  | 'gashub';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  leadsCount: number;
  followUpsTodayCount: number;
  proposalsPendingCount: number;
  currentUser: User;
  onOpenNotifications?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  leadsCount,
  followUpsTodayCount,
  proposalsPendingCount,
  currentUser,
  onOpenNotifications,
  onLogout,
}) => {
  const canManageSettings = hasPermission.canManageSettings(currentUser);
  const roleDef = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.Salesperson;

  const menuItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'leads' as NavTab,
      label: 'Leads',
      icon: Users,
      badge: leadsCount > 0 ? leadsCount : null,
    },
    {
      id: 'followups' as NavTab,
      label: 'Follow-ups',
      icon: CalendarClock,
      badge: followUpsTodayCount > 0 ? followUpsTodayCount : null,
      badgeColor: 'bg-[#168A45] text-white',
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
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: SettingsIcon,
      badge: currentUser.role === 'Admin' ? 'Admin' : null,
      badgeColor: 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200',
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between p-3.5 select-none shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>CRM Navigation</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${roleDef.badgeClass}`}>
            {currentUser.role}
          </span>
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#EAF7EF] text-[#0B5D2A] font-semibold border border-[#D9E5DD] shadow-2xs'
                  : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-[#168A45]' : 'text-slate-400 group-hover:text-[#168A45]'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
