// ============================================================================
// Document & Expiry Management - Type Definitions
// ============================================================================

export type StandardDocumentTypeName =
  | 'Warranty Expiry'
  | 'Payment Expiry'
  | 'Account Expiry'
  | 'License Expiry'
  | 'Contract Expiry'
  | 'Insurance Expiry'
  | 'AMC Expiry'
  | 'Subscription Expiry'
  | 'Certificate Expiry'
  | 'Agreement Expiry'
  | 'Domain Expiry'
  | 'Software License Expiry'
  | 'Vehicle Insurance / Registration Expiry'
  | 'Employee Document Expiry'
  | 'Government License / Registration Expiry'
  | 'ID / Passport / Visa Expiry'
  | 'Membership Expiry'
  | 'Other / Custom Expiry';

export type NotificationChannel =
  | 'system'    // 🔔 System Notification
  | 'email'     // 📧 Email
  | 'sms'       // 📱 SMS
  | 'whatsapp'  // 💬 WhatsApp
  | 'dashboard'; // 🖥️ Dashboard Alert

export type DocumentStatus = 'Active' | 'Expiring' | 'Expired' | 'Renewed';

export type UrgencyLevel =
  | 'expired'         // 🔴 Expired
  | 'expiring_today'  // 🟠 Expiring Today
  | 'expiring_7d'     // 🟡 Expiring within 7 Days
  | 'expiring_30d'    // 🟡 Expiring within 30 Days
  | 'expiring_90d'    // 🔵 Expiring within 90 Days
  | 'active'          // 🟢 Active (> 90 days)
  | 'renewed';        // 🟢 Renewed

