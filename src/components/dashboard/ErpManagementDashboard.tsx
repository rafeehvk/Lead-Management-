import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, Lead, FollowUp, Proposal } from '../../types';
import { StaffMember, DailyAttendanceRecord, LeaveRequest } from '../../types/hr';
import { ExpiryDocument, calculateDaysRemaining } from '../../types/documentExpiry';
import { storage } from '../../services/storageService';
import { hrStorage } from '../../services/hrStorageService';
import { documentExpiryStorage } from '../../services/documentExpiryStorage';
import { NavTab } from '../Sidebar';

import {
  DashboardFilterState,
  DashboardRoleView,
  SmartAlert,
  UnifiedActivityItem,
} from './dashboardTypes';

import { SmartInsightsBanner } from './SmartInsightsBanner';
import { ExecutiveKpiCards } from './ExecutiveKpiCards';
import { ActionRequiredSection } from './ActionRequiredSection';
import { LeadManagementSection } from './LeadManagementSection';
import { HrManagementSection } from './HrManagementSection';
import { DocumentExpirySection } from './DocumentExpirySection';
import { OperationsCommercialSection } from './OperationsCommercialSection';
import { QuickActionsBar } from './QuickActionsBar';
import { AlertNotificationDrawer } from './AlertNotificationDrawer';
import { QuickReportModal } from './QuickReportModal';

import { RenewalModal } from '../documentExpiry/RenewalModal';
import { DocumentDetailsModal } from '../documentExpiry/DocumentDetailsModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface ErpManagementDashboardProps {
  currentUser: User;
  onNavigateToTab: (tab: NavTab) => void;
  onOpenNewLeadModal?: () => void;
  onNavigateToLeadDetail?: (leadId: string) => void;
  onLogout?: () => void;
}

