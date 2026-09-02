import React, { useState } from 'react';
import {
  X,
  Bell,
  Mail,
  Send,
  Calendar,
  User,
  Building2,
  Phone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { FollowUpNotification, User as UserType } from '../types';
import { notificationService } from '../services/notificationService';

interface FollowUpNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: FollowUpNotification[];
  currentUser: UserType;
  onNotificationSent?: () => void;
  onSelectLead?: (leadId: string) => void;
}

export const FollowUpNotificationModal: React.FC<FollowUpNotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  onNotificationSent,
  onSelectLead,
}) => {
  const [activeTab, setActiveTab] = useState<'pending' | 'preview' | 'history'>('pending');
  const [selectedNotif, setSelectedNotif] = useState<FollowUpNotification | null>(
    notifications[0] || null
  );
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [historyLogs, setHistoryLogs] = useState<FollowUpNotification[]>(
    notificationService.getNotificationLogs()
  );

  if (!isOpen) return null;

  const currentSelected = selectedNotif || notifications[0];
  const emailPreview = currentSelected
    ? notificationService.generateEmailTemplate(currentSelected)
    : null;

  const handleSendSingle = async (notif: FollowUpNotification) => {
    setIsSending(true);
    setSendSuccessMessage(null);
    try {
      const res = await notificationService.sendEmailReminder(notif);
      setSendSuccessMessage(res.message);
      setHistoryLogs(notificationService.getNotificationLogs());
      if (onNotificationSent) onNotificationSent();
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBatchAll = async () => {
    if (notifications.length === 0) return;
    setIsSending(true);
    setSendSuccessMessage(null);
    let count = 0;
    try {
      for (const notif of notifications) {
        await notificationService.sendEmailReminder(notif);
        count++;
      }
      setSendSuccessMessage(
        `Dispatched ${count} automated Gmail follow-up notifications to assigned sales representatives!`
      );
      setHistoryLogs(notificationService.getNotificationLogs());
      if (onNotificationSent) onNotificationSent();
    } finally {
      setIsSending(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'Overdue':
        return (
          <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Overdue</span>
          </span>
        );
      case 'Today':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Due Today</span>
          </span>
        );
      case 'Tomorrow':
        return (
          <span className="bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-[#168A45]" />
            <span>Tomorrow</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-gray-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
            Upcoming
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold shadow-2xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-800">
                  Automated Follow-up Notification Engine
                </h3>
                <span className="bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Gmail & GAS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Automated email alerts sent to assigned salespersons when follow-ups are approaching or due
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="bg-white border-b border-gray-200 px-6 flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'pending'
                ? 'border-[#168A45] text-[#0B5D2A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Approaching Follow-ups ({notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'preview'
                ? 'border-[#168A45] text-[#0B5D2A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>HTML Email Template Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'border-[#168A45] text-[#0B5D2A]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Dispatch History ({historyLogs.length})</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {sendSuccessMessage && (
          <div className="bg-[#EAF7EF] border-b border-[#D9E5DD] px-6 py-2.5 flex items-center justify-between text-xs text-[#0B5D2A] font-semibold animate-in fade-in">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
              <span>{sendSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSendSuccessMessage(null)}
              className="text-xs text-[#0B5D2A] hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F7FAF8]">
          {/* TAB 1: PENDING / DUE FOLLOW-UPS */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Follow-ups Requiring Notification
                  </h4>
                  <p className="text-xs text-slate-500">
                    Logged-in user: <strong>{currentUser.name}</strong> ({currentUser.role})
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSendBatchAll}
                    disabled={isSending || notifications.length === 0}
                    className="bg-[#168A45] hover:bg-[#0B5D2A] disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending Notifications...' : 'Send All Alerts via Gmail'}</span>
                  </button>
                </div>
              </div>

              {notifications.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                  <CheckCircle2 className="w-8 h-8 text-[#168A45] mx-auto mb-2" />
                  <h5 className="text-sm font-bold text-slate-700">All Follow-ups Up to Date!</h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    There are no approaching or overdue follow-ups requiring email reminders at this time.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-white border border-gray-200 hover:border-[#168A45] rounded-xl p-4 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-xs font-bold text-slate-800">
                            {notif.instituteName}
                          </span>
                          {getUrgencyBadge(notif.urgency)}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {notif.followUpType}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600">
                          <strong>Contact:</strong> {notif.contactPerson}{' '}
                          {notif.mobile && `(${notif.mobile})`}
                        </div>

                        <div className="text-xs text-slate-500 line-clamp-1 bg-[#F7FAF8] p-2 rounded border border-gray-100">
                          📝 {notif.discussion}
                        </div>

                        <div className="flex items-center space-x-4 text-[11px] text-slate-500 pt-1">
                          <span>📅 Due Date: <strong>{notif.followUpDate}</strong></span>
                          <span>👤 Assigned Rep: <strong>{notif.salespersonName}</strong> ({notif.salespersonEmail})</span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setSelectedNotif(notif);
                            setActiveTab('preview');
                          }}
                          className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] px-2.5 py-1.5 rounded hover:bg-[#EAF7EF] transition-colors"
                        >
                          Preview Email
                        </button>
                        <button
                          onClick={() => handleSendSingle(notif)}
                          disabled={isSending}
                          className="bg-[#168A45] hover:bg-[#0B5D2A] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Email</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL TEMPLATE PREVIEW */}
          {activeTab === 'preview' && currentSelected && emailPreview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200">
                <div className="text-xs text-slate-600">
                  Previewing email for: <strong>{currentSelected.instituteName}</strong> &rarr; Sent to: <strong>{currentSelected.salespersonEmail}</strong>
                </div>
                <button
                  onClick={() => handleSendSingle(currentSelected)}
                  disabled={isSending}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Send This Email Now</span>
                </button>
              </div>

              {/* Subject Bar */}
              <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs space-y-1 shadow-2xs">
                <div className="text-slate-400 font-semibold uppercase text-[10px]">Subject</div>
                <div className="font-bold text-slate-800">{emailPreview.subject}</div>
                <div className="text-slate-500 text-[11px]">
                  <strong>To:</strong> {currentSelected.salespersonName} &lt;{currentSelected.salespersonEmail}&gt; | <strong>From:</strong> MYSAR CRM (Google Apps Script / Gmail)
                </div>
              </div>

              {/* Rendered HTML inside Container */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs overflow-hidden">
                <div
                  className="prose max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: emailPreview.html }}
                />
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">
                  Recent Email Notification Logs
                </h4>
                {historyLogs.length > 0 && (
                  <button
                    onClick={() => {
                      notificationService.clearLogs();
                      setHistoryLogs([]);
                    }}
                    className="text-xs text-slate-400 hover:text-red-600 font-semibold"
                  >
                    Clear History
                  </button>
                )}
              </div>

              {historyLogs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 text-xs text-slate-400">
                  No email reminders have been dispatched yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {historyLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-gray-200 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#168A45]" />
                          <span className="font-bold text-slate-800">{log.instituteName}</span>
                          <span className="text-[10px] bg-[#EAF7EF] text-[#0B5D2A] px-2 py-0.5 rounded font-bold border border-[#D9E5DD]">
                            {log.urgency}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Sent to: {log.salespersonName} ({log.salespersonEmail}) &bull; Follow-up date: {log.followUpDate}
                        </p>
                      </div>

                      <div className="text-[11px] text-slate-400 text-right">
                        {log.sentAt ? new Date(log.sentAt).toLocaleString() : 'Just now'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Powered by Google Apps Script <code className="text-[#0B5D2A] font-bold">GmailApp.sendEmail()</code> & 8:00 AM Triggers
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