export interface CustomDocumentType {
  id: string;
  name: string;
  category: 'Standard' | 'Custom';
  code: string;
  description?: string;
  defaultDepartment: string;
  defaultReminders: number[]; // e.g. [90, 60, 30, 15, 7, 3, 1, 0, -1]
  defaultNotificationChannels: NotificationChannel[];
  responsiblePerson?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRenewalRecord {
  id: string;
  documentId: string;
  renewalDate: string; // YYYY-MM-DD
  renewedBy: string;
  previousStartDate: string;
  previousExpiryDate: string;
  newStartDate: string;
  newExpiryDate: string;
  previousAmount?: number;
  newAmount?: number;
  currency: string;
  vendorOrIssuer?: string;
  invoiceOrReceiptNumber?: string;
  previousAttachmentName?: string;
  previousAttachmentUrl?: string;
  newAttachmentName?: string;
  newAttachmentUrl?: string;
  remarks?: string;
  createdAt: string;
}

export interface ExpiryDocument {
  id: string;
  documentTypeId: string;
  documentTypeName: string;
  documentName: string;
  referenceNumber: string;
  relatedParty: string;
  relatedPartyType:
    | 'Customer'
    | 'Supplier'
    | 'Employee'
    | 'Institution'
    | 'Government / Authority'
    | 'Bank / Financial'
    | 'Other';
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  amount?: number;
  currency: string; // e.g. "INR", "USD", "AED", "SAR"
  responsiblePerson: string;
  responsibleEmail?: string;
  responsiblePhone?: string;
  department: string; // Finance, HR, IT, Admin, Operations, Legal, etc.
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
  remarks?: string;
  status: DocumentStatus;
  reminderDays: number[]; // [90, 60, 30, 15, 7, 3, 1, 0, -1]
  notificationChannels: NotificationChannel[];
  renewalCount: number;
  renewalHistory: DocumentRenewalRecord[];
  createdAt: string;
  updatedAt: string;
  lastReminderSentAt?: string;
}

export interface ReminderNotificationLog {
  id: string;
  documentId: string;
  documentName: string;
  documentTypeName: string;
  referenceNumber: string;
  recipient: string;
  channel: NotificationChannel;
  triggerDays: number; // e.g. 30, 7, 1, 0
  sentAt: string;
  status: 'Delivered' | 'Sent' | 'Pending' | 'Failed';
  messagePreview: string;
}

export interface ExpiryFilterOptions {
  search: string;
  documentType: string;
  department: string;
  responsiblePerson: string;
  status: string;
  urgency: string;
  startDateRange?: { from?: string; to?: string };
  expiryDateRange?: { from?: string; to?: string };
}

export interface ExpiryDashboardMetrics {
  totalDocuments: number;
  expiredCount: number;
  expiringTodayCount: number;
  expiring7dCount: number;
  expiring30dCount: number;
  expiring90dCount: number;
  renewedCount: number;
  activeCount: number;
  totalRenewalCostExposure: number;
  currency: string;
}

// ----------------------------------------------------------------------------
// Calculation Helpers
// ----------------------------------------------------------------------------

export function calculateDaysRemaining(expiryDateStr: string, referenceDateStr?: string): number {
  const ref = referenceDateStr ? new Date(referenceDateStr) : new Date();
  ref.setHours(0, 0, 0, 0);

  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - ref.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getUrgencyLevel(doc: ExpiryDocument, referenceDateStr?: string): UrgencyLevel {
  if (doc.status === 'Renewed') {
    return 'renewed';
  }

  const days = calculateDaysRemaining(doc.expiryDate, referenceDateStr);

  if (days < 0) return 'expired';
  if (days === 0) return 'expiring_today';
  if (days <= 7) return 'expiring_7d';
  if (days <= 30) return 'expiring_30d';
  if (days <= 90) return 'expiring_90d';
  return 'active';
}

export function getUrgencyBadge(urgency: UrgencyLevel, days: number): {
  label: string;
  badgeClass: string;
  dotColor: string;
  iconName: string;
} {
  switch (urgency) {
    case 'expired':
      return {
        label: `Expired (${Math.abs(days)}d ago)`,
        badgeClass: 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-500/20',
        dotColor: 'bg-red-500',
        iconName: 'AlertOctagon',
      };
    case 'expiring_today':
      return {
        label: 'Expiring Today',
        badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold ring-1 ring-amber-500/30 animate-pulse',
        dotColor: 'bg-amber-600',
        iconName: 'AlertTriangle',
      };
    case 'expiring_7d':
      return {
        label: `${days} ${days === 1 ? 'day' : 'days'} left`,
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotColor: 'bg-amber-500',
        iconName: 'AlertCircle',
      };
    case 'expiring_30d':
      return {
        label: `${days} days left`,
        badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        dotColor: 'bg-yellow-500',
        iconName: 'Clock',
      };
    case 'expiring_90d':
      return {
        label: `${days} days left`,
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        dotColor: 'bg-blue-500',
        iconName: 'Calendar',
      };
    case 'renewed':
      return {
        label: 'Renewed',
        badgeClass: 'bg-emerald-50 text-[#0B5D2A] border-emerald-200',
        dotColor: 'bg-[#168A45]',
        iconName: 'CheckCircle2',
      };
    case 'active':
    default:
      return {
        label: `${days} days remaining`,
        badgeClass: 'bg-emerald-50/70 text-slate-700 border-emerald-100',
        dotColor: 'bg-emerald-500',
        iconName: 'ShieldCheck',
      };
  }
}

export const STANDARD_REMINDER_OPTIONS: Array<{ days: number; label: string }> = [
  { days: 90, label: '90 days before expiry' },
  { days: 60, label: '60 days before expiry' },
  { days: 30, label: '30 days before expiry' },
  { days: 15, label: '15 days before expiry' },
  { days: 7, label: '7 days before expiry' },
  { days: 3, label: '3 days before expiry' },
  { days: 1, label: '1 day before expiry' },
  { days: 0, label: 'On expiry date' },
  { days: -1, label: 'After expiry (Overdue escalation)' },
];

export const NOTIFICATION_CHANNEL_META: Record<
  NotificationChannel,
  { label: string; icon: string; color: string; description: string }
> = {
  system: {
    label: 'System Notification',
    icon: 'Bell',
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    description: 'In-app notification banner and activity bell ticker',
  },
  email: {
    label: 'Email',
    icon: 'Mail',
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    description: 'HTML renewal notification delivered to responsible email',
  },
  sms: {
    label: 'SMS',
    icon: 'Smartphone',
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    description: 'Short text alert to phone number with direct review link',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'MessageSquare',
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    description: 'Official WhatsApp Business reminder with action button',
  },
  dashboard: {
    label: 'Dashboard Alert',
    icon: 'LayoutDashboard',
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    description: 'Top urgency banner and KPI spotlight on central ERP dashboard',
  },
};
