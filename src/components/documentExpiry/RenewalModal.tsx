import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  User,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';
import { ExpiryDocument } from '../../types/documentExpiry';
import { documentExpiryStorage } from '../../services/documentExpiryStorage';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: ExpiryDocument | null;
  onRenew?: (params: {
    documentId: string;
    newStartDate: string;
    newExpiryDate: string;
    newAmount?: number;
    renewedBy: string;
    vendorOrIssuer?: string;
    invoiceOrReceiptNumber?: string;
    newAttachmentName?: string;
    newAttachmentUrl?: string;
    remarks?: string;
  }) => void;
  onRenewalComplete?: (renewedDoc: ExpiryDocument) => void;
  currentUserName?: string;
}

export const RenewalModal: React.FC<RenewalModalProps> = ({
  isOpen,
  onClose,
  document,
  onRenew,
  onRenewalComplete,
  currentUserName = 'Administrator',
}) => {
  if (!isOpen || !document) return null;

  // Calculate sensible default dates
  const calculateDefaultNewStart = (): string => {
    try {
      const exp = new Date(document.expiryDate);
      exp.setDate(exp.getDate() + 1);
      return exp.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  };

  const calculateDefaultNewExpiry = (startDateStr: string, yearsToAdd = 1): string => {
    try {
      const st = new Date(startDateStr);
      st.setFullYear(st.getFullYear() + yearsToAdd);
      return st.toISOString().split('T')[0];
    } catch {
      return startDateStr;
    }
  };

  const initialStart = calculateDefaultNewStart();
  const [newStartDate, setNewStartDate] = useState<string>(initialStart);
  const [newExpiryDate, setNewExpiryDate] = useState<string>(calculateDefaultNewExpiry(initialStart, 1));
  const [newAmount, setNewAmount] = useState<number>(document.amount || 0);
  const [vendorOrIssuer, setVendorOrIssuer] = useState<string>(document.relatedParty || '');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [renewedBy, setRenewedBy] = useState<string>(currentUserName);
  const [newAttachmentName, setNewAttachmentName] = useState<string>(
    document.attachmentName ? `Renewed_${document.attachmentName}` : 'Renewed_Certificate.pdf'
  );
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickDuration = (years: number) => {
    const calculated = calculateDefaultNewExpiry(newStartDate, years);
    setNewExpiryDate(calculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStartDate || !newExpiryDate) {
      setError('Please provide both new start date and new expiry date.');
      return;
    }

    if (new Date(newExpiryDate) <= new Date(newStartDate)) {
      setError('New expiry date must be strictly after the new start date.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const renewalParams = {
        documentId: document.id,
        newStartDate,
        newExpiryDate,
        newAmount: Number(newAmount) || 0,
        renewedBy: renewedBy.trim() || currentUserName,
        vendorOrIssuer: vendorOrIssuer.trim() || document.relatedParty,
        invoiceOrReceiptNumber: invoiceNumber.trim(),
        newAttachmentName: newAttachmentName.trim(),
        remarks: remarks.trim() || `Renewed validity until ${newExpiryDate}.`,
      };

      const renewedDoc = documentExpiryStorage.renewDocument(renewalParams);

      if (typeof onRenew === 'function') {
        onRenew(renewalParams);
      }
      if (typeof onRenewalComplete === 'function' && renewedDoc) {
        onRenewalComplete(renewedDoc);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to process document renewal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-[#168A45] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <RefreshCw className="w-5 h-5 text-emerald-200 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Renew Document & Log History</h2>
              <p className="text-xs text-emerald-100">
                Preserves prior validity into audit history while updating active terms
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Document Snapshot Bar */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200/80 flex items-center justify-between text-xs shrink-0">
          <div className="min-w-0 pr-4">
            <span className="text-slate-400 font-medium block">Document Title:</span>
            <span className="font-bold text-slate-800 truncate block text-sm">
              {document.documentName}
            </span>
            <span className="text-[11px] text-slate-500">
              Type: <strong className="text-slate-700">{document.documentTypeName}</strong> | Ref:{' '}
              <strong className="text-slate-700">{document.referenceNumber}</strong>
            </span>
          </div>
          <div className="text-right shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Expiry</span>
            <span className="text-xs font-black text-rose-600 font-mono">{document.expiryDate}</span>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* New Validity Period */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B5D2A] flex items-center space-x-1.5 text-xs">
                <Calendar className="w-4 h-4 text-[#168A45]" />
                <span>New Validity Dates</span>
              </span>
              {/* Quick Duration Buttons */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 mr-1">Quick Add:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(1)}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[#0B5D2A] hover:bg-emerald-100 font-semibold cursor-pointer text-[10px]"
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(2)}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[#0B5D2A] hover:bg-emerald-100 font-semibold cursor-pointer text-[10px]"
                >
                  +2 Years
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(3)}
                  className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[#0B5D2A] hover:bg-emerald-100 font-semibold cursor-pointer text-[10px]"
                >
                  +3 Years
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => {
                    setNewStartDate(e.target.value);
                    if (newExpiryDate <= e.target.value) {
                      setNewExpiryDate(calculateDefaultNewExpiry(e.target.value, 1));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={newExpiryDate}
                  min={newStartDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Financial & Authority Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                New Renewal Amount ({document.currency || 'INR'})
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min={0}
                  value={newAmount}
                  onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-semibold"
                  placeholder="0.00"
                />
              </div>
              <span className="text-[10px] text-slate-400">
                Previous amount was {document.currency} {(document.amount || 0).toLocaleString()}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Renewal Invoice / Challan / Ref No.
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. INV-2026-9921 or CHAL-441"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Vendor / Issuer / Authority
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={vendorOrIssuer}
                  onChange={(e) => setVendorOrIssuer(e.target.value)}
                  placeholder="e.g. State Authority, Dell, AWS"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Renewed By (Authorized Person)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={renewedBy}
                  onChange={(e) => setRenewedBy(e.target.value)}
                  placeholder="Staff or Admin Name"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Upload New Document / Attachment */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Upload New Document / Certificate / Policy (PDF, Image)
            </label>
            <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 bg-slate-50 text-center transition-colors">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
              <div className="text-xs text-slate-600 font-medium">
                Drag & drop renewed document here, or type document file name below
              </div>
              <input
                type="text"
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                placeholder="Renewed_Certificate_2026.pdf"
                className="mt-2.5 max-w-sm mx-auto px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg block text-center focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Old document ({document.attachmentName || 'previous file'}) will be safely preserved in Renewal History.
              </span>
            </div>
          </div>

          {/* Remarks & Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Renewal Remarks & Notes</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Terms negotiated with 10% volume discount. Next inspection due in 12 months."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Audit Trail Assurance Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-[11px] text-blue-900">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Audit Guarantee:</strong> A permanent renewal record (Version #{ (document.renewalCount || 0) + 1 }) will be logged with timestamps, previous validity range, prior costs, and document attachments.
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-xl shadow-xs hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Confirm & Archive Prior Terms</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
