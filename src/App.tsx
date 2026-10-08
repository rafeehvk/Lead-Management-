import React, { useState, useEffect, useMemo } from 'react';
import { ShieldAlert, RotateCcw, ArrowRight } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { ErpManagementDashboard } from './components/dashboard/ErpManagementDashboard';
import { OperationsDashboardView } from './components/dashboard/OperationsDashboardView';
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
import { AllNotificationsModal } from './components/AllNotificationsModal';
import { LoginPage } from './components/LoginPage';
import { storage } from './services/storageService';
import { notificationService } from './services/notificationService';
import { documentExpiryStorage } from './services/documentExpiryStorage';
import { calculateDaysRemaining } from './types/documentExpiry';
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
import { BranchDashboardView } from './components/hr/BranchDashboardView';
import { StaffAccessManagementView } from './components/hr/StaffAccessManagementView';
import { AttendanceAndLeaveView } from './components/hr/AttendanceAndLeaveView';
import { PayrollManagementView } from './components/hr/PayrollManagementView';
import { KpiManagementView } from './components/hr/KpiManagementView';
import { HrSettingsView } from './components/hr/HrSettingsView';
import { hrStorage } from './services/hrStorageService';
import { resolveAssignedModulesToNavTabs } from './utils/menuPermissions';

// Document & Expiry Management Module
import { DocumentExpiryView } from './components/documentExpiry/DocumentExpiryView';

// Asset Management Module
import { AssetModule } from './components/assets/AssetModule';

// Finance & Budgeting Module
import { FinanceDashboardView } from './components/finance/FinanceDashboardView';

