import React, { useEffect } from 'react';
import {
  Printer,
  X,
  Building2,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  Clock,
  FileText,
  Briefcase,
} from 'lucide-react';
import { Lead, User as UserType, FollowUp, Proposal } from '../types';
import { StatusBadge } from './StatusBadge';
import { storage } from '../services/storageService';

interface PrintLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserType;
}

export const PrintLeadModal: React.FC<PrintLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  currentUser,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  // Retrieve associated follow-ups and proposals
  const leadFollowUps: FollowUp[] = storage
    .getFollowUps()
    .filter((f) => f.leadId === lead.id);

  const leadProposals: Proposal[] = storage
    .getProposals()
    .filter((p) => p.leadId === lead.id || p.instituteName === lead.instituteName);

  const printDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 print:p-0 print:bg-white print:static">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-lead-summary, #printable-lead-summary * {
            visibility: visible;
          }
          #printable-lead-summary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 1.5rem !important;
            background: white !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>

      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh] print:max-h-none print:my-0 print:border-none print:shadow-none print:rounded-none">
        {/* Top Floating Control Bar - Hidden during printing */}
        <div className="no-print bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-[#168A45] rounded-lg">
              <Printer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Lead Summary Print Preview</h3>
              <p className="text-[11px] text-slate-400">
                Official Institutional Dossier • ID: {lead.id}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleTriggerPrint}
              className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center space-x-1.5 active:scale-98"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Close Preview (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div
          id="printable-lead-summary"
          className="p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 text-xs font-sans print:p-0 print:overflow-visible"
        >
          {/* Document Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-6">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#0B5D2A] text-white flex items-center justify-center font-black text-xl tracking-tight shadow-xs print:border print:border-slate-800">
                SAR
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                  MY SAR ERP MANAGEMENT
                </h1>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mt-0.5">
                  Institutional Client Profile & Lead Dossier
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enterprise Academic Automation & Multi-Campus Solutions
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-mono font-bold text-xs">
                {lead.id}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Generated: <strong className="text-slate-700">{printDate}</strong>
              </div>
              <div className="text-[10px] text-slate-400">
                Printed by: {currentUser.name} ({currentUser.role})
              </div>
            </div>
          </div>

          {/* Core Institutional Dossier */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 mb-6 print:bg-slate-50/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 mb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Target Institution
                </span>
                <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {lead.instituteName}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {lead.status}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    lead.priority === 'High'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : lead.priority === 'Medium'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lead.priority} Priority
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Total Student Strength</span>
                <span className="text-sm font-black text-[#0B5D2A]">
                  {lead.studentCount.toLocaleString('en-IN')} Students
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Acquisition Source</span>
                <span className="font-bold text-slate-800">{lead.leadSource || 'Direct'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Lead Capture Date</span>
                <span className="font-bold text-slate-800">{lead.leadDate || lead.createdDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Assigned Sales Executive</span>
                <span className="font-bold text-slate-800">{lead.assignedTo}</span>
              </div>
            </div>
          </div>

          {/* Two-Column Grid: Contact Information & Sales Tracking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Contact Details */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs pb-2.5 mb-3 border-b border-slate-100 uppercase tracking-wider">
                <UserIcon className="w-3.5 h-3.5 text-[#168A45]" />
                <span>Authorized Contact Information</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Contact Officer:</span>
                  <strong className="text-slate-900 font-bold">{lead.contactPerson}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Mobile / Telephone:</span>
                  <span className="font-bold text-slate-900">{lead.mobile}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="font-medium text-slate-800">{lead.email || 'Not provided'}</span>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 block text-[11px] mb-0.5">Campus Address / Location:</span>
                  <span className="text-slate-800 font-medium leading-relaxed">
                    {lead.address || 'Address on file not specified.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Sales & Follow-up Tracking */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs pb-2.5 mb-3 border-b border-slate-100 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-[#168A45]" />
                <span>Account Pipeline & Engagement</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Lead Owner:</span>
                  <strong className="text-slate-900 font-bold">{lead.assignedTo}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Next Follow-up Scheduled:</span>
                  <span className="font-bold text-[#0B5D2A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {lead.followUpDate || 'None Scheduled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Created By:</span>
                  <span className="text-slate-700">{lead.createdBy || 'Staff'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Last System Update:</span>
                  <span className="text-slate-700">{lead.updatedDate || lead.createdDate || 'Recent'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategic Remarks & Requirements */}
          <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50/50">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs pb-2 mb-2 border-b border-slate-200/60 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-[#168A45]" />
              <span>Institutional Requirements & Discussion Notes</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {lead.remarks ? lead.remarks : 'No special remarks recorded for this institutional account.'}
            </p>
          </div>

          {/* Follow-up Logs Table (if any) */}
          {leadFollowUps.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Logged Follow-up History ({leadFollowUps.length})</span>
              </h4>
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3">Representative</th>
                    <th className="py-2 px-3">Discussion Notes</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] text-slate-700">
                  {leadFollowUps.slice(0, 5).map((f) => (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {f.followUpDate}
                      </td>
                      <td className="py-2 px-3">{f.followUpType || 'Call'}</td>
                      <td className="py-2 px-3 font-medium">{f.staff}</td>
                      <td className="py-2 px-3">{f.discussion || f.remarks}</td>
                      <td className="py-2 px-3 font-bold text-slate-800">{f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Proposals Generated (if any) */}
          {leadProposals.length > 0 && (
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                <span>Commercial Proposals ({leadProposals.length})</span>
              </h4>
              <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                  <tr>
                    <th className="py-2 px-3">Proposal #</th>
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Students</th>
                    <th className="py-2 px-3">Rate / Student</th>
                    <th className="py-2 px-3">Total Investment</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] text-slate-700">
                  {leadProposals.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-[#0B5D2A]">{p.proposalNumber}</td>
                      <td className="py-2 px-3">{p.proposalDate}</td>
                      <td className="py-2 px-3 font-semibold">{p.studentCount}</td>
                      <td className="py-2 px-3">₹{p.pricePerStudent}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">
                        ₹{p.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-3 font-semibold">{p.proposalStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Formal Verification & Signatures */}
          <div className="pt-8 mt-6 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-6 text-[11px] text-slate-600">
            <div>
              <span className="block text-slate-400 uppercase text-[9px] font-bold mb-8">
                Prepared By (Sales Officer)
              </span>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                {lead.assignedTo}
              </div>
              <span className="text-[10px] text-slate-400">Signature & Date</span>
            </div>

            <div>
              <span className="block text-slate-400 uppercase text-[9px] font-bold mb-8">
                Verified By (Sales Head / Director)
              </span>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                Management Directorate
              </div>
              <span className="text-[10px] text-slate-400">Authorized Signature & Seal</span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                System Authenticity
              </span>
              <p className="text-[10px] text-slate-500 leading-tight">
                This official lead dossier is generated directly from the MY SAR ERP database.
              </p>
              <span className="text-[9px] font-mono text-slate-400">
                Hash: {lead.id}-{Date.now().toString(36).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
