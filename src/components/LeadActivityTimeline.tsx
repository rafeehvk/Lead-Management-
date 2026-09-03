import React, { useState, useMemo } from 'react';
import {
  Clock,
  Mail,
  RefreshCw,
  PhoneCall,
  Calendar,
  FileText,
  MessageSquare,
  Sparkles,
  Plus,
  Search,
  Filter,
  Trash2,
  ChevronDown,
  ChevronUp,
  User,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Video,
  MapPin,
  MessageCircle,
} from 'lucide-react';
import { LeadActivity, ActivityType, FollowUpType, User as UserType, Lead } from '../types';
import { storage } from '../services/storageService';
import { formatINR } from '../utils/pdfGenerator';

interface LeadActivityTimelineProps {
  lead: Lead;
  currentUser?: UserType;
  users?: UserType[];
  onActivityAdded?: () => void;
  onFollowUpScheduled?: () => void;
}

export const LeadActivityTimeline: React.FC<LeadActivityTimelineProps> = ({
  lead,
  currentUser,
  users = [],
  onActivityAdded,
  onFollowUpScheduled,
}) => {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [filterType, setFilterType] = useState<'all' | ActivityType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickLogger, setShowQuickLogger] = useState(false);
  const [quickLogTab, setQuickLogTab] = useState<'note' | 'followup' | 'email'>('note');
  const [expandedActivityIds, setExpandedActivityIds] = useState<Record<string, boolean>>({});

  // Quick log states
  const [noteText, setNoteText] = useState('');
  const [fupType, setFupType] = useState<FollowUpType>('Call');
  const [fupDiscussion, setFupDiscussion] = useState('');
  const [fupNextDate, setFupNextDate] = useState('');
  const [fupStatus, setFupStatus] = useState<'Completed' | 'Pending'>('Completed');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailNotes, setEmailNotes] = useState('');
  const [logSuccessMessage, setLogSuccessMessage] = useState('');

  // Load activities for this specific lead
  const refreshActivities = () => {
    if (!lead?.id) return;
    const items = storage.getLeadActivities(lead.id);
    setActivities(items);
  };

  React.useEffect(() => {
    refreshActivities();
    if (lead?.email) {
      setEmailRecipient(lead.email);
    }
    setEmailSubject(`MYSAR Solution Update - ${lead.instituteName}`);
  }, [lead?.id]);

  // Filtered and searched activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Type filter
      if (filterType !== 'all' && act.type !== filterType) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description.toLowerCase().includes(q);
        const matchesActor = act.actor.toLowerCase().includes(q);
        const matchesSubject = act.metadata?.emailSubject?.toLowerCase().includes(q);
        const matchesEmail = act.metadata?.emailTo?.toLowerCase().includes(q);
        const matchesProp = act.metadata?.proposalNumber?.toLowerCase().includes(q);
        if (
          !matchesTitle &&
          !matchesDesc &&
          !matchesActor &&
          !matchesSubject &&
          !matchesEmail &&
          !matchesProp
        ) {
          return false;
        }
      }
      return true;
    });
  }, [activities, filterType, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: activities.length,
      change: activities.filter((a) => a.type === 'change').length,
      email: activities.filter((a) => a.type === 'email').length,
      followup: activities.filter((a) => a.type === 'followup').length,
      proposal: activities.filter((a) => a.type === 'proposal').length,
      note: activities.filter((a) => a.type === 'note').length,
    };
  }, [activities]);

  const toggleExpand = (id: string) => {
    setExpandedActivityIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Quick Post Handlers
  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    const actor = currentUser?.name || lead.assignedTo || 'Admin';
    storage.saveActivity({
      leadId: lead.id,
      type: 'note',
      title: 'Sales Interaction Note Added',
      description: noteText.trim(),
      actor,
      actorRole: currentUser?.role || 'Staff',
    });

    setNoteText('');
    setLogSuccessMessage('Note added to timeline');
    setTimeout(() => setLogSuccessMessage(''), 2500);
    refreshActivities();
    if (onActivityAdded) onActivityAdded();
  };

  const handlePostFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fupDiscussion.trim()) return;

    const actor = currentUser?.name || lead.assignedTo || 'Admin';
    storage.saveFollowUp(
      {
        leadId: lead.id,
        instituteName: lead.instituteName,
        followUpDate: new Date().toISOString().split('T')[0],
        staff: actor,
        followUpType: fupType,
        discussion: fupDiscussion.trim(),
        nextFollowUpDate: fupNextDate || lead.followUpDate,
        status: fupStatus,
        remarks: '',
      },
      actor
    );

    setFupDiscussion('');
    setLogSuccessMessage(`${fupType} interaction recorded!`);
    setTimeout(() => setLogSuccessMessage(''), 2500);
    refreshActivities();
    if (onActivityAdded) onActivityAdded();
    if (onFollowUpScheduled) onFollowUpScheduled();
  };

  const handlePostEmailLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipient.trim() || !emailSubject.trim()) return;

    const actor = currentUser?.name || lead.assignedTo || 'Admin';
    storage.logEmailSent(
      lead.id,
      actor,
      emailRecipient.trim(),
      emailSubject.trim(),
      emailNotes.trim() || `Dispatched email to ${emailRecipient}`
    );

    setEmailNotes('');
    setLogSuccessMessage('Email dispatch logged in timeline!');
    setTimeout(() => setLogSuccessMessage(''), 2500);
    refreshActivities();
    if (onActivityAdded) onActivityAdded();
  };

  const handleDeleteActivity = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this activity entry?')) {
      storage.deleteActivity(id);
      refreshActivities();
      if (onActivityAdded) onActivityAdded();
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      const datePart = d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timePart = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${datePart} • ${timePart}`;
    } catch {
      return ts;
    }
  };

  const renderActivityIcon = (type: ActivityType, metadata?: any) => {
    switch (type) {
      case 'email':
        return (
          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
            <Mail className="w-3.5 h-3.5" />
          </div>
        );
      case 'change':
        return (
          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
            <RefreshCw className="w-3.5 h-3.5" />
          </div>
        );
      case 'followup':
        if (metadata?.followUpType === 'Demo') {
          return (
            <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
              <Video className="w-3.5 h-3.5" />
            </div>
          );
        }
        if (metadata?.followUpType === 'Meeting' || metadata?.followUpType === 'Site Visit') {
          return (
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
              <MapPin className="w-3.5 h-3.5" />
            </div>
          );
        }
        if (metadata?.followUpType === 'WhatsApp') {
          return (
            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
              <MessageCircle className="w-3.5 h-3.5" />
            </div>
          );
        }
        return (
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
            <PhoneCall className="w-3.5 h-3.5" />
          </div>
        );
      case 'proposal':
        return (
          <div className="w-7 h-7 rounded-full bg-[#EAF7EF] text-[#168A45] flex items-center justify-center ring-4 ring-white shadow-2xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
        );
      case 'system':
        return (
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        );
      case 'note':
      default:
        return (
          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center ring-4 ring-white shadow-2xs">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/70 border-l border-gray-200">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#EAF7EF] text-[#168A45] flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              Activity & History
            </h4>
            <span className="px-2 py-0.5 rounded-full bg-[#EAF7EF] text-[#0B5D2A] text-[11px] font-bold">
              {activities.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowQuickLogger(!showQuickLogger)}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#168A45] text-[#168A45] hover:bg-[#EAF7EF] flex items-center gap-1 transition-colors shadow-2xs"
          >
            <Plus className="w-3 h-3" />
            <span>{showQuickLogger ? 'Close' : 'Log Activity'}</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative mt-2">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search activities, emails, changes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 no-scrollbar pb-1">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-[#168A45] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('change')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'change'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-3 h-3" />
            Changes ({counts.change})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('email')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'email'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-3 h-3" />
            Emails ({counts.email})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('followup')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'followup'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            <PhoneCall className="w-3 h-3" />
            Follow-ups ({counts.followup})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('proposal')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'proposal'
                ? 'bg-[#0B5D2A] text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3 h-3" />
            Proposals ({counts.proposal})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('note')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterType === 'note'
                ? 'bg-slate-700 text-white shadow-2xs'
                : 'bg-white text-slate-600 border border-gray-200 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3 h-3" />
            Notes ({counts.note})
          </button>
        </div>
      </div>

      {/* Quick Activity Logger Drawer */}
      {showQuickLogger && (
        <div className="p-3.5 bg-white border-b-2 border-[#168A45] shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setQuickLogTab('note')}
                className={`px-2 py-1 text-[11px] font-bold rounded flex items-center gap-1 ${
                  quickLogTab === 'note'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>Add Note</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickLogTab('followup')}
                className={`px-2 py-1 text-[11px] font-bold rounded flex items-center gap-1 ${
                  quickLogTab === 'followup'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PhoneCall className="w-3 h-3" />
                <span>Log Call / Meeting</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickLogTab('email')}
                className={`px-2 py-1 text-[11px] font-bold rounded flex items-center gap-1 ${
                  quickLogTab === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-3 h-3" />
                <span>Log Email</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickLogger(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          {/* Note Form */}
          {quickLogTab === 'note' && (
            <form onSubmit={handlePostNote} className="space-y-2">
              <textarea
                rows={2}
                required
                placeholder="Type interaction note, client feedback, or special instructions..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500">
                  Logged by: <strong className="text-slate-700">{currentUser?.name || lead.assignedTo}</strong>
                </span>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-2xs"
                >
                  <Send className="w-3 h-3" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>
          )}

          {/* Follow-up / Call Form */}
          {quickLogTab === 'followup' && (
            <form onSubmit={handlePostFollowUp} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Type
                  </label>
                  <select
                    value={fupType}
                    onChange={(e) => setFupType(e.target.value as FollowUpType)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Call">Phone Call</option>
                    <option value="Meeting">In-Person Meeting</option>
                    <option value="Demo">Online Demo</option>
                    <option value="WhatsApp">WhatsApp Chat</option>
                    <option value="Site Visit">Campus Site Visit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Status
                  </label>
                  <select
                    value={fupStatus}
                    onChange={(e) => setFupStatus(e.target.value as any)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending / Scheduled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Discussion Points *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Summary of discussion with principal/management..."
                  value={fupDiscussion}
                  onChange={(e) => setFupDiscussion(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={fupNextDate}
                    onChange={(e) => setFupNextDate(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white"
                  />
                </div>
                <div className="pt-3.5 flex justify-end">
                  <button
                    type="submit"
                    className="w-full px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Save Follow-up</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Email Form */}
          {quickLogTab === 'email' && (
            <form onSubmit={handlePostEmailLog} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="recipient@school.edu"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MYSAR Proposal Update..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded p-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Email Details / Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Key details or email content summary dispatched to client..."
                  value={emailNotes}
                  onChange={(e) => setEmailNotes(e.target.value)}
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md flex items-center gap-1 shadow-2xs"
                >
                  <Mail className="w-3 h-3" />
                  <span>Log Email Sent</span>
                </button>
              </div>
            </form>
          )}

          {logSuccessMessage && (
            <div className="mt-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{logSuccessMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* Chronological Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <h5 className="text-xs font-bold text-slate-700">No activity recorded</h5>
            <p className="text-[11px] text-slate-500 mt-0.5 max-w-xs mx-auto">
              {searchQuery
                ? 'No activities match your search filter.'
                : 'No interactions or updates logged yet for this lead.'}
            </p>
            <button
              type="button"
              onClick={() => setShowQuickLogger(true)}
              className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg shadow-2xs"
            >
              <Plus className="w-3 h-3" />
              <span>Log First Activity</span>
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
            {filteredActivities.map((act, idx) => {
              const isExpanded = !!expandedActivityIds[act.id];

              return (
                <div key={act.id ? `${act.id}-${idx}` : `act-${idx}`} className="relative group">
                  {/* Absolute Timeline Node Icon */}
                  <div className="absolute -left-6 top-0">
                    {renderActivityIcon(act.type, act.metadata)}
                  </div>

                  {/* Card Container */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs hover:border-gray-300 transition-all">
                    {/* Top Row: Title & Timestamp */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h5 className="text-xs font-bold text-slate-800 leading-tight">
                            {act.title}
                          </h5>

                          {/* Specific metadata badges */}
                          {act.type === 'email' && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                              Email Dispatched
                            </span>
                          )}
                          {act.type === 'proposal' && act.metadata?.proposalNumber && (
                            <span className="px-1.5 py-0.5 rounded bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] text-[10px] font-bold">
                              {act.metadata.proposalNumber}
                            </span>
                          )}
                          {act.type === 'followup' && act.metadata?.followUpType && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                              {act.metadata.followUpType}
                            </span>
                          )}
                        </div>

                        {/* Relative / Formatted Timestamp */}
                        <div className="flex items-center gap-1 text-[10px] text-slate-600 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{formatTimestamp(act.timestamp)}</span>
                          <span className="text-slate-400">•</span>
                          <User className="w-3 h-3 text-slate-500" />
                          <span>By <strong className="text-slate-700">{act.actor}</strong></span>
                        </div>
                      </div>

                      {/* Delete button (hover) */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteActivity(act.id, e)}
                        title="Delete this record"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 rounded transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Change Details Badges (Old -> New) */}
                    {act.type === 'change' && act.metadata?.oldValue && act.metadata?.newValue && (
                      <div className="mt-2 p-2 rounded-lg bg-amber-50/70 border border-amber-200 flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-white text-slate-600 font-semibold border border-amber-200 text-[11px] line-through">
                          {act.metadata.oldValue}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-bold text-[11px] shadow-2xs">
                          {act.metadata.newValue}
                        </span>
                      </div>
                    )}

                    {/* Email Recipient & Subject Box */}
                    {act.type === 'email' && (act.metadata?.emailTo || act.metadata?.emailSubject) && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-50/70 border border-blue-200 text-xs space-y-1">
                        {act.metadata.emailTo && (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="text-[10px] font-bold text-blue-700 uppercase">To:</span>
                            <span className="font-mono text-[11px]">{act.metadata.emailTo}</span>
                          </div>
                        )}
                        {act.metadata.emailSubject && (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <span className="text-[10px] font-bold text-blue-700 uppercase">Subject:</span>
                            <span className="text-[11px] truncate">{act.metadata.emailSubject}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Proposal Value Box */}
                    {act.type === 'proposal' && act.metadata?.proposalAmount && (
                      <div className="mt-2 p-2 rounded-lg bg-[#EAF7EF]/70 border border-[#D9E5DD] flex items-center justify-between text-xs">
                        <span className="text-slate-600 text-[11px]">Proposal Total Value:</span>
                        <span className="text-[#0B5D2A] font-extrabold text-xs">
                          {formatINR(act.metadata.proposalAmount)}
                        </span>
                      </div>
                    )}

                    {/* Activity Description */}
                    {act.description && (
                      <div className="mt-2 text-xs text-slate-600 leading-relaxed bg-slate-50/60 p-2 rounded-lg border border-gray-100">
                        <p className={isExpanded ? '' : 'line-clamp-2'}>
                          {act.description}
                        </p>
                        {act.description.length > 110 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(act.id)}
                            className="mt-1 text-[10px] font-bold text-[#168A45] hover:underline flex items-center gap-0.5"
                          >
                            {isExpanded ? (
                              <>
                                <span>Show Less</span>
                                <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <span>Read More</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
