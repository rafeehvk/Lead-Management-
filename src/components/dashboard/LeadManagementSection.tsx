import React, { useState } from 'react';
import {
  Users,
  Filter,
  Phone,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Award,
  Calendar,
  AlertTriangle,
  Clock,
  Briefcase,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Lead, FollowUp, User } from '../../types';

interface LeadManagementSectionProps {
  leads: Lead[];
  followUps: FollowUp[];
  users: User[];
  onNavigateToLead: (leadId: string) => void;
  onNavigateToFollowUpsTab?: (tab: 'today' | 'upcoming' | 'overdue') => void;
  onNavigateToFullLeads: (statusFilter?: string) => void;
}

export const LeadManagementSection: React.FC<LeadManagementSectionProps> = ({
  leads,
  followUps,
  users,
  onNavigateToLead,
  onNavigateToFollowUpsTab,
  onNavigateToFullLeads,
}) => {
  const [followUpTab, setFollowUpTab] = useState<'overdue' | 'today' | 'upcoming'>('today');

  const todayStr = new Date().toISOString().split('T')[0];

  // Pipeline stages for Funnel
  const funnelStages = [
    {
      id: 'New',
      label: 'New Leads',
      statuses: ['New'],
      color: '#0284c7',
      bgClass: 'bg-sky-50 text-sky-800 border-sky-200',
      barClass: 'bg-sky-500',
    },
    {
      id: 'Contacted',
      label: 'Contacted',
      statuses: ['Contacted'],
      color: '#0d9488',
      bgClass: 'bg-teal-50 text-teal-800 border-teal-200',
      barClass: 'bg-teal-500',
    },
    {
      id: 'Follow-up',
      label: 'Follow-up',
      statuses: ['Follow-up'],
      color: '#f59e0b',
      bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
      barClass: 'bg-amber-500',
    },
    {
      id: 'Qualified',
      label: 'Qualified',
      statuses: ['Qualified', 'Demo Scheduled', 'Demo Completed'],
      color: '#6366f1',
      bgClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      barClass: 'bg-indigo-500',
    },
    {
      id: 'Proposal',
      label: 'Proposal / Negotiation',
      statuses: ['Send Proposal', 'Proposal Sent', 'Negotiation'],
      color: '#8b5cf6',
      bgClass: 'bg-purple-50 text-purple-800 border-purple-200',
      barClass: 'bg-purple-500',
    },
    {
      id: 'Won',
      label: 'Won (Converted)',
      statuses: ['Won'],
      color: '#168a45',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      barClass: 'bg-emerald-600',
    },
    {
      id: 'Lost',
      label: 'Lost / Closed',
      statuses: ['Lost', 'On Hold'],
      color: '#64748b',
      bgClass: 'bg-slate-50 text-slate-800 border-slate-200',
      barClass: 'bg-slate-400',
    },
  ];

  const totalLeadsCount = leads.length || 1;

  const funnelCounts = funnelStages.map((stage) => {
    const count = leads.filter((l) => stage.statuses.includes(l.status)).length;
    const percentage = Math.round((count / totalLeadsCount) * 100);
    return { ...stage, count, percentage };
  });

  // Source breakdown
  const sourceCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || 'Direct Outreach';
      map[src] = (map[src] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Salesperson breakdown
  const ownerCounts = React.useMemo(() => {
    const map: Record<string, { total: number; won: number }> = {};
    leads.forEach((l) => {
      const owner = l.assignedTo || 'Unassigned';
      if (!map[owner]) map[owner] = { total: 0, won: 0 };
      map[owner].total += 1;
      if (l.status === 'Won') map[owner].won += 1;
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [leads]);

  // Follow-up categorization
  const overdueFollowUpsList = React.useMemo(() => {
    return followUps.filter((f) => f.scheduledDate < todayStr && f.status === 'Pending');
  }, [followUps, todayStr]);

  const todayFollowUpsList = React.useMemo(() => {
    return followUps.filter((f) => f.scheduledDate === todayStr && f.status === 'Pending');
  }, [followUps, todayStr]);

  const upcomingFollowUpsList = React.useMemo(() => {
    return followUps.filter((f) => f.scheduledDate > todayStr && f.status === 'Pending');
  }, [followUps, todayStr]);

  const activeFollowUpList =
    followUpTab === 'overdue'
      ? overdueFollowUpsList
      : followUpTab === 'today'
      ? todayFollowUpsList
      : upcomingFollowUpsList;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-6 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-100 text-blue-800">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                Module 1: Lead Management & Pipeline Velocity
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {leads.length} Active Leads
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visual pipeline funnel, source attribution, team conversion metrics, and multi-channel follow-up widget.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateToFullLeads()}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#EAF7EF] hover:bg-[#D9E5DD] text-[#0B5D2A] text-xs font-bold transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <span>Open Full Lead Overview</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Visual Lead Funnel */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Visual Lead Conversion Funnel</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Overall Conversion:{' '}
            <strong className="text-emerald-700 font-bold">
              {Math.round(
                (leads.filter((l) => l.status === 'Won').length / (leads.length || 1)) * 100
              )}
              %
            </strong>
          </span>
        </div>

        {/* Funnel Progress Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {funnelCounts.map((stage, idx) => (
            <button
              key={stage.id}
              onClick={() => onNavigateToFullLeads(stage.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all hover:shadow-xs cursor-pointer ${stage.bgClass}`}
            >
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  <span>Stage {idx + 1}</span>
                  <span>{stage.percentage}%</span>
                </div>
                <div className="text-xs font-bold text-slate-900 truncate" title={stage.label}>
                  {stage.label}
                </div>
                <div className="text-xl font-black text-slate-900 my-1">{stage.count}</div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full ${stage.barClass}`}
                  style={{ width: `${Math.max(8, stage.percentage)}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Grid: Analytics & Follow-up Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Lead Analytics (Sources & Sales Persons) - 5 Cols */}
        <div className="lg:col-span-5 space-y-6">
          {/* Source Breakdown */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              Leads by Inbound Source
            </h4>
            <div className="space-y-2.5">
              {sourceCounts.slice(0, 5).map(([source, count]) => {
                const pct = Math.round((count / (leads.length || 1)) * 100);
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-700">{source}</span>
                      <span className="text-slate-500 font-bold">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sales Person Performance */}
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
              Sales Performance by Lead Owner
            </h4>
            <div className="space-y-2">
              {ownerCounts.slice(0, 4).map(([owner, stat]) => {
                const winRate = Math.round((stat.won / (stat.total || 1)) * 100);
                return (
                  <div
                    key={owner}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/70 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                        {owner.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{owner}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[11px]">
                      <span className="text-slate-500 font-semibold">{stat.total} Leads</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {winRate}% Win
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Dedicated Follow-up Widget - 7 Cols */}
        <div className="lg:col-span-7 bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
          <div>
            {/* Widget Header & Subtabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-3 border-b border-slate-200 mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Follow-up Management Widget
                </h4>
              </div>

              {/* Subtabs */}
              <div className="flex items-center space-x-1 p-1 bg-white rounded-lg border border-slate-200">
                <button
                  onClick={() => setFollowUpTab('overdue')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    followUpTab === 'overdue'
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'text-red-700 hover:bg-red-50'
                  }`}
                >
                  Overdue ({overdueFollowUpsList.length})
                </button>
                <button
                  onClick={() => setFollowUpTab('today')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    followUpTab === 'today'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Today ({todayFollowUpsList.length})
                </button>
                <button
                  onClick={() => setFollowUpTab('upcoming')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                    followUpTab === 'upcoming'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Upcoming ({upcomingFollowUpsList.length})
                </button>
              </div>
            </div>

            {/* List Table / Cards */}
            <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
              {activeFollowUpList.length > 0 ? (
                activeFollowUpList.map((f) => {
                  const lead = leads.find((l) => l.id === f.leadId);
                  const isOverdue = f.scheduledDate < todayStr;
                  return (
                    <div
                      key={f.id}
                      className={`p-3 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all shadow-2xs ${
                        isOverdue ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-black text-slate-900">
                            {lead?.instituteName || f.leadId}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                              f.priority === 'High'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {f.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {lead?.city ? `${lead.city} • ` : ''}Assigned to:{' '}
                          <span className="font-semibold text-slate-700">{f.assignedTo}</span>
                        </div>
                        <div className="text-[10px] text-slate-600 font-medium">
                          Date: <span className="font-bold">{f.scheduledDate}</span> ({f.scheduledTime})
                        </div>
                        {f.notes && (
                          <div className="text-[10px] text-slate-600 italic mt-0.5 line-clamp-1">
                            "{f.notes}"
                          </div>
                        )}
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-center">
                        {lead?.contactPhone && (
                          <a
                            href={`tel:${lead.contactPhone}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 transition-colors"
                            title="Quick Phone Call"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead?.contactPhone && (
                          <a
                            href={`https://wa.me/${lead.contactPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                            title="Quick WhatsApp Chat"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => onNavigateToLead(f.leadId)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold border border-slate-200 transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
                  No {followUpTab} follow-up calls or meetings scheduled.
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Showing {activeFollowUpList.length} follow-up records
            </span>
            {onNavigateToFollowUpsTab && (
              <button
                onClick={() => onNavigateToFollowUpsTab(followUpTab)}
                className="font-bold text-[#0B5D2A] hover:text-[#168A45] flex items-center space-x-1 cursor-pointer"
              >
                <span>Manage Follow-ups Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
