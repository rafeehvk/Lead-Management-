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
import { Lead, User, FollowUp, Proposal, Settings } from '../types';
import {
  StaffMember,
  DailyAttendanceRecord,
  LeaveRequest,
  DepartmentMaster,
  BranchMaster,
} from '../types/hr';
import { ExpiryDocument } from '../types/documentExpiry';
import { AllocatedTask } from '../types/tasks';
import { Asset } from '../types/asset';

export function toSafeDocId(id: string): string {
  if (!id) return '';
  return String(id).replace(/\//g, '___').replace(/\s+/g, '_');
}

export function fromSafeDocId(safeId: string): string {
  if (!safeId) return '';
  return String(safeId).replace(/___/g, '/');
}

export class CloudSyncService {
  private isInitialized = false;
  private isSyncing = false;

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
    onDepartmentsUpdate?: (departments: DepartmentMaster[]) => void;
    onBranchesUpdate?: (branches: BranchMaster[]) => void;
    onDocsUpdate?: (docs: ExpiryDocument[]) => void;
    onTasksUpdate?: (tasks: AllocatedTask[]) => void;
    onAssetsUpdate?: (assets: Asset[]) => void;
    onSettingsUpdate?: (settings: Settings) => void;
    onUserPermissionsUpdate?: (permsByUser: Record<string, any>) => void;
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
      if (callbacks.onDepartmentsUpdate) {
        this.subscribeToCollection<DepartmentMaster>('hr_departments', callbacks.onDepartmentsUpdate);
      }
      if (callbacks.onBranchesUpdate) {
        this.subscribeToCollection<BranchMaster>('hr_branches', callbacks.onBranchesUpdate);
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

      // 6. User Menu Permissions Listener
      if (callbacks.onUserPermissionsUpdate) {
        const colRef = collection(db, 'user_menu_permissions');
        onSnapshot(
          colRef,
          (snapshot) => {
            const map: Record<string, any> = {};
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              const userId = fromSafeDocId(docSnap.id);
              if (data && data.permissions) {
                map[userId] = data.permissions;
                try {
                  localStorage.setItem(`mysar_user_menu_perms_${userId}`, JSON.stringify(data.permissions));
                } catch {}
              }
            });
            callbacks.onUserPermissionsUpdate?.(map);
          },
          (err) => console.warn('[CloudSync] Error in user_menu_permissions listener:', err)
        );
      }

      // 7. Settings Listener
      if (callbacks.onSettingsUpdate) {
        const colRef = collection(db, 'settings');
        onSnapshot(
          colRef,
          (snapshot) => {
            snapshot.forEach((docSnap) => {
              if (docSnap.id === 'general' || docSnap.id === 'settings') {
                callbacks.onSettingsUpdate?.(docSnap.data() as Settings);
              }
            });
          },
          (err) => console.warn('[CloudSync] Error in settings listener:', err)
        );
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
  ): () => void {
    if (!onUpdate) return () => {};
    try {
      const colRef = collection(db, colName);
      const unsubscribe = onSnapshot(
        colRef,
        (snapshot) => {
          const items: T[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as T;
            const originalId = data.id || fromSafeDocId(docSnap.id);
            items.push({ ...data, id: originalId });
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
      return unsubscribe;
    } catch (e) {
      console.warn(`[CloudSync] Could not attach listener for ${colName}:`, e);
      return () => {};
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
  public async deleteStaff(staffId: string): Promise<void> {
    await this.deleteDocument('hr_staff', staffId);
  }

  public async syncAttendance(record: DailyAttendanceRecord): Promise<void> {
    await this.pushDocument('hr_attendance', record.id, record);
  }

  public async syncLeaveRequest(leave: LeaveRequest): Promise<void> {
    await this.pushDocument('hr_leave_requests', leave.id, leave);
  }

  public async syncDepartment(dept: DepartmentMaster): Promise<void> {
    await this.pushDocument('hr_departments', dept.id, dept);
  }
  public async deleteDepartment(deptId: string): Promise<void> {
    await this.deleteDocument('hr_departments', deptId);
  }

  public async syncBranch(branch: BranchMaster): Promise<void> {
    await this.pushDocument('hr_branches', branch.id, branch);
  }
  public async deleteBranch(branchId: string): Promise<void> {
    await this.deleteDocument('hr_branches', branchId);
  }

  public async syncUserMenuPermissions(userId: string, permissions: any): Promise<void> {
    await this.pushDocument('user_menu_permissions', userId, { userId, permissions, updatedAt: new Date().toISOString() });
  }
  public async deleteUserMenuPermissions(userId: string): Promise<void> {
    await this.deleteDocument('user_menu_permissions', userId);
  }

  public async syncDocument(docItem: ExpiryDocument): Promise<void> {
    await this.pushDocument('documents', docItem.id, docItem);
  }
  public async deleteDocumentItem(docId: string): Promise<void> {
    await this.deleteDocument('documents', docId);
  }

  public async syncTask(task: AllocatedTask): Promise<void> {
    await this.pushDocument('tasks', task.id, task);
  }
  public async deleteTask(taskId: string): Promise<void> {
    await this.deleteDocument('tasks', taskId);
  }

  public async syncAsset(asset: Asset): Promise<void> {
    await this.pushDocument('assets', asset.id, asset);
  }
  public async deleteAsset(assetId: string): Promise<void> {
    await this.deleteDocument('assets', assetId);
  }

  public async syncSettings(settings: Settings): Promise<void> {
    await this.pushDocument('settings', 'general', settings);
  }

  // --- ERP Core Push Operations ---
  public async syncParty(party: any): Promise<void> {
    if (party?.id) await this.pushDocument('erp_parties', party.id, party);
  }
  public async deleteParty(partyId: string): Promise<void> {
    await this.deleteDocument('erp_parties', partyId);
  }

  public async syncItem(item: any): Promise<void> {
    if (item?.id) await this.pushDocument('erp_items', item.id, item);
  }
  public async deleteItem(itemId: string): Promise<void> {
    await this.deleteDocument('erp_items', itemId);
  }

  public async syncSalesOrder(order: any): Promise<void> {
    if (order?.id) await this.pushDocument('erp_sales_orders', order.id, order);
  }
  public async syncSalesInvoice(invoice: any): Promise<void> {
    if (invoice?.id) await this.pushDocument('erp_sales_invoices', invoice.id, invoice);
  }
  public async syncPurchaseOrder(po: any): Promise<void> {
    if (po?.id) await this.pushDocument('erp_purchase_orders', po.id, po);
  }
  public async syncPurchaseInvoice(pi: any): Promise<void> {
    if (pi?.id) await this.pushDocument('erp_purchase_invoices', pi.id, pi);
  }

  public async pushDocument(colName: string, id: string, data: any): Promise<void> {
    if (!id) return;
    try {
      const safeId = toSafeDocId(id);
      const docRef = doc(db, colName, safeId);
      const payload = { ...data, id };
      await setDoc(docRef, payload, { merge: true });
    } catch (e) {
      console.warn(`[CloudSync] Failed to sync ${colName}/${id}:`, e);
    }
  }

  public async deleteDocument(colName: string, id: string): Promise<void> {
    if (!id) return;
    try {
      const safeId = toSafeDocId(id);
      const docRef = doc(db, colName, safeId);
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
          const safeId = toSafeDocId(item.id);
          const payload = { ...item, id: item.id };
          batch.set(doc(db, colName, safeId), payload, { merge: true });
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

  public async pushLocalDepartmentsToCloud(depts: DepartmentMaster[]): Promise<number> {
    return this.batchPush<DepartmentMaster>('hr_departments', depts);
  }

  public async pushLocalBranchesToCloud(branches: BranchMaster[]): Promise<number> {
    return this.batchPush<BranchMaster>('hr_branches', branches);
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
   * Fetches collection directly from Firestore once.
   */
  public async fetchCollection<T extends { id: string }>(colName: string): Promise<T[]> {
    try {
      const snap = await getDocs(collection(db, colName));
      const items: T[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as T;
        const originalId = data.id || fromSafeDocId(docSnap.id);
        items.push({ ...data, id: originalId });
      });
      return items;
    } catch (e) {
      console.warn(`[CloudSync] Error fetching cloud ${colName}:`, e);
      return [];
    }
  }

  /**
   * Comprehensive Multi-Module Sync:
   * Pushes all local items across all ERP modules to Firestore and pulls cloud state.
   */
  public async syncAllModules(params: {
    leads?: Lead[];
    users?: User[];
    followUps?: FollowUp[];
    proposals?: Proposal[];
    staff?: StaffMember[];
    attendance?: DailyAttendanceRecord[];
    leaves?: LeaveRequest[];
    departments?: DepartmentMaster[];
    branches?: BranchMaster[];
    documents?: ExpiryDocument[];
    tasks?: AllocatedTask[];
    assets?: Asset[];
    parties?: any[];
    items?: any[];
    salesOrders?: any[];
    purchaseOrders?: any[];
  }): Promise<{ success: boolean; message: string }> {
    if (this.isSyncing) return { success: true, message: 'Sync in progress' };
    this.isSyncing = true;
    try {
      // 1. CRM
      if (params.leads && params.leads.length > 0) await this.pushLocalLeadsToCloud(params.leads);
      if (params.users && params.users.length > 0) await this.pushLocalUsersToCloud(params.users);
      if (params.followUps && params.followUps.length > 0) await this.pushLocalFollowUpsToCloud(params.followUps);
      if (params.proposals && params.proposals.length > 0) await this.pushLocalProposalsToCloud(params.proposals);

      // 2. HR
      if (params.staff && params.staff.length > 0) await this.pushLocalStaffToCloud(params.staff);
      if (params.attendance && params.attendance.length > 0) await this.pushLocalAttendanceToCloud(params.attendance);
      if (params.leaves && params.leaves.length > 0) await this.pushLocalLeavesToCloud(params.leaves);
      if (params.departments && params.departments.length > 0) await this.pushLocalDepartmentsToCloud(params.departments);
      if (params.branches && params.branches.length > 0) await this.pushLocalBranchesToCloud(params.branches);

      // 3. Document Compliance
      if (params.documents && params.documents.length > 0) await this.pushLocalDocumentsToCloud(params.documents);

      // 4. Tasks
      if (params.tasks && params.tasks.length > 0) await this.pushLocalTasksToCloud(params.tasks);

      // 5. Assets
      if (params.assets && params.assets.length > 0) await this.pushLocalAssetsToCloud(params.assets);

      // 6. ERP Core (Parties, Items, Orders)
      if (params.parties && params.parties.length > 0) {
        await this.batchPush('erp_parties', params.parties);
      }
      if (params.items && params.items.length > 0) {
        await this.batchPush('erp_items', params.items);
      }
      if (params.salesOrders && params.salesOrders.length > 0) {
        await this.batchPush('erp_sales_orders', params.salesOrders);
      }
      if (params.purchaseOrders && params.purchaseOrders.length > 0) {
        await this.batchPush('erp_purchase_orders', params.purchaseOrders);
      }

      return { success: true, message: 'All ERP modules synced to Firestore cloud!' };
    } catch (e) {
      console.warn('[CloudSync] Multi-module sync warning:', e);
      return { success: false, message: 'Sync finished with partial local cache.' };
    } finally {
      this.isSyncing = false;
    }
  }
}

export const cloudSync = new CloudSyncService();
