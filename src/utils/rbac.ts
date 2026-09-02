import { User, UserRole, Lead, Proposal } from '../types';

export interface RolePermissionConfig {
  canViewAllLeads: boolean;
  canEditAllLeads: boolean;
  canDeleteLeads: boolean;
  canReassignLeads: boolean;
  canApproveProposals: boolean;
  canDeleteProposals: boolean;
  canManageSettings: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
  canAccessGasHub: boolean;
  canTriggerAllReminders: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissionConfig> = {
  Admin: {
    canViewAllLeads: true,
    canEditAllLeads: true,
    canDeleteLeads: true,
    canReassignLeads: true,
    canApproveProposals: true,
    canDeleteProposals: true,
    canManageSettings: true,
    canManageUsers: true,
    canExportData: true,
    canAccessGasHub: true,
    canTriggerAllReminders: true,
  },
  Manager: {
    canViewAllLeads: true,
    canEditAllLeads: true,
    canDeleteLeads: false,
    canReassignLeads: true,
    canApproveProposals: true,
    canDeleteProposals: false,
    canManageSettings: false,
    canManageUsers: false,
    canExportData: true,
    canAccessGasHub: true,
    canTriggerAllReminders: true,
  },
  Salesperson: {
    canViewAllLeads: false,
    canEditAllLeads: false,
    canDeleteLeads: false,
    canReassignLeads: false,
    canApproveProposals: false,
    canDeleteProposals: false,
    canManageSettings: false,
    canManageUsers: false,
    canExportData: false,
    canAccessGasHub: false,
    canTriggerAllReminders: false,
  },
};

export const PERMISSION_METADATA: {
  key: keyof RolePermissionConfig;
  label: string;
  category: 'Leads & Pipeline' | 'Proposals' | 'Administration & System';
  description: string;
}[] = [
  {
    key: 'canViewAllLeads',
    label: 'View All Leads',
    category: 'Leads & Pipeline',
    description: 'Allow viewing all institutional accounts in the pipeline rather than just assigned accounts',
  },
  {
    key: 'canEditAllLeads',
    label: 'Edit Any Lead',
    category: 'Leads & Pipeline',
    description: 'Modify institute data, contact info, and statuses of leads assigned to other representatives',
  },
  {
    key: 'canReassignLeads',
    label: 'Reassign Leads',
    category: 'Leads & Pipeline',
    description: 'Change the assigned salesperson for any lead or reallocate accounts',
  },
  {
    key: 'canDeleteLeads',
    label: 'Delete Leads',
    category: 'Leads & Pipeline',
    description: 'Permanently remove leads and associated histories from the CRM database',
  },
  {
    key: 'canApproveProposals',
    label: 'Approve Proposals',
    category: 'Proposals',
    description: 'Sign-off and mark commercial proposals as Approved / Accepted',
  },
  {
    key: 'canDeleteProposals',
    label: 'Delete Proposals',
    category: 'Proposals',
    description: 'Permanently remove pricing proposals and generated quotes',
  },
  {
    key: 'canManageUsers',
    label: 'Manage Team Members',
    category: 'Administration & System',
    description: 'Create, edit, reassign roles, and activate/deactivate team accounts',
  },
  {
    key: 'canManageSettings',
    label: 'System & Pricing Masters',
    category: 'Administration & System',
    description: 'Configure pricing plan types, branding profile, and proposal prefixes',
  },
  {
    key: 'canExportData',
    label: 'Export CRM Data (CSV)',
    category: 'Administration & System',
    description: 'Download CSV spreadsheets of Leads, Proposals, and Follow-ups tables',
  },
  {
    key: 'canAccessGasHub',
    label: 'Google Apps Script Hub',
    category: 'Administration & System',
    description: 'Access backend GAS sync code, webhook URLs, and schema utilities',
  },
  {
    key: 'canTriggerAllReminders',
    label: 'Dispatch All Follow-up Reminders',
    category: 'Administration & System',
    description: 'Trigger organization-wide daily email digest reminders via Gmail',
  },
];

export function getEffectivePermissions(role: UserRole): RolePermissionConfig {
  try {
    const raw = localStorage.getItem('mysar_rbac_permissions_v1');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed[role]) {
        return {
          ...DEFAULT_ROLE_PERMISSIONS[role],
          ...parsed[role],
        };
      }
    }
  } catch (e) {
    // Fallback to default
  }
  return DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.Salesperson;
}

