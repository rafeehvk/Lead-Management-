import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  LayoutDashboard,
  CheckCircle2,
  Send,
  Clock,
  Shield,
  Filter,
  Check,
  Search,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  ExpiryDocument,
  NotificationChannel,
  ReminderNotificationLog,
  STANDARD_REMINDER_OPTIONS,
  NOTIFICATION_CHANNEL_META,
  calculateDaysRemaining,
} from '../../types/documentExpiry';

interface RemindersTabProps {
  documents: ExpiryDocument[];
  logs: ReminderNotificationLog[];
  onTriggerTestNotification: (
    doc: ExpiryDocument,
    channel: NotificationChannel
  ) => void;
}

export const RemindersTab: React.FC<RemindersTabProps> = ({
  documents,
  logs,
  onTriggerTestNotification,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents.length > 0 ? documents[0].id : ''
  );
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>('whatsapp');
  const [testSentFeedback, setTestSentFeedback] = useState<string | null>(null);
  const [searchLog, setSearchLog] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || documents[0];

  const handleSendTest = () => {
    if (!selectedDoc) return;
    onTriggerTestNotification(selectedDoc, selectedChannel);
    setTestSentFeedback(
      `Test alert triggered successfully via ${NOTIFICATION_CHANNEL_META[selectedChannel].label} to ${
        selectedChannel === 'email'
          ? selectedDoc.responsibleEmail || 'admin@casbiro.com'
          : selectedChannel === 'whatsapp' || selectedChannel === 'sms'
          ? selectedDoc.responsiblePhone || '+91 98470 00000'
          : selectedDoc.responsiblePerson
      }!`
    );
    setTimeout(() => {
      setTestSentFeedback(null);
    }, 4500);
  };

  const filteredLogs = logs.filter((log) => {
    if (channelFilter !== 'all' && log.channel !== channelFilter) return false;
    if (searchLog.trim()) {
      const q = searchLog.toLowerCase();
      return (
        log.documentName.toLowerCase().includes(q) ||
        log.recipient.toLowerCase().includes(q) ||
        log.referenceNumber.toLowerCase().includes(q) ||
        log.messagePreview.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Notification Channels Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {(Object.keys(NOTIFICATION_CHANNEL_META) as NotificationChannel[]).map((ch) => {
          const meta = NOTIFICATION_CHANNEL_META[ch];
          const channelLogsCount = logs.filter((l) => l.channel === ch).length;

          return (
            <div
              key={ch}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.color}`}
                  >
                    <span>
                      {ch === 'system' && '🔔'}
                      {ch === 'email' && '📧'}
                      {ch === 'sms' && '📱'}
                      {ch === 'whatsapp' && '💬'}
                      {ch === 'dashboard' && '🖥️'}
                    </span>
                    <span>{meta.label}</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Online</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{meta.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                <span className="text-[10px] text-slate-400">Total Dispatched</span>
                <span className="font-bold font-mono">{channelLogsCount} Alerts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Admin Test Dispatcher & Schedule Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Test Alert Simulator */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-50 text-purple-700 rounded-xl">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Trigger Test Reminder Notification</h3>
                <p className="text-[11px] text-slate-400">
                  Simulate live delivery across any of the 5 channels
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
              Live Gateway
            </span>
          </div>

          {testSentFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#0B5D2A] text-xs font-semibold rounded-xl flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
              <span>{testSentFeedback}</span>
            </div>
          )}

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Document to Test</label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-hidden font-medium"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.documentName} ({d.documentTypeName}) - Expires {d.expiryDate}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Notification Channel</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(NOTIFICATION_CHANNEL_META) as NotificationChannel[]).map((ch) => {
                  const meta = NOTIFICATION_CHANNEL_META[ch];
                  const isSelected = selectedChannel === ch;
                  return (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setSelectedChannel(ch)}
                      className={`p-2 rounded-xl border text-left flex items-center space-x-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <span>
                        {ch === 'system' && '🔔'}
                        {ch === 'email' && '📧'}
                        {ch === 'sms' && '📱'}
                        {ch === 'whatsapp' && '💬'}
                        {ch === 'dashboard' && '🖥️'}
                      </span>
                      <span className="text-[11px] truncate">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Recipient Preview */}
            {selectedDoc && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Recipient:</span>
                  <span className="font-bold text-slate-800">
                    {selectedChannel === 'email'
                      ? selectedDoc.responsibleEmail || 'admin@casbiro.com'
                      : selectedChannel === 'whatsapp' || selectedChannel === 'sms'
                      ? selectedDoc.responsiblePhone || '+91 98470 00000'
                      : selectedDoc.responsiblePerson}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-700">{selectedDoc.department} Dept</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="text-slate-400">Days Remaining:</span>
                  <span className="font-bold text-slate-800">
                    {calculateDaysRemaining(selectedDoc.expiryDate)} days
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSendTest}
              className="w-full py-2.5 bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Send Simulated Notification Now</span>
            </button>
          </div>
        </div>

        {/* Reminder Intervals Master Guide */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-emerald-50 text-[#0B5D2A] rounded-xl">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Configured Reminder Escalation Cadence</h3>
                <p className="text-[11px] text-slate-400">
                  Standard schedule applied to recurring enterprise documents
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-[#0B5D2A]">
              Automated
            </span>
          </div>

          <div className="space-y-2">
            {STANDARD_REMINDER_OPTIONS.map((opt) => (
              <div
                key={opt.days}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center font-bold text-emerald-700 font-mono text-[11px]">
                    {opt.days < 0 ? 'Esc' : opt.days}
                  </div>
                  <span className="font-semibold text-slate-800">{opt.label}</span>
                </div>
                <div className="flex items-center space-x-1 text-[11px] text-slate-400">
                  <span>🔔 Email + WhatsApp + System</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Notification Dispatch Logs & History Audit */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Notification Dispatch Logs & Audit Ledger
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {filteredLogs.length} Events Logged
            </span>
          </div>

          {/* Search & Channel Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchLog}
                onChange={(e) => setSearchLog(e.target.value)}
                placeholder="Search log messages..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-hidden"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-hidden"
            >
              <option value="all">All Channels</option>
              <option value="system">🔔 System</option>
              <option value="email">📧 Email</option>
              <option value="sms">📱 SMS</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="dashboard">🖥️ Dashboard</option>
            </select>
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-4 py-3">Document Title & Ref</th>
                  <th className="px-4 py-3">Channel</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Trigger Days</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-6 py-3">Message Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => {
                  const meta = NOTIFICATION_CHANNEL_META[log.channel];
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3 font-mono text-slate-500 whitespace-nowrap text-[11px]">
                        {new Date(log.sentAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="font-bold text-slate-800 truncate">{log.documentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Ref: #{log.referenceNumber} | {log.documentTypeName}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            meta?.color || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span>{meta?.label || log.channel}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-700 font-mono text-[11px] truncate max-w-[160px]">
                        {log.recipient}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {log.triggerDays === 0 ? 'On Expiry' : `${log.triggerDays}d before`}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{log.status}</span>
                        </span>
                      </td>

                      <td className="px-6 py-3 text-slate-600 text-xs italic max-w-md truncate">
                        "{log.messagePreview}"
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No notification logs match your filter criteria.
          </div>
        )}
      </div>
    </div>
  );
};
