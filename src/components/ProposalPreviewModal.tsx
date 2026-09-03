import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Printer,
  Mail,
  Edit,
  Send,
  Loader2,
  ExternalLink,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { Proposal, Settings } from '../types';
import { generatePdfFromElement, printProposalDocument, formatINR } from '../utils/pdfGenerator';
import { PrintableProposalDocument } from './PrintableProposalDocument';

interface ProposalPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: Proposal | null;
  settings: Settings;
  onEdit: () => void;
  onSendEmail?: (proposal: Proposal, emailTo?: string) => void;
}

export const ProposalPreviewModal: React.FC<ProposalPreviewModalProps> = ({
  isOpen,
  onClose,
  proposal,
  settings,
  onEdit,
  onSendEmail,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (proposal) {
      const defaultEmail = proposal.leadEmail || '';
      setEmailTo(defaultEmail);
      setEmailSubject(`MYSAR Proposal for Implementation - ${proposal.instituteName}`);
      setEmailBody(
        `Dear ${proposal.contactPerson || 'Respected Management'},\n\n` +
        `Greetings from Casbiro Solutions Private Limited.\n\n` +
        `Please find our official Proposal for Implementation (${proposal.proposalNumber}) for ${proposal.instituteName}.\n\n` +
        `Scope: ${proposal.pricingType || 'School Premium'} at ₹${proposal.pricePerStudent}/student/year for ${proposal.studentCount} students (Total: ${formatINR(proposal.totalAmount)}/year).\n\n` +
        `Our team provides complete onboarding, training, and continuous technical support.\n\n` +
        `Warm regards,\n` +
        `Team MYSAR | Casbiro Solutions Private Limited\n` +
        `Phone: +91 7994 807 907 / +91 7994 806 906\n` +
        `Email: support@casbiro.com | https://mysar.in`
      );
    }
  }, [proposal]);

  if (!isOpen || !proposal) return null;

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    setExportProgress('Starting PDF export...');
    setExportSuccess(false);
    try {
      const sanitizedName = (proposal.instituteName || 'Proposal').replace(/[^a-zA-Z0-9]/g, '_');
      await generatePdfFromElement(
        'mysar-proposal-printable-document',
        `MYSAR_Proposal_${proposal.proposalNumber.replace(/\//g, '_')}_${sanitizedName}`,
        (msg) => {
          setExportProgress(msg);
        }
      );
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3500);
    } catch (e) {
      console.error('PDF export error', e);
      handlePrint();
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handlePrint = () => {
    printProposalDocument('mysar-proposal-printable-document');
  };

  const handleSendDirectEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim()) {
      alert('Please enter a valid recipient email address.');
      return;
    }

    if (onSendEmail) {
      onSendEmail(proposal, emailTo);
    }

    setEmailSentSuccess(true);
    setTimeout(() => {
      setEmailSentSuccess(false);
      setShowEmailDialog(false);
    }, 2200);
  };

  const handleOpenMailClient = () => {
    if (!emailTo.trim()) {
      alert('Please enter a recipient email address first.');
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(emailTo)}?subject=${encodeURIComponent(
      emailSubject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 140));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 60));
  const handleResetZoom = () => setZoom(100);

  const handleJumpToSection = (pageIdx: number) => {
    const docEl = document.getElementById('mysar-proposal-printable-document');
    if (!docEl) return;
    const pages = docEl.querySelectorAll('.proposal-page');
    if (pages[pageIdx]) {
      pages[pageIdx].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col h-[96vh]">
        {/* Modal Top Bar (Fixed) */}
        <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 no-print z-20 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#168A45] flex items-center justify-center font-black">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {proposal.instituteName}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#0B5D2A] font-bold border border-emerald-200">
                  {proposal.proposalNumber}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                15 Pages Official A4 Document • Standard Margins & Vector Typography
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Quick Section Jump Selector */}
            <select
              onChange={(e) => handleJumpToSection(Number(e.target.value))}
              defaultValue="0"
              className="text-xs bg-slate-50 hover:bg-slate-100 border border-gray-200 text-slate-700 rounded-lg px-2.5 py-1.5 font-medium cursor-pointer focus:outline-none focus:border-[#168A45]"
              title="Jump directly to section"
            >
              <option value="0">Page 1 • Cover Page</option>
              <option value="1">Page 2 • Table of Contents</option>
              <option value="2">Page 3 • 1. About Company</option>
              <option value="3">Page 4 • 2. About MYSAR</option>
              <option value="4">Page 5 • 3. Modules (Part 1)</option>
              <option value="5">Page 6 • 3. Modules (Part 2)</option>
              <option value="6">Page 7 • 3. Modules (Part 3)</option>
              <option value="7">Page 8 • 4. Reports (Part 1)</option>
              <option value="8">Page 9 • 4. Reports (Part 2)</option>
              <option value="9">Page 10 • 5. Services (Part 1)</option>
              <option value="10">Page 11 • 5. Services (Part 2)</option>
              <option value="11">Page 12 • 6. Pricing & Options</option>
              <option value="12">Page 13 • 7. Contact Information</option>
              <option value="13">Page 14 • 8. Conclusion</option>
              <option value="14">Page 15 • 9. Acceptance & Signatories</option>
            </select>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 60}
                title="Zoom Out"
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 hover:bg-white rounded transition"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset to 100%"
                className="px-2 text-[11px] font-bold text-slate-700 min-w-[42px] text-center hover:bg-white rounded transition"
              >
                {zoom}%
              </button>
              <button
                onClick={handleZoomIn}
                disabled={zoom >= 140}
                title="Zoom In"
                className="p-1.5 text-slate-600 hover:text-slate-900 disabled:opacity-40 hover:bg-white rounded transition"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onEdit}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Edit</span>
            </button>

            <button
              onClick={handlePrint}
              title="Print Proposal Document"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              onClick={() => setShowEmailDialog(true)}
              className="bg-[#EAF7EF] hover:bg-[#D9E5DD] text-[#0B5D2A] border border-[#D9E5DD] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-[#168A45]" />
              <span className="hidden sm:inline">Email</span>
            </button>

            {/* Primary Green Generate/Download Proposal Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              title="Save & Download Proposal PDF"
              className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all active:scale-98 disabled:opacity-75 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="whitespace-nowrap">{exportProgress || 'Generating PDF...'}</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area with Authentic Reader Backdrop */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 bg-slate-200/90 flex flex-col items-center">
          {/* Email Dispatch Modal Dialog */}
          {showEmailDialog && (
            <div className="mb-6 p-5 rounded-2xl bg-white border-2 border-[#168A45] shadow-lg animate-in fade-in duration-150 w-full max-w-3xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#168A45] flex items-center justify-center font-bold">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Send Proposal to Institution
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Dispatch commercial proposal via Gmail / Google Apps Script or default mail client
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEmailDialog(false)}
                  className="text-xs text-slate-400 hover:text-slate-700 p-1 rounded-md"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendDirectEmail} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recipient Email:
                  </label>
                  <input
                    type="email"
                    required
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="principal@institution.edu / director@school.com"
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Line:
                  </label>
                  <input
                    type="text"
                    required
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Message Body:
                  </label>
                  <textarea
                    rows={4}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white font-mono text-[11px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleOpenMailClient}
                    className="text-xs text-slate-600 hover:text-[#168A45] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Outlook / Apple Mail</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setShowEmailDialog(false)}
                      className="px-3.5 py-1.5 text-xs border border-gray-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send via GAS / Gmail</span>
                    </button>
                  </div>
                </div>

                {emailSentSuccess && (
                  <div className="text-xs font-bold text-[#0B5D2A] bg-[#EAF7EF] p-2.5 rounded-lg flex items-center justify-center gap-1.5 border border-[#D9E5DD]">
                    <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
                    <span>Proposal successfully dispatched to {emailTo}!</span>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* 15-PAGE OFFICIAL MYSAR PROPOSAL DOCUMENT WITH ZOOM CONTAINER */}
          <div
            className="transition-transform duration-150 origin-top flex flex-col items-center"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            <PrintableProposalDocument
              proposal={proposal}
              settings={settings}
              id="mysar-proposal-printable-document"
              showPageBadges={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
