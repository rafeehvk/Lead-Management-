import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './firebase';
import { Lead, User, FollowUp, Proposal } from '../types';

export class CloudSyncService {
  private isInitialized = false;
  private unsubscribeLeads: (() => void) | null = null;
  private unsubscribeUsers: (() => void) | null = null;
  private unsubscribeFollowUps: (() => void) | null = null;
  private unsubscribeProposals: (() => void) | null = null;

  /**
   * Initializes real-time cloud sync across systems
   */
  public async initSync(callbacks: {
    onLeadsUpdate: (leads: Lead[]) => void;
    onUsersUpdate: (users: User[]) => void;
    onFollowUpsUpdate: (followUps: FollowUp[]) => void;
    onProposalsUpdate: (proposals: Proposal[]) => void;
  }): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      await ensureFirebaseAuth();
      this.subscribeToLeads(callbacks.onLeadsUpdate);
      this.subscribeToUsers(callbacks.onUsersUpdate);
      this.subscribeToFollowUps(callbacks.onFollowUpsUpdate);
      this.subscribeToProposals(callbacks.onProposalsUpdate);
    } catch (e) {
      console.warn('[CloudSync] Failed to initialize cloud listeners:', e);
    }
  }

  // --- Real-time Firestore Listeners ---

  private subscribeToLeads(onUpdate: (leads: Lead[]) => void): void {
    try {
      const colRef = collection(db, 'leads');
      this.unsubscribeLeads = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty && snapshot.metadata.fromCache) return;
          const cloudLeads: Lead[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Lead;
            cloudLeads.push({ ...data, id: docSnap.id });
          });

          // Sort by updatedDate or createdDate descending
          cloudLeads.sort((a, b) => {
            const dateA = a.updatedDate || a.createdDate || a.leadDate || '';
            const dateB = b.updatedDate || b.createdDate || b.leadDate || '';
            return dateB.localeCompare(dateA);
          });

          onUpdate(cloudLeads);
        },
        (error) => {
          console.warn('[CloudSync] Leads listener error:', error);
        }
      );
    } catch (e) {
      console.warn('[CloudSync] Could not attach leads listener:', e);
    }
  }

  private subscribeToUsers(onUpdate: (users: User[]) => void): void {
    try {
      const colRef = collection(db, 'users');
      this.unsubscribeUsers = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty && snapshot.metadata.fromCache) return;
          const cloudUsers: User[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as User;
            cloudUsers.push({ ...data, id: docSnap.id });
          });

          if (cloudUsers.length > 0) {
            onUpdate(cloudUsers);
          }
        },
        (error) => {
          console.warn('[CloudSync] Users listener error:', error);
        }
      );
    } catch (e) {
      console.warn('[CloudSync] Could not attach users listener:', e);
    }
  }

  private subscribeToFollowUps(onUpdate: (followUps: FollowUp[]) => void): void {
    try {
      const colRef = collection(db, 'followups');
      this.unsubscribeFollowUps = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty && snapshot.metadata.fromCache) return;
          const cloudFollowUps: FollowUp[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as FollowUp;
            cloudFollowUps.push({ ...data, id: docSnap.id });
          });
          onUpdate(cloudFollowUps);
        },
        (error) => {
          console.warn('[CloudSync] FollowUps listener error:', error);
        }
      );
    } catch (e) {
      console.warn('[CloudSync] Could not attach followups listener:', e);
    }
  }

  private subscribeToProposals(onUpdate: (proposals: Proposal[]) => void): void {
    try {
      const colRef = collection(db, 'proposals');
      this.unsubscribeProposals = onSnapshot(
        colRef,
        (snapshot) => {
          if (snapshot.empty && snapshot.metadata.fromCache) return;
          const cloudProposals: Proposal[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Proposal;
            cloudProposals.push({ ...data, id: docSnap.id });
          });
          onUpdate(cloudProposals);
        },
        (error) => {
          console.warn('[CloudSync] Proposals listener error:', error);
        }
      );
    } catch (e) {
      console.warn('[CloudSync] Could not attach proposals listener:', e);
    }
  }

  // --- Push Operations to Firestore ---

  public async syncLead(lead: Lead): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'leads', lead.id);
      await setDoc(docRef, lead, { merge: true });
    } catch (e) {
      console.warn(`[CloudSync] Failed to sync lead ${lead.id} to cloud:`, e);
    }
  }

  public async deleteLead(leadId: string): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'leads', leadId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn(`[CloudSync] Failed to delete lead ${leadId} from cloud:`, e);
    }
  }

  public async syncUser(user: User): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'users', user.id);
      await setDoc(docRef, user, { merge: true });
    } catch (e) {
      console.warn(`[CloudSync] Failed to sync user ${user.id} to cloud:`, e);
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'users', userId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn(`[CloudSync] Failed to delete user ${userId} from cloud:`, e);
    }
  }

  public async syncFollowUp(followUp: FollowUp): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'followups', followUp.id);
      await setDoc(docRef, followUp, { merge: true });
    } catch (e) {
      console.warn(`[CloudSync] Failed to sync follow-up ${followUp.id}:`, e);
    }
  }

  public async deleteFollowUp(followUpId: string): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'followups', followUpId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn(`[CloudSync] Failed to delete follow-up ${followUpId}:`, e);
    }
  }

  public async syncProposal(proposal: Proposal): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'proposals', proposal.id);
      await setDoc(docRef, proposal, { merge: true });
    } catch (e) {
      console.warn(`[CloudSync] Failed to sync proposal ${proposal.id}:`, e);
    }
  }

  public async deleteProposal(proposalId: string): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const docRef = doc(db, 'proposals', proposalId);
      await deleteDoc(docRef);
    } catch (e) {
      console.warn(`[CloudSync] Failed to delete proposal ${proposalId}:`, e);
    }
  }

  /**
   * Initial seeding/migration: if Firestore is empty but local storage has users/leads,
   * push them to Firestore so all systems can share them immediately.
   */
  public async seedLocalToCloud(localLeads: Lead[], localUsers: User[]): Promise<void> {
    try {
      await ensureFirebaseAuth();
      const leadsSnap = await getDocs(collection(db, 'leads'));
      if (leadsSnap.empty && localLeads.length > 0) {
        const batch = writeBatch(db);
        localLeads.forEach((lead) => {
          batch.set(doc(db, 'leads', lead.id), lead);
        });
        await batch.commit();
      }

      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty && localUsers.length > 0) {
        const batch = writeBatch(db);
        localUsers.forEach((user) => {
          batch.set(doc(db, 'users', user.id), user);
        });
        await batch.commit();
      }
    } catch (e) {
      console.warn('[CloudSync] Seeding local to cloud notice:', e);
    }
  }
}

export const cloudSync = new CloudSyncService();
