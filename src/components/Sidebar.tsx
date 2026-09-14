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
  FileCheck,
  Calendar,
  History,
  Laptop,
  PackageCheck,
  ShoppingBag,
  ArrowRightLeft,
  Wrench,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { hasPermission, ROLE_DEFINITIONS } from '../utils/rbac';
import { documentExpiryStorage } from '../services/documentExpiryStorage';
import { assetStorage } from '../services/assetStorageService';

export type NavTab =
  | 'dashboard'
  | 'lead-overview'
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
  | 'hr-settings'
  | 'doc-expiry'
  | 'doc-dashboard'
  | 'doc-registry'
  | 'doc-calendar'
  | 'doc-reminders'
  | 'doc-renewals'
  | 'doc-types'
  | 'assets'
  | 'asset-overview'
  | 'asset-register'
  | 'asset-requests'
  | 'asset-pos'
  | 'asset-receiving'
  | 'asset-movements'
  | 'asset-maintenance'
  | 'asset-warranties'
  | 'asset-retirements'
  | 'asset-reports'
  | 'asset-settings';

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
    'lead-overview',
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

  const isDocExpiryTabActive = [
    'doc-expiry',
    'doc-dashboard',
    'doc-registry',
    'doc-calendar',
    'doc-reminders',
    'doc-renewals',
    'doc-types',
  ].includes(activeTab);

  const isAssetTabActive =
    activeTab === 'assets' ||
    [
      'asset-overview',
      'asset-register',
      'asset-requests',
      'asset-pos',
      'asset-receiving',
      'asset-movements',
      'asset-maintenance',
      'asset-warranties',
      'asset-retirements',
      'asset-reports',
      'asset-settings',
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

  const [isDocExpiryOpen, setIsDocExpiryOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_doc_expiry_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
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

  const [isAssetManagementOpen, setIsAssetManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_asset_mgmt_open');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  const [assetMetrics, setAssetMetrics] = useState(() => {
    try {
      return assetStorage.getMetrics();
    } catch {
      return { totalAssets: 0, inMaintenanceCount: 0 };
    }
  });

  useEffect(() => {
    if (isAssetTabActive) {
      setIsAssetManagementOpen(true);
    }
  }, [isAssetTabActive]);

  useEffect(() => {
    const handleAssetChange = () => {
      try {
        setAssetMetrics(assetStorage.getMetrics());
      } catch {}
    };
    window.addEventListener('mysar_asset_data_changed', handleAssetChange);
    return () => window.removeEventListener('mysar_asset_data_changed', handleAssetChange);
  }, []);

  const [docMetrics, setDocMetrics] = useState(() => {
    try {
      return documentExpiryStorage.getDashboardMetrics();
    } catch {
      return {
        expiredCount: 0,
        expiringTodayCount: 0,
        expiring7dCount: 0,
        expiring30dCount: 0,
        expiring90dCount: 0,
        renewedCount: 0,
        activeCount: 0,
        totalDocuments: 0,
        totalRenewalCostExposure: 0,
      };
    }
  });

  useEffect(() => {
    if (isDocExpiryTabActive) {
      setIsDocExpiryOpen(true);
    }
  }, [isDocExpiryTabActive]);

  useEffect(() => {
    const handleDocChange = () => {
      try {
        setDocMetrics(documentExpiryStorage.getDashboardMetrics());
      } catch {}
    };
    window.addEventListener('mysar_doc_expiry_changed', handleDocChange);
    return () => window.removeEventListener('mysar_doc_expiry_changed', handleDocChange);
  }, []);

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

  const toggleDocExpiry = () => {
    setIsDocExpiryOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_doc_expiry_open', String(next));
      } catch {}
      return next;
    });
    if (!isDocExpiryTabActive) {
      onTabChange('doc-dashboard');
    }
  };

  const toggleAssetManagement = () => {
    setIsAssetManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_asset_mgmt_open', String(next));
      } catch {}
      return next;
    });
    if (!isAssetTabActive) {
      onTabChange('asset-overview');
    }
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
      id: 'lead-overview' as NavTab,
      label: 'Lead Overview',
      icon: LayoutDashboard,
      badge: null,
      badgeColor: undefined,
    },
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

  const docExpiryManagementItems = [
    {
      id: 'doc-dashboard' as NavTab,
      label: 'Expiry Dashboard',
      icon: LayoutDashboard,
      badge: docMetrics.expiredCount > 0 ? `${docMetrics.expiredCount} Exp` : null,
      badgeColor: 'bg-red-100 text-red-700 font-bold border border-red-200',
    },
    {
      id: 'doc-registry' as NavTab,
      label: 'Documents Registry',
      icon: FileText,
      badge: docMetrics.totalDocuments > 0 ? `${docMetrics.totalDocuments}` : null,
      badgeColor: 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD]',
    },
    {
      id: 'doc-calendar' as NavTab,
      label: 'Expiry Calendar',
      icon: Calendar,
      badge: docMetrics.expiring30dCount > 0 ? `${docMetrics.expiring30dCount} Due` : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
    },
    {
      id: 'doc-reminders' as NavTab,
      label: 'Reminders & Notifications',
      icon: Bell,
      badge: '5 Channels',
      badgeColor: 'bg-purple-50 text-purple-700 border border-purple-200',
    },
    {
      id: 'doc-renewals' as NavTab,
      label: 'Renewal History Ledger',
      icon: History,
      badge: docMetrics.renewedCount > 0 ? `${docMetrics.renewedCount}` : null,
      badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    {
      id: 'doc-types' as NavTab,
      label: 'Document & Expiry Types',
      icon: Layers,
      badge: null,
      badgeColor: undefined,
    },
  ];

  const assetManagementItems = [
    {
      id: 'asset-overview' as NavTab,
      label: 'Asset Overview',
      icon: LayoutDashboard,
      badge: `${assetMetrics.totalAssets || 0}`,
      badgeColor: 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD]',
    },
    {
      id: 'asset-register' as NavTab,
      label: 'Asset Register',
      icon: Laptop,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'asset-requests' as NavTab,
      label: 'Requisitions',
      icon: FileCheck,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'asset-pos' as NavTab,
      label: 'Purchase Orders',
      icon: ShoppingBag,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'asset-receiving' as NavTab,
      label: 'Goods Intake (GRN)',
      icon: PackageCheck,
      badge: 'Intake',
      badgeColor: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    },
    {
      id: 'asset-movements' as NavTab,
      label: 'Movement Ledger',
      icon: ArrowRightLeft,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'asset-maintenance' as NavTab,
      label: 'Maintenance & Repairs',
      icon: Wrench,
      badge:
        (assetMetrics.inMaintenanceCount || 0) > 0
          ? `${assetMetrics.inMaintenanceCount}`
          : null,
      badgeColor: 'bg-amber-100 text-amber-800 font-bold border border-amber-200',
    },
    {
      id: 'asset-warranties' as NavTab,
      label: 'Warranties & AMC',
      icon: ShieldCheck,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'asset-retirements' as NavTab,
      label: 'Decommissioned',
      icon: Trash2,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'asset-reports' as NavTab,
      label: 'Compliance Reports',
      icon: BarChart3,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'asset-settings' as NavTab,
      label: 'Asset Masters & Config',
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

        {/* 4. Group: Document & Expiry Management */}
        <div className="pt-1">
          <button
            type="button"
            onClick={toggleDocExpiry}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isDocExpiryTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Toggle Document & Expiry Management Group"
          >
            <div className="flex items-center space-x-3">
              <FileCheck
                className={`w-4 h-4 ${
                  isDocExpiryTabActive ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">Document & Expiry</span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {docMetrics.expiredCount > 0 ? (
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-red-100 text-red-700 animate-pulse border border-red-200">
                  {docMetrics.expiredCount} Exp
                </span>
              ) : docMetrics.expiringTodayCount > 0 || docMetrics.expiring7dCount > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {docMetrics.expiringTodayCount + docMetrics.expiring7dCount} Due
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {docMetrics.totalDocuments}
                </span>
              )}
              {isDocExpiryOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* Document & Expiry Children */}
          {isDocExpiryOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {docExpiryManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'doc-dashboard' && activeTab === 'doc-expiry');
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

        {/* 5. Group: Asset Management */}
        <div className="pt-1">
          <button
            type="button"
            onClick={toggleAssetManagement}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isAssetTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Toggle Asset Management Group"
          >
            <div className="flex items-center space-x-3">
              <Laptop
                className={`w-4 h-4 ${
                  isAssetTabActive ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">Asset Management</span>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {(assetMetrics.totalAssets || 0) > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                  {assetMetrics.totalAssets}
                </span>
              )}
              {isAssetManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* Asset Management Children */}
          {isAssetManagementOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {assetManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'asset-overview' && activeTab === 'assets');
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

        {/* 6. Group: Settings */}
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

      {/* Bottom Footer */}
      <div className="pt-3 border-t border-gray-200">
        <div className="px-2 text-center text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          Casbiro Solutions &copy; {new Date().getFullYear()}
        </div>
      </div>
    </aside>
  );
};
