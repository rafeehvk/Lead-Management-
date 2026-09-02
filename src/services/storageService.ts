import {
  Lead,
  Proposal,
  FollowUp,
  User,
  Settings,
  DashboardMetrics,
  LeadStatus,
  LeadPriority,
  PricingPlan,
  LeadActivity,
  ScheduledMeeting,
} from '../types';
import {
  initialLeads,
  initialProposals,
  initialFollowUps,
  initialUsers,
  initialSettings,
  initialPricingPlans,
  initialActivities,
  initialScheduledMeetings,
} from '../mockData';

const STORAGE_KEYS = {
  LEADS: 'mysar_leads_data_v1',
  PROPOSALS: 'mysar_proposals_data_v1',
  FOLLOWUPS: 'mysar_followups_data_v1',
  USERS: 'mysar_users_data_v1',
  SETTINGS: 'mysar_settings_data_v1',
  PRICING_PLANS: 'mysar_pricing_plans_master_v2',
  ACTIVITIES: 'mysar_lead_activities_data_v1',
  MEETINGS: 'mysar_scheduled_meetings_data_v1',
};

class StorageService {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultVal;
      return JSON.parse(item) as T;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  // --- LEADS ---
  public getLeads(): Lead[] {
    return this.getStorage<Lead[]>(STORAGE_KEYS.LEADS, initialLeads);
  }

  public saveLead(leadData: Partial<Lead>, actorName?: string): Lead {
    const leads = this.getLeads();
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const timeString = new Date().toTimeString().split(' ')[0];
    const fullTimestamp = `${today} ${timeString}`;
    const actor = actorName || leadData.assignedTo || 'Admin';

    if (leadData.id) {
      // Update
      const index = leads.findIndex((l) => l.id === leadData.id);
      if (index !== -1) {
        const oldLead = leads[index];
        const updatedLead = {
          ...oldLead,
          ...leadData,
          updatedDate: today,
        };
        leads[index] = updatedLead;
        this.setStorage(STORAGE_KEYS.LEADS, leads);

        // Audit changes
        if (oldLead.status !== updatedLead.status) {
          this.saveActivity({
            leadId: updatedLead.id,
            type: 'change',
            title: `Status Changed to ${updatedLead.status}`,
            description: `Lead status was updated from "${oldLead.status}" to "${updatedLead.status}".`,
            actor,
            timestamp: fullTimestamp,
            metadata: {
              field: 'status',
              oldValue: oldLead.status,
              newValue: updatedLead.status,
            },
          });
        }
        if (oldLead.priority !== updatedLead.priority) {
          this.saveActivity({
            leadId: updatedLead.id,
            type: 'change',
            title: `Priority Updated to ${updatedLead.priority}`,
            description: `Lead priority changed from ${oldLead.priority} to ${updatedLead.priority}.`,
            actor,
            timestamp: fullTimestamp,
            metadata: {
              field: 'priority',
              oldValue: oldLead.priority,
              newValue: updatedLead.priority,
            },
          });
        }
        if (oldLead.assignedTo !== updatedLead.assignedTo) {
          this.saveActivity({
            leadId: updatedLead.id,
            type: 'change',
            title: `Reassigned to ${updatedLead.assignedTo}`,
            description: `Sales ownership reassigned from ${oldLead.assignedTo} to ${updatedLead.assignedTo}.`,
            actor,
            timestamp: fullTimestamp,
            metadata: {
              field: 'assignedTo',
              oldValue: oldLead.assignedTo,
              newValue: updatedLead.assignedTo,
            },
          });
        }
        if (oldLead.studentCount !== updatedLead.studentCount) {
          this.saveActivity({
            leadId: updatedLead.id,
            type: 'change',
            title: `Student Count Updated (${updatedLead.studentCount})`,
            description: `Student batch size changed from ${oldLead.studentCount} to ${updatedLead.studentCount} students.`,
            actor,
            timestamp: fullTimestamp,
            metadata: {
              field: 'studentCount',
              oldValue: String(oldLead.studentCount),
              newValue: String(updatedLead.studentCount),
            },
          });
        }
        if (oldLead.followUpDate !== updatedLead.followUpDate) {
          this.saveActivity({
            leadId: updatedLead.id,
            type: 'change',
            title: `Follow-up Date Set to ${updatedLead.followUpDate}`,
            description: `Next follow-up target rescheduled to ${updatedLead.followUpDate}.`,
            actor,
            timestamp: fullTimestamp,
            metadata: {
              field: 'followUpDate',
              oldValue: oldLead.followUpDate,
              newValue: updatedLead.followUpDate,
            },
          });
        }
        if (leadData.remarks && oldLead.remarks !== updatedLead.remarks) {
          this.saveActivity({
            leadId: updatedLead.id,
            type: 'note',
            title: 'Lead Notes Updated',
            description: updatedLead.remarks,
            actor,
            timestamp: fullTimestamp,
          });
        }

        return updatedLead;
      }
    }

    // New Lead
    const nextSeq = leads.length + 1;
    const year = new Date().getFullYear();
    const newId = `LEAD-${year}-${String(nextSeq).padStart(3, '0')}`;

    const newLead: Lead = {
      id: newId,
      leadDate: leadData.leadDate || today,
      instituteName: leadData.instituteName || 'Untitled Institute',
      contactPerson: leadData.contactPerson || 'Contact Person',
      mobile: leadData.mobile || '',
      email: leadData.email || '',
      address: leadData.address || '',
      studentCount: Number(leadData.studentCount) || 0,
      leadSource: leadData.leadSource || 'Direct',
      assignedTo: leadData.assignedTo || 'Anand Kumar',
      priority: leadData.priority || 'Medium',
      status: leadData.status || 'New',
      followUpDate: leadData.followUpDate || today,
      remarks: leadData.remarks || '',
      createdBy: leadData.createdBy || actor,
      createdDate: today,
      updatedDate: today,
    };

    leads.unshift(newLead);
    this.setStorage(STORAGE_KEYS.LEADS, leads);

    // Log creation activity
    this.saveActivity({
      leadId: newLead.id,
      type: 'system',
      title: 'Lead Created',
      description: `New institutional lead created for ${newLead.instituteName} (${newLead.studentCount} students) via ${newLead.leadSource}. Assigned to ${newLead.assignedTo}.`,
      actor: newLead.createdBy,
      timestamp: fullTimestamp,
      metadata: {
        field: 'status',
        newValue: newLead.status,
      },
    });

    return newLead;
  }

