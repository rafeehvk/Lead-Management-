// ============================================================================
// MYSAR ERP - Production Live & Data Management Service
// Clears all departments, branches, mock users, and transactional entities
// Sets up a completely clean slate fresh app for Master Admin.
// ============================================================================

import { cloudSync } from './cloudSyncService';
import { initialUsers } from '../mockData';

export interface SystemDataStats {
  leads: number;
  proposals: number;
  staff: number;
  departments: number;
  branches: number;
  recruitment: number;
  attendance: number;
  payroll: number;
  assets: number;
  documents: number;
  items: number;
  parties: number;
  salesOrders: number;
  purchaseOrders: number;
  invoices: number;
  journals: number;
  totalRecords: number;
}

const PRODUCTION_FLAG_KEY = 'mysar_production_live_v2';
const PRODUCTION_DATE_KEY = 'mysar_production_live_date_v2';
const CLEAN_SLATE_FLAG_KEY = 'mysar_clean_slate_fresh_app_v12';

export class DataPurgeService {
  /**
   * Check if production live mode has been activated in the current browser session/storage.
   */
  public isProductionLiveActive(): boolean {
    try {
      return localStorage.getItem(PRODUCTION_FLAG_KEY) === 'active';
    } catch {
      return false;
    }
  }

  public getLiveActivationDate(): string {
    try {
      return localStorage.getItem(PRODUCTION_DATE_KEY) || new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  /**
   * Automatically executes on application startup.
   * If clean slate flag is not marked done, completely purges local and cloud dummy data.
   */
  public ensureLiveProductionState(): void {
    try {
      if (localStorage.getItem(CLEAN_SLATE_FLAG_KEY) !== 'done') {
        localStorage.setItem(CLEAN_SLATE_FLAG_KEY, 'done');
        this.purgeAllDummyData({ actorName: 'Master Admin', wipeCloud: true });
        console.log('[MYSAR Live Engine] Initial clean slate fresh app executed successfully.');
      }
    } catch (e) {
      console.error('[MYSAR Live Engine] Error during initial live state verification:', e);
    }
  }

  /**
   * Gathers live count statistics across all modules to verify clean slate.
   */
  public getSystemStats(): SystemDataStats {
    const parseCount = (key: string): number => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return 0;
        const parsed = JSON.parse(item);
        return Array.isArray(parsed) ? parsed.length : 0;
      } catch {
        return 0;
      }
    };

    const stats: SystemDataStats = {
      leads: parseCount('mysar_leads_data_v1'),
      proposals: parseCount('mysar_proposals_data_v1'),
      staff: parseCount('mysar_hr_staff_v1'),
      departments: parseCount('mysar_hr_departments_master_v1'),
      branches: parseCount('mysar_hr_branches_master_v1'),
      recruitment:
        parseCount('mysar_hr_positions_v1') +
        parseCount('mysar_hr_applicants_v1') +
        parseCount('mysar_hr_interviews_v1'),
      attendance: parseCount('mysar_hr_attendance_v1'),
      payroll: parseCount('mysar_hr_payroll_v1'),
      assets: parseCount('mysar_assets_list_v1'),
      documents: parseCount('mysar_expiry_documents'),
      items: parseCount('mysar_erp_items_v2'),
      parties: parseCount('mysar_erp_parties_v2'),
      salesOrders: parseCount('mysar_erp_sales_orders_v2'),
      purchaseOrders: parseCount('mysar_erp_purchase_orders_v2'),
      invoices:
        parseCount('mysar_erp_sales_invoices_v2') +
        parseCount('mysar_erp_purchase_invoices_v2'),
      journals: parseCount('mysar_finance_journal_entries_v2'),
      totalRecords: 0,
    };

    stats.totalRecords =
      stats.leads +
      stats.proposals +
      stats.staff +
      stats.departments +
      stats.branches +
      stats.recruitment +
      stats.attendance +
      stats.payroll +
      stats.assets +
      stats.documents +
      stats.items +
      stats.parties +
      stats.salesOrders +
      stats.purchaseOrders +
      stats.invoices +
      stats.journals;

    return stats;
  }

