import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Download,
  AlertCircle,
  Building,
  User,
  Calendar,
  LayoutGrid,
  List,
  ChevronDown,
  X,
  FileText,
  DollarSign,
  Clock,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import {
  CustomDocumentType,
  ExpiryDocument,
  calculateDaysRemaining,
  getUrgencyLevel,
  getUrgencyBadge,
  DocumentStatus,
  UrgencyLevel,
} from '../../types/documentExpiry';
import { printRegistryReport } from '../../utils/documentExpiryPrint';

interface DocumentsRegistryTabProps {
  documents: ExpiryDocument[];
  documentTypes: CustomDocumentType[];
  onSelectDocument: (doc: ExpiryDocument) => void;
  onOpenRenew: (doc: ExpiryDocument) => void;
  onOpenEdit: (doc: ExpiryDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onOpenNewDocument: () => void;
  initialUrgencyFilter?: string;
}

export const DocumentsRegistryTab: React.FC<DocumentsRegistryTabProps> = ({
  documents,
  documentTypes,
  onSelectDocument,
  onOpenRenew,
  onOpenEdit,
  onDeleteDocument,
  onOpenNewDocument,
  initialUrgencyFilter,
}) => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedPerson, setSelectedPerson] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>(initialUrgencyFilter || 'all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'expiry_asc' | 'expiry_desc' | 'name' | 'amount'>('expiry_asc');

  // Extract unique filter dropdown values
  const departments = useMemo(() => {
    return Array.from(new Set(documents.map((d) => d.department))).filter(Boolean).sort();
  }, [documents]);

  const responsiblePeople = useMemo(() => {
    return Array.from(new Set(documents.map((d) => d.responsiblePerson))).filter(Boolean).sort();
  }, [documents]);

  // Multi-Filter computation
  const filteredDocuments = useMemo(() => {
    return documents
      .filter((doc) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = doc.documentName.toLowerCase().includes(q);
          const matchRef = doc.referenceNumber.toLowerCase().includes(q);
          const matchParty = doc.relatedParty.toLowerCase().includes(q);
          const matchPerson = doc.responsiblePerson.toLowerCase().includes(q);
          const matchType = doc.documentTypeName.toLowerCase().includes(q);
          if (!matchTitle && !matchRef && !matchParty && !matchPerson && !matchType) {
            return false;
          }
        }

        // Document Type
        if (selectedType !== 'all') {
          if (doc.documentTypeId !== selectedType && doc.documentTypeName !== selectedType) {
            return false;
          }
        }

        // Department
        if (selectedDept !== 'all' && doc.department !== selectedDept) {
          return false;
        }

        // Responsible Person
        if (selectedPerson !== 'all' && doc.responsiblePerson !== selectedPerson) {
          return false;
        }

        // Status
        if (selectedStatus !== 'all' && doc.status !== selectedStatus) {
          return false;
        }

        // Urgency
        if (selectedUrgency !== 'all') {
          const urgency = getUrgencyLevel(doc);
          if (urgency !== selectedUrgency) {
            return false;
          }
        }

        // Date Range on Expiry Date
        if (dateFrom && doc.expiryDate < dateFrom) {
          return false;
        }
        if (dateTo && doc.expiryDate > dateTo) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') {
          return a.expiryDate.localeCompare(b.expiryDate);
        }
        if (sortBy === 'expiry_desc') {
          return b.expiryDate.localeCompare(a.expiryDate);
        }
        if (sortBy === 'name') {
          return a.documentName.localeCompare(b.documentName);
        }
        if (sortBy === 'amount') {
          return (b.amount || 0) - (a.amount || 0);
        }
        return 0;
      });
  }, [
    documents,
    search,
    selectedType,
    selectedDept,
    selectedPerson,
    selectedStatus,
    selectedUrgency,
    dateFrom,
    dateTo,
    sortBy,
  ]);

  const hasActiveFilters =
    search.trim() !== '' ||
    selectedType !== 'all' ||
    selectedDept !== 'all' ||
    selectedPerson !== 'all' ||
    selectedStatus !== 'all' ||
    selectedUrgency !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearFilters = () => {
    setSearch('');
    setSelectedType('all');
    setSelectedDept('all');
    setSelectedPerson('all');
    setSelectedStatus('all');
    setSelectedUrgency('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleExportCsv = () => {
    const headers = [
      'Document Name',
      'Document Type',
      'Reference Number',
      'Related Party',
      'Start Date',
      'Expiry Date',
      'Days Remaining',
      'Status',
      'Amount',
      'Currency',
      'Department',
      'Responsible Person',
      'Remarks',
    ];

    const rows = filteredDocuments.map((d) => [
      `"${d.documentName.replace(/"/g, '""')}"`,
      `"${d.documentTypeName}"`,
      `"${d.referenceNumber}"`,
      `"${d.relatedParty}"`,
      d.startDate,
      d.expiryDate,
      calculateDaysRemaining(d.expiryDate),
      d.status,
      d.amount || 0,
      d.currency || 'INR',
      `"${d.department}"`,
      `"${d.responsiblePerson}"`,
      `"${(d.remarks || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `MYSAR_Expiry_Documents_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Search, Actions & Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ref #, supplier, or person..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => printRegistryReport(filteredDocuments, {
                filterDescription: `Department: ${selectedDept}, Type: ${selectedType}, Status: ${selectedStatus}`
              })}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center space-x-1.5 cursor-pointer shadow-2xs"
              title="Print documents registry report"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>

            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white shadow-2xs text-[#168A45]' : 'text-slate-500'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white shadow-2xs text-[#168A45]' : 'text-slate-500'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenNewDocument}
              className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Register Document</span>
            </button>
          </div>
        </div>

        {/* Filters Row: Type | Department | Responsible Person | Status | Urgency | Date Range */}
        <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          {/* Filter: Document Type */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Document Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All Types</option>
              {documentTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Department */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Responsible Person */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Responsible Person</label>
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All People</option>
              {responsiblePeople.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Expiring">Expiring</option>
              <option value="Expired">Expired</option>
              <option value="Renewed">Renewed</option>
            </select>
          </div>

          {/* Filter: Urgency */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Urgency</label>
            <select
              value={selectedUrgency}
              onChange={(e) => setSelectedUrgency(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="all">All Urgencies</option>
              <option value="expired">🔴 Expired</option>
              <option value="expiring_today">🟠 Expiring Today</option>
              <option value="expiring_7d">🟡 Within 7 Days</option>
              <option value="expiring_30d">🟡 Within 30 Days</option>
              <option value="expiring_90d">🔵 Within 90 Days</option>
              <option value="renewed">🟢 Renewed</option>
              <option value="active">🟢 Active (&gt; 90d)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-hidden"
            >
              <option value="expiry_asc">Expiry (Earliest First)</option>
              <option value="expiry_desc">Expiry (Latest First)</option>
              <option value="name">Document Name</option>
              <option value="amount">Amount (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Date Range & Clear filter status line */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-semibold text-slate-600">Expiry Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-[11px] font-mono outline-hidden"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-md text-[11px] font-mono outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-3">
            <span>
              Showing <strong>{filteredDocuments.length}</strong> of {documents.length} documents
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Table View OR Grid View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {filteredDocuments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Document Title & Ref</th>
                    <th className="px-4 py-3.5">Type</th>
                    <th className="px-4 py-3.5">Related Party</th>
                    <th className="px-4 py-3.5">Validity Dates</th>
                    <th className="px-4 py-3.5">Urgency</th>
                    <th className="px-4 py-3.5">Amount</th>
                    <th className="px-4 py-3.5">Responsible</th>
                    <th className="px-4 py-3.5">Dept</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredDocuments.map((doc) => {
                    const days = calculateDaysRemaining(doc.expiryDate);
                    const urgency = getUrgencyLevel(doc);
                    const badge = getUrgencyBadge(urgency, days);

                    return (
                      <tr
                        key={doc.id}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => onSelectDocument(doc)}
                      >
                        <td className="px-6 py-3.5 max-w-xs">
                          <div className="font-bold text-slate-800 truncate group-hover:text-emerald-700 text-xs">
                            {doc.documentName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: #{doc.referenceNumber}
                            {doc.attachmentName && (
                              <span className="ml-2 text-emerald-700 font-sans">📎 Attached</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {doc.documentTypeName}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-slate-600 max-w-[140px] truncate">
                          <div className="truncate font-semibold text-slate-700">{doc.relatedParty}</div>
                          <div className="text-[10px] text-slate-400">{doc.relatedPartyType}</div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px]">
                          <span className="text-slate-400 block text-[10px]">{doc.startDate} to</span>
                          <span className={`font-bold ${urgency === 'expired' ? 'text-red-600' : 'text-slate-800'}`}>
                            {doc.expiryDate}
                          </span>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`}></span>
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3.5 font-bold text-slate-800 font-mono">
                          {doc.currency || 'INR'} {(doc.amount || 0).toLocaleString()}
                        </td>

                        <td className="px-4 py-3.5 text-slate-600">
                          <div className="flex items-center space-x-1.5">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[100px]">{doc.responsiblePerson}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                            {doc.department}
                          </span>
                        </td>

                        <td
                          className="px-6 py-3.5 text-right space-x-1.5 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onOpenRenew(doc)}
                            className="p-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg transition-colors cursor-pointer shadow-2xs"
                            title="Renew Document"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenEdit(doc)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Document"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete '${doc.documentName}'?`)) {
                                onDeleteDocument(doc.id);
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-slate-700">No documents found matching the filter criteria.</p>
              <p className="text-[11px] text-slate-400 mt-1">Try broadening your search or resetting filters.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const days = calculateDaysRemaining(doc.expiryDate);
            const urgency = getUrgencyLevel(doc);
            const badge = getUrgencyBadge(urgency, days);

            return (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate">
                      {doc.documentTypeName}
                    </span>
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`}></span>
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-800 group-hover:text-emerald-700 line-clamp-1">
                    {doc.documentName}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-mono mb-3">Ref: #{doc.referenceNumber}</div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100 mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Related Party:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[140px]">
                        {doc.relatedParty}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-semibold text-slate-700">{doc.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Responsible:</span>
                      <span className="font-semibold text-slate-700">{doc.responsiblePerson}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-slate-200/60 font-mono">
                      <span className="text-slate-400">Expires:</span>
                      <span className={`font-bold ${urgency === 'expired' ? 'text-red-600' : 'text-slate-800'}`}>
                        {doc.expiryDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <div className="text-xs font-black text-slate-800">
                    {doc.currency || 'INR'} {(doc.amount || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenRenew(doc)}
                      className="px-2.5 py-1 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Renew</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenEdit(doc)}
                      className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
