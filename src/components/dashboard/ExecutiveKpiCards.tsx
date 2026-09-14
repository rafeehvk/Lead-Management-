import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  CalendarCheck,
  CheckCircle2,
  Trophy,
  XCircle,
  TrendingUp,
  UserCheck,
  Clock,
  AlertOctagon,
  FileText,
  ShieldCheck,
  AlertTriangle,
  FileClock,
  ArrowUpRight,
  UserX,
  History,
} from 'lucide-react';

interface ExecutiveKpiData {
  // Lead KPIs
  totalLeads: number;
  newLeads: number;
  followUpsRequired: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  leadConversionRate: number; // percentage
  pipelineValueFormatted: string;

  // HR KPIs
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
  pendingLeaves: number;
  attendanceRate: number; // percentage

  // Document KPIs
  totalDocuments: number;
  validDocuments: number;
  expiring7d: number;
  expiring30d: number;
  expiring90d: number;
  expiredDocuments: number;
  complianceRate: number; // percentage
}

interface ExecutiveKpiCardsProps {
  kpiData: ExecutiveKpiData;
  onCardClick: (module: 'leads' | 'hr' | 'documents', filterKey?: string) => void;
}

export const ExecutiveKpiCards: React.FC<ExecutiveKpiCardsProps> = ({
  kpiData,
  onCardClick,
}) => {
  const [activeKpiCategory, setActiveKpiCategory] = useState<'all' | 'leads' | 'hr' | 'documents'>('all');

  const leadCards = [
    {
      id: 'lead-total',
      title: 'Total Leads',
      value: kpiData.totalLeads,
      subtitle: `${kpiData.pipelineValueFormatted} pipeline volume`,
      icon: Users,
      badge: '+14% MoM',
      color: 'blue',
      module: 'leads' as const,
      filter: 'all',
    },
    {
      id: 'lead-new',
      title: 'New Inbound Leads',
      value: kpiData.newLeads,
      subtitle: 'Awaiting initial outreach',
      icon: UserPlus,
      badge: 'Uncontacted',
      color: 'sky',
      module: 'leads' as const,
      filter: 'New',
    },
    {
      id: 'lead-followup',
      title: 'Follow-ups Required',
      value: kpiData.followUpsRequired,
      subtitle: 'Active sales engagements',
      icon: CalendarCheck,
      badge: 'Action Needed',
      color: 'amber',
      module: 'leads' as const,
      filter: 'Follow-up',
    },
    {
      id: 'lead-qualified',
      title: 'Qualified Pipeline',
      value: kpiData.qualifiedLeads,
      subtitle: 'High probability leads',
      icon: CheckCircle2,
      badge: 'Verified',
      color: 'indigo',
      module: 'leads' as const,
      filter: 'Qualified',
    },
    {
      id: 'lead-won',
      title: 'Converted (Won)',
      value: kpiData.convertedLeads,
      subtitle: `${kpiData.leadConversionRate}% Win Rate`,
      icon: Trophy,
      badge: 'Revenue',
      color: 'emerald',
      module: 'leads' as const,
      filter: 'Won',
    },
    {
      id: 'lead-lost',
      title: 'Lost Leads',
      value: kpiData.lostLeads,
      subtitle: 'Archived / disqualified',
      icon: XCircle,
      badge: 'Disqualified',
      color: 'slate',
      module: 'leads' as const,
      filter: 'Lost',
    },
  ];

  const hrCards = [
    {
      id: 'hr-total',
      title: 'Total Employees',
      value: kpiData.totalEmployees,
      subtitle: 'Active staff headcount',
      icon: Users,
      badge: 'Staff Force',
      color: 'blue',
      module: 'hr' as const,
      filter: 'all',
    },
    {
      id: 'hr-present',
      title: 'Present Today',
      value: kpiData.presentToday,
      subtitle: `${kpiData.attendanceRate}% Attendance Rate`,
      icon: UserCheck,
      badge: 'Checked In',
      color: 'emerald',
      module: 'hr' as const,
      filter: 'present',
    },
    {
      id: 'hr-absent',
      title: 'Absent Today',
      value: kpiData.absentToday,
      subtitle: 'Unreported absences',
      icon: UserX,
      badge: kpiData.absentToday > 0 ? 'Alert' : 'Clean',
      color: 'red',
      module: 'hr' as const,
      filter: 'absent',
    },
    {
      id: 'hr-late',
      title: 'Late Today',
      value: kpiData.lateToday,
      subtitle: 'After reporting cut-off',
      icon: Clock,
      badge: 'Punctuality',
      color: 'amber',
      module: 'hr' as const,
      filter: 'late',
    },
    {
      id: 'hr-leave',
      title: 'On Leave Today',
      value: kpiData.onLeaveToday,
      subtitle: 'Approved leaves in effect',
      icon: CalendarCheck,
      badge: 'Planned',
      color: 'purple',
      module: 'hr' as const,
      filter: 'leave',
    },
    {
      id: 'hr-pending',
      title: 'Pending Leave Approvals',
      value: kpiData.pendingLeaves,
      subtitle: 'Awaiting manager sign-off',
      icon: AlertTriangle,
      badge: kpiData.pendingLeaves > 0 ? `${kpiData.pendingLeaves} Pending` : 'All Approved',
      color: kpiData.pendingLeaves > 0 ? 'amber' : 'emerald',
      module: 'hr' as const,
      filter: 'pending_leaves',
    },
  ];

  const docCards = [
    {
      id: 'doc-total',
      title: 'Total Documents',
      value: kpiData.totalDocuments,
      subtitle: `${kpiData.complianceRate}% Active Compliance`,
      icon: FileText,
      badge: 'Registry',
      color: 'blue',
      module: 'documents' as const,
      filter: 'all',
    },
    {
      id: 'doc-valid',
      title: 'Valid & Active Docs',
      value: kpiData.validDocuments,
      subtitle: 'Fully compliant terms',
      icon: ShieldCheck,
      badge: 'Compliant',
      color: 'emerald',
      module: 'documents' as const,
      filter: 'valid',
    },
    {
      id: 'doc-exp7',
      title: 'Expiring ≤ 7 Days',
      value: kpiData.expiring7d,
      subtitle: 'Immediate renewal window',
      icon: AlertTriangle,
      badge: 'High Priority',
      color: 'amber',
      module: 'documents' as const,
      filter: '7d',
    },
    {
      id: 'doc-exp30',
      title: 'Expiring ≤ 30 Days',
      value: kpiData.expiring30d,
      subtitle: 'Medium term renewal alert',
      icon: FileClock,
      badge: '30 Days Due',
      color: 'yellow',
      module: 'documents' as const,
      filter: '30d',
    },
    {
      id: 'doc-exp90',
      title: 'Expiring ≤ 90 Days',
      value: kpiData.expiring90d,
      subtitle: 'Quarterly upcoming review',
      icon: History,
      badge: 'Scheduled',
      color: 'indigo',
      module: 'documents' as const,
      filter: '90d',
    },
    {
      id: 'doc-expired',
      title: 'Expired Documents',
      value: kpiData.expiredDocuments,
      subtitle: 'Lapsed legal compliance',
      icon: AlertOctagon,
      badge: kpiData.expiredDocuments > 0 ? 'Critical' : 'Zero',
      color: 'red',
      module: 'documents' as const,
      filter: 'expired',
    },
  ];

  const colorStyles: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    blue: { bg: 'bg-blue-50/50', text: 'text-blue-900', iconBg: 'bg-blue-100 text-blue-700', border: 'border-blue-100' },
    sky: { bg: 'bg-sky-50/50', text: 'text-sky-900', iconBg: 'bg-sky-100 text-sky-700', border: 'border-sky-100' },
    emerald: { bg: 'bg-emerald-50/50', text: 'text-emerald-950', iconBg: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-100' },
    amber: { bg: 'bg-amber-50/50', text: 'text-amber-950', iconBg: 'bg-amber-100 text-amber-800', border: 'border-amber-200' },
    yellow: { bg: 'bg-yellow-50/50', text: 'text-yellow-950', iconBg: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200' },
    red: { bg: 'bg-red-50/50', text: 'text-red-950', iconBg: 'bg-red-100 text-red-700', border: 'border-red-200' },
    indigo: { bg: 'bg-indigo-50/50', text: 'text-indigo-950', iconBg: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-100' },
    purple: { bg: 'bg-purple-50/50', text: 'text-purple-950', iconBg: 'bg-purple-100 text-purple-700', border: 'border-purple-100' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-800', iconBg: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
  };

  const renderCardList = (
    cards: Array<{
      id: string;
      title: string;
      value: any;
      subtitle: string;
      icon: any;
      badge: string;
      color: string;
      module: 'leads' | 'hr' | 'documents';
      filter: string;
    }>,
    sectionTitle: string,
    sectionColor: string
  ) => (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className={`text-xs font-extrabold uppercase tracking-wider ${sectionColor}`}>
          {sectionTitle}
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">Click card to drill down</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const style = colorStyles[card.color] || colorStyles.blue;
          return (
            <button
              key={card.id}
              onClick={() => onCardClick(card.module, card.filter)}
              className={`text-left p-3.5 rounded-2xl border ${style.border} ${style.bg} hover:border-[#168A45] hover:shadow-md transition-all group cursor-pointer relative flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <div className={`p-2 rounded-xl ${style.iconBg} group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/60 text-slate-600">
                  {card.badge}
                </span>
              </div>

              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mb-0.5">
                  {card.value}
                </div>
                <div className="text-xs font-bold text-slate-700 line-clamp-1 group-hover:text-[#0B5D2A] transition-colors">
                  {card.title}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                  {card.subtitle}
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-end text-[10px] font-bold text-slate-400 group-hover:text-[#168A45]">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mb-8">
      {/* Category Tab Selector */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveKpiCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeKpiCategory === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Executive KPIs (18)
          </button>
          <button
            onClick={() => setActiveKpiCategory('leads')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeKpiCategory === 'leads'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lead KPIs (6)
          </button>
          <button
            onClick={() => setActiveKpiCategory('hr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeKpiCategory === 'hr'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            HR KPIs (6)
          </button>
          <button
            onClick={() => setActiveKpiCategory('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeKpiCategory === 'documents'
                ? 'bg-white text-amber-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Document Compliance KPIs (6)
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
          <span>Overall Health:</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            94.8% Operational
          </span>
        </div>
      </div>

      {/* Render KPI Groupings based on selected tab */}
      {(activeKpiCategory === 'all' || activeKpiCategory === 'leads') && (
        renderCardList(leadCards, '1. Lead Management Executive KPIs', 'text-blue-700')
      )}

      {(activeKpiCategory === 'all' || activeKpiCategory === 'hr') && (
        renderCardList(hrCards, '2. Human Resources & Attendance KPIs', 'text-emerald-800')
      )}

      {(activeKpiCategory === 'all' || activeKpiCategory === 'documents') && (
        renderCardList(docCards, '3. Document Expiry & Legal Compliance KPIs', 'text-amber-800')
      )}
    </div>
  );
};
