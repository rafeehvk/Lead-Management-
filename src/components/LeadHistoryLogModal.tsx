import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  Clock,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  Filter,
  Search,
  Printer,
  Plus,
  FileText,
  Sparkles,
  TrendingUp,
  MessageSquare,
  PhoneCall,
  Mail,
  Video,
  AlertCircle,
  Building2,
  ChevronRight,
  Copy,
  Check,
  CalendarDays,
  Send,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Lead, LeadStatus, LeadActivity, User as UserType } from '../types';
import { storage } from '../services/storageService';
import { StatusBadge } from './StatusBadge';

interface LeadHistoryLogModalProps {
  lead: Lead | null;
  isOpen?: boolean;
  onClose: () => void;
  currentUser: UserType;
  users?: UserType[];
  onUpdateStatus?: (leadId: string, status: LeadStatus) => void;
}

export interface StatusTransitionItem {
  id: string;
  date: string;
  time: string;
  fullTimestamp: string;
  fromStatus?: LeadStatus;
  toStatus: LeadStatus;
  actor: string;
  actorRole?: string;
  remarks: string;
  daysInPreviousStatus?: number;
  isInitial?: boolean;
  isCurrent?: boolean;
}

const ALL_STATUS_STEPS: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Demo Scheduled',
  'Proposal Sent',
  'Negotiation',
  'Won',
];

