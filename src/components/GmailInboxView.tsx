import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Mail,
  Send,
  Inbox,
  SendHorizontal,
  FileEdit,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User as UserIcon,
  Building2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  ShieldCheck,
  Check,
  Eye,
  Paperclip,
  LogOut,
  ArrowLeft,
  X,
  FileText,
} from 'lucide-react';
import { Lead, Proposal, User } from '../types';
import {
  initAuth,
  googleSignIn,
  logoutGmail,
  getAccessToken,
} from '../services/gmailAuthService';
import {
  getGmailProfile,
  listGmailMessages,
  getGmailMessage,
  sendGmailEmail,
  createGmailDraft,
  deleteGmailMessage,
  GmailMessageSummary,
  GmailUserProfile,
} from '../services/gmailApiService';
import { formatINR } from '../utils/pdfGenerator';

interface GmailInboxViewProps {
  leads: Lead[];
  proposals: Proposal[];
  currentUser: User;
  initialLeadId?: string;
  onOpenComposeWithLead?: (lead: Lead) => void;
}

// Preset Email Templates for Educational CRM
const EMAIL_TEMPLATES = [
  {
    id: 'intro',
    name: 'MYSAR ERP & Academy Introduction',
    subject: 'Transforming Campus Operations with MYSAR Suite - Casbiro Solutions',
    bodyText: (lead?: Lead) => `Dear ${lead?.contactPerson || 'Respected Administrator'},

Greetings from MYSAR by Casbiro Solutions!

We are pleased to introduce MYSAR, an advanced next-generation institutional management and academic ERP suite designed specifically for progressive institutions like ${lead?.instituteName || 'your esteemed campus'}.

Key Modules & Benefits:
• Integrated Academic, Attendance & Examination Automation
• Student Information System (SIS) & Parent Communication Mobile App
• Fee Management with automated receipting & digital payment gateways
• Campus RFID, Biometric & GPS Fleet Tracking

We would love to arrange a 20-minute executive presentation for your academic council and leadership team at your convenience.

Best regards,
MYSAR Institutional Relations Team
Casbiro Solutions Private Limited
https://mysar.in`,
  },
  {
    id: 'proposal',
    name: 'Commercial Proposal & Quotation Delivery',
    subject: (lead?: Lead, prop?: Proposal) =>
      `Commercial Proposal [${prop?.proposalNumber || 'MYSAR-PROP'}] - MYSAR Institutional Suite for ${lead?.instituteName || 'Campus'}`,
    bodyText: (lead?: Lead, prop?: Proposal) => `Dear ${lead?.contactPerson || 'Institutional Head'},

We are delighted to submit our customized commercial proposal for deploying the MYSAR Institutional Management Suite across ${lead?.instituteName || 'your campus'}.

Proposal Highlights:
• Proposal Reference: ${prop?.proposalNumber || 'PROPOSAL-REF'}
• Target Student Base: ${prop?.studentCount || 'Full Campus'} Students
• Total Annual Investment: ${prop ? formatINR(prop.totalAmount) : 'As per quotation'} (${prop?.pricingType || 'Standard Plan'})

Please find our complete 14-page formal commercial proposal attached for your board's review. We look forward to scheduling our formal contract finalization meeting.

Warm regards,
Sales & Implementation Director
Casbiro Solutions Private Limited`,
  },
  {
    id: 'demo_followup',
    name: 'Demo Scheduling & Follow-up',
    subject: (lead?: Lead) => `Follow-up: MYSAR Product Walkthrough & Next Steps - ${lead?.instituteName || 'Your Campus'}`,
    bodyText: (lead?: Lead) => `Dear ${lead?.contactPerson || 'Principal / Administrator'},

Thank you for your valuable time and interest in exploring the MYSAR ERP suite for ${lead?.instituteName || 'your institution'}.

As discussed, we would be glad to conduct a comprehensive live walkthrough covering:
1. Multi-branch Administration & Student Lifecycle
2. Dynamic Fee Collections & Real-Time Financial Audits
3. Parent Mobile App & Real-Time WhatsApp Notifications

Please let us know if this coming week works for your administrative team.

Best regards,
Casbiro Solutions Team`,
  },
];

