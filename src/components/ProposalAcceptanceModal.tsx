import React, { useState, useRef, useEffect } from 'react';
import {
  FileCheck2,
  X,
  PenTool,
  Type,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  User as UserIcon,
  Mail,
  Phone,
  Clock,
  ExternalLink,
  Download,
  Copy,
  Check,
  AlertCircle,
  FileText,
  BadgeCheck,
  Printer,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Proposal, ProposalDigitalSignature, Settings } from '../types';
import { formatINR } from '../utils/pdfGenerator';
import {
  generateSignatureVerificationCode,
  copySignatureLinkToClipboard,
  getProposalSignatureUrl,
} from '../utils/signatureUtils';

interface ProposalAcceptanceModalProps {
  proposal: Proposal;
  settings?: Settings;
  isOpen: boolean;
  onClose: () => void;
  onSignProposal: (proposalId: string, signature: ProposalDigitalSignature) => void;
  onViewProposalDocument?: (proposal: Proposal) => void;
  onDownloadPdf?: (proposal: Proposal) => void;
  isStandaloneCustomerView?: boolean;
}

export const ProposalAcceptanceModal: React.FC<ProposalAcceptanceModalProps> = ({
  proposal,
  settings,
  isOpen,
  onClose,
  onSignProposal,
  onViewProposalDocument,
  onDownloadPdf,
  isStandaloneCustomerView = false,
}) => {
  // Tabs for signature input: 'draw' | 'type' | 'upload'
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type' | 'upload'>('draw');

  // Form Fields
  const [signerName, setSignerName] = useState(
    proposal.digitalSignature?.signerName ||
      proposal.agreementDetails?.clientAuthorizedPerson ||
      proposal.contactPerson ||
      ''
  );
  const [signerDesignation, setSignerDesignation] = useState(
    proposal.digitalSignature?.signerDesignation ||
      proposal.agreementDetails?.clientDesignation ||
      'Principal / Authorized Signatory'
  );
  const [signerEmail, setSignerEmail] = useState(
    proposal.digitalSignature?.signerEmail || proposal.leadEmail || ''
  );
  const [signerPhone, setSignerPhone] = useState(
    proposal.digitalSignature?.signerPhone || ''
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signatureNotes, setSignatureNotes] = useState('');

  // Typing mode font style selection
  const [typedFontIndex, setTypedFontIndex] = useState<number>(0);
  const TYPED_FONTS = [
    { name: 'Classic Formal', className: 'font-serif italic text-2xl tracking-wide text-slate-900' },
    { name: 'Executive Script', className: 'font-mono italic text-2xl font-bold tracking-tight text-[#0A2540]' },
    { name: 'Cursive Signature', className: 'italic text-3xl font-light text-slate-800 tracking-wider' },
  ];

  // Uploaded signature state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Drawing Canvas Refs and States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [penColor, setPenColor] = useState<'navy' | 'black'>('navy');

  // Feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAgreementSummary, setShowAgreementSummary] = useState(false);
  const [isReSigning, setIsReSigning] = useState(false);

  // Initialize canvas listeners
  useEffect(() => {
    if (!isOpen || signatureMode !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = penColor === 'navy' ? '#002B49' : '#111827';
  }, [isOpen, signatureMode, penColor]);

  if (!isOpen) return null;

  const isAlreadySigned = !!proposal.digitalSignature && !isReSigning;
  const signatureUrl = getProposalSignatureUrl(proposal);

  // Clear Canvas
  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Drawing event handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Handle image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Generate image data from typed text
  const generateTypedSignatureDataUrl = (text: string, fontIdx: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#002B49';
    if (fontIdx === 0) {
      ctx.font = 'italic bold 38px "Times New Roman", Times, serif';
    } else if (fontIdx === 1) {
      ctx.font = 'italic bold 34px "Courier New", Courier, monospace';
    } else {
      ctx.font = 'italic 44px "Brush Script MT", cursive, sans-serif';
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text || 'Authorized Signature', canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  // Handle Form Submission
  const handleSubmitAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!signerName.trim()) {
      alert('Please provide the Authorized Signatory Full Name.');
      return;
    }
    if (!signerDesignation.trim()) {
      alert('Please provide your Official Designation (e.g. Principal, Director).');
      return;
    }
    if (!acceptedTerms) {
      alert('Please check the box confirming your official acceptance of the agreement terms.');
      return;
    }

    let finalSignatureImage = '';

    if (signatureMode === 'draw') {
      if (!hasDrawn || !canvasRef.current) {
        alert('Please draw your digital signature on the pad provided.');
        return;
      }
      finalSignatureImage = canvasRef.current.toDataURL('image/png');
    } else if (signatureMode === 'type') {
      if (!signerName.trim()) {
        alert('Please enter your name to generate your typed signature.');
        return;
      }
      finalSignatureImage = generateTypedSignatureDataUrl(signerName, typedFontIndex);
    } else if (signatureMode === 'upload') {
      if (!uploadedImage) {
        alert('Please upload an image file of your official signature or institutional stamp.');
        return;
      }
      finalSignatureImage = uploadedImage;
    }

    setIsSubmitting(true);

    try {
      const verificationCode = generateSignatureVerificationCode();
      const signedAt = new Date().toISOString();

      const signatureData: ProposalDigitalSignature = {
        signerName: signerName.trim(),
        signerDesignation: signerDesignation.trim(),
        signerEmail: signerEmail.trim(),
        signerPhone: signerPhone.trim() || undefined,
        instituteName: proposal.instituteName,
        signatureImage: finalSignatureImage,
        signatureType: signatureMode,
        signedAt,
        verificationCode,
        acceptedTerms: true,
        notes: signatureNotes.trim() || undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };

      onSignProposal(proposal.id, signatureData);
      setIsReSigning(false);
    } catch (err: any) {
      alert(`Error submitting proposal acceptance: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    const success = await copySignatureLinkToClipboard(proposal);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#0B5D2A] via-[#168A45] to-[#107038] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white border border-white/20">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight">
                  Proposal Acceptance & E-Signature Portal
                </h3>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                  {proposal.proposalNumber}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                {proposal.instituteName} • Official Digital Contract Signing
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleCopyLink}
              title="Copy Customer Signing Link"
              className="px-2.5 py-1 text-[11px] font-semibold bg-white/15 hover:bg-white/25 rounded-lg text-white transition-all flex items-center gap-1 border border-white/20"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3 h-3 text-emerald-200" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Signing Link</span>
                </>
              )}
            </button>

            {!isStandaloneCustomerView && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1 text-xs">
          {/* Top Info Strip: Contract Summary Cards */}
          <div className="bg-[#F7FAF8] border border-gray-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#168A45] tracking-wider">
                  Client Institution
                </span>
                <h4 className="text-sm font-black text-slate-800 mt-0.5">
                  {proposal.instituteName}
                </h4>
                <div className="flex items-center gap-3 text-[11px] text-slate-600 mt-0.5">
                  <span>Student Base: <strong className="text-slate-800">{proposal.studentCount} Students</strong></span>
                  <span>•</span>
                  <span>Plan: <strong className="text-slate-800">{proposal.pricingType}</strong></span>
                  <span>•</span>
                  <span>Annual Value: <strong className="text-[#0B5D2A]">{formatINR(proposal.totalAmount)}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onViewProposalDocument && (
                  <button
                    type="button"
                    onClick={() => onViewProposalDocument(proposal)}
                    className="px-2.5 py-1.5 bg-white border border-gray-300 hover:border-[#168A45] text-slate-700 hover:text-[#0B5D2A] rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#168A45]" />
                    <span>View Proposal</span>
                  </button>
                )}
                {onDownloadPdf && (
                  <button
                    type="button"
                    onClick={() => onDownloadPdf(proposal)}
                    className="px-2.5 py-1.5 bg-white border border-gray-300 hover:border-[#168A45] text-slate-700 hover:text-[#0B5D2A] rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#168A45]" />
                    <span>Download PDF</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3-Stage Payment Milestone Reminder */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#168A45]" />
                  Agreed 3-Stage Milestone Payment Schedule:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAgreementSummary(!showAgreementSummary)}
                  className="text-[10px] font-semibold text-[#0B5D2A] hover:underline flex items-center gap-0.5"
                >
                  {showAgreementSummary ? 'Hide Clause Details' : 'View Payment Clauses'}
                  {showAgreementSummary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-2xs">
                  <span className="text-[9px] font-bold uppercase text-[#168A45] bg-[#EAF7EF] px-1.5 py-0.5 rounded">
                    Stage 1
                  </span>
                  <div className="font-bold text-slate-900 mt-1">Registration Fee</div>
                  <div className="text-[10px] text-slate-500">Payable at time of registration (included in trial)</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-2xs">
                  <span className="text-[9px] font-bold uppercase text-[#168A45] bg-[#EAF7EF] px-1.5 py-0.5 rounded">
                    Stage 2
                  </span>
                  <div className="font-bold text-slate-900 mt-1">Balance 60%</div>
                  <div className="text-[10px] text-slate-500">Payable upon student onboarding</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-2xs">
                  <span className="text-[9px] font-bold uppercase text-[#168A45] bg-[#EAF7EF] px-1.5 py-0.5 rounded">
                    Stage 3
                  </span>
                  <div className="font-bold text-slate-900 mt-1">Balance 40%</div>
                  <div className="text-[10px] text-slate-500">Payable after two months</div>
                </div>
              </div>

              {showAgreementSummary && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg p-3 text-[10.5px] text-slate-600 space-y-1.5 animate-in fade-in">
                  <div className="font-bold text-slate-800">Formal Agreement Terms:</div>
                  <p>• Agreement Period: <strong>{proposal.agreementDetails?.agreementPeriod || '5 Years'}</strong> binding institutional service agreement.</p>
                  <p>• Trial Price: <strong>₹{proposal.agreementDetails?.trialPrice || 30}/student</strong> applicable for current academic year ({proposal.agreementDetails?.trialAcademicYear || '2026–2027'}).</p>
                  <p>• Service Provider: <strong>Casbiro Solutions Private Limited (MYSAR)</strong>.</p>
                  <p>• Electronic signatures collected through this portal carry legal validity under the Information Technology Act, 2000 (E-Sign provisions).</p>
                </div>
              )}
            </div>
          </div>

          {/* If already signed and not in re-signing mode, show Verified Certificate */}
          {isAlreadySigned && proposal.digitalSignature ? (
            <div className="bg-emerald-50/70 border-2 border-[#168A45]/30 rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF7EF] border border-[#168A45]/40 flex items-center justify-center text-[#168A45] shadow-xs">
                    <BadgeCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-black text-slate-900">
                        Proposal Digitally Signed & Accepted
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-[#168A45] text-white px-2 py-0.5 rounded-md">
                        Verified Execution
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Executed by authorized institutional representative on{' '}
                      <strong>{new Date(proposal.digitalSignature.signedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}</strong> at {new Date(proposal.digitalSignature.signedAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-mono">Verification Code</div>
                  <div className="text-xs font-mono font-bold text-[#0B5D2A] bg-white px-2 py-1 rounded border border-emerald-200 shadow-2xs">
                    {proposal.digitalSignature.verificationCode}
                  </div>
                </div>
              </div>

              {/* Recorded Signatory Data & Signature Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl p-4 border border-emerald-200/80 shadow-2xs">
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Signatory Details
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Name: </span>
                    <strong className="text-slate-800 text-xs">{proposal.digitalSignature.signerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Designation: </span>
                    <span className="text-slate-700">{proposal.digitalSignature.signerDesignation}</span>
                  </div>
                  {proposal.digitalSignature.signerEmail && (
                    <div>
                      <span className="text-slate-500 font-medium">Email: </span>
                      <span className="text-slate-700">{proposal.digitalSignature.signerEmail}</span>
                    </div>
                  )}
                  {proposal.digitalSignature.signerPhone && (
                    <div>
                      <span className="text-slate-500 font-medium">Mobile: </span>
                      <span className="text-slate-700">{proposal.digitalSignature.signerPhone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex flex-col justify-between border-t sm:border-t-0 sm:border-l sm:border-gray-100 sm:pl-4 pt-2 sm:pt-0">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recorded Electronic Signature
                  </div>
                  <div className="bg-[#F7FAF8] border border-gray-200 rounded-lg p-2 h-20 flex items-center justify-center">
                    <img
                      src={proposal.digitalSignature.signatureImage}
                      alt="Digital Signature"
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                  <div className="text-[9.5px] text-slate-400 text-right">
                    Type: <strong className="capitalize">{proposal.digitalSignature.signatureType}</strong> • Status: Valid
                  </div>
                </div>
              </div>

              {/* Certificate Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200/60">
                <div className="flex items-center gap-2">
                  {onViewProposalDocument && (
                    <button
                      type="button"
                      onClick={() => onViewProposalDocument(proposal)}
                      className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Signed Agreement</span>
                    </button>
                  )}
                  {onDownloadPdf && (
                    <button
                      type="button"
                      onClick={() => onDownloadPdf(proposal)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-300 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-[#168A45]" />
                      <span>Download Signed PDF</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsReSigning(true)}
                  className="text-slate-500 hover:text-slate-800 text-[11px] font-medium underline"
                >
                  Update / Re-sign Acceptance
                </button>
              </div>
            </div>
          ) : (
            /* Digital Signature Form */
            <form onSubmit={handleSubmitAcceptance} className="space-y-4">
              <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                  <UserIcon className="w-4 h-4 text-[#168A45]" />
                  <h4 className="font-bold text-slate-800 text-xs">
                    1. Authorized Signatory Information
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Signatory Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="e.g. Dr. K. Ramanathan"
                      className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-semibold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Official Designation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={signerDesignation}
                      onChange={(e) => setSignerDesignation(e.target.value)}
                      placeholder="e.g. Principal / Secretary / Director"
                      className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Official Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      placeholder="principal@institution.edu.in"
                      className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mobile / WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={signerPhone}
                      onChange={(e) => setSignerPhone(e.target.value)}
                      placeholder="+91 98400 00000"
                      className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Signature Capture Section */}
              <div className="border border-gray-200 rounded-xl p-4 bg-white space-y-3 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div className="flex items-center space-x-2">
                    <PenTool className="w-4 h-4 text-[#168A45]" />
                    <h4 className="font-bold text-slate-800 text-xs">
                      2. Electronic Signature Input
                    </h4>
                  </div>

                  {/* Mode Selector Tabs */}
                  <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setSignatureMode('draw')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 transition-all ${
                        signatureMode === 'draw'
                          ? 'bg-white text-[#0B5D2A] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <PenTool className="w-3 h-3" />
                      <span>Draw</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode('type')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 transition-all ${
                        signatureMode === 'type'
                          ? 'bg-white text-[#0B5D2A] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Type className="w-3 h-3" />
                      <span>Type</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode('upload')}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md flex items-center gap-1 transition-all ${
                        signatureMode === 'upload'
                          ? 'bg-white text-[#0B5D2A] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </div>
                </div>

                {/* Mode 1: DRAW CANVAS */}
                {signatureMode === 'draw' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Draw your signature inside the box using your mouse, stylus, or finger:</span>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setPenColor('navy')}
                            className={`w-4 h-4 rounded-full bg-[#002B49] border-2 transition-all ${
                              penColor === 'navy' ? 'border-[#168A45] scale-110' : 'border-transparent'
                            }`}
                            title="Navy Ink"
                          />
                          <button
                            type="button"
                            onClick={() => setPenColor('black')}
                            className={`w-4 h-4 rounded-full bg-slate-900 border-2 transition-all ${
                              penColor === 'black' ? 'border-[#168A45] scale-110' : 'border-transparent'
                            }`}
                            title="Black Ink"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleClearCanvas}
                          className="text-[#0B5D2A] hover:text-rose-600 text-[11px] font-semibold flex items-center gap-0.5"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Clear Pad</span>
                        </button>
                      </div>
                    </div>

                    <div className="relative border-2 border-dashed border-gray-300 rounded-xl bg-[#FCFDFD] overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-36 cursor-crosshair touch-none"
                      />
                      {!hasDrawn && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs italic">
                          Sign here...
                        </div>
                      )}
                      <div className="absolute bottom-1 right-2 pointer-events-none text-[9px] text-slate-400">
                        Official Electronic Signature Pad
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 2: TYPE SIGNATURE */}
                {signatureMode === 'type' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-600 mb-1">
                        Select Cursive Legal Style:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {TYPED_FONTS.map((font, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setTypedFontIndex(idx)}
                            className={`p-2 rounded-xl border text-center transition-all ${
                              typedFontIndex === idx
                                ? 'border-[#168A45] bg-[#EAF7EF] text-[#0B5D2A] font-bold shadow-2xs'
                                : 'border-gray-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span className="text-[10px] block">{font.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-gray-300 rounded-xl bg-[#FCFDFD] p-4 text-center min-h-[100px] flex items-center justify-center">
                      <div className={TYPED_FONTS[typedFontIndex].className}>
                        {signerName || 'Your Name Here'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Mode 3: UPLOAD SIGNATURE / STAMP */}
                {signatureMode === 'upload' && (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl bg-[#FCFDFD] p-4 text-center">
                      {uploadedImage ? (
                        <div className="space-y-2">
                          <img
                            src={uploadedImage}
                            alt="Uploaded Signature"
                            className="max-h-24 mx-auto object-contain"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadedImage(null)}
                            className="text-rose-600 text-xs font-semibold hover:underline"
                          >
                            Remove and select another
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                          <div className="text-xs text-slate-600">
                            Upload a scanned signature image or institutional seal (PNG/JPG)
                          </div>
                          <label className="inline-block px-3.5 py-1.5 bg-white border border-gray-300 hover:border-[#168A45] text-slate-700 hover:text-[#0B5D2A] rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs">
                            <span>Browse File</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/webp"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Legal Declaration Checkbox */}
              <div className="bg-[#EAF7EF]/60 border border-[#168A45]/30 rounded-xl p-3.5 space-y-2">
                <label className="flex items-start space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-[#168A45] focus:ring-[#168A45] w-4 h-4"
                  />
                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    <strong className="text-slate-900 block mb-0.5">
                      Binding Electronic Acceptance & Contract Confirmation:
                    </strong>
                    I hereby certify that I am an authorized signatory for{' '}
                    <span className="font-semibold text-slate-900">{proposal.instituteName}</span>.
                    I have reviewed and agree to the proposed scope of work, deliverables, five (5) year
                    subscription terms, and the agreed 3-stage milestone payment schedule (Registration Fee,
                    60% balance upon student onboarding, and 40% balance after two months) as documented in{' '}
                    <span className="font-mono font-bold text-[#0B5D2A]">{proposal.proposalNumber}</span>.
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                {!isStandaloneCustomerView && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isReSigning) {
                        setIsReSigning(false);
                      } else {
                        onClose();
                      }
                    }}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all text-xs"
                  >
                    Cancel
                  </button>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 disabled:opacity-50 text-xs cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmitting ? 'Recording Acceptance...' : 'Sign & Accept Proposal'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Security Stamp */}
        <div className="bg-[#F7FAF8] border-t border-gray-200 px-5 py-2 text-[10.5px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-1 shadow-2xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#168A45]" />
            256-Bit Encrypted & Legally Binding Electronic Acceptance (IT Act 2000 / E-Sign)
          </span>
          <span className="text-slate-400">
            Casbiro Solutions Private Limited • MYSAR Enterprise ERP
          </span>
        </div>
      </div>
    </div>
  );
};
