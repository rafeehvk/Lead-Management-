import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Bell,
  Mail,
  Send,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  FileText,
  CheckCheck,
  Check,
  ArrowRight,
  Filter,
  Search,
  Building2,
  Sparkles,
  RefreshCw,
  FileCheck,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  History,
  Briefcase,
} from 'lucide-react';
import { FollowUp, Lead, User, Proposal, FollowUpNotification } from '../types';
import { NavTab } from './Sidebar';
import { notificationService } from '../services/notificationService';
import { hrStorage } from '../services/hrStorageService';
import { documentExpiryStorage } from '../services/documentExpiryStorage';
import { ExpiryDocument, calculateDaysRemaining } from '../types/documentExpiry';
import { LeaveRequest } from '../types/hr';

export type NotificationCategoryTab =
  | 'all'
  | 'leads'
  | 'hr'
  | 'documents'
  | 'proposals'
  | 'email_dispatch';

export type NotificationUrgency = 'critical' | 'high' | 'medium' | 'info';

export interface UnifiedNotificationItem {
  id: string;
  module: 'leads' | 'hr' | 'documents' | 'proposals';
  category: string;
  urgency: NotificationUrgency;
  title: string;
  description: string;
  dateStr?: string;
  actionLabel?: string;
  targetTab?: NavTab;
  isRead?: boolean;

  // Payloads
  leadId?: string;
  followUpId?: string;
  emailNotification?: FollowUpNotification;
  leaveRequest?: LeaveRequest;
  document?: ExpiryDocument;
  proposalId?: string;
}

interface AllNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  leads: Lead[];
  followUps: FollowUp[];
  proposals: Proposal[];
  users: User[];
  onRefreshAllData: () => void;
  onNavigateToTab: (tab: NavTab) => void;
  onSelectLead?: (leadId: string) => void;
  onOpenRenewModal?: (doc: ExpiryDocument) => void;
}

const READ_NOTIFS_STORAGE_KEY = 'mysar_read_notifications_v1';

