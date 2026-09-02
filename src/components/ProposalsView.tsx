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
} from 'lucide-react';
import { Proposal, ProposalStatus, Settings } from '../types';
import { generatePdfFromElement, formatINR } from '../utils/pdfGenerator';
import { PrintableProposalDocument } from './PrintableProposalDocument';

interface ProposalsViewProps {
  proposals: Proposal[];
  settings?: Settings;
  onOpenPreview: (proposal: Proposal) => void;
  onDeleteProposal: (id: string) => void;
  onUpdateStatus: (id: string, status: ProposalStatus) => void;
  onExportCsv: () => void;
  onOpenNewProposalPrompt: () => void;
  onEmailProposal?: (proposal: Proposal) => void;
}

export const ProposalsView: React.FC<ProposalsViewProps> = ({
  proposals,
  settings,
  onOpenPreview,
  onDeleteProposal,
  onUpdateStatus,
  onExportCsv,
  onOpenNewProposalPrompt,
  onEmailProposal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingProposal, setDownloadingProposal] = useState<Proposal | null>(null);
  const [downloadToast, setDownloadToast] = useState<string | null>(null);

  const statuses: ProposalStatus[] = ['Draft', 'Sent', 'Approved', 'Rejected', 'Negotiating'];

  const handleDirectDownloadPdf = async (proposal: Proposal) => {
    setDownloadingId(proposal.id);
    setDownloadingProposal(proposal);
    setDownloadToast(`Generating PDF for ${proposal.proposalNumber}...`);

    // Allow the DOM element to mount cleanly
    setTimeout(async () => {
      try {
        const sanitizedName = (proposal.instituteName || 'Proposal').replace(/[^a-zA-Z0-9]/g, '_');
        await generatePdfFromElement(
          'mysar-proposal-direct-download-container',
          `MYSAR_Proposal_${proposal.proposalNumber.replace(/\//g, '_')}_${sanitizedName}`
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

  const filtered = proposals.filter((p) => {
    const matchesSearch =
      p.instituteName.toLowerCase().includes(search.toLowerCase()) ||
      p.proposalNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'All' || p.proposalStatus === statusFilter;
    return matchesSearch && matchesStatus;
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
            Dynamic MYSAR institutional proposals, automated price calculations, and PDF generator
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={onExportCsv}
            className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#168A45]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewProposalPrompt}
            className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Create Proposal</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search proposal #, institute, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAF8] border border-gray-200 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45]"
          />
        </div>

        <div className="flex items-center space-x-2">
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
        </div>
      </div>

      {/* Proposals Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5 w-1/4">Proposal Number & Date</th>
                <th className="py-3.5 px-5 w-2/5">Institute & Contact</th>
                <th className="py-3.5 px-5 w-36 text-center">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400">
                    No proposals generated yet. Click "Create Proposal" from any Lead!
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-[#F7FAF8] transition-colors group cursor-pointer"
                    onClick={() => onOpenPreview(p)}
                  >
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="font-bold text-sm text-[#0B5D2A]">{p.proposalNumber}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.proposalDate}</div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-sm text-slate-800 line-clamp-1">
                        {p.instituteName}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.contactPerson}
                      </div>
                    </td>

                    <td
                      className="py-4 px-5 text-center whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={p.proposalStatus}
                        onChange={(e) => onUpdateStatus(p.id, e.target.value as ProposalStatus)}
                        className={`text-xs font-bold px-3 py-1 rounded-full border cursor-pointer focus:outline-none ${getStatusBadge(
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

                    <td
                      className="py-4 px-5 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end space-x-2">
                        {onEmailProposal && (
                          <button
                            onClick={() => onEmailProposal(p)}
                            title="Email Proposal via Gmail"
                            className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-emerald-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-2xs transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5 text-[#168A45]" />
                            <span className="hidden sm:inline">Email</span>
                          </button>
                        )}

                        <button
                          onClick={() => onOpenPreview(p)}
                          title="View Proposal"
                          className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>View</span>
                        </button>

                        <button
                          onClick={() => handleDirectDownloadPdf(p)}
                          disabled={downloadingId === p.id}
                          title="Download Proposal PDF"
                          aria-label="Download Proposal PDF"
                          className="p-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
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
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-[#F7FAF8] border-t border-gray-200 px-4 py-2.5 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filtered.length} of {proposals.length} proposals</span>
          <span className="text-[11px] text-slate-400">Dynamic template engine active</span>
        </div>
      </div>

      {/* Download Status Toast Notification */}
      {downloadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 border border-slate-700">
          <Loader2 className="w-4 h-4 text-[#168A45] animate-spin" />
          <span>{downloadToast}</span>
        </div>
      )}

      {/* Off-screen document container for direct 1-click PDF download (using opacity to guarantee canvas geometry) */}
      {downloadingProposal && (
        <div
          id="mysar-proposal-direct-download-wrapper"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '880px',
            zIndex: -9999,
            opacity: 0.01,
            pointerEvents: 'none',
          }}
        >
          <PrintableProposalDocument
            proposal={downloadingProposal}
            settings={settings}
            id="mysar-proposal-direct-download-container"
          />
        </div>
      )}
    </div>
  );
};