export const ErpManagementDashboard: React.FC<ErpManagementDashboardProps> = ({
  currentUser,
  onNavigateToTab,
  onOpenNewLeadModal,
  onNavigateToLeadDetail,
  onLogout,
}) => {
  // 1. Data States
  const [leads, setLeads] = useState<Lead[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<DailyAttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [documents, setDocuments] = useState<ExpiryDocument[]>([]);

  // 2. Dashboard Header Filter States
  const [filterState, setFilterState] = useState<DashboardFilterState>({
    dateRange: 'all',
    branch: 'All Branches',
    department: 'All Departments',
    employeeId: 'all',
    leadOwner: 'all',
    searchQuery: '',
  });

  // 3. Role view simulation
  const [activeRoleView, setActiveRoleView] = useState<DashboardRoleView>('Management / Director');

  // 4. Modal & Drawer States
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRenewDoc, setSelectedRenewDoc] = useState<ExpiryDocument | null>(null);
  const [selectedDetailsDoc, setSelectedDetailsDoc] = useState<ExpiryDocument | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load all module data
  const refreshAllData = useCallback(() => {
    // Leads / CRM
    const loadedLeads = storage.getLeads();
    const loadedFollowUps = storage.getFollowUps();
    const loadedProposals = storage.getProposals();
    const loadedUsers = storage.getUsers();

    setLeads(loadedLeads);
    setFollowUps(loadedFollowUps);
    setProposals(loadedProposals);
    setUsers(loadedUsers);

    // HR
    const loadedStaff = hrStorage.getStaff();
    const loadedAttendance = hrStorage.getAttendanceRecords();
    const loadedLeaves = hrStorage.getLeaveRequests();

    setStaff(loadedStaff);
    setAttendance(loadedAttendance);
    setLeaveRequests(loadedLeaves);

    // Document Expiry
    const loadedDocs = documentExpiryStorage.getDocuments();
    setDocuments(loadedDocs);
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Filter change handler
  const handleFilterChange = (newFilters: Partial<DashboardFilterState>) => {
    setFilterState((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilterState({
      dateRange: 'all',
      branch: 'All Branches',
      department: 'All Departments',
      employeeId: 'all',
      leadOwner: 'all',
      searchQuery: '',
    });
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filterState.leadOwner !== 'all' && l.assignedTo !== filterState.leadOwner) return false;
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const match =
          l.instituteName?.toLowerCase().includes(q) ||
          l.contactName?.toLowerCase().includes(q) ||
          l.city?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, filterState]);

  // Filtered Staff
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      if (filterState.department !== 'All Departments' && s.department !== filterState.department)
        return false;
      if (filterState.employeeId !== 'all' && s.id !== filterState.employeeId) return false;
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const match =
          s.fullName.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [staff, filterState]);

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((d) => {
      if (filterState.department !== 'All Departments' && d.department !== filterState.department)
        return false;
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const match =
          d.documentName.toLowerCase().includes(q) ||
          d.relatedParty.toLowerCase().includes(q) ||
          d.referenceNumber.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [documents, filterState]);

  // Today Date String
  const todayStr = new Date().toISOString().split('T')[0];

  // Overdue follow-ups & today follow-ups
  const overdueFollowUps = useMemo(() => {
    return followUps
      .filter((f) => f.scheduledDate < todayStr && f.status === 'Pending')
      .map((f) => ({
        followUp: f,
        lead: leads.find((l) => l.id === f.leadId),
      }));
  }, [followUps, leads, todayStr]);

  const todayFollowUps = useMemo(() => {
    return followUps
      .filter((f) => f.scheduledDate === todayStr && f.status === 'Pending')
      .map((f) => ({
        followUp: f,
        lead: leads.find((l) => l.id === f.leadId),
      }));
  }, [followUps, leads, todayStr]);

  const unassignedLeads = useMemo(() => {
    return filteredLeads.filter((l) => !l.assignedTo || l.assignedTo.trim() === '');
  }, [filteredLeads]);

  // HR metrics
  const pendingLeaveRequests = useMemo(() => {
    return leaveRequests.filter((l) => l.status === 'Pending');
  }, [leaveRequests]);

  const todayAttendanceRecords = useMemo(() => {
    return attendance.filter((a) => a.date === todayStr);
  }, [attendance, todayStr]);

  const unmarkedAttendanceStaff = useMemo(() => {
    const markedIds = new Set(todayAttendanceRecords.map((r) => r.staffId));
    return staff.filter((s) => !markedIds.has(s.id) && s.status !== 'Inactive');
  }, [staff, todayAttendanceRecords]);

  // Document metrics
  const expiredDocuments = useMemo(() => {
    return documents.filter((d) => calculateDaysRemaining(d.expiryDate) < 0);
  }, [documents]);

  const expiring7dDocuments = useMemo(() => {
    return documents.filter((d) => {
      const days = calculateDaysRemaining(d.expiryDate);
      return days >= 0 && days <= 7;
    });
  }, [documents]);

  const expiring30dDocuments = useMemo(() => {
    return documents.filter((d) => {
      const days = calculateDaysRemaining(d.expiryDate);
      return days > 7 && days <= 30;
    });
  }, [documents]);

  const expiring90dDocuments = useMemo(() => {
    return documents.filter((d) => {
      const days = calculateDaysRemaining(d.expiryDate);
      return days > 30 && days <= 90;
    });
  }, [documents]);

  const validDocuments = useMemo(() => {
    return documents.filter((d) => calculateDaysRemaining(d.expiryDate) > 90);
  }, [documents]);

  // Intelligent Smart Alerts (Cross-module AI/Smart Insights)
  const smartAlerts: SmartAlert[] = useMemo(() => {
    const list: SmartAlert[] = [];

    // Expired Documents
    expiredDocuments.forEach((doc) => {
      list.push({
        id: `alert-doc-exp-${doc.id}`,
        module: 'document',
        urgency: 'critical',
        title: `EXPIRED: ${doc.documentName}`,
        description: `Document for ${doc.relatedParty} (${doc.department}) expired on ${doc.expiryDate}. Immediate renewal mandatory.`,
        actionLabel: 'Renew Document',
        targetTab: 'doc-renewals',
        data: doc,
      });
    });

    // 7 Days Expiry
    expiring7dDocuments.forEach((doc) => {
      const days = calculateDaysRemaining(doc.expiryDate);
      list.push({
        id: `alert-doc-7d-${doc.id}`,
        module: 'document',
        urgency: 'high',
        title: `Expires in ${days} days: ${doc.documentName}`,
        description: `${doc.relatedParty} document reaches legal expiration on ${doc.expiryDate}. Contact vendor or agency.`,
        actionLabel: 'Initiate Renewal',
        targetTab: 'doc-registry',
        data: doc,
      });
    });

    // Overdue Follow-ups
    overdueFollowUps.forEach(({ followUp, lead }) => {
      list.push({
        id: `alert-lead-od-${followUp.id}`,
        module: 'lead',
        urgency: 'high',
        title: `Overdue Follow-up: ${lead?.instituteName || followUp.leadId}`,
        description: `Sales follow-up assigned to ${followUp.assignedTo} was due on ${followUp.scheduledDate}. Action needed to protect deal.`,
        actionLabel: 'Open Follow-up',
        targetTab: 'followups',
        data: followUp,
      });
    });

    // Pending Leaves
    if (pendingLeaveRequests.length > 0) {
      list.push({
        id: 'alert-hr-leaves',
        module: 'hr',
        urgency: 'medium',
        title: `${pendingLeaveRequests.length} Leave Requests Pending Approval`,
        description: `Employees await management review: ${pendingLeaveRequests[0]?.staffName} (${pendingLeaveRequests[0]?.leaveType}), etc.`,
        actionLabel: 'Review Leaves',
        targetTab: 'hr-staff',
      });
    }

    // Unmarked Attendance
    if (unmarkedAttendanceStaff.length > 0) {
      list.push({
        id: 'alert-hr-attendance',
        module: 'hr',
        urgency: 'info',
        title: `${unmarkedAttendanceStaff.length} Staff Unmarked for Attendance`,
        description: "Today's daily attendance roster has unrecorded entries.",
        actionLabel: 'Update Roster',
        targetTab: 'hr-attendance',
      });
    }

    return list;
  }, [expiredDocuments, expiring7dDocuments, overdueFollowUps, pendingLeaveRequests, unmarkedAttendanceStaff]);

  // Executive KPI Data calculation
  const executiveKpiData = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const newLeads = filteredLeads.filter((l) => l.status === 'New').length;
    const followUpsRequired = filteredLeads.filter((l) => l.status === 'Follow-up').length;
    const qualifiedLeads = filteredLeads.filter((l) =>
      ['Qualified', 'Demo Scheduled', 'Demo Completed'].includes(l.status)
    ).length;
    const convertedLeads = filteredLeads.filter((l) => l.status === 'Won').length;
    const lostLeads = filteredLeads.filter((l) => ['Lost', 'On Hold'].includes(l.status)).length;
    const leadConversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

    const totalPipelineValue = filteredLeads.reduce(
      (acc, l) => acc + (Number(l.expectedRevenue) || 0),
      0
    );
    const pipelineValueFormatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(totalPipelineValue);

    // HR
    const totalEmployees = filteredStaff.length;
    const todayRecs = attendance.filter((a) => a.date === todayStr);
    const presentToday = todayRecs.filter((a) => a.status === 'Present').length;
    const absentToday = todayRecs.filter((a) => a.status === 'Absent').length;
    const lateToday = todayRecs.filter((a) => a.status === 'Late').length;
    const onLeaveToday = todayRecs.filter((a) => a.status === 'Leave').length;
    const pendingLeaves = pendingLeaveRequests.length;
    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 100;

    // Docs
    const totalDocuments = filteredDocuments.length;
    const complianceRate =
      totalDocuments > 0
        ? Math.round(
            ((totalDocuments - expiredDocuments.length - expiring7dDocuments.length) /
              totalDocuments) *
              100
          )
        : 100;

    return {
      totalLeads,
      newLeads,
      followUpsRequired,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      leadConversionRate,
      pipelineValueFormatted,
      totalEmployees,
      presentToday,
      absentToday,
      lateToday,
      onLeaveToday,
      pendingLeaves,
      attendanceRate,
      totalDocuments,
      validDocuments: validDocuments.length,
      expiring7d: expiring7dDocuments.length,
      expiring30d: expiring30dDocuments.length,
      expiring90d: expiring90dDocuments.length,
      expiredDocuments: expiredDocuments.length,
      complianceRate,
    };
  }, [
    filteredLeads,
    filteredStaff,
    filteredDocuments,
    attendance,
    todayStr,
    pendingLeaveRequests,
    validDocuments,
    expiring7dDocuments,
    expiring30dDocuments,
    expiring90dDocuments,
    expiredDocuments,
  ]);

  // Unified Recent Activities List
  const recentActivities: UnifiedActivityItem[] = useMemo(() => {
    const list: UnifiedActivityItem[] = [];

    // Lead Activities
    leads.slice(0, 4).forEach((l) => {
      list.push({
        id: `act-lead-${l.id}`,
        module: 'lead',
        timestamp: l.createdDate || 'Recent',
        user: l.assignedTo || 'Sales Admin',
        action: `Lead registered under status ${l.status}`,
        title: `Lead: ${l.instituteName}`,
        details: `${l.city ? `${l.city} • ` : ''}${l.source || 'Inbound'}`,
      });
    });

    // HR Activities
    leaveRequests.slice(0, 3).forEach((req) => {
      list.push({
        id: `act-hr-${req.id}`,
        module: 'hr',
        timestamp: req.createdAt || 'Today',
        user: req.staffName,
        action: `Submitted leave request for ${req.numberOfDays} days`,
        title: `Leave Application: ${req.staffName}`,
        details: `${req.leaveType} (${req.fromDate} to ${req.toDate}) - ${req.status}`,
      });
    });

    // Document Activities
    documents.slice(0, 3).forEach((doc) => {
      list.push({
        id: `act-doc-${doc.id}`,
        module: 'document',
        timestamp: doc.lastRenewedDate || doc.issueDate || 'Recent',
        user: doc.responsiblePerson || 'Compliance Officer',
        action: `Document registered / active: ${doc.documentTypeName}`,
        title: `Document: ${doc.documentName}`,
        details: `Ref: ${doc.referenceNumber} • Expiry: ${doc.expiryDate}`,
      });
    });

    return list;
  }, [leads, leaveRequests, documents]);

  // Handlers for Inline Approvals
  const handleApproveLeave = (leaveId: string) => {
    hrStorage.updateLeaveStatus(leaveId, 'Approved', 'Approved via ERP Executive Dashboard', currentUser.name);
    setToastMessage({
      type: 'success',
      text: `Leave request ${leaveId} approved successfully.`,
    });
    refreshAllData();
  };

  const handleRejectLeave = (leaveId: string) => {
    hrStorage.updateLeaveStatus(leaveId, 'Rejected', 'Rejected via ERP Executive Dashboard', currentUser.name);
    setToastMessage({
      type: 'info',
      text: `Leave request ${leaveId} has been rejected.`,
    });
    refreshAllData();
  };

  // Handlers for Navigation & Drill-downs
  const handleCardClick = (module: 'leads' | 'hr' | 'documents', filterKey?: string) => {
    if (module === 'leads') {
      onNavigateToTab('leads');
    } else if (module === 'hr') {
      if (filterKey === 'present' || filterKey === 'late' || filterKey === 'absent') {
        onNavigateToTab('hr-attendance');
      } else {
        onNavigateToTab('hr-staff');
      }
    } else if (module === 'documents') {
      onNavigateToTab('doc-registry');
    }
  };

  const handleSmartAlertClick = (alert: SmartAlert) => {
    if (alert.targetTab) {
      onNavigateToTab(alert.targetTab as NavTab);
    } else if (alert.data && alert.module === 'document') {
      setSelectedRenewDoc(alert.data);
    } else if (alert.module === 'lead' && alert.data?.leadId && onNavigateToLeadDetail) {
      onNavigateToLeadDetail(alert.data.leadId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* 1. SMART INSIGHTS & WARNING BANNER */}
      <SmartInsightsBanner alerts={smartAlerts} onActionClick={handleSmartAlertClick} />

      {/* 2. EXECUTIVE KPI CARDS */}
      <ExecutiveKpiCards kpiData={executiveKpiData} onCardClick={handleCardClick} />

      {/* 4. UNIFIED "ACTION REQUIRED" SECTION */}
      <ActionRequiredSection
        overdueFollowUps={overdueFollowUps}
        todayFollowUps={todayFollowUps}
        unassignedLeads={unassignedLeads}
        pendingLeaveRequests={pendingLeaveRequests}
        unmarkedAttendanceStaff={unmarkedAttendanceStaff}
        expiredDocuments={expiredDocuments}
        expiring7dDocuments={expiring7dDocuments}
        onApproveLeave={handleApproveLeave}
        onRejectLeave={handleRejectLeave}
        onOpenRenewModal={(doc) => setSelectedRenewDoc(doc)}
        onOpenDocumentDetails={(doc) => setSelectedDetailsDoc(doc)}
        onNavigateToLead={(leadId) => {
          if (onNavigateToLeadDetail) onNavigateToLeadDetail(leadId);
          else onNavigateToTab('leads');
        }}
        onNavigateToStaff={(staffId) => onNavigateToTab('hr-staff')}
        onNavigateToAttendance={() => onNavigateToTab('hr-attendance')}
      />

      {/* 5. QUICK ACTIONS SHORTCUT BAR */}
      <QuickActionsBar
        onCreateLead={() => {
          if (onOpenNewLeadModal) onOpenNewLeadModal();
          else onNavigateToTab('leads');
        }}
        onAddEmployee={() => onNavigateToTab('hr-staff')}
        onMarkAttendance={() => onNavigateToTab('hr-attendance')}
        onCreateLeaveRequest={() => onNavigateToTab('hr-staff')}
        onUploadDocument={() => onNavigateToTab('doc-registry')}
        onRenewDocument={() => {
          if (expiredDocuments.length > 0) setSelectedRenewDoc(expiredDocuments[0]);
          else onNavigateToTab('doc-renewals');
        }}
        onScheduleFollowUp={() => onNavigateToTab('followups')}
        onGenerateReport={() => setIsReportModalOpen(true)}
      />

      {/* 5b. COMMERCIAL & SUPPLY CHAIN OPERATIONS (SALES, PURCHASE & INVENTORY) */}
      <OperationsCommercialSection onNavigateToTab={onNavigateToTab} />

      {/* 6. MODULE 1: LEAD MANAGEMENT SECTION */}
      <LeadManagementSection
        leads={filteredLeads}
        followUps={followUps}
        users={users}
        onNavigateToLead={(leadId) => {
          if (onNavigateToLeadDetail) onNavigateToLeadDetail(leadId);
          else onNavigateToTab('leads');
        }}
        onNavigateToFollowUpsTab={() => onNavigateToTab('followups')}
        onNavigateToFullLeads={() => onNavigateToTab('lead-overview')}
      />

      {/* 7. MODULE 2: HR MANAGEMENT SECTION */}
      <HrManagementSection
        staff={filteredStaff}
        attendance={attendance}
        leaveRequests={leaveRequests}
        onApproveLeave={handleApproveLeave}
        onRejectLeave={handleRejectLeave}
        onNavigateToStaffDirectory={() => onNavigateToTab('hr-staff')}
        onNavigateToAttendance={() => onNavigateToTab('hr-attendance')}
        onNavigateToLeaveManagement={() => onNavigateToTab('hr-staff')}
      />

      {/* 8. MODULE 3: DOCUMENT EXPIRY MANAGEMENT SECTION */}
      <DocumentExpirySection
        documents={filteredDocuments}
        onOpenRenewModal={(doc) => setSelectedRenewDoc(doc)}
        onOpenDetailsModal={(doc) => setSelectedDetailsDoc(doc)}
        onNavigateToDocumentRegistry={() => onNavigateToTab('doc-registry')}
      />

      {/* Modals & Drawers */}
      <AlertNotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        alerts={smartAlerts}
        onAlertClick={handleSmartAlertClick}
      />

      <QuickReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        leads={leads}
        staff={staff}
        attendance={attendance}
        leaveRequests={leaveRequests}
        documents={documents}
      />

      {/* Renewal Modal */}
      {selectedRenewDoc && (
        <RenewalModal
          isOpen={true}
          document={selectedRenewDoc}
          currentUserName={currentUser.name}
          onClose={() => setSelectedRenewDoc(null)}
          onRenewalComplete={(renewedDoc) => {
            setSelectedRenewDoc(null);
            setToastMessage({
              type: 'success',
              text: `Document "${renewedDoc.documentName}" successfully renewed.`,
            });
            refreshAllData();
          }}
        />
      )}

      {/* Document Details Modal */}
      {selectedDetailsDoc && (
        <DocumentDetailsModal
          isOpen={true}
          document={selectedDetailsDoc}
          onClose={() => setSelectedDetailsDoc(null)}
          onOpenRenew={(doc) => {
            setSelectedDetailsDoc(null);
            setSelectedRenewDoc(doc);
          }}
          onOpenEdit={() => {
            setSelectedDetailsDoc(null);
            onNavigateToTab('doc-registry');
          }}
        />
      )}
    </div>
  );
};
