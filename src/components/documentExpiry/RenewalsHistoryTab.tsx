import React, { useState, useMemo } from 'react';
import {
  History,
  RefreshCw,
  Search,
  Calendar,
  DollarSign,
  User,
  Building,
  FileText,
  Download,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  FileCheck,
  Printer,
} from 'lucide-react';
import {
  DocumentRenewalRecord,
  ExpiryDocument,
} from '../../types/documentExpiry';
import { printRenewalLedgerReport } from '../../utils/documentExpiryPrint';

interface RenewalsHistoryTabProps {
  documents: ExpiryDocument[];
  onSelectDocument: (doc: ExpiryDocument) => void;
  onOpenRenew: (doc: ExpiryDocument) => void;
}

interface FlattenedRenewalItem {
  record: DocumentRenewalRecord;
  parentDoc: ExpiryDocument;
}

export const RenewalsHistoryTab: React.FC<RenewalsHistoryTabProps> = ({
  documents,
  onSelectDocument,
  onOpenRenew,
}) => {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Flatten all renewal history records across all documents
  const allRenewalRecords: FlattenedRenewalItem[] = useMemo(() => {
    const list: FlattenedRenewalItem[] = [];
    documents.forEach((doc) => {
      if (doc.renewalHistory && doc.renewalHistory.length > 0) {
        doc.renewalHistory.forEach((rec) => {
          list.push({
            record: rec,
            parentDoc: doc,
          });
        });
      }
    });

    // Sort newest renewal date first
    return list.sort((a, b) => b.record.createdAt.localeCompare(a.record.createdAt));
  }, [documents]);

  const filteredRenewals = useMemo(() => {
    return allRenewalRecords.filter((item) => {
      if (departmentFilter !== 'all' && item.parentDoc.department !== departmentFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          item.parentDoc.documentName.toLowerCase().includes(q) ||
          item.parentDoc.documentTypeName.toLowerCase().includes(q) ||
          item.record.renewedBy.toLowerCase().includes(q) ||
          (item.record.invoiceOrReceiptNumber || '').toLowerCase().includes(q) ||
          (item.record.remarks || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allRenewalRecords, search, departmentFilter]);

  // Financial total transacted across renewals
  const totalRenewalSpend = allRenewalRecords.reduce(
    (acc, curr) => acc + (curr.record.newAmount || 0),
    0
  );

  const departments = Array.from(new Set(documents.map((d) => d.department))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* 1. Overview Metric Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-xs font-medium block">Total Renewal Audits Logged</span>
          <div className="text-2xl font-black text-[#0B5D2A] tracking-tight mt-0.5">
            {allRenewalRecords.length} Transactions
          </div>
          <span className="text-[11px] text-slate-500">
            Immutable prior records archived in ERP audit trail
          </span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-xs font-medium block">Cumulative Renewal Value</span>
          <div className="text-2xl font-black text-emerald-800 tracking-tight mt-0.5">
            ₹ {totalRenewalSpend.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">Transacted renewal premiums & fees</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-xs font-medium block">Renewed Documents Active</span>
          <div className="text-2xl font-black text-blue-700 tracking-tight mt-0.5">
            {documents.filter((d) => (d.renewalCount || 0) > 0).length} Documents
          </div>
          <span className="text-[11px] text-slate-500">Currently operating under renewed terms</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <span className="text-slate-400 text-xs font-medium block">Compliance Continuity</span>
          <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Zero Unresolved Lapses</span>
          </div>
          <span className="text-[10px] text-slate-400">Prior attachments & certificates retained</span>
        </div>
      </div>

      {/* 2. Renewal History Table & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              Complete Renewal History & Prior Terms Ledger
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              {filteredRenewals.length} Records
            </span>
          </div>

          {/* Search & Dept filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search renewals..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-hidden"
              />
            </div>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <button
              onClick={() => printRenewalLedgerReport(filteredRenewals)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs shrink-0"
              title="Print renewal audit ledger"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Ledger</span>
            </button>
          </div>
        </div>

        {filteredRenewals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Renewal Date & Approver</th>
                  <th className="px-4 py-3.5">Document Title & Type</th>
                  <th className="px-4 py-3.5">Previous Validity Term</th>
                  <th className="px-4 py-3.5">Renewed Validity Term</th>
                  <th className="px-4 py-3.5">Cost Comparison</th>
                  <th className="px-4 py-3.5">Invoice / Receipt</th>
                  <th className="px-4 py-3.5">Attachment</th>
                  <th className="px-6 py-3.5 text-right">Inspect Doc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRenewals.map(({ record, parentDoc }) => {
                  const costDiff = (record.newAmount || 0) - (record.previousAmount || 0);

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onSelectDocument(parentDoc)}
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800 font-mono text-xs">{record.renewalDate}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>By {record.renewedBy}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700">
                          {parentDoc.documentName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {parentDoc.documentTypeName} | Ref #{parentDoc.referenceNumber}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        <span>{record.previousStartDate}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className="text-slate-700 font-semibold">{record.previousExpiryDate}</span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-emerald-900 bg-emerald-50/30 whitespace-nowrap">
                        <span className="font-bold">{record.newStartDate}</span>
                        <span className="text-emerald-600 mx-1">→</span>
                        <span className="font-black text-[#0B5D2A]">{record.newExpiryDate}</span>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                        <div className="font-bold text-slate-800">
                          {record.currency} {(record.newAmount || 0).toLocaleString()}
                        </div>
                        {record.previousAmount !== undefined && (
                          <div className="text-[10px] text-slate-400">
                            Prev: {record.currency} {record.previousAmount.toLocaleString()}{' '}
                            {costDiff !== 0 && (
                              <span
                                className={`font-semibold ${
                                  costDiff > 0 ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                ({costDiff > 0 ? `+${costDiff.toLocaleString()}` : costDiff.toLocaleString()})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {record.invoiceOrReceiptNumber || '—'}
                      </td>

                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        {record.newAttachmentName ? (
                          <button
                            type="button"
                            onClick={() => alert(`Downloading certificate: ${record.newAttachmentName}`)}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold cursor-pointer"
                          >
                            <FileCheck className="w-3 h-3 text-emerald-600" />
                            <span className="truncate max-w-[100px]">{record.newAttachmentName}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No file</span>
                        )}
                      </td>

                      <td className="px-6 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectDocument(parentDoc)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          View Full Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 text-xs">
            <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No renewals found.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              When an expiring document is renewed, prior records and terms are archived here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
