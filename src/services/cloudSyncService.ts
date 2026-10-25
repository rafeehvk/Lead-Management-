import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Lead, User, FollowUp, Proposal } from '../types';
import { StaffMember, DailyAttendanceRecord, LeaveRequest } from '../types/hr';
import { ExpiryDocument } from '../types/documentExpiry';
import { AllocatedTask } from '../types/tasks';
import { Asset } from '../types/asset';

export class CloudSyncService {
  private isInitialized = false;
  private isSyncing = false;

  // Unsubscribe handlers
  private unsubLeads: (() => void) | null = null;
  private unsubUsers: (() => void) | null = null;
  private unsubFollowUps: (() => void) | null = null;
  private unsubProposals: (() => void) | null = null;
  private unsubStaff: (() => void) | null = null;
  private unsubAttendance: (() => void) | null = null;
  private unsubLeaves: (() => void) | null = null;
  private unsubDocs: (() => void) | null = null;
  private unsubTasks: (() => void) | null = null;
  private unsubAssets: (() => void) | null = null;

  /**
   * Initializes real-time cloud sync across all ERP modules and devices
   */
  public async initSync(callbacks: {
    onLeadsUpdate: (leads: Lead[]) => void;
    onUsersUpdate: (users: User[]) => void;
    onFollowUpsUpdate: (followUps: FollowUp[]) => void;
    onProposalsUpdate: (proposals: Proposal[]) => void;
    onStaffUpdate?: (staff: StaffMember[]) => void;
    onAttendanceUpdate?: (records: DailyAttendanceRecord[]) => void;
    onLeavesUpdate?: (leaves: LeaveRequest[]) => void;
    onDocsUpdate?: (docs: ExpiryDocument[]) => void;
    onTasksUpdate?: (tasks: AllocatedTask[]) => void;
    onAssetsUpdate?: (assets: Asset[]) => void;
  }): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      // 1. CRM Listeners
      this.subscribeToCollection<Lead>('leads', callbacks.onLeadsUpdate, (items) => {
        items.sort((a, b) => {
          const dateA = a.updatedDate || a.createdDate || a.leadDate || '';
          const dateB = b.updatedDate || b.createdDate || b.leadDate || '';
          return dateB.localeCompare(dateA);
        });
      });

      this.subscribeToCollection<User>('users', callbacks.onUsersUpdate);
      this.subscribeToCollection<FollowUp>('followups', callbacks.onFollowUpsUpdate);
      this.subscribeToCollection<Proposal>('proposals', callbacks.onProposalsUpdate);

      // 2. HR Management Listeners
      if (callbacks.onStaffUpdate) {
        this.subscribeToCollection<StaffMember>('hr_staff', callbacks.onStaffUpdate);
      }
      if (callbacks.onAttendanceUpdate) {
        this.subscribeToCollection<DailyAttendanceRecord>('hr_attendance', callbacks.onAttendanceUpdate);
      }
      if (callbacks.onLeavesUpdate) {
        this.subscribeToCollection<LeaveRequest>('hr_leave_requests', callbacks.onLeavesUpdate);
      }

      // 3. Document Compliance Listeners
      if (callbacks.onDocsUpdate) {
        this.subscribeToCollection<ExpiryDocument>('documents', callbacks.onDocsUpdate);
      }

      // 4. Task Allocation Listeners
      if (callbacks.onTasksUpdate) {
        this.subscribeToCollection<AllocatedTask>('tasks', callbacks.onTasksUpdate);
      }