  public updateLeadStatus(leadId: string, newStatus: LeadStatus, actorName?: string): Lead | null {
    const leads = this.getLeads();
    const index = leads.findIndex((l) => l.id === leadId);
    if (index === -1) return null;

    const oldStatus = leads[index].status;
    const today = new Date().toISOString().split('T')[0];
    const timeString = new Date().toTimeString().split(' ')[0];

    leads[index] = {
      ...leads[index],
      status: newStatus,
      updatedDate: today,
    };
    this.setStorage(STORAGE_KEYS.LEADS, leads);

    if (oldStatus !== newStatus) {
      this.saveActivity({
        leadId,
        type: 'change',
        title: `Status Changed to ${newStatus}`,
        description: `Lead status progressed from "${oldStatus}" to "${newStatus}".`,
        actor: actorName || leads[index].assignedTo || 'System',
        timestamp: `${today} ${timeString}`,
        metadata: {
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
        },
      });
    }

    return leads[index];
  }

  public bulkImportLeads(
    leadsData: Array<Partial<Lead>>,
    actorName?: string
  ): { successCount: number; createdLeads: Lead[]; errors: string[] } {
    const leads = this.getLeads();
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const timeString = new Date().toTimeString().split(' ')[0];
    const fullTimestamp = `${today} ${timeString}`;
    const actor = actorName || 'Admin';
    const year = new Date().getFullYear();

    const createdLeads: Lead[] = [];
    const errors: string[] = [];

    // Find highest sequence number from existing leads
    let maxSeq = 0;
    for (const lead of leads) {
      const match = lead.id.match(/LEAD-\d{4}-(\d+)/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    if (maxSeq === 0) maxSeq = leads.length;

    for (let i = 0; i < leadsData.length; i++) {
      const row = leadsData[i];
      const instituteName = (row.instituteName || '').trim();
      if (!instituteName) {
        errors.push(`Row ${i + 1}: Missing Institute Name`);
        continue;
      }

      maxSeq++;
      const newId = `LEAD-${year}-${String(maxSeq).padStart(3, '0')}`;

      // Validate priority
      let priority: LeadPriority = 'Medium';
      if (row.priority && ['High', 'Medium', 'Low'].includes(row.priority)) {
        priority = row.priority as LeadPriority;
      }

      // Validate status
      let status: LeadStatus = 'New';
      const validStatuses: LeadStatus[] = [
        'New',
        'Contacted',
        'Follow-up',
        'Qualified',
        'Demo Scheduled',
        'Demo Completed',
        'Send Proposal',
        'Proposal Sent',
        'Negotiation',
        'Won',
        'Lost',
        'On Hold',
      ];
      if (row.status && validStatuses.includes(row.status as LeadStatus)) {
        status = row.status as LeadStatus;
      }

      const newLead: Lead = {
        id: newId,
        leadDate: row.leadDate || today,
        instituteName,
        contactPerson: row.contactPerson?.trim() || 'Principal / Administrator',
        mobile: row.mobile?.trim() || '',
        email: row.email?.trim() || '',
        address: row.address?.trim() || '',
        studentCount: Math.max(0, Number(row.studentCount) || 0),
        leadSource: row.leadSource?.trim() || 'CSV Import',
        assignedTo: row.assignedTo?.trim() || actor,
        priority,
        status,
        followUpDate: row.followUpDate || today,
        remarks: row.remarks?.trim() || 'Imported via CSV bulk upload',
        createdBy: actor,
        createdDate: today,
        updatedDate: today,
      };

      createdLeads.push(newLead);

      // Log creation activity
      this.saveActivity({
        leadId: newLead.id,
        type: 'system',
        title: 'Lead Imported via CSV',
        description: `Bulk imported institutional lead for ${newLead.instituteName} (${newLead.studentCount} students). Assigned to ${newLead.assignedTo}.`,
        actor,
        timestamp: fullTimestamp,
        metadata: {
          field: 'status',
          newValue: newLead.status,
        },
      });
    }

    if (createdLeads.length > 0) {
      const updatedLeads = [...createdLeads, ...leads];
      this.setStorage(STORAGE_KEYS.LEADS, updatedLeads);
    }

    return {
      successCount: createdLeads.length,
      createdLeads,
      errors,
    };
  }

  public deleteLead(leadId: string): boolean {
    const leads = this.getLeads().filter((l) => l.id !== leadId);
    this.setStorage(STORAGE_KEYS.LEADS, leads);
    return true;
  }

  // --- PROPOSALS ---
  public getProposals(): Proposal[] {
    return this.getStorage<Proposal[]>(STORAGE_KEYS.PROPOSALS, initialProposals);
  }

  public createProposal(proposalData: {
    leadId: string;
    instituteName: string;
    contactPerson: string;
    studentCount: number;
    pricingType: any;
    pricePerStudent: number;
    totalAmount?: number;
    pricingItems?: any[];
    proposalDate?: string;
    createdBy?: string;
    notes?: string;
  }): Proposal {
    const proposals = this.getProposals();
    const settings = this.getSettings();

    const currentYear = new Date().getFullYear();
    const seq = settings.proposalSequence;
    const formattedSeq = String(seq).padStart(3, '0');
    const proposalNumber = `${settings.proposalPrefix || `MYSAR/PROP/${currentYear}/`}${formattedSeq}`;

    // Update settings sequence
    settings.proposalSequence = seq + 1;
    this.saveSettings(settings);

    const today = proposalData.proposalDate || new Date().toISOString().split('T')[0];
    const totalAmount =
      proposalData.totalAmount !== undefined
        ? proposalData.totalAmount
        : (proposalData.studentCount || 0) * (proposalData.pricePerStudent || 0);

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + 30);
    const validUntil = validUntilDate.toISOString().split('T')[0];

    const newId = `PROP-${currentYear}-${String(proposals.length + 1).padStart(3, '0')}`;

    const newProposal: Proposal = {
      id: newId,
      leadId: proposalData.leadId,
      proposalNumber,
      proposalDate: today,
      instituteName: proposalData.instituteName,
      contactPerson: proposalData.contactPerson,
      studentCount: Number(proposalData.studentCount) || 0,
      pricingType: proposalData.pricingType,
      pricePerStudent: Number(proposalData.pricePerStudent) || 0,
      totalAmount,
      pricingItems: proposalData.pricingItems || [
        {
          id: `item-1`,
          pricingType: proposalData.pricingType,
          pricePerStudent: Number(proposalData.pricePerStudent) || 0,
          studentCount: Number(proposalData.studentCount) || 0,
          totalAmount,
          isPrimary: true,
        },
      ],
      proposalStatus: 'Draft',
      createdBy: proposalData.createdBy || 'Sales Rep',
      createdDate: today,
      validUntil,
      notes: proposalData.notes || '',
    };

    proposals.unshift(newProposal);
    this.setStorage(STORAGE_KEYS.PROPOSALS, proposals);

    // Automatically transition Lead status to 'Proposal Sent' or 'Send Proposal'
    if (proposalData.leadId) {
      this.updateLeadStatus(proposalData.leadId, 'Proposal Sent', proposalData.createdBy);

      // Log proposal generation activity
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().split(' ')[0];
      this.saveActivity({
        leadId: proposalData.leadId,
        type: 'proposal',
        title: `Proposal Generated (${newProposal.proposalNumber})`,
        description: `Created proposal for ${newProposal.studentCount} students @ ₹${newProposal.pricePerStudent}/student (${newProposal.pricingType}). Total Value: ₹${newProposal.totalAmount.toLocaleString('en-IN')}.`,
        actor: newProposal.createdBy,
        timestamp: `${todayStr} ${timeStr}`,
        metadata: {
          proposalNumber: newProposal.proposalNumber,
          proposalAmount: newProposal.totalAmount,
          statusBadge: newProposal.proposalStatus,
        },
      });
    }

    return newProposal;
  }

  public updateProposal(proposal: Proposal, actorName?: string): Proposal {
    const proposals = this.getProposals();
    const index = proposals.findIndex((p) => p.id === proposal.id);
    if (index !== -1) {
      const oldStatus = proposals[index].proposalStatus;
      proposals[index] = proposal;
      this.setStorage(STORAGE_KEYS.PROPOSALS, proposals);

      if (oldStatus !== proposal.proposalStatus && proposal.leadId) {
        const todayStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().split(' ')[0];
        this.saveActivity({
          leadId: proposal.leadId,
          type: 'proposal',
          title: `Proposal ${proposal.proposalNumber} status updated to ${proposal.proposalStatus}`,
          description: `Proposal commercial status changed from ${oldStatus} to ${proposal.proposalStatus}.`,
          actor: actorName || proposal.createdBy || 'Sales Rep',
          timestamp: `${todayStr} ${timeStr}`,
          metadata: {
            proposalNumber: proposal.proposalNumber,
            proposalAmount: proposal.totalAmount,
            statusBadge: proposal.proposalStatus,
          },
        });
      }
    }
    return proposal;
  }

  public deleteProposal(proposalId: string): boolean {
    const proposals = this.getProposals().filter((p) => p.id !== proposalId);
    this.setStorage(STORAGE_KEYS.PROPOSALS, proposals);
    return true;
  }

  // --- FOLLOW-UPS ---
  public getFollowUps(): FollowUp[] {
    const raw = this.getStorage<FollowUp[]>(STORAGE_KEYS.FOLLOWUPS, initialFollowUps);
    const seen = new Set<string>();
    const deduplicated: FollowUp[] = [];
    for (const item of raw) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduplicated.push(item);
      }
    }
    return deduplicated;
  }

  public saveFollowUp(fup: Partial<FollowUp>, actorName?: string): FollowUp {
    let followUps = this.getFollowUps();
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0];
    const year = new Date().getFullYear();

    // Check if updating an existing follow-up
    if (fup.id) {
      const existingIndex = followUps.findIndex((f) => f.id === fup.id);
      if (existingIndex !== -1) {
        const existing = followUps[existingIndex];
        const oldStatus = existing.status;
        const updatedFup: FollowUp = {
          ...existing,
          ...fup,
          id: existing.id,
          status: fup.status || existing.status,
        };

        // Remove any redundant duplicates with the same ID from earlier bugs
        followUps = followUps.filter((f, idx) => idx === existingIndex || f.id !== fup.id);
        const updatedIdx = followUps.findIndex((f) => f.id === fup.id);
        if (updatedIdx !== -1) {
          followUps[updatedIdx] = updatedFup;
        }

        this.setStorage(STORAGE_KEYS.FOLLOWUPS, followUps);

        // Sync next follow-up date to lead if changed
        if (updatedFup.leadId && updatedFup.nextFollowUpDate && updatedFup.nextFollowUpDate !== existing.nextFollowUpDate) {
          const leads = this.getLeads();
          const leadIdx = leads.findIndex((l) => l.id === updatedFup.leadId);
          if (leadIdx !== -1) {
            leads[leadIdx].followUpDate = updatedFup.nextFollowUpDate;
            leads[leadIdx].updatedDate = today;
            this.setStorage(STORAGE_KEYS.LEADS, leads);
          }
        }

        // Log follow-up completion activity if transitioned to Completed
        if (oldStatus !== 'Completed' && updatedFup.status === 'Completed' && updatedFup.leadId) {
          this.saveActivity({
            leadId: updatedFup.leadId,
            type: 'followup',
            title: `Follow-up Completed (${updatedFup.followUpType})`,
            description: `Follow-up ${updatedFup.id} for ${updatedFup.instituteName || 'Lead'} marked as completed by ${actorName || updatedFup.staff}.`,
            actor: actorName || updatedFup.staff,
            timestamp: `${today} ${timeStr}`,
            metadata: {
              followUpType: updatedFup.followUpType,
              statusBadge: 'Completed',
            },
          });
        }

        return updatedFup;
      }
    }

    // New Follow-up creation
    const newId = fup.id || `FUP-${year}-${String(followUps.length + 1).padStart(3, '0')}`;

    const newFup: FollowUp = {
      id: newId,
      leadId: fup.leadId || '',
      instituteName: fup.instituteName || '',
      followUpDate: fup.followUpDate || today,
      staff: fup.staff || 'Sales Team',
      followUpType: fup.followUpType || 'Call',
      discussion: fup.discussion || '',
      nextFollowUpDate: fup.nextFollowUpDate || '',
      status: fup.status || 'Pending',
      remarks: fup.remarks || '',
      createdDate: today,
    };

    followUps.unshift(newFup);
    this.setStorage(STORAGE_KEYS.FOLLOWUPS, followUps);

    // Sync next follow-up date to lead
    if (fup.leadId && fup.nextFollowUpDate) {
      const leads = this.getLeads();
      const leadIdx = leads.findIndex((l) => l.id === fup.leadId);
      if (leadIdx !== -1) {
        leads[leadIdx].followUpDate = fup.nextFollowUpDate;
        leads[leadIdx].updatedDate = today;
        this.setStorage(STORAGE_KEYS.LEADS, leads);
      }
    }

    // Log follow-up activity
    if (newFup.leadId) {
      this.saveActivity({
        leadId: newFup.leadId,
        type: 'followup',
        title: `${newFup.followUpType} Follow-up Logged`,
        description: newFup.discussion || `Conducted ${newFup.followUpType} with institute representative.`,
        actor: actorName || newFup.staff,
        timestamp: `${today} ${timeStr}`,
        metadata: {
          followUpType: newFup.followUpType,
          statusBadge: newFup.status,
        },
      });
    }

    return newFup;
  }

  // --- ACTIVITIES & AUDIT LOGS ---
  public getActivities(): LeadActivity[] {
    return this.getStorage<LeadActivity[]>(STORAGE_KEYS.ACTIVITIES, initialActivities);
  }

  public getLeadActivities(leadId: string): LeadActivity[] {
    const all = this.getActivities();
    return all
      .filter((a) => a.leadId === leadId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public saveActivity(activityData: Partial<LeadActivity>): LeadActivity {
    const all = this.getActivities();
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0];
    const newId = activityData.id || `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newActivity: LeadActivity = {
      id: newId,
      leadId: activityData.leadId || '',
      type: activityData.type || 'note',
      title: activityData.title || 'Note Added',
      description: activityData.description || '',
      actor: activityData.actor || 'Team Member',
      actorRole: activityData.actorRole,
      timestamp: activityData.timestamp || `${today} ${timeStr}`,
      metadata: activityData.metadata,
    };

    all.unshift(newActivity);
    this.setStorage(STORAGE_KEYS.ACTIVITIES, all);
    return newActivity;
  }

  public deleteActivity(activityId: string): boolean {
    const all = this.getActivities().filter((a) => a.id !== activityId);
    this.setStorage(STORAGE_KEYS.ACTIVITIES, all);
    return true;
  }

  public logEmailSent(
    leadId: string,
    actor: string,
    emailTo: string,
    subject: string,
    notes?: string
  ): LeadActivity {
    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0];

    return this.saveActivity({
      leadId,
      type: 'email',
      title: `Email Sent to ${emailTo}`,
      description: notes || `Sent email with subject "${subject}".`,
      actor,
      timestamp: `${today} ${timeStr}`,
      metadata: {
        emailTo,
        emailSubject: subject,
        statusBadge: 'Sent',
      },
    });
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.getStorage<User[]>(STORAGE_KEYS.USERS, initialUsers);
  }

  public saveUser(user: User): User[] {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setStorage(STORAGE_KEYS.USERS, users);
    return users;
  }

  public updateUser(user: User): User {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index !== -1) {
      users[index] = { ...users[index], ...user };
      this.setStorage(STORAGE_KEYS.USERS, users);
      return users[index];
    } else {
      users.push(user);
      this.setStorage(STORAGE_KEYS.USERS, users);
      return user;
    }
  }

  public deleteUser(userId: string): boolean {
    const users = this.getUsers().filter((u) => u.id !== userId);
    this.setStorage(STORAGE_KEYS.USERS, users);
    return true;
  }

  public toggleUserStatus(userId: string): User | null {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) return null;
    users[index].status = users[index].status === 'Active' ? 'Inactive' : 'Active';
    this.setStorage(STORAGE_KEYS.USERS, users);
    return users[index];
  }

  // --- ROLE PERMISSIONS OVERRIDES ---
  public getRolePermissions(): Record<string, Record<string, boolean>> | null {
    return this.getStorage<Record<string, Record<string, boolean>> | null>('mysar_rbac_permissions_v1', null);
  }

  public saveRolePermissions(perms: Record<string, Record<string, boolean>>): void {
    this.setStorage('mysar_rbac_permissions_v1', perms);
  }

  public resetRolePermissions(): void {
    localStorage.removeItem('mysar_rbac_permissions_v1');
  }

  // --- SETTINGS ---
  public getSettings(): Settings {
    return this.getStorage<Settings>(STORAGE_KEYS.SETTINGS, initialSettings);
  }

  public saveSettings(settings: Settings): Settings {
    this.setStorage(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }

  // --- DASHBOARD METRICS ---
  public getDashboardMetrics(): DashboardMetrics {
    const leads = this.getLeads();
    const proposals = this.getProposals();
    const followUps = this.getFollowUps();
    const today = new Date().toISOString().split('T')[0];

    const metrics: DashboardMetrics = {
      totalLeads: leads.length,
      newLeads: 0,
      followUpsToday: 0,
      qualifiedLeads: 0,
      proposalsPending: 0,
      proposalsSent: 0,
      negotiation: 0,
      won: 0,
      lost: 0,
      totalPipelineValue: 0,
      wonValue: 0,
    };

    leads.forEach((lead) => {
      switch (lead.status) {
        case 'New':
          metrics.newLeads++;
          break;
        case 'Qualified':
          metrics.qualifiedLeads++;
          break;
        case 'Send Proposal':
          metrics.proposalsPending++;
          break;
        case 'Proposal Sent':
          metrics.proposalsSent++;
          break;
        case 'Negotiation':
          metrics.negotiation++;
          break;
        case 'Won':
          metrics.won++;
          break;
        case 'Lost':
          metrics.lost++;
          break;
      }
    });

    followUps.forEach((fup) => {
      if ((fup.followUpDate === today || fup.nextFollowUpDate === today) && fup.status !== 'Completed') {
        metrics.followUpsToday++;
      }
    });

    proposals.forEach((prop) => {
      metrics.totalPipelineValue += prop.totalAmount || 0;
      if (prop.proposalStatus === 'Approved') {
        metrics.wonValue += prop.totalAmount || 0;
      }
    });

    return metrics;
  }

  // --- PRICING PLANS MASTER ---
  public getPricingPlans(): PricingPlan[] {
    const plans = this.getStorage<PricingPlan[]>(STORAGE_KEYS.PRICING_PLANS, initialPricingPlans);
    return plans.sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));
  }

  public savePricingPlans(plans: PricingPlan[]): void {
    this.setStorage(STORAGE_KEYS.PRICING_PLANS, plans);
  }

  public addPricingPlan(planData: Partial<PricingPlan>): PricingPlan {
    const plans = this.getPricingPlans();
    const nextSeq = plans.length + 1;
    const newId = `PLAN-${String(nextSeq).padStart(3, '0')}`;
    const today = new Date().toISOString().split('T')[0];

    const newPlan: PricingPlan = {
      id: newId,
      name: planData.name || 'Custom Plan',
      code: planData.code || `PLAN-${nextSeq}`,
      defaultPrice: Number(planData.defaultPrice) || 50,
      billingCycle: planData.billingCycle || 'Per Student / Year',
      description: planData.description || 'Custom institutional software licensing package',
      features: planData.features && planData.features.length > 0 ? planData.features : ['Core ERP Modules', 'Cloud Hosting', 'Standard SLA'],
      isActive: planData.isActive !== undefined ? planData.isActive : true,
      isPreset: planData.isPreset || false,
      minStudents: Number(planData.minStudents) || 100,
      sortOrder: planData.sortOrder !== undefined ? planData.sortOrder : plans.length + 1,
      createdDate: today,
      updatedDate: today,
    };

    plans.push(newPlan);
    this.savePricingPlans(plans);
    return newPlan;
  }

  public updatePricingPlan(plan: PricingPlan): PricingPlan {
    const plans = this.getPricingPlans();
    const index = plans.findIndex((p) => p.id === plan.id);
    const today = new Date().toISOString().split('T')[0];

    if (index !== -1) {
      plans[index] = {
        ...plans[index],
        ...plan,
        updatedDate: today,
      };
      this.savePricingPlans(plans);
      return plans[index];
    }
    return plan;
  }

  public deletePricingPlan(id: string): void {
    const plans = this.getPricingPlans();
    const filtered = plans.filter((p) => p.id !== id);
    this.savePricingPlans(filtered);
  }

  public togglePricingPlanStatus(id: string): PricingPlan | null {
    const plans = this.getPricingPlans();
    const index = plans.findIndex((p) => p.id === id);
    if (index !== -1) {
      plans[index].isActive = !plans[index].isActive;
      plans[index].updatedDate = new Date().toISOString().split('T')[0];
      this.savePricingPlans(plans);
      return plans[index];
    }
    return null;
  }

  public resetPricingPlans(): PricingPlan[] {
    this.savePricingPlans(initialPricingPlans);
    return initialPricingPlans;
  }

  // --- EXPORT TO CSV / SHEETS ---
  public exportTableToCsv(tableName: 'Leads' | 'Proposals' | 'FollowUps' | 'Users' | 'PricingPlans'): string {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (tableName === 'Leads') {
      headers = [
        'Lead ID', 'Lead Date', 'Institute Name', 'Contact Person', 'Mobile',
        'Email', 'Address', 'Student Count', 'Lead Source', 'Assigned To',
        'Priority', 'Status', 'Follow-up Date', 'Remarks', 'Created By',
        'Created Date', 'Updated Date'
      ];
      rows = this.getLeads().map((l) => [
        l.id, l.leadDate, `"${l.instituteName.replace(/"/g, '""')}"`, `"${l.contactPerson.replace(/"/g, '""')}"`,
        l.mobile, l.email, `"${l.address.replace(/"/g, '""')}"`, l.studentCount,
        l.leadSource, l.assignedTo, l.priority, l.status, l.followUpDate,
        `"${(l.remarks || '').replace(/"/g, '""')}"`, l.createdBy, l.createdDate, l.updatedDate
      ]);
    } else if (tableName === 'Proposals') {
      headers = [
        'Proposal ID', 'Lead ID', 'Proposal Number', 'Proposal Date',
        'Institute Name', 'Student Count', 'Pricing Type', 'Price Per Student',
        'Total Amount', 'Proposal Status', 'PDF File ID', 'PDF URL',
        'Created By', 'Created Date', 'Sent Date'
      ];
      rows = this.getProposals().map((p) => [
        p.id, p.leadId, p.proposalNumber, p.proposalDate,
        `"${p.instituteName.replace(/"/g, '""')}"`, p.studentCount, p.pricingType,
        p.pricePerStudent, p.totalAmount, p.proposalStatus, p.pdfFileId || '',
        p.pdfUrl || '', p.createdBy, p.createdDate, p.sentDate || ''
      ]);
    } else if (tableName === 'FollowUps') {
      headers = [
        'Follow-up ID', 'Lead ID', 'Follow-up Date', 'Staff', 'Follow-up Type',
        'Discussion', 'Next Follow-up Date', 'Status', 'Remarks', 'Created Date'
      ];
      rows = this.getFollowUps().map((f) => [
        f.id, f.leadId, f.followUpDate, f.staff, f.followUpType,
        `"${(f.discussion || '').replace(/"/g, '""')}"`, f.nextFollowUpDate, f.status,
        `"${(f.remarks || '').replace(/"/g, '""')}"`, f.createdDate
      ]);
    } else if (tableName === 'Users') {
      headers = ['User ID', 'Name', 'Email', 'Mobile', 'Role', 'Status'];
      rows = this.getUsers().map((u) => [
        u.id, `"${u.name}"`, u.email, u.mobile, u.role, u.status
      ]);
    } else if (tableName === 'PricingPlans') {
      headers = ['Plan ID', 'Plan Name', 'Code', 'Default Price (₹)', 'Billing Cycle', 'Status', 'Is Preset', 'Min Students', 'Description'];
      rows = this.getPricingPlans().map((p) => [
        p.id, `"${p.name}"`, p.code, p.defaultPrice, p.billingCycle, p.isActive ? 'Active' : 'Inactive', p.isPreset ? 'Yes' : 'No', p.minStudents || 0, `"${p.description.replace(/"/g, '""')}"`
      ]);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(','))
    ].join('\n');

    return csvContent;
  }

  // --- SCHEDULED GOOGLE MEET MEETINGS ---
  public getMeetings(): ScheduledMeeting[] {
    return this.getStorage<ScheduledMeeting[]>(STORAGE_KEYS.MEETINGS, initialScheduledMeetings);
  }

  public saveMeeting(meetingData: Partial<ScheduledMeeting>, actorName?: string): ScheduledMeeting {
    const meetings = this.getMeetings();
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const timeString = new Date().toTimeString().split(' ')[0];
    const fullTimestamp = `${today} ${timeString}`;
    const actor = actorName || meetingData.createdBy || 'Rahul Mehta';

    if (meetingData.id) {
      const idx = meetings.findIndex((m) => m.id === meetingData.id);
      if (idx !== -1) {
        const updated = { ...meetings[idx], ...meetingData };
        meetings[idx] = updated;
        this.setStorage(STORAGE_KEYS.MEETINGS, meetings);
        return updated;
      }
    }

    // Create New
    const newId = `MEET-2026-${String(meetings.length + 1).padStart(3, '0')}`;
    const newMeeting: ScheduledMeeting = {
      id: newId,
      title: meetingData.title || 'MYSAR Institutional Product Walkthrough',
      leadId: meetingData.leadId,
      instituteName: meetingData.instituteName,
      contactPerson: meetingData.contactPerson,
      participantEmails: meetingData.participantEmails || [],
      meetingUri: meetingData.meetingUri || 'https://meet.google.com/new',
      meetingCode: meetingData.meetingCode || '',
      scheduledDate: meetingData.scheduledDate || today,
      scheduledTime: meetingData.scheduledTime || '11:00',
      durationMinutes: meetingData.durationMinutes || 45,
      agenda: meetingData.agenda || 'MYSAR ERP & SIS Product Demo for academic leadership.',
      status: meetingData.status || 'Scheduled',
      spaceName: meetingData.spaceName,
      createdDate: today,
      createdBy: actor,
    };

    meetings.unshift(newMeeting);
    this.setStorage(STORAGE_KEYS.MEETINGS, meetings);

    // If attached to a lead, log lead activity
    if (newMeeting.leadId) {
      this.saveActivity({
        leadId: newMeeting.leadId,
        type: 'followup',
        title: `Google Meet Scheduled: ${newMeeting.title}`,
        description: `Virtual walkthrough scheduled for ${newMeeting.scheduledDate} at ${newMeeting.scheduledTime}. Join Link: ${newMeeting.meetingUri}`,
        actor,
        timestamp: fullTimestamp,
        metadata: {
          followUpType: 'Demo',
        },
      });
    }

    return newMeeting;
  }

  public deleteMeeting(id: string): void {
    const meetings = this.getMeetings().filter((m) => m.id !== id);
    this.setStorage(STORAGE_KEYS.MEETINGS, meetings);
  }

  public resetAllToDemo(): void {
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.PROPOSALS);
    localStorage.removeItem(STORAGE_KEYS.FOLLOWUPS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.PRICING_PLANS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
    localStorage.removeItem(STORAGE_KEYS.MEETINGS);
  }
}

export const storage = new StorageService();
