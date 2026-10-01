import React, { useState, useEffect, useMemo } from 'react';
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
  Wallet,
  Receipt,
  SlidersHorizontal,
  TrendingUp,
  Landmark,
  Boxes,
  Package,
  RotateCcw,
  Truck,
  CornerDownLeft,
  Sparkles,
} from 'lucide-react';
import { User, UserRole } from '../types';
import { hasPermission, ROLE_DEFINITIONS } from '../utils/rbac';
import { documentExpiryStorage } from '../services/documentExpiryStorage';
import { assetStorage } from '../services/assetStorageService';
import { financeStorage } from '../services/financeStorageService';
import { hrStorage } from '../services/hrStorageService';
import { DepartmentMaster } from '../types/hr';

export type NavTab =
  | 'dashboard'
  | 'operations-dashboard'
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
  | 'hr-recruitment-positions'
  | 'hr-recruitment-applicants'
  | 'hr-recruitment-interviews'
  | 'hr-recruitment-offers'
  | 'hr-recruitment-appointments'
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
  | 'asset-settings'
  | 'party-management'
  | 'party-directory'
  | 'party-ledger'
  | 'finance-party-ledger'
  | 'sales'
  | 'sales-dashboard'
  | 'sales-workflow'
  | 'sales-quotation'
  | 'sales-order'
  | 'sales-invoice'
  | 'sales-return-request'
  | 'sales-return'
  | 'sales-quotation-report'
  | 'sales-order-report'
  | 'sales-invoice-report'
  | 'sales-return-request-report'
  | 'sales-return-report'
  | 'sales-ar'
  | 'sales-receipts'
  | 'purchase'
  | 'purchase-dashboard'
  | 'purchase-workflow'
  | 'purchase-request'
  | 'purchase-quotation'
  | 'purchase-quotation-comparison'
  | 'purchase-order'
  | 'goods-receipt'
  | 'purchase-invoice'
  | 'purchase-return-request'
  | 'purchase-return'
  | 'purchase-request-report'
  | 'purchase-quotation-report'
  | 'purchase-quotation-comparison-report'
  | 'purchase-order-report'
  | 'goods-receipt-report'
  | 'purchase-invoice-report'
  | 'purchase-return-request-report'
  | 'purchase-return-report'
  | 'purchase-payments'
  | 'purchase-advances'
  | 'inventory'
  | 'inventory-dashboard'
  | 'inventory-items'
  | 'inventory-valuation'
  | 'inventory-movements'
  | 'item-master'
  | 'finance'
  | 'finance-dashboard'
  | 'finance-parties'
  | 'finance-planner'
  | 'finance-ledger'
  | 'finance-projections'
  | 'finance-sales-ar'
  | 'finance-gl'
  | 'finance-cash-bank'
  | 'finance-loans'
  | 'finance-payments'
  | 'finance-receipts'
  | 'finance-advances'
  | 'finance-item-master'
  | 'finance-controls-audit'
  | 'finance-purchase'
  | 'finance-sales'
  | 'finance-tax'
  | 'finance-budget';