// Dedicated Modules: Party Management, Sales, Purchase, Inventory
import { PartyManagementModule } from './components/parties/PartyManagementModule';
import { SalesModule } from './components/sales/SalesModule';
import { PurchaseModule } from './components/purchase/PurchaseModule';
import { InventoryModule } from './components/inventory/InventoryModule';
import { dataPurgeService } from './services/dataPurgeService';
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
  DepartmentMaster,
} from './types/hr';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isSubpageFullScreen, setIsSubpageFullScreen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilterForLeads, setStatusFilterForLeads] = useState<string>('All');
  const [followUpsActiveTab, setFollowUpsActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'all'>('today');
  const [settingsSubTab, setSettingsSubTab] = useState<'pricing' | 'proposal' | 'templates' | 'company' | 'users' | 'import' | 'integrations' | 'themes'>('pricing');
  const [proposalTargetTemplateId, setProposalTargetTemplateId] = useState<string | undefined>(undefined);

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

  // Department-based access control & module authorization
  const [departmentsList, setDepartmentsList] = useState<DepartmentMaster[]>(() =>
    hrStorage.getDepartmentsMaster()
  );
  const [staffAuthVersion, setStaffAuthVersion] = useState(0);

  useEffect(() => {
    try {
      localStorage.removeItem('mysar_simulated_department');
    } catch {}

    const handleDeptChange = () => {
      setDepartmentsList(hrStorage.getDepartmentsMaster());
      setStaffAuthVersion((v) => v + 1);
    };
    window.addEventListener('mysar_department_permissions_changed', handleDeptChange);
    return () => {
      window.removeEventListener('mysar_department_permissions_changed', handleDeptChange);
    };
  }, []);

  const staffAssignedNavTabs = useMemo(() => {
    if (!currentUser) return null;
    const allStaff = hrStorage.getStaff();
    const matchedStaff = allStaff.find(
      (s) =>
        (currentUser.staffId && s.staffId === currentUser.staffId) ||
        (currentUser.userId &&
          s.systemAccess?.username?.toLowerCase() === currentUser.userId.toLowerCase()) ||
        (currentUser.email && s.email?.toLowerCase() === currentUser.email.toLowerCase())
    );

    const assignedModules =
      matchedStaff?.systemAccess?.assignedModules ?? currentUser.assignedModules;
    const accessLevel =
      matchedStaff?.systemAccess?.accessLevel ?? currentUser.accessLevel;

    // Master default admin without a restricted staff profile sees everything unless modules are explicitly assigned
    if (!matchedStaff && currentUser.role === 'Admin' && (!assignedModules || assignedModules.length === 0)) {
      return null;
    }

    if (assignedModules && assignedModules.length > 0) {
      return resolveAssignedModulesToNavTabs(assignedModules, accessLevel);
    }

    if (accessLevel === 'Admin' || currentUser.role === 'Admin') {
      return null;
    }

    return null;
  }, [currentUser, staffAuthVersion]);

  const activeUserDept = useMemo(() => {
    if (currentUser?.role === 'Admin') {
      return null; // Admins have unrestricted access to all modules
    }
    if (currentUser?.departmentCode) {
      return (
        departmentsList.find(
          (d) => d.departmentCode.toUpperCase() === currentUser.departmentCode?.toUpperCase()
        ) || null
      );
    }
    if (currentUser?.department) {
      return (
        departmentsList.find(
          (d) =>
            d.departmentName.toLowerCase() === currentUser.department?.toLowerCase() ||
            d.departmentCode.toLowerCase() === currentUser.department?.toLowerCase()
        ) || null
      );
    }
    return null;
  }, [departmentsList, currentUser]);

  const isCurrentTabAuthorized = useMemo(() => {
    if (staffAssignedNavTabs && staffAssignedNavTabs.size > 0) {
      return staffAssignedNavTabs.has(activeTab);
    }
    if (!activeUserDept) return true;
    const allowed = activeUserDept.allowedMenuIds || [];
    return allowed.includes(activeTab);
  }, [staffAssignedNavTabs, activeUserDept, activeTab]);

  useEffect(() => {
    if (!isCurrentTabAuthorized) {
      if (staffAssignedNavTabs && staffAssignedNavTabs.size > 0) {
        const allowedList = Array.from(staffAssignedNavTabs);
        if (staffAssignedNavTabs.has('dashboard')) {
          setActiveTab('dashboard');
        } else if (allowedList.length > 0) {
          setActiveTab(allowedList[0] as NavTab);
        }
        return;
      }
      if (activeUserDept) {
        const allowed = activeUserDept.allowedMenuIds || [];
        if (allowed.includes('dashboard')) {
          setActiveTab('dashboard');
        } else if (allowed.length > 0) {
          setActiveTab(allowed[0] as NavTab);
        }
      }
    }
  }, [staffAssignedNavTabs, activeUserDept, isCurrentTabAuthorized]);

  // Modal States
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [pendingStaffOnboarding, setPendingStaffOnboarding] = useState<{
    prefillData: Partial<StaffMember>;
    applicantId?: string;
    appointmentId?: string;
  } | null>(null);

  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false);
  const [proposalTargetLead, setProposalTargetLead] = useState<Lead | null>(null);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);

  const [isPreviewProposalOpen, setIsPreviewProposalOpen] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);
  const [previewProposalInitialMode, setPreviewProposalInitialMode] = useState<'full' | 'agreementOnly' | 'payment'>('full');

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
    setStaffAuthVersion((v) => v + 1);
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
    dataPurgeService.ensureLiveProductionState();
    refreshAllData();

    const handleLogoOrSettingsChange = () => {
      const refreshedSettings = storage.getSettings();
      setSettings(refreshedSettings);
    };

    window.addEventListener('mysar_company_logo_changed', handleLogoOrSettingsChange);
    window.addEventListener('mysar_settings_updated', handleLogoOrSettingsChange);
    window.addEventListener('storage', handleLogoOrSettingsChange);

    return () => {
      window.removeEventListener('mysar_company_logo_changed', handleLogoOrSettingsChange);
      window.removeEventListener('mysar_settings_updated', handleLogoOrSettingsChange);
      window.removeEventListener('storage', handleLogoOrSettingsChange);
    };
  }, []);

  const handleSwitchUser = (user: User) => {
    storage.setSessionUser(user, true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storage.clearSession();
    setSettings(storage.getSettings());
    setCurrentUser(null);
  };

  // Calculate approaching follow-up notifications
  const dueNotifications = useMemo(() => {
    return notificationService.getDueFollowUpNotifications(followUps, leads, users);
  }, [followUps, leads, users]);

  // Unified active notifications count across all ERP modules (Leads, HR, Documents, Proposals)
  const totalActiveNotificationsCount = useMemo(() => {
    if (!currentUser) return 0;
    const today = new Date().toISOString().split('T')[0];
    let readIds = new Set<string>();
    try {
      const saved = localStorage.getItem('mysar_read_notifications_v1');
      if (saved) readIds = new Set(JSON.parse(saved));
    } catch {}

    let count = 0;

    // 1. Lead due follow-ups (Automated email + scheduled)
    const dueFollowUps = notificationService.getDueFollowUpNotifications(followUps, leads, users);
    dueFollowUps.forEach((n) => {
      if (currentUser.role === 'Salesperson' && n.salespersonName !== currentUser.name) return;
      if (!readIds.has(`lead-email-${n.id}`)) count++;
    });

    followUps.forEach((f) => {
      if (f.status === 'Completed' || f.status === 'Cancelled') return;
      if (currentUser.role === 'Salesperson' && f.staff !== currentUser.name) return;
      const targetDate = f.nextFollowUpDate || f.followUpDate;
      if (targetDate && targetDate < today && !readIds.has(`lead-fup-od-${f.id}`)) {
        count++;
      }
    });

    // 2. HR pending leave requests
    if (currentUser.role !== 'Salesperson') {
      try {
        const pendingLeaves = hrStorage.getLeaveRequests().filter((lr) => lr.status === 'Pending');
        pendingLeaves.forEach((leave) => {
          if (!readIds.has(`hr-leave-${leave.id}`)) count++;
        });
      } catch {}
    }

    // 3. Document expirations (expired or <= 7 days)
    if (currentUser.role !== 'Salesperson') {
      try {
        const docs = documentExpiryStorage.getDocuments();
        docs.forEach((d) => {
          const days = calculateDaysRemaining(d.expiryDate, today);
          if (days <= 7) {
            const id = days < 0 ? `doc-exp-${d.id}` : `doc-7d-${d.id}`;
            if (!readIds.has(id)) count++;
          }
        });
      } catch {}
    }

    return count;
  }, [currentUser, followUps, leads, users]);

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
    setEditingProposal(null);
    setProposalTargetLead(lead);
    setIsCreateProposalOpen(true);
  };

  const handleStartEditProposal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    const matchedLead = leads.find((l) => l.id === proposal.leadId) || null;
    setProposalTargetLead(matchedLead);
    setIsPreviewProposalOpen(false);
    setIsCreateProposalOpen(true);
  };

  const handleGenerateProposalSubmit = (proposalData: any) => {
    if (proposalData.editingProposalId || editingProposal) {
      const targetId = proposalData.editingProposalId || editingProposal?.id;
      const updated = storage.saveEditedProposal(
        targetId,
        {
          instituteName: proposalData.instituteName,
          contactPerson: proposalData.contactPerson,
          leadEmail: proposalData.leadEmail,
          studentCount: proposalData.studentCount,
          pricingType: proposalData.pricingType,
          pricePerStudent: proposalData.pricePerStudent,
          totalAmount: proposalData.totalAmount,
          pricingItems: proposalData.pricingItems,
          agreementDetails: proposalData.agreementDetails,
          notes: proposalData.notes,
          revisionNotes: proposalData.revisionNotes,
        },
        currentUser.name
      );
      refreshAllData();
      setIsCreateProposalOpen(false);
      setEditingProposal(null);
      setProposalTargetLead(null);
      setPreviewProposal(updated);
      setIsPreviewProposalOpen(true);
    } else {
      const created = storage.createProposal(proposalData);
      refreshAllData();
      setIsCreateProposalOpen(false);
      setEditingProposal(null);
      setProposalTargetLead(null);
      // Automatically open preview!
      setPreviewProposal(created);
      setIsPreviewProposalOpen(true);
    }
  };

  const handleOpenProposalPreview = (
    proposal: Proposal,
    mode: 'full' | 'agreementOnly' | 'payment' = 'full'
  ) => {
    setPreviewProposal(proposal);
    setPreviewProposalInitialMode(mode);
    setIsPreviewProposalOpen(true);
  };

  const handleUpdateProposal = (updatedProposal: Proposal) => {
    storage.updateProposal(updatedProposal, currentUser?.name);
    refreshAllData();
    if (previewProposal && previewProposal.id === updatedProposal.id) {
      setPreviewProposal(updatedProposal);
    }
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
    storage.saveCompanyLogo(newSettings.companyLogo);
    storage.saveNavbarLogo(newSettings.navbarLogo);
    storage.saveDocumentLogo(newSettings.documentLogo);
    storage.saveLoginLogo(newSettings.loginLogo);
    setSettings(storage.getSettings());
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
    dataPurgeService.purgeAllDummyData({ actorName: currentUser?.name || 'Admin' });
    storage.resetAllToDemo();
    refreshAllData();
    refreshHrData();
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
    hrStorage.saveOfferLetter(offer, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleUpdateOfferStatus = (id: string, status: OfferStatus) => {
    hrStorage.updateOfferStatus(id, status, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleDeleteOfferLetter = (id: string) => {
    hrStorage.deleteOfferLetter(id, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleGenerateAppointmentLetter = (appt: Partial<AppointmentLetter>) => {
    hrStorage.saveAppointmentLetter(appt, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleUpdateAppointmentStatus = (id: string, status: AppointmentStatus) => {
    hrStorage.updateAppointmentStatus(id, status, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleDeleteAppointmentLetter = (id: string) => {
    hrStorage.deleteAppointmentLetter(id, currentUser?.name || 'HR Admin');
    refreshHrData();
  };

  const handleConvertApplicantToStaff = (applicantId: string, appointmentId?: string) => {
    const prefillData = hrStorage.buildPrefilledStaffFromCandidate(applicantId, appointmentId);
    setPendingStaffOnboarding({
      prefillData,
      applicantId,
      appointmentId,
    });
    setActiveTab('hr-staff');
  };

  const handleSaveStaff = (staffMember: Partial<StaffMember>) => {
    const saved = hrStorage.saveStaff(staffMember, currentUser?.name || 'HR Admin');
    if (pendingStaffOnboarding) {
      hrStorage.completeCandidateConversionToStaff(
        pendingStaffOnboarding.applicantId,
        pendingStaffOnboarding.appointmentId,
        saved.id,
        currentUser?.name || 'HR Admin'
      );
      setPendingStaffOnboarding(null);
    }
    refreshHrData();
    setUsers(storage.getUsers());
  };

  const handleDeleteStaff = (id: string) => {
    hrStorage.deleteStaff(id, currentUser?.name || 'HR Admin');
    refreshHrData();
    setUsers(storage.getUsers());
  };

  const handleClearAllDummyData = () => {
    hrStorage.clearAllDummyData(currentUser?.name || 'HR Admin');
    refreshHrData();
    setUsers(storage.getUsers());
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
        notificationsCount={totalActiveNotificationsCount}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        settings={settings}
        isFullScreen={isSubpageFullScreen}
        onToggleFullScreen={() => {
          setIsSubpageFullScreen((prev) => {
            const next = !prev;
            try {
              if (next && !document.fullscreenElement && document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
              } else if (!next && document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
              }
            } catch {
              // Ignore browser fullscreen API restrictions in iframe
            }
            return next;
          });
        }}
      />

      {/* Main Layout: Sidebar + Dynamic Main Area */}
      <div className="flex flex-1 w-full overflow-hidden">
        {!isSubpageFullScreen && (
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
        )}

        {/* Dynamic Workspace Content */}
        <main className="flex-1 w-full min-w-0 p-3 md:p-5 overflow-y-auto h-[calc(100vh-64px)] max-h-[calc(100vh-64px)]">
          <div className="w-full min-h-full">
          {!isCurrentTabAuthorized && (
            <div className="w-full my-6 p-8 bg-white rounded-3xl border border-rose-200 shadow-xl space-y-6 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                  Access Restricted by Department Policy
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-3">
                  Module Not Authorized
                </h3>
                <p className="text-sm text-slate-600 mt-2 max-w-lg mx-auto">
                  Your current department <strong className="text-slate-900">[{activeUserDept?.departmentCode}] {activeUserDept?.departmentName}</strong> does not have permission to access the <code className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-rose-700 font-bold">{activeTab}</code> module.
                </p>
              </div>

              {activeUserDept?.allowedMenuIds && activeUserDept.allowedMenuIds.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Authorized Modules for {activeUserDept.departmentName} ({activeUserDept.allowedMenuIds.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeUserDept.allowedMenuIds.map((mId) => (
                      <button
                        key={mId}
                        onClick={() => setActiveTab(mId as NavTab)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer"
                      >
                        {mId}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className="px-5 py-2.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <span>Go to Executive Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hr-settings')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  HR Configuration
                </button>
              </div>
            </div>
          )}

          {isCurrentTabAuthorized && (
            <>
          {activeTab === 'dashboard' && (
            <ErpManagementDashboard
              currentUser={currentUser}
              onNavigateToTab={(tab) => {
                if (tab === 'gashub') {
                  setIsGasHubOpen(true);
                } else {
                  setActiveTab(tab);
                }
              }}
              onOpenNewLeadModal={() => {
                setEditingLead(null);
                setIsNewLeadOpen(true);
              }}
              onNavigateToLeadDetail={(leadId) => {
                setActiveTab('leads');
              }}
              onLogout={handleLogout}
            />
          )}

          {/* Operations & Supply Chain Tri-Pillar Dashboard */}
          {activeTab === 'operations-dashboard' && (
            <OperationsDashboardView
              initialSection="all"
              onNavigateToTab={(tab) => {
                setActiveTab(tab as NavTab);
              }}
              currentUserName={currentUser?.name || 'Operations Director'}
            />
          )}

          {activeTab === 'lead-overview' && (
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
              onEditProposal={handleStartEditProposal}
              onDeleteProposal={handleDeleteProposal}
              onUpdateStatus={handleUpdateProposalStatus}
              onExportCsv={() => handleExportCsv('Proposals')}
              onNavigateToTemplates={() => {
                setSettingsSubTab('templates');
                setActiveTab('settings');
              }}
              onEmailProposal={(prop) => {
                setGmailLeadFilter(prop.leadId);
                setActiveTab('gmail');
              }}
              onOpenNewProposalPrompt={() => {
                setProposalTargetTemplateId(undefined);
                setProposalTargetLead(leads.length > 0 ? leads[0] : null);
                setIsCreateProposalOpen(true);
              }}
              onUpdateProposal={handleUpdateProposal}
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
              onNavigateToProposals={(templateId) => {
                setProposalTargetTemplateId(templateId);
                setProposalTargetLead(leads.length > 0 ? leads[0] : null);
                setActiveTab('proposals');
                setIsCreateProposalOpen(true);
              }}
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
              onNavigate={(tab, subTab) => {
                if (tab === 'hr-recruitment') {
                  if (subTab === 'applicants') setActiveTab('hr-recruitment-applicants');
                  else if (subTab === 'interview') setActiveTab('hr-recruitment-interviews');
                  else if (subTab === 'offers') setActiveTab('hr-recruitment-offers');
                  else if (subTab === 'appointments') setActiveTab('hr-recruitment-appointments');
                  else setActiveTab('hr-recruitment-positions');
                } else {
                  setActiveTab(tab as NavTab);
                }
              }}
              onOpenAddStaff={() => setActiveTab('hr-staff')}
              onOpenCreatePosition={() => setActiveTab('hr-recruitment-positions')}
              onOpenNewInterview={() => setActiveTab('hr-recruitment-interviews')}
              onOpenMarkAttendance={() => setActiveTab('hr-attendance')}
              onOpenLeaveApproval={() => setActiveTab('hr-attendance')}
              onOpenProcessPayroll={() => setActiveTab('hr-payroll')}
            />
          )}

          {[
            'hr-recruitment',
            'hr-recruitment-positions',
            'hr-recruitment-applicants',
            'hr-recruitment-interviews',
            'hr-recruitment-offers',
            'hr-recruitment-appointments',
          ].includes(activeTab) && (
            <RecruitmentView
              positions={hrPositions}
              applicants={hrApplicants}
              interviews={hrInterviews}
              offerLetters={hrOffers}
              appointmentLetters={hrAppointments}
              initialSubTab={
                activeTab === 'hr-recruitment-applicants'
                  ? 'applicants'
                  : activeTab === 'hr-recruitment-interviews'
                  ? 'interview'
                  : activeTab === 'hr-recruitment-offers'
                  ? 'offers'
                  : activeTab === 'hr-recruitment-appointments'
                  ? 'appointments'
                  : 'positions'
              }
              onSubTabChange={(sub) => {
                const subMap: Record<string, NavTab> = {
                  positions: 'hr-recruitment-positions',
                  applicants: 'hr-recruitment-applicants',
                  interview: 'hr-recruitment-interviews',
                  offers: 'hr-recruitment-offers',
                  appointments: 'hr-recruitment-appointments',
                };
                if (subMap[sub]) {
                  setActiveTab(subMap[sub]);
                }
              }}
              onSavePosition={handleSavePosition}
              onDeletePosition={handleDeletePosition}
              onSaveApplicant={handleSaveApplicant}
              onUpdateApplicantStage={handleUpdateApplicantStage}
              onDeleteApplicant={handleDeleteApplicant}
              onScheduleInterview={handleScheduleInterview}
              onSaveInterviewEvaluation={handleSaveInterviewEvaluation}
              onGenerateOffer={handleGenerateOfferLetter}
              onUpdateOfferStatus={handleUpdateOfferStatus}
              onDeleteOffer={handleDeleteOfferLetter}
              onGenerateAppointment={handleGenerateAppointmentLetter}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointmentLetter}
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
              onClearAllDummyData={handleClearAllDummyData}
              onNavigateToHrConfiguration={() => setActiveTab('hr-settings')}
              prefillStaffData={pendingStaffOnboarding?.prefillData || null}
              onClearPrefillStaffData={() => setPendingStaffOnboarding(null)}
            />
          )}

          {activeTab === 'hr-branch-dashboard' && (
            <BranchDashboardView
              onNavigateTab={(tab) => {
                if (tab === 'hr_staff_directory') setActiveTab('hr-staff');
                else if (tab === 'hr_staff_access') setActiveTab('hr-staff-access');
                else setActiveTab(tab as NavTab);
              }}
            />
          )}

          {activeTab === 'hr-staff-access' && (
            <StaffAccessManagementView
              onSwitchUser={(staffUser) => {
                handleSwitchUser(staffUser);
              }}
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
              initialSection="access-matrix"
            />
          )}

          {/* Document & Expiry Management View */}
          {[
            'doc-expiry',
            'doc-dashboard',
            'doc-registry',
            'doc-calendar',
            'doc-reminders',
            'doc-renewals',
            'doc-types',
          ].includes(activeTab) && (
            <DocumentExpiryView
              currentUserName={currentUser?.name || 'Administrator'}
              activeSubTab={
                activeTab === 'doc-registry'
                  ? 'documents'
                  : activeTab === 'doc-calendar'
                  ? 'calendar'
                  : activeTab === 'doc-reminders'
                  ? 'reminders'
                  : activeTab === 'doc-renewals'
                  ? 'renewals'
                  : activeTab === 'doc-types'
                  ? 'types'
                  : 'dashboard'
              }
              onSubTabChange={(subTab) => {
                const map: Record<string, NavTab> = {
                  dashboard: 'doc-dashboard',
                  documents: 'doc-registry',
                  calendar: 'doc-calendar',
                  reminders: 'doc-reminders',
                  renewals: 'doc-renewals',
                  types: 'doc-types',
                };
                setActiveTab(map[subTab] || 'doc-dashboard');
              }}
            />
          )}

          {/* Asset Management Module */}
          {(activeTab === 'assets' || activeTab.startsWith('asset-')) && (
            <AssetModule
              actorName={currentUser?.name || 'Administrator'}
              initialSubTab={
                activeTab === 'asset-register'
                  ? 'register'
                  : activeTab === 'asset-requests'
                  ? 'requests'
                  : activeTab === 'asset-pos'
                  ? 'pos'
                  : activeTab === 'asset-receiving'
                  ? 'receiving'
                  : activeTab === 'asset-movements'
                  ? 'movements'
                  : activeTab === 'asset-maintenance'
                  ? 'maintenance'
                  : activeTab === 'asset-warranties'
                  ? 'warranties'
                  : activeTab === 'asset-retirements'
                  ? 'retirements'
                  : activeTab === 'asset-reports'
                  ? 'reports'
                  : activeTab === 'asset-settings'
                  ? 'settings'
                  : 'overview'
              }
              onSubTabChange={(subTab) => {
                const map: Record<string, NavTab> = {
                  overview: 'asset-overview',
                  register: 'asset-register',
                  requests: 'asset-requests',
                  pos: 'asset-pos',
                  receiving: 'asset-receiving',
                  movements: 'asset-movements',
                  maintenance: 'asset-maintenance',
                  warranties: 'asset-warranties',
                  retirements: 'asset-retirements',
                  reports: 'asset-reports',
                  settings: 'asset-settings',
                };
                if (map[subTab]) {
                  setActiveTab(map[subTab]);
                }
              }}
            />
          )}

          {/* Party Management Module */}
          {(activeTab === 'party-management' ||
            activeTab === 'party-directory' ||
            activeTab === 'party-ledger' ||
            activeTab === 'finance-parties' ||
            activeTab === 'finance-party-ledger') && (
            <PartyManagementModule
              currentTab={
                activeTab === 'party-ledger' || activeTab === 'finance-party-ledger'
                  ? 'ledger'
                  : 'directory'
              }
              onTabChange={(tab) => {
                setActiveTab(tab);
              }}
            />
          )}

          {/* Sales Module */}
          {(activeTab === 'sales' ||
            activeTab.startsWith('sales-') ||
            activeTab === 'finance-sales' ||
            activeTab === 'finance-sales-ar') && (
            <SalesModule
              currentTab={
                activeTab === 'sales-dashboard' || activeTab === 'sales'
                  ? 'dashboard'
                  : activeTab === 'sales-quotation'
                  ? 'quotation'
                  : activeTab === 'sales-order'
                  ? 'order'
                  : activeTab === 'sales-invoice'
                  ? 'invoice'
                  : activeTab === 'sales-return-request'
                  ? 'return-request'
                  : activeTab === 'sales-return'
                  ? 'return'
                  : activeTab === 'sales-quotation-report'
                  ? 'report-quotation'
                  : activeTab === 'sales-order-report'
                  ? 'report-order'
                  : activeTab === 'sales-invoice-report'
                  ? 'report-invoice'
                  : activeTab === 'sales-return-request-report'
                  ? 'report-return-request'
                  : activeTab === 'sales-return-report'
                  ? 'report-return'
                  : activeTab === 'sales-ar' || activeTab === 'finance-sales-ar'
                  ? 'ar-ledger'
                  : activeTab === 'sales-receipts'
                  ? 'receipts'
                  : 'dashboard'
              }
              currentUserName={currentUser?.name || 'Sales Manager'}
              userRole={currentUser?.role || 'Admin'}
              onTabChange={(tab) => {
                setActiveTab(tab as NavTab);
              }}
            />
          )}

          {/* Purchase Module */}
          {(activeTab === 'purchase' ||
            activeTab.startsWith('purchase-') ||
            activeTab === 'goods-receipt' ||
            activeTab === 'goods-receipt-report' ||
            activeTab === 'finance-purchase') && (
            <PurchaseModule
              currentTab={
                activeTab === 'purchase-dashboard' || activeTab === 'purchase'
                  ? 'dashboard'
                  : activeTab === 'purchase-request'
                  ? 'request'
                  : activeTab === 'purchase-quotation'
                  ? 'quotation'
                  : activeTab === 'purchase-quotation-comparison'
                  ? 'comparison'
                  : activeTab === 'purchase-order'
                  ? 'order'
                  : activeTab === 'goods-receipt'
                  ? 'goods-receipt'
                  : activeTab === 'purchase-invoice'
                  ? 'invoice'
                  : activeTab === 'purchase-return-request'
                  ? 'return-request'
                  : activeTab === 'purchase-return'
                  ? 'return'
                  : activeTab === 'purchase-request-report'
                  ? 'report-request'
                  : activeTab === 'purchase-quotation-report'
                  ? 'report-quotation'
                  : activeTab === 'purchase-quotation-comparison-report'
                  ? 'report-comparison'
                  : activeTab === 'purchase-order-report'
                  ? 'report-order'
                  : activeTab === 'goods-receipt-report'
                  ? 'report-goods-receipt'
                  : activeTab === 'purchase-invoice-report'
                  ? 'report-invoice'
                  : activeTab === 'purchase-return-request-report'
                  ? 'report-return-request'
                  : activeTab === 'purchase-return-report'
                  ? 'report-return'
                  : activeTab === 'purchase-payments'
                  ? 'payments'
                  : activeTab === 'purchase-advances'
                  ? 'advances'
                  : 'dashboard'
              }
              currentUserName={currentUser?.name || 'Purchase Manager'}
              userRole={currentUser?.role || 'Admin'}
              onTabChange={(tab) => {
                setActiveTab(tab as NavTab);
              }}
            />
          )}

          {/* Item Master & Inventory Module */}
          {(activeTab === 'inventory' ||
            activeTab === 'inventory-dashboard' ||
            activeTab === 'inventory-items' ||
            activeTab === 'inventory-valuation' ||
            activeTab === 'inventory-movements' ||
            activeTab === 'item-master' ||
            activeTab === 'finance-item-master') && (
            <InventoryModule
              currentTab={
                activeTab === 'inventory-dashboard' || activeTab === 'inventory'
                  ? 'dashboard'
                  : activeTab === 'inventory-valuation'
                  ? 'valuation'
                  : activeTab === 'inventory-movements'
                  ? 'movements'
                  : 'items'
              }
              currentUserName={currentUser?.name || 'Inventory Controller'}
              userRole={currentUser?.role || 'Admin'}
              onTabChange={(tab) => {
                setActiveTab(tab as NavTab);
              }}
            />
          )}

          {/* Finance & Budgeting Module (Excluding Party, Sales, Purchase, Inventory) */}
          {(activeTab === 'finance' || activeTab.startsWith('finance-')) &&
            ![
              'finance-parties',
              'finance-party-ledger',
              'finance-sales',
              'finance-sales-ar',
              'finance-purchase',
              'finance-item-master',
            ].includes(activeTab) && (
            <FinanceDashboardView
              currentUserName={currentUser?.name || 'Finance Officer'}
              userRole={currentUser?.role || 'Admin'}
              initialSubTab={
                activeTab === 'finance-planner'
                  ? 'planner'
                  : activeTab === 'finance-ledger'
                  ? 'ledger'
                  : activeTab === 'finance-projections'
                  ? 'projections'
                  : activeTab === 'finance-gl'
                  ? 'gl'
                  : activeTab === 'finance-cash-bank'
                  ? 'cash-bank'
                  : activeTab === 'finance-loans'
                  ? 'loans'
                  : activeTab === 'finance-payments'
                  ? 'payments'
                  : activeTab === 'finance-receipts'
                  ? 'receipts'
                  : activeTab === 'finance-advances'
                  ? 'advances'
                  : activeTab === 'finance-controls-audit'
                  ? 'controls-audit'
                  : activeTab === 'finance-tax'
                  ? 'tax-compliance'
                  : activeTab === 'finance-budget'
                  ? 'budget-management'
                  : 'analytics'
              }
              onNavigateTab={(tab) => {
                if (tab) {
                  setActiveTab(tab as NavTab);
                }
              }}
            />
          )}
            </>
          )}
          </div>
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
          setEditingProposal(null);
          setProposalTargetTemplateId(undefined);
        }}
        lead={proposalTargetLead}
        editingProposal={editingProposal}
        leads={leads}
        settings={settings}
        currentUser={currentUser}
        initialTemplateId={proposalTargetTemplateId}
        onOpenTemplatesManager={() => {
          setIsCreateProposalOpen(false);
          setSettingsSubTab('templates');
          setActiveTab('settings');
        }}
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
        initialMode={previewProposalInitialMode}
        onUpdateProposal={handleUpdateProposal}
        onEdit={() => {
          if (previewProposal) {
            handleStartEditProposal(previewProposal);
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

      {/* 5. Unified All Notifications & Alerts Center Modal */}
      {currentUser && (
        <AllNotificationsModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          currentUser={currentUser}
          leads={leads}
          followUps={followUps}
          proposals={proposals}
          users={users}
          onRefreshAllData={refreshAllData}
          onNavigateToTab={(tab) => {
            setIsNotificationModalOpen(false);
            setActiveTab(tab);
          }}
          onSelectLead={(leadId) => {
            setIsNotificationModalOpen(false);
            const matched = leads.find((l) => l.id === leadId);
            if (matched) {
              setEditingLead(matched);
              setIsNewLeadOpen(true);
            } else {
              setActiveTab('leads');
            }
          }}
        />
      )}
    </div>
  );
}