export const LeadHistoryLogModal: React.FC<LeadHistoryLogModalProps> = ({
  lead,
  isOpen = true,
  onClose,
  currentUser,
  users = [],
  onUpdateStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'status-history' | 'all-activities' | 'add-log'>('status-history');
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [currentLeadState, setCurrentLeadState] = useState<Lead | null>(lead);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedId, setCopiedId] = useState(false);

  // New Status Update form states
  const [newStatus, setNewStatus] = useState<LeadStatus>('Contacted');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [effectiveTime, setEffectiveTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [statusNotes, setStatusNotes] = useState<string>('');
  const [assignedActor, setAssignedActor] = useState<string>(currentUser?.name || 'Admin');
  const [logSuccessMsg, setLogSuccessMsg] = useState<string>('');
  const [showStatusForm, setShowStatusForm] = useState<boolean>(false);

  // Quick note states
  const [quickNoteText, setQuickNoteText] = useState('');

  // Sync state when lead prop changes
  useEffect(() => {
    if (lead) {
      setCurrentLeadState(lead);
      setNewStatus(lead.status);
      refreshActivities(lead.id);
    }
  }, [lead]);

  // Load activities
  const refreshActivities = (leadId: string) => {
    const list = storage.getLeadActivities(leadId);
    setActivities(list);
    // Also refresh lead from storage
    const allLeads = storage.getLeads();
    const fresh = allLeads.find((l) => l.id === leadId);
    if (fresh) {
      setCurrentLeadState(fresh);
    }
  };

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (isOpen === false || !currentLeadState) return null;

  const leadToDisplay = currentLeadState;

  // Derive date-wise status history
  const statusHistory = useMemo(() => {
    if (!leadToDisplay) return [];

    // Filter activities that represent a status shift or creation
    const statusActivities = activities.filter(
      (a) =>
        (a.type === 'change' && a.metadata?.field === 'status') ||
        (a.type === 'system' && (a.metadata?.field === 'status' || a.title.toLowerCase().includes('lead created')))
    );

    // Sort chronologically ascending to calculate durations
    const sortedAsc = [...statusActivities].sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    const items: StatusTransitionItem[] = [];

    // If no creation record exists in activity log, add the initial baseline creation event
    const hasInitial = sortedAsc.some(
      (a) => a.metadata?.field === 'status' && !a.metadata?.oldValue
    );

    const initialDate = leadToDisplay.createdDate || leadToDisplay.leadDate || '2026-04-01';
    const initialStatus: LeadStatus = sortedAsc.length > 0 && sortedAsc[0].metadata?.oldValue
      ? (sortedAsc[0].metadata.oldValue as LeadStatus)
      : (sortedAsc[0]?.metadata?.newValue as LeadStatus) || 'New';

    if (!hasInitial && sortedAsc.length === 0) {
      items.push({
        id: `init-${leadToDisplay.id}`,
        date: initialDate,
        time: '09:30',
        fullTimestamp: `${initialDate} 09:30:00`,
        toStatus: leadToDisplay.status,
        actor: leadToDisplay.createdBy || leadToDisplay.assignedTo || 'System',
        actorRole: 'Sales Team',
        remarks: `Lead established via ${leadToDisplay.leadSource || 'Direct inquiry'} with initial status "${leadToDisplay.status}".`,
        isInitial: true,
        isCurrent: true,
      });
      return items;
    }

    if (!hasInitial) {
      items.push({
        id: `init-${leadToDisplay.id}`,
        date: initialDate,
        time: '09:30',
        fullTimestamp: `${initialDate} 09:30:00`,
        toStatus: initialStatus,
        actor: leadToDisplay.createdBy || leadToDisplay.assignedTo || 'System',
        actorRole: 'Sales Team',
        remarks: `Lead created via ${leadToDisplay.leadSource || 'Direct Visit'}. Initial status logged as "${initialStatus}".`,
        isInitial: true,
      });
    }

    // Process sorted activities
    sortedAsc.forEach((act) => {
      const parts = act.timestamp.split(' ');
      const datePart = parts[0] || initialDate;
      const timePart = parts[1] ? parts[1].slice(0, 5) : '10:00';
      const toSt = (act.metadata?.newValue as LeadStatus) || leadToDisplay.status;
      const fromSt = act.metadata?.oldValue ? (act.metadata.oldValue as LeadStatus) : undefined;

      items.push({
        id: act.id,
        date: datePart,
        time: timePart,
        fullTimestamp: act.timestamp,
        fromStatus: fromSt,
        toStatus: toSt,
        actor: act.actor || leadToDisplay.assignedTo,
        actorRole: act.actorRole || 'Sales Rep',
        remarks: act.description,
        isInitial: !fromSt,
      });
    });

    // Calculate days spent in previous status between consecutive steps
    for (let i = 0; i < items.length; i++) {
      if (i > 0) {
        const prevDate = new Date(items[i - 1].fullTimestamp).getTime();
        const currDate = new Date(items[i].fullTimestamp).getTime();
        const diffDays = Math.max(0, Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24)));
        items[i].daysInPreviousStatus = diffDays;
      }
    }

    // Mark current status on the most recent item
    if (items.length > 0) {
      items[items.length - 1].isCurrent = true;
    }

    // Sort according to user preference
    return sortOrder === 'desc' ? items.reverse() : items;
  }, [activities, leadToDisplay, sortOrder]);

  // Days spent in current status
  const daysInCurrentStatus = useMemo(() => {
    if (statusHistory.length === 0) return 0;
    const latestItem = sortOrder === 'desc' ? statusHistory[0] : statusHistory[statusHistory.length - 1];
    if (!latestItem) return 0;
    const latestTime = new Date(latestItem.fullTimestamp).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - latestTime) / (1000 * 60 * 60 * 24)));
  }, [statusHistory, sortOrder]);

  // Date groups for date-wise presentation
  const groupedByDate = useMemo(() => {
    const groups: { [date: string]: StatusTransitionItem[] } = {};
    statusHistory.forEach((item) => {
      if (!groups[item.date]) {
        groups[item.date] = [];
      }
      groups[item.date].push(item);
    });
    return groups;
  }, [statusHistory]);

  // Milestone check map
  const reachedMilestones = useMemo(() => {
    const map: { [status: string]: string } = {}; // status -> date reached
    statusHistory.forEach((item) => {
      if (item.toStatus && !map[item.toStatus]) {
        map[item.toStatus] = item.date;
      }
    });
    // Ensure current status is marked
    if (leadToDisplay?.status && !map[leadToDisplay.status]) {
      map[leadToDisplay.status] = leadToDisplay.updatedDate || leadToDisplay.leadDate;
    }
    return map;
  }, [statusHistory, leadToDisplay]);

  // Handle submitting a new date-wise status log
  const handleSaveStatusProgression = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadToDisplay) return;

    const actor = assignedActor || currentUser?.name || 'Admin';
    const notesText = statusNotes.trim();

    // Persist status change in storage
    const updated = storage.updateLeadStatus(
      leadToDisplay.id,
      newStatus,
      actor,
      notesText,
      effectiveDate
    );

    // Call parent callback if provided
    if (onUpdateStatus) {
      onUpdateStatus(leadToDisplay.id, newStatus);
    }

    // Refresh modal activities
    refreshActivities(leadToDisplay.id);
    setStatusNotes('');
    setShowStatusForm(false);
    setLogSuccessMsg(`Status updated to "${newStatus}" recorded on ${effectiveDate}!`);
    setTimeout(() => setLogSuccessMsg(''), 3500);
  };

  // Handle adding quick interaction note
  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim() || !leadToDisplay) return;

    const actor = currentUser?.name || leadToDisplay.assignedTo || 'Admin';
    storage.saveActivity({
      leadId: leadToDisplay.id,
      type: 'note',
      title: 'Lead Interaction Logged',
      description: quickNoteText.trim(),
      actor,
      actorRole: currentUser?.role || 'Staff',
      timestamp: `${new Date().toISOString().split('T')[0]} ${new Date().toTimeString().slice(0, 8)}`,
    });

    setQuickNoteText('');
    refreshActivities(leadToDisplay.id);
    setLogSuccessMsg('Interaction note recorded into lead ledger.');
    setTimeout(() => setLogSuccessMsg(''), 3000);
  };

  // Filtered complete activities for Tab 2
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (activityFilter !== 'all' && act.type !== activityFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title?.toLowerCase().includes(q);
        const matchesDesc = act.description?.toLowerCase().includes(q);
        const matchesActor = act.actor?.toLowerCase().includes(q);
        return matchesTitle || matchesDesc || matchesActor;
      }
      return true;
    });
  }, [activities, activityFilter, searchQuery]);

  // Handle Copy ID
  const handleCopyId = () => {
    if (leadToDisplay?.id) {
      navigator.clipboard.writeText(leadToDisplay.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Handle Print
  const handlePrintLog = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] text-white p-4 sm:p-5 shrink-0 flex items-start justify-between">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs text-white shrink-0 mt-0.5 border border-white/20">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 bg-white/15 px-2 py-0.5 rounded-md">
                  Lead Audit & History Ledger
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="font-mono text-xs text-white/80 hover:text-white flex items-center gap-1 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded transition-colors"
                  title="Copy Lead ID"
                >
                  <span>{leadToDisplay.id}</span>
                  {copiedId ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 leading-tight">
                {leadToDisplay.instituteName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-100 mt-1">
                <span>Contact: <strong className="text-white">{leadToDisplay.contactPerson}</strong></span>
                <span>•</span>
                <span>Mobile: <strong className="text-white">{leadToDisplay.mobile}</strong></span>
                <span>•</span>
                <span>Assigned: <strong className="text-white">{leadToDisplay.assignedTo}</strong></span>
                <span>•</span>
                <span>Batch: <strong className="text-white">{leadToDisplay.studentCount} Students</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handlePrintLog}
              title="Print Status & History Sheet"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Modal"
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Milestone Stepper Bar */}
        <div className="bg-[#F7FAF8] border-b border-emerald-100/80 px-4 sm:px-6 py-3 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between min-w-[620px] text-xs">
            {ALL_STATUS_STEPS.map((step, idx) => {
              const isReached = !!reachedMilestones[step];
              const isCurrent = leadToDisplay.status === step;
              const dateReached = reachedMilestones[step];

              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center text-center group">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all shadow-2xs ${
                        isCurrent
                          ? 'bg-[#168A45] text-white ring-4 ring-emerald-200'
                          : isReached
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500 border border-slate-300'
                      }`}
                    >
                      {isReached ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                    </div>
                    <span
                      className={`mt-1 font-semibold text-[11px] whitespace-nowrap ${
                        isCurrent
                          ? 'text-[#0B5D2A] font-extrabold'
                          : isReached
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step}
                    </span>
                    {dateReached ? (
                      <span className="text-[10px] text-emerald-700 font-mono mt-0.5">
                        {dateReached}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        Pending
                      </span>
                    )}
                  </div>

                  {idx < ALL_STATUS_STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${
                        reachedMilestones[ALL_STATUS_STEPS[idx + 1]]
                          ? 'bg-emerald-500'
                          : isReached
                          ? 'bg-emerald-300'
                          : 'bg-slate-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Highlight KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 sm:px-6 bg-slate-50 border-b border-slate-200 text-xs shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Current Status</span>
            <div className="mt-1 flex items-center space-x-1.5">
              <StatusBadge status={leadToDisplay.status} />
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Active for <strong className="text-slate-700">{daysInCurrentStatus} days</strong>
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Status Transitions</span>
            <div className="mt-1 text-base font-extrabold text-[#0B5D2A]">
              {statusHistory.length} Milestones
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Since {leadToDisplay.createdDate || leadToDisplay.leadDate}
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Activity Logs</span>
            <div className="mt-1 text-base font-extrabold text-indigo-900">
              {activities.length} Recorded
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Calls, visits, notes & proposals
            </span>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 block">Quick Action</span>
            <button
              type="button"
              onClick={() => {
                setShowStatusForm(true);
                setActiveTab('status-history');
              }}
              className="mt-1 inline-flex items-center justify-center space-x-1 px-2.5 py-1 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-lg shadow-2xs cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Update Status</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('status-history')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'status-history'
                  ? 'border-[#168A45] text-[#0B5D2A]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              <span>Date-wise Status History</span>
              <span className="ml-1 bg-emerald-100 text-[#0B5D2A] text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {statusHistory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('all-activities')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'all-activities'
                  ? 'border-[#168A45] text-[#0B5D2A]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Complete Interaction Ledger</span>
              <span className="ml-1 bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {activities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add-log')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center space-x-1.5 ${
                activeTab === 'add-log'
                  ? 'border-[#168A45] text-[#0B5D2A]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Log Note / Interaction</span>
            </button>
          </div>

          {activeTab === 'status-history' && (
            <div className="flex items-center space-x-2 pb-2">
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md font-medium transition-colors"
                title="Toggle Date Ordering"
              >
                Sort: {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              </button>
            </div>
          )}
        </div>

        {/* Success Alert */}
        {logSuccessMsg && (
          <div className="mx-4 sm:mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
            <span className="font-semibold">{logSuccessMsg}</span>
          </div>
        )}

        {/* TAB CONTENT (Scrollable Area) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: DATE-WISE STATUS HISTORY */}
          {activeTab === 'status-history' && (
            <div className="space-y-4">
              {/* Quick Collapsible New Status Form */}
              {showStatusForm && (
                <div className="bg-[#EAF7EF]/70 border border-emerald-200 rounded-xl p-4 shadow-xs animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/80 mb-3">
                    <div className="flex items-center space-x-1.5 font-bold text-sm text-[#0B5D2A]">
                      <Plus className="w-4 h-4" />
                      <span>Record New Date-wise Lead Status Progression</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowStatusForm(false)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveStatusProgression} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          New Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Qualified">Qualified</option>
                          <option value="Demo Scheduled">Demo Scheduled</option>
                          <option value="Demo Completed">Demo Completed</option>
                          <option value="Send Proposal">Send Proposal</option>
                          <option value="Proposal Sent">Proposal Sent</option>
                          <option value="Negotiation">Negotiation</option>
                          <option value="Won">Won (Deal Closed)</option>
                          <option value="Lost">Lost</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Effective Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={effectiveDate}
                          onChange={(e) => setEffectiveDate(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                          required
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Recorded By
                        </label>
                        <input
                          type="text"
                          value={assignedActor}
                          onChange={(e) => setAssignedActor(e.target.value)}
                          placeholder="Representative name"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Reason & Discussion Notes for Status Change
                      </label>
                      <textarea
                        rows={2}
                        value={statusNotes}
                        onChange={(e) => setStatusNotes(e.target.value)}
                        placeholder="e.g. Discussed with Principal Dr. Ramesh, scheduled virtual demo for management committee on upcoming Friday..."
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowStatusForm(false)}
                        className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg shadow-sm"
                      >
                        Save Status Progression
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Status History Cards Grouped by Date */}
              {statusHistory.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-700 text-sm">No Status History Recorded</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click "Update Status" above to record the initial or next status transition for this lead.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-emerald-200 space-y-4">
                  {(Object.entries(groupedByDate) as [string, StatusTransitionItem[]][]).map(([dateStr, itemsOnDate]) => (
                    <div key={dateStr} className="space-y-3">
                      {/* Date Heading Tag */}
                      <div className="relative -left-6 sm:-left-8 flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-[#168A45] text-white flex items-center justify-center shadow-xs">
                          <Calendar className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-xs text-slate-900 bg-white border border-emerald-200 px-2.5 py-0.5 rounded-full shadow-2xs font-mono">
                          {dateStr}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          ({itemsOnDate.length} status event{itemsOnDate.length > 1 ? 's' : ''})
                        </span>
                      </div>

                      {/* Items on this date */}
                      <div className="space-y-2.5">
                        {itemsOnDate.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              item.isCurrent
                                ? 'bg-[#F7FAF8] border-[#168A45]/40 shadow-xs ring-1 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            }`}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                {item.fromStatus ? (
                                  <div className="flex items-center space-x-1.5">
                                    <StatusBadge status={item.fromStatus} />
                                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    <StatusBadge status={item.toStatus} />
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Initial Status:
                                    </span>
                                    <StatusBadge status={item.toStatus} />
                                  </div>
                                )}

                                {item.isCurrent && (
                                  <span className="bg-[#168A45] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                    ACTIVE STATUS
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-500">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{item.time}</span>
                                {item.daysInPreviousStatus !== undefined && (
                                  <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    Spent {item.daysInPreviousStatus}d in previous status
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Remarks & Actor */}
                            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                              {item.remarks}
                            </p>

                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                              <div className="flex items-center space-x-1.5">
                                <User className="w-3.5 h-3.5 text-[#168A45]" />
                                <span>
                                  Logged by: <strong className="text-slate-800">{item.actor}</strong>
                                </span>
                                {item.actorRole && (
                                  <span className="text-[10px] text-slate-400">({item.actorRole})</span>
                                )}
                              </div>

                              <span className="font-mono text-[10px] text-slate-400">
                                Ref: {item.id}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: COMPLETE AUDIT & ACTIVITY LEDGER */}
          {activeTab === 'all-activities' && (
            <div className="space-y-3">
              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search logs by keyword, rep, title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#168A45]"
                  />
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto text-[11px]">
                  {['all', 'change', 'followup', 'proposal', 'email', 'note', 'system'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActivityFilter(cat)}
                      className={`px-2.5 py-1 rounded-md font-semibold transition-colors capitalize ${
                        activityFilter === cat
                          ? 'bg-[#168A45] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? 'All Logs' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activities list */}
              {filteredActivities.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                  No activities match your current search/filter.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  {filteredActivities.map((act) => {
                    let IconComp = FileText;
                    let iconBg = 'bg-slate-100 text-slate-600';

                    if (act.type === 'change') {
                      IconComp = TrendingUp;
                      iconBg = 'bg-emerald-100 text-emerald-800';
                    } else if (act.type === 'followup') {
                      IconComp = PhoneCall;
                      iconBg = 'bg-amber-100 text-amber-800';
                    } else if (act.type === 'proposal') {
                      IconComp = Send;
                      iconBg = 'bg-indigo-100 text-indigo-800';
                    } else if (act.type === 'email') {
                      IconComp = Mail;
                      iconBg = 'bg-teal-100 text-teal-800';
                    } else if (act.type === 'note') {
                      IconComp = MessageSquare;
                      iconBg = 'bg-purple-100 text-purple-800';
                    }

                    return (
                      <div key={act.id} className="p-3.5 hover:bg-slate-50/70 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-2.5">
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${iconBg}`}>
                              <IconComp className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-bold text-xs text-slate-900">{act.title}</h4>
                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                                  {act.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {act.description}
                              </p>

                              {act.metadata?.newValue && (
                                <div className="mt-1.5 flex items-center space-x-1.5 text-xs font-semibold">
                                  <span className="text-slate-500">Status shift:</span>
                                  {act.metadata.oldValue && (
                                    <>
                                      <StatusBadge status={act.metadata.oldValue as LeadStatus} />
                                      <ArrowRight className="w-3 h-3 text-slate-400" />
                                    </>
                                  )}
                                  <StatusBadge status={act.metadata.newValue as LeadStatus} />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono text-[11px] text-slate-500 block">
                              {act.timestamp}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              by {act.actor}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LOG NOTE / INTERACTION */}
          {activeTab === 'add-log' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                  <MessageSquare className="w-4 h-4 text-[#168A45]" />
                  <span>Add General Sales Note or Interaction Log</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  This note will be permanently recorded in the lead's chronological audit trail.
                </p>
              </div>

              <form onSubmit={handleAddQuickNote} className="space-y-3">
                <textarea
                  rows={4}
                  value={quickNoteText}
                  onChange={(e) => setQuickNoteText(e.target.value)}
                  placeholder="Record summary of call, in-person visit, questions raised by the client, or next action items..."
                  className="w-full p-3 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-[#168A45] focus:outline-hidden"
                  required
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Author: <strong className="text-slate-700">{currentUser?.name}</strong> ({currentUser?.role})
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Note to History</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="text-slate-500 font-mono text-[11px]">
            Lead ID: <span className="font-bold text-slate-900">{leadToDisplay.id}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
