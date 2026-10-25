import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  CalendarCheck,
  CheckCircle2,
  FileClock,
  FileCheck,
  Handshake,
  Trophy,
  XCircle,
  ArrowRight,
  Clock,
  Send,
  AlertTriangle,
  Calendar,
  Phone,
  Video,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { DashboardMetrics, Lead, FollowUp, Proposal, User as UserType } from '../types';
import { LeaveRequest, DailyAttendanceRecord } from '../types/hr';
import { ExpiryDocument, calculateDaysRemaining } from '../types/documentExpiry';
import { hrStorage } from '../services/hrStorageService';
import { documentExpiryStorage } from '../services/documentExpiryStorage';

interface DashboardProps {
  metrics: DashboardMetrics;
  leads: Lead[];
  followUps: FollowUp[];
  proposals: Proposal[];
  currentUser: UserType;
  onNavigateToLeads: (statusFilter?: string) => void;
  onNavigateToFollowUps: (tab?: 'today' | 'upcoming' | 'overdue' | 'all') => void;
  onNavigateToProposals: () => void;
  onCreateProposalFromLead: (lead: Lead) => void;
  onOpenNewLead: () => void;
  onOpenNotifications: () => void;
  // Multi-Device Real-Time Cloud Metrics & Navigation
  pendingApprovalsCount?: number;
  activeLeavesCount?: number;
  documentExpiryAlertsCount?: number;
  expiredDocsCount?: number;
  expiringSoonDocsCount?: number;
  onNavigateToTab?: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  leads,
  followUps,
  proposals,
  currentUser,
  onNavigateToLeads,
  onNavigateToFollowUps,
  onNavigateToProposals,
  onCreateProposalFromLead,
  onOpenNewLead,
  onOpenNotifications,
  pendingApprovalsCount,
  activeLeavesCount,
  documentExpiryAlertsCount,
  expiredDocsCount,
  expiringSoonDocsCount,
  onNavigateToTab,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [followUpTab, setFollowUpTab] = useState<'today' | 'upcoming' | 'overdue'>('today');

  // Real-time Cloud synchronized data states (live multi-device parity)
  const [syncedLeaves, setSyncedLeaves] = useState<LeaveRequest[]>(() => hrStorage.getLeaveRequests());
  const [syncedDocs, setSyncedDocs] = useState<ExpiryDocument[]>(() => documentExpiryStorage.getDocuments());
  const [syncedAttendance, setSyncedAttendance] = useState<DailyAttendanceRecord[]>(() => hrStorage.getAttendanceRecords());