export type SettingsSubTab = 'pricing' | 'company' | 'proposal' | 'users' | 'import' | 'integrations' | 'themes';

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

  // Department-based Access Control
  const [departmentsList, setDepartmentsList] = useState<DepartmentMaster[]>(() =>
    hrStorage.getDepartmentsMaster()
  );

  useEffect(() => {
    try {
      localStorage.removeItem('mysar_simulated_department');
    } catch {}

    const handleDeptChange = () => {
      setDepartmentsList(hrStorage.getDepartmentsMaster());
    };
    window.addEventListener('mysar_department_permissions_changed', handleDeptChange);
    return () => {
      window.removeEventListener('mysar_department_permissions_changed', handleDeptChange);
    };
  }, []);

  const activeUserDept = useMemo(() => {
    if (currentUser.role === 'Admin') {
      return null; // Admins have unrestricted access to all modules
    }
    if (currentUser.departmentCode) {
      return (
        departmentsList.find(
          (d) => d.departmentCode.toUpperCase() === currentUser.departmentCode?.toUpperCase()
        ) || null
      );
    }
    if (currentUser.department) {
      return (
        departmentsList.find(
          (d) =>
            d.departmentName.toLowerCase() === currentUser.department?.toLowerCase() ||
            d.departmentCode.toLowerCase() === currentUser.department?.toLowerCase()
        ) || null
      );
    }
    return null;
  }, [departmentsList, currentUser]);

  const isTabAuthorized = (tabId: string): boolean => {
    if (!activeUserDept) {
      return true;
    }
    const allowed = activeUserDept.allowedMenuIds || [];
    return allowed.includes(tabId);
  };

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
    'hr-recruitment-positions',
    'hr-recruitment-applicants',
    'hr-recruitment-interviews',
    'hr-recruitment-offers',
    'hr-recruitment-appointments',
    'hr-staff',
    'hr-attendance',
    'hr-payroll',
    'hr-kpi',
    'hr-settings',
  ].includes(activeTab);

  const isRecruitmentTabActive = [
    'hr-recruitment',
    'hr-recruitment-positions',
    'hr-recruitment-applicants',
    'hr-recruitment-interviews',
    'hr-recruitment-offers',
    'hr-recruitment-appointments',
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

  const isPartyTabActive =
    activeTab === 'party-management' ||
    activeTab === 'party-directory' ||
    activeTab === 'party-ledger' ||
    activeTab === 'finance-parties' ||
    activeTab === 'finance-party-ledger';

  const isSalesTabActive =
    activeTab === 'sales' ||
    activeTab.startsWith('sales-') ||
    activeTab === 'finance-sales' ||
    activeTab === 'finance-sales-ar';

  const isPurchaseTabActive =
    activeTab === 'purchase' ||
    activeTab.startsWith('purchase-') ||
    activeTab === 'goods-receipt' ||
    activeTab === 'goods-receipt-report' ||
    activeTab === 'finance-purchase';

  const isInventoryTabActive =
    activeTab === 'inventory' ||
    activeTab.startsWith('inventory-') ||
    activeTab === 'item-master' ||
    activeTab === 'finance-item-master';

  const isFinanceTabActive =
    (activeTab === 'finance' || activeTab.startsWith('finance-')) &&
    !isPartyTabActive &&
    !isSalesTabActive &&
    !isPurchaseTabActive &&
    !isInventoryTabActive;

  const [isLeadManagementOpen, setIsLeadManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_lead_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isHrManagementOpen, setIsHrManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_hr_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (isLeadTabActive) {
      setIsLeadManagementOpen(true);
    }
  }, [isLeadTabActive]);

  useEffect(() => {
    if (isHrTabActive) {
      setIsHrManagementOpen(true);
    }
  }, [isHrTabActive]);

  const [isRecruitmentsOpen, setIsRecruitmentsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_recruitments_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (isRecruitmentTabActive) {
      setIsRecruitmentsOpen(true);
    }
  }, [isRecruitmentTabActive]);

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
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (activeTab === 'settings') {
      setIsSettingsOpen(true);
    }
  }, [activeTab]);

  const [isAssetManagementOpen, setIsAssetManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_asset_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
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

  const [isPartyManagementOpen, setIsPartyManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_party_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isSalesManagementOpen, setIsSalesManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_sales_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isSalesReportsOpen, setIsSalesReportsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_sales_reports_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isPurchaseManagementOpen, setIsPurchaseManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_purchase_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isPurchaseReportsOpen, setIsPurchaseReportsOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_purchase_reports_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [isInventoryManagementOpen, setIsInventoryManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_inventory_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (isPartyTabActive) {
      setIsPartyManagementOpen(true);
    }
  }, [isPartyTabActive]);

  useEffect(() => {
    if (isSalesTabActive) {
      setIsSalesManagementOpen(true);
    }
  }, [isSalesTabActive]);

  useEffect(() => {
    if (activeTab.startsWith('sales-') && activeTab.endsWith('-report')) {
      setIsSalesReportsOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isPurchaseTabActive) {
      setIsPurchaseManagementOpen(true);
    }
  }, [isPurchaseTabActive]);

  useEffect(() => {
    if (
      (activeTab.startsWith('purchase-') && activeTab.endsWith('-report')) ||
      activeTab === 'goods-receipt-report'
    ) {
      setIsPurchaseReportsOpen(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isInventoryTabActive) {
      setIsInventoryManagementOpen(true);
    }
  }, [isInventoryTabActive]);

  const [isFinanceManagementOpen, setIsFinanceManagementOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar_finance_mgmt_open');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [financeMetrics, setFinanceMetrics] = useState(() => {
    try {
      return financeStorage.getDashboardMetrics();
    } catch {
      return { overallUtilizationRate: 94.6, overBudgetMonthsCount: 2 };
    }
  });

  useEffect(() => {
    if (isFinanceTabActive) {
      setIsFinanceManagementOpen(true);
    }
  }, [isFinanceTabActive]);

  useEffect(() => {
    const handleFinanceChange = () => {
      try {
        setFinanceMetrics(financeStorage.getDashboardMetrics());
      } catch {}
    };
    window.addEventListener('mysar_finance_data_changed', handleFinanceChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleFinanceChange);
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

  // Navigation & Toggle Handlers for Accordion Groups
  const handleLeadManagementClick = () => {
    setIsLeadManagementOpen(true);
    try {
      localStorage.setItem('sidebar_lead_mgmt_open', 'true');
    } catch {}
    if (activeTab === 'lead-overview' && isLeadManagementOpen) {
      setIsLeadManagementOpen(false);
      try {
        localStorage.setItem('sidebar_lead_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('lead-overview');
    }
  };

  const toggleLeadManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLeadManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_lead_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleHrManagementClick = () => {
    setIsHrManagementOpen(true);
    try {
      localStorage.setItem('sidebar_hr_mgmt_open', 'true');
    } catch {}
    if (activeTab === 'hr-dashboard' && isHrManagementOpen) {
      setIsHrManagementOpen(false);
      try {
        localStorage.setItem('sidebar_hr_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('hr-dashboard');
    }
  };

  const toggleHrManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHrManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_hr_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleRecruitmentsClick = () => {
    setIsRecruitmentsOpen(true);
    try {
      localStorage.setItem('sidebar_recruitments_open', 'true');
    } catch {}
    if (activeTab === 'hr-recruitment-positions' && isRecruitmentsOpen) {
      setIsRecruitmentsOpen(false);
      try {
        localStorage.setItem('sidebar_recruitments_open', 'false');
      } catch {}
    } else {
      onTabChange('hr-recruitment-positions');
    }
  };

  const toggleRecruitmentsOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRecruitmentsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_recruitments_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleSalesManagementClick = () => {
    setIsSalesManagementOpen(true);
    try {
      localStorage.setItem('sidebar_sales_mgmt_open', 'true');
    } catch {}
    if ((activeTab === 'sales-dashboard' || activeTab === 'sales') && isSalesManagementOpen) {
      setIsSalesManagementOpen(false);
      try {
        localStorage.setItem('sidebar_sales_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('sales-dashboard');
    }
  };

  const toggleSalesManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSalesManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_sales_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleSalesReportsClick = () => {
    setIsSalesReportsOpen(true);
    try {
      localStorage.setItem('sidebar_sales_reports_open', 'true');
    } catch {}
    if (activeTab === 'sales-quotation-report' && isSalesReportsOpen) {
      setIsSalesReportsOpen(false);
      try {
        localStorage.setItem('sidebar_sales_reports_open', 'false');
      } catch {}
    } else {
      onTabChange('sales-quotation-report');
    }
  };

  const toggleSalesReportsOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSalesReportsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_sales_reports_open', String(next));
      } catch {}
      return next;
    });
  };

  const handlePurchaseManagementClick = () => {
    setIsPurchaseManagementOpen(true);
    try {
      localStorage.setItem('sidebar_purchase_mgmt_open', 'true');
    } catch {}
    if ((activeTab === 'purchase-dashboard' || activeTab === 'purchase') && isPurchaseManagementOpen) {
      setIsPurchaseManagementOpen(false);
      try {
        localStorage.setItem('sidebar_purchase_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('purchase-dashboard');
    }
  };

  const togglePurchaseManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPurchaseManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_purchase_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handlePurchaseReportsClick = () => {
    setIsPurchaseReportsOpen(true);
    try {
      localStorage.setItem('sidebar_purchase_reports_open', 'true');
    } catch {}
    if (activeTab === 'purchase-request-report' && isPurchaseReportsOpen) {
      setIsPurchaseReportsOpen(false);
      try {
        localStorage.setItem('sidebar_purchase_reports_open', 'false');
      } catch {}
    } else {
      onTabChange('purchase-request-report');
    }
  };

  const togglePurchaseReportsOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPurchaseReportsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_purchase_reports_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleInventoryManagementClick = () => {
    setIsInventoryManagementOpen(true);
    try {
      localStorage.setItem('sidebar_inventory_mgmt_open', 'true');
    } catch {}
    if (activeTab === 'inventory-items' && isInventoryManagementOpen) {
      setIsInventoryManagementOpen(false);
      try {
        localStorage.setItem('sidebar_inventory_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('inventory-items');
    }
  };

  const toggleInventoryManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInventoryManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_inventory_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handlePartyManagementClick = () => {
    setIsPartyManagementOpen(true);
    try {
      localStorage.setItem('sidebar_party_mgmt_open', 'true');
    } catch {}
    if (activeTab === 'party-management' && isPartyManagementOpen) {
      setIsPartyManagementOpen(false);
      try {
        localStorage.setItem('sidebar_party_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('party-management');
    }
  };

  const togglePartyManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPartyManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_party_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleFinanceManagementClick = () => {
    setIsFinanceManagementOpen(true);
    try {
      localStorage.setItem('sidebar_finance_mgmt_open', 'true');
    } catch {}
    if (activeTab === 'finance-dashboard' && isFinanceManagementOpen) {
      setIsFinanceManagementOpen(false);
      try {
        localStorage.setItem('sidebar_finance_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('finance-dashboard');
    }
  };

  const toggleFinanceManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFinanceManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_finance_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleDocExpiryClick = () => {
    setIsDocExpiryOpen(true);
    try {
      localStorage.setItem('sidebar_doc_expiry_open', 'true');
    } catch {}
    if (activeTab === 'doc-dashboard' && isDocExpiryOpen) {
      setIsDocExpiryOpen(false);
      try {
        localStorage.setItem('sidebar_doc_expiry_open', 'false');
      } catch {}
    } else {
      onTabChange('doc-dashboard');
    }
  };

  const toggleDocExpiryOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDocExpiryOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_doc_expiry_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleAssetManagementClick = () => {
    setIsAssetManagementOpen(true);
    try {
      localStorage.setItem('sidebar_asset_mgmt_open', 'true');
    } catch {}
    if (activeTab === 'asset-overview' && isAssetManagementOpen) {
      setIsAssetManagementOpen(false);
      try {
        localStorage.setItem('sidebar_asset_mgmt_open', 'false');
      } catch {}
    } else {
      onTabChange('asset-overview');
    }
  };

  const toggleAssetManagementOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAssetManagementOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sidebar_asset_mgmt_open', String(next));
      } catch {}
      return next;
    });
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
    try {
      localStorage.setItem('sidebar_settings_open', 'true');
    } catch {}
    if (activeTab === 'settings' && isSettingsOpen) {
      setIsSettingsOpen(false);
      try {
        localStorage.setItem('sidebar_settings_open', 'false');
      } catch {}
    } else {
      onTabChange('settings');
    }
  };

  const toggleSettingsOnly = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    {
      id: 'themes',
      label: 'Invoice & Voucher Themes',
      icon: Sparkles,
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
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'followups' as NavTab,
      label: 'Follow-ups',
      icon: CalendarClock,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'proposals' as NavTab,
      label: 'Proposals',
      icon: FileText,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'meet' as NavTab,
      label: 'Google Meet',
      icon: Video,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'gmail' as NavTab,
      label: 'Gmail Inbox',
      icon: Mail,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'reports' as NavTab,
      label: 'Reports',
      icon: BarChart3,
      badge: null,
      badgeColor: undefined,
    },
  ];

  const hrOverviewItem = {
    id: 'hr-dashboard' as NavTab,
    label: 'HR Overview',
    icon: LayoutDashboard,
    badge: null,
    badgeColor: undefined,
  };

  const recruitmentItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: 'hr-recruitment-positions' as NavTab,
      label: 'Positions',
      icon: Briefcase,
    },
    {
      id: 'hr-recruitment-applicants' as NavTab,
      label: 'Applicants',
      icon: Users,
    },
    {
      id: 'hr-recruitment-interviews' as NavTab,
      label: 'Interview Management',
      icon: CalendarClock,
    },
    {
      id: 'hr-recruitment-offers' as NavTab,
      label: 'Offer Letters',
      icon: FileText,
    },
    {
      id: 'hr-recruitment-appointments' as NavTab,
      label: 'Appointment Letters',
      icon: FileCheck,
    },
  ];

  const hrSubsequentItems = [
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
      badge: null,
      badgeColor: undefined,
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
      badge: null,
      badgeColor: undefined,
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
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'doc-registry' as NavTab,
      label: 'Documents Registry',
      icon: FileText,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'doc-calendar' as NavTab,
      label: 'Expiry Calendar',
      icon: Calendar,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'doc-reminders' as NavTab,
      label: 'Reminders & Notifications',
      icon: Bell,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'doc-renewals' as NavTab,
      label: 'Renewal History Ledger',
      icon: History,
      badge: null,
      badgeColor: undefined,
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
      badge: null,
      badgeColor: undefined,
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
      badge: null,
      badgeColor: undefined,
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
      badge: null,
      badgeColor: undefined,
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

  const partyManagementItems = [
    {
      id: 'party-management' as NavTab,
      label: 'Party Directory & Master',
      icon: Users,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'party-ledger' as NavTab,
      label: 'Party Sub-Ledger & Stmts',
      icon: Receipt,
      badge: null,
      badgeColor: undefined,
    },
  ];

  const salesManagementItems = [
    {
      id: 'sales-dashboard' as NavTab,
      label: 'Sales Dashboard',
      icon: LayoutDashboard,
      badge: 'KPIs',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'sales-quotation' as NavTab,
      label: 'Sales Quotation',
      icon: FileText,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'sales-order' as NavTab,
      label: 'Sales Order',
      icon: Receipt,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'sales-invoice' as NavTab,
      label: 'Sales Invoice',
      icon: Receipt,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'sales-return-request' as NavTab,
      label: 'Sales Return Request',
      icon: Clock,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'sales-return' as NavTab,
      label: 'Sales Return',
      icon: RotateCcw,
      badge: null,
      badgeColor: undefined,
    },
  ];

  const salesReportItems = [
    {
      id: 'sales-quotation-report' as NavTab,
      label: 'Sales Quotation Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'sales-order-report' as NavTab,
      label: 'Sales Order Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'sales-invoice-report' as NavTab,
      label: 'Sales Invoice Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'sales-return-request-report' as NavTab,
      label: 'Sales Return Request Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'sales-return-report' as NavTab,
      label: 'Sales Return Report',
      icon: FileSpreadsheet,
    },
  ];

  const purchaseManagementItems = [
    {
      id: 'purchase-dashboard' as NavTab,
      label: 'Purchase Dashboard',
      icon: LayoutDashboard,
      badge: 'KPIs',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'purchase-request' as NavTab,
      label: 'Purchase Request',
      icon: FileText,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'purchase-quotation' as NavTab,
      label: 'Purchase Quotation',
      icon: FileCheck,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'purchase-quotation-comparison' as NavTab,
      label: 'Purchase Quotation Comparison',
      icon: Award,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'purchase-order' as NavTab,
      label: 'Purchase Order',
      icon: ShoppingBag,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'goods-receipt' as NavTab,
      label: 'Goods Receipt',
      icon: PackageCheck,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'purchase-invoice' as NavTab,
      label: 'Purchase Invoice',
      icon: Receipt,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'purchase-return-request' as NavTab,
      label: 'Purchase Return Request',
      icon: Clock,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'purchase-return' as NavTab,
      label: 'Purchase Return',
      icon: RotateCcw,
      badge: null,
      badgeColor: undefined,
    },
  ];

  const purchaseReportItems = [
    {
      id: 'purchase-request-report' as NavTab,
      label: 'Purchase Request Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'purchase-quotation-report' as NavTab,
      label: 'Purchase Quotation Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'purchase-quotation-comparison-report' as NavTab,
      label: 'Purchase Quotation Comparison Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'purchase-order-report' as NavTab,
      label: 'Purchase Order Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'goods-receipt-report' as NavTab,
      label: 'Goods Receipt Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'purchase-invoice-report' as NavTab,
      label: 'Purchase Invoice Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'purchase-return-request-report' as NavTab,
      label: 'Purchase Return Request Report',
      icon: FileSpreadsheet,
    },
    {
      id: 'purchase-return-report' as NavTab,
      label: 'Purchase Return Report',
      icon: FileSpreadsheet,
    },
  ];

  const inventoryManagementItems = [
    {
      id: 'inventory-dashboard' as NavTab,
      label: 'Inventory Dashboard',
      icon: LayoutDashboard,
      badge: 'Stock',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'inventory-items' as NavTab,
      label: 'Item Master Catalog',
      icon: Boxes,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'inventory-valuation' as NavTab,
      label: 'Inventory Valuation',
      icon: Landmark,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'inventory-movements' as NavTab,
      label: 'Stock Movement Ledger',
      icon: ArrowRightLeft,
      badge: null,
      badgeColor: undefined,
    },
  ];

  const financeManagementItems = [
    {
      id: 'finance-dashboard' as NavTab,
      label: 'Budget & Expenditures',
      icon: Wallet,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-gl' as NavTab,
      label: 'Accounting & Reports',
      icon: FileSpreadsheet,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-cash-bank' as NavTab,
      label: 'Cash & Bank Accounts',
      icon: CreditCard,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-loans' as NavTab,
      label: 'Loans & Debt Management',
      icon: Landmark,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-payments' as NavTab,
      label: 'Vendor Payments & Approvals',
      icon: CreditCard,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-receipts' as NavTab,
      label: 'Customer Collections & Receipts',
      icon: Receipt,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-advances' as NavTab,
      label: 'Advance Adjustments',
      icon: Layers,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-controls-audit' as NavTab,
      label: 'Controls & Audit Trail',
      icon: ShieldCheck,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-tax' as NavTab,
      label: 'Tax & GST / TDS',
      icon: FileSpreadsheet,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-budget' as NavTab,
      label: 'Budget & Commitments',
      icon: BarChart3,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-planner' as NavTab,
      label: 'Budget Planner & Caps',
      icon: SlidersHorizontal,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-projections' as NavTab,
      label: 'Budget Projections',
      icon: TrendingUp,
      badge: null,
      badgeColor: undefined,
    },
    {
      id: 'finance-ledger' as NavTab,
      label: 'Expense Ledger & Vouchers',
      icon: Receipt,
      badge: null,
      badgeColor: undefined,
    },
  ];

  // Department-filtered module visibility
  const isDashboardVisible = isTabAuthorized('dashboard');
  const isOpsDashboardVisible = isTabAuthorized('operations-dashboard');

  const visibleLeadItems = leadManagementItems.filter((item) => isTabAuthorized(item.id));
  const isLeadGroupVisible = visibleLeadItems.length > 0;

  const visibleRecruitmentItems = recruitmentItems.filter((item) => isTabAuthorized(item.id));
  const visibleHrSubsequentItems = hrSubsequentItems.filter((item) => isTabAuthorized(item.id));
  const isHrDashboardVisible = isTabAuthorized('hr-dashboard');
  const isHrGroupVisible =
    isHrDashboardVisible || visibleRecruitmentItems.length > 0 || visibleHrSubsequentItems.length > 0;

  const visibleSalesItems = salesManagementItems.filter((item) => isTabAuthorized(item.id));
  const isSalesGroupVisible = visibleSalesItems.length > 0;

  const visiblePurchaseItems = purchaseManagementItems.filter((item) => isTabAuthorized(item.id));
  const isPurchaseGroupVisible = visiblePurchaseItems.length > 0;

  const visibleInventoryItems = inventoryManagementItems.filter((item) => isTabAuthorized(item.id));
  const isInventoryGroupVisible = visibleInventoryItems.length > 0;

  const visiblePartyItems = partyManagementItems.filter((item) => isTabAuthorized(item.id));
  const isPartyGroupVisible = visiblePartyItems.length > 0;

  const visibleFinanceItems = financeManagementItems.filter((item) => isTabAuthorized(item.id));
  const isFinanceGroupVisible = visibleFinanceItems.length > 0;

  const visibleDocExpiryItems = docExpiryManagementItems.filter((item) => isTabAuthorized(item.id));
  const isDocExpiryGroupVisible = visibleDocExpiryItems.length > 0;

  const visibleAssetItems = assetManagementItems.filter((item) => isTabAuthorized(item.id));
  const isAssetGroupVisible = visibleAssetItems.length > 0;

  const visibleSettingsItems = canManageSettings
    ? settingsItems.filter((item) => {
        if (item.id === 'themes') return isTabAuthorized('themes') || isTabAuthorized('settings');
        return isTabAuthorized(item.id) || isTabAuthorized('settings');
      })
    : [];
  const isSettingsGroupVisible = canManageSettings && (isTabAuthorized('settings') || visibleSettingsItems.length > 0);

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col justify-between p-3.5 select-none shrink-0">
      <div className="space-y-1.5 overflow-y-auto pr-0.5">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>ERP Navigation</span>
          <span className={`text-[9px] px-1.5 py-0.2 rounded-full border ${roleDef.badgeClass}`}>
            {currentUser.role}
          </span>
        </div>

        {/* 1. Dashboard */}
        {isDashboardVisible && (
          <button
            onClick={() => onTabChange('dashboard')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
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
              <span>Executive Dashboard</span>
            </div>
          </button>
        )}

        {/* 2. Group: Lead Management */}
        {isLeadGroupVisible && (
          <div className="pt-1">
            {/* Group Header Button with Accordion Toggle */}
            <button
              type="button"
              onClick={handleLeadManagementClick}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isLeadTabActive
                  ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                  : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
              }`}
              title="Lead Management (Click to navigate, Chevron to toggle)"
            >
              <div className="flex items-center space-x-3">
                <Briefcase
                  className={`w-4 h-4 ${
                    isLeadTabActive ? 'text-[#168A45]' : 'text-slate-400'
                  }`}
                />
                <span>Lead Management</span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={toggleLeadManagementOnly}
                title={isLeadManagementOpen ? 'Collapse Lead Management' : 'Expand Lead Management'}
                className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
              >
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
                {visibleLeadItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={item.label}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                          : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 w-full">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#168A45]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate text-left">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. Group: HR Management */}
        {isHrGroupVisible && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleHrManagementClick}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isHrTabActive
                  ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                  : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
              }`}
              title="HR Management (Click to navigate, Chevron to toggle)"
            >
              <div className="flex items-center space-x-3">
                <UserCheck
                  className={`w-4 h-4 ${
                    isHrTabActive ? 'text-[#168A45]' : 'text-slate-400'
                  }`}
                />
                <span>HR Management</span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={toggleHrManagementOnly}
                title={isHrManagementOpen ? 'Collapse HR Management' : 'Expand HR Management'}
                className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
              >
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
                {/* 1. HR Overview */}
                {isHrDashboardVisible && (() => {
                  const Icon = hrOverviewItem.icon;
                  const isActive = activeTab === hrOverviewItem.id;
                  return (
                    <button
                      key={hrOverviewItem.id}
                      onClick={() => onTabChange(hrOverviewItem.id)}
                      title={hrOverviewItem.label}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                          : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 w-full">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#168A45]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate text-left">{hrOverviewItem.label}</span>
                      </div>
                    </button>
                  );
                })()}

                {/* 2. Recruitments Sub-group */}
                {visibleRecruitmentItems.length > 0 && (
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={handleRecruitmentsClick}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isRecruitmentTabActive
                          ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD]'
                          : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                      }`}
                      title="Recruitments (Click to view positions, Chevron to toggle)"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <UserSearch
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isRecruitmentTabActive ? 'text-[#168A45]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate font-semibold">Recruitments</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleRecruitmentsOnly}
                        title={isRecruitmentsOpen ? 'Collapse Recruitments' : 'Expand Recruitments'}
                        className="p-0.5 hover:bg-emerald-100/70 rounded transition-colors"
                      >
                        {isRecruitmentsOpen ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                      </div>
                    </button>

                    {isRecruitmentsOpen && (
                      <div className="mt-1 ml-3 pl-2.5 border-l-2 border-emerald-200/80 space-y-0.5 animate-in fade-in duration-100">
                        {visibleRecruitmentItems.map((rec) => {
                          const Icon = rec.icon;
                          const isActive =
                            activeTab === rec.id ||
                            (rec.id === 'hr-recruitment-positions' && activeTab === 'hr-recruitment');
                          return (
                            <button
                              key={rec.id}
                              onClick={() => onTabChange(rec.id)}
                              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold shadow-2xs'
                                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                              }`}
                              title={rec.label}
                            >
                              <div className="flex items-center space-x-2 min-w-0">
                                <Icon
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    isActive ? 'text-[#168A45]' : 'text-slate-400'
                                  }`}
                                />
                                <span className="truncate">{rec.label}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Other HR Items */}
                {visibleHrSubsequentItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={item.label}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                          : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 w-full">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#168A45]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate text-left">{item.label}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Group: Sales */}
        {isSalesGroupVisible && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSalesManagementClick}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isSalesTabActive
                  ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                  : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
              }`}
              title="Sales (Click to navigate, Chevron to toggle)"
            >
              <div className="flex items-center space-x-2.5">
                <div
                  className={`p-1.5 rounded-lg ${
                    isSalesTabActive
                      ? 'bg-[#168A45] text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-700'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="font-semibold text-xs tracking-tight">Sales</span>
              </div>
              <div
                role="button"
                tabIndex={0}
                onClick={toggleSalesManagementOnly}
                title={isSalesManagementOpen ? 'Collapse Sales' : 'Expand Sales'}
                className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
              >
                {isSalesManagementOpen ? (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {isSalesManagementOpen && (
              <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
                {visibleSalesItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      title={item.label}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                          : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 w-full">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#168A45]' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate text-left">{item.label}</span>
                      </div>
                    </button>
                  );
                })}

                {/* Sales Reports Sub-group */}
                {salesReportItems.some((r) => isTabAuthorized(r.id) || isTabAuthorized('sales-reports')) && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleSalesReportsClick}
                      className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45] transition-colors cursor-pointer"
                      title="Sales Reports (Click to navigate, Chevron to toggle)"
                    >
                      <div className="flex items-center space-x-2">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                        <span>Reports</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleSalesReportsOnly}
                        title={isSalesReportsOpen ? 'Collapse Reports' : 'Expand Reports'}
                        className="p-0.5 hover:bg-slate-200/70 rounded transition-colors"
                      >
                        {isSalesReportsOpen ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isSalesReportsOpen && (
                      <div className="mt-1 ml-3 pl-2 border-l border-slate-200 space-y-0.5 animate-in fade-in duration-100">
                        {salesReportItems
                          .filter((r) => isTabAuthorized(r.id) || isTabAuthorized('sales-reports'))
                          .map((rpt) => {
                            const Icon = rpt.icon;
                            const isActive = activeTab === rpt.id;
                            return (
                              <button
                                key={rpt.id}
                                onClick={() => onTabChange(rpt.id)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                                  isActive
                                    ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold shadow-2xs'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <Icon
                                    className={`w-3 h-3 shrink-0 ${
                                      isActive ? 'text-[#168A45]' : 'text-slate-400'
                                    }`}
                                  />
                                  <span className="truncate">{rpt.label}</span>
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Group: Purchase */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handlePurchaseManagementClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isPurchaseTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Purchase (Click to navigate, Chevron to toggle)"
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  isPurchaseTabActive
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'bg-emerald-50 text-[#168A45]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs tracking-tight">Purchase</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={togglePurchaseManagementOnly}
              title={isPurchaseManagementOpen ? 'Collapse Purchase' : 'Expand Purchase'}
              className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
            >
              {isPurchaseManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {isPurchaseManagementOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {purchaseManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 w-full">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>
                  </button>
                );
              })}

              {/* Purchase Reports Sub-group */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handlePurchaseReportsClick}
                  className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45] transition-colors cursor-pointer"
                  title="Purchase Reports (Click to navigate, Chevron to toggle)"
                >
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Reports</span>
                  </div>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={togglePurchaseReportsOnly}
                    title={isPurchaseReportsOpen ? 'Collapse Reports' : 'Expand Reports'}
                    className="p-0.5 hover:bg-slate-200/70 rounded transition-colors"
                  >
                    {isPurchaseReportsOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </button>

                {isPurchaseReportsOpen && (
                  <div className="mt-1 ml-3 pl-2 border-l border-slate-200 space-y-0.5 animate-in fade-in duration-100">
                    {purchaseReportItems.map((rpt) => {
                      const Icon = rpt.icon;
                      const isActive = activeTab === rpt.id;
                      return (
                        <button
                          key={rpt.id}
                          onClick={() => onTabChange(rpt.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold shadow-2xs'
                              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <Icon
                              className={`w-3 h-3 shrink-0 ${
                                isActive ? 'text-[#168A45]' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{rpt.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Group: Item Master & Inventory */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleInventoryManagementClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isInventoryTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Item Master & Inventory (Click to navigate, Chevron to toggle)"
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  isInventoryTabActive
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                <Boxes className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs tracking-tight">Item Master & Inventory</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={toggleInventoryManagementOnly}
              title={isInventoryManagementOpen ? 'Collapse Item Master & Inventory' : 'Expand Item Master & Inventory'}
              className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
            >
              {isInventoryManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {isInventoryManagementOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {inventoryManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'inventory-items' &&
                    (activeTab === 'inventory' ||
                      activeTab === 'item-master' ||
                      activeTab === 'finance-item-master'));
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 w-full">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Group: Party Management */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handlePartyManagementClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isPartyTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Party Management (Click to navigate, Chevron to toggle)"
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  isPartyTabActive
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-700'
                }`}
              >
                <Users className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs tracking-tight">Party Management</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={togglePartyManagementOnly}
              title={isPartyManagementOpen ? 'Collapse Party Management' : 'Expand Party Management'}
              className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
            >
              {isPartyManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {isPartyManagementOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {partyManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'party-management' && activeTab === 'finance-parties') ||
                  (item.id === 'party-ledger' && activeTab === 'finance-party-ledger');
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 w-full">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Group: Finance & Budgeting */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleFinanceManagementClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isFinanceTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Finance & Accounts (Click to navigate, Chevron to toggle)"
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`p-1.5 rounded-lg ${
                  isFinanceTabActive
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'bg-emerald-50 text-[#168A45]'
                }`}
              >
                <Wallet className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs tracking-tight">Finance & Accounts</span>
            </div>
            <div
              role="button"
              tabIndex={0}
              onClick={toggleFinanceManagementOnly}
              title={isFinanceManagementOpen ? 'Collapse Finance & Accounts' : 'Expand Finance & Accounts'}
              className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
            >
              {isFinanceManagementOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {isFinanceManagementOpen && (
            <div className="mt-1 ml-4 pl-2.5 border-l-2 border-[#D9E5DD] space-y-1 animate-in fade-in duration-150">
              {financeManagementItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    title={item.label}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 w-full">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Group: Document & Expiry Management */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleDocExpiryClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isDocExpiryTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Document & Expiry (Click to navigate, Chevron to toggle)"
          >
            <div className="flex items-center space-x-3">
              <FileCheck
                className={`w-4 h-4 ${
                  isDocExpiryTabActive ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">Document & Expiry</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={toggleDocExpiryOnly}
              title={isDocExpiryOpen ? 'Collapse Document & Expiry' : 'Expand Document & Expiry'}
              className="p-1 hover:bg-slate-200/70 rounded-md transition-colors shrink-0"
            >
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
                    title={item.label}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 w-full">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>
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
            onClick={handleAssetManagementClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isAssetTabActive
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Asset Management (Click to navigate, Chevron to toggle)"
          >
            <div className="flex items-center space-x-3">
              <Laptop
                className={`w-4 h-4 ${
                  isAssetTabActive ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span className="truncate">Asset Management</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={toggleAssetManagementOnly}
              title={isAssetManagementOpen ? 'Collapse Asset Management' : 'Expand Asset Management'}
              className="p-1 hover:bg-slate-200/70 rounded-md transition-colors shrink-0"
            >
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
                    title={item.label}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#EAF7EF] text-[#0B5D2A] font-bold border border-[#D9E5DD] shadow-2xs'
                        : 'text-slate-600 hover:bg-[#F7FAF8] hover:text-[#168A45]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 w-full">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? 'text-[#168A45]' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate text-left">{item.label}</span>
                    </div>
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
            onClick={handleSettingsClick}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-slate-50 text-slate-900 border border-slate-200/80'
                : 'text-slate-700 hover:bg-[#F7FAF8] hover:text-[#168A45]'
            }`}
            title="Settings (Click to navigate, Chevron to toggle)"
          >
            <div className="flex items-center space-x-3">
              <SettingsIcon
                className={`w-4 h-4 ${
                  activeTab === 'settings' ? 'text-[#168A45]' : 'text-slate-400'
                }`}
              />
              <span>Settings</span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={toggleSettingsOnly}
              title={isSettingsOpen ? 'Collapse Settings' : 'Expand Settings'}
              className="p-1 hover:bg-slate-200/70 rounded-md transition-colors"
            >
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