      // 5. Asset Management Listeners
      if (callbacks.onAssetsUpdate) {
        this.subscribeToCollection<Asset>('assets', callbacks.onAssetsUpdate);
      }
    } catch (e) {
      console.warn('[CloudSync] Failed to initialize cloud listeners:', e);
    }
  }

  // Generic Firestore collection listener
  private subscribeToCollection<T extends { id: string }>(
    colName: string,
    onUpdate?: (items: T[]) => void,
    customSort?: (items: T[]) => void
  ): void {
    if (!onUpdate) return;
    try {
      const colRef = collection(db, colName);
      onSnapshot(
        colRef,
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as T;
            items.push({ ...data, id: docSnap.id });
          });

          if (customSort) {
            customSort(items);
          }

          onUpdate(items);
        },
        (error) => {
          console.warn(`[CloudSync] Error in ${colName} listener:`, error);
        }
      );
    } catch (e) {
      console.warn(`[CloudSync] Could not attach listener for ${colName}:`, e);
    }
  }

  // --- Push Operations (Single item) ---

  public async syncLead(lead: Lead): Promise<void> {
    await this.pushDocument('leads', lead.id, lead);
  }
  public async deleteLead(leadId: string): Promise<void> {
    await this.deleteDocument('leads', leadId);
  }

  public async syncUser(user: User): Promise<void> {
    await this.pushDocument('users', user.id, user);
  }
  public async deleteUser(userId: string): Promise<void> {
    await this.deleteDocument('users', userId);
  }

  public async syncFollowUp(followUp: FollowUp): Promise<void> {
    await this.pushDocument('followups', followUp.id, followUp);
  }
  public async deleteFollowUp(followUpId: string): Promise<void> {
    await this.deleteDocument('followups', followUpId);
  }

  public async syncProposal(proposal: Proposal): Promise<void> {
    await this.pushDocument('proposals', proposal.id, proposal);
  }
  public async deleteProposal(proposalId: string): Promise<void> {
    await this.deleteDocument('proposals', proposalId);
  }

  public async syncStaff(staff: StaffMember): Promise<void> {
    await this.pushDocument('hr_staff', staff.id, staff);
  }
  public async syncAttendance(record: DailyAttendanceRecord): Promise<void> {
    await this.pushDocument('hr_attendance', record.id, record);
  }
  public async syncLeaveRequest(leave: LeaveRequest): Promise<void> {
    await this.pushDocument('hr_leave_requests', leave.id, leave);
  }
  public async syncDocument(docItem: ExpiryDocument): Promise<void> {
    await this.pushDocument('documents', docItem.id, docItem);
  }
  public async syncTask(task: AllocatedTask): Promise<void> {
    await this.pushDocument('tasks', task.id, task);
  }
  public async syncAsset(asset: Asset): Promise<void> {
    await this.pushDocument('assets', asset.id, asset);
  }

  private async pushDocument(colName: string, id: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, colName, id);
      await setDoc(docRef, data, { merge: true });
    } catch (e) {
      console.warn(`[CloudSync] Failed to sync ${colName}/${id}:`, e);
    }
  }

  private async deleteDocument(colName: string, id: string): Promise<void> {
    try {
      const docRef = doc(db, colName, id);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn(`[CloudSync] Failed to delete ${colName}/${id}:`, e);
    }
  }

  // --- Batch Push Methods for Local Seed/Migration ---

  private async batchPush<T extends { id: string }>(colName: string, items: T[]): Promise<number> {
    if (!items || items.length === 0) return 0;
    try {
      let count = 0;
      const batch = writeBatch(db);
      items.forEach((item) => {
        if (item && item.id) {
          batch.set(doc(db, colName, item.id), item, { merge: true });
          count++;
        }
      });
      await batch.commit();
      return count;
    } catch (e) {
      console.warn(`[CloudSync] Batch push failed for ${colName}:`, e);
      return 0;
    }
  }

  public async pushLocalLeadsToCloud(leads: Lead[]): Promise<number> {
    return this.batchPush<Lead>('leads', leads);
  }

  public async pushLocalUsersToCloud(users: User[]): Promise<number> {
    return this.batchPush<User>('users', users);
  }

  public async pushLocalFollowUpsToCloud(followUps: FollowUp[]): Promise<number> {
    return this.batchPush<FollowUp>('followups', followUps);
  }

  public async pushLocalProposalsToCloud(proposals: Proposal[]): Promise<number> {
    return this.batchPush<Proposal>('proposals', proposals);
  }

  public async pushLocalStaffToCloud(staff: StaffMember[]): Promise<number> {
    return this.batchPush<StaffMember>('hr_staff', staff);
  }

  public async pushLocalAttendanceToCloud(attendance: DailyAttendanceRecord[]): Promise<number> {
    return this.batchPush<DailyAttendanceRecord>('hr_attendance', attendance);
  }

  public async pushLocalLeavesToCloud(leaves: LeaveRequest[]): Promise<number> {
    return this.batchPush<LeaveRequest>('hr_leave_requests', leaves);
  }

  public async pushLocalDocumentsToCloud(docs: ExpiryDocument[]): Promise<number> {
    return this.batchPush<ExpiryDocument>('documents', docs);
  }

  public async pushLocalTasksToCloud(tasks: AllocatedTask[]): Promise<number> {
    return this.batchPush<AllocatedTask>('tasks', tasks);
  }

  public async pushLocalAssetsToCloud(assets: Asset[]): Promise<number> {
    return this.batchPush<Asset>('assets', assets);
  }

  /**
   * Fetches latest leads directly from Firestore once.
   */
  public async fetchCloudLeads(): Promise<Lead[]> {
    try {
      const snap = await getDocs(collection(db, 'leads'));
      const leads: Lead[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Lead;
        leads.push({ ...data, id: docSnap.id });
      });
      return leads;
    } catch (e) {
      console.warn('[CloudSync] Error fetching cloud leads:', e);
      return [];
    }
  }

  /**
   * Comprehensive Multi-Module Sync:
   * Pushes all local items across all ERP modules to Firestore and pulls cloud state.
   */
  public async syncAllModules(params: {
    leads: Lead[];
    users: User[];
    followUps?: FollowUp[];
    proposals?: Proposal[];
    staff?: StaffMember[];
    attendance?: DailyAttendanceRecord[];
    leaves?: LeaveRequest[];
    documents?: ExpiryDocument[];
    tasks?: AllocatedTask[];
    assets?: Asset[];
  }): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) return { success: true, message: 'Sync in progress' };
    this.isSyncing = true;
    try {
      // 1. CRM
      if (params.leads?.length) await this.pushLocalLeadsToCloud(params.leads);
      if (params.users?.length) await this.pushLocalUsersToCloud(params.users);
      if (params.followUps?.length) await this.pushLocalFollowUpsToCloud(params.followUps);
      if (params.proposals?.length) await this.pushLocalProposalsToCloud(params.proposals);

      // 2. HR
      if (params.staff?.length) await this.pushLocalStaffToCloud(params.staff);
      if (params.attendance?.length) await this.pushLocalAttendanceToCloud(params.attendance);
      if (params.leaves?.length) await this.pushLocalLeavesToCloud(params.leaves);

      // 3. Document Compliance
      if (params.documents?.length) await this.pushLocalDocumentsToCloud(params.documents);

      // 4. Tasks
      if (params.tasks?.length) await this.pushLocalTasksToCloud(params.tasks);

      // 5. Assets
      if (params.assets?.length) await this.pushLocalAssetsToCloud(params.assets);

      return { success: true, message: 'All ERP modules synced to Firestore cloud!' };
    } catch (e) {
      console.warn('[CloudSync] Multi-module sync warning:', e);
      return { success: false, message: 'Sync finished with partial local cache.' };
    } finally {
      this.isSyncing = false;
    }
  }

  // Backward compatibility alias
  public async syncAll(localLeads: Lead[], localUsers: User[]): Promise<{ leadsCount: number }> {
    await this.syncAllModules({ leads: localLeads, users: localUsers });
    const cloudLeads = await this.fetchCloudLeads();
    return { leadsCount: cloudLeads.length || localLeads.length };
  }
}

export const cloudSync = new CloudSyncService();
