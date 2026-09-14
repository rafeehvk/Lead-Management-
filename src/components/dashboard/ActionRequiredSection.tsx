import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
  CheckCircle2,
  XCircle,
  FileText,
  CalendarClock,
  ExternalLink,
  UserX,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Lead, FollowUp } from '../../types';
import { LeaveRequest, StaffMember } from '../../types/hr';
import { ExpiryDocument } from '../../types/documentExpiry';

interface ActionRequiredProps {
  overdueFollowUps: Array<{ followUp: FollowUp; lead?: Lead }>;
  todayFollowUps: Array<{ followUp: FollowUp; lead?: Lead }>;
  unassignedLeads: Lead[];
  pendingLeaveRequests: LeaveRequest[];
  unmarkedAttendanceStaff: StaffMember[];
  expiredDocuments: ExpiryDocument[];
  expiring7dDocuments: ExpiryDocument[];
  onApproveLeave: (leaveId: string) => void;
  onRejectLeave: (leaveId: string) => void;
  onOpenRenewModal: (doc: ExpiryDocument) => void;
  onOpenDocumentDetails: (doc: ExpiryDocument) => void;
  onNavigateToLead: (leadId: string) => void;
  onNavigateToStaff: (staffId: string) => void;
  onNavigateToAttendance: () => void;
}

