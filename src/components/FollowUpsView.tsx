import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  Video,
  Mail,
  MessageSquare,
  Building,
  User as UserIcon,
  Download,
  Calendar,
  X,
  Bell,
  Send,
  Sparkles,
} from 'lucide-react';
import { FollowUp, FollowUpType, Lead, User as UserType } from '../types';
import { notificationService } from '../services/notificationService';
import { hasPermission } from '../utils/rbac';

interface FollowUpsViewProps {
  followUps: FollowUp[];
  leads: Lead[];
  users: UserType[];
  currentUser: UserType;
  onSaveFollowUp: (fup: Partial<FollowUp>) => void;
  onExportCsv: () => void;
  onOpenNotifications?: () => void;
  initialTab?: 'today' | 'upcoming' | 'overdue' | 'all';
}

export const FollowUpsView: React.FC<FollowUpsViewProps> = ({
  followUps,
  leads,
  users,
  currentUser,
  onSaveFollowUp,
  onExportCsv,
  onOpenNotifications,
  initialTab = 'today',
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [tab, setTab] = useState<'today' | 'upcoming' | 'overdue' | 'all'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab]);
  const [scope, setScope] = useState<'my' | 'all'>(
    currentUser.role === 'Salesperson' ? 'my' : 'all'
  );
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sendingFollowUpId, setSendingFollowUpId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser.role === 'Salesperson') {
      setScope('my');
    }
  }, [currentUser]);

  // Form State
  const [formData, setFormData] = useState<Partial<FollowUp>>({
    leadId: leads[0]?.id || '',
    instituteName: leads[0]?.instituteName || '',
    followUpDate: today,
    staff: currentUser.name || users[0]?.name || 'Anand Kumar',
    followUpType: 'Call',
    discussion: '',
    nextFollowUpDate: today,
    status: 'Pending',
    remarks: '',
  });

  const getFilteredFollowUps = () => {
    return followUps.filter((fup) => {
      // 1. Role Scope Filter
      if (scope === 'my' && fup.staff !== currentUser.name) {
        return false;
      }

      // 2. Search filter
      const matchesSearch =
        (fup.instituteName || '').toLowerCase().includes(search.toLowerCase()) ||
        (fup.discussion || '').toLowerCase().includes(search.toLowerCase()) ||
        fup.staff.toLowerCase().includes(search.toLowerCase()) ||
        fup.id.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      const fDate = fup.followUpDate;
      const nDate = fup.nextFollowUpDate;
      const targetDate = nDate || fDate;

      if (tab === 'today') {
        return (fDate === today || nDate === today) && fup.status !== 'Completed';
      }
      if (tab === 'upcoming') {
        return targetDate > today && fup.status !== 'Completed';
      }
      if (tab === 'overdue') {
        return targetDate < today && fup.status !== 'Completed';
      }
      return true; // all
    });
  };

  const filtered = getFilteredFollowUps();

  const handleLeadSelect = (leadId: string) => {
    const selected = leads.find((l) => l.id === leadId);
    setFormData({
      ...formData,
      leadId,
      instituteName: selected?.instituteName || '',
      staff: selected?.assignedTo || currentUser.name,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leadId) return;
    onSaveFollowUp(formData);
    setIsAddModalOpen(false);
    setFormData({
      leadId: leads[0]?.id || '',
      instituteName: leads[0]?.instituteName || '',
      followUpDate: today,
      staff: currentUser.name || users[0]?.name || 'Anand Kumar',
      followUpType: 'Call',
      discussion: '',
      nextFollowUpDate: today,
      status: 'Pending',
      remarks: '',
    });
  };

  const handleMarkCompleted = (fup: FollowUp) => {
    onSaveFollowUp({
      ...fup,
      status: 'Completed',
    });
    setSuccessToast(`Follow-up ${fup.id} for ${fup.instituteName || 'Lead'} marked as completed!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleSendReminderForFollowUp = async (fup: FollowUp) => {
    setSendingFollowUpId(fup.id);
    const lead = leads.find((l) => l.id === fup.leadId);
    const staffUser = users.find((u) => u.name === fup.staff) || {
      id: 'USR-TEMP',
      name: fup.staff,
      email: `${fup.staff.toLowerCase().replace(/\s+/g, '.')}@casbiro.com`,
      mobile: '+91 98450 00000',
      role: 'Salesperson' as const,
      status: 'Active' as const,
    };

    const notif = {
      id: `NOTIF-${fup.id}`,
      followUpId: fup.id,
      leadId: fup.leadId,
      instituteName: fup.instituteName || lead?.instituteName || 'Institutional Client',
      contactPerson: lead?.contactPerson || 'Principal',
      mobile: lead?.mobile || '',
      email: lead?.email || '',
      salespersonName: fup.staff,
      salespersonEmail: staffUser.email,
      followUpDate: fup.nextFollowUpDate || fup.followUpDate,
      followUpType: fup.followUpType,
      discussion: fup.discussion,
      remarks: fup.remarks,
      studentCount: lead?.studentCount || 0,
      urgency:
        (fup.nextFollowUpDate || fup.followUpDate) === today
          ? ('Today' as const)
          : ('Upcoming' as const),
      status: 'Pending' as const,
    };

    try {
      const res = await notificationService.sendEmailReminder(notif);
      setSuccessToast(`Automated Gmail alert sent to ${staffUser.email}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } finally {
      setSendingFollowUpId(null);
    }
  };

  const getTypeIcon = (type: FollowUpType) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-3.5 h-3.5 text-[#168A45]" />;
      case 'Demo':
        return <Video className="w-3.5 h-3.5 text-[#0B5D2A]" />;
      case 'Meeting':
      case 'Site Visit':
        return <Building className="w-3.5 h-3.5 text-[#168A45]" />;
      case 'Email':
        return <Mail className="w-3.5 h-3.5 text-slate-500" />;
      case 'WhatsApp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  const todayCount = followUps.filter(
    (f) =>
      (f.followUpDate === today || f.nextFollowUpDate === today) &&
      f.status !== 'Completed' &&
      (scope === 'all' || f.staff === currentUser.name)
  ).length;

  const overdueCount = followUps.filter(
    (f) =>
      (f.nextFollowUpDate || f.followUpDate) < today &&
      f.status !== 'Completed' &&
      (scope === 'all' || f.staff === currentUser.name)
  ).length;

  const canExport = hasPermission.canExportData(currentUser);

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">
              Client Follow-up Tracker
            </h2>
            <span className="bg-[#EAF7EF] text-[#0B5D2A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#D9E5DD]">
              Gmail Alerts Active
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Schedule calls, track meeting discussions, and send automated email alerts to sales reps
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* My vs All Scope Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setScope('my')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scope === 'my'
                  ? 'bg-white text-[#0B5D2A] font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Agenda ({followUps.filter((f) => f.staff === currentUser.name).length})
            </button>
            <button
              onClick={() => setScope('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                scope === 'all'
                  ? 'bg-white text-[#0B5D2A] font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Team ({followUps.length})
            </button>
          </div>

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-[#168A45]" />
              <span className="hidden sm:inline">Notification Center</span>
            </button>
          )}

          {canExport && (
            <button
              onClick={onExportCsv}
              className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#168A45]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Follow-up</span>
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="bg-[#EAF7EF] border border-[#D9E5DD] rounded-xl p-3 text-xs text-[#0B5D2A] font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-1.5 bg-[#F7FAF8] p-1 rounded-lg border border-gray-200">
          <button
            onClick={() => setTab('today')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
              tab === 'today'
                ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Today's Due</span>
            {todayCount > 0 && (
              <span className="bg-[#168A45] text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {todayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('upcoming')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              tab === 'upcoming'
                ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Upcoming
          </button>

          <button
            onClick={() => setTab('overdue')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 ${
              tab === 'overdue'
                ? 'bg-white text-red-700 shadow-xs border border-gray-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Overdue</span>
            {overdueCount > 0 && (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              tab === 'all'
                ? 'bg-white text-[#0B5D2A] shadow-xs border border-gray-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            All Logs ({followUps.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search discussion notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAF8] border border-gray-200 text-xs rounded-lg pl-9 pr-3 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45]"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-sm text-slate-400 shadow-xs">
            No follow-ups recorded under this filter.
          </div>
        ) : (
          filtered.map((fup) => (
            <div
              key={fup.id}
              className={`bg-white border rounded-xl p-4 shadow-xs hover:border-[#168A45] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                fup.status === 'Completed' ? 'opacity-80 bg-[#F7FAF8] border-gray-200' : 'border-gray-200'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                    {fup.id}
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                    {getTypeIcon(fup.followUpType)}
                    <span>{fup.followUpType}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">
                    — {fup.instituteName || 'Institutional Lead'}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      fup.status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {fup.status}
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  <strong>Discussion:</strong> {fup.discussion || 'No summary entered'}
                </p>

                {fup.remarks && (
                  <p className="text-[11px] text-slate-500 italic">
                    Action: {fup.remarks}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-1">
                  <span>
                    Staff:{' '}
                    <strong className={fup.staff === currentUser.name ? 'text-[#0B5D2A]' : ''}>
                      {fup.staff}
                    </strong>
                  </span>
                  <span>Date Logged: {fup.followUpDate}</span>
                  {fup.nextFollowUpDate && (
                    <span className="text-[#0B5D2A] font-semibold">
                      Next Follow-up: {fup.nextFollowUpDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Send Email Reminder Button */}
                {fup.status !== 'Completed' && (
                  <button
                    onClick={() => handleSendReminderForFollowUp(fup)}
                    disabled={sendingFollowUpId === fup.id}
                    title="Send automated Gmail notification to assigned salesperson"
                    className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 hover:border-[#168A45] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 shadow-2xs"
                  >
                    <Send className="w-3 h-3 text-[#168A45]" />
                    <span>{sendingFollowUpId === fup.id ? 'Sending...' : 'Email Reminder'}</span>
                  </button>
                )}

                {fup.status !== 'Completed' ? (
                  <button
                    onClick={() => handleMarkCompleted(fup)}
                    className="bg-[#EAF7EF] hover:bg-[#168A45] hover:text-white text-[#0B5D2A] border border-[#D9E5DD] px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Done</span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Follow-up Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#168A45]" />
                Log Client Follow-up
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Select Lead / Institute <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.leadId}
                  onChange={(e) => handleLeadSelect(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#168A45]"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.instituteName} ({l.contactPerson}) - {l.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Follow-up Type
                  </label>
                  <select
                    value={formData.followUpType}
                    onChange={(e) =>
                      setFormData({ ...formData, followUpType: e.target.value as FollowUpType })
                    }
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="Meeting">In-Person Meeting</option>
                    <option value="Demo">Online Demo</option>
                    <option value="Site Visit">Site / Campus Visit</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Email">Email</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Staff Executive
                  </label>
                  <select
                    value={formData.staff}
                    onChange={(e) => setFormData({ ...formData, staff: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Discussion Points & Feedback <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Summarize the client discussion, pricing reactions, feature questions, or decisions..."
                  value={formData.discussion}
                  onChange={(e) => setFormData({ ...formData, discussion: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextFollowUpDate}
                    onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Follow-up Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-500 mb-1">
                  Next Action / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Send revised quote, schedule management committee demo"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
