import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { LeadsView } from './components/LeadsView';
import { FollowUpsView } from './components/FollowUpsView';
import { ProposalsView } from './components/ProposalsView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { GmailInboxView } from './components/GmailInboxView';
import { GoogleMeetView } from './components/GoogleMeetView';
import { NewLeadModal } from './components/NewLeadModal';
import { CreateProposalModal } from './components/CreateProposalModal';
import { ProposalPreviewModal } from './components/ProposalPreviewModal';
import { GoogleAppsScriptModal } from './components/GoogleAppsScriptModal';
import { FollowUpNotificationModal } from './components/FollowUpNotificationModal';
import { LoginPage } from './components/LoginPage';
import { storage } from './services/storageService';
import { notificationService } from './services/notificationService';
import {
  Lead,
  Proposal,
  FollowUp,
  User,
  Settings,
  DashboardMetrics,
  LeadStatus,
  ProposalStatus,
} from './types';

// HR Module Views & Services
import { HrDashboardView } from './components/hr/HrDashboardView';
import { RecruitmentView } from './components/hr/RecruitmentView';
import { StaffManagementView } from './components/hr/StaffManagementView';
import { AttendanceAndLeaveView } from './components/hr/AttendanceAndLeaveView';
import { PayrollManagementView } from './components/hr/PayrollManagementView';
import { KpiManagementView } from './components/hr/KpiManagementView';
import { HrSettingsView } from './components/hr/HrSettingsView';
import { hrStorage } from './services/hrStorageService';
import {
  Position,
  Applicant,
  Interview,
  OfferLetter,
  AppointmentLetter,
  StaffMember,
  StaffOnboardingTask,
  DailyAttendanceRecord,
  LeaveRequest,
  LeaveBalance,
  MonthlyPayrollRecord,
  PositionKpiConfig,
  StaffPerformanceEvaluation,
  HrSettingsConfig,
  HrActivityLog,
  AttendanceStatus,
  LeaveRequestStatus,
  PayrollStatus,
  RecruitmentStage,
  InterviewEvaluation,
  OfferStatus,
  AppointmentStatus,
} from './types/hr';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilterForLeads, setStatusFilterForLeads] = useState<string>('All');
  const [followUpsActiveTab, setFollowUpsActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'all'>('today');
  const [settingsSubTab, setSettingsSubTab] = useState<'pricing' | 'company' | 'proposal' | 'users' | 'import' | 'integrations'>('pricing');

  // Core Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [metrics, setMetrics] = useState<DashboardMetrics>(storage.getDashboardMetrics());

  // Active Authenticated User (RBAC session)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    return storage.getSessionUser();
  });

  // Modal States
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false);
  const [proposalTargetLead, setProposalTargetLead] = useState<Lead | null>(null);

  const [isPreviewProposalOpen, setIsPreviewProposalOpen] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);

  const [isGasHubOpen, setIsGasHubOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [gmailLeadFilter, setGmailLeadFilter] = useState<string>('All');

  // HR Module States
  const [hrPositions, setHrPositions] = useState<Position[]>([]);
  const [hrApplicants, setHrApplicants] = useState<Applicant[]>([]);
  const [hrInterviews, setHrInterviews] = useState<Interview[]>([]);
  const [hrOffers, setHrOffers] = useState<OfferLetter[]>([]);
  const [hrAppointments, setHrAppointments] = useState<AppointmentLetter[]>([]);
  const [hrStaff, setHrStaff] = useState<StaffMember[]>([]);
  const [hrAttendance, setHrAttendance] = useState<DailyAttendanceRecord[]>([]);
  const [hrLeaveRequests, setHrLeaveRequests] = useState<LeaveRequest[]>([]);
  const [hrLeaveBalances, setHrLeaveBalances] = useState<LeaveBalance[]>([]);
  const [hrPayroll, setHrPayroll] = useState<MonthlyPayrollRecord[]>([]);
  const [hrPositionKpis, setHrPositionKpis] = useState<PositionKpiConfig[]>([]);
  const [hrPerformance, setHrPerformance] = useState<StaffPerformanceEvaluation[]>([]);
  const [hrActivityLogs, setHrActivityLogs] = useState<HrActivityLog[]>([]);
  const [hrSettings, setHrSettings] = useState<HrSettingsConfig>(() => hrStorage.getHrSettings());

  const refreshHrData = () => {
    setHrPositions(hrStorage.getPositions());
    setHrApplicants(hrStorage.getApplicants());
    setHrInterviews(hrStorage.getInterviews());
    setHrOffers(hrStorage.getOfferLetters());
    setHrAppointments(hrStorage.getAppointmentLetters());
    setHrStaff(hrStorage.getStaff());
    setHrAttendance(hrStorage.getAttendanceRecords());
    setHrLeaveRequests(hrStorage.getLeaveRequests());
    setHrLeaveBalances(hrStorage.getLeaveBalances());
    setHrPayroll(hrStorage.getPayrollRecords());
    setHrPositionKpis(hrStorage.getPositionKpis());
    setHrPerformance(hrStorage.getStaffPerformance());
    setHrActivityLogs(hrStorage.getActivityLogs());
    setHrSettings(hrStorage.getHrSettings());
  };

  // Load data on mount
  const refreshAllData = () => {
    const loadedLeads = storage.getLeads();
    const loadedProposals = storage.getProposals();
    const loadedFollowUps = storage.getFollowUps();
    const loadedUsers = storage.getUsers();
    const loadedSettings = storage.getSettings();
    const loadedMetrics = storage.getDashboardMetrics();

    setLeads(loadedLeads);
    setProposals(loadedProposals);
    setFollowUps(loadedFollowUps);
    setUsers(loadedUsers);
    setSettings(loadedSettings);
    setMetrics(loadedMetrics);
    refreshHrData();

    // Keep currentUser reference in sync
    if (currentUser) {
      const refreshedCurrent = loadedUsers.find((u) => u.id === currentUser.id);
      if (refreshedCurrent) {
        setCurrentUser(refreshedCurrent);
      }
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleSwitchUser = (user: User) => {
    storage.setSessionUser(user, true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storage.clearSession();
    setCurrentUser(null);
  };

  // Calculate approaching follow-up notifications
  const dueNotifications = useMemo(() => {
    return notificationService.getDueFollowUpNotifications(followUps, leads, users);
  }, [followUps, leads, users]);

  // Notifications relevant for current user count
  const activeUserNotifications = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Salesperson') {
      return dueNotifications.filter((n) => n.salespersonName === currentUser.name);
    }
    return dueNotifications;
  }, [dueNotifications, currentUser]);

  // --- Lead Operations ---
  const handleSaveLead = (leadData: Partial<Lead>) => {
    storage.saveLead(leadData, currentUser?.name || 'System');
    refreshAllData();
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setIsNewLeadOpen(true);
  };

  const handleDeleteLead = (leadId: string) => {
    storage.deleteLead(leadId);
    refreshAllData();
  };

  const handleUpdateLeadStatus = (leadId: string, status: LeadStatus) => {
    storage.updateLeadStatus(leadId, status, currentUser.name);
    refreshAllData();
  };

  const handleBulkImportLeads = (leadsData: Array<Partial<Lead>>) => {
    const result = storage.bulkImportLeads(leadsData, currentUser.name);
    refreshAllData();
    return result;
  };

  // --- Proposal Operations ---
  const handleStartProposalFromLead = (lead: Lead) => {
    setProposalTargetLead(lead);
    setIsCreateProposalOpen(true);
  };

  const handleGenerateProposalSubmit = (proposalData: any) => {
    const created = storage.createProposal(proposalData);
    refreshAllData();
    setIsCreateProposalOpen(false);
    // Automatically open preview!
    setPreviewProposal(created);
    setIsPreviewProposalOpen(true);
  };

  const handleOpenProposalPreview = (proposal: Proposal) => {
    setPreviewProposal(proposal);
    setIsPreviewProposalOpen(true);
  };

  const handleUpdateProposalStatus = (id: string, status: ProposalStatus) => {
    const existing = proposals.find((p) => p.id === id);
    if (existing) {
      storage.updateProposal({
        ...existing,
        proposalStatus: status,
      });
      refreshAllData();
    }
  };

  const handleDeleteProposal = (id: string) => {
    storage.deleteProposal(id);
    refreshAllData();
  };

  // --- FollowUp Operations ---
  const handleSaveFollowUp = (fupData: Partial<FollowUp>) => {
    storage.saveFollowUp(fupData, currentUser.name);
    refreshAllData();
  };

  const handleAddFollowUpFromLead = (lead: Lead) => {
    storage.saveFollowUp(
      {
        leadId: lead.id,
        instituteName: lead.instituteName,
        followUpDate: new Date().toISOString().split('T')[0],
        staff: lead.assignedTo || currentUser.name,
        followUpType: 'Call',
        discussion: `Follow-up regarding institutional requirements for ${lead.instituteName}`,
        nextFollowUpDate: lead.followUpDate,
        status: 'Pending',
        remarks: '',
      },
      currentUser.name
    );
    refreshAllData();
    setActiveTab('followups');
  };

  const handleTriggerFollowUpReminder = (lead: Lead) => {
    setIsNotificationModalOpen(true);
  };

  // --- Settings & Reset ---
  const handleSaveSettings = (newSettings: Settings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
    refreshAllData();
  };

  const handleSaveUser = (newUser: User) => {
    storage.saveUser(newUser);
    refreshAllData();
  };

  const handleUpdateUser = (updatedUser: User) => {
    storage.updateUser(updatedUser);
    refreshAllData();
  };

  const handleDeleteUser = (userId: string) => {
    storage.deleteUser(userId);
    refreshAllData();
  };

  const handleResetDemo = () => {
    storage.resetAllToDemo();
    refreshAllData();
  };

  // --- CSV Export Helper ---
  const handleExportCsv = (tableName: 'Leads' | 'Proposals' | 'FollowUps' | 'Users') => {
    const csvData = storage.exportTableToCsv(tableName);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MYSAR_${tableName}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllDataCsv = () => {
    ['Leads', 'Proposals', 'FollowUps', 'Users'].forEach((tbl, idx) => {
      setTimeout(() => {
        handleExportCsv(tbl as any);
      }, idx * 300);
    });
  };

  // Quick navigation helpers from dashboard
  const handleNavigateToLeads = (statusFilter?: string) => {
    if (statusFilter) {
      setStatusFilterForLeads(statusFilter);
    }
    setActiveTab('leads');
  };

  // --- HR Operations Handlers ---
  const handleSavePosition = (pos: Partial<Position>) => {
    hrStorage.savePosition(pos, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleDeletePosition = (id: string) => {
    hrStorage.deletePosition(id, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleSaveApplicant = (app: Partial<Applicant>) => {
    hrStorage.saveApplicant(app, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleUpdateApplicantStage = (applicantId: string, stage: RecruitmentStage) => {
    hrStorage.updateApplicantStage(applicantId, stage, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleDeleteApplicant = (id: string) => {
    hrStorage.deleteApplicant(id, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleScheduleInterview = (interview: Partial<Interview>) => {
    hrStorage.scheduleInterview(interview, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleSaveInterviewEvaluation = (interviewId: string, evaluation: InterviewEvaluation) => {
    hrStorage.saveInterviewEvaluation(interviewId, evaluation, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleGenerateOfferLetter = (offer: Partial<OfferLetter>) => {
    hrStorage.generateOfferLetter(offer, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleUpdateOfferStatus = (id: string, status: OfferStatus) => {
    hrStorage.updateOfferStatus(id, status, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleGenerateAppointmentLetter = (appt: Partial<AppointmentLetter>) => {
    hrStorage.generateAppointmentLetter(appt, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleUpdateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    hrStorage.updateAppointmentStatus(id, status, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleConvertApplicantToStaff = (applicantId: string, appointmentId?: string) => {
    hrStorage.convertApplicantToStaff(applicantId, appointmentId, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleSaveStaff = (staffMember: Partial<StaffMember>) => {
    hrStorage.saveStaff(staffMember, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleDeleteStaff = (id: string) => {
    hrStorage.deleteStaff(id, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleMarkAttendance = (
    staffId: string,
    date: string,
    status: AttendanceStatus,
    checkIn?: string,
    checkOut?: string,
    remarks?: string
  ) => {
    hrStorage.markAttendance(staffId, date, status, checkIn, checkOut, remarks, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleBulkMarkAttendance = (date: string, status: AttendanceStatus) => {
    hrStorage.bulkMarkAttendance(date, status, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleSubmitLeaveRequest = (leave: Partial<LeaveRequest>) => {
    hrStorage.submitLeaveRequest(leave, currentUser?.name || 'Employee');
    refreshHrData();
  };

  const handleUpdateLeaveStatus = (leaveId: string, status: LeaveRequestStatus, remarks?: string) => {
    hrStorage.updateLeaveStatus(leaveId, status, remarks, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleGeneratePayroll = (month: string, year: number) => {
    hrStorage.generateMonthlyPayroll(month, year, currentUser?.name || 'Finance Officer');
    refreshHrData();
  };

  const handleUpdatePayrollStatus = (payrollId: string, status: PayrollStatus) => {
    hrStorage.updatePayrollStatus(payrollId, status, currentUser?.name || 'Finance Officer');
    refreshHrData();
  };

  const handleSavePositionKpi = (config: PositionKpiConfig) => {
    hrStorage.savePositionKpiConfig(config, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleSavePerformance = (perf: Partial<StaffPerformanceEvaluation>) => {
    hrStorage.saveStaffPerformance(perf, currentUser?.name || 'Evaluator');
    refreshHrData();
  };

  const handleSaveHrSettings = (newSettings: HrSettingsConfig) => {
    hrStorage.saveHrSettings(newSettings, currentUser?.name || 'Admin');
    refreshHrData();
  };

  // If user is not authenticated, show the Login Page
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshAllData();
        }}
        settings={settings}
        availableUsers={users}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex flex-col font-sans text-[#1F2937] selection:bg-[#EAF7EF] selection:text-[#0B5D2A]">
      {/* Header */}
      <Header
        onOpenNewLead={() => {
          setEditingLead(null);
          setIsNewLeadOpen(true);
        }}
        onOpenGasHub={() => setIsGasHubOpen(true)}
        onRefresh={refreshAllData}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (q.trim() && activeTab !== 'leads') {
            setActiveTab('leads');
          }
        }}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onUpdateUser={handleUpdateUser}
        onLogout={handleLogout}
        notificationsCount={activeUserNotifications.length}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        settings={settings}
      />

      {/* Main Layout: Sidebar + Dynamic Main Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          settingsSubTab={settingsSubTab}
          onSettingsSubTabChange={(subTab) => {
            setSettingsSubTab(subTab);
            setActiveTab('settings');
          }}
          onTabChange={(tab) => {
            if (tab === 'gashub') {
              setIsGasHubOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          leadsCount={leads.length}
          followUpsTodayCount={metrics.followUpsToday}
          proposalsPendingCount={metrics.proposalsPending}
          pendingLeavesCount={(hrLeaveRequests || []).filter((l) => l.status === 'Pending').length}
          currentUser={currentUser}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Dynamic Workspace Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-65px)]">
          {activeTab === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              leads={leads}
              followUps={followUps}
              proposals={proposals}
              currentUser={currentUser}
              onNavigateToLeads={handleNavigateToLeads}
              onNavigateToFollowUps={(targetTab) => {
                if (targetTab) {
                  setFollowUpsActiveTab(targetTab);
                }
                setActiveTab('followups');
              }}
              onNavigateToProposals={() => setActiveTab('proposals')}
              onCreateProposalFromLead={handleStartProposalFromLead}
              onOpenNewLead={() => {
                setEditingLead(null);
                setIsNewLeadOpen(true);
              }}
              onOpenNotifications={() => setIsNotificationModalOpen(true)}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={leads}
              currentUser={currentUser}
              onOpenNewLead={() => {
                setEditingLead(null);
                setIsNewLeadOpen(true);
              }}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              onUpdateStatus={handleUpdateLeadStatus}
              onCreateProposal={handleStartProposalFromLead}
              onAddFollowUp={handleAddFollowUpFromLead}
              initialStatusFilter={statusFilterForLeads}
              users={users}
              onExportCsv={() => handleExportCsv('Leads')}
              onNavigateToImportCsv={() => {
                setSettingsSubTab('import');
                setActiveTab('settings');
              }}
              onTriggerFollowUpReminder={handleTriggerFollowUpReminder}
              onOpenGmailForLead={(lead) => {
                setGmailLeadFilter(lead.id);
                setActiveTab('gmail');
              }}
              onScheduleMeetForLead={(_lead) => {
                setActiveTab('meet');
              }}
            />
          )}

          {activeTab === 'followups' && (
            <FollowUpsView
              followUps={followUps}
              leads={leads}
              users={users}
              currentUser={currentUser}
              onSaveFollowUp={handleSaveFollowUp}
              onExportCsv={() => handleExportCsv('FollowUps')}
              onOpenNotifications={() => setIsNotificationModalOpen(true)}
              initialTab={followUpsActiveTab}
            />
          )}

          {activeTab === 'proposals' && (
            <ProposalsView
              proposals={proposals}
              settings={settings}
              onOpenPreview={handleOpenProposalPreview}
              onDeleteProposal={handleDeleteProposal}
              onUpdateStatus={handleUpdateProposalStatus}
              onExportCsv={() => handleExportCsv('Proposals')}
              onEmailProposal={(prop) => {
                setGmailLeadFilter(prop.leadId);
                setActiveTab('gmail');
              }}
              onOpenNewProposalPrompt={() => {
                setProposalTargetLead(leads.length > 0 ? leads[0] : null);
                setIsCreateProposalOpen(true);
              }}
            />
          )}

          {activeTab === 'meet' && (
            <GoogleMeetView
              leads={leads}
              currentUser={currentUser}
              onOpenGmailForLead={(lead) => {
                setGmailLeadFilter(lead.id);
                setActiveTab('gmail');
              }}
            />
          )}

          {activeTab === 'gmail' && (
            <GmailInboxView
              leads={leads}
              proposals={proposals}
              currentUser={currentUser}
              initialLeadId={gmailLeadFilter}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              metrics={metrics}
              leads={leads}
              proposals={proposals}
              onExportAllCsv={handleExportAllDataCsv}
              onNavigateToLeads={(status?: string) => {
                if (status) {
                  setStatusFilterForLeads(status);
                }
                setActiveTab('leads');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              users={users}
              currentUser={currentUser}
              leads={leads}
              onSaveSettings={handleSaveSettings}
              onSaveUser={handleSaveUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
              onResetDemo={handleResetDemo}
              onBulkImportLeads={handleBulkImportLeads}
              onNavigateToLeads={() => setActiveTab('leads')}
              initialTab={settingsSubTab}
              onTabChange={(subTab) => setSettingsSubTab(subTab)}
            />
          )}

          {/* HR Module Views */}
          {activeTab === 'hr-dashboard' && (
            <HrDashboardView
              positions={hrPositions}
              applicants={hrApplicants}
              staff={hrStaff}
              attendance={hrAttendance}
              leaveRequests={hrLeaveRequests}
              offerLetters={hrOffers}
              appointmentLetters={hrAppointments}
              payroll={hrPayroll}
              performance={hrPerformance}
              activityLogs={hrActivityLogs}
              onNavigate={(tab) => setActiveTab(tab as NavTab)}
              onOpenAddStaff={() => setActiveTab('hr-staff')}
              onOpenCreatePosition={() => setActiveTab('hr-recruitment')}
              onOpenNewInterview={() => setActiveTab('hr-recruitment')}
              onOpenMarkAttendance={() => setActiveTab('hr-attendance')}
              onOpenLeaveApproval={() => setActiveTab('hr-attendance')}
              onOpenProcessPayroll={() => setActiveTab('hr-payroll')}
            />
          )}

          {activeTab === 'hr-recruitment' && (
            <RecruitmentView
              positions={hrPositions}
              applicants={hrApplicants}
              interviews={hrInterviews}
              offerLetters={hrOffers}
              appointmentLetters={hrAppointments}
              onSavePosition={handleSavePosition}
              onDeletePosition={handleDeletePosition}
              onSaveApplicant={handleSaveApplicant}
              onUpdateApplicantStage={handleUpdateApplicantStage}
              onDeleteApplicant={handleDeleteApplicant}
              onScheduleInterview={handleScheduleInterview}
              onSaveInterviewEvaluation={handleSaveInterviewEvaluation}
              onGenerateOffer={handleGenerateOfferLetter}
              onUpdateOfferStatus={handleUpdateOfferStatus}
              onGenerateAppointment={handleGenerateAppointmentLetter}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onConvertApplicantToStaff={handleConvertApplicantToStaff}
            />
          )}

          {activeTab === 'hr-staff' && (
            <StaffManagementView
              staff={hrStaff}
              attendanceRecords={hrAttendance}
              leaveRequests={hrLeaveRequests}
              performanceRecords={hrPerformance}
              onSaveStaff={handleSaveStaff}
              onDeleteStaff={handleDeleteStaff}
            />
          )}

          {activeTab === 'hr-attendance' && (
            <AttendanceAndLeaveView
              staff={hrStaff}
              attendance={hrAttendance}
              leaveRequests={hrLeaveRequests}
              leaveBalances={hrLeaveBalances}
              onMarkAttendance={handleMarkAttendance}
              onBulkMarkAttendance={handleBulkMarkAttendance}
              onSubmitLeaveRequest={handleSubmitLeaveRequest}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
            />
          )}

          {activeTab === 'hr-payroll' && (
            <PayrollManagementView
              payrollRecords={hrPayroll}
              staff={hrStaff}
              onGeneratePayroll={handleGeneratePayroll}
              onUpdatePayrollStatus={handleUpdatePayrollStatus}
            />
          )}

          {activeTab === 'hr-kpi' && (
            <KpiManagementView
              positions={hrPositions}
              staff={hrStaff}
              positionKpis={hrPositionKpis}
              performanceRecords={hrPerformance}
              onSavePositionKpi={handleSavePositionKpi}
              onSavePerformance={handleSavePerformance}
            />
          )}

          {activeTab === 'hr-settings' && (
            <HrSettingsView
              settings={hrSettings}
              onSaveSettings={handleSaveHrSettings}
              onResetData={() => {
                hrStorage.resetHrData();
                refreshHrData();
              }}
            />
          )}
        </main>
      </div>

      {/* MODALS */}
      {/* 1. New / Edit Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => {
          setIsNewLeadOpen(false);
          setEditingLead(null);
        }}
        onSave={handleSaveLead}
        editLead={editingLead}
        users={users}
        currentUser={currentUser}
        onCreateProposal={handleStartProposalFromLead}
        onAddFollowUp={handleAddFollowUpFromLead}
      />

      {/* 2. Create Proposal Modal */}
      <CreateProposalModal
        isOpen={isCreateProposalOpen}
        onClose={() => {
          setIsCreateProposalOpen(false);
          setProposalTargetLead(null);
        }}
        lead={proposalTargetLead}
        leads={leads}
        settings={settings}
        currentUser={currentUser}
        onGenerateProposal={handleGenerateProposalSubmit}
      />

      {/* 3. Proposal Preview & PDF Generation Modal */}
      <ProposalPreviewModal
        isOpen={isPreviewProposalOpen}
        onClose={() => {
          setIsPreviewProposalOpen(false);
          setPreviewProposal(null);
        }}
        proposal={previewProposal}
        settings={settings}
        onEdit={() => {
          setIsPreviewProposalOpen(false);
          if (previewProposal) {
            const matchedLead = leads.find((l) => l.id === previewProposal.leadId) || {
              id: previewProposal.leadId || '',
              leadDate: previewProposal.proposalDate || new Date().toISOString().split('T')[0],
              instituteName: previewProposal.instituteName,
              contactPerson: previewProposal.contactPerson,
              studentCount: previewProposal.studentCount,
              priority: 'High',
              status: 'Proposal Sent',
              assignedTo: previewProposal.createdBy || currentUser.name,
              remarks: previewProposal.notes || '',
              createdBy: previewProposal.createdBy || currentUser.name,
              createdDate: previewProposal.createdDate || new Date().toISOString().split('T')[0],
            };
            setProposalTargetLead(matchedLead);
            setIsCreateProposalOpen(true);
          }
        }}
        onSendEmail={(p, emailTo) => {
          handleUpdateProposalStatus(p.id, 'Sent');
          if (p.leadId) {
            storage.logEmailSent(
              p.leadId,
              currentUser.name,
              emailTo || 'Client',
              `MYSAR ERP Implementation Proposal - ${p.proposalNumber}`,
              `Dispatched proposal document ${p.proposalNumber} for ${p.studentCount} students @ ₹${p.pricePerStudent}/student (Total: ₹${p.totalAmount.toLocaleString('en-IN')}) to ${emailTo || 'institute contact'}.`
            );
            refreshAllData();
          }
        }}
      />

      {/* 4. Google Apps Script & Sheets Exporter */}
      <GoogleAppsScriptModal
        isOpen={isGasHubOpen}
        onClose={() => setIsGasHubOpen(false)}
        onExportCsv={handleExportCsv}
      />

      {/* 5. Automated Follow-up Notification Modal */}
      <FollowUpNotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={dueNotifications}
        currentUser={currentUser}
        onNotificationSent={refreshAllData}
        onSelectLead={(leadId) => {
          setIsNotificationModalOpen(false);
          setActiveTab('leads');
        }}
      />
    </div>
  );
}