export const AllNotificationsModal: React.FC<AllNotificationsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  leads,
  followUps,
  proposals,
  users,
  onRefreshAllData,
  onNavigateToTab,
  onSelectLead,
  onOpenRenewModal,
}) => {
  const [activeTab, setActiveTab] = useState<NotificationCategoryTab>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | NotificationUrgency>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(READ_NOTIFS_STORAGE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Action states
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);

  // Email dispatch preview selection
  const [selectedEmailNotif, setSelectedEmailNotif] = useState<FollowUpNotification | null>(null);
  const [dispatchHistory, setDispatchHistory] = useState<FollowUpNotification[]>(() => {
    return notificationService.getNotificationLogs();
  });

  // Persist read IDs
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const markAllRead = () => {
    const allIds = allNotifications.map((n) => n.id);
    const next = new Set([...readIds, ...allIds]);
    setReadIds(next);
    try {
      localStorage.setItem(READ_NOTIFS_STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch {}
    setActionSuccessMessage('All active notifications marked as read.');
  };

  // Compile Unified Notifications
  const allNotifications = useMemo(() => {
    const list: UnifiedNotificationItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. LEAD NOTIFICATIONS: Automated Email Follow-ups
    const dueFollowUps = notificationService.getDueFollowUpNotifications(followUps, leads, users);
    const processedFollowUpIds = new Set<string>();

    dueFollowUps.forEach((n) => {
      processedFollowUpIds.add(n.followUpId);
      const isOverdue = n.urgency === 'Overdue';
      list.push({
        id: `lead-email-${n.id}`,
        module: 'leads',
        category: isOverdue ? 'Overdue Follow-up' : 'Due Follow-up',
        urgency: isOverdue ? 'critical' : 'high',
        title: `${isOverdue ? 'Overdue' : 'Due Today'}: Follow-up with ${n.instituteName}`,
        description: `Scheduled meeting with ${n.contactPerson || 'Client'}. Assigned rep: ${n.salespersonName} (${n.salespersonEmail}). Ready for automated Gmail reminder.`,
        dateStr: n.followUpDate,
        actionLabel: 'Send Gmail Alert',
        targetTab: 'followups',
        leadId: n.leadId,
        followUpId: n.followUpId,
        emailNotification: n,
      });
    });

    // 2. LEAD NOTIFICATIONS: General Overdue Follow-ups (that might not be in email reminders)
    followUps.forEach((f) => {
      if (f.status === 'Completed' || f.status === 'Cancelled') return;
      if (processedFollowUpIds.has(f.id)) return;

      const targetDate = f.nextFollowUpDate || f.followUpDate;
      if (!targetDate) return;

      const lead = leads.find((l) => l.id === f.leadId);
      const instName = f.instituteName || lead?.instituteName || 'Lead';

      if (targetDate < today) {
        list.push({
          id: `lead-fup-od-${f.id}`,
          module: 'leads',
          category: 'Overdue Follow-up',
          urgency: 'critical',
          title: `Overdue Follow-up: ${instName}`,
          description: `Sales task assigned to ${f.staff} was scheduled for ${targetDate}. Deal protection action needed.`,
          dateStr: targetDate,
          actionLabel: 'View Follow-up',
          targetTab: 'followups',
          leadId: f.leadId,
          followUpId: f.id,
        });
      } else if (targetDate === today) {
        list.push({
          id: `lead-fup-today-${f.id}`,
          module: 'leads',
          category: 'Due Follow-up',
          urgency: 'high',
          title: `Due Today: Follow-up with ${instName}`,
          description: `Scheduled discussion with ${lead?.contactPerson || 'Client'} (${f.type || 'Call'}). Assigned rep: ${f.staff}.`,
          dateStr: targetDate,
          actionLabel: 'Open Follow-up',
          targetTab: 'followups',
          leadId: f.leadId,
          followUpId: f.id,
        });
      }
    });

    // 3. LEAD NOTIFICATIONS: New Inbound Leads needing contact
    leads.slice(0, 8).forEach((lead) => {
      if (lead.status === 'New') {
        list.push({
          id: `lead-new-${lead.id}`,
          module: 'leads',
          category: 'New Lead',
          urgency: 'medium',
          title: `New Lead: ${lead.instituteName}`,
          description: `Inbound prospect registered from ${lead.city || 'Kerala'} (${lead.source || 'Direct'}). Assigned to ${lead.assignedTo || 'Unassigned'}.`,
          dateStr: lead.createdDate,
          actionLabel: 'Contact Lead',
          targetTab: 'leads',
          leadId: lead.id,
        });
      }
    });

    // 4. HR NOTIFICATIONS: Pending Leave Requests
    try {
      const leaveRequests = hrStorage.getLeaveRequests();
      const pendingLeaves = leaveRequests.filter((lr) => lr.status === 'Pending');

      pendingLeaves.forEach((leave) => {
        list.push({
          id: `hr-leave-${leave.id}`,
          module: 'hr',
          category: 'Leave Approval',
          urgency: 'high',
          title: `Leave Approval: ${leave.staffName}`,
          description: `${leave.numberOfDays} days ${leave.leaveType} (${leave.fromDate} to ${leave.toDate}). Reason: ${leave.reason || 'Personal'}. Awaiting manager decision.`,
          dateStr: leave.fromDate,
          actionLabel: 'Approve / Review',
          targetTab: 'hr-staff',
          leaveRequest: leave,
        });
      });

      // 5. HR NOTIFICATIONS: Unmarked Daily Attendance
      const employees = hrStorage.getStaff();
      const attendanceToday = hrStorage.getAttendanceRecords(today);
      const unmarkedCount = employees.length - attendanceToday.length;

      if (unmarkedCount > 0 && employees.length > 0) {
        list.push({
          id: `hr-attendance-${today}`,
          module: 'hr',
          category: 'Daily Attendance',
          urgency: 'info',
          title: `Attendance Roster Incomplete`,
          description: `${unmarkedCount} staff members are currently unmarked for today's daily attendance record (${today}).`,
          dateStr: today,
          actionLabel: 'Mark Attendance',
          targetTab: 'hr-attendance',
        });
      }
    } catch (e) {
      console.error('Error fetching HR notifications:', e);
    }

    // 6. DOCUMENT NOTIFICATIONS: Expired & Expiring Documents
    try {
      const docs = documentExpiryStorage.getDocuments();

      docs.forEach((doc) => {
        const days = calculateDaysRemaining(doc.expiryDate, today);

        if (days < 0) {
          list.push({
            id: `doc-exp-${doc.id}`,
            module: 'documents',
            category: 'Document Expired',
            urgency: 'critical',
            title: `EXPIRED: ${doc.documentName}`,
            description: `${doc.documentTypeName} for ${doc.relatedParty} (${doc.department}) expired on ${doc.expiryDate}. Immediate renewal mandatory to avoid disruption.`,
            dateStr: doc.expiryDate,
            actionLabel: 'Renew Document',
            targetTab: 'doc-renewals',
            document: doc,
          });
        } else if (days <= 7) {
          list.push({
            id: `doc-7d-${doc.id}`,
            module: 'documents',
            category: 'Expiring in 7 Days',
            urgency: 'high',
            title: `Expires in ${days} days: ${doc.documentName}`,
            description: `${doc.relatedParty} • Ref: ${doc.referenceNumber} • Expiry: ${doc.expiryDate}. Approaching legal deadline.`,
            dateStr: doc.expiryDate,
            actionLabel: 'Renew Document',
            targetTab: 'doc-registry',
            document: doc,
          });
        } else if (days <= 30) {
          list.push({
            id: `doc-30d-${doc.id}`,
            module: 'documents',
            category: 'Upcoming Expiry (30d)',
            urgency: 'medium',
            title: `Expiring in ${days} days: ${doc.documentName}`,
            description: `${doc.documentTypeName} for ${doc.relatedParty} (${doc.department}). Scheduled for expiry on ${doc.expiryDate}.`,
            dateStr: doc.expiryDate,
            actionLabel: 'View in Registry',
            targetTab: 'doc-registry',
            document: doc,
          });
        }
      });
    } catch (e) {
      console.error('Error fetching document notifications:', e);
    }

    // 7. PROPOSAL NOTIFICATIONS: Proposals Pending / In Progress
    proposals.slice(0, 6).forEach((prop) => {
      if (['Draft', 'Sent', 'In Review'].includes(prop.status)) {
        list.push({
          id: `prop-pending-${prop.id}`,
          module: 'proposals',
          category: 'Proposal Pending',
          urgency: 'info',
          title: `Proposal ${prop.proposalNumber}: ${prop.instituteName}`,
          description: `Quote for ${prop.studentCount} students (₹${prop.totalAmount.toLocaleString('en-IN')}) is in ${prop.status} state since ${prop.proposalDate}.`,
          dateStr: prop.proposalDate,
          actionLabel: 'Open Proposals',
          targetTab: 'proposals',
          proposalId: prop.id,
        });
      }
    });

    // Sort order: Critical first, then High, then Medium, then Info
    const urgencyOrder: Record<NotificationUrgency, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      info: 3,
    };

    return list.sort((a, b) => {
      const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      if (diff !== 0) return diff;
      return (b.dateStr || '').localeCompare(a.dateStr || '');
    });
  }, [leads, followUps, proposals, users]);

  // Counts
  const counts = useMemo(() => {
    const unreadList = allNotifications.filter((n) => !readIds.has(n.id));
    return {
      total: allNotifications.length,
      unread: unreadList.length,
      leads: allNotifications.filter((n) => n.module === 'leads').length,
      hr: allNotifications.filter((n) => n.module === 'hr').length,
      documents: allNotifications.filter((n) => n.module === 'documents').length,
      proposals: allNotifications.filter((n) => n.module === 'proposals').length,
      critical: allNotifications.filter((n) => n.urgency === 'critical').length,
      high: allNotifications.filter((n) => n.urgency === 'high').length,
      emailDispatch: allNotifications.filter((n) => !!n.emailNotification).length,
    };
  }, [allNotifications, readIds]);

  // Filtered Notifications List
  const filteredList = useMemo(() => {
    return allNotifications.filter((item) => {
      // Category Tab filter
      if (activeTab === 'leads' && item.module !== 'leads') return false;
      if (activeTab === 'hr' && item.module !== 'hr') return false;
      if (activeTab === 'documents' && item.module !== 'documents') return false;
      if (activeTab === 'proposals' && item.module !== 'proposals') return false;
      if (activeTab === 'email_dispatch' && !item.emailNotification) return false;

      // Urgency filter
      if (selectedUrgency !== 'all' && item.urgency !== selectedUrgency) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.dateStr && item.dateStr.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allNotifications, activeTab, selectedUrgency, searchQuery]);

  // Set default selected email notification
  useEffect(() => {
    if (!selectedEmailNotif) {
      const firstWithEmail = allNotifications.find((n) => n.emailNotification);
      if (firstWithEmail?.emailNotification) {
        setSelectedEmailNotif(firstWithEmail.emailNotification);
      }
    }
  }, [allNotifications, selectedEmailNotif]);

  // Quick Inline Actions
  const handleSendSingleEmail = async (notif: FollowUpNotification) => {
    setSendingEmailId(notif.id);
    setActionSuccessMessage(null);
    try {
      const res = await notificationService.sendEmailReminder(notif);
      setActionSuccessMessage(res.message);
      setDispatchHistory(notificationService.getNotificationLogs());
      markAsRead(`lead-email-${notif.id}`);
      onRefreshAllData();
    } catch (e: any) {
      setActionSuccessMessage(`Failed to send email: ${e.message || 'Network error'}`);
    } finally {
      setSendingEmailId(null);
    }
  };

  const handleBatchSendEmails = async () => {
    const emailNotifs = allNotifications
      .filter((n) => n.emailNotification)
      .map((n) => n.emailNotification!);

    if (emailNotifs.length === 0) return;

    setIsBatchSending(true);
    setActionSuccessMessage(null);
    let sentCount = 0;
    try {
      for (const notif of emailNotifs) {
        await notificationService.sendEmailReminder(notif);
        markAsRead(`lead-email-${notif.id}`);
        sentCount++;
      }
      setActionSuccessMessage(`Successfully dispatched ${sentCount} Gmail reminders to sales reps.`);
      setDispatchHistory(notificationService.getNotificationLogs());
      onRefreshAllData();
    } catch (e: any) {
      setActionSuccessMessage(`Batch dispatch error: ${e.message || 'Unknown'}`);
    } finally {
      setIsBatchSending(false);
    }
  };

  const handleApproveLeave = (leave: LeaveRequest) => {
    try {
      hrStorage.updateLeaveStatus(
        leave.id,
        'Approved',
        'Approved directly from All Notifications Center',
        currentUser.name
      );
      markAsRead(`hr-leave-${leave.id}`);
      setActionSuccessMessage(`Leave request for ${leave.staffName} approved successfully.`);
      onRefreshAllData();
    } catch (e: any) {
      setActionSuccessMessage(`Error approving leave: ${e.message}`);
    }
  };

  const handleRejectLeave = (leave: LeaveRequest) => {
    try {
      hrStorage.updateLeaveStatus(
        leave.id,
        'Rejected',
        'Rejected from All Notifications Center',
        currentUser.name
      );
      markAsRead(`hr-leave-${leave.id}`);
      setActionSuccessMessage(`Leave request for ${leave.staffName} rejected.`);
      onRefreshAllData();
    } catch (e: any) {
      setActionSuccessMessage(`Error rejecting leave: ${e.message}`);
    }
  };

  const handleActionClick = (item: UnifiedNotificationItem) => {
    markAsRead(item.id);

    if (item.emailNotification && item.actionLabel === 'Send Gmail Alert') {
      handleSendSingleEmail(item.emailNotification);
      return;
    }

    if (item.document && onOpenRenewModal && item.actionLabel === 'Renew Document') {
      onClose();
      onOpenRenewModal(item.document);
      return;
    }

    if (item.leadId && onSelectLead && (item.actionLabel === 'Contact Lead' || item.actionLabel === 'Open Lead')) {
      onClose();
      onSelectLead(item.leadId);
      return;
    }

    if (item.targetTab) {
      onClose();
      onNavigateToTab(item.targetTab);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 1. Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  All Notifications & Alerts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                  {counts.unread} Active / Unread
                </span>
                {counts.critical > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200 animate-pulse">
                    {counts.critical} Critical
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Unified cross-system alerts for Leads, HR leave requests, Document compliance, and Automated Gmail dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              onClick={markAllRead}
              title="Mark all notifications as read"
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Mark All Read</span>
            </button>

            {counts.emailDispatch > 0 && (
              <button
                onClick={handleBatchSendEmails}
                disabled={isBatchSending}
                title="Send automated Gmail reminders to all assigned sales reps"
                className="px-3.5 py-1.5 rounded-xl bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isBatchSending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Send All Emails</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toast Feedback Message */}
        {actionSuccessMessage && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-1">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
            <button
              onClick={() => setActionSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 2. Top Navigation Tabs Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-slate-50 border-b border-slate-200 flex items-center space-x-1 overflow-x-auto text-xs shrink-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <span>All Notifications</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'leads'
                ? 'bg-[#168A45] text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Leads & Follow-ups</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'leads' ? 'bg-[#0B5D2A] text-white' : 'bg-emerald-100 text-[#0B5D2A]'
              }`}
            >
              {counts.leads}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hr')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'hr'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>HR & Staff</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'hr' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {counts.hr}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'documents'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Documents & Expiry</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'documents' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {counts.documents}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('proposals')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'proposals'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Proposals</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'proposals' ? 'bg-purple-800 text-white' : 'bg-purple-100 text-purple-800'
              }`}
            >
              {counts.proposals}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('email_dispatch')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center space-x-1.5 cursor-pointer shrink-0 ${
              activeTab === 'email_dispatch'
                ? 'bg-emerald-800 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Dispatch Hub</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'email_dispatch'
                  ? 'bg-emerald-950 text-white'
                  : 'bg-emerald-100 text-[#0B5D2A]'
              }`}
            >
              {counts.emailDispatch}
            </span>
          </button>
        </div>

        {/* 3. Sub-filter & Search Toolbar */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs shrink-0">
          <div className="flex items-center space-x-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
              Filter:
            </span>
            {(['all', 'critical', 'high', 'medium', 'info'] as const).map((urgency) => (
              <button
                key={urgency}
                onClick={() => setSelectedUrgency(urgency)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer capitalize shrink-0 ${
                  selectedUrgency === urgency
                    ? urgency === 'critical'
                      ? 'bg-red-600 text-white'
                      : urgency === 'high'
                      ? 'bg-amber-600 text-white'
                      : urgency === 'medium'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {urgency === 'all' ? 'All Urgencies' : urgency}
              </button>
            ))}
          </div>

          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#168A45] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* 4. Content Area: Card List OR Email Dispatch Hub */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 space-y-3">
          {activeTab === 'email_dispatch' ? (
            /* Email Dispatch Template Preview & Batch Sender View */
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#0B5D2A] flex items-center space-x-1.5">
                    <Mail className="w-4 h-4" />
                    <span>Automated Follow-up Gmail Alerts</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Dispatches formatted Gmail reminder messages with direct institutional contact details, notes, and task urgency to the assigned salesperson.
                  </p>
                </div>
                {allNotifications.some((n) => n.emailNotification) && (
                  <button
                    onClick={handleBatchSendEmails}
                    disabled={isBatchSending}
                    className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isBatchSending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Dispatch All ({counts.emailDispatch})</span>
                  </button>
                )}
              </div>

              {/* Due Email Reminders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left: Pending Follow-up Items */}
                <div className="space-y-2.5">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Due Follow-ups for Sales Notification ({counts.emailDispatch})
                  </h5>

                  {allNotifications
                    .filter((n) => n.emailNotification)
                    .map((item) => {
                      const notif = item.emailNotification!;
                      const isSelected = selectedEmailNotif?.id === notif.id;
                      const isSendingThis = sendingEmailId === notif.id;

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedEmailNotif(notif)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-white border-[#168A45] shadow-md ring-1 ring-[#168A45]'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-900">{notif.instituteName}</span>
                            <span
                              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                notif.urgency === 'Overdue'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {notif.urgency}
                            </span>
                          </div>

                          <p className="text-slate-600 text-[11px] line-clamp-2">
                            {notif.notes || 'Routine follow-up discussion scheduled.'}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Rep: {notif.salespersonName}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendSingleEmail(notif);
                              }}
                              disabled={isSendingThis}
                              className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                            >
                              {isSendingThis ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              <span>Send Now</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {counts.emailDispatch === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                      No follow-ups currently pending email dispatch.
                    </div>
                  )}
                </div>

                {/* Right: Email Template Preview */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Gmail Message Preview
                  </h5>

                  {selectedEmailNotif ? (
                    (() => {
                      const template = notificationService.generateEmailTemplate(selectedEmailNotif);
                      return (
                        <div className="space-y-3 flex-1 flex flex-col">
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                            <div>
                              <span className="font-bold text-slate-600">To: </span>
                              <span className="font-mono text-slate-800">
                                {selectedEmailNotif.salespersonEmail}
                              </span>
                            </div>
                            <div>
                              <span className="font-bold text-slate-600">Subject: </span>
                              <span className="font-semibold text-slate-800">{template.subject}</span>
                            </div>
                          </div>

                          <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap flex-1 max-h-60 overflow-y-auto">
                            {template.text}
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400">
                              Dispatched via CASBIRO Mail Dispatcher
                            </span>
                            <button
                              onClick={() => handleSendSingleEmail(selectedEmailNotif)}
                              disabled={sendingEmailId === selectedEmailNotif.id}
                              className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              {sendingEmailId === selectedEmailNotif.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Send This Gmail Alert</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 flex-1 flex items-center justify-center">
                      Select a follow-up item on the left to preview its email template.
                    </div>
                  )}
                </div>
              </div>

              {/* Dispatch History Log */}
              {dispatchHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                      <History className="w-3.5 h-3.5 text-slate-500" />
                      <span>Recent Email Dispatch History ({dispatchHistory.length})</span>
                    </h5>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {dispatchHistory.slice(0, 5).map((log, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="font-semibold text-slate-800">{log.instituteName}</span>
                          <span className="text-slate-400">• To: {log.salespersonName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Dispatched</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Standard Filtered Notification Cards */
            <div className="space-y-2.5">
              {filteredList.length > 0 ? (
                filteredList.map((item) => {
                  const isRead = readIds.has(item.id);
                  const isCritical = item.urgency === 'critical';
                  const isHigh = item.urgency === 'high';
                  const isMedium = item.urgency === 'medium';

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border text-xs transition-all relative ${
                        isRead
                          ? 'bg-white/60 border-slate-200 opacity-65'
                          : isCritical
                          ? 'bg-red-50/70 border-red-200 text-red-950 shadow-xs'
                          : isHigh
                          ? 'bg-amber-50/60 border-amber-200 text-amber-950 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 min-w-0">
                          {/* Module Urgency Icon Badge */}
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                              isCritical
                                ? 'bg-red-600 text-white shadow-xs'
                                : isHigh
                                ? 'bg-amber-500 text-white shadow-xs'
                                : isMedium
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {item.module === 'leads' ? (
                              <Users className="w-4 h-4" />
                            ) : item.module === 'hr' ? (
                              <Briefcase className="w-4 h-4" />
                            ) : item.module === 'documents' ? (
                              <FileCheck className="w-4 h-4" />
                            ) : (
                              <FileText className="w-4 h-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  item.module === 'leads'
                                    ? 'bg-emerald-100 text-[#0B5D2A] border border-emerald-200'
                                    : item.module === 'hr'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : item.module === 'documents'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                                }`}
                              >
                                {item.module}
                              </span>

                              <span
                                className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isCritical
                                    ? 'bg-red-600 text-white'
                                    : isHigh
                                    ? 'bg-amber-600 text-white'
                                    : isMedium
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {item.category}
                              </span>

                              {item.dateStr && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {item.dateStr}
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                              {item.title}
                            </h4>

                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Unread indicator dot */}
                        {!isRead && (
                          <span
                            title="Unread"
                            className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0 mt-1 animate-ping"
                          />
                        )}
                      </div>

                      {/* Action Row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          {/* HR Leave direct action buttons */}
                          {item.leaveRequest ? (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => handleApproveLeave(item.leaveRequest!)}
                                className="px-3 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve Leave</span>
                              </button>
                              <button
                                onClick={() => handleRejectLeave(item.leaveRequest!)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : item.emailNotification ? (
                            <button
                              onClick={() => handleActionClick(item)}
                              disabled={sendingEmailId === item.emailNotification.id}
                              className="px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
                            >
                              {sendingEmailId === item.emailNotification.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>Send Gmail Alert</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActionClick(item)}
                              className="px-3.5 py-1.5 bg-slate-900 hover:bg-[#168A45] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
                            >
                              <span>{item.actionLabel || 'View Details'}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {item.leadId && item.module === 'leads' && (
                            <button
                              onClick={() => {
                                markAsRead(item.id);
                                onClose();
                                if (onSelectLead) onSelectLead(item.leadId!);
                                else onNavigateToTab('leads');
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                            >
                              <span>Open Lead</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => toggleRead(item.id)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer flex items-center space-x-1"
                        >
                          <span>{isRead ? 'Mark as Unread' : 'Dismiss'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 text-sm">All caught up!</p>
                  <p className="mt-1">
                    No active notifications or alerts matching the selected filters.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Footer Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700">Total Notifications:</span>
            <span className="font-bold text-slate-900">{counts.total}</span>
            <span className="text-slate-300">•</span>
            <span>Unread:</span>
            <span className="font-bold text-emerald-700">{counts.unread}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onNavigateToTab('dashboard');
              }}
              className="px-3 py-1.5 text-slate-600 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Open Main Dashboard
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
