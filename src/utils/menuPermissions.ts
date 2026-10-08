import { User, UserRole } from '../types';

export interface UserSideMenuPermission {
  viewOnly: boolean; // View screens & listings
  entry: boolean;    // Create / Enter new records
  edit: boolean;     // Modify / Edit existing records
  delete: boolean;   // Delete / Cancel records
}

export interface MenuItemDefinition {
  id: string;
  name: string;
  category: string;
  categoryIcon: string;
  description: string;
}

export const SIDE_MENU_CATEGORIES = [
  'Dashboard & Overview',
  'Lead Management (CRM)',
  'HR & Institution Management',
  'Sales Management',
  'Purchase Management',
  'Inventory Management',
  'Party Management',
  'Finance & Accounts',
  'Document Expiry & Compliance',
  'Asset Management',
  'Settings & Administration',
] as const;

export const SIDE_MENU_DEFINITIONS: MenuItemDefinition[] = [
  // Dashboard
  {
    id: 'dashboard',
    name: 'ERP Executive Dashboard',
    category: 'Dashboard & Overview',
    categoryIcon: 'LayoutDashboard',
    description: 'Institutional overview, quick metrics, pending approvals, and operational alerts.',
  },
  {
    id: 'operations-dashboard',
    name: 'Supply Chain & Operations Dashboard',
    category: 'Dashboard & Overview',
    categoryIcon: 'Layers',
    description: 'Unified commercial command center across Sales, Procurement, and Warehouse Inventory.',
  },

  // Lead Management
  {
    id: 'lead-overview',
    name: 'Lead Overview & Analytics',
    category: 'Lead Management (CRM)',
    categoryIcon: 'Users',
    description: 'Pipeline stage analytics, conversion funnels, and executive sales charts.',
  },
  {
    id: 'leads',
    name: 'All Leads & Institutional Accounts',
    category: 'Lead Management (CRM)',
    categoryIcon: 'Users',
    description: 'Directory of institutional leads, account assignments, and conversion stages.',
  },
  {
    id: 'followups',
    name: 'Follow-Ups & Meeting Tasks',
    category: 'Lead Management (CRM)',
    categoryIcon: 'CalendarClock',
    description: 'Daily scheduled follow-up visits, institutional calls, and status logs.',
  },
  {
    id: 'proposals',
    name: 'Quotations & Commercial Proposals',
    category: 'Lead Management (CRM)',
    categoryIcon: 'FileText',
    description: 'Pricing proposals, fee quotes, SLA contracts, and client approval signatures.',
  },
  {
    id: 'meet',
    name: 'Google Meet Scheduler',
    category: 'Lead Management (CRM)',
    categoryIcon: 'Video',
    description: 'Institutional video demo scheduling and Google Meet integration.',
  },
  {
    id: 'gmail',
    name: 'Gmail Sync & Inbox Inquiries',
    category: 'Lead Management (CRM)',
    categoryIcon: 'Mail',
    description: 'Automated follow-up reminders, lead inquiries, and Gmail digest sync.',
  },
  {
    id: 'reports',
    name: 'Sales & Conversion Reports',
    category: 'Lead Management (CRM)',
    categoryIcon: 'BarChart3',
    description: 'Representative performance, conversion velocity, and deal volumes.',
  },

  // HR & Institution Management
  {
    id: 'hr-dashboard',
    name: 'HR Executive Dashboard',
    category: 'HR & Institution Management',
    categoryIcon: 'Building2',
    description: 'Headcount metrics, payroll outlays, and institutional KPI charts.',
  },
  {
    id: 'hr-recruitment-positions',
    name: 'Job Positions & Vacancies',
    category: 'HR & Institution Management',
    categoryIcon: 'Briefcase',
    description: 'Institutional vacancies, qualification requirements, and salary brackets.',
  },
  {
    id: 'hr-recruitment-applicants',
    name: 'Applicants & Talent Pool',
    category: 'HR & Institution Management',
    categoryIcon: 'UserSearch',
    description: 'Candidate screening, stage tracking, resume files, and qualifications.',
  },
  {
    id: 'hr-recruitment-interviews',
    name: 'Interview Schedule & Evaluations',
    category: 'HR & Institution Management',
    categoryIcon: 'Calendar',
    description: 'Candidate interview scheduling, panellist scorecards, and remarks.',
  },
  {
    id: 'hr-recruitment-offers',
    name: 'Offer Letters Dispatch',
    category: 'HR & Institution Management',
    categoryIcon: 'FileCheck',
    description: 'Formal job offer generation, salary packages, and acceptance status.',
  },
  {
    id: 'hr-recruitment-appointments',
    name: 'Appointment Letters',
    category: 'HR & Institution Management',
    categoryIcon: 'Award',
    description: 'Institutional appointment letters, probation terms, and staff conversion.',
  },
  {
    id: 'hr-staff',
    name: 'Staff & Faculty Directory',
    category: 'HR & Institution Management',
    categoryIcon: 'Users',
    description: 'Faculty profiles, staff master, biometrics, and digital ID cards.',
  },
  {
    id: 'hr-attendance',
    name: 'Attendance, Shifts & Leaves',
    category: 'HR & Institution Management',
    categoryIcon: 'Clock',
    description: 'Shift tracking, biometric logs, leave balances, and absence approvals.',
  },
  {
    id: 'hr-payroll',
    name: 'Payroll & Payslips',
    category: 'HR & Institution Management',
    categoryIcon: 'CreditCard',
    description: 'Monthly payroll runs, statutory EPF/ESI deductions, and digital pay slips.',
  },
  {
    id: 'hr-kpi',
    name: 'KPI & Performance Reviews',
    category: 'HR & Institution Management',
    categoryIcon: 'Award',
    description: 'Staff KPI benchmarks, quarterly performance reviews, and ratings.',
  },
  {
    id: 'hr-settings',
    name: 'HR System Policies & Matrix',
    category: 'HR & Institution Management',
    categoryIcon: 'Sliders',
    description: 'Department & roles definition matrix, shift rules, and leave quotas.',
  },

  // Sales Management
  {
    id: 'sales-dashboard',
    name: 'Sales Executive Dashboard',
    category: 'Sales Management',
    categoryIcon: 'BarChart3',
    description: 'Executive revenue KPIs, collections, A/R balances, best sellers, and sales funnels.',
  },
  {
    id: 'sales-workflow',
    name: 'Sales Workflow & Funnel',
    category: 'Sales Management',
    categoryIcon: 'TrendingUp',
    description: 'Visual workflow from quotation and order to invoice and collection.',
  },
  {
    id: 'sales-quotation',
    name: 'Sales Quotations',
    category: 'Sales Management',
    categoryIcon: 'FileSpreadsheet',
    description: 'Price estimation quotes, item rate slabs, and customer validity dates.',
  },
  {
    id: 'sales-order',
    name: 'Sales Orders',
    category: 'Sales Management',
    categoryIcon: 'PackageCheck',
    description: 'Confirmed customer purchase orders and planned delivery dates.',
  },
  {
    id: 'sales-invoice',
    name: 'Sales Invoices & Tax Bills',
    category: 'Sales Management',
    categoryIcon: 'Receipt',
    description: 'GST tax invoices, HSN item calculations, and printable invoices.',
  },
  {
    id: 'sales-return-request',
    name: 'Sales Return Requests (RMA)',
    category: 'Sales Management',
    categoryIcon: 'RotateCcw',
    description: 'Customer return requests, condition checks, and RMA approvals.',
  },
  {
    id: 'sales-return',
    name: 'Sales Returns & Credit Notes',
    category: 'Sales Management',
    categoryIcon: 'CornerDownLeft',
    description: 'Credit note adjustments, restocked items, and refund processing.',
  },
  {
    id: 'sales-ar',
    name: 'Accounts Receivable (AR)',
    category: 'Sales Management',
    categoryIcon: 'Wallet',
    description: 'Customer aging analysis, payment terms, and overdue reminders.',
  },
  {
    id: 'sales-receipts',
    name: 'Sales Receipts & Collections',
    category: 'Sales Management',
    categoryIcon: 'CreditCard',
    description: 'Receipt voucher booking against outstanding sales invoices.',
  },
  {
    id: 'sales-reports',
    name: 'Sales Audit & Ledger Reports',
    category: 'Sales Management',
    categoryIcon: 'BarChart3',
    description: 'Item-wise sales history, tax liability registers, and sales margins.',
  },

  // Purchase Management
  {
    id: 'purchase-dashboard',
    name: 'Purchase & Procurement Dashboard',
    category: 'Purchase Management',
    categoryIcon: 'ShoppingBag',
    description: 'Procurement spend analysis, vendor payables, open PO commitments, and GRN tracking.',
  },
  {
    id: 'purchase-workflow',
    name: 'Purchase Workflow & Pipeline',
    category: 'Purchase Management',
    categoryIcon: 'Truck',
    description: 'Procurement cycle from PR requisition to goods receipt and payment.',
  },
  {
    id: 'purchase-request',
    name: 'Purchase Requisitions (PR)',
    category: 'Purchase Management',
    categoryIcon: 'FileText',
    description: 'Internal department material requests, budget verification, and approvals.',
  },
  {
    id: 'purchase-quotation',
    name: 'Vendor Quotations & RFQs',
    category: 'Purchase Management',
    categoryIcon: 'SlidersHorizontal',
    description: 'Multiple vendor price bids and comparative price matrix analysis.',
  },
  {
    id: 'purchase-order',
    name: 'Purchase Orders (PO)',
    category: 'Purchase Management',
    categoryIcon: 'ShoppingBag',
    description: 'Formal PO documents dispatched to approved institutional suppliers.',
  },
  {
    id: 'goods-receipt',
    name: 'Goods Receipt Notes (GRN)',
    category: 'Purchase Management',
    categoryIcon: 'PackageCheck',
    description: 'Physical material receiving, store quantity inspection, and QC acceptance.',
  },
  {
    id: 'purchase-invoice',
    name: 'Purchase Invoices (PI)',
    category: 'Purchase Management',
    categoryIcon: 'Receipt',
    description: 'Vendor bill booking, 3-way matching against PO and GRN, and input tax.',
  },
  {
    id: 'purchase-return',
    name: 'Purchase Returns (Debit Notes)',
    category: 'Purchase Management',
    categoryIcon: 'CornerDownLeft',
    description: 'Defective material return to vendor and debit note adjustment.',
  },
  {
    id: 'purchase-payments',
    name: 'Vendor Payments & Settlements',
    category: 'Purchase Management',
    categoryIcon: 'Landmark',
    description: 'Bank transfers, cheque payments, advance allocations, and payment advice.',
  },
  {
    id: 'purchase-reports',
    name: 'Purchase Registers & Reports',
    category: 'Purchase Management',
    categoryIcon: 'BarChart3',
    description: 'Procurement spend analysis, vendor lead times, and open PO audits.',
  },

  // Inventory Management
  {
    id: 'inventory-dashboard',
    name: 'Inventory & Warehouse Dashboard',
    category: 'Inventory Management',
    categoryIcon: 'Boxes',
    description: 'Total stock valuation (GL 1300), critical low-stock reorder triggers, and SKU catalog.',
  },
  {
    id: 'inventory-items',
    name: 'Inventory Items & Real-time Stock',
    category: 'Inventory Management',
    categoryIcon: 'Boxes',
    description: 'Warehouse item quantities, reorder alert thresholds, and bin locations.',
  },
  {
    id: 'inventory-valuation',
    name: 'Stock Valuation (FIFO / Weighted)',
    category: 'Inventory Management',
    categoryIcon: 'TrendingUp',
    description: 'Closing stock financial value and cost-of-goods-sold analysis.',
  },
  {
    id: 'inventory-movements',
    name: 'Stock Movements & Transfers',
    category: 'Inventory Management',
    categoryIcon: 'ArrowRightLeft',
    description: 'Inter-warehouse transfers, stock write-offs, and physical count audits.',
  },
  {
    id: 'item-master',
    name: 'Item Master Catalog',
    category: 'Inventory Management',
    categoryIcon: 'Package',
    description: 'SKU definitions, HSN codes, GST tax rates, units of measurement, and prices.',
  },

  // Party Management
  {
    id: 'party-directory',
    name: 'Party Directory (Vendors & Clients)',
    category: 'Party Management',
    categoryIcon: 'Building2',
    description: 'Master directory of institutional customers, vendors, GSTINs, and contacts.',
  },
  {
    id: 'party-ledger',
    name: 'Party Ledgers & Account Statements',
    category: 'Party Management',
    categoryIcon: 'FileSpreadsheet',
    description: 'Complete debit/credit transaction history and balance statements.',
  },

  // Finance & Accounts
  {
    id: 'finance-dashboard',
    name: 'Financial Health Dashboard',
    category: 'Finance & Accounts',
    categoryIcon: 'Landmark',
    description: 'Cashflow health, income vs expenses, and liquidity indicators.',
  },
  {
    id: 'finance-planner',
    name: 'Financial Budget & Planner',
    category: 'Finance & Accounts',
    categoryIcon: 'TrendingUp',
    description: 'Institutional operational budgets, quarterly runway, and capital plans.',
  },
  {
    id: 'finance-gl',
    name: 'General Ledger & Journal Entries',
    category: 'Finance & Accounts',
    categoryIcon: 'FileText',
    description: 'Double-entry journal vouchers, chart of accounts, and trial balances.',
  },
  {
    id: 'finance-cash-bank',
    name: 'Cash & Bank Accounts',
    category: 'Finance & Accounts',
    categoryIcon: 'CreditCard',
    description: 'Bank books, petty cash vaults, and automated bank reconciliations.',
  },
  {
    id: 'finance-loans',
    name: 'Loans & Institutional Liabilities',
    category: 'Finance & Accounts',
    categoryIcon: 'ShieldAlert',
    description: 'Institutional borrowings, EMI payment schedules, and interest expense.',
  },
  {
    id: 'finance-payments',
    name: 'Operational Expenses & Payments',
    category: 'Finance & Accounts',
    categoryIcon: 'Wallet',
    description: 'Daily expense vouchers, vendor remittances, and utility payments.',
  },
  {
    id: 'finance-receipts',
    name: 'Direct Receipts & Income',
    category: 'Finance & Accounts',
    categoryIcon: 'Receipt',
    description: 'Non-sales revenue receipts, donation receipts, and grant entries.',
  },

  // Document Expiry & Compliance
  {
    id: 'doc-dashboard',
    name: 'Compliance & Expiry Dashboard',
    category: 'Document Expiry & Compliance',
    categoryIcon: 'ShieldCheck',
    description: 'Overview of statutory certificates, affiliation renewals, and expiry alerts.',
  },
  {
    id: 'doc-registry',
    name: 'Institutional Document Registry',
    category: 'Document Expiry & Compliance',
    categoryIcon: 'FileText',
    description: 'Repository of government licenses, land deeds, insurance, and AMC policies.',
  },
  {
    id: 'doc-calendar',
    name: 'Expiry Calendar & Timeline',
    category: 'Document Expiry & Compliance',
    categoryIcon: 'Calendar',
    description: 'Interactive chronological calendar of upcoming renewal deadlines.',
  },
  {
    id: 'doc-reminders',
    name: 'Automated Renewal Alerts',
    category: 'Document Expiry & Compliance',
    categoryIcon: 'Bell',
    description: 'Configurable automated email and WhatsApp alerts prior to expiry dates.',
  },
  {
    id: 'doc-renewals',
    name: 'Document Renewals & Archival',
    category: 'Document Expiry & Compliance',
    categoryIcon: 'History',
    description: 'Renewal submission tracking, historical document versions, and audit trails.',
  },

  // Asset Management
  {
    id: 'asset-overview',
    name: 'Fixed Asset Overview',
    category: 'Asset Management',
    categoryIcon: 'Laptop',
    description: 'Total equipment net book value, depreciation rates, and category charts.',
  },
  {
    id: 'asset-register',
    name: 'Asset Register & Inventory Tags',
    category: 'Asset Management',
    categoryIcon: 'PackageCheck',
    description: 'Asset barcodes, serial numbers, custodians, departments, and condition.',
  },
  {
    id: 'asset-requests',
    name: 'Asset Requisitions & POs',
    category: 'Asset Management',
    categoryIcon: 'FileText',
    description: 'Staff equipment requests, IT asset allocation, and procurement POs.',
  },
  {
    id: 'asset-movements',
    name: 'Asset Movements & Transfers',
    category: 'Asset Management',
    categoryIcon: 'ArrowRightLeft',
    description: 'Inter-campus transfers, temporary staff checkouts, and return receipts.',
  },
  {
    id: 'asset-maintenance',
    name: 'Maintenance & AMC Contracts',
    category: 'Asset Management',
    categoryIcon: 'Wrench',
    description: 'Preventative servicing logs, vendor AMCs, and breakdown tickets.',
  },
  {
    id: 'asset-reports',
    name: 'Asset Depreciation & Audit Logs',
    category: 'Asset Management',
    categoryIcon: 'BarChart3',
    description: 'Asset depreciation schedules, write-offs, and physical verification audits.',
  },

  // Settings & Administration
  {
    id: 'pricing',
    name: 'Pricing & Product Masters',
    category: 'Settings & Administration',
    categoryIcon: 'Sliders',
    description: 'Academic fee plans, subscription tiers, and pricing presets.',
  },
  {
    id: 'company',
    name: 'Company Profile & Branding',
    category: 'Settings & Administration',
    categoryIcon: 'Building2',
    description: 'MYSAR institutional details, logos, GST credentials, and bank info.',
  },
  {
    id: 'proposal',
    name: 'Proposal Templates & Prefixes',
    category: 'Settings & Administration',
    categoryIcon: 'FileText',
    description: 'Proposal numbering prefixes, default terms, and legal clauses.',
  },
  {
    id: 'users',
    name: 'Users & Role Assignments (RBAC)',
    category: 'Settings & Administration',
    categoryIcon: 'Users',
    description: 'Portal credentials, member directory, and granular side menu access controls.',
  },
  {
    id: 'import',
    name: 'Data Import & CSV Migrations',
    category: 'Settings & Administration',
    categoryIcon: 'FileSpreadsheet',
    description: 'Bulk CSV spreadsheets import for leads, students, and institutional data.',
  },
  {
    id: 'integrations',
    name: 'Google Workspace & Automations',
    category: 'Settings & Administration',
    categoryIcon: 'Mail',
    description: 'Google Apps Script deployment, Gmail automated notifications, and Drive sync.',
  },
];

