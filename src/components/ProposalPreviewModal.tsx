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

  useEffect(() => {
    if (proposal) {
      const defaultEmail = proposal.leadEmail || '';
      setEmailTo(defaultEmail);
      setEmailSubject(`MYSAR Proposal for Implementation - ${proposal.instituteName}`);
      setEmailBody(
        `Dear ${proposal.contactPerson || 'Respected Management'},\n\n` +
        `Greetings from Casbiro Solutions Private Limited.\n\n` +
        `Thank you for your interest in the MYSAR (My Student Analysis Record) platform for ${proposal.instituteName}.\n\n` +
        `Please find our official Proposal for Implementation (${proposal.proposalNumber}) with selected plan "${proposal.pricingType}" at ₹${proposal.pricePerStudent}/student/year for ${proposal.studentCount} students (Total: ${formatINR(proposal.totalAmount)}/year).\n\n` +
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[94vh]">
        {/* Modal Top Bar (Fixed) */}
        <div className="bg-slate-50 border-b border-gray-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#168A45]"></span>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
              Proposal Preview: <span className="text-[#0B5D2A] font-extrabold">{proposal.proposalNumber}</span>
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit</span>
            </button>

            <button
              onClick={handlePrint}
              title="Print Proposal Document"
              className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            <button
              onClick={() => setShowEmailDialog(true)}
              className="bg-[#EAF7EF] hover:bg-[#D9E5DD] text-[#0B5D2A] border border-[#D9E5DD] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <Mail className="w-3.5 h-3.5 text-[#168A45]" />
              <span>Email</span>
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
                  <span>Download Proposal</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#F7FAF8]">
          {/* Email Dispatch Modal Dialog */}
          {showEmailDialog && (
            <div className="mb-6 p-5 rounded-2xl bg-white border-2 border-[#168A45] shadow-lg animate-in fade-in duration-150">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recipient Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Enter institute email (e.g. principal@greenwoodschool.edu.in)"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Message Body
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

          {/* 14-PAGE OFFICIAL MYSAR PROPOSAL DOCUMENT */}
          <PrintableProposalDocument
            proposal={proposal}
            settings={settings}
            id="mysar-proposal-printable-document"
          />
        </div>
      </div>
    </div>
  );
};