  /**
   * Full data purge and Clean Slate App reset.
   * Clears departments, branches, dummy users, staff, leads, transactions, and wipes Firestore.
   */
  public purgeAllDummyData(options?: { silent?: boolean; actorName?: string; wipeCloud?: boolean }): void {
    const actor = options?.actorName || 'Admin';

    try {
      // 1. Departments & Branches Master
      localStorage.setItem('mysar_hr_departments_master_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_departments_v1', JSON.stringify([]));
      localStorage.removeItem('mysar_deleted_dept_ids_v1');
      localStorage.setItem('mysar_hr_branches_master_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_branches_v1', JSON.stringify([]));
      localStorage.setItem('mysar_department_roles_matrix_v1', JSON.stringify([]));
      localStorage.setItem('mysar_user_menu_permissions', JSON.stringify({}));

      // 2. Users (Keep only the primary Master Admin account)
      const cleanUsers = initialUsers.filter((u) => u.role === 'Admin');
      const finalUsers = cleanUsers.length > 0 ? cleanUsers : [
        {
          id: 'USR-001',
          userId: 'rafeeh.vk',
          password: 'Password@123',
          name: 'Rafeeh V K',
          email: 'rafeeh.vk@gmail.com',
          mobile: '+91 7994 807 907',
          role: 'Admin' as const,
          status: 'Active' as const,
        },
      ];
      localStorage.setItem('mysar_users_data_v1', JSON.stringify(finalUsers));

      // 3. CRM & Leads
      localStorage.setItem('mysar_leads_data_v1', JSON.stringify([]));
      localStorage.setItem('mysar_proposals_data_v1', JSON.stringify([]));
      localStorage.setItem('mysar_followups_data_v1', JSON.stringify([]));
      localStorage.setItem('mysar_lead_activities_data_v1', JSON.stringify([]));
      localStorage.setItem('mysar_scheduled_meetings_data_v1', JSON.stringify([]));

      // 4. HR Management & Staff
      localStorage.setItem('mysar_hr_positions_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_applicants_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_interviews_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_offer_letters_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_appointment_letters_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_staff_v1', JSON.stringify([]));
      localStorage.removeItem('mysar_deleted_staff_ids_v1');
      localStorage.setItem('mysar_hr_attendance_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_leave_requests_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_leave_balances_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_payroll_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_kpis_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_performance_v1', JSON.stringify([]));
      localStorage.setItem('mysar_hr_activity_logs_v1', JSON.stringify([]));

      // 5. Document & Expiry Management
      localStorage.setItem('mysar_expiry_documents', JSON.stringify([]));
      localStorage.setItem('mysar_reminder_logs', JSON.stringify([]));

      // 6. Asset Management
      localStorage.setItem('mysar_assets_list_v1', JSON.stringify([]));
      localStorage.setItem('mysar_asset_movements_v1', JSON.stringify([]));
      localStorage.setItem('mysar_asset_pos_v1', JSON.stringify([]));
      localStorage.setItem('mysar_asset_purchases_v1', JSON.stringify([]));
      localStorage.setItem('mysar_asset_requests_v1', JSON.stringify([]));
      localStorage.setItem('mysar_asset_maintenance_v1', JSON.stringify([]));
      localStorage.setItem('mysar_asset_retirements_v1', JSON.stringify([]));
      localStorage.setItem('mysar_asset_vendors_v1', JSON.stringify([]));

      // 7. Tasks
      localStorage.setItem('mysar_allocated_tasks_v1', JSON.stringify([]));
      localStorage.setItem('mysar_task_allocations_v1', JSON.stringify([]));

      // 8. Finance & Budgeting
      localStorage.setItem('mysar_finance_transactions_v1', JSON.stringify([]));
      localStorage.setItem('mysar_finance_vendors_v1', JSON.stringify([]));
      localStorage.setItem('mysar_finance_vendor_invoices_v1', JSON.stringify([]));
      localStorage.setItem('mysar_finance_vendor_payments_v1', JSON.stringify([]));

      // 9. ERP Core Ledger & Transactions
      localStorage.setItem('mysar_erp_items_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_parties_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_stock_movements_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_stock_adjustments_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_purchase_requests_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_purchase_quotations_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_purchase_orders_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_goods_receipt_pos_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_purchase_invoices_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_purchase_return_requests_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_purchase_returns_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_debit_notes_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_sales_requests_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_sales_quotations_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_sales_orders_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_sales_deliveries_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_sales_invoices_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_sales_return_requests_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_sales_returns_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_credit_notes_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_payments_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_receipts_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_advance_adjustments_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_cheques_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_fund_transfers_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_loans_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_loan_repayments_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_budget_commitments_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_budget_transfers_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_budget_revisions_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_approvals_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_audit_logs_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_expenses_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_recurring_templates_v2', JSON.stringify([]));
      localStorage.setItem('mysar_erp_bank_reconciliations_v2', JSON.stringify([]));
      localStorage.setItem('mysar_finance_journal_entries_v2', JSON.stringify([]));

      // Reset Bank and Cash account balances to 0
      try {
        const rawBank = localStorage.getItem('mysar_erp_bank_accounts_v2');
        if (rawBank) {
          const banks = JSON.parse(rawBank);
          if (Array.isArray(banks)) {
            const zeroBanks = banks.map((b: any) => ({ ...b, openingBalance: 0, currentBalance: 0 }));
            localStorage.setItem('mysar_erp_bank_accounts_v2', JSON.stringify(zeroBanks));
          }
        }
      } catch {}

      try {
        const rawCash = localStorage.getItem('mysar_erp_cash_accounts_v2');
        if (rawCash) {
          const cash = JSON.parse(rawCash);
          if (Array.isArray(cash)) {
            const zeroCash = cash.map((c: any) => ({ ...c, openingBalance: 0, currentBalance: 0 }));
            localStorage.setItem('mysar_erp_cash_accounts_v2', JSON.stringify(zeroCash));
          }
        }
      } catch {}

      try {
        const rawCoa = localStorage.getItem('mysar_finance_chart_of_accounts_v2');
        if (rawCoa) {
          const coa = JSON.parse(rawCoa);
          if (Array.isArray(coa)) {
            const zeroCoa = coa.map((acc: any) => ({ ...acc, balance: 0 }));
            localStorage.setItem('mysar_finance_chart_of_accounts_v2', JSON.stringify(zeroCoa));
          }
        }
      } catch {}

      // Mark Production Live Status
      const nowIso = new Date().toISOString();
      const today = nowIso.split('T')[0];
      localStorage.setItem(PRODUCTION_FLAG_KEY, 'active');
      localStorage.setItem(PRODUCTION_DATE_KEY, today);

      // Wipe Firestore Cloud collections asynchronously
      if (options?.wipeCloud !== false) {
        cloudSync.wipeAllCloudData().then(() => {
          // Push primary admin user to cloud
          if (finalUsers[0]) {
            cloudSync.syncUser(finalUsers[0]);
          }
        }).catch((err) => {
          console.warn('[DataPurgeService] Cloud wipe background error:', err);
        });
      }

      // Notify entire application via CustomEvents
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mysar_departments_updated'));
        window.dispatchEvent(new CustomEvent('mysar_department_permissions_changed'));
        window.dispatchEvent(new CustomEvent('mysar_branches_updated'));
        window.dispatchEvent(new CustomEvent('mysar_staff_updated'));
        window.dispatchEvent(new CustomEvent('mysar_hr_data_updated'));
        window.dispatchEvent(new CustomEvent('mysar_hr_updated'));
        window.dispatchEvent(new CustomEvent('mysar_users_changed'));
        window.dispatchEvent(new CustomEvent('mysar_leads_updated'));
        window.dispatchEvent(new CustomEvent('mysar_proposals_updated'));
        window.dispatchEvent(new CustomEvent('mysar_doc_expiry_changed'));
        window.dispatchEvent(new CustomEvent('mysar_tasks_updated'));
        window.dispatchEvent(new CustomEvent('mysar_finance_data_changed'));
        window.dispatchEvent(new CustomEvent('mysar_erp_data_changed'));
        window.dispatchEvent(new CustomEvent('mysar_asset_changed'));
        window.dispatchEvent(new CustomEvent('mysar_production_live_activated', { detail: { actor, timestamp: nowIso } }));
      }

      if (!options?.silent) {
        console.log(`[MYSAR Live Engine] Clean Slate App purge executed successfully by ${actor}. All departments, branches, dummy users, and records cleared.`);
      }
    } catch (err) {
      console.error('[MYSAR Live Engine] Error executing dummy data purge:', err);
    }
  }
}

export const dataPurgeService = new DataPurgeService();