/**
 * Generate default permissions for a role
 */
export function getDefaultMenuPermissionsForRole(role: UserRole): Record<string, UserSideMenuPermission> {
  const result: Record<string, UserSideMenuPermission> = {};

  SIDE_MENU_DEFINITIONS.forEach((item) => {
    switch (role) {
      case 'Admin':
        // Full access on all modules
        result[item.id] = {
          viewOnly: true,
          entry: true,
          edit: true,
          delete: true,
        };
        break;

      case 'Manager':
        if (item.category === 'Settings & Administration') {
          // Limited admin access
          result[item.id] = {
            viewOnly: true,
            entry: false,
            edit: false,
            delete: false,
          };
        } else if (item.category === 'Finance & Accounts') {
          result[item.id] = {
            viewOnly: true,
            entry: true,
            edit: true,
            delete: false,
          };
        } else {
          // Team manager access across operations
          result[item.id] = {
            viewOnly: true,
            entry: true,
            edit: true,
            delete: item.id.includes('leads') || item.id.includes('proposals'),
          };
        }
        break;

      case 'Salesperson':
        if (item.category === 'Lead Management (CRM)' || item.category === 'Sales Management') {
          result[item.id] = {
            viewOnly: true,
            entry: true,
            edit: true,
            delete: false,
          };
        } else if (item.id === 'dashboard' || item.id === 'party-directory') {
          result[item.id] = {
            viewOnly: true,
            entry: false,
            edit: false,
            delete: false,
          };
        } else {
          // No access
          result[item.id] = {
            viewOnly: false,
            entry: false,
            edit: false,
            delete: false,
          };
        }
        break;

      case 'Staff':
      default:
        if (
          item.id === 'dashboard' ||
          item.id === 'hr-staff' ||
          item.id === 'hr-attendance' ||
          item.id === 'hr-kpi'
        ) {
          result[item.id] = {
            viewOnly: true,
            entry: item.id === 'hr-attendance',
            edit: false,
            delete: false,
          };
        } else {
          result[item.id] = {
            viewOnly: false,
            entry: false,
            edit: false,
            delete: false,
          };
        }
        break;
    }
  });

  return result;
}