export const ActionRequiredSection: React.FC<ActionRequiredProps> = ({
  overdueFollowUps,
  todayFollowUps,
  unassignedLeads,
  pendingLeaveRequests,
  unmarkedAttendanceStaff,
  expiredDocuments,
  expiring7dDocuments,
  onApproveLeave,
  onRejectLeave,
  onOpenRenewModal,
  onOpenDocumentDetails,
  onNavigateToLead,
  onNavigateToStaff,
  onNavigateToAttendance,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'leads' | 'hr' | 'documents'>('all');

  const totalUrgentCount =
    overdueFollowUps.length +
    todayFollowUps.length +
    unassignedLeads.length +
    pendingLeaveRequests.length +
    unmarkedAttendanceStaff.length +
    expiredDocuments.length +
    expiring7dDocuments.length;

  return (
    <div className="bg-white rounded-2xl border-2 border-red-200/90 shadow-sm p-4 md:p-6 mb-8 relative overflow-hidden">
      {/* Top Banner Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-700">
            <AlertOctagon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
                ACTION REQUIRED: Executive Management Command Center
              </h2>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-red-600 text-white shadow-2xs">
                {totalUrgentCount} Urgent Items
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated real-time operational bottlenecks across Sales Leads, HR Operations, and Document Compliance.
            </p>
          </div>
        </div>

        {/* Subtab Filter */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Items ({totalUrgentCount})
          </button>
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'leads'
                ? 'bg-white text-blue-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leads ({overdueFollowUps.length + todayFollowUps.length + unassignedLeads.length})
          </button>
          <button
            onClick={() => setActiveSubTab('hr')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'hr'
                ? 'bg-white text-emerald-800 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            HR ({pendingLeaveRequests.length + unmarkedAttendanceStaff.length})
          </button>
          <button
            onClick={() => setActiveSubTab('documents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'documents'
                ? 'bg-white text-red-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Documents ({expiredDocuments.length + expiring7dDocuments.length})
          </button>
        </div>
      </div>

      {/* 3 Unified Action Grid Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Lead Actions */}
        {(activeSubTab === 'all' || activeSubTab === 'leads') && (
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <CalendarClock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Lead & Pipeline Actions
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {overdueFollowUps.length + todayFollowUps.length + unassignedLeads.length} Items
              </span>
            </div>

            {/* Overdue Follow-ups */}
            {overdueFollowUps.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Overdue Follow-ups ({overdueFollowUps.length})</span>
                </div>
                {overdueFollowUps.slice(0, 3).map(({ followUp, lead }) => (
                  <div
                    key={followUp.id}
                    className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs flex flex-col justify-between space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="font-bold text-red-950">
                          {lead?.instituteName || followUp.leadId}
                        </div>
                        <div className="text-[11px] text-red-700">
                          Assigned: <span className="font-semibold">{followUp.assignedTo}</span> | Due:{' '}
                          <span className="font-bold">{followUp.scheduledDate}</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-sm bg-red-600 text-white text-[9px] font-extrabold uppercase">
                        Overdue
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-red-200/60">
                      <span className="text-[10px] text-red-800 truncate max-w-[120px]">
                        {followUp.notes || 'Follow-up discussion'}
                      </span>
                      <div className="flex items-center space-x-1 shrink-0">
                        {lead?.contactPhone && (
                          <a
                            href={`tel:${lead.contactPhone}`}
                            className="p-1 rounded bg-white hover:bg-red-100 text-red-700 border border-red-200"
                            title="Call Lead"
                          >
                            <Phone className="w-3 h-3" />
                          </a>
                        )}
                        {lead?.contactPhone && (
                          <a
                            href={`https://wa.me/${lead.contactPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                            title="WhatsApp Lead"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </a>
                        )}
                        <button
                          onClick={() => onNavigateToLead(followUp.leadId)}
                          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-300"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Today's Follow-ups */}
            {todayFollowUps.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Scheduled Today ({todayFollowUps.length})</span>
                </div>
                {todayFollowUps.slice(0, 2).map(({ followUp, lead }) => (
                  <div
                    key={followUp.id}
                    className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200 text-xs flex flex-col justify-between space-y-1.5 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="font-bold text-amber-950">
                          {lead?.instituteName || followUp.leadId}
                        </div>
                        <div className="text-[11px] text-amber-800">
                          {followUp.scheduledTime} | Owner:{' '}
                          <span className="font-semibold">{followUp.assignedTo}</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-sm bg-amber-500 text-white text-[9px] font-bold uppercase">
                        Today
                      </span>
                    </div>
                    <div className="flex items-center justify-end space-x-1 pt-1 border-t border-amber-200/60">
                      <button
                        onClick={() => onNavigateToLead(followUp.leadId)}
                        className="px-2 py-0.5 rounded bg-white hover:bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-200"
                      >
                        Open Lead
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Unassigned Leads */}
            {unassignedLeads.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                  <UserX className="w-3.5 h-3.5" />
                  <span>Unassigned Leads ({unassignedLeads.length})</span>
                </div>
                {unassignedLeads.slice(0, 2).map((lead) => (
                  <div
                    key={lead.id}
                    className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-blue-950">{lead.instituteName}</div>
                      <div className="text-[11px] text-blue-700">
                        {lead.city}, {lead.state} | {lead.source}
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateToLead(lead.id)}
                      className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold"
                    >
                      Assign Owner
                    </button>
                  </div>
                ))}
              </div>
            )}

            {overdueFollowUps.length === 0 && todayFollowUps.length === 0 && unassignedLeads.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                All lead follow-ups and assignments are up to date.
              </div>
            )}
          </div>
        )}

        {/* Column 2: HR Actions */}
        {(activeSubTab === 'all' || activeSubTab === 'hr') && (
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  HR & Attendance Actions
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {pendingLeaveRequests.length + unmarkedAttendanceStaff.length} Items
              </span>
            </div>

            {/* Pending Leave Approvals with INLINE APPROVE & REJECT buttons */}
            {pendingLeaveRequests.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Pending Leave Approvals ({pendingLeaveRequests.length})</span>
                </div>
                {pendingLeaveRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950">{req.staffName}</span>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                          {req.numberOfDays} Days
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        {req.department} • <span className="font-semibold">{req.leaveType}</span>
                      </div>
                      <div className="text-[10px] text-amber-700 mt-0.5">
                        Dates: {req.fromDate} to {req.toDate}
                      </div>
                      <div className="text-[11px] text-slate-600 italic mt-1 bg-white/70 p-1.5 rounded border border-amber-100">
                        "{req.reason || 'Personal reasons'}"
                      </div>
                    </div>

                    {/* Inline Approval Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                      <span className="text-[10px] font-bold text-amber-800">{req.id}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => onApproveLeave(req.id)}
                          className="px-2.5 py-1 rounded bg-[#168A45] hover:bg-[#0B5D2A] text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                          title="Approve Leave Request"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => onRejectLeave(req.id)}
                          className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                          title="Reject Leave Request"
                        >
                          <XCircle className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Attendance Not Marked Alert */}
            {unmarkedAttendanceStaff.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Attendance Not Marked Today ({unmarkedAttendanceStaff.length})</span>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
                  <p className="text-[11px] text-indigo-900">
                    <span className="font-bold">{unmarkedAttendanceStaff.length} employees</span> have not checked in or been marked for today's roster.
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-indigo-700">
                      e.g. {unmarkedAttendanceStaff[0]?.fullName}, {unmarkedAttendanceStaff[1]?.fullName || ''}
                    </span>
                    <button
                      onClick={onNavigateToAttendance}
                      className="px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-800 text-white text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Mark Attendance
                    </button>
                  </div>
                </div>
              </div>
            )}

            {pendingLeaveRequests.length === 0 && unmarkedAttendanceStaff.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                All staff leave requests and attendance records are in sync.
              </div>
            )}
          </div>
        )}

        {/* Column 3: Document Compliance Actions */}
        {(activeSubTab === 'all' || activeSubTab === 'documents') && (
          <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Document Expiry Actions
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                {expiredDocuments.length + expiring7dDocuments.length} Risks
              </span>
            </div>

            {/* Expired Documents (Critical 🔴) */}
            {expiredDocuments.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Expired Documents ({expiredDocuments.length})</span>
                </div>
                {expiredDocuments.slice(0, 3).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-red-950 line-clamp-1">{doc.documentName}</span>
                        <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-extrabold uppercase">
                          Expired
                        </span>
                      </div>
                      <div className="text-[11px] text-red-800 mt-0.5">
                        {doc.relatedParty} ({doc.department})
                      </div>
                      <div className="text-[10px] text-red-700 mt-0.5">
                        Ref: <span className="font-mono">{doc.referenceNumber}</span> | Expired: {doc.expiryDate}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-red-200/60">
                      <button
                        onClick={() => onOpenDocumentDetails(doc)}
                        className="text-[10px] font-bold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                      >
                        View Record
                      </button>
                      <button
                        onClick={() => onOpenRenewModal(doc)}
                        className="px-2.5 py-1 rounded bg-[#168A45] hover:bg-[#0B5D2A] text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Renew Now</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Expiring within 7 Days (High Priority 🟠) */}
            {expiring7dDocuments.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Expiring Within 7 Days ({expiring7dDocuments.length})</span>
                </div>
                {expiring7dDocuments.slice(0, 2).map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs flex flex-col justify-between space-y-2 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-950 line-clamp-1">{doc.documentName}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-500 text-white text-[9px] font-bold uppercase">
                          7d Left
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-800 mt-0.5">
                        {doc.relatedParty} | Ref: {doc.referenceNumber}
                      </div>
                      <div className="text-[10px] text-amber-700 mt-0.5">
                        Expiry Date: <span className="font-bold">{doc.expiryDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                      <button
                        onClick={() => onOpenDocumentDetails(doc)}
                        className="text-[10px] font-bold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => onOpenRenewModal(doc)}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Process Renewal</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {expiredDocuments.length === 0 && expiring7dDocuments.length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-lg border border-slate-200">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                Zero expired or imminent document expirations.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