  useEffect(() => {
    const handleSync = () => {
      setSyncedLeaves(hrStorage.getLeaveRequests());
      setSyncedDocs(documentExpiryStorage.getDocuments());
      setSyncedAttendance(hrStorage.getAttendanceRecords());
    };
    window.addEventListener('mysar_hr_updated', handleSync);
    window.addEventListener('mysar_doc_expiry_changed', handleSync);
    window.addEventListener('mysar_cloud_data_synced', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('mysar_hr_updated', handleSync);
      window.removeEventListener('mysar_doc_expiry_changed', handleSync);
      window.removeEventListener('mysar_cloud_data_synced', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // 1. Pending Approvals (Pending leave requests awaiting manager sign-off)
  const finalPendingApprovals = useMemo(() => {
    if (pendingApprovalsCount !== undefined) return pendingApprovalsCount;
    return syncedLeaves.filter((l) => l.status === 'Pending').length;
  }, [pendingApprovalsCount, syncedLeaves]);

  // 2. Active Leave Requests (Staff on authorized leave today)
  const finalActiveLeaves = useMemo(() => {
    if (activeLeavesCount !== undefined) return activeLeavesCount;
    const onLeaveAttendance = syncedAttendance.filter(
      (a) => a.date === today && a.status === 'On Leave'
    ).length;
    const approvedCoveringToday = syncedLeaves.filter(
      (l) => l.status === 'Approved' && l.startDate <= today && l.endDate >= today
    ).length;
    return Math.max(onLeaveAttendance, approvedCoveringToday);
  }, [activeLeavesCount, syncedLeaves, syncedAttendance, today]);

  // 3. Total Document Expiry Alerts (Expired + Expiring within 30 days)
  const { finalExpiredDocs, finalExpiringSoonDocs, finalTotalDocAlerts } = useMemo(() => {
    if (documentExpiryAlertsCount !== undefined) {
      return {
        finalExpiredDocs: expiredDocsCount ?? 0,
        finalExpiringSoonDocs: expiringSoonDocsCount ?? 0,
        finalTotalDocAlerts: documentExpiryAlertsCount,
      };
    }
    let exp = 0;
    let expSoon = 0;
    syncedDocs.forEach((d) => {
      const days = calculateDaysRemaining(d.expiryDate, today);
      if (days <= 0) exp++;
      else if (days <= 30) expSoon++;
    });
    return {
      finalExpiredDocs: exp,
      finalExpiringSoonDocs: expSoon,
      finalTotalDocAlerts: exp + expSoon,
    };
  }, [documentExpiryAlertsCount, expiredDocsCount, expiringSoonDocsCount, syncedDocs, today]);

  // Top Row (5 cards): Pipeline Velocity & Core Intake
  const topRowCards = [
    {
      title: 'Total Leads',
      value: metrics.totalLeads,
      icon: Users,
      actionFilter: 'All',
      color: 'text-slate-800',
      highlight: false,
    },
    {
      title: 'New Leads',
      value: metrics.newLeads,
      icon: UserPlus,
      actionFilter: 'New',
      color: 'text-[#168A45]',
      highlight: true,
    },
    {
      title: 'Follow-ups Today',
      value: metrics.followUpsToday,
      icon: CalendarCheck,
      actionFilter: 'Follow-up',
      color: 'text-[#0B5D2A]',
      highlight: true,
      customClick: () => onNavigateToFollowUps('today'),
    },
    {
      title: 'Qualified Leads',
      value: metrics.qualifiedLeads,
      icon: CheckCircle2,
      actionFilter: 'Qualified',
      color: 'text-[#168A45]',
      highlight: false,
    },
    {
      title: 'Proposals Pending',
      value: metrics.proposalsPending,
      icon: FileClock,
      actionFilter: 'Send Proposal',
      color: 'text-[#0B5D2A]',
      highlight: true,
    },
  ];

  // Bottom Row (4 cards): Deal Progression & Outcomes
  const bottomRowCards = [
    {
      title: 'Proposals Sent',
      value: metrics.proposalsSent,
      icon: FileCheck,
      actionFilter: 'Proposal Sent',
      color: 'text-[#168A45]',
      highlight: false,
    },
    {
      title: 'Negotiation',
      value: metrics.negotiation,
      icon: Handshake,
      actionFilter: 'Negotiation',
      color: 'text-slate-800',
      highlight: false,
    },
    {
      title: 'Won Deals',
      value: metrics.won,
      icon: Trophy,
      actionFilter: 'Won',
      color: 'text-[#0B5D2A]',
      highlight: true,
    },
    {
      title: 'Lost Leads',
      value: metrics.lost,
      icon: XCircle,
      actionFilter: 'Lost',
      color: 'text-slate-400',
      highlight: false,
    },
  ];

  // Filter leads ready for proposal creation
  const readyForProposal = leads.filter((l) => l.status === 'Send Proposal');

  // Follow-up categorization
  const todayFollowUpsList = followUps.filter((f) => {
    const targetDate = f.nextFollowUpDate || f.followUpDate;
    return (f.followUpDate === today || targetDate === today) && f.status !== 'Completed';
  });

  const upcomingFollowUpsList = followUps.filter((f) => {
    const targetDate = f.nextFollowUpDate || f.followUpDate;
    return targetDate > today && f.status !== 'Completed';
  });

  const overdueFollowUpsList = followUps.filter((f) => {
    const targetDate = f.nextFollowUpDate || f.followUpDate;
    return targetDate < today && f.status !== 'Completed';
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Real-time Cloud Operational Pulse & Multi-Device Metrics */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-700/60 relative overflow-hidden">
        {/* Ambient subtle glow background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#168A45]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-700/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <h3 className="text-sm font-bold tracking-wide uppercase text-slate-100 flex items-center gap-2">
                Operations & Compliance Live Cloud Pulse
              </h3>
              <span className="hidden sm:inline-flex items-center text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                Multi-Device Parity Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time synchronized counts across connected laptops and devices for staff approvals, roster status, and legal documentation.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/50 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All Devices Synced
            </span>
          </div>
        </div>

        {/* 3 Real-Time Key Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
          {/* 1. Pending Approvals */}
          <div
            onClick={() => onNavigateToTab && onNavigateToTab('hr-attendance')}
            className={`rounded-xl p-4 transition-all duration-200 cursor-pointer group flex flex-col justify-between border ${
              finalPendingApprovals > 0
                ? 'bg-amber-950/40 border-amber-600/50 hover:bg-amber-950/60 hover:border-amber-400 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  Pending Approvals
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    finalPendingApprovals > 0
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {finalPendingApprovals}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    finalPendingApprovals > 0
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {finalPendingApprovals > 0 ? 'Requires Action' : 'All Cleared'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {finalPendingApprovals > 0
                  ? `${finalPendingApprovals} staff leave request(s) awaiting managerial review`
                  : 'Zero pending leave approvals in queue'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-amber-400 group-hover:text-amber-300">
              <span>Review Requests</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 2. Active Leave Requests */}
          <div
            onClick={() => onNavigateToTab && onNavigateToTab('hr-attendance')}
            className="rounded-xl p-4 bg-slate-800/80 border border-slate-700 hover:bg-slate-800 hover:border-purple-500/60 transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  Active Leave Requests
                </span>
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <CalendarCheck className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {finalActiveLeaves}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  On Leave Today
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {finalActiveLeaves > 0
                  ? `${finalActiveLeaves} staff member(s) scheduled on authorized leave today`
                  : 'Full workforce active & reporting on duty today'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-purple-400 group-hover:text-purple-300">
              <span>View Attendance Roster</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* 3. Total Document Expiry Alerts */}
          <div
            onClick={() => onNavigateToTab && onNavigateToTab('doc-registry')}
            className={`rounded-xl p-4 transition-all duration-200 cursor-pointer group flex flex-col justify-between border ${
              finalTotalDocAlerts > 0
                ? finalExpiredDocs > 0
                  ? 'bg-rose-950/40 border-rose-600/50 hover:bg-rose-950/60 hover:border-rose-400 shadow-sm'
                  : 'bg-amber-950/40 border-amber-600/50 hover:bg-amber-950/60 hover:border-amber-400 shadow-sm'
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800 hover:border-slate-500'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                  Document Expiry Alerts
                </span>
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    finalExpiredDocs > 0
                      ? 'bg-rose-500/20 text-rose-400'
                      : finalExpiringSoonDocs > 0
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {finalTotalDocAlerts}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    finalExpiredDocs > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : finalExpiringSoonDocs > 0
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {finalExpiredDocs > 0
                    ? `${finalExpiredDocs} Expired`
                    : finalExpiringSoonDocs > 0
                    ? `${finalExpiringSoonDocs} Expiring ≤30d`
                    : '100% Compliant'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {finalTotalDocAlerts > 0
                  ? `${finalExpiredDocs} expired doc(s), ${finalExpiringSoonDocs} expiring in 30 days`
                  : 'All institutional agreements & certificates are up to date'}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs font-semibold text-rose-400 group-hover:text-rose-300">
              <span>Manage Document Registry</span>
              <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Arranged in Two Balanced Rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#168A45]" />
            Key CRM Indicators
          </h3>
          <span className="text-xs text-slate-400">
            Click any metric to view filtered leads
          </span>
        </div>

        {/* Row 1: 5 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {topRowCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={`row1-${idx}`}
                onClick={() => (card.customClick ? card.customClick() : onNavigateToLeads(card.actionFilter))}
                className={`bg-white border border-gray-200 rounded-xl p-3.5 text-left shadow-xs hover:shadow-sm hover:border-[#168A45] transition-all group relative overflow-hidden flex flex-col justify-between ${
                  card.highlight ? 'bg-gradient-to-b from-white to-[#F7FAF8]' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] flex items-center justify-center text-[#168A45] group-hover:bg-[#168A45] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold tracking-tight ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                    {card.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Row 2: 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {bottomRowCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <button
                key={`row2-${idx}`}
                onClick={() => onNavigateToLeads(card.actionFilter)}
                className={`bg-white border border-gray-200 rounded-xl p-3.5 text-left shadow-xs hover:shadow-sm hover:border-[#168A45] transition-all group relative overflow-hidden flex flex-col justify-between ${
                  card.highlight ? 'bg-gradient-to-b from-white to-[#F7FAF8]' : ''
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] flex items-center justify-center text-[#168A45] group-hover:bg-[#168A45] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <div className={`text-2xl font-bold tracking-tight ${card.color}`}>
                    {card.value}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                    {card.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Follow-up Overview & Proposals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Proposals Pending Creation (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#168A45] flex items-center justify-center">
                  <FileClock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Proposals Ready to Generate
                  </h4>
                  <p className="text-xs text-slate-500">
                    Leads with status "Send Proposal" ready for instant pricing input
                  </p>
                </div>
              </div>
              <span className="bg-[#EAF7EF] text-[#0B5D2A] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D9E5DD]">
                {readyForProposal.length} Pending
              </span>
            </div>

            <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {readyForProposal.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 bg-[#F7FAF8] rounded-xl border border-dashed border-gray-200">
                  No pending proposal requests right now.
                </div>
              ) : (
                readyForProposal.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3.5 rounded-xl border border-gray-200 bg-[#F7FAF8] hover:bg-white hover:border-[#168A45] transition-all flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                          {lead.id}
                        </span>
                        <h5 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                          {lead.instituteName}
                        </h5>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1.5">
                        <span>👤 {lead.contactPerson}</span>
                        <span>🎓 {lead.studentCount} Students</span>
                        <span>💼 {lead.assignedTo}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onCreateProposalFromLead(lead)}
                      className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-xs transition-colors self-end sm:self-auto"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Create Proposal</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Pick pricing plan & enter student rate.
            </span>
            <button
              onClick={onNavigateToProposals}
              className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] flex items-center space-x-1"
            >
              <span>View All Proposals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Follow-up Agenda (Today, Upcoming, and Overdue) (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with Title and Quick Counts */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#168A45] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Follow-up Agenda & Schedule
                  </h4>
                  <p className="text-xs text-slate-500">
                    Track today's interactions, upcoming meetings, and overdue client tasks
                  </p>
                </div>
              </div>

              {/* Status summary pills */}
              <div className="flex items-center space-x-1.5 shrink-0">
                {overdueFollowUpsList.length > 0 && (
                  <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {overdueFollowUpsList.length} Overdue
                  </span>
                )}
                <span className="text-[11px] font-bold text-[#0B5D2A] bg-[#EAF7EF] border border-[#D9E5DD] px-2 py-0.5 rounded-full">
                  {todayFollowUpsList.length} Due Today
                </span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                  {upcomingFollowUpsList.length} Upcoming
                </span>
              </div>
            </div>

            {/* Sub-tabs: Today / Upcoming / Overdue */}
            <div className="flex items-center gap-2 mt-4 pb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setFollowUpTab('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  followUpTab === 'today'
                    ? 'bg-[#168A45] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Today's Follow-ups</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    followUpTab === 'today' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {todayFollowUpsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFollowUpTab('upcoming')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  followUpTab === 'upcoming'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Upcoming Follow-ups</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    followUpTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {upcomingFollowUpsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFollowUpTab('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  followUpTab === 'overdue'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-gray-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Overdue Follow-ups</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    followUpTab === 'overdue' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {overdueFollowUpsList.length}
                </span>
              </button>
            </div>

            {/* Follow-up Items Content */}
            <div className="mt-3 space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {/* 1. TODAY'S LIST */}
              {followUpTab === 'today' && (
                <>
                  {todayFollowUpsList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 bg-[#F7FAF8] rounded-xl border border-dashed border-gray-200">
                      No pending follow-ups scheduled for today.
                    </div>
                  ) : (
                    todayFollowUpsList.map((fup) => (
                      <div
                        key={fup.id}
                        className="p-3 rounded-xl border border-emerald-100 bg-[#F7FAF8] text-xs space-y-1.5 hover:border-[#168A45] hover:bg-white transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-sm">
                            {fup.instituteName || 'Institutional Lead'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#0B5D2A] border border-[#D9E5DD]">
                            {fup.followUpType}
                          </span>
                        </div>
                        <p className="text-slate-600 line-clamp-2">{fup.discussion}</p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-gray-100/60">
                          <span>Staff: <strong className="text-slate-700">{fup.staff}</strong></span>
                          <span className="text-[#168A45] font-bold bg-[#EAF7EF] px-2 py-0.5 rounded-full">Due Today</span>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}

              {/* 2. UPCOMING LIST */}
              {followUpTab === 'upcoming' && (
                <>
                  {upcomingFollowUpsList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 bg-[#F7FAF8] rounded-xl border border-dashed border-gray-200">
                      No upcoming follow-ups scheduled in the calendar.
                    </div>
                  ) : (
                    upcomingFollowUpsList.map((fup) => {
                      const targetDate = fup.nextFollowUpDate || fup.followUpDate;
                      return (
                        <div
                          key={fup.id}
                          className="p-3 rounded-xl border border-blue-100 bg-blue-50/20 text-xs space-y-1.5 hover:border-blue-400 hover:bg-white transition-all shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm">
                              {fup.instituteName || 'Institutional Lead'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-blue-700 border border-blue-200">
                              {fup.followUpType}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{fup.discussion}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-gray-100/60">
                            <span>Staff: <strong className="text-slate-700">{fup.staff}</strong></span>
                            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                              📅 {targetDate}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* 3. OVERDUE LIST */}
              {followUpTab === 'overdue' && (
                <>
                  {overdueFollowUpsList.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400 bg-[#F7FAF8] rounded-xl border border-dashed border-gray-200">
                      Great job! No overdue follow-ups pending.
                    </div>
                  ) : (
                    overdueFollowUpsList.map((fup) => {
                      const targetDate = fup.nextFollowUpDate || fup.followUpDate;
                      return (
                        <div
                          key={fup.id}
                          className="p-3 rounded-xl border border-rose-200 bg-rose-50/30 text-xs space-y-1.5 hover:border-rose-400 hover:bg-white transition-all shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              {fup.instituteName || 'Institutional Lead'}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-rose-700 border border-rose-200">
                              {fup.followUpType}
                            </span>
                          </div>
                          <p className="text-slate-600 line-clamp-2">{fup.discussion}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-rose-100">
                            <span>Staff: <strong className="text-slate-700">{fup.staff}</strong></span>
                            <span className="text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full">
                              Overdue ({targetDate})
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
            <button
              onClick={() => onNavigateToFollowUps(followUpTab)}
              className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] flex items-center space-x-1"
            >
              <span>Manage Full Follow-up Agenda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenNewLead}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
            >
              + Add Lead
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