/**
 * Get user-specific menu permissions with fallback to role defaults
 */
export function getUserMenuPermissions(user: User): Record<string, UserSideMenuPermission> {
  const roleDefaults = getDefaultMenuPermissionsForRole(user.role);

  try {
    const raw = localStorage.getItem(`mysar_user_menu_perms_${user.id}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const merged: Record<string, UserSideMenuPermission> = {};
        SIDE_MENU_DEFINITIONS.forEach((item) => {
          merged[item.id] = {
            ...roleDefaults[item.id],
            ...(parsed[item.id] || {}),
          };
        });
        return merged;
      }
    }
  } catch (e) {
    console.warn(`Failed to read menu permissions for user ${user.id}`, e);
  }

  return roleDefaults;
}

/**
 * Save user-specific menu permissions to localStorage
 */
export function saveUserMenuPermissions(
  userId: string,
  permissions: Record<string, UserSideMenuPermission>
): void {
  try {
    localStorage.setItem(`mysar_user_menu_perms_${userId}`, JSON.stringify(permissions));
  } catch (e) {
    console.error(`Failed to save menu permissions for user ${userId}`, e);
  }
}

/**
 * Reset user menu permissions to role defaults
 */
export function resetUserMenuPermissions(userId: string): void {
  try {
    localStorage.removeItem(`mysar_user_menu_perms_${userId}`);
  } catch (e) {
    console.error(`Failed to reset menu permissions for user ${userId}`, e);
  }
}

export const ONBOARDING_ASSIGNABLE_MODULES: Array<{
  id: string;
  label: string;
  category: string;
  navTabs: string[];
}> = [
  {
    id: 'Dashboard',
    label: 'Dashboard',
    category: 'Executive & Branch Overview',
    navTabs: ['dashboard', 'branch-dashboard', 'operations-dashboard'],
  },
  {
    id: 'Leads & Admissions',
    label: 'Leads & Admissions',
    category: 'CRM & Admissions',
    navTabs: ['lead-overview', 'leads', 'followups', 'proposals', 'meet', 'gmail', 'reports'],
  },
  {
    id: 'HR & Staff Directory',
    label: 'HR & Staff Directory',
    category: 'Human Resources',
    navTabs: [
      'hr-dashboard',
      'hr-staff',
      'hr-staff-access',
      'hr-recruitment',
      'hr-recruitment-positions',
      'hr-recruitment-applicants',
      'hr-recruitment-interviews',
      'hr-recruitment-offers',
      'hr-recruitment-appointments',
    ],
  },
  {
    id: 'Attendance & Leave',
    label: 'Attendance & Leave',
    category: 'Human Resources',
    navTabs: ['hr-attendance'],
  },
  {
    id: 'Payroll Management',
    label: 'Payroll Management',
    category: 'Human Resources',
    navTabs: ['hr-payroll'],
  },
  {
    id: 'KPI & Performance',
    label: 'KPI & Performance',
    category: 'Human Resources',
    navTabs: ['hr-kpi'],
  },
  {
    id: 'Sales & Billing',
    label: 'Sales & Billing',
    category: 'Commercial Operations',
    navTabs: [
      'sales',
      'sales-dashboard',
      'sales-workflow',
      'sales-quotation',
      'sales-order',
      'sales-invoice',
      'sales-return-request',
      'sales-return',
      'sales-quotation-report',
      'sales-order-report',
      'sales-invoice-report',
      'sales-return-request-report',
      'sales-return-report',
      'sales-ar',
      'sales-receipts',
    ],
  },
  {
    id: 'Purchase & Procurement',
    label: 'Purchase & Procurement',
    category: 'Commercial Operations',
    navTabs: [
      'purchase',
      'purchase-dashboard',
      'purchase-workflow',
      'purchase-request',
      'purchase-quotation',
      'purchase-quotation-comparison',
      'purchase-order',
      'goods-receipt',
      'purchase-invoice',
      'purchase-return-request',
      'purchase-return',
      'purchase-request-report',
      'purchase-quotation-report',
      'purchase-quotation-comparison-report',
      'purchase-order-report',
      'goods-receipt-report',
      'purchase-invoice-report',
      'purchase-return-request-report',
      'purchase-return-report',
      'purchase-payments',
      'purchase-advances',
    ],
  },
  {
    id: 'Inventory & Stock',
    label: 'Inventory & Stock',
    category: 'Warehouse & Inventory',
    navTabs: [
      'inventory',
      'inventory-dashboard',
      'inventory-items',
      'inventory-valuation',
      'inventory-movements',
      'item-master',
    ],
  },
  {
    id: 'Party & Vendor Ledger',
    label: 'Party & Vendor Ledger',
    category: 'Parties & Accounts',
    navTabs: ['party-management', 'party-directory', 'party-ledger', 'finance-parties', 'finance-party-ledger'],
  },
  {
    id: 'Finance & Accounts',
    label: 'Finance & Accounts',
    category: 'Finance & Accounting',
    navTabs: [
      'finance',
      'finance-dashboard',
      'finance-planner',
      'finance-ledger',
      'finance-projections',
      'finance-sales-ar',
      'finance-gl',
      'finance-cash-bank',
      'finance-loans',
      'finance-payments',
      'finance-receipts',
      'finance-advances',
      'finance-item-master',
      'finance-controls-audit',
      'finance-purchase',
      'finance-sales',
      'finance-tax',
      'finance-budget',
    ],
  },
  {
    id: 'Document & Expiry',
    label: 'Document & Expiry',
    category: 'Compliance',
    navTabs: [
      'doc-expiry',
      'doc-dashboard',
      'doc-registry',
      'doc-calendar',
      'doc-reminders',
      'doc-renewals',
      'doc-types',
    ],
  },
  {
    id: 'Asset Management',
    label: 'Asset Management',
    category: 'Assets & Facilities',
    navTabs: [
      'assets',
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
      'branch-dashboard',
    ],
  },
  {
    id: 'Academic Schedules',
    label: 'Academic Schedules',
    category: 'Academics',
    navTabs: ['dashboard', 'meet', 'hr-attendance', 'hr-kpi'],
  },
  {
    id: 'Reports & Analytics',
    label: 'Reports & Analytics',
    category: 'Analytics',
    navTabs: ['reports', 'sales-invoice-report', 'purchase-order-report', 'asset-reports'],
  },
  {
    id: 'System Settings',
    label: 'System Settings',
    category: 'Administration',
    navTabs: ['settings', 'hr-settings', 'hr-staff-access', 'pricing', 'company', 'proposal', 'templates', 'users', 'import', 'integrations', 'themes'],
  },
];

/**
 * Resolves a staff member's assignedModules list (from Onboard Staff > System & Access)
 * into concrete NavTab IDs. Supports both high-level module names (e.g., "Dashboard", "HR & Staff Directory")
 * and direct NavTab IDs (e.g., "hr-attendance", "leads").
 */
export function resolveAssignedModulesToNavTabs(assignedModules?: string[]): string[] {
  if (!assignedModules || assignedModules.length === 0) return [];
  const resolved = new Set<string>();

  assignedModules.forEach((mod) => {
    const clean = mod.trim();
    if (!clean) return;
    // Direct NavTab ID
    resolved.add(clean);

    // Match high-level module label
    const match = ONBOARDING_ASSIGNABLE_MODULES.find(
      (m) => m.id.toLowerCase() === clean.toLowerCase() || m.label.toLowerCase() === clean.toLowerCase()
    );
    if (match) {
      match.navTabs.forEach((t) => resolved.add(t));
    }
  });

  return Array.from(resolved);
}