export const ROLE_DEFINITIONS: Record<
  UserRole,
  {
    name: string;
    title: string;
    description: string;
    permissions: string[];
    badgeClass: string;
    dotColor: string;
  }
> = {
  Admin: {
    name: 'Administrator',
    title: 'Super Administrator',
    description: 'Full unrestricted master access across all records, database tables, team users, and system settings.',
    permissions: [
      'View all institutional leads and financial metrics',
      'Create, edit, reassign, and delete any lead',
      'Generate, edit, approve, and delete commercial proposals',
      'Manage team user accounts and assign roles',
      'Configure MYSAR company details & proposal sequences',
      'Access Google Apps Script code hub and database initialization',
      'Export full CSV databases and reset demo environment',
    ],
    badgeClass: 'bg-emerald-100 text-[#0B5D2A] border-emerald-300 font-bold',
    dotColor: 'bg-[#0B5D2A]',
  },
  Manager: {
    name: 'Sales Manager',
    title: 'Regional Sales Manager',
    description: 'Oversees institutional sales team performance, reviews proposals, reassigns leads, and tracks conversion pipelines.',
    permissions: [
      'View all institutional leads, follow-ups, and team proposals',
      'Create, edit, and reassign leads to sales representatives',
      'Generate commercial proposals and change proposal statuses',
      'View team sales performance and conversion analytics',
      'Export CSV reports of CRM data',
      'Send automated follow-up email notifications to reps',
    ],
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200 font-semibold',
    dotColor: 'bg-teal-600',
  },
  Salesperson: {
    name: 'Salesperson',
    title: 'Institutional Sales Representative',
    description: 'Focuses on assigned institutional accounts, logging daily interaction notes, scheduled demos, and client proposals.',
    permissions: [
      'View and manage assigned institutional leads and follow-ups',
      'Create new leads and schedule client interaction follow-ups',
      'Generate commercial proposals for assigned school leads',
      'Receive automated email reminders for approaching follow-up dates',
      'Log call, meeting, and demo discussion notes',
    ],
    badgeClass: 'bg-[#EAF7EF] text-[#168A45] border-[#D9E5DD] font-semibold',
    dotColor: 'bg-[#168A45]',
  },
};

/**
 * Access Control Evaluators
 */
export const hasPermission = {
  canViewAllLeads: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canViewAllLeads;
  },

  canCreateLead: (_user: User): boolean => {
    return true; // All roles can create leads
  },

  canEditLead: (user: User, lead?: Lead | null): boolean => {
    const p = getEffectivePermissions(user.role);
    if (p.canEditAllLeads) return true;
    if (!lead) return true;
    return lead.assignedTo === user.name;
  },

  canDeleteLead: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canDeleteLeads;
  },

  canReassignLead: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canReassignLeads;
  },

  canCreateProposal: (user: User, lead?: Lead | null): boolean => {
    const p = getEffectivePermissions(user.role);
    if (p.canEditAllLeads) return true;
    if (!lead) return true;
    return lead.assignedTo === user.name;
  },

  canDeleteProposal: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canDeleteProposals;
  },

  canApproveProposal: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canApproveProposals;
  },

  canManageSettings: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canManageSettings;
  },

  canManageUsers: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canManageUsers;
  },

  canExportData: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canExportData;
  },

  canAccessGasHub: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canAccessGasHub;
  },

  canTriggerAllReminders: (user: User): boolean => {
    const p = getEffectivePermissions(user.role);
    return p.canTriggerAllReminders;
  },
};
