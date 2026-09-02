import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Trophy,
  CheckCircle2,
  Download,
  IndianRupee,
  Layers,
  Filter,
  Search,
  ArrowRight,
  Clock,
  AlertTriangle,
  FileSpreadsheet,
  GraduationCap,
  Sparkles,
  Activity,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { DashboardMetrics, Lead, LeadStatus, Proposal } from '../types';
import { formatINR } from '../utils/pdfGenerator';
import { StatusBadge } from './StatusBadge';

interface ReportsViewProps {
  metrics: DashboardMetrics;
  leads: Lead[];
  proposals: Proposal[];
  onExportAllCsv: () => void;
  onNavigateToLeads?: (status?: string) => void;
}

// Logical grouping of all 12 pipeline statuses
const PIPELINE_STAGES = [
  {
    id: 'discovery',
    name: 'Discovery & Initial Contact',
    color: '#0284c7',
    bgColor: '#f0f9ff',
    borderColor: '#bae6fd',
    statuses: ['New', 'Contacted', 'Follow-up'] as LeadStatus[],
    description: 'Initial intake, cold outreach, and follow-up cadence',
  },
  {
    id: 'evaluation',
    name: 'Qualification & Demonstration',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    borderColor: '#99f6e4',
    statuses: ['Qualified', 'Demo Scheduled', 'Demo Completed'] as LeadStatus[],
    description: 'Institutional vetting, product demos, and feature reviews',
  },
  {
    id: 'proposal',
    name: 'Proposal & Commercial Negotiation',
    color: '#168a45',
    bgColor: '#eaf7ef',
    borderColor: '#bbf7d0',
    statuses: ['Send Proposal', 'Proposal Sent', 'Negotiation'] as LeadStatus[],
    description: 'Pricing quotes, formal proposals, and contract negotiations',
  },
  {
    id: 'closure',
    name: 'Closed & Outcomes',
    color: '#475569',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    statuses: ['Won', 'Lost', 'On Hold'] as LeadStatus[],
    description: 'Final deal outcomes, institutional sign-offs, or deferred cycles',
  },
];

const ALL_STATUSES: LeadStatus[] = [
  'New',
  'Contacted',
  'Follow-up',
  'Qualified',
  'Demo Scheduled',
  'Demo Completed',
  'Send Proposal',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'On Hold',
];

