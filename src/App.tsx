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
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const storedUserId = localStorage.getItem('mysar_active_user_id');
    const allUsers = storage.getUsers();
    const found = allUsers.find((u) => u.id === storedUserId);
    return found || allUsers[0] || {
      id: 'USR-001',
      name: 'Rafeeh V K',
      email: 'rafeeh@casbiro.com',
      mobile: '+91 98460 00000',
      role: 'Admin',
      status: 'Active',
    };
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

    // Keep currentUser reference in sync
    const refreshedCurrent = loadedUsers.find((u) => u.id === currentUser.id);
    if (refreshedCurrent) {
      setCurrentUser(refreshedCurrent);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('mysar_active_user_id', user.id);
  };

  // Calculate approaching follow-up notifications
  const dueNotifications = useMemo(() => {
    return notificationService.getDueFollowUpNotifications(followUps, leads, users);
  }, [followUps, leads, users]);

  // Notifications relevant for current user count
  const activeUserNotifications = useMemo(() => {
    if (currentUser.role === 'Salesperson') {
      return dueNotifications.filter((n) => n.salespersonName === currentUser.name);
    }
    return dueNotifications;
  }, [dueNotifications, currentUser]);

  // --- Lead Operations ---
  const handleSaveLead = (leadData: Partial<Lead>) => {
    storage.saveLead(leadData, currentUser.name);
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
        notificationsCount={activeUserNotifications.length}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        settings={settings}
      />

      {/* Main Layout: Sidebar + Dynamic Main Area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
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
          currentUser={currentUser}
          onOpenNotifications={() => setIsNotificationModalOpen(true)}
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
