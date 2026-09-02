import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building2,
  Mail,
  Send,
  RefreshCw,
  Search,
  ShieldCheck,
  LogOut,
  PhoneCall,
  Share2,
  X,
  Play,
} from 'lucide-react';
import { Lead, ScheduledMeeting, GoogleMeetSpace, GoogleMeetConferenceRecord, User } from '../types';
import { storage } from '../services/storageService';
import {
  initAuth,
  googleSignIn,
  logoutGmail,
  getAccessToken,
} from '../services/gmailAuthService';
import {
  createMeetSpace,
  getMeetSpace,
  listConferenceRecords,
} from '../services/googleMeetApiService';
import { sendGmailEmail } from '../services/gmailApiService';

interface GoogleMeetViewProps {
  leads: Lead[];
  currentUser: User;
  onOpenGmailForLead?: (lead: Lead) => void;
}

export const GoogleMeetView: React.FC<GoogleMeetViewProps> = ({
  leads,
  currentUser,
  onOpenGmailForLead,
}) => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Meetings state
  const [meetings, setMeetings] = useState<ScheduledMeeting[]>([]);
  const [conferenceRecords, setConferenceRecords] = useState<GoogleMeetConferenceRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [filterTab, setFilterTab] = useState<'UPCOMING' | 'ALL' | 'PAST_RECORDS'>('UPCOMING');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Instant Meeting State
  const [isCreatingInstantMeet, setIsCreatingInstantMeet] = useState<boolean>(false);
  const [createdInstantSpace, setCreatedInstantSpace] = useState<GoogleMeetSpace | null>(null);
  const [instantLeadId, setInstantLeadId] = useState<string>('');

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [schedTitle, setSchedTitle] = useState<string>('MYSAR Institutional ERP Demo Walkthrough');
  const [schedLeadId, setSchedLeadId] = useState<string>('');
  const [schedDate, setSchedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [schedTime, setSchedTime] = useState<string>('11:00');
  const [schedDuration, setSchedDuration] = useState<number>(45);
  const [schedEmails, setSchedEmails] = useState<string>('');
  const [schedAgenda, setSchedAgenda] = useState<string>(
    'Comprehensive product walkthrough of MYSAR ERP: Academic Timetable, Biometric Attendance, Parent Mobile App & Fee Gateway.'
  );
  const [schedSendEmailInvite, setSchedSendEmailInvite] = useState<boolean>(true);
  const [isScheduling, setIsScheduling] = useState<boolean>(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Confirm delete dialog
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Load meetings on mount
  const refreshMeetings = useCallback(() => {
    const list = storage.getMeetings();
    setMeetings(list);
  }, []);

  useEffect(() => {
    refreshMeetings();
  }, [refreshMeetings]);

  // Check auth state on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      async (_user, token) => {
        if (token) {
          setIsAuthenticated(true);
          loadConferenceLogs();
        }
      },
      () => {
        setIsAuthenticated(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadConferenceLogs = async () => {
    setIsLoadingRecords(true);
    try {
      const records = await listConferenceRecords(10);
      setConferenceRecords(records);
    } catch (e) {
      console.warn('Could not load past conference records:', e);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setIsAuthenticated(true);
        loadConferenceLogs();
        showToast('Successfully connected to Google Meet & Workspace!');
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Failed to authenticate with Google Meet');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logoutGmail();
    setIsAuthenticated(false);
    setConferenceRecords([]);
    showToast('Signed out of Google Workspace');
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Instant Meet Creation
  const handleCreateInstantMeet = async () => {
    setIsCreatingInstantMeet(true);
    try {
      const space = await createMeetSpace({ accessType: 'OPEN' });
      setCreatedInstantSpace(space);

      // If associated with a lead, save to meetings list & activity
      const lead = leads.find((l) => l.id === instantLeadId);
      const today = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().slice(0, 5);

      storage.saveMeeting(
        {
          title: lead
            ? `Instant Product Walkthrough - ${lead.instituteName}`
            : 'Instant MYSAR Product Demo',
          leadId: lead?.id,
          instituteName: lead?.instituteName,
          contactPerson: lead?.contactPerson,
          participantEmails: lead?.email ? [lead.email] : [],
          meetingUri: space.meetingUri,
          meetingCode: space.meetingCode,
          scheduledDate: today,
          scheduledTime: timeStr,
          durationMinutes: 30,
          agenda: 'Live product walkthrough and council presentation.',
          status: 'Scheduled',
          spaceName: space.name,
          createdBy: currentUser.name,
        },
        currentUser.name
      );

      refreshMeetings();
      showToast('Google Meet Room created successfully!');
    } catch (err: any) {
      console.error('Error creating instant meet:', err);
      alert(`Could not create Google Meet space: ${err.message}`);
    } finally {
      setIsCreatingInstantMeet(false);
    }
  };

  // Scheduled Meet Submission
  const handleScheduleMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScheduling(true);
    try {
      // 1. Create Google Meet Space
      let meetingUri = 'https://meet.google.com/new';
      let meetingCode = '';
      let spaceName = '';

      try {
        const space = await createMeetSpace({ accessType: 'OPEN' });
        meetingUri = space.meetingUri;
        meetingCode = space.meetingCode;
        spaceName = space.name;
      } catch (err) {
        console.warn('Fallback link for Meet space creation:', err);
      }

      // 2. Resolve lead and participant emails
      const lead = leads.find((l) => l.id === schedLeadId);
      const parsedEmails = schedEmails
        .split(/[,;\s]+/)
        .map((e) => e.trim())
        .filter((e) => e.includes('@'));

      if (lead?.email && !parsedEmails.includes(lead.email)) {
        parsedEmails.unshift(lead.email);
      }

      // 3. Save to Storage
      const newMeeting = storage.saveMeeting(
        {
          title: schedTitle,
          leadId: lead?.id,
          instituteName: lead?.instituteName,
          contactPerson: lead?.contactPerson,
          participantEmails: parsedEmails,
          meetingUri,
          meetingCode,
          scheduledDate: schedDate,
          scheduledTime: schedTime,
          durationMinutes: schedDuration,
          agenda: schedAgenda,
          status: 'Scheduled',
          spaceName,
          createdBy: currentUser.name,
        },
        currentUser.name
      );

      // 4. Optionally dispatch invitation email via Gmail if user is authenticated
      if (schedSendEmailInvite && parsedEmails.length > 0 && isAuthenticated) {
        try {
          const emailSubject = `Google Meet Invitation: ${schedTitle} [${schedDate} at ${schedTime}]`;
          const emailBody = `Dear ${lead?.contactPerson || 'Colleague'},

You are invited to a live Google Meet virtual presentation & product walkthrough for ${lead?.instituteName || 'your esteemed campus'}.

Meeting Details:
• Title: ${schedTitle}
• Date: ${schedDate}
• Time: ${schedTime} (${schedDuration} mins)
• Google Meet Link: ${meetingUri}
• Meeting Code: ${meetingCode || 'N/A'}

Agenda:
${schedAgenda}

Looking forward to our discussion.

Best regards,
${currentUser.name}
MYSAR Institutional Team
Casbiro Solutions Private Limited`;

          await sendGmailEmail({
            to: parsedEmails.join(', '),
            subject: emailSubject,
            bodyText: emailBody,
          });
        } catch (emailErr) {
          console.warn('Could not auto-send Gmail invite:', emailErr);
        }
      }

      refreshMeetings();
      setIsScheduleModalOpen(false);
      showToast('Demo Meeting scheduled with Google Meet!');
    } catch (err: any) {
      alert(`Error scheduling meeting: ${err.message}`);
    } finally {
      setIsScheduling(false);
    }
  };

  // Delete / Cancel Meeting
  const handleExecuteDelete = () => {
    if (!confirmDeleteId) return;
    storage.deleteMeeting(confirmDeleteId);
    setConfirmDeleteId(null);
    refreshMeetings();
    showToast('Meeting removed from schedule.');
  };

  // Filtered Meetings
  const todayStr = new Date().toISOString().split('T')[0];
  const filteredMeetings = meetings.filter((m) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        m.title.toLowerCase().includes(q) ||
        (m.instituteName && m.instituteName.toLowerCase().includes(q)) ||
        (m.contactPerson && m.contactPerson.toLowerCase().includes(q)) ||
        m.meetingCode.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterTab === 'UPCOMING') {
      return m.scheduledDate >= todayStr && m.status === 'Scheduled';
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Global Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#168A45] flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              Google Meet Collaboration Hub
            </h2>
            {isAuthenticated ? (
              <span className="bg-[#EAF7EF] text-[#0B5D2A] text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#168A45] animate-pulse"></span>
                Meet API Live
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                Connect Google Account
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create real-time Google Meet conference rooms, host live campus walkthroughs, and schedule virtual product demos with school leadership.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsScheduleModalOpen(true)}
              className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Demo Call</span>
            </button>
            <button
              onClick={handleLogout}
              title="Disconnect Google Account"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-gray-200 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="p-3 bg-[#EAF7EF] border border-[#168A45]/30 text-[#0B5D2A] text-xs font-bold rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* AUTHENTICATION PROMPT CARD (If not connected) */}
      {!isAuthenticated && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4 max-w-2xl mx-auto my-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#168A45] flex items-center justify-center mx-auto shadow-2xs">
            <Video className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800">
              Connect Google Meet & Workspace
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
              Enable the Google Meet API to create virtual meeting rooms, auto-generate join links, and send instant demo invites directly to principals and trustees.
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
                <span>{isAuthenticating ? 'Connecting to Google Meet...' : 'Sign in with Google Workspace'}</span>
              </div>
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <div className="text-[11px] text-slate-400 border-t border-gray-100 pt-3">
            Google Meet API v2 • Meetings space created, readonly & settings scopes enabled
          </div>
        </div>
      )}

      {/* QUICK LAUNCH INSTANT DEMO BANNER */}
      {isAuthenticated && (
        <div className="bg-linear-to-r from-[#168A45]/10 via-[#EAF7EF] to-white border border-[#168A45]/30 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-[#168A45] text-white">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                Instant Google Meet Demo Room
              </h3>
            </div>
            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              Launch an ad-hoc conference space right now for instant screen-sharing, executive reviews, or on-the-spot product presentations with prospective schools.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <select
              value={instantLeadId}
              onChange={(e) => setInstantLeadId(e.target.value)}
              className="text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-[#168A45]"
            >
              <option value="">Attach to Lead (Optional)</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.instituteName}
                </option>
              ))}
            </select>

            <button
              onClick={handleCreateInstantMeet}
              disabled={isCreatingInstantMeet}
              className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all shadow-xs active:scale-95 disabled:opacity-50"
            >
              <Video className="w-4 h-4" />
              <span>{isCreatingInstantMeet ? 'Creating Room...' : 'Start Instant Demo'}</span>
            </button>
          </div>
        </div>
      )}

      {/* POPUP / MODAL WHEN INSTANT ROOM IS CREATED */}
      {createdInstantSpace && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-[#168A45]" />
              <h4 className="text-xs font-bold text-[#0B5D2A]">
                Google Meet Conference Room is Ready!
              </h4>
            </div>
            <button
              onClick={() => setCreatedInstantSpace(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-emerald-200 text-xs">
            <div>
              <div className="font-bold text-slate-800 flex items-center gap-2">
                <span>Meet Code: {createdInstantSpace.meetingCode || 'Direct URL'}</span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-md">
                {createdInstantSpace.meetingUri}
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() =>
                  copyToClipboard(createdInstantSpace.meetingUri, 'instant-meet')
                }
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold flex items-center space-x-1 transition-all"
              >
                {copiedId === 'instant-meet' ? (
                  <Check className="w-3.5 h-3.5 text-[#168A45]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedId === 'instant-meet' ? 'Copied' : 'Copy Link'}</span>
              </button>

              <a
                href={createdInstantSpace.meetingUri}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Join Google Meet Call</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MEETINGS DIRECTORY & LOGS */}
      <div className="space-y-4">
        {/* Navigation Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <button
              onClick={() => setFilterTab('UPCOMING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'UPCOMING'
                  ? 'bg-[#EAF7EF] text-[#0B5D2A] shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upcoming Demos ({meetings.filter((m) => m.status === 'Scheduled').length})
            </button>
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterTab === 'ALL'
                  ? 'bg-[#EAF7EF] text-[#0B5D2A] shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Scheduled Calls ({meetings.length})
            </button>
            {isAuthenticated && (
              <button
                onClick={() => {
                  setFilterTab('PAST_RECORDS');
                  loadConferenceLogs();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterTab === 'PAST_RECORDS'
                    ? 'bg-[#EAF7EF] text-[#0B5D2A] shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Conference Logs (Google API)
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search meetings, schools..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45]"
            />
          </div>
        </div>

        {/* TAB 1 & 2: SCHEDULED MEETINGS CARDS / TABLE */}
        {filterTab !== 'PAST_RECORDS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((m) => {
                const lead = leads.find((l) => l.id === m.leadId);
                return (
                  <div
                    key={m.id}
                    className="bg-white border border-gray-200 hover:border-emerald-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold tracking-wider text-slate-400">
                          {m.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            m.status === 'Scheduled'
                              ? 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200'
                              : m.status === 'Completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>

                      {/* Title & School */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                          {m.title}
                        </h4>
                        {m.instituteName && (
                          <div className="flex items-center space-x-1 text-xs text-[#0B5D2A] font-semibold mt-0.5">
                            <Building2 className="w-3.5 h-3.5 text-[#168A45]" />
                            <span>{m.instituteName}</span>
                            {m.contactPerson && (
                              <span className="text-slate-400">({m.contactPerson})</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Timing & Participants */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7FAF8] p-2.5 rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-[#168A45]" />
                          <span>{m.scheduledDate}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-[#168A45]" />
                          <span>
                            {m.scheduledTime} ({m.durationMinutes}m)
                          </span>
                        </div>
                      </div>

                      {/* Agenda */}
                      {m.agenda && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {m.agenda}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => copyToClipboard(m.meetingUri, m.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Copy Meeting URL"
                        >
                          {copiedId === m.id ? (
                            <Check className="w-4 h-4 text-[#168A45]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        {lead && onOpenGmailForLead && (
                          <button
                            onClick={() => onOpenGmailForLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded-lg transition-colors"
                            title="Email Demo Invite / Notes via Gmail"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => setConfirmDeleteId(m.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Cancel / Delete Meeting"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <a
                        href={m.meetingUri}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Call</span>
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3">
                <Video className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No scheduled Google Meet calls</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the "Schedule Demo Call" or "Start Instant Demo" button to host a live product presentation with a school.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAST CONFERENCE RECORDS (FROM GOOGLE MEET API) */}
        {filterTab === 'PAST_RECORDS' && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Google Meet Conference Audit Log
                </h4>
                <p className="text-[11px] text-slate-400">
                  Direct audit data retrieved from Google Meet v2 REST endpoint.
                </p>
              </div>
              <button
                onClick={loadConferenceLogs}
                disabled={isLoadingRecords}
                className="p-2 text-slate-500 hover:text-[#168A45] hover:bg-emerald-50 rounded-lg transition-colors"
                title="Refresh Conference Logs"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoadingRecords ? 'animate-spin text-[#168A45]' : ''}`}
                />
              </button>
            </div>

            {isLoadingRecords ? (
              <div className="py-12 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-[#168A45] animate-spin mx-auto" />
                <p className="text-xs text-slate-500">Querying Google Meet conference records...</p>
              </div>
            ) : conferenceRecords.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase text-slate-400 border-b border-gray-100">
                      <th className="py-2 px-3">Conference Record</th>
                      <th className="py-2 px-3">Start Time</th>
                      <th className="py-2 px-3">End Time</th>
                      <th className="py-2 px-3">Space Resource</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {conferenceRecords.map((cr) => (
                      <tr key={cr.name} className="hover:bg-[#F7FAF8]">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {cr.name.replace('conferenceRecords/', '')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {new Date(cr.startTime).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {cr.endTime ? new Date(cr.endTime).toLocaleString() : 'In Progress'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {cr.space || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-600">No past conferences logged yet</p>
                <p className="text-[11px]">
                  When you hold meetings via your connected Google Account, records will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SCHEDULE DEMO MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-5 py-4 bg-[#F7FAF8] border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-[#168A45]" />
                <h3 className="text-sm font-bold text-slate-800">
                  Schedule Google Meet Demo Call
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleScheduleMeetingSubmit} className="p-5 space-y-3.5 text-xs">
              {/* Meeting Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Meeting Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={schedTitle}
                  onChange={(e) => setSchedTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] font-semibold text-slate-800"
                />
              </div>

              {/* Target Lead */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Associate with School / Lead (Optional)
                </label>
                <select
                  value={schedLeadId}
                  onChange={(e) => {
                    setSchedLeadId(e.target.value);
                    const lead = leads.find((l) => l.id === e.target.value);
                    if (lead) {
                      setSchedTitle(`MYSAR ERP Walkthrough - ${lead.instituteName}`);
                      if (lead.email) setSchedEmails(lead.email);
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                >
                  <option value="">-- Select Institution --</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.instituteName} ({l.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date, Time & Duration */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={schedDate}
                    onChange={(e) => setSchedDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={schedTime}
                    onChange={(e) => setSchedTime(e.target.value)}
                    className="w-full px-2.5 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={schedDuration}
                    onChange={(e) => setSchedDuration(parseInt(e.target.value) || 30)}
                    className="w-full px-2.5 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                  />
                </div>
              </div>

              {/* Participant Emails */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Participant Emails (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="principal@school.edu, trustee@school.org"
                  value={schedEmails}
                  onChange={(e) => setSchedEmails(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45]"
                />
              </div>

              {/* Agenda */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Demo Agenda / Notes
                </label>
                <textarea
                  rows={3}
                  value={schedAgenda}
                  onChange={(e) => setSchedAgenda(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#168A45] leading-relaxed"
                />
              </div>

              {/* Send Email Invite checkbox */}
              {isAuthenticated && (
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="sendInvite"
                    checked={schedSendEmailInvite}
                    onChange={(e) => setSchedSendEmailInvite(e.target.checked)}
                    className="w-4 h-4 text-[#168A45] rounded border-gray-300 focus:ring-[#168A45]"
                  />
                  <label
                    htmlFor="sendInvite"
                    className="text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    Auto-send Google Meet calendar invitation email via Gmail
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isScheduling}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{isScheduling ? 'Creating Space...' : 'Schedule Meeting'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-gray-200 space-y-3">
            <h4 className="text-sm font-bold text-slate-800">
              Cancel / Remove Meeting
            </h4>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove this Google Meet demo call from the schedule?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Keep
              </button>
              <button
                onClick={handleExecuteDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