export const ReportsView: React.FC<ReportsViewProps> = ({
  metrics,
  leads,
  proposals,
  onExportAllCsv,
  onNavigateToLeads,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'pipeline' | 'salesReps' | 'sources' | 'revenue'>('pipeline');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assignedRepFilter, setAssignedRepFilter] = useState<string>('All');

  // Win & Conversion rates
  const winRate = metrics.totalLeads > 0 ? Math.round((metrics.won / metrics.totalLeads) * 100) : 0;
  
  // Total Enrolled Students across all leads
  const totalStudentStrength = useMemo(() => {
    return leads.reduce((acc, lead) => acc + (Number(lead.studentStrength) || 0), 0);
  }, [leads]);

  // Active in-flight leads (excluding Won, Lost, On Hold)
  const activeInFlightLeads = useMemo(() => {
    return leads.filter((l) => !['Won', 'Lost', 'On Hold'].includes(l.status));
  }, [leads]);

  // Status breakdown calculations
  const statusStats = useMemo(() => {
    const map: Record<
      LeadStatus,
      {
        count: number;
        totalStudents: number;
        highPriority: number;
        medPriority: number;
        lowPriority: number;
        reps: Set<string>;
        leads: Lead[];
      }
    > = {
      New: { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      Contacted: { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      'Follow-up': { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      Qualified: { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      'Demo Scheduled': { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      'Demo Completed': { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      'Send Proposal': { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      'Proposal Sent': { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      Negotiation: { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      Won: { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      Lost: { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
      'On Hold': { count: 0, totalStudents: 0, highPriority: 0, medPriority: 0, lowPriority: 0, reps: new Set(), leads: [] },
    };

    leads.forEach((l) => {
      if (map[l.status]) {
        map[l.status].count++;
        map[l.status].totalStudents += Number(l.studentStrength) || 0;
        if (l.priority === 'High') map[l.status].highPriority++;
        else if (l.priority === 'Medium') map[l.status].medPriority++;
        else map[l.status].lowPriority++;
        if (l.assignedTo) map[l.status].reps.add(l.assignedTo);
        map[l.status].leads.push(l);
      }
    });

    return map;
  }, [leads]);

  // Stage calculations
  const stageStats = useMemo(() => {
    return PIPELINE_STAGES.map((stage) => {
      let count = 0;
      let students = 0;
      let highPriority = 0;
      const stageLeads: Lead[] = [];

      stage.statuses.forEach((st) => {
        const data = statusStats[st];
        if (data) {
          count += data.count;
          students += data.totalStudents;
          highPriority += data.highPriority;
          stageLeads.push(...data.leads);
        }
      });

      const percentage = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;

      return {
        ...stage,
        count,
        students,
        highPriority,
        percentage,
        stageLeads,
      };
    });
  }, [leads, statusStats]);

  // Unique list of sales reps
  const uniqueReps = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.assignedTo) set.add(l.assignedTo);
    });
    return Array.from(set).sort();
  }, [leads]);

  // Filtered Leads for the drill-down table
  const filteredDrilldownLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus =
        selectedStatusFilter === 'All'
          ? true
          : selectedStatusFilter.startsWith('stage:')
          ? PIPELINE_STAGES.find((s) => `stage:${s.id}` === selectedStatusFilter)?.statuses.includes(lead.status)
          : lead.status === selectedStatusFilter;

      const matchesPriority = priorityFilter === 'All' ? true : lead.priority === priorityFilter;
      const matchesRep = assignedRepFilter === 'All' ? true : lead.assignedTo === assignedRepFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        lead.instituteName.toLowerCase().includes(q) ||
        lead.contactPerson.toLowerCase().includes(q) ||
        lead.city.toLowerCase().includes(q) ||
        lead.id.toLowerCase().includes(q);

      return matchesStatus && matchesPriority && matchesRep && matchesSearch;
    });
  }, [leads, selectedStatusFilter, priorityFilter, assignedRepFilter, searchQuery]);

  // Leads needing attention (overdue or high priority in active negotiation/proposal)
  const urgentAttentionLeads = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return leads.filter((l) => {
      if (['Won', 'Lost', 'On Hold'].includes(l.status)) return false;
      const isOverdue = l.followUpDate && l.followUpDate < today;
      const isHighInProposal = l.priority === 'High' && ['Send Proposal', 'Negotiation', 'Proposal Sent'].includes(l.status);
      return isOverdue || isHighInProposal;
    });
  }, [leads]);

  // Export Lead Pipeline Status CSV
  const handleExportPipelineStatusCsv = () => {
    const rows = [
      ['MYSAR LEADS PIPELINE STATUS REPORT'],
      [`Generated Date: ${new Date().toLocaleString()}`],
      [`Total Leads: ${leads.length}`, `Active Pipeline: ${activeInFlightLeads.length}`, `Won Rate: ${winRate}%`],
      [],
      ['--- PIPELINE STAGE BREAKDOWN ---'],
      ['Stage Name', 'Statuses Included', 'Lead Count', '% of Total', 'Total Students Represented'],
      ...stageStats.map((s) => [
        s.name,
        s.statuses.join(' | '),
        s.count.toString(),
        `${s.percentage}%`,
        s.students.toString(),
      ]),
      [],
      ['--- DETAILED STATUS BREAKDOWN ---'],
      ['Status', 'Stage', 'Lead Count', '% of Pipeline', 'High Priority', 'Medium Priority', 'Low Priority', 'Total Students'],
      ...ALL_STATUSES.map((st) => {
        const data = statusStats[st];
        const stageName = PIPELINE_STAGES.find((s) => s.statuses.includes(st))?.name || 'Other';
        const pct = leads.length > 0 ? Math.round((data.count / leads.length) * 100) : 0;
        return [
          st,
          stageName,
          data.count.toString(),
          `${pct}%`,
          data.highPriority.toString(),
          data.medPriority.toString(),
          data.lowPriority.toString(),
          data.totalStudents.toString(),
        ];
      }),
      [],
      ['--- CURRENT PIPELINE LEADS DIRECTORY ---'],
      ['Lead ID', 'Institute Name', 'Status', 'Priority', 'Assigned Rep', 'Contact Person', 'Phone', 'City', 'State', 'Students', 'Follow-up Date'],
      ...leads.map((l) => [
        l.id,
        `"${(l.instituteName || '').replace(/"/g, '""')}"`,
        l.status,
        l.priority,
        l.assignedTo,
        `"${(l.contactPerson || '').replace(/"/g, '""')}"`,
        l.phone,
        l.city,
        l.state,
        (l.studentStrength || 0).toString(),
        l.followUpDate || '',
      ]),
    ];

    const csvContent = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MYSAR_Lead_Pipeline_Status_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Source breakdown
  const sourceMap: Record<string, number> = {};
  leads.forEach((l) => {
    sourceMap[l.leadSource] = (sourceMap[l.leadSource] || 0) + 1;
  });

  // Assignee breakdown
  const repMap: Record<string, { count: number; won: number; studentSum: number; pipeline: number }> = {};
  leads.forEach((l) => {
    if (!repMap[l.assignedTo]) repMap[l.assignedTo] = { count: 0, won: 0, studentSum: 0, pipeline: 0 };
    repMap[l.assignedTo].count++;
    repMap[l.assignedTo].studentSum += Number(l.studentStrength) || 0;
    if (l.status === 'Won') repMap[l.assignedTo].won++;
    if (!['Won', 'Lost', 'On Hold'].includes(l.status)) repMap[l.assignedTo].pipeline++;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">
              Lead Pipeline & Sales Analytics
            </h2>
            <span className="bg-[#EAF7EF] text-[#0B5D2A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
              Live Data
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline progression, status distribution, stage conversion rates, and institutional velocity
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportPipelineStatusCsv}
            className="bg-white hover:bg-emerald-50 text-[#0B5D2A] border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-2xs"
            title="Download formatted Lead Pipeline Status report"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#168A45]" />
            <span>Export Pipeline Report (CSV)</span>
          </button>

          <button
            onClick={onExportAllCsv}
            className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All CRM Data</span>
          </button>
        </div>
      </div>

      {/* Report View Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveReportTab('pipeline')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeReportTab === 'pipeline'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lead Pipeline Status Report</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeReportTab === 'pipeline' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => setActiveReportTab('salesReps')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeReportTab === 'salesReps'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Sales Rep Conversion</span>
        </button>

        <button
          onClick={() => setActiveReportTab('sources')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeReportTab === 'sources'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Acquisition Channels</span>
        </button>

        <button
          onClick={() => setActiveReportTab('revenue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeReportTab === 'revenue'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Commercials & Revenue</span>
        </button>
      </div>

      {/* TAB 1: LEAD PIPELINE STATUS REPORT */}
      {activeReportTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Top KPI Metric Highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Leads
                </span>
                <div className="p-1.5 rounded-lg bg-[#EAF7EF]">
                  <Layers className="w-3.5 h-3.5 text-[#168A45]" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                {leads.length}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {activeInFlightLeads.length} active in progression
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Active Pipeline
                </span>
                <div className="p-1.5 rounded-lg bg-sky-50">
                  <Activity className="w-3.5 h-3.5 text-sky-600" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-sky-700 mt-1">
                {activeInFlightLeads.length}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {leads.length > 0 ? Math.round((activeInFlightLeads.length / leads.length) * 100) : 0}% of all intake
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Student Volume
                </span>
                <div className="p-1.5 rounded-lg bg-[#EAF7EF]">
                  <GraduationCap className="w-3.5 h-3.5 text-[#168A45]" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#0B5D2A] mt-1">
                {totalStudentStrength.toLocaleString()}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Enrolled students in pipeline
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Win Conversion
                </span>
                <div className="p-1.5 rounded-lg bg-[#EAF7EF]">
                  <Trophy className="w-3.5 h-3.5 text-[#168A45]" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#0B5D2A] mt-1">
                {winRate}%
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {metrics.won} Closed Won institutions
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Attention Required
                </span>
                <div className="p-1.5 rounded-lg bg-amber-50">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-700 mt-1">
                {urgentAttentionLeads.length}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Overdue follow-up or hot deals
              </p>
            </div>
          </div>

          {/* Pipeline Stages Funnel (4 Stages) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#168A45]" />
                  Sales Pipeline Lifecycle Funnel
                </h3>
                <p className="text-[11px] text-slate-500">
                  Lead volume progression from initial intake through commercial proposal to final sign-off
                </p>
              </div>

              {selectedStatusFilter !== 'All' && (
                <button
                  onClick={() => setSelectedStatusFilter('All')}
                  className="text-xs text-[#168A45] hover:text-[#0B5D2A] font-bold flex items-center space-x-1"
                >
                  <span>Reset Filter ({selectedStatusFilter})</span>
                </button>
              )}
            </div>

            {/* 4 Stage Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {stageStats.map((stage, idx) => {
                const isSelected = selectedStatusFilter === `stage:${stage.id}`;
                return (
                  <div
                    key={stage.id}
                    onClick={() =>
                      setSelectedStatusFilter(isSelected ? 'All' : `stage:${stage.id}`)
                    }
                    className={`cursor-pointer rounded-xl p-4 border transition-all relative overflow-hidden ${
                      isSelected
                        ? 'ring-2 ring-[#168A45] border-transparent shadow-md'
                        : 'border-gray-200 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                    style={{ backgroundColor: stage.bgColor }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Stage 0{idx + 1}
                      </span>
                      <span
                        className="text-xs font-extrabold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${stage.color}15`,
                          color: stage.color,
                        }}
                      >
                        {stage.percentage}%
                      </span>
                    </div>

                    <div className="mt-2 font-bold text-slate-800 text-xs line-clamp-1">
                      {stage.name}
                    </div>

                    <div className="flex items-baseline space-x-2 mt-1">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {stage.count}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Leads ({stage.students.toLocaleString()} students)
                      </span>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="w-full bg-black/5 rounded-full h-1.5 mt-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${stage.percentage}%`,
                          backgroundColor: stage.color,
                        }}
                      />
                    </div>

                    {/* Status Pills inside Stage */}
                    <div className="flex flex-wrap gap-1 mt-3 pt-2 border-t border-black/5">
                      {stage.statuses.map((st) => {
                        const count = statusStats[st]?.count || 0;
                        const isStSelected = selectedStatusFilter === st;
                        return (
                          <button
                            key={st}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStatusFilter(isStSelected ? 'All' : st);
                            }}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                              isStSelected
                                ? 'bg-slate-900 text-white'
                                : 'bg-white/80 hover:bg-white text-slate-700 border border-black/5'
                            }`}
                          >
                            {st} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Breakdown Table Matrix */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#168A45]" />
                  Status Breakdown & Priority Distribution Matrix
                </h3>
                <p className="text-[11px] text-slate-500">
                  Granular stage metrics across all 12 pipeline states with student volumes and priority ratios
                </p>
              </div>

              <div className="text-xs text-slate-500 font-medium flex items-center space-x-1">
                <span>Click any row to filter directory below</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-slate-500 uppercase text-[10px] font-bold bg-[#F7FAF8]">
                    <th className="py-2.5 px-3 rounded-l-lg">Pipeline Status</th>
                    <th className="py-2.5 px-2">Lifecycle Stage</th>
                    <th className="py-2.5 px-2 text-center">Lead Count</th>
                    <th className="py-2.5 px-2 text-center">% of Total</th>
                    <th className="py-2.5 px-2 text-center">Student Strength</th>
                    <th className="py-2.5 px-2 text-center">Priority (H / M / L)</th>
                    <th className="py-2.5 px-2">Assigned Sales Team</th>
                    <th className="py-2.5 px-3 text-right rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-slate-700">
                  {ALL_STATUSES.map((status) => {
                    const data = statusStats[status];
                    const stage = PIPELINE_STAGES.find((s) => s.statuses.includes(status));
                    const percentage = leads.length > 0 ? Math.round((data.count / leads.length) * 100) : 0;
                    const isSelected = selectedStatusFilter === status;

                    return (
                      <tr
                        key={status}
                        onClick={() => setSelectedStatusFilter(isSelected ? 'All' : status)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#EAF7EF]' : 'hover:bg-[#F7FAF8]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold">
                          <div className="flex items-center space-x-2">
                            <StatusBadge status={status} />
                            {isSelected && (
                              <span className="text-[10px] text-[#168A45] font-bold bg-emerald-100 px-1.5 py-0.2 rounded">
                                Selected
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-slate-500 font-medium">
                          <span
                            className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${stage?.color}15`,
                              color: stage?.color,
                            }}
                          >
                            {stage?.name.split('&')[0]}
                          </span>
                        </td>

                        <td className="py-2.5 px-2 text-center font-extrabold text-slate-800">
                          {data.count}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <div className="w-12 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#168A45] h-full rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-600">{percentage}%</span>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-center font-semibold text-[#0B5D2A]">
                          {data.totalStudents.toLocaleString()}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center space-x-1 text-[10px] font-bold">
                            <span className="px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200" title="High Priority">
                              {data.highPriority}H
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Medium Priority">
                              {data.medPriority}M
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200" title="Low Priority">
                              {data.lowPriority}L
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-2 text-slate-600 text-[11px]">
                          {Array.from(data.reps).length > 0 ? (
                            <span className="font-medium">
                              {Array.from(data.reps).slice(0, 2).join(', ')}
                              {Array.from(data.reps).length > 2 && ` +${Array.from(data.reps).length - 2}`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onNavigateToLeads) {
                                onNavigateToLeads(status);
                              }
                            }}
                            className="text-slate-500 hover:text-[#168A45] text-xs font-bold inline-flex items-center space-x-1"
                            title="Open in CRM Lead Pipeline"
                          >
                            <span>Open CRM</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Drill-down Leads Directory with Live Filters */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#168A45]" />
                  Pipeline Lead Directory Drill-Down
                </h3>
                <p className="text-[11px] text-slate-500">
                  Showing {filteredDrilldownLeads.length} of {leads.length} leads matching selected status and filters
                </p>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search institute, city..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#F7FAF8] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#168A45] w-44"
                  />
                </div>

                {/* Status Dropdown */}
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="text-xs bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                >
                  <option value="All">All Pipeline Statuses ({leads.length})</option>
                  <optgroup label="Pipeline Stages">
                    {PIPELINE_STAGES.map((s) => (
                      <option key={s.id} value={`stage:${s.id}`}>
                        Stage: {s.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Individual Statuses">
                    {ALL_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st} ({statusStats[st]?.count || 0})
                      </option>
                    ))}
                  </optgroup>
                </select>

                {/* Priority Dropdown */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="text-xs bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                >
                  <option value="All">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>

                {/* Assigned Rep Dropdown */}
                <select
                  value={assignedRepFilter}
                  onChange={(e) => setAssignedRepFilter(e.target.value)}
                  className="text-xs bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                >
                  <option value="All">All Sales Reps</option>
                  {uniqueReps.map((rep) => (
                    <option key={rep} value={rep}>
                      {rep}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Drilldown Leads Table */}
            {filteredDrilldownLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-slate-500 uppercase text-[10px] font-bold bg-[#F7FAF8]">
                      <th className="py-2.5 px-3 rounded-l-lg">Lead ID</th>
                      <th className="py-2.5 px-2">Institute Name & Location</th>
                      <th className="py-2.5 px-2">Status</th>
                      <th className="py-2.5 px-2 text-center">Priority</th>
                      <th className="py-2.5 px-2">Contact Person & Phone</th>
                      <th className="py-2.5 px-2 text-center">Students</th>
                      <th className="py-2.5 px-2">Assigned Rep</th>
                      <th className="py-2.5 px-2">Next Follow-up</th>
                      <th className="py-2.5 px-3 text-right rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-slate-700">
                    {filteredDrilldownLeads.map((lead) => {
                      const today = new Date().toISOString().split('T')[0];
                      const isOverdue = lead.followUpDate && lead.followUpDate < today;

                      return (
                        <tr key={lead.id} className="hover:bg-[#F7FAF8] transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500 text-[11px]">
                            {lead.id}
                          </td>

                          <td className="py-2.5 px-2">
                            <div className="font-bold text-slate-800">{lead.instituteName}</div>
                            <div className="text-[10px] text-slate-500 font-medium">
                              {lead.city}, {lead.state}
                            </div>
                          </td>

                          <td className="py-2.5 px-2">
                            <StatusBadge status={lead.status} />
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                lead.priority === 'High'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : lead.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {lead.priority}
                            </span>
                          </td>

                          <td className="py-2.5 px-2">
                            <div className="font-semibold text-slate-800">{lead.contactPerson}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{lead.phone}</div>
                          </td>

                          <td className="py-2.5 px-2 text-center font-bold text-[#0B5D2A]">
                            {(lead.studentStrength || 0).toLocaleString()}
                          </td>

                          <td className="py-2.5 px-2 font-medium text-slate-700">
                            {lead.assignedTo || 'Unassigned'}
                          </td>

                          <td className="py-2.5 px-2">
                            {lead.followUpDate ? (
                              <div
                                className={`text-[11px] font-medium flex items-center space-x-1 ${
                                  isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>{lead.followUpDate}</span>
                                {isOverdue && (
                                  <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">
                                    Overdue
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[10px]">None</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                if (onNavigateToLeads) {
                                  onNavigateToLeads(lead.status);
                                }
                              }}
                              className="bg-[#EAF7EF] hover:bg-[#168A45] text-[#0B5D2A] hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all inline-flex items-center space-x-1"
                            >
                              <span>View</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 bg-[#F7FAF8] rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-slate-500 font-medium">
                  No leads found matching status "{selectedStatusFilter}" and active filters.
                </p>
                <button
                  onClick={() => {
                    setSelectedStatusFilter('All');
                    setSearchQuery('');
                    setPriorityFilter('All');
                    setAssignedRepFilter('All');
                  }}
                  className="mt-2 text-xs font-bold text-[#168A45] hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SALES REP PERFORMANCE */}
      {activeReportTab === 'salesReps' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#168A45]" />
              Sales Representative Performance & Conversion Breakdown
            </h3>
            <p className="text-[11px] text-slate-500">
              Institutional pipeline handling, won contracts, and overall closure efficiency per rep
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-slate-500 uppercase text-[10px] font-bold bg-[#F7FAF8]">
                  <th className="py-2.5 px-3 rounded-l-lg">Sales Representative</th>
                  <th className="py-2.5 px-2 text-center">Assigned Leads</th>
                  <th className="py-2.5 px-2 text-center">In-Progress Pipeline</th>
                  <th className="py-2.5 px-2 text-center">Deals Won</th>
                  <th className="py-2.5 px-2 text-center">Total Students Represented</th>
                  <th className="py-2.5 px-3 text-right rounded-r-lg">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {Object.entries(repMap).map(([repName, val]) => {
                  const repRate = val.count > 0 ? Math.round((val.won / val.count) * 100) : 0;
                  return (
                    <tr key={repName} className="hover:bg-[#F7FAF8]">
                      <td className="py-2.5 px-3 font-bold text-slate-800">{repName}</td>
                      <td className="py-2.5 px-2 text-center font-medium">{val.count}</td>
                      <td className="py-2.5 px-2 text-center font-semibold text-sky-700">{val.pipeline}</td>
                      <td className="py-2.5 px-2 text-center font-bold text-[#0B5D2A]">{val.won}</td>
                      <td className="py-2.5 px-2 text-center font-medium text-slate-600">{val.studentSum.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-[#168A45]">{repRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ACQUISITION CHANNELS */}
      {activeReportTab === 'sources' && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#168A45]" />
              Leads by Inbound / Acquisition Source
            </h3>
            <p className="text-[11px] text-slate-500">
              Effectiveness of marketing channels, direct referrals, and institutional outreach campaigns
            </p>
          </div>

          <div className="space-y-4 pt-1 max-w-2xl">
            {Object.entries(sourceMap).map(([src, count]) => {
              const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
              return (
                <div key={src} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{src}</span>
                    <span className="text-slate-600 font-semibold">
                      {count} leads ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#F7FAF8] border border-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-[#168A45] h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: REVENUE & PROPOSALS */}
      {activeReportTab === 'revenue' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#168A45]" />
              Active Commercial Pipeline Value
            </h3>
            <div className="text-3xl font-extrabold text-[#168A45]">
              {formatINR(metrics.totalPipelineValue)}
            </div>
            <p className="text-xs text-slate-500">
              Total estimated contract value across {proposals.length} generated proposals in negotiation
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#0B5D2A]" />
              Won Revenue Closed
            </h3>
            <div className="text-3xl font-extrabold text-[#0B5D2A]">
              {formatINR(metrics.wonValue)}
            </div>
            <p className="text-xs text-slate-500">
              Signed institutional contracts & verified commitments
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
