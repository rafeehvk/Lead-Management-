import React, { useState, useMemo } from 'react';
import {
  FileText,
  AlertOctagon,
  AlertTriangle,
  FileClock,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  Bell,
  History,
  ChevronRight,
  ShieldCheck,
  Paperclip,
} from 'lucide-react';
import { ExpiryDocument, DocumentStatus, calculateDaysRemaining } from '../../types/documentExpiry';
import { documentExpiryStorage } from '../../services/documentExpiryStorage';

interface DocumentExpirySectionProps {
  documents: ExpiryDocument[];
  onOpenRenewModal: (doc: ExpiryDocument) => void;
  onOpenDetailsModal: (doc: ExpiryDocument) => void;
  onNavigateToDocumentRegistry: () => void;
}

export const DocumentExpirySection: React.FC<DocumentExpirySectionProps> = ({
  documents,
  onOpenRenewModal,
  onOpenDetailsModal,
  onNavigateToDocumentRegistry,
}) => {
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const today = new Date();

  // Metrics
  const metrics = useMemo(() => {
    let expired = 0;
    let exp7d = 0;
    let exp30d = 0;
    let exp60d = 0;
    let exp90d = 0;
    let valid = 0;
    let renewalPending = 0;

    documents.forEach((doc) => {
      const days = calculateDaysRemaining(doc.expiryDate);
      if (days < 0) {
        expired += 1;
        renewalPending += 1;
      } else if (days <= 7) {
        exp7d += 1;
        renewalPending += 1;
      } else if (days <= 30) {
        exp30d += 1;
      } else if (days <= 60) {
        exp60d += 1;
      } else if (days <= 90) {
        exp90d += 1;
      } else {
        valid += 1;
      }
    });

    return {
      total: documents.length,
      expired,
      exp7d,
      exp30d,
      exp60d,
      exp90d,
      valid,
      renewalPending,
    };
  }, [documents]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.department) set.add(d.department);
    });
    return Array.from(set).sort();
  }, [documents]);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const days = calculateDaysRemaining(doc.expiryDate);

      // Urgency filter
      if (urgencyFilter === 'expired' && days >= 0) return false;
      if (urgencyFilter === '7d' && (days < 0 || days > 7)) return false;
      if (urgencyFilter === '30d' && (days < 0 || days > 30)) return false;
      if (urgencyFilter === '60d' && (days < 0 || days > 60)) return false;
      if (urgencyFilter === '90d' && (days < 0 || days > 90)) return false;
      if (urgencyFilter === 'valid' && days <= 90) return false;

      // Department filter
      if (departmentFilter !== 'all' && doc.department !== departmentFilter) return false;

      // Search
      if (search.trim()) {
        const query = search.toLowerCase();
        const match =
          doc.documentName.toLowerCase().includes(query) ||
          doc.referenceNumber.toLowerCase().includes(query) ||
          doc.relatedParty.toLowerCase().includes(query) ||
          doc.documentTypeName.toLowerCase().includes(query);
        if (!match) return false;
      }

      return true;
    });
  }, [documents, urgencyFilter, departmentFilter, search]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 md:p-6 mb-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
            <FileClock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                Module 3: Document Expiry & Legal Compliance
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {documents.length} Managed Records
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict multi-tier expiry monitoring, critical risk exposure, automated renewal ledgers, and compliance audit registry.
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToDocumentRegistry}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#EAF7EF] hover:bg-[#D9E5DD] text-[#0B5D2A] text-xs font-bold transition-all cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <span>Open Full Document Registry</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Status Cards & Priority Levels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-6">
        {/* Total */}
        <button
          onClick={() => setUrgencyFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            urgencyFilter === 'all'
              ? 'border-slate-800 bg-slate-100 shadow-2xs'
              : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
          }`}
        >
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</div>
          <div className="text-xl font-black text-slate-900 mt-0.5">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">All Registry</div>
        </button>

        {/* Valid */}
        <button
          onClick={() => setUrgencyFilter('valid')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            urgencyFilter === 'valid'
              ? 'border-emerald-600 bg-emerald-100 shadow-2xs'
              : 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60'
          }`}
        >
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Valid</div>
          <div className="text-xl font-black text-emerald-950 mt-0.5">{metrics.valid}</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">&gt; 90 Days</div>
        </button>

        {/* 7 Days (High Priority 🟠) */}
        <button
          onClick={() => setUrgencyFilter('7d')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            urgencyFilter === '7d'
              ? 'border-amber-600 bg-amber-100 shadow-2xs'
              : 'border-amber-300 bg-amber-50 hover:bg-amber-100'
          }`}
        >
          <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">≤ 7 Days</div>
          <div className="text-xl font-black text-amber-950 mt-0.5">{metrics.exp7d}</div>
          <div className="text-[10px] font-bold text-amber-700 mt-0.5">🟠 High Priority</div>
        </button>

        {/* 30 Days (Medium 🟡) */}
        <button
          onClick={() => setUrgencyFilter('30d')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            urgencyFilter === '30d'
              ? 'border-yellow-600 bg-yellow-100 shadow-2xs'
              : 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
          }`}
        >
          <div className="text-[10px] font-bold text-yellow-900 uppercase tracking-wider">≤ 30 Days</div>
          <div className="text-xl font-black text-yellow-950 mt-0.5">{metrics.exp30d}</div>
          <div className="text-[10px] font-bold text-yellow-700 mt-0.5">🟡 Medium</div>
        </button>

        {/* 60 Days */}
        <button
          onClick={() => setUrgencyFilter('60d')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            urgencyFilter === '60d'
              ? 'border-sky-600 bg-sky-100 shadow-2xs'
              : 'border-sky-200 bg-sky-50 hover:bg-sky-100'
          }`}
        >
          <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">≤ 60 Days</div>
          <div className="text-xl font-black text-sky-950 mt-0.5">{metrics.exp60d}</div>
          <div className="text-[10px] text-sky-700 mt-0.5">Mid-Range</div>
        </button>

        {/* 90 Days (Upcoming 🔵) */}
        <button
          onClick={() => setUrgencyFilter('90d')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            urgencyFilter === '90d'
              ? 'border-blue-600 bg-blue-100 shadow-2xs'
              : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
          }`}
        >
          <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">≤ 90 Days</div>
          <div className="text-xl font-black text-blue-950 mt-0.5">{metrics.exp90d}</div>
          <div className="text-[10px] font-bold text-blue-700 mt-0.5">🔵 Upcoming</div>
        </button>

        {/* Expired (Critical 🔴) */}
        <button
          onClick={() => setUrgencyFilter('expired')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            urgencyFilter === 'expired'
              ? 'border-red-600 bg-red-100 shadow-2xs'
              : 'border-red-300 bg-red-50 hover:bg-red-100'
          }`}
        >
          <div className="text-[10px] font-bold text-red-900 uppercase tracking-wider">Expired</div>
          <div className="text-xl font-black text-red-950 mt-0.5">{metrics.expired}</div>
          <div className="text-[10px] font-bold text-red-700 mt-0.5">🔴 Critical</div>
        </button>

        {/* Renewal Pending */}
        <div className="p-3 rounded-xl border border-purple-200 bg-purple-50 text-left">
          <div className="text-[10px] font-bold text-purple-800 uppercase tracking-wider">Renewal Due</div>
          <div className="text-xl font-black text-purple-950 mt-0.5">{metrics.renewalPending}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">Needs Action</div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center space-x-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search document name, entity, or reference no..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-[#168A45]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {urgencyFilter !== 'all' && (
            <button
              onClick={() => setUrgencyFilter('all')}
              className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* 3. Comprehensive Expiry Monitoring Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <th className="px-3 py-2.5">Entity / Name</th>
              <th className="px-3 py-2.5">Department</th>
              <th className="px-3 py-2.5">Document Type</th>
              <th className="px-3 py-2.5">Ref / Number</th>
              <th className="px-3 py-2.5">Expiry Date</th>
              <th className="px-3 py-2.5 text-center">Days Remaining</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-2.5 py-2.5 text-center">File</th>
              <th className="px-3 py-2.5">Responsible</th>
              <th className="px-3.5 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredDocuments.slice(0, 8).map((doc) => {
              const days = calculateDaysRemaining(doc.expiryDate);
              const isExpired = days < 0;
              const isExp7d = days >= 0 && days <= 7;
              const isExp30d = days > 7 && days <= 30;

              let badgeStyle = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              let badgeText = `${days} Days Left`;

              if (isExpired) {
                badgeStyle = 'bg-red-600 text-white font-black';
                badgeText = `Expired ${Math.abs(days)}d ago`;
              } else if (days === 0) {
                badgeStyle = 'bg-orange-600 text-white font-black animate-pulse';
                badgeText = 'Expires Today';
              } else if (isExp7d) {
                badgeStyle = 'bg-amber-500 text-white font-extrabold';
                badgeText = `${days}d Left (Urgent)`;
              } else if (isExp30d) {
                badgeStyle = 'bg-yellow-100 text-yellow-900 border-yellow-300 font-bold';
                badgeText = `${days}d Left`;
              }

              return (
                <tr
                  key={doc.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isExpired ? 'bg-red-50/20' : isExp7d ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <td className="px-3 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                    {doc.relatedParty}
                    <span className="block text-[10px] font-normal text-slate-500 truncate max-w-[150px]">
                      {doc.documentName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{doc.department}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold whitespace-nowrap">
                      {doc.documentTypeName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">
                    {doc.referenceNumber}
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-slate-800 whitespace-nowrap">
                    {doc.expiryDate}
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${badgeStyle}`}>
                      {badgeText}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        doc.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : doc.status === 'Expiring'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-2.5 py-2.5 text-center">
                    {doc.attachmentUrl ? (
                      <a
                        href={doc.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:text-emerald-900 inline-block"
                        title={doc.attachmentName || 'Attachment'}
                      >
                        <Paperclip className="w-3.5 h-3.5 mx-auto" />
                      </a>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-[11px] whitespace-nowrap">
                    {doc.responsiblePerson}
                  </td>
                  <td className="px-3.5 py-2.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => onOpenDetailsModal(doc)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                        title="View Document Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenRenewModal(doc)}
                        className="px-2 py-1 rounded bg-[#168A45] hover:bg-[#0B5D2A] text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                        title="Renew Document"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Renew</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {filteredDocuments.length} of {documents.length} registered documents
        </span>
        <button
          onClick={onNavigateToDocumentRegistry}
          className="font-bold text-[#0B5D2A] hover:text-[#168A45] flex items-center space-x-1 cursor-pointer"
        >
          <span>View All in Full Registry</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
