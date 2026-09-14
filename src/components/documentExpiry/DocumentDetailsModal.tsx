import React from 'react';
import {
  X,
  Calendar,
  DollarSign,
  User,
  Building,
  FileText,
  Clock,
  Bell,
  RefreshCw,
  Download,
  History,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Smartphone,
  MessageSquare,
  LayoutDashboard,
  ShieldCheck,
  Edit2,
  ArrowRight,
  Printer,
} from 'lucide-react';
import {
  ExpiryDocument,
  calculateDaysRemaining,
  getUrgencyLevel,
  getUrgencyBadge,
  STANDARD_REMINDER_OPTIONS,
  NOTIFICATION_CHANNEL_META,
  NotificationChannel,
} from '../../types/documentExpiry';
import { printDocumentCertificate } from '../../utils/documentExpiryPrint';

interface DocumentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ExpiryDocument | null;
  onOpenRenew: (doc: ExpiryDocument) => void;
  onOpenEdit: (doc: ExpiryDocument) => void;
  onTriggerTestAlert?: (doc: ExpiryDocument, channel: NotificationChannel) => void;
}

export const DocumentDetailsModal: React.FC<DocumentDetailsModalProps> = ({
  isOpen,
  onClose,
  document,
  onOpenRenew,
  onOpenEdit,
  onTriggerTestAlert,
}) => {
  if (!isOpen || !document) return null;

  const daysRemaining = calculateDaysRemaining(document.expiryDate);
  const urgency = getUrgencyLevel(document);
  const urgencyBadge = getUrgencyBadge(urgency, daysRemaining);

  // Calculate validity elapsed percentage
  const getValidityProgress = (): number => {
    try {
      const start = new Date(document.startDate).getTime();
      const end = new Date(document.expiryDate).getTime();
      const now = new Date().getTime();
      if (end <= start) return 100;
      const progress = ((now - start) / (end - start)) * 100;
      return Math.min(100, Math.max(0, Math.round(progress)));
    } catch {
      return 50;
    }
  };

  const progressPercent = getValidityProgress();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {document.documentTypeName}
                </span>
                <span className="text-xs text-slate-400 font-mono">#{document.referenceNumber}</span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5 truncate max-w-lg">
                {document.documentName}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onOpenEdit(document)}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-200 hover:text-white transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Urgency & Validity Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center space-x-3">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${urgencyBadge.badgeClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${urgencyBadge.dotColor}`}></span>
              <span>{urgencyBadge.label}</span>
            </span>
            <span className="text-slate-500">
              Department: <strong className="text-slate-800 font-semibold">{document.department}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => printDocumentCertificate(document)}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
              title="Print official validity & compliance certificate"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Certificate</span>
            </button>
            <button
              onClick={() => onOpenRenew(document)}
              className="px-4 py-1.5 rounded-xl bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew This Document</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Validity Timeline Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Validity Period</span>
              </span>
              <span className="text-slate-500 font-mono">
                {progressPercent}% elapsed ({daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`})
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  urgency === 'expired'
                    ? 'bg-rose-500 w-full'
                    : urgency === 'expiring_today' || urgency === 'expiring_7d'
                    ? 'bg-amber-500'
                    : urgency === 'expiring_30d'
                    ? 'bg-yellow-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: urgency === 'expired' ? '100%' : `${progressPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 font-mono">
              <span>Start: <strong className="text-slate-800">{document.startDate}</strong></span>
              <span className="font-bold text-right">
                Expiry: <strong className={`${urgency === 'expired' ? 'text-rose-600' : 'text-slate-800'}`}>{document.expiryDate}</strong>
              </span>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-slate-400 font-medium block text-[11px] mb-1">Related Party / Counterparty</span>
              <div className="font-bold text-slate-800 text-sm">{document.relatedParty}</div>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-600 mt-1 inline-block">
                {document.relatedPartyType}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-slate-400 font-medium block text-[11px] mb-1">Applicable Cost / Amount</span>
              <div className="font-black text-slate-800 text-sm">
                {document.currency || 'INR'} {(document.amount || 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Renewal / premium fee</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
              <span className="text-slate-400 font-medium block text-[11px] mb-1">Responsible Person</span>
              <div className="font-bold text-slate-800 text-sm flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{document.responsiblePerson}</span>
              </div>
              {document.responsibleEmail && (
                <span className="text-[10px] text-slate-500 block truncate">{document.responsibleEmail}</span>
              )}
            </div>
          </div>

          {/* Remarks & Document Attachment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
              <span className="font-bold text-slate-700 block">Remarks & Compliance Notes</span>
              <p className="text-slate-600 leading-relaxed text-xs">
                {document.remarks || 'No special remarks recorded for this document.'}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2">
              <span className="font-bold text-slate-700 block">Document Attachment</span>
              {document.attachmentName ? (
                <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <span className="font-bold text-slate-800 block truncate">{document.attachmentName}</span>
                      <span className="text-[10px] text-slate-400">{document.attachmentSize || 'PDF Document'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Downloading certificate file: ${document.attachmentName}`);
                    }}
                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-slate-400 text-xs italic">No document attachment uploaded yet.</div>
              )}
            </div>
          </div>

          {/* Reminder Rules & Channels Configuration */}
          <div className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-200/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 flex items-center space-x-2">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Automated Reminder Schedule & Active Channels</span>
              </span>
              <span className="text-[10px] text-indigo-700 font-semibold">
                {document.reminderDays?.length || 0} Triggers Active
              </span>
            </div>

            {/* Intervals Pills */}
            <div className="flex flex-wrap gap-1.5">
              {document.reminderDays?.map((days) => {
                const opt = STANDARD_REMINDER_OPTIONS.find((o) => o.days === days);
                return (
                  <span
                    key={days}
                    className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-900 font-semibold text-[11px] shadow-2xs"
                  >
                    {opt ? opt.label : `${days} days`}
                  </span>
                );
              })}
            </div>

            {/* Channels Row */}
            <div className="pt-2 border-t border-indigo-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-semibold text-slate-500 mr-1">Dispatched Via:</span>
                {document.notificationChannels?.map((ch) => {
                  const meta = NOTIFICATION_CHANNEL_META[ch];
                  return (
                    <span
                      key={ch}
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${meta?.color || 'bg-slate-100 text-slate-700'}`}
                      title={meta?.description}
                    >
                      <span>{meta?.label || ch}</span>
                    </span>
                  );
                })}
              </div>

              {/* Send Test Alert Trigger */}
              {onTriggerTestAlert && (
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] text-slate-400">Trigger Test:</span>
                  <button
                    type="button"
                    onClick={() => onTriggerTestAlert(document, 'system')}
                    className="p-1 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 cursor-pointer"
                    title="Send Test In-App Notification"
                  >
                    <Bell className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerTestAlert(document, 'email')}
                    className="p-1 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 cursor-pointer"
                    title="Send Test Email Alert"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onTriggerTestAlert(document, 'whatsapp')}
                    className="p-1 rounded bg-white hover:bg-indigo-50 border border-indigo-200 text-emerald-700 cursor-pointer"
                    title="Send Test WhatsApp Alert"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Complete Renewal History Timeline */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-slate-900 text-xs">
                  Complete Renewal History ({document.renewalHistory?.length || 0} previous renewals logged)
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Immutable audit ledger per ERP compliance
              </span>
            </div>

            {document.renewalHistory && document.renewalHistory.length > 0 ? (
              <div className="space-y-3">
                {document.renewalHistory.map((hist, idx) => (
                  <div
                    key={hist.id}
                    className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/90 relative pl-6"
                  >
                    <span className="absolute left-2.5 top-4 w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-emerald-100"></span>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 text-xs">
                          Renewal #{document.renewalHistory.length - idx}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Processed on <strong className="text-slate-700">{hist.renewalDate}</strong> by{' '}
                          <strong className="text-slate-700">{hist.renewedBy}</strong>
                        </span>
                      </div>
                      {hist.invoiceOrReceiptNumber && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          Inv: {hist.invoiceOrReceiptNumber}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] mb-2 font-mono">
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-slate-400 text-[10px] block">Previous Term:</span>
                        <span className="text-slate-700">{hist.previousStartDate} → {hist.previousExpiryDate}</span>
                        {hist.previousAmount !== undefined && (
                          <div className="text-slate-500 text-[10px]">
                            Amount: {hist.currency} {hist.previousAmount.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                        <span className="text-emerald-700 text-[10px] font-bold block">Renewed Term:</span>
                        <span className="text-emerald-900 font-bold">{hist.newStartDate} → {hist.newExpiryDate}</span>
                        {hist.newAmount !== undefined && (
                          <div className="text-emerald-800 text-[10px] font-semibold">
                            New Amount: {hist.currency} {hist.newAmount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>

                    {hist.remarks && (
                      <p className="text-slate-600 text-xs italic bg-white/70 p-2 rounded-lg border border-slate-200/50">
                        "{hist.remarks}"
                      </p>
                    )}

                    {hist.newAttachmentName && (
                      <div className="mt-2 flex items-center space-x-2 text-[11px] text-slate-500">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span>Attached file: <strong>{hist.newAttachmentName}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center text-slate-400 text-xs">
                This document is on its initial validity cycle. When you renew this document, prior terms, dates, and certificates will be archived here automatically.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">
            Created: {new Date(document.createdAt).toLocaleDateString()} | ID: {document.id}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenRenew(document);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Renew Document</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