export const GmailInboxView: React.FC<GmailInboxViewProps> = ({
  leads,
  proposals,
  currentUser,
  initialLeadId,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<GmailUserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Mail navigation
  const [mailFolder, setMailFolder] = useState<'INBOX' | 'SENT' | 'DRAFT' | 'LEADS'>('INBOX');
  const [selectedLeadFilter, setSelectedLeadFilter] = useState<string>(initialLeadId || 'All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Messages list state
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [loadingMessageDetail, setLoadingMessageDetail] = useState<boolean>(false);

  // Compose modal state
  const [isComposeOpen, setIsComposeOpen] = useState<boolean>(false);
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeCc, setComposeCc] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [composeSelectedLead, setComposeSelectedLead] = useState<Lead | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Confirmation dialogs (Mandatory for destructive/send actions)
  const [confirmSendOpen, setConfirmSendOpen] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Check auth state on load
  useEffect(() => {
    const unsubscribe = initAuth(
      async (_user, token) => {
        if (token) {
          setIsAuthenticated(true);
          loadProfile();
        }
      },
      () => {
        setIsAuthenticated(false);
        setUserProfile(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await getGmailProfile();
      setUserProfile(profile);
    } catch (e: any) {
      console.warn('Could not load Gmail profile directly:', e.message);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setIsAuthenticated(true);
        loadProfile();
        setActionSuccessMessage('Successfully connected to Gmail!');
        setTimeout(() => setActionSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Failed to authenticate with Google Gmail');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logoutGmail();
    setIsAuthenticated(false);
    setUserProfile(null);
    setMessages([]);
    setSelectedMessage(null);
  };

  // Load emails based on folder and lead filter
  const loadMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoadingMessages(true);
    try {
      let queryParts: string[] = [];

      if (mailFolder === 'INBOX') {
        // Standard inbox
      } else if (mailFolder === 'SENT') {
        queryParts.push('in:sent');
      } else if (mailFolder === 'DRAFT') {
        queryParts.push('in:draft');
      }

      // If filtering by specific lead
      if (selectedLeadFilter !== 'All') {
        const lead = leads.find((l) => l.id === selectedLeadFilter);
        if (lead && lead.email) {
          queryParts.push(`(to:${lead.email} OR from:${lead.email} OR "${lead.instituteName}")`);
        } else if (lead) {
          queryParts.push(`"${lead.instituteName}"`);
        }
      }

      if (searchQuery.trim()) {
        queryParts.push(searchQuery.trim());
      }

      const q = queryParts.join(' ');
      const labelIds = mailFolder === 'INBOX' ? ['INBOX'] : undefined;

      const listRes = await listGmailMessages({
        query: q || undefined,
        labelIds,
        maxResults: 15,
      });

      if (listRes.messages && listRes.messages.length > 0) {
        // Fetch summaries in parallel for fast snappy rendering
        const detailPromises = listRes.messages.slice(0, 15).map((m) =>
          getGmailMessage(m.id).catch(() => null)
        );
        const results = await Promise.all(detailPromises);
        const validMsgs = results.filter((m): m is GmailMessageSummary => m !== null);
        setMessages(validMsgs);
      } else {
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Error fetching Gmail messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [isAuthenticated, mailFolder, selectedLeadFilter, searchQuery, leads]);

  useEffect(() => {
    if (isAuthenticated) {
      loadMessages();
    }
  }, [isAuthenticated, loadMessages]);

  // Open full message detail
  const handleSelectMessage = async (summary: GmailMessageSummary) => {
    setSelectedMessage(summary);
  };

  // Quick Compose for a Lead
  const handleOpenComposeForLead = (lead: Lead) => {
    setComposeSelectedLead(lead);
    setComposeTo(lead.email || '');
    const defaultTemplate = EMAIL_TEMPLATES[0];
    setComposeSubject(defaultTemplate.subject);
    setComposeBody(defaultTemplate.bodyText(lead));
    setIsComposeOpen(true);
  };

  // Template change
  const handleApplyTemplate = (templateId: string) => {
    const tpl = EMAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const lead = composeSelectedLead || leads.find((l) => l.email === composeTo);
    const prop = proposals.find((p) => p.leadId === lead?.id);
    const subj = typeof tpl.subject === 'function' ? tpl.subject(lead, prop) : tpl.subject;
    const body = tpl.bodyText(lead, prop);
    setComposeSubject(subj);
    setComposeBody(body);
  };

  // Confirmation before sending
  const handleRequestSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      alert('Please enter at least one recipient email address.');
      return;
    }
    setConfirmSendOpen(true);
  };

  // Confirmed Send Execution
  const handleExecuteSend = async () => {
    setConfirmSendOpen(false);
    setIsSending(true);
    try {
      await sendGmailEmail({
        to: composeTo,
        cc: composeCc || undefined,
        subject: composeSubject,
        bodyText: composeBody,
      });
      setIsComposeOpen(false);
      setComposeTo('');
      setComposeCc('');
      setComposeSubject('');
      setComposeBody('');
      setActionSuccessMessage(`Email successfully dispatched via Gmail to ${composeTo}`);
      setTimeout(() => setActionSuccessMessage(null), 4000);
      loadMessages();
    } catch (err: any) {
      alert(`Error sending email: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Confirmed Delete Execution
  const handleExecuteDelete = async () => {
    if (!confirmDeleteId) return;
    const msgId = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      await deleteGmailMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      if (selectedMessage?.id === msgId) {
        setSelectedMessage(null);
      }
      setActionSuccessMessage('Email moved to Trash in Gmail.');
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Error deleting message: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Header & Global Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#168A45]" />
              Gmail Communications Hub
            </h2>
            {isAuthenticated ? (
              <span className="bg-[#EAF7EF] text-[#0B5D2A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168A45] animate-pulse"></span>
                Connected
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                Action Required: Connect Account
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Directly send institutional proposals, schedule product demos, and track official email correspondence with prospective schools.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setComposeSelectedLead(null);
                setComposeTo('');
                setComposeCc('');
                setComposeSubject(EMAIL_TEMPLATES[0].subject);
                setComposeBody(EMAIL_TEMPLATES[0].bodyText());
                setIsComposeOpen(true);
              }}
              className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Email</span>
            </button>

            <button
              onClick={loadMessages}
              disabled={isLoadingMessages}
              className="p-2 text-slate-600 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded-xl border border-gray-200 transition-colors"
              title="Refresh Mailbox"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMessages ? 'animate-spin text-[#168A45]' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3 bg-[#EAF7EF] border border-[#168A45]/30 text-[#0B5D2A] text-xs font-bold rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* AUTHENTICATION PROMPT CARD (If not connected) */}
      {!isAuthenticated && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 max-w-2xl mx-auto my-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#EAF7EF] text-[#168A45] flex items-center justify-center mx-auto shadow-2xs">
            <Mail className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">
              Connect Your Official Google Account
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Enable real-time Gmail integration to send formatted commercial proposals, schedule demo follow-ups, and log communications with school decision-makers.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSignIn}
              disabled={isAuthenticating}
              className="gsi-material-button mx-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <div className="gsi-material-button-content-wrapper flex items-center space-x-3">
                <div className="gsi-material-button-icon w-5 h-5">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                </div>
                <span>{isAuthenticating ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </div>
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400 border-t border-gray-100 pt-3">
            Secure token management with least privilege access • All transmissions secured via Google Identity Services
          </div>
        </div>
      )}

      {/* AUTHENTICATED GMAIL WORKSPACE */}
      {isAuthenticated && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Navigation & Lead Quick-Filters (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Account Info Pill */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-[#168A45] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {userProfile?.emailAddress?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {userProfile?.emailAddress || 'Connected Account'}
                    </div>
                    <div className="text-[10px] text-[#168A45] font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Gmail API Active
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Disconnect Google Account"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Folder Selectors */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                Mailbox Views
              </div>
              <button
                onClick={() => {
                  setMailFolder('INBOX');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mailFolder === 'INBOX'
                    ? 'bg-[#EAF7EF] text-[#0B5D2A]'
                    : 'text-slate-700 hover:bg-[#F7FAF8]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Inbox className="w-4 h-4 text-[#168A45]" />
                  <span>Inbox</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setMailFolder('SENT');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mailFolder === 'SENT'
                    ? 'bg-[#EAF7EF] text-[#0B5D2A]'
                    : 'text-slate-700 hover:bg-[#F7FAF8]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <SendHorizontal className="w-4 h-4 text-[#168A45]" />
                  <span>Sent Items</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setMailFolder('DRAFT');
                  setSelectedMessage(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  mailFolder === 'DRAFT'
                    ? 'bg-[#EAF7EF] text-[#0B5D2A]'
                    : 'text-slate-700 hover:bg-[#F7FAF8]'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <FileEdit className="w-4 h-4 text-[#168A45]" />
                  <span>Drafts</span>
                </div>
              </button>
            </div>

            {/* Quick Filter by Lead / School */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#168A45]" />
                  Filter by Lead
                </span>
                {selectedLeadFilter !== 'All' && (
                  <button
                    onClick={() => setSelectedLeadFilter('All')}
                    className="text-[10px] text-[#168A45] font-bold hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>

              <select
                value={selectedLeadFilter}
                onChange={(e) => {
                  setSelectedLeadFilter(e.target.value);
                  setSelectedMessage(null);
                }}
                className="w-full text-xs bg-[#F7FAF8] border border-gray-200 rounded-xl p-2 font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#168A45]"
              >
                <option value="All">All Leads / Inboxes</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.instituteName} ({l.contactPerson})
                  </option>
                ))}
              </select>

              {/* Quick List of High Priority Leads to Email */}
              <div className="space-y-1.5 pt-1">
                <div className="text-[10px] font-bold text-slate-400">Quick Outreach:</div>
                {leads.slice(0, 4).map((l) => (
                  <div
                    key={l.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#F7FAF8] hover:bg-[#EAF7EF] transition-colors text-xs"
                  >
                    <div className="truncate mr-2">
                      <div className="font-bold text-slate-800 truncate">{l.instituteName}</div>
                      <div className="text-[10px] text-slate-500 truncate">{l.email || 'No email'}</div>
                    </div>
                    <button
                      onClick={() => handleOpenComposeForLead(l)}
                      className="text-[10px] bg-[#168A45] text-white px-2 py-0.5 rounded-md font-bold shrink-0 hover:bg-[#0B5D2A]"
                    >
                      Email
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center / Right: Messages List & Thread View (9 Cols) */}
          <div className="lg:col-span-9 space-y-4">
            {/* Search and Filters Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Gmail messages, subject, institute name..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium shrink-0">
                {messages.length} messages found
              </div>
            </div>

            {/* Split Message List & Detail */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Messages List (5 Cols) */}
              <div className="md:col-span-5 bg-white border border-gray-200 rounded-2xl p-3 shadow-xs space-y-2 max-h-[650px] overflow-y-auto">
                {isLoadingMessages ? (
                  <div className="py-16 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-[#168A45] animate-spin mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">Syncing Gmail messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => handleSelectMessage(msg)}
                        className={`p-3 rounded-xl cursor-pointer border transition-all ${
                          isSelected
                            ? 'bg-[#EAF7EF] border-[#168A45] shadow-xs'
                            : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-[#F7FAF8]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-slate-800 truncate max-w-[170px]">
                            {msg.from.split('<')[0].replace(/"/g, '') || msg.from}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {new Date(msg.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="text-xs font-semibold text-slate-700 truncate">
                          {msg.subject}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                          {msg.snippet}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-14 text-center space-y-2">
                    <Mail className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600">No emails found</p>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      No matching correspondence in this folder. Try clearing your search or sending an outreach email!
                    </p>
                  </div>
                )}
              </div>

              {/* Message Reading Pane (7 Cols) */}
              <div className="md:col-span-7 bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[500px]">
                {selectedMessage ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="border-b border-gray-100 pb-3 flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 leading-snug">
                          {selectedMessage.subject}
                        </h3>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                          <span className="font-semibold text-slate-700">From:</span>
                          <span>{selectedMessage.from}</span>
                        </div>
                        {selectedMessage.to && (
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                            <span className="font-semibold text-slate-700">To:</span>
                            <span>{selectedMessage.to}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(selectedMessage.date).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setComposeTo(
                              selectedMessage.from.match(/<([^>]+)>/)?.[1] || selectedMessage.from
                            );
                            setComposeSubject(`Re: ${selectedMessage.subject.replace(/^Re:\s*/i, '')}`);
                            setComposeBody(`\n\n--- On ${selectedMessage.date}, wrote: ---\n${selectedMessage.bodyText || selectedMessage.snippet}`);
                            setIsComposeOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-[#EAF7EF] hover:bg-[#168A45] text-[#0B5D2A] hover:text-white rounded-lg text-xs font-bold transition-all"
                        >
                          Reply
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(selectedMessage.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Email"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Email Body Content */}
                    <div className="text-xs text-slate-700 leading-relaxed max-h-[420px] overflow-y-auto p-2 bg-[#F7FAF8] rounded-xl border border-gray-100">
                      {selectedMessage.bodyHtml ? (
                        <div
                          className="prose prose-sm max-w-none text-slate-800"
                          dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }}
                        />
                      ) : (
                        <pre className="font-sans whitespace-pre-wrap">
                          {selectedMessage.bodyText || selectedMessage.snippet}
                        </pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="m-auto text-center py-20 space-y-2">
                    <Mail className="w-10 h-10 text-slate-200 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-700">Select an email to view</h4>
                    <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                      Choose any message from the left or use the Compose button to initiate fresh outreach.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE EMAIL MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#F7FAF8] border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-[#168A45]" />
                <h3 className="text-sm font-bold text-slate-800">
                  Compose Email via Gmail
                </h3>
              </div>
              <button
                onClick={() => setIsComposeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Template Selector Bar */}
            <div className="px-5 py-2.5 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between text-xs overflow-x-auto gap-2">
              <span className="font-bold text-[#0B5D2A] flex items-center gap-1 shrink-0">
                <Sparkles className="w-3.5 h-3.5 text-[#168A45]" />
                Preset Templates:
              </span>
              <div className="flex items-center space-x-1.5 shrink-0">
                {EMAIL_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl.id)}
                    className="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-emerald-200 hover:bg-emerald-100 text-[#0B5D2A] transition-all"
                  >
                    {tpl.name.split(' ')[0]} {tpl.name.split(' ')[1] || ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Compose Form */}
            <form onSubmit={handleRequestSend} className="p-5 space-y-3.5 overflow-y-auto flex-1 text-xs">
              {/* To field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Recipient Email (To) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="principal@institution.edu.in, admin@school.org"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-medium"
                />
              </div>

              {/* CC field */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cc (Optional)
                </label>
                <input
                  type="text"
                  placeholder="director@institution.edu.in"
                  value={composeCc}
                  onChange={(e) => setComposeCc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-medium"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Subject of the email"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-semibold text-slate-800"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Email Message Body <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={9}
                  required
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  placeholder="Type your official message here..."
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-sans text-xs leading-relaxed"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-all text-xs"
                >
                  Cancel
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    disabled={isSending}
                    className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-5 py-2 rounded-xl font-bold flex items-center space-x-2 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR SENDING EMAILS */}
      {confirmSendOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#EAF7EF] rounded-xl text-[#168A45]">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Confirm Sending Email via Gmail
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to send this email from your connected Google account?
            </p>

            <div className="bg-[#F7FAF8] p-3 rounded-xl border border-gray-200 text-xs space-y-1">
              <div>
                <span className="font-bold text-slate-700">To:</span>{' '}
                <span className="text-[#0B5D2A] font-semibold">{composeTo}</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">Subject:</span>{' '}
                <span className="text-slate-800">{composeSubject}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmSendOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteSend}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#168A45] hover:bg-[#0B5D2A] text-white shadow-xs transition-all"
              >
                Yes, Send Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION DIALOG FOR DELETING EMAILS */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Confirm Email Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove this message from your Gmail inbox? This will delete the message from your Google account.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all"
              >
                Yes, Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
