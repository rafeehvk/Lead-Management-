import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Mail,
  CheckCircle2,
  Trash2,
  Building2,
  IndianRupee,
  ExternalLink,
  Plus,
  Loader2,
  History,
  Edit3,
  Clock,
  User as UserIcon,
  X,
  ArrowRight,
  CreditCard,
  TrendingUp,
  Receipt,
  ShieldCheck,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Proposal, ProposalStatus, Settings, ProposalVersionEntry, OverallPaymentStatus } from '../types';
import { generatePdfFromElement, formatINR } from '../utils/pdfGenerator';
import { PrintableProposalDocument } from './PrintableProposalDocument';
import { ProposalPaymentDashboard } from './ProposalPaymentDashboard';
import { getProposalPaymentTracking, getPaymentBadgeClass } from '../utils/paymentScheduleUtils';

interface ProposalsViewProps {
  proposals: Proposal[];
  settings?: Settings;
  onOpenPreview: (proposal: Proposal) => void;
  onEditProposal?: (proposal: Proposal) => void;
  onDeleteProposal: (id: string) => void;
  onUpdateStatus: (id: string, status: ProposalStatus) => void;
  onExportCsv: () => void;
  onOpenNewProposalPrompt: () => void;
  onEmailProposal?: (proposal: Proposal) => void;
  onUpdateProposal?: (updated: Proposal) => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  settings,
  onOpenPreview,
  onEditProposal,
  onDeleteProposal,
  onUpdateStatus,
  onExportCsv,
  onOpenNewProposalPrompt,
  onEmailProposal,
  onUpdateProposal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'table' | 'paymentDashboard'>('table');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingProposal, setDownloadingProposal] = useState<Proposal | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);
  const [selectedVersionProposal, setSelectedVersionProposal] = useState<Proposal | null>(null);
  const [selectedPaymentProposal, setSelectedPaymentProposal] = useState<Proposal | null>(null);

  const statuses: ProposalStatus[] = ['Draft', 'Sent', 'Approved', 'Rejected', 'Negotiating'];
  const paymentStatuses: (OverallPaymentStatus | 'All')[] = [
    'All',
    'Fully Paid',
    'Partially Paid',
    'Unpaid',
    'Overdue',
  ];

  const handleDirectDownloadPdf = async (proposal: Proposal) => {
    setDownloadingId(proposal.id);
    setDownloadingProposal(proposal);
    setDownloadToast(`Preparing PDF for ${proposal.proposalNumber}...`);

    // Allow the DOM element to mount cleanly
    setTimeout(async () => {
      try {
        const sanitizedName = (proposal.instituteName || 'Proposal').replace(/[^a-zA-Z0-9]/g, '_');
        await generatePdfFromElement(
          'mysar-proposal-direct-download-container',
          `MYSAR_Proposal_${proposal.proposalNumber.replace(/\//g, '_')}_${sanitizedName}`,
          (msg) => {
            setDownloadToast(msg);
          }
        );
        setDownloadToast(`Proposal PDF for ${proposal.instituteName} downloaded!`);
        setTimeout(() => setDownloadToast(null), 3500);
      } catch (e) {
        console.error('Direct PDF export error', e);
        setDownloadToast(null);
        onOpenPreview(proposal);
      } finally {
        setDownloadingId(null);
        setDownloadingProposal(null);
      }
    }, 150);
  };

  // Financial & Payment Milestone Aggregates across all proposals
  const totalAgreedValue = proposals.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
  const totalRealizedValue = proposals.reduce((acc, p) => {
    const t = getProposalPaymentTracking(p);
    return acc + (Number(t.totalPaidAmount) || 0);
  }, 0);
  const totalPendingBalance = Math.max(0, totalAgreedValue - totalRealizedValue);
  const overallRealizationRate =
    totalAgreedValue > 0 ? Math.round((totalRealizedValue / totalAgreedValue) * 100) : 0;

  const stage1Totals = proposals.reduce(
    (acc, p) => {
      const s = getProposalPaymentTracking(p).stages[0];
      return { target: acc.target + (s?.targetAmount || 0), paid: acc.paid + (s?.paidAmount || 0) };
    },
    { target: 0, paid: 0 }
  );
  const stage2Totals = proposals.reduce(
    (acc, p) => {
      const s = getProposalPaymentTracking(p).stages[1];
      return { target: acc.target + (s?.targetAmount || 0), paid: acc.paid + (s?.paidAmount || 0) };
    },
    { target: 0, paid: 0 }
  );
  const stage3Totals = proposals.reduce(
    (acc, p) => {
      const s = getProposalPaymentTracking(p).stages[2];
      return { target: acc.target + (s?.targetAmount || 0), paid: acc.paid + (s?.paidAmount || 0) };
    },
    { target: 0, paid: 0 }
  );

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.instituteName.toLowerCase().includes(search.toLowerCase()) ||
      p.proposalNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.proposalStatus === statusFilter;
    const tracking = getProposalPaymentTracking(p);
    const matchesPayment =
      paymentFilter === 'All' || tracking.overallPaymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  });

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-[#EAF7EF] text-[#0B5D2A] border-[#168A45] font-bold';
      case 'Sent':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC] font-medium';
      case 'Negotiating':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      case 'Draft':
        return 'bg-gray-50 text-slate-700 border-gray-200 font-medium';
      case 'Rejected':
        return 'bg-red-50 text-red-700 border-red-200 font-medium';
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Generated Commercial Proposals
          </h2>
          <p className="text-xs text-slate-500">
            Dynamic MYSAR institutional proposals, automated price calculations, and 3-stage milestone payment tracking
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onExportCsv}
            className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#168A45]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewProposalPrompt}
            className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
        </div>
      </div>

      {/* Aggregate Financial & 3-Stage Milestone Payment Dashboard Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Total Proposals Value</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
              {proposals.length} Contracts
            </span>
          </div>
          <div className="text-xl font-black text-slate-900">
            {formatINR(totalAgreedValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Total commercial proposal pipeline
          </div>
        </div>

        <div className="bg-white border border-emerald-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-[#168A45] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Collected Revenue</span>
            <span className="text-[10px] bg-emerald-50 text-[#0B5D2A] px-1.5 py-0.5 rounded font-black border border-emerald-200">
              {overallRealizationRate}% Realized
            </span>
          </div>
          <div className="text-xl font-black text-[#0B5D2A]">
            {formatINR(totalRealizedValue)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Confirmed milestone receipts
          </div>
        </div>

        <div className="bg-white border border-amber-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Pending Balance</span>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-black border border-amber-200">
              {100 - overallRealizationRate}% Pending
            </span>
          </div>
          <div className="text-xl font-black text-amber-900">
            {formatINR(totalPendingBalance)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Across active future milestones
          </div>
        </div>

        {/* 3-Stage Milestone Overview Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>3-Stage Schedule</span>
            <CreditCard className="w-3.5 h-3.5 text-[#168A45]" />
          </div>
          <div className="space-y-1 text-[10.5px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-600">1. Reg Fee:</span>
              <span className="font-bold text-[#0B5D2A]">
                {formatINR(stage1Totals.paid)} <span className="text-slate-400 font-normal">/ {formatINR(stage1Totals.target)}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">2. Onboard 60%:</span>
              <span className="font-bold text-[#0B5D2A]">
                {formatINR(stage2Totals.paid)} <span className="text-slate-400 font-normal">/ {formatINR(stage2Totals.target)}</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">3. 2-Mo 40%:</span>
              <span className="font-bold text-[#0B5D2A]">
                {formatINR(stage3Totals.paid)} <span className="text-slate-400 font-normal">/ {formatINR(stage3Totals.target)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with View Mode Switcher */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search proposal #, institute, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAF8] border border-gray-200 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45]"
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#168A45]"
          >
            <option value="All">All Proposal Statuses ({proposals.length})</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s} ({proposals.filter((p) => p.proposalStatus === s).length})
              </option>
            ))}
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#168A45]"
          >
            {paymentStatuses.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Payment Statuses' : `Payment: ${s}`}
              </option>
            ))}
          </select>

          {/* View Mode Toggle: Table vs Payment Dashboard */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table List View"
              className={`p-1.5 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('paymentDashboard')}
              title="Payment Status Dashboard View"
              className={`p-1.5 text-xs rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                viewMode === 'paymentDashboard'
                  ? 'bg-[#168A45] text-white font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Payment Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: PROPOSALS TABLE */}
      {viewMode === 'table' && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-1/4">Proposal Number & Date</th>
                  <th className="py-3.5 px-4 w-1/3">Institute & Scope</th>
                  <th className="py-3.5 px-3 w-28 text-center">Status</th>
                  <th className="py-3.5 px-4 w-60">Payment Status (3 Stages)</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      No proposals match the current filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const tracking = getProposalPaymentTracking(p);
                    const pctCollected =
                      tracking.totalAgreedAmount > 0
                        ? Math.round((tracking.totalPaidAmount / tracking.totalAgreedAmount) * 100)
                        : 0;

                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-[#F7FAF8] transition-colors group cursor-pointer"
                        onClick={() => onOpenPreview(p)}
                      >
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-[#0B5D2A]">{p.proposalNumber}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVersionProposal(p);
                              }}
                              title={`Version v${p.version || 1} • Click to view version history timeline`}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-[#0B5D2A] border border-emerald-300 hover:bg-emerald-100 hover:border-[#168A45] transition-colors cursor-pointer shadow-2xs"
                            >
                              <History className="w-3 h-3 text-[#168A45]" />
                              <span>v{p.version || 1}</span>
                            </button>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                            <span>{p.proposalDate}</span>
                            {(p.versionHistory?.length || p.version || 1) > 1 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-600 font-semibold text-[11px]">
                                  {(p.versionHistory?.length || p.version || 1)} revisions
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-sm text-slate-800 line-clamp-1">
                            {p.instituteName}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                            <span>{p.contactPerson}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700">
                              {p.studentCount} students
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-[#0B5D2A]">
                              {formatINR(p.totalAmount)}
                            </span>
                          </div>
                        </td>

                        <td
                          className="py-3.5 px-3 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={p.proposalStatus}
                            onChange={(e) => onUpdateStatus(p.id, e.target.value as ProposalStatus)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${getStatusBadge(
                              p.proposalStatus
                            )}`}
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Payment Status (3 Milestones Tracking) Column */}
                        <td
                          className="py-3.5 px-4 whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPaymentProposal(p);
                          }}
                          title="Click to view/update Payment Status Dashboard"
                        >
                          <div className="flex flex-col gap-1 hover:opacity-90">
                            <div className="flex items-center justify-between gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded-full border ${getPaymentBadgeClass(
                                  tracking.overallPaymentStatus
                                )}`}
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>{tracking.overallPaymentStatus}</span>
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-800">
                                {formatINR(tracking.totalPaidAmount)}
                              </span>
                            </div>

                            {/* 3-Milestone Micro Step Tracker */}
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span
                                title={`Stage 1: Registration (${formatINR(tracking.stages[0]?.paidAmount || 0)} / ${formatINR(tracking.stages[0]?.targetAmount || 0)})`}
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                  tracking.stages[0]?.status === 'Paid'
                                    ? 'bg-emerald-100 text-[#0B5D2A]'
                                    : tracking.stages[0]?.status === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                1. Reg {tracking.stages[0]?.status === 'Paid' ? '✓' : ''}
                              </span>
                              <span>•</span>
                              <span
                                title={`Stage 2: Onboarding 60% (${formatINR(tracking.stages[1]?.paidAmount || 0)} / ${formatINR(tracking.stages[1]?.targetAmount || 0)})`}
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                  tracking.stages[1]?.status === 'Paid'
                                    ? 'bg-emerald-100 text-[#0B5D2A]'
                                    : tracking.stages[1]?.status === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                2. Onboard {tracking.stages[1]?.status === 'Paid' ? '✓' : ''}
                              </span>
                              <span>•</span>
                              <span
                                title={`Stage 3: 2-Month Mark 40% (${formatINR(tracking.stages[2]?.paidAmount || 0)} / ${formatINR(tracking.stages[2]?.targetAmount || 0)})`}
                                className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                  tracking.stages[2]?.status === 'Paid'
                                    ? 'bg-emerald-100 text-[#0B5D2A]'
                                    : tracking.stages[2]?.status === 'Partially Paid'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                3. 2-Mo {tracking.stages[2]?.status === 'Paid' ? '✓' : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td
                          className="py-3.5 px-4 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Payment Status Tracker Action */}
                            <button
                              onClick={() => setSelectedPaymentProposal(p)}
                              title="Open Payment Status Dashboard (Registration, Onboarding, 2-Month Mark)"
                              className="bg-white hover:bg-emerald-50 text-[#0B5D2A] border border-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5 text-[#168A45]" />
                              <span className="hidden xl:inline">Payment</span>
                            </button>

                            {onEmailProposal && (
                              <button
                                onClick={() => onEmailProposal(p)}
                                title="Email Proposal via Gmail"
                                className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Mail className="w-3.5 h-3.5 text-[#168A45]" />
                                <span className="hidden sm:inline">Email</span>
                              </button>
                            )}

                            {onEditProposal && (
                              <button
                                onClick={() => onEditProposal(p)}
                                title={`Edit proposal and issue v${(p.version || 1) + 1}`}
                                className="bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedVersionProposal(p)}
                              title="View Version History Tracker"
                              className="bg-white hover:bg-emerald-50 text-[#0B5D2A] border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors cursor-pointer"
                            >
                              <History className="w-3.5 h-3.5 text-[#168A45]" />
                              <span className="hidden md:inline">History</span>
                            </button>

                            <button
                              onClick={() => onOpenPreview(p)}
                              title="View Proposal Document"
                              className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-slate-500" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => handleDirectDownloadPdf(p)}
                              disabled={downloadingId === p.id}
                              title="Download Proposal PDF"
                              aria-label="Download Proposal PDF"
                              className="p-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                            >
                              {downloadingId === p.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Delete proposal ${p.proposalNumber}?`)) {
                                  onDeleteProposal(p.id);
                                }
                              }}
                              title="Delete Proposal"
                              className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DEDICATED PAYMENT STATUS DASHBOARD GRID */}
      {viewMode === 'paymentDashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-12 text-center text-slate-400 border border-gray-200">
              No proposals match the current payment criteria.
            </div>
          ) : (
            filtered.map((p) => {
              const tracking = getProposalPaymentTracking(p);
              const pct =
                tracking.totalAgreedAmount > 0
                  ? Math.round((tracking.totalPaidAmount / tracking.totalAgreedAmount) * 100)
                  : 0;

              return (
                <div
                  key={p.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-[#0B5D2A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {p.proposalNumber}
                      </span>
                      <span
                        className={`text-[10.5px] px-2.5 py-0.5 rounded-full border ${getPaymentBadgeClass(
                          tracking.overallPaymentStatus
                        )}`}
                      >
                        {tracking.overallPaymentStatus}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-0.5">
                      {p.instituteName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3">
                      {p.contactPerson} • {p.studentCount} students
                    </p>

                    {/* Progress Bar & Amounts */}
                    <div className="bg-[#F7FAF8] rounded-lg p-3 border border-gray-200/80 mb-3">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="text-slate-500 font-medium">Realized / Agreed:</span>
                        <span className="font-bold text-slate-900">
                          {formatINR(tracking.totalPaidAmount)} / {formatINR(tracking.totalAgreedAmount)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#168A45] rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>{pct}% Realized</span>
                        <span>Pending: {formatINR(tracking.balanceAmount)}</span>
                      </div>
                    </div>

                    {/* 3-Stage Milestone Breakdown */}
                    <div className="space-y-1.5 text-xs mb-4">
                      {tracking.stages.map((st, i) => (
                        <div
                          key={st.stageKey}
                          className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                            st.status === 'Paid'
                              ? 'bg-[#EAF7EF] border-emerald-200 text-[#0B5D2A]'
                              : st.status === 'Partially Paid'
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-slate-50 border-gray-200 text-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-black text-[10px] w-4 h-4 rounded-full bg-white/70 flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="font-medium truncate">{st.stageName}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold">
                              {formatINR(st.paidAmount)}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              / {formatINR(st.targetAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentProposal(p)}
                      className="flex-1 py-1.5 px-3 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenPreview(p)}
                      title="View Proposal Document"
                      className="py-1.5 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Summary Footer */}
      <div className="bg-[#F7FAF8] border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-slate-500 flex items-center justify-between shadow-2xs">
        <span>Showing {filtered.length} of {proposals.length} proposals</span>
        <span className="text-[11px] text-slate-400">3-Stage Milestone Payment Engine Active</span>
      </div>

      {/* Download Status Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 border border-slate-700">
          <Loader2 className="w-4 h-4 text-[#168A45] animate-spin" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Off-screen document container for direct 1-click PDF download */}
      {downloadingProposal && (
        <div
          id="mysar-proposal-direct-download-wrapper"
          style={{
            position: 'fixed',
            top: 0,
            left: '-99999px',
            width: '794px',
            zIndex: -9999,
            opacity: 1,
            pointerEvents: 'none',
          }}
        >
          <PrintableProposalDocument
            proposal={downloadingProposal}
            settings={settings}
            id="mysar-proposal-direct-download-container"
            showPageBadges={false}
          />
        </div>
      )}

      {/* Version History Modal */}
      {selectedVersionProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-[#F7FAF8] border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-[#EAF7EF] text-[#0B5D2A] border border-emerald-200 flex items-center justify-center font-bold">
                  <History className="w-5 h-5 text-[#168A45]" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-slate-800">
                      Proposal Version History
                    </h3>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                      {selectedVersionProposal.proposalNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {selectedVersionProposal.instituteName} • Current active:{' '}
                    <strong className="text-slate-800">v{selectedVersionProposal.version || 1}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVersionProposal(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-medium">Active Version</div>
                  <div className="text-base font-bold text-[#0B5D2A] mt-0.5">
                    v{selectedVersionProposal.version || 1}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-medium">Total Versions</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {selectedVersionProposal.versionHistory && selectedVersionProposal.versionHistory.length > 0
                      ? selectedVersionProposal.versionHistory.length
                      : selectedVersionProposal.version || 1}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-medium">Current Students</div>
                  <div className="text-base font-bold text-slate-800 mt-0.5">
                    {selectedVersionProposal.studentCount}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <div className="text-[11px] text-slate-500 font-medium">Current Value</div>
                  <div className="text-base font-bold text-[#0B5D2A] mt-0.5">
                    {formatINR(selectedVersionProposal.totalAmount)}
                  </div>
                </div>
              </div>

              {/* Version Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Audit Log & Revisions
                  </h4>
                  <span className="text-[11px] text-slate-400">Chronological revisions</span>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const history =
                      selectedVersionProposal.versionHistory &&
                      selectedVersionProposal.versionHistory.length > 0
                        ? [...selectedVersionProposal.versionHistory].reverse()
                        : [
                            {
                              version: selectedVersionProposal.version || 1,
                              updatedAt: selectedVersionProposal.createdDate,
                              updatedBy: selectedVersionProposal.createdBy || 'Sales Rep',
                              pricingType: selectedVersionProposal.pricingType,
                              pricePerStudent: selectedVersionProposal.pricePerStudent,
                              studentCount: selectedVersionProposal.studentCount,
                              totalAmount: selectedVersionProposal.totalAmount,
                              changesSummary: 'Initial proposal created',
                            },
                          ];

                    return history.map((entry, idx) => {
                      const isLatest =
                        entry.version === (selectedVersionProposal.version || 1);
                      const isInitial = entry.version === 1;

                      return (
                        <div
                          key={entry.version || idx}
                          className={`border rounded-xl p-4 transition-all ${
                            isLatest
                              ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${
                                  isLatest
                                    ? 'bg-[#168A45] text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                v{entry.version}
                              </span>

                              {isLatest && (
                                <span className="text-[10px] font-bold text-[#0B5D2A] bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
                                  Current Active
                                </span>
                              )}

                              {isInitial && !isLatest && (
                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Initial Draft
                                </span>
                              )}
                            </div>

                            <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{entry.updatedAt}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <UserIcon className="w-3 h-3 text-slate-400" />
                                <span>{entry.updatedBy}</span>
                              </span>
                            </div>
                          </div>

                          {/* Changes Summary / Notes */}
                          <div className="text-xs text-slate-700 bg-slate-50/80 border border-slate-200/80 rounded-lg p-2.5 mb-2.5">
                            <span className="font-semibold text-slate-800">Change note: </span>
                            <span>{entry.changesSummary || entry.notes || 'Terms re-saved and logged.'}</span>
                          </div>

                          {/* Commercial Snapshot */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-slate-100">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Plan</span>
                              <strong className="text-slate-800">
                                {entry.pricingType || selectedVersionProposal.pricingType}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Students</span>
                              <strong className="text-slate-800">
                                {entry.studentCount ?? selectedVersionProposal.studentCount}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Rate</span>
                              <strong className="text-slate-800">
                                ₹{entry.pricePerStudent ?? selectedVersionProposal.pricePerStudent}/student
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Total Amount</span>
                              <strong className="text-[#0B5D2A]">
                                {formatINR(entry.totalAmount ?? selectedVersionProposal.totalAmount)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#F7FAF8] border-t border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedVersionProposal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg border border-gray-200 transition-colors"
              >
                Close
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedVersionProposal;
                    setSelectedVersionProposal(null);
                    onOpenPreview(target);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-gray-200 rounded-lg transition-colors flex items-center space-x-1.5 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Document</span>
                </button>

                {onEditProposal && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedVersionProposal;
                      setSelectedVersionProposal(null);
                      onEditProposal(target);
                    }}
                    className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-all active:scale-98"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>
                      Edit to Create v{(selectedVersionProposal.version || 1) + 1}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* 3-Stage Payment Status Dashboard Modal */}
      {selectedPaymentProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="overflow-y-auto p-4 sm:p-6 flex-1">
              <ProposalPaymentDashboard
                proposal={selectedPaymentProposal}
                currentUser="Accounts Officer"
                onClose={() => setSelectedPaymentProposal(null)}
                onUpdateProposal={(updated) => {
                  setSelectedPaymentProposal(updated);
                  if (onUpdateProposal) {
                    onUpdateProposal(updated);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
