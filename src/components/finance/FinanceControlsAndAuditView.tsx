import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  User,
  Hash,
} from 'lucide-react';

import { ApprovalRequestRecord, AuditLogRecord } from '../../types/finance';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface FinanceControlsAndAuditViewProps {
  currentUserName?: string;
  userRole?: string;
}

export const FinanceControlsAndAuditView: React.FC<FinanceControlsAndAuditViewProps> = ({
  currentUserName = 'Finance Controller',
  userRole = 'Admin',
}) => {
  const [approvals, setApprovals] = useState<ApprovalRequestRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'approvals' | 'audit' | 'fiscal'>('approvals');
  const [auditSearch, setAuditSearch] = useState('');

  const loadData = () => {
    setApprovals(erpFinanceStorage.getApprovalRequests());
    setAuditLogs(erpFinanceStorage.getAuditLogs());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  const pendingApprovals = useMemo(() => {
    return approvals.filter((a) => a.status === 'Pending');
  }, [approvals]);

  const filteredLogs = useMemo(() => {
    if (!auditSearch.trim()) return auditLogs;
    const q = auditSearch.toLowerCase();
    return auditLogs.filter(
      (log) =>
        log.entityId.toLowerCase().includes(q) ||
        log.actorName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
    );
  }, [auditLogs, auditSearch]);

  const handleApprove = (id: string) => {
    erpFinanceStorage.processApprovalAction({
      requestId: id,
      action: 'Approve',
      approverName: currentUserName,
      comment: 'Approved under company spending authorization delegation',
    });
    loadData();
  };

  const handleReject = (id: string) => {
    const reason = prompt('Please enter rejection justification:');
    if (reason) {
      erpFinanceStorage.processApprovalAction({
        requestId: id,
        action: 'Reject',
        approverName: currentUserName,
        comment: reason,
      });
      loadData();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-indigo-50 rounded-xl text-indigo-700 border border-indigo-200/80">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Controls, Multi-Tier Approvals & Audit Trail
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                SOX / Internal Audit Compliant
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl">
              Strict governance workflows. High-value disbursements and POs require authorized sign-off. Every database
              write is logged immutably with full user attribution.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs font-semibold">
            <span className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-700 border border-gray-200">
              Role: <span className="font-bold text-slate-900">{userRole}</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
              User: <span className="font-bold">{currentUserName}</span>
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Approval Requests</span>
            {pendingApprovals.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-500 text-white rounded-full font-bold">
                {pendingApprovals.length} Pending
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Immutable Audit Trail</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-100 rounded-full font-bold">
              {auditLogs.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'fiscal'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Fiscal Year & Numbering Controls</span>
          </button>
        </div>
      </div>

      {/* 1. APPROVALS */}
      {activeTab === 'approvals' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Financial Transaction Authorizations</h3>
              <p className="text-xs text-slate-500">
                Authorizations exceeding departmental spending delegation thresholds (INR 50,000+).
              </p>
            </div>
            <span className="text-xs text-slate-500">
              Pending Authorization:{' '}
              <span className="font-bold text-amber-700">{pendingApprovals.length} items</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Entity & Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Submitted By</th>
                  <th className="py-3 px-4">Requested Date</th>
                  <th className="py-3 px-4 text-right">Transaction Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvals.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{app.entityNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {app.entityType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{app.requestedBy}</td>
                    <td className="py-3 px-4 text-slate-500">{app.requestedDate.split('T')[0]}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">{formatINR(app.amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800'
                            : app.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {app.status === 'Pending' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(app.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(app.id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">
                          {app.approvedTiers.length > 0 ? `By ${app.approvedTiers[app.approvedTiers.length - 1].approverName}` : 'Completed'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. IMMUTABLE AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit trail by entity, user, action..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <span className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredLogs.length}</span> audit events
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity Ref</th>
                  <th className="py-3 px-4">Details & Event Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-500">{log.timestamp}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.actorName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          log.action.includes('Create') || log.action.includes('Post')
                            ? 'bg-emerald-50 text-emerald-800'
                            : log.action.includes('Approve')
                            ? 'bg-blue-50 text-blue-800'
                            : log.action.includes('Reverse') || log.action.includes('Reject')
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700">{log.entityNumber || log.entityId}</td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. FISCAL YEAR & NUMBERING CONTROLS */}
      {activeTab === 'fiscal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Document Numbering Series */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Hash className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Automated Document Numbering Series</h3>
                <p className="text-xs text-slate-500">Prefixes and auto-increment sequences for FY 2026-27</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Sales Tax Invoices</div>
                  <div className="text-[11px] text-slate-500">Prefix: INV-2026-XXXX</div>
                </div>
                <span className="font-mono font-bold text-blue-700">Next: INV-2026-0004</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Purchase Invoices / Bills</div>
                  <div className="text-[11px] text-slate-500">Prefix: PINV-2026-XXXX</div>
                </div>
                <span className="font-mono font-bold text-blue-700">Next: PINV-2026-0005</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Journal Vouchers</div>
                  <div className="text-[11px] text-slate-500">Prefix: JV-2026-XXXX</div>
                </div>
                <span className="font-mono font-bold text-blue-700">Next: JV-2026-0012</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Customer Receipts</div>
                  <div className="text-[11px] text-slate-500">Prefix: REC-2026-XXXX</div>
                </div>
                <span className="font-mono font-bold text-blue-700">Next: REC-2026-0003</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                <div>
                  <div className="font-bold text-slate-800">Supplier Payments / Disbursements</div>
                  <div className="text-[11px] text-slate-500">Prefix: PAY-2026-XXXX</div>
                </div>
                <span className="font-mono font-bold text-blue-700">Next: PAY-2026-0004</span>
              </div>
            </div>
          </div>

          {/* Fiscal Period Controls */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2 border-b border-gray-100 pb-3">
              <Lock className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Fiscal Period Lock & Closing</h3>
                <p className="text-xs text-slate-500">Prevent retroactive back-dated edits in closed accounting periods</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[#0B5D2A] font-semibold">
                ✓ Current Active Period: Q2 FY 2026-27 (Open for Posting)
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Period Q1 (Apr 1 - Jun 30, 2026):</span>
                  <span className="font-bold text-rose-700">🔒 Locked (Audited)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Period Q2 (Jul 1 - Sep 30, 2026):</span>
                  <span className="font-bold text-emerald-700">🔓 Open</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Period Q3 (Oct 1 - Dec 31, 2026):</span>
                  <span className="font-bold text-slate-500">Future</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                <strong>Fiscal Lock Rule:</strong> Transactions dated prior to July 1, 2026 cannot be posted or edited
                without Chief Financial Officer dual-key override.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
