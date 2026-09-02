import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit2,
  Trash2,
  Send,
  CalendarPlus,
  Eye,
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  FileSpreadsheet,
  Download,
  ShieldAlert,
  BellRing,
  Lock,
  Video,
} from 'lucide-react';
import { Lead, LeadPriority, LeadStatus, User as UserType } from '../types';
import { StatusBadge } from './StatusBadge';
import { hasPermission } from '../utils/rbac';

interface LeadsViewProps {
  leads: Lead[];
  onOpenNewLead: () => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => void;
  onCreateProposal: (lead: Lead) => void;
  onAddFollowUp: (lead: Lead) => void;
  initialStatusFilter?: string;
  users: UserType[];
  currentUser: UserType;
  onExportCsv: () => void;
  onNavigateToImportCsv?: () => void;
  onTriggerFollowUpReminder?: (lead: Lead) => void;
  onOpenGmailForLead?: (lead: Lead) => void;
  onScheduleMeetForLead?: (lead: Lead) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  onOpenNewLead,
  onEditLead,
  onDeleteLead,
  onUpdateStatus,
  onCreateProposal,
  onAddFollowUp,
  initialStatusFilter = 'All',
  users,
  currentUser,
  onExportCsv,
  onNavigateToImportCsv,
  onTriggerFollowUpReminder,
  onOpenGmailForLead,
  onScheduleMeetForLead,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [viewScope, setViewScope] = useState<'all' | 'my'>(
    currentUser.role === 'Salesperson' ? 'my' : 'all'
  );
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Sync viewScope if currentUser changes
  useEffect(() => {
    if (currentUser.role === 'Salesperson') {
      setViewScope('my');
    }
  }, [currentUser]);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  // Status transitions
  const allStatuses: LeadStatus[] = [
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

  // Filtering with RBAC
  const filteredLeads = leads.filter((lead) => {
    // 1. Role Scope Filter
    if (viewScope === 'my' && lead.assignedTo !== currentUser.name) {
      return false;
    }

    // 2. Search
    const matchesSearch =
      lead.instituteName.toLowerCase().includes(search.toLowerCase()) ||
      lead.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      lead.mobile.includes(search) ||
      lead.id.toLowerCase().includes(search.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(search.toLowerCase());

    // 3. Dropdowns
    const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'All' || lead.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'All' || lead.assignedTo === assigneeFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const canDelete = hasPermission.canDeleteLead(currentUser);
  const canExport = hasPermission.canExportData(currentUser);

  return (
    <div className="space-y-5 pb-12">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">
              Institutional Leads Directory
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                currentUser.role === 'Admin'
                  ? 'bg-emerald-50 text-[#0B5D2A] border-emerald-200'
                  : currentUser.role === 'Manager'
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-[#EAF7EF] text-[#168A45] border-[#D9E5DD]'
              }`}
            >
              Role: {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {currentUser.role === 'Salesperson'
              ? `Viewing leads assigned to ${currentUser.name}. Full edit & proposal capabilities for your accounts.`
              : 'Institutional sales pipeline synchronized with Google Sheets & Apps Script database.'}
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Scope Selector: My Leads vs All Leads */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-gray-200 text-xs font-semibold">
            <button
              onClick={() => setViewScope('my')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewScope === 'my'
                  ? 'bg-white text-[#0B5D2A] font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Leads ({leads.filter((l) => l.assignedTo === currentUser.name).length})
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewScope === 'all'
                  ? 'bg-white text-[#0B5D2A] font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Leads ({leads.length})
            </button>
          </div>

          {canExport && (
            <button
              onClick={onExportCsv}
              className="bg-white hover:bg-[#EAF7EF] text-[#0B5D2A] border border-gray-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-[#168A45]" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {onNavigateToImportCsv && (
            <button
              onClick={onNavigateToImportCsv}
              className="bg-white hover:bg-[#EAF7EF] text-slate-700 hover:text-[#0B5D2A] border border-gray-200 px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
              title="Bulk import leads from CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#168A45]" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>
          )}

          <button
            onClick={onOpenNewLead}
            className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Lead</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by institute, person, phone, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F7FAF8] border border-gray-200 text-xs rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45]"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#168A45]"
          >
            <option value="All">All Statuses</option>
            {allStatuses.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          {/* Priority */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#168A45]"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Assignee Filter (Only when viewing all leads) */}
          {viewScope === 'all' && (
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-[#F7FAF8] border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#168A45]"
            >
              <option value="All">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          )}

          {(search || statusFilter !== 'All' || priorityFilter !== 'All' || assigneeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('All');
                setPriorityFilter('All');
                setAssigneeFilter('All');
              }}
              className="text-xs text-[#168A45] hover:text-[#0B5D2A] font-semibold underline px-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Lead ID & Date</th>
                <th className="py-3 px-4">Institute & Contact</th>
                <th className="py-3 px-4 text-center">Students</th>
                <th className="py-3 px-4">Source & Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Follow-up</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No leads found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const isProposalReady = lead.status === 'Send Proposal';
                  const canEditThisLead = hasPermission.canEditLead(currentUser, lead);
                  const canCreateProposalForLead = hasPermission.canCreateProposal(currentUser, lead);

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-[#F7FAF8] transition-colors group cursor-pointer"
                      onClick={() => setSelectedLead(lead)}
                    >
                      {/* ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#0B5D2A]">{lead.id}</div>
                        <div className="text-[11px] text-slate-400">{lead.leadDate}</div>
                      </td>

                      {/* Institute & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-sm text-slate-800 line-clamp-1">
                          {lead.instituteName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                          <span>{lead.contactPerson}</span>
                          <span>•</span>
                          <span>{lead.mobile}</span>
                        </div>
                      </td>

                      {/* Student Count */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="bg-[#F7FAF8] border border-gray-200 px-2.5 py-1 rounded-md font-bold text-slate-800">
                          {lead.studentCount}
                        </span>
                      </td>

                      {/* Source & Assignee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              lead.assignedTo === currentUser.name
                                ? 'bg-[#168A45]'
                                : 'bg-slate-300'
                            }`}
                          ></span>
                          <span
                            className={`font-medium ${
                              lead.assignedTo === currentUser.name
                                ? 'text-[#0B5D2A] font-bold'
                                : 'text-slate-800'
                            }`}
                          >
                            {lead.assignedTo}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">{lead.leadSource}</div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            lead.priority === 'High'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : lead.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-gray-50 text-gray-600 border border-gray-200'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td
                        className="py-3.5 px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center space-x-1">
                          <StatusBadge status={lead.status} />
                          {canEditThisLead && (
                            <select
                              value={lead.status}
                              onChange={(e) => onUpdateStatus(lead.id, e.target.value as LeadStatus)}
                              className="text-[10px] bg-transparent border-0 text-transparent focus:ring-0 cursor-pointer w-4 h-4 -ml-4 opacity-0 hover:opacity-100"
                              title="Quick Change Status"
                            >
                              {allStatuses.map((st) => (
                                <option key={st} value={st} className="text-slate-800">
                                  {st}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>

                      {/* Follow-up */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                        {lead.followUpDate ? (
                          <div className="flex items-center space-x-1.5">
                            <span className="font-medium text-slate-800">{lead.followUpDate}</span>
                            {onTriggerFollowUpReminder && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTriggerFollowUpReminder(lead);
                                }}
                                title="Send Email Reminder for this Follow-up"
                                className="p-1 text-slate-400 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded"
                              >
                                <BellRing className="w-3.5 h-3.5 text-[#168A45]" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="italic text-[11px] text-slate-400">None set</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Gmail button */}
                          {onOpenGmailForLead && (
                            <button
                              onClick={() => onOpenGmailForLead(lead)}
                              title={`Send Email to ${lead.contactPerson} via Gmail`}
                              className="p-1.5 text-slate-400 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded-md transition-colors"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}

                          {/* Google Meet button */}
                          {onScheduleMeetForLead && (
                            <button
                              onClick={() => onScheduleMeetForLead(lead)}
                              title={`Schedule Google Meet Demo for ${lead.instituteName}`}
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            >
                              <Video className="w-4 h-4 text-[#168A45]" />
                            </button>
                          )}

                          {/* Proposal button */}
                          {isProposalReady && canCreateProposalForLead && (
                            <button
                              onClick={() => onCreateProposal(lead)}
                              className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs transition-colors"
                              title="Create Commercial Proposal"
                            >
                              <Send className="w-3 h-3" />
                              <span>Create Proposal</span>
                            </button>
                          )}

                          <button
                            onClick={() => onAddFollowUp(lead)}
                            title="Schedule Follow-up"
                            className="p-1.5 text-slate-400 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded-md transition-colors"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>

                          {canEditThisLead ? (
                            <button
                              onClick={() => onEditLead(lead)}
                              title="Edit Lead"
                              className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              disabled
                              title="Locked (Assigned to another rep)"
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              onClick={() => {
                                if (confirm(`Admin Action: Delete lead "${lead.instituteName}"?`)) {
                                  onDeleteLead(lead.id);
                                }
                              }}
                              title="Delete Lead (Admin Only)"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="bg-[#F7FAF8] border-t border-gray-200 px-4 py-2.5 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Showing {filteredLeads.length} of {leads.length} leads{' '}
            {viewScope === 'my' && `(Filtered to ${currentUser.name})`}
          </span>
          <span className="text-[11px] text-slate-400">
            Enforced Role: <strong className="text-slate-700">{currentUser.role}</strong>
          </span>
        </div>
      </div>

      {/* Lead Detail Drawer / Modal when clicked */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="bg-[#168A45] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                  Lead Profile ({selectedLead.id})
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {selectedLead.instituteName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-slate-500">Current Status:</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedLead.status} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-slate-500">Total Student Strength:</span>
                  <div className="text-base font-bold text-[#0B5D2A]">
                    {selectedLead.studentCount} Students
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-slate-700">
                  <UserIcon className="w-4 h-4 text-[#168A45]" />
                  <span>
                    <strong>Contact:</strong> {selectedLead.contactPerson}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <Phone className="w-4 h-4 text-[#168A45]" />
                  <span>
                    <strong>Phone:</strong> {selectedLead.mobile}
                  </span>
                </div>
                {selectedLead.email && (
                  <div className="flex items-center space-x-2 text-slate-700">
                    <Mail className="w-4 h-4 text-[#168A45]" />
                    <span>
                      <strong>Email:</strong> {selectedLead.email}
                    </span>
                  </div>
                )}
                {selectedLead.address && (
                  <div className="flex items-start space-x-2 text-slate-700">
                    <MapPin className="w-4 h-4 text-[#168A45] mt-0.5" />
                    <span>
                      <strong>Address:</strong> {selectedLead.address}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-2 text-slate-700">
                  <ShieldAlert className="w-4 h-4 text-[#168A45]" />
                  <span>
                    <strong>Assigned Sales Representative:</strong> {selectedLead.assignedTo}
                  </span>
                </div>
              </div>

              {selectedLead.remarks && (
                <div className="bg-[#F7FAF8] p-3 rounded-lg border border-gray-200">
                  <div className="font-bold text-slate-800 mb-1">Remarks / Requirements:</div>
                  <p className="text-slate-600 leading-relaxed">{selectedLead.remarks}</p>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2.5">
                {onOpenGmailForLead && (
                  <button
                    onClick={() => {
                      const l = selectedLead;
                      setSelectedLead(null);
                      onOpenGmailForLead(l);
                    }}
                    className="px-3.5 py-1.5 border border-emerald-200 text-[#0B5D2A] bg-[#EAF7EF] hover:bg-emerald-100 rounded-lg font-bold flex items-center space-x-1.5"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send Email</span>
                  </button>
                )}

                {onScheduleMeetForLead && (
                  <button
                    onClick={() => {
                      const l = selectedLead;
                      setSelectedLead(null);
                      onScheduleMeetForLead(l);
                    }}
                    className="px-3.5 py-1.5 border border-emerald-300 text-[#0B5D2A] bg-white hover:bg-emerald-50 rounded-lg font-bold flex items-center space-x-1.5"
                  >
                    <Video className="w-3.5 h-3.5 text-[#168A45]" />
                    <span>Google Meet</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const l = selectedLead;
                    setSelectedLead(null);
                    onAddFollowUp(l);
                  }}
                  className="px-3.5 py-1.5 border border-gray-200 text-slate-700 hover:bg-[#F7FAF8] rounded-lg font-semibold"
                >
                  Log Follow-up
                </button>

                {hasPermission.canCreateProposal(currentUser, selectedLead) && (
                  <button
                    onClick={() => {
                      const l = selectedLead;
                      setSelectedLead(null);
                      onCreateProposal(l);
                    }}
                    className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg font-bold shadow-xs flex items-center space-x-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Create Proposal</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
