import {
  PartyMaster,
  PartyLedgerEntry,
  ItemMaster,
  StockMovement,
  StockAdjustment,
  TaxRateRecord,
  TdsRecord,
  UOMRecord,
  PurchaseRequest,
  PurchaseItemLine,
  PurchaseQuotation,
  PurchaseOrder,
  GoodsReceiptPO,
  PurchaseInvoiceRecord,
  PurchaseReturnRequest,
  PurchaseReturnRecord,
  DebitNoteRecord,
  SalesRequest,
  SalesItemLine,
  SalesQuotation,
  SalesOrder,
  SalesDelivery,
  SalesInvoiceRecord,
  SalesReturnRequest,
  SalesReturnRecord,
  CreditNoteRecord,
  PaymentTransactionRecord,
  ReceiptTransactionRecord,
  InvoiceAllocation,
  AdvanceAdjustmentRecord,
  ChequeRecord,
  BankAccountRecord,
  CashAccountRecord,
  FundTransferRecord,
  BankStatementLine,
  BankReconciliationRecord,
  SystemBankTransaction,
  SystemCashTransaction,
  TreasuryAccountType,
  LoanRecord,
  LoanRepaymentRecord,
  LoanAmortizationScheduleItem,
  BudgetCommitmentRecord,
  BudgetTransferRecord,
  BudgetRevisionRecord,
  ApprovalRequestRecord,
  ApprovalTier,
  AuditLogRecord,
  JournalEntry,
  ExpenseCategoryMaster,
  ExpenseRecord,
  RecurringTemplate,
  MonthShort,
  ProcurementTraceabilityChain,
  ProcurementTraceabilityStage,
} from '../../types/finance';

import { accountingEngine } from './accountingEngine';
import { financeStorage } from '../financeStorageService';
import { gstTaxEngine } from './gstTaxEngine';
import { budgetEngine } from './budgetEngine';
import { budgetValidationService } from './budgetValidationService';
import {
  SEED_TAX_RATES,
  SEED_TDS_SECTIONS,
  SEED_UOMS,
  SEED_ITEMS,
  SEED_PARTIES,
  SEED_BANK_ACCOUNTS,
  SEED_CASH_ACCOUNTS,
  SEED_PURCHASE_REQUESTS,
  SEED_PURCHASE_QUOTATIONS,
  SEED_PURCHASE_ORDERS,
  SEED_GOODS_RECEIPT_POS,
  SEED_PURCHASE_INVOICES,
  SEED_PURCHASE_RETURN_REQUESTS,
  SEED_PURCHASE_RETURNS,
  SEED_DEBIT_NOTES,
  SEED_SALES_REQUESTS,
  SEED_SALES_QUOTATIONS,
  SEED_SALES_ORDERS,
  SEED_SALES_DELIVERIES,
  SEED_SALES_INVOICES,
  SEED_SALES_RETURN_REQUESTS,
  SEED_SALES_RETURNS,
  SEED_CREDIT_NOTES,
  SEED_CHEQUES,
  SEED_LOANS,
  SEED_LOAN_REPAYMENTS,
  SEED_APPROVAL_REQUESTS,
  SEED_AUDIT_LOGS,
  SEED_EXPENSE_CATEGORIES,
  SEED_EXPENSES,
  SEED_RECURRING_TEMPLATES,
  SEED_PAYMENTS,
  SEED_RECEIPTS,
  SEED_ADVANCE_ADJUSTMENTS,
} from './erpDataSeeds';

const STORAGE_KEYS = {
  PARTIES: 'mysar_erp_parties_v2',
  ITEMS: 'mysar_erp_items_v2',
  STOCK_MOVEMENTS: 'mysar_erp_stock_movements_v2',
  STOCK_ADJUSTMENTS: 'mysar_erp_stock_adjustments_v2',
  PURCHASE_REQUESTS: 'mysar_erp_purchase_requests_v2',
  PURCHASE_QUOTATIONS: 'mysar_erp_purchase_quotations_v2',
  PURCHASE_ORDERS: 'mysar_erp_purchase_orders_v2',
  GOODS_RECEIPT_POS: 'mysar_erp_goods_receipt_pos_v2',
  PURCHASE_INVOICES: 'mysar_erp_purchase_invoices_v2',
  PURCHASE_RETURN_REQUESTS: 'mysar_erp_purchase_return_requests_v2',
  PURCHASE_RETURNS: 'mysar_erp_purchase_returns_v2',
  DEBIT_NOTES: 'mysar_erp_debit_notes_v2',
  SALES_REQUESTS: 'mysar_erp_sales_requests_v2',
  SALES_QUOTATIONS: 'mysar_erp_sales_quotations_v2',
  SALES_ORDERS: 'mysar_erp_sales_orders_v2',
  SALES_DELIVERIES: 'mysar_erp_sales_deliveries_v2',
  SALES_INVOICES: 'mysar_erp_sales_invoices_v2',
  SALES_RETURN_REQUESTS: 'mysar_erp_sales_return_requests_v2',
  SALES_RETURNS: 'mysar_erp_sales_returns_v2',
  CREDIT_NOTES: 'mysar_erp_credit_notes_v2',
  PAYMENTS: 'mysar_erp_payments_v2',
  RECEIPTS: 'mysar_erp_receipts_v2',
  ADVANCE_ADJUSTMENTS: 'mysar_erp_advance_adjustments_v2',
  CHEQUES: 'mysar_erp_cheques_v2',
  BANK_ACCOUNTS: 'mysar_erp_bank_accounts_v2',
  CASH_ACCOUNTS: 'mysar_erp_cash_accounts_v2',
  FUND_TRANSFERS: 'mysar_erp_fund_transfers_v2',
  LOANS: 'mysar_erp_loans_v2',
  LOAN_REPAYMENTS: 'mysar_erp_loan_repayments_v2',
  BUDGET_COMMITMENTS: 'mysar_erp_budget_commitments_v2',
  BUDGET_TRANSFERS: 'mysar_erp_budget_transfers_v2',
  BUDGET_REVISIONS: 'mysar_erp_budget_revisions_v2',
  APPROVAL_REQUESTS: 'mysar_erp_approvals_v2',
  AUDIT_LOGS: 'mysar_erp_audit_logs_v2',
  OPENING_BALANCES: 'mysar_erp_opening_balances_v2',
  OPENING_BALANCES_LOCKED: 'mysar_erp_opening_balances_locked_v2',
  EXPENSES: 'mysar_erp_expenses_v2',
  EXPENSE_CATEGORIES: 'mysar_erp_expense_categories_v2',
  RECURRING_TEMPLATES: 'mysar_erp_recurring_templates_v2',
  BANK_RECONCILIATIONS: 'mysar_erp_bank_reconciliations_v2',
};

// Company default configuration (Casbiro Solutions Private Limited, Kerala)
export const COMPANY_CONFIG = {
  name: 'Casbiro Solutions Private Limited',
  legalName: 'Casbiro Solutions Private Limited',
  brandName: 'MYSAR ERP System',
  pan: 'AABCC1234F',
  gstin: '32AABCC1234F1Z5',
  state: 'Kerala',
  stateCode: '32',
  country: 'India',
  currency: 'INR',
  currencySymbol: '₹',
  financialYear: 'FY 2026-27',
};

export class ERPFinanceStorageService {
  private parties: PartyMaster[] = [];
  private items: ItemMaster[] = [];
  private stockMovements: StockMovement[] = [];
  private stockAdjustments: StockAdjustment[] = [];
  private purchaseRequests: PurchaseRequest[] = [];
  private purchaseQuotations: PurchaseQuotation[] = [];
  private purchaseOrders: PurchaseOrder[] = [];
  private goodsReceiptPOs: GoodsReceiptPO[] = [];
  private purchaseInvoices: PurchaseInvoiceRecord[] = [];
  private purchaseReturnRequests: PurchaseReturnRequest[] = [];
  private purchaseReturns: PurchaseReturnRecord[] = [];
  private debitNotes: DebitNoteRecord[] = [];
  private salesRequests: SalesRequest[] = [];
  private salesQuotations: SalesQuotation[] = [];
  private salesOrders: SalesOrder[] = [];
  private salesDeliveries: SalesDelivery[] = [];
  private salesInvoices: SalesInvoiceRecord[] = [];
  private salesReturnRequests: SalesReturnRequest[] = [];
  private salesReturns: SalesReturnRecord[] = [];
  private creditNotes: CreditNoteRecord[] = [];
  private payments: PaymentTransactionRecord[] = [];
  private receipts: ReceiptTransactionRecord[] = [];
  private advanceAdjustments: AdvanceAdjustmentRecord[] = [];
  private cheques: ChequeRecord[] = [];
  private bankAccounts: BankAccountRecord[] = [];
  private cashAccounts: CashAccountRecord[] = [];
  private fundTransfers: FundTransferRecord[] = [];
  private loans: LoanRecord[] = [];
  private loanRepayments: LoanRepaymentRecord[] = [];
  private budgetCommitments: BudgetCommitmentRecord[] = [];
  private budgetTransfers: BudgetTransferRecord[] = [];
  private budgetRevisions: BudgetRevisionRecord[] = [];
  private approvals: ApprovalRequestRecord[] = [];
  private auditLogs: AuditLogRecord[] = [];
  private expenses: ExpenseRecord[] = [];
  private expenseCategories: ExpenseCategoryMaster[] = [];
  private recurringTemplates: RecurringTemplate[] = [];
  private bankReconciliations: BankReconciliationRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.parties = this.loadOrSeed(STORAGE_KEYS.PARTIES, SEED_PARTIES);
      this.items = this.loadOrSeed(STORAGE_KEYS.ITEMS, SEED_ITEMS);
      this.purchaseRequests = this.loadOrSeed(STORAGE_KEYS.PURCHASE_REQUESTS, SEED_PURCHASE_REQUESTS);
      this.purchaseQuotations = this.loadOrSeed(STORAGE_KEYS.PURCHASE_QUOTATIONS, SEED_PURCHASE_QUOTATIONS);
      this.purchaseOrders = this.loadOrSeed(STORAGE_KEYS.PURCHASE_ORDERS, SEED_PURCHASE_ORDERS);
      this.goodsReceiptPOs = this.loadOrSeed(STORAGE_KEYS.GOODS_RECEIPT_POS, SEED_GOODS_RECEIPT_POS);
      this.purchaseInvoices = this.loadOrSeed(STORAGE_KEYS.PURCHASE_INVOICES, SEED_PURCHASE_INVOICES);
      this.purchaseReturnRequests = this.loadOrSeed(STORAGE_KEYS.PURCHASE_RETURN_REQUESTS, SEED_PURCHASE_RETURN_REQUESTS);
      this.purchaseReturns = this.loadOrSeed(STORAGE_KEYS.PURCHASE_RETURNS, SEED_PURCHASE_RETURNS);
      this.debitNotes = this.loadOrSeed(STORAGE_KEYS.DEBIT_NOTES, SEED_DEBIT_NOTES);
      this.salesRequests = this.loadOrSeed(STORAGE_KEYS.SALES_REQUESTS, SEED_SALES_REQUESTS);
      this.salesQuotations = this.loadOrSeed(STORAGE_KEYS.SALES_QUOTATIONS, SEED_SALES_QUOTATIONS);
      this.salesOrders = this.loadOrSeed(STORAGE_KEYS.SALES_ORDERS, SEED_SALES_ORDERS);
      this.salesDeliveries = this.loadOrSeed(STORAGE_KEYS.SALES_DELIVERIES, SEED_SALES_DELIVERIES);
      this.salesInvoices = this.loadOrSeed(STORAGE_KEYS.SALES_INVOICES, SEED_SALES_INVOICES);
      this.salesReturnRequests = this.loadOrSeed(STORAGE_KEYS.SALES_RETURN_REQUESTS, SEED_SALES_RETURN_REQUESTS);
      this.salesReturns = this.loadOrSeed(STORAGE_KEYS.SALES_RETURNS, SEED_SALES_RETURNS);
      this.creditNotes = this.loadOrSeed(STORAGE_KEYS.CREDIT_NOTES, SEED_CREDIT_NOTES);
      this.cheques = this.loadOrSeed(STORAGE_KEYS.CHEQUES, SEED_CHEQUES);
      this.bankAccounts = this.loadOrSeed(STORAGE_KEYS.BANK_ACCOUNTS, SEED_BANK_ACCOUNTS);
      this.cashAccounts = this.loadOrSeed(STORAGE_KEYS.CASH_ACCOUNTS, SEED_CASH_ACCOUNTS);
      this.loans = this.loadOrSeed(STORAGE_KEYS.LOANS, SEED_LOANS);
      this.approvals = this.loadOrSeed(STORAGE_KEYS.APPROVAL_REQUESTS, SEED_APPROVAL_REQUESTS);
      this.auditLogs = this.loadOrSeed(STORAGE_KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
      this.expenses = this.loadOrSeed(STORAGE_KEYS.EXPENSES, SEED_EXPENSES);
      this.expenseCategories = this.loadOrSeed(STORAGE_KEYS.EXPENSE_CATEGORIES, SEED_EXPENSE_CATEGORIES);
      this.recurringTemplates = this.loadOrSeed(STORAGE_KEYS.RECURRING_TEMPLATES, SEED_RECURRING_TEMPLATES);

      this.stockMovements = this.loadOrSeed(STORAGE_KEYS.STOCK_MOVEMENTS, []);
      this.stockAdjustments = this.loadOrSeed(STORAGE_KEYS.STOCK_ADJUSTMENTS, []);
      this.payments = this.loadOrSeed(STORAGE_KEYS.PAYMENTS, SEED_PAYMENTS);
      if (this.payments.length === 0 && SEED_PAYMENTS.length > 0) {
        this.payments = [...SEED_PAYMENTS];
        this.persist(STORAGE_KEYS.PAYMENTS, this.payments);
      }
      this.receipts = this.loadOrSeed(STORAGE_KEYS.RECEIPTS, SEED_RECEIPTS);
      if (this.receipts.length === 0 && SEED_RECEIPTS.length > 0) {
        this.receipts = [...SEED_RECEIPTS];
        this.persist(STORAGE_KEYS.RECEIPTS, this.receipts);
      }
      this.advanceAdjustments = this.loadOrSeed(STORAGE_KEYS.ADVANCE_ADJUSTMENTS, SEED_ADVANCE_ADJUSTMENTS);
      if (this.advanceAdjustments.length === 0 && SEED_ADVANCE_ADJUSTMENTS.length > 0) {
        this.advanceAdjustments = [...SEED_ADVANCE_ADJUSTMENTS];
        this.persist(STORAGE_KEYS.ADVANCE_ADJUSTMENTS, this.advanceAdjustments);
      }
      this.fundTransfers = this.loadOrSeed(STORAGE_KEYS.FUND_TRANSFERS, []);
      this.loanRepayments = this.loadOrSeed(STORAGE_KEYS.LOAN_REPAYMENTS, SEED_LOAN_REPAYMENTS);
      if (this.loanRepayments.length === 0 && SEED_LOAN_REPAYMENTS.length > 0) {
        this.loanRepayments = [...SEED_LOAN_REPAYMENTS];
        this.persist(STORAGE_KEYS.LOAN_REPAYMENTS, this.loanRepayments);
      }
      this.budgetCommitments = this.loadOrSeed(STORAGE_KEYS.BUDGET_COMMITMENTS, []);
      this.budgetTransfers = this.loadOrSeed(STORAGE_KEYS.BUDGET_TRANSFERS, []);
      this.budgetRevisions = this.loadOrSeed(STORAGE_KEYS.BUDGET_REVISIONS, []);
      this.bankReconciliations = this.loadOrSeed(STORAGE_KEYS.BANK_RECONCILIATIONS, []);
    } catch (e) {
      console.error('Error initializing ERP Finance Storage', e);
    }
  }

  private loadOrSeed<T>(key: string, seed: T[]): T[] {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return seed;
      }
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch {
          return seed;
        }
      }
      try {
        localStorage.setItem(key, JSON.stringify(seed));
      } catch {}
      return seed;
    } catch {
      return seed;
    }
  }

  private persist<T>(key: string, data: T) {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to persist key: ${key}`, e);
    }
  }

  private emitEvent(eventName: string, detail?: unknown) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  // ==========================================
  // AUDIT LOGGING & SECURITY (Section 2)
  // ==========================================
  public logAudit(params: {
    actorName?: string;
    role?: string;
    module: string;
    action: AuditLogRecord['action'];
    entityId: string;
    entityNumber: string;
    details: string;
  }) {
    const entry: AuditLogRecord = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorName: params.actorName || 'Finance Admin',
      role: params.role || 'Finance Manager',
      module: params.module,
      action: params.action,
      entityId: params.entityId,
      entityNumber: params.entityNumber,
      details: params.details,
    };
    this.auditLogs.unshift(entry);
    this.persist(STORAGE_KEYS.AUDIT_LOGS, this.auditLogs);
  }

  public getAuditLogs(): AuditLogRecord[] {
    return [...this.auditLogs];
  }

  // ==========================================
  // TAX RATES & TDS (Section 99)
  // ==========================================
  public getTaxRates(): TaxRateRecord[] {
    return [...SEED_TAX_RATES];
  }

  public getTdsSections(): TdsRecord[] {
    return [...SEED_TDS_SECTIONS];
  }

  public getUOMs(): UOMRecord[] {
    return [...SEED_UOMS];
  }

  public calculateGST(
    amount: number,
    partyStateCode: string = '32',
    taxPercent: number = 18
  ): {
    cgst: number;
    sgst: number;
    igst: number;
    taxTotal: number;
    isInterState: boolean;
  } {
    const isInterState = partyStateCode !== COMPANY_CONFIG.stateCode;
    const taxTotal = Math.round(((amount * taxPercent) / 100) * 100) / 100;
    if (isInterState) {
      return { cgst: 0, sgst: 0, igst: taxTotal, taxTotal, isInterState: true };
    }
    const half = Math.round((taxTotal / 2) * 100) / 100;
    return { cgst: half, sgst: half, igst: 0, taxTotal, isInterState: false };
  }

  // ==========================================
  // PARTY MASTER & UNIFIED LEDGER (Section 12 & 99)
  // ==========================================
  public getParties(type?: 'Customer' | 'Vendor' | 'Customer & Vendor'): PartyMaster[] {
    if (!type) return [...this.parties];
    if (type === 'Customer & Vendor') {
      return this.parties.filter((p) => p.type === 'Customer & Vendor');
    }
    return this.parties.filter((p) => p.type === type || p.type === 'Customer & Vendor');
  }

  public getPartyById(id: string): PartyMaster | undefined {
    return this.parties.find((p) => p.id === id || p.code === id);
  }

  /**
   * Check for duplicate party records by GSTIN, PAN, Phone, Email, or Legal Name.
   * Prevents duplicate entity entries across customer and vendor roles.
   */
  public checkPartyDuplicates(params: {
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
    name?: string;
    excludeId?: string;
  }): { isDuplicate: boolean; matches: { field: string; existingParty: PartyMaster; value: string }[] } {
    const matches: { field: string; existingParty: PartyMaster; value: string }[] = [];
    const gstinClean = params.gstin?.trim().toUpperCase();
    const panClean = params.pan?.trim().toUpperCase();
    const phoneClean = params.phone?.replace(/[^0-9]/g, '');
    const emailClean = params.email?.trim().toLowerCase();
    const nameClean = params.name?.trim().toLowerCase();

    for (const party of this.parties) {
      if (params.excludeId && party.id === params.excludeId) continue;

      if (gstinClean && party.gstin && party.gstin.trim().toUpperCase() === gstinClean) {
        matches.push({ field: 'GSTIN', existingParty: party, value: gstinClean });
      }
      if (panClean && party.pan && party.pan.trim().toUpperCase() === panClean) {
        matches.push({ field: 'PAN', existingParty: party, value: panClean });
      }
      if (phoneClean && phoneClean.length >= 8 && party.phone) {
        const existingPhone = party.phone.replace(/[^0-9]/g, '');
        if (existingPhone && existingPhone === phoneClean) {
          matches.push({ field: 'Phone', existingParty: party, value: party.phone });
        }
      }
      if (emailClean && party.email && party.email.trim().toLowerCase() === emailClean) {
        matches.push({ field: 'Email', existingParty: party, value: party.email });
      }
      if (nameClean && party.name.trim().toLowerCase() === nameClean) {
        matches.push({ field: 'Party Name', existingParty: party, value: party.name });
      }
    }

    return {
      isDuplicate: matches.length > 0,
      matches,
    };
  }

  public saveParty(party: Partial<PartyMaster> & { name: string; type: PartyMaster['type'] }): PartyMaster {
    let saved: PartyMaster;
    if (party.id && this.parties.some((p) => p.id === party.id)) {
      this.parties = this.parties.map((p) => (p.id === party.id ? ({ ...p, ...party } as PartyMaster) : p));
      saved = this.parties.find((p) => p.id === party.id)!;
      this.logAudit({
        module: 'Party Master',
        action: 'Edit',
        entityId: saved.id,
        entityNumber: saved.code,
        details: `Updated party ${saved.name} (${saved.type} - ${saved.category})`,
      });
    } else {
      const id = `PRT-${Date.now().toString().slice(-4)}`;
      const prefix = party.type === 'Customer' ? 'CUST' : party.type === 'Vendor' ? 'VND' : 'PRT';
      const code = party.code || `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
      saved = {
        id,
        code,
        name: party.name,
        legalName: party.legalName || party.name,
        type: party.type,
        category: party.category || 'General',
        contactPerson: party.contactPerson || '',
        phone: party.phone || '',
        whatsapp: party.whatsapp || party.phone || '',
        email: party.email || '',
        billingAddress: party.billingAddress || '',
        shippingAddress: party.shippingAddress || party.billingAddress || '',
        city: party.city || 'Kochi',
        state: party.state || 'Kerala',
        stateCode: party.stateCode || '32',
        country: party.country || 'India',
        gstin: party.gstin || '',
        pan: party.pan || '',
        gstType: party.gstType || 'Regular',
        placeOfSupply: party.placeOfSupply || '32-Kerala',
        creditLimit: party.creditLimit !== undefined ? party.creditLimit : 500000,
        creditLimitAction: party.creditLimitAction || 'Warning',
        paymentTerms: party.paymentTerms || 'Net 30',
        openingBalance: party.openingBalance || 0,
        currentBalance: party.openingBalance || 0,
        bankDetails: party.bankDetails,
        documents: party.documents || [],
        status: party.status || 'Active',
        notes: party.notes || '',
        createdDate: new Date().toISOString().split('T')[0],
      };
      this.parties.unshift(saved);
      this.logAudit({
        module: 'Party Master',
        action: 'Create',
        entityId: saved.id,
        entityNumber: saved.code,
        details: `Created new unified party ${saved.name} (${saved.type} - ${saved.category})`,
      });
    }
    this.persist(STORAGE_KEYS.PARTIES, this.parties);
    return saved;
  }

  public deleteParty(id: string): { success: boolean; message: string } {
    const party = this.getPartyById(id);
    if (!party) return { success: false, message: 'Party not found.' };

    // Check if transactions exist
    const hasSales = this.salesInvoices.some((s) => s.customerId === id);
    const hasPurchases = this.purchaseInvoices.some((p) => p.vendorId === id);
    if (hasSales || hasPurchases) {
      party.status = 'Inactive';
      this.persist(STORAGE_KEYS.PARTIES, this.parties);
      return { success: true, message: 'Party has active ledger transactions. Status set to Inactive to preserve audit trail.' };
    }

    this.parties = this.parties.filter((p) => p.id !== id);
    this.persist(STORAGE_KEYS.PARTIES, this.parties);
    this.logAudit({
      module: 'Party Master',
      action: 'Cancel',
      entityId: id,
      entityNumber: party.code,
      details: `Deleted party record for ${party.name}`,
    });
    return { success: true, message: 'Party successfully removed.' };
  }

  /**
   * Evaluates Credit Limit enforcement for a Customer or Dual party.
   * Rules: Block (prevents order/invoice), Warning (flags but permits), Approval (requires sign-off).
   */
  public checkCreditLimit(
    partyId: string,
    additionalAmount: number
  ): {
    allowed: boolean;
    action: 'Block' | 'Warning' | 'Approval';
    currentBalance: number;
    creditLimit: number;
    projectedBalance: number;
    excessAmount: number;
    message?: string;
  } {
    const party = this.getPartyById(partyId);
    if (!party || party.type === 'Vendor') {
      return { allowed: true, action: 'Warning', currentBalance: 0, creditLimit: 0, projectedBalance: 0, excessAmount: 0 };
    }

    const currentBalance = party.currentBalance || 0;
    const creditLimit = party.creditLimit || 0;
    const projectedBalance = currentBalance + additionalAmount;
    const excessAmount = Math.max(0, projectedBalance - creditLimit);
    const isBreached = creditLimit > 0 && projectedBalance > creditLimit;

    const rawAction = party.creditLimitAction || 'Warning';
    const action: 'Block' | 'Warning' | 'Approval' =
      rawAction === 'Block' ? 'Block' : (rawAction === 'Requires Approval' || rawAction === 'Approval') ? 'Approval' : 'Warning';

    if (!isBreached) {
      return {
        allowed: true,
        action,
        currentBalance,
        creditLimit,
        projectedBalance,
        excessAmount: 0,
      };
    }

    if (action === 'Block') {
      return {
        allowed: false,
        action: 'Block',
        currentBalance,
        creditLimit,
        projectedBalance,
        excessAmount,
        message: `Credit Limit Exceeded: Outstanding ₹${currentBalance.toLocaleString('en-IN')} + New ₹${additionalAmount.toLocaleString('en-IN')} = ₹${projectedBalance.toLocaleString('en-IN')}, exceeding authorized limit of ₹${creditLimit.toLocaleString('en-IN')} by ₹${excessAmount.toLocaleString('en-IN')}. Transaction blocked.`,
      };
    }

    if (action === 'Approval') {
      return {
        allowed: false,
        action: 'Approval',
        currentBalance,
        creditLimit,
        projectedBalance,
        excessAmount,
        message: `Credit Limit Breached: New balance ₹${projectedBalance.toLocaleString('en-IN')} exceeds credit limit of ₹${creditLimit.toLocaleString('en-IN')}. Requires Finance Manager / Director approval before issuance.`,
      };
    }

    return {
      allowed: true,
      action: 'Warning',
      currentBalance,
      creditLimit,
      projectedBalance,
      excessAmount,
      message: `Credit Warning: Outstanding ₹${projectedBalance.toLocaleString('en-IN')} exceeds credit limit of ₹${creditLimit.toLocaleString('en-IN')}. Allowed under warning policy.`,
    };
  }

  /**
   * Retrieves all activities across Sales, Purchases, Payments, Receipts, Notes, and Audit Trail.
   * For Customer & Vendor, aggregates both streams in one single profile!
   */
  public getPartyActivities(partyId: string) {
    const party = this.getPartyById(partyId);
    const partyName = party?.name || '';

    const salesInvoices = this.salesInvoices.filter((s) => s.customerId === partyId || s.customerName === partyName);
    const purchaseInvoices = this.purchaseInvoices.filter((p) => p.vendorId === partyId || p.vendorName === partyName);
    const salesOrders = this.salesOrders.filter((s) => s.customerId === partyId || s.customerName === partyName);
    const purchaseOrders = this.purchaseOrders.filter((p) => p.vendorId === partyId || p.vendorName === partyName);
    const receipts = this.receipts.filter((r) => r.partyId === partyId || r.partyName === partyName);
    const payments = this.payments.filter((p) => p.partyId === partyId || p.partyName === partyName);
    const creditNotes = this.creditNotes.filter((c) => c.customerId === partyId || c.customerName === partyName);
    const debitNotes = this.debitNotes.filter((d) => d.vendorId === partyId || d.vendorName === partyName);
    const expenses = this.expenses.filter((e) => e.partyId === partyId || e.partyName === partyName);
    const auditLogs = this.auditLogs.filter((a) => a.entityId === partyId || a.details.includes(partyName));

    return {
      salesInvoices,
      purchaseInvoices,
      salesOrders,
      purchaseOrders,
      receipts,
      payments,
      creditNotes,
      debitNotes,
      expenses,
      auditLogs,
    };
  }

  /**
   * Generates real-time Party Subledger tracking all Invoices, Payments, Receipts, Notes
   * and running balance with Dr/Cr per Section 12 & Section 99.
   * Seamlessly handles Customer, Vendor, and unified 'Customer & Vendor'.
   */
  public getPartyLedger(
    partyId: string,
    options?: { fromDate?: string; toDate?: string }
  ): {
    party: PartyMaster | undefined;
    entries: PartyLedgerEntry[];
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    balanceType: 'Dr' | 'Cr' | 'Nil';
  } {
    const party = this.getPartyById(partyId);
    if (!party) {
      return { party: undefined, entries: [], totalDebit: 0, totalCredit: 0, closingBalance: 0, balanceType: 'Nil' };
    }

    const rawEntries: {
      date: string;
      referenceNumber: string;
      transactionType: PartyLedgerEntry['transactionType'];
      debit: number;
      credit: number;
      narration?: string;
    }[] = [];

    // Opening Balance
    if (party.openingBalance !== 0) {
      if (party.openingBalance > 0) {
        // Customer receivable (Debit)
        rawEntries.push({
          date: party.createdDate || '2026-04-01',
          referenceNumber: 'OB-2026-01',
          transactionType: 'Opening Balance',
          debit: party.openingBalance,
          credit: 0,
          narration: 'Opening balance brought forward (Receivable)',
        });
      } else {
        // Vendor payable (Credit)
        rawEntries.push({
          date: party.createdDate || '2026-04-01',
          referenceNumber: 'OB-2026-01',
          transactionType: 'Opening Balance',
          debit: 0,
          credit: Math.abs(party.openingBalance),
          narration: 'Opening balance brought forward (Payable)',
        });
      }
    }

    // Purchase Invoices (Credit to vendor / liability increases)
    this.purchaseInvoices
      .filter((pi) => pi.vendorId === party.id || pi.vendorName === party.name)
      .forEach((pi) => {
        rawEntries.push({
          date: pi.date,
          referenceNumber: pi.invoiceNumber,
          transactionType: 'Purchase Invoice',
          debit: 0,
          credit: pi.grandTotal,
          narration: `Vendor Bill (Due: ${pi.dueDate})`,
        });
      });

    // Debit Notes to vendor (Debit to vendor / liability decreases / Purchase Returns)
    this.debitNotes
      .filter((dn) => dn.vendorId === party.id || dn.vendorName === party.name)
      .forEach((dn) => {
        rawEntries.push({
          date: dn.date,
          referenceNumber: dn.noteNumber,
          transactionType: dn.reason === 'Purchase Return' ? 'Purchase Return' : 'Debit Note',
          debit: dn.grandTotal,
          credit: 0,
          narration: `Debit note against ${dn.originalInvoiceNumber} (${dn.reason})`,
        });
      });

    // Sales Invoices (Debit to customer / receivable increases)
    this.salesInvoices
      .filter((si) => si.customerId === party.id || si.customerName === party.name)
      .forEach((si) => {
        rawEntries.push({
          date: si.date,
          referenceNumber: si.invoiceNumber,
          transactionType: 'Sales Invoice',
          debit: si.grandTotal,
          credit: 0,
          narration: `Sales Invoice billing (Due: ${si.dueDate})`,
        });
      });

    // Credit Notes to customer (Credit to customer / receivable decreases / Sales Returns)
    this.creditNotes
      .filter((cn) => cn.customerId === party.id || cn.customerName === party.name)
      .forEach((cn) => {
        rawEntries.push({
          date: cn.date,
          referenceNumber: cn.noteNumber,
          transactionType: cn.reason === 'Sales Return' ? 'Sales Return' : 'Credit Note',
          debit: 0,
          credit: cn.grandTotal,
          narration: `Credit note against ${cn.originalInvoiceNumber} (${cn.reason})`,
        });
      });

    // Payments to Vendor (Debit to vendor / liability decreases - only completed/approved payments)
    this.payments
      .filter((p) => p.status === 'Completed' && (p.partyId === party.id || p.partyName === party.name))
      .forEach((p) => {
        rawEntries.push({
          date: p.date,
          referenceNumber: p.paymentNumber,
          transactionType: p.isAdvance ? 'Advance Payment' : 'Payment',
          debit: p.amount,
          credit: 0,
          narration: `Settlement via ${p.paymentMethod} (Ref: ${p.referenceNumber}${p.tdsAmount ? `, TDS ₹${p.tdsAmount}` : ''})`,
        });
      });

    // Receipts from Customer (Credit to customer / receivable decreases - only completed receipts)
    this.receipts
      .filter((r) => r.status === 'Completed' && (r.partyId === party.id || r.partyName === party.name))
      .forEach((r) => {
        rawEntries.push({
          date: r.date,
          referenceNumber: r.receiptNumber,
          transactionType: r.isAdvance ? 'Advance Receipt' : 'Receipt',
          debit: 0,
          credit: r.amount,
          narration: `Remittance via ${r.paymentMethod} (Ref: ${r.referenceNumber})`,
        });
      });

    // Sort chronologically
    rawEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filter by date if supplied
    const filteredEntries = rawEntries.filter((e) => {
      if (options?.fromDate && e.date < options.fromDate) return false;
      if (options?.toDate && e.date > options.toDate) return false;
      return true;
    });

    let runningBalance = 0;
    const entries: PartyLedgerEntry[] = filteredEntries.map((item, idx) => {
      // In double-entry party ledger:
      // For Customer: Debit increases receivable, Credit reduces receivable
      // For Vendor: Credit increases payable, Debit reduces payable
      // For Customer & Vendor: Running net = Debit (Receivable) - Credit (Payable)
      if (party.type === 'Vendor') {
        runningBalance = runningBalance - item.debit + item.credit;
      } else {
        runningBalance = runningBalance + item.debit - item.credit;
      }
      return {
        id: `ple-${idx + 1}`,
        date: item.date,
        partyId: party.id,
        partyName: party.name,
        referenceNumber: item.referenceNumber,
        transactionType: item.transactionType,
        debit: item.debit,
        credit: item.credit,
        balance: Math.round(runningBalance * 100) / 100,
        narration: item.narration,
      };
    });

    const totalDebit = Math.round(entries.reduce((s, e) => s + e.debit, 0) * 100) / 100;
    const totalCredit = Math.round(entries.reduce((s, e) => s + e.credit, 0) * 100) / 100;
    const balanceType: 'Dr' | 'Cr' | 'Nil' =
      party.type === 'Vendor'
        ? runningBalance > 0
          ? 'Cr'
          : runningBalance < 0
          ? 'Dr'
          : 'Nil'
        : runningBalance > 0
        ? 'Dr'
        : runningBalance < 0
        ? 'Cr'
        : 'Nil';

    return {
      party,
      entries,
      totalDebit,
      totalCredit,
      closingBalance: Math.abs(runningBalance),
      balanceType,
    };
  }

  // ==========================================
  // OPENING BALANCE ENTRY & LOCKING (Section 12)
  // ==========================================
  public isOpeningBalancesLocked(): boolean {
    return localStorage.getItem(STORAGE_KEYS.OPENING_BALANCES_LOCKED) === 'true';
  }

  public getOpeningBalancesLockInfo(): { isLocked: boolean; lockedBy?: string; lockedAt?: string } {
    const isLocked = this.isOpeningBalancesLocked();
    const raw = localStorage.getItem('mysar_erp_opening_lock_meta');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        return { isLocked, ...parsed };
      } catch {
        return { isLocked };
      }
    }
    return { isLocked };
  }

  public lockOpeningBalances(lockedBy: string = 'Finance Controller'): void {
    localStorage.setItem(STORAGE_KEYS.OPENING_BALANCES_LOCKED, 'true');
    localStorage.setItem(
      'mysar_erp_opening_lock_meta',
      JSON.stringify({
        lockedBy,
        lockedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      })
    );
    this.logAudit({
      module: 'Opening Balance',
      action: 'YearEndClose',
      entityId: 'OB-FY26',
      entityNumber: 'OB-LOCK-01',
      details: `Opening balances locked after initial post by ${lockedBy}`,
    });
  }

  public unlockOpeningBalances(adminName: string = 'Super Admin'): void {
    localStorage.removeItem(STORAGE_KEYS.OPENING_BALANCES_LOCKED);
    localStorage.removeItem('mysar_erp_opening_lock_meta');
    this.logAudit({
      module: 'Opening Balance',
      action: 'Edit',
      entityId: 'OB-FY26',
      entityNumber: 'OB-UNLOCK-01',
      details: `Opening balances unlocked for authorized adjustment by ${adminName}`,
    });
  }

  public getOpeningBalancesOverview() {
    const isLockedInfo = this.getOpeningBalancesLockInfo();

    // 1. Party Balances
    const customerDebits = this.parties.reduce(
      (sum, p) => sum + (p.openingBalance > 0 ? p.openingBalance : 0),
      0
    );
    const vendorCredits = this.parties.reduce(
      (sum, p) => sum + (p.openingBalance < 0 ? Math.abs(p.openingBalance) : 0),
      0
    );

    // 2. Cash & Bank
    const cashTotal = this.cashAccounts.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
    const bankTotal = this.bankAccounts.reduce((sum, b) => sum + (b.currentBalance || 0), 0);

    // 3. Stock Valuation
    const stockValuation = this.items.reduce(
      (sum, i) => sum + (i.openingStock || 0) * (i.purchasePrice || 0),
      0
    );

    // 4. Loans / Liabilities
    const loansTotal = this.loans.reduce((sum, l) => sum + (l.principalAmount || 0), 0);

    const totalDebits = customerDebits + cashTotal + bankTotal + stockValuation;
    const totalCredits = vendorCredits + loansTotal;
    const equityBalancingFigure = Math.round((totalDebits - totalCredits) * 100) / 100;

    return {
      ...isLockedInfo,
      customerDebits,
      vendorCredits,
      cashTotal,
      bankTotal,
      stockValuation,
      loansTotal,
      totalDebits,
      totalCredits,
      equityBalancingFigure,
      partiesCount: this.parties.length,
      itemsCount: this.items.length,
      bankAccountsCount: this.bankAccounts.length,
      cashAccountsCount: this.cashAccounts.length,
    };
  }

  public savePartyOpeningBalances(
    updates: { partyId: string; amount: number; isDebit: boolean }[]
  ): boolean {
    if (this.isOpeningBalancesLocked()) {
      throw new Error('Opening balances are locked and cannot be edited without administrator unlock.');
    }

    updates.forEach((u) => {
      const party = this.parties.find((p) => p.id === u.partyId);
      if (party) {
        // Customer receivable = positive (Debit), Vendor payable = negative (Credit)
        party.openingBalance = u.isDebit ? Math.abs(u.amount) : -Math.abs(u.amount);
        party.currentBalance = party.openingBalance;
      }
    });

    this.persist(STORAGE_KEYS.PARTIES, this.parties);
    this.logAudit({
      module: 'Opening Balance',
      action: 'Edit',
      entityId: 'OB-BATCH',
      entityNumber: `UPD-${updates.length}`,
      details: `Updated opening balances for ${updates.length} parties`,
    });
    return true;
  }

  // ==========================================
  // PARTY REPORTS (Receivables, Payables, Statement)
  // ==========================================
  public getReceivablesAgingReport() {
    const today = new Date().getTime();
    const customerInvoices = this.salesInvoices.filter((s) => s.status !== 'Paid' && s.balanceAmount > 0);

    const partyAgingMap = new Map<
      string,
      {
        partyId: string;
        partyName: string;
        partyCode: string;
        phone: string;
        email: string;
        current: number; // 0-30 days
        days31To60: number;
        days61To90: number;
        over90: number;
        totalDue: number;
        invoicesCount: number;
        creditLimit: number;
        creditLimitAction: string;
      }
    >();

    customerInvoices.forEach((inv) => {
      const dueTime = new Date(inv.dueDate || inv.date).getTime();
      const ageDays = Math.max(0, Math.floor((today - dueTime) / 86400000));
      const amt = inv.balanceAmount;

      let entry = partyAgingMap.get(inv.customerId);
      if (!entry) {
        const party = this.getPartyById(inv.customerId);
        entry = {
          partyId: inv.customerId,
          partyName: inv.customerName,
          partyCode: party?.code || '',
          phone: party?.phone || '',
          email: party?.email || '',
          current: 0,
          days31To60: 0,
          days61To90: 0,
          over90: 0,
          totalDue: 0,
          invoicesCount: 0,
          creditLimit: party?.creditLimit || 0,
          creditLimitAction: party?.creditLimitAction || 'Warning',
        };
        partyAgingMap.set(inv.customerId, entry);
      }

      entry.invoicesCount += 1;
      entry.totalDue += amt;
      if (ageDays <= 30) entry.current += amt;
      else if (ageDays <= 60) entry.days31To60 += amt;
      else if (ageDays <= 90) entry.days61To90 += amt;
      else entry.over90 += amt;
    });

    const list = Array.from(partyAgingMap.values());
    const summary = {
      totalOutstanding: list.reduce((s, r) => s + r.totalDue, 0),
      totalCurrent: list.reduce((s, r) => s + r.current, 0),
      total31To60: list.reduce((s, r) => s + r.days31To60, 0),
      total61To90: list.reduce((s, r) => s + r.days61To90, 0),
      totalOver90: list.reduce((s, r) => s + r.over90, 0),
      totalDebtorsCount: list.length,
    };

    return { list, summary };
  }

  public getPayablesAgingReport() {
    const today = new Date().getTime();
    const vendorInvoices = this.purchaseInvoices.filter((p) => p.status !== 'Paid' && p.balanceAmount > 0);

    const vendorAgingMap = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        vendorCode: string;
        phone: string;
        email: string;
        current: number; // 0-30 days
        days31To60: number;
        days61To90: number;
        over90: number;
        totalDue: number;
        invoicesCount: number;
      }
    >();

    vendorInvoices.forEach((inv) => {
      const dueTime = new Date(inv.dueDate || inv.date).getTime();
      const ageDays = Math.max(0, Math.floor((today - dueTime) / 86400000));
      const amt = inv.balanceAmount;

      let entry = vendorAgingMap.get(inv.vendorId);
      if (!entry) {
        const party = this.getPartyById(inv.vendorId);
        entry = {
          vendorId: inv.vendorId,
          vendorName: inv.vendorName,
          vendorCode: party?.code || '',
          phone: party?.phone || '',
          email: party?.email || '',
          current: 0,
          days31To60: 0,
          days61To90: 0,
          over90: 0,
          totalDue: 0,
          invoicesCount: 0,
        };
        vendorAgingMap.set(inv.vendorId, entry);
      }

      entry.invoicesCount += 1;
      entry.totalDue += amt;
      if (ageDays <= 30) entry.current += amt;
      else if (ageDays <= 60) entry.days31To60 += amt;
      else if (ageDays <= 90) entry.days61To90 += amt;
      else entry.over90 += amt;
    });

    const list = Array.from(vendorAgingMap.values());
    const summary = {
      totalOutstanding: list.reduce((s, r) => s + r.totalDue, 0),
      totalCurrent: list.reduce((s, r) => s + r.current, 0),
      total31To60: list.reduce((s, r) => s + r.days31To60, 0),
      total61To90: list.reduce((s, r) => s + r.days61To90, 0),
      totalOver90: list.reduce((s, r) => s + r.over90, 0),
      totalCreditorsCount: list.length,
    };

    return { list, summary };
  }

  public getStatementOfAccount(partyId: string, fromDate?: string, toDate?: string) {
    const party = this.getPartyById(partyId);
    const ledger = this.getPartyLedger(partyId, { fromDate, toDate });

    // Determine unallocated or pending invoices
    const pendingSales = this.salesInvoices.filter(
      (s) => (s.customerId === partyId || s.customerName === party?.name) && s.status !== 'Paid'
    );
    const pendingPurchases = this.purchaseInvoices.filter(
      (p) => (p.vendorId === partyId || p.vendorName === party?.name) && p.status !== 'Paid'
    );

    return {
      statementNumber: `SOA-${Date.now().toString().slice(-6)}`,
      generatedDate: new Date().toISOString().split('T')[0],
      company: COMPANY_CONFIG,
      party,
      fromDate: fromDate || '2026-04-01',
      toDate: toDate || new Date().toISOString().split('T')[0],
      entries: ledger.entries,
      totalDebit: ledger.totalDebit,
      totalCredit: ledger.totalCredit,
      closingBalance: ledger.closingBalance,
      balanceType: ledger.balanceType,
      pendingSales,
      pendingPurchases,
    };
  }

  // ==========================================
  // ITEM MASTER & INVENTORY (Section 7, 8 & 99)
  // ==========================================
  public getItems(): ItemMaster[] {
    return [...this.items];
  }

  public getItemById(id: string): ItemMaster | undefined {
    return this.items.find((i) => i.id === id || i.code === id);
  }

  public saveItem(item: Partial<ItemMaster> & { name: string; code: string }): ItemMaster {
    let saved: ItemMaster;
    if (item.id && this.items.some((i) => i.id === item.id)) {
      this.items = this.items.map((i) => (i.id === item.id ? ({ ...i, ...item } as ItemMaster) : i));
      saved = this.items.find((i) => i.id === item.id)!;
      this.logAudit({
        module: 'Item Master',
        action: 'Edit',
        entityId: saved.id,
        entityNumber: saved.code,
        details: `Updated item master ${saved.name}`,
      });
    } else {
      const id = `ITM-${String(this.items.length + 1).padStart(3, '0')}`;
      saved = {
        id,
        code: item.code,
        name: item.name,
        sku: item.sku || item.code,
        barcode: item.barcode,
        description: item.description || '',
        brand: item.brand || 'Generic',
        category: item.category || 'General Supplies',
        hsnCode: item.hsnCode || '84713010',
        isService: item.isService || false,
        baseUnit: item.baseUnit || 'NOS',
        purchaseUnit: item.purchaseUnit || 'NOS',
        purchaseUnitFactor: item.purchaseUnitFactor || 1,
        salesUnit: item.salesUnit || 'NOS',
        salesUnitFactor: item.salesUnitFactor || 1,
        purchasePrice: item.purchasePrice || 0,
        salesPrice: item.salesPrice || 0,
        wholesalePrice: item.wholesalePrice,
        minSellingPrice: item.minSellingPrice || 0,
        taxRatePercent: item.taxRatePercent || 18,
        openingStock: item.openingStock || 0,
        currentStock: item.openingStock || 0,
        minStock: item.minStock || 5,
        maxStock: item.maxStock || 100,
        reorderLevel: item.reorderLevel || 10,
        warehouse: item.warehouse || 'Main Central Campus Warehouse',
        rackLocation: item.rackLocation || 'RACK-01',
        itemType: item.itemType || 'Standard',
        valuationMethod: item.valuationMethod || 'FIFO',
        status: 'Active',
      };
      this.items.unshift(saved);
      this.logAudit({
        module: 'Item Master',
        action: 'Create',
        entityId: saved.id,
        entityNumber: saved.code,
        details: `Created new item master ${saved.name} (HSN ${saved.hsnCode})`,
      });
    }
    this.persist(STORAGE_KEYS.ITEMS, this.items);
    return saved;
  }

  public getStockMovements(): StockMovement[] {
    return [...this.stockMovements];
  }

  public recordStockMovement(movement: Omit<StockMovement, 'id' | 'movementNumber'>): StockMovement {
    const nextNum = this.stockMovements.length + 1;
    const movementNumber = `SM-2026-${String(nextNum).padStart(5, '0')}`;
    const newMovement: StockMovement = {
      ...movement,
      id: `sm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      movementNumber,
    };
    this.stockMovements.unshift(newMovement);
    this.persist(STORAGE_KEYS.STOCK_MOVEMENTS, this.stockMovements);
    return newMovement;
  }

  public recordStockAdjustment(adjustment: Omit<StockAdjustment, 'id' | 'adjustmentNumber' | 'status'>): StockAdjustment {
    const nextNum = this.stockAdjustments.length + 1;
    const adjustmentNumber = `ADJ-2026-${String(nextNum).padStart(4, '0')}`;
    const newAdj: StockAdjustment = {
      ...adjustment,
      id: `adj-${Date.now()}`,
      adjustmentNumber,
      status: 'Approved',
      approvedBy: 'Inventory Manager',
    };

    // Update item stock
    const item = this.items.find((i) => i.id === adjustment.itemId);
    if (item) {
      item.currentStock = adjustment.newQty;
      this.persist(STORAGE_KEYS.ITEMS, this.items);

      // Record movement
      this.recordStockMovement({
        date: adjustment.date,
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        type: adjustment.direction === 'IN' ? 'Adjustment In' : 'Adjustment Out',
        quantity: Math.abs(adjustment.adjustmentQty),
        unit: item.baseUnit,
        unitCost: item.purchasePrice,
        totalValue: Math.abs(adjustment.adjustmentQty) * item.purchasePrice,
        referenceType: 'StockAdjustment',
        referenceId: newAdj.id,
        referenceNumber: newAdj.adjustmentNumber,
        warehouse: adjustment.location,
        balanceAfter: item.currentStock,
        notes: adjustment.remarks || adjustment.reason,
        createdBy: 'Inventory Auditor',
      });

      // Post balanced journal entry for stock difference
      const totalDiffVal = Math.abs(adjustment.adjustmentQty) * item.purchasePrice;
      if (totalDiffVal > 0) {
        if (adjustment.direction === 'IN') {
          accountingEngine.postJournalEntry({
            referenceType: 'StockAdjustment',
            referenceId: newAdj.id,
            referenceNumber: newAdj.adjustmentNumber,
            date: adjustment.date,
            narration: `Stock Adjustment IN for ${item.name} (${adjustment.reason})`,
            lines: [
              { accountCode: '1300', accountName: 'Inventory Asset', debit: totalDiffVal, credit: 0 },
              { accountCode: '6000', accountName: 'Round-Off / Price Variance Adjustment', debit: 0, credit: totalDiffVal },
            ],
          });
        } else {
          accountingEngine.postJournalEntry({
            referenceType: 'StockAdjustment',
            referenceId: newAdj.id,
            referenceNumber: newAdj.adjustmentNumber,
            date: adjustment.date,
            narration: `Stock Adjustment OUT for ${item.name} (${adjustment.reason})`,
            lines: [
              { accountCode: '6000', accountName: 'Round-Off / Price Variance Adjustment', debit: totalDiffVal, credit: 0 },
              { accountCode: '1300', accountName: 'Inventory Asset', debit: 0, credit: totalDiffVal },
            ],
          });
        }
      }
    }

    this.stockAdjustments.unshift(newAdj);
    this.persist(STORAGE_KEYS.STOCK_ADJUSTMENTS, this.stockAdjustments);
    return newAdj;
  }

  // ==========================================
  // PURCHASE WORKFLOW (Section 13, 14, 15, 96 & 99)
  // ==========================================

  // --- Purchase Requests ---
  public getPurchaseRequests(): PurchaseRequest[] {
    return [...this.purchaseRequests];
  }

  public savePurchaseRequest(req: Partial<PurchaseRequest> & {
    requestedBy: string;
    department: string;
    items: PurchaseRequest['items'];
  }): PurchaseRequest {
    const nextNum = this.purchaseRequests.length + 1;
    const requestNumber = req.requestNumber || `PR-2026-${String(nextNum).padStart(4, '0')}`;
    const id = req.id || `pr-${Date.now()}`;
    const estimatedTotal = req.items.reduce((s, i) => s + (i.estimatedTotal || i.estimatedPrice * i.quantity), 0);

    const newRequest: PurchaseRequest = {
      id,
      requestNumber,
      date: req.date || new Date().toISOString().split('T')[0],
      requestedBy: req.requestedBy,
      department: req.department,
      branch: req.branch || 'Kochi Campus',
      project: req.project,
      requiredDate: req.requiredDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      priority: req.priority || 'Medium',
      items: req.items,
      estimatedTotal,
      preferredVendorId: req.preferredVendorId,
      preferredVendorName: req.preferredVendorName,
      reason: req.reason || 'General department requisition',
      remarks: req.remarks,
      status: req.status || 'Draft',
    };

    this.purchaseRequests.unshift(newRequest);
    this.persist(STORAGE_KEYS.PURCHASE_REQUESTS, this.purchaseRequests);

    this.logAudit({
      module: 'Purchase Request',
      action: 'Create',
      entityId: newRequest.id,
      entityNumber: newRequest.requestNumber,
      details: `Created Purchase Request for ₹${estimatedTotal} by ${newRequest.requestedBy}`,
    });

    return newRequest;
  }

  public updatePurchaseRequestStatus(id: string, status: PurchaseRequest['status']): void {
    const req = this.purchaseRequests.find((r) => r.id === id);
    if (req) {
      req.status = status;
      this.persist(STORAGE_KEYS.PURCHASE_REQUESTS, this.purchaseRequests);
      this.logAudit({
        module: 'Purchase Request',
        action: 'Edit',
        entityId: req.id,
        entityNumber: req.requestNumber,
        details: `Updated Purchase Request status to ${status}`,
      });
    }
  }

  public convertPurchaseRequestToQuotation(requestId: string, vendorId: string): PurchaseQuotation {
    const pr = this.purchaseRequests.find((r) => r.id === requestId);
    if (!pr) throw new Error('Purchase Request not found.');

    const vendor = this.parties.find((p) => p.id === vendorId);
    if (!vendor) throw new Error('Vendor not found.');

    const isInterState = vendor.state && vendor.state.toLowerCase() !== 'kerala';
    const quoteItems = pr.items.map((item) => {
      const rate = item.estimatedPrice;
      const sub = rate * item.quantity;
      const taxPercent = 18;
      const tax = (sub * taxPercent) / 100;

      return {
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        hsnCode: '8471',
        quantity: item.quantity,
        unit: item.unit,
        rate,
        discount: 0,
        taxPercent,
        cgst: isInterState ? 0 : tax / 2,
        sgst: isInterState ? 0 : tax / 2,
        igst: isInterState ? tax : 0,
        total: sub + tax,
      };
    });

    const quotation = this.savePurchaseQuotation({
      vendorId: vendor.id,
      vendorName: vendor.name,
      requestRefId: pr.id,
      requestNumber: pr.requestNumber,
      paymentTerms: vendor.paymentTerms || 'Net 30',
      items: quoteItems,
      remarks: `Converted from Purchase Request ${pr.requestNumber}`,
    });

    if (!pr.quotationIds) pr.quotationIds = [];
    if (!pr.quotationNumbers) pr.quotationNumbers = [];
    if (!pr.quotationIds.includes(quotation.id)) {
      pr.quotationIds.push(quotation.id);
      pr.quotationNumbers.push(quotation.quotationNumber);
    }
    this.updatePurchaseRequestStatus(pr.id, 'Approved');
    return quotation;
  }

  public copyPurchaseRequestToQuotation(
    requestId: string,
    vendorId: string,
    overrides?: {
      deliveryDate?: string;
      paymentTerms?: string;
      validUntil?: string;
      items?: PurchaseItemLine[];
    }
  ): PurchaseQuotation {
    const pr = this.purchaseRequests.find((r) => r.id === requestId);
    if (!pr) throw new Error('Purchase Request not found.');

    const vendor = this.parties.find((p) => p.id === vendorId);
    if (!vendor) throw new Error('Vendor not found.');

    const isInterState = vendor.state && vendor.state.toLowerCase() !== 'kerala';
    const quoteItems: PurchaseItemLine[] = overrides?.items || pr.items.map((item) => {
      const rate = item.estimatedPrice;
      const sub = rate * item.quantity;
      const taxPercent = 18;
      const tax = (sub * taxPercent) / 100;

      return {
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        hsnCode: '8471',
        quantity: item.quantity,
        unit: item.unit,
        rate,
        discount: 0,
        taxPercent,
        cgst: isInterState ? 0 : tax / 2,
        sgst: isInterState ? 0 : tax / 2,
        igst: isInterState ? tax : 0,
        total: sub + tax,
      };
    });

    const quotation = this.savePurchaseQuotation({
      vendorId: vendor.id,
      vendorName: vendor.name,
      requestRefId: pr.id,
      requestNumber: pr.requestNumber,
      paymentTerms: overrides?.paymentTerms || vendor.paymentTerms || 'Net 30',
      validUntil: overrides?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      deliveryDate: overrides?.deliveryDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      items: quoteItems,
      remarks: `Quotation received against Purchase Request ${pr.requestNumber}`,
    });

    if (!pr.quotationIds) pr.quotationIds = [];
    if (!pr.quotationNumbers) pr.quotationNumbers = [];
    if (!pr.quotationIds.includes(quotation.id)) {
      pr.quotationIds.push(quotation.id);
      pr.quotationNumbers.push(quotation.quotationNumber);
    }
    if (pr.status === 'Draft' || pr.status === 'Submitted') {
      pr.status = 'Approved';
    }
    this.persist(STORAGE_KEYS.PURCHASE_REQUESTS, this.purchaseRequests);

    return quotation;
  }

  public convertPurchaseRequestToPO(requestId: string, vendorId: string): PurchaseOrder {
    const pr = this.purchaseRequests.find((r) => r.id === requestId);
    if (!pr) throw new Error('Purchase Request not found.');

    const vendor = this.parties.find((p) => p.id === vendorId);
    if (!vendor) throw new Error('Vendor not found.');

    const isInterState = vendor.state && vendor.state.toLowerCase() !== 'kerala';
    const poItems = pr.items.map((item) => {
      const rate = item.estimatedPrice;
      const sub = rate * item.quantity;
      const taxPercent = 18;
      const tax = (sub * taxPercent) / 100;

      return {
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        hsnCode: '8471',
        quantity: item.quantity,
        unit: item.unit,
        rate,
        discount: 0,
        taxPercent,
        cgst: isInterState ? 0 : tax / 2,
        sgst: isInterState ? 0 : tax / 2,
        igst: isInterState ? tax : 0,
        total: sub + tax,
      };
    });

    const po = this.savePurchaseOrder({
      vendorId: vendor.id,
      vendorName: vendor.name,
      department: pr.department,
      branch: pr.branch,
      items: poItems,
      paymentTerms: vendor.paymentTerms || 'Net 30',
      status: 'Approved',
    });

    this.updatePurchaseRequestStatus(pr.id, 'Converted');
    return po;
  }

  // --- Purchase Quotations ---
  public getPurchaseQuotations(): PurchaseQuotation[] {
    return [...this.purchaseQuotations];
  }

  public savePurchaseQuotation(quote: Partial<PurchaseQuotation> & {
    vendorId: string;
    vendorName: string;
    items: PurchaseQuotation['items'];
  }): PurchaseQuotation {
    const nextNum = this.purchaseQuotations.length + 1;
    const quotationNumber = quote.quotationNumber || `PQ-2026-${String(nextNum).padStart(4, '0')}`;
    const id = quote.id || `pq-${Date.now()}`;

    const subtotal = quote.items.reduce((s, i) => s + i.rate * i.quantity, 0);
    const discountTotal = quote.items.reduce((s, i) => s + (i.rate * i.quantity * (i.discount || 0)) / 100, 0);
    const taxTotal = quote.items.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
    const otherCharges = quote.otherCharges || 0;
    const grandTotal = Math.round((subtotal - discountTotal + taxTotal + otherCharges) * 100) / 100;

    const newQuotation: PurchaseQuotation = {
      id,
      quotationNumber,
      date: quote.date || new Date().toISOString().split('T')[0],
      vendorId: quote.vendorId,
      vendorName: quote.vendorName,
      requestRefId: quote.requestRefId,
      requestNumber: quote.requestNumber,
      validUntil: quote.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      deliveryDate: quote.deliveryDate,
      paymentTerms: quote.paymentTerms || 'Net 30',
      items: quote.items,
      subtotal,
      discountTotal,
      taxTotal,
      otherCharges,
      grandTotal,
      remarks: quote.remarks,
      status: quote.status || 'Received',
    };

    this.purchaseQuotations.unshift(newQuotation);
    this.persist(STORAGE_KEYS.PURCHASE_QUOTATIONS, this.purchaseQuotations);

    this.logAudit({
      module: 'Purchase Quotation',
      action: 'Create',
      entityId: newQuotation.id,
      entityNumber: newQuotation.quotationNumber,
      details: `Received quotation for ₹${grandTotal} from ${newQuotation.vendorName}`,
    });

    return newQuotation;
  }

  public updatePurchaseQuotationStatus(id: string, status: PurchaseQuotation['status']): void {
    const q = this.purchaseQuotations.find((item) => item.id === id);
    if (q) {
      q.status = status;
      this.persist(STORAGE_KEYS.PURCHASE_QUOTATIONS, this.purchaseQuotations);
    }
  }

  public convertQuotationToPO(quotationId: string, selectedItemIds?: string[]): PurchaseOrder {
    const quote = this.purchaseQuotations.find((q) => q.id === quotationId);
    if (!quote) throw new Error('Quotation not found.');

    const itemsToInclude = selectedItemIds && selectedItemIds.length > 0
      ? quote.items.filter((item) => selectedItemIds.includes(item.itemId))
      : quote.items;

    const po = this.savePurchaseOrder({
      vendorId: quote.vendorId,
      vendorName: quote.vendorName,
      quotationRefId: quote.id,
      quotationNumber: quote.quotationNumber,
      requestRefId: quote.requestRefId,
      requestNumber: quote.requestNumber,
      expectedDeliveryDate: quote.deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      paymentTerms: quote.paymentTerms,
      items: itemsToInclude.length > 0 ? itemsToInclude : quote.items,
      status: 'Approved',
    });

    quote.status = 'Converted to PO';
    quote.poId = po.id;
    quote.poNumber = po.poNumber;
    quote.isSelectedForPO = true;
    this.persist(STORAGE_KEYS.PURCHASE_QUOTATIONS, this.purchaseQuotations);

    if (quote.requestRefId) {
      const pr = this.purchaseRequests.find((r) => r.id === quote.requestRefId);
      if (pr) {
        pr.poId = po.id;
        pr.poNumber = po.poNumber;
        pr.status = 'Converted';
        this.persist(STORAGE_KEYS.PURCHASE_REQUESTS, this.purchaseRequests);
      }
    }

    return po;
  }

  // --- Purchase Orders ---
  public getPurchaseOrders(): PurchaseOrder[] {
    return [...this.purchaseOrders];
  }

  public savePurchaseOrder(po: Partial<PurchaseOrder> & { vendorId: string; vendorName: string; items: PurchaseOrder['items'] }): PurchaseOrder {
    const nextNum = this.purchaseOrders.length + 1;
    const poNumber = po.poNumber || `PO-2026-${String(nextNum).padStart(4, '0')}`;
    const id = po.id || `po-${Date.now()}`;

    const subtotal = po.items.reduce((s, i) => s + i.rate * i.quantity, 0);
    const discountTotal = po.items.reduce((s, i) => s + (i.rate * i.quantity * (i.discount || 0)) / 100, 0);
    const taxTotal = po.items.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
    const grandTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100;
    const departmentName = po.department || 'General Admin';

    // Live Budget Validation Check against Available Budget
    const validation = budgetValidationService.validatePurchaseOrder({
      department: departmentName,
      grandTotal,
      items: po.items,
      poNumber,
    });

    if (validation.status === 'BLOCKED') {
      throw new Error(`[BUDGET VALIDATION BLOCKED] ${validation.message}`);
    }

    const savedPO: PurchaseOrder = {
      id,
      poNumber,
      date: po.date || new Date().toISOString().split('T')[0],
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      department: departmentName,
      branch: po.branch || 'Kochi Campus',
      costCenter: po.costCenter || 'CC-OPERATIONS',
      expectedDeliveryDate: po.expectedDeliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      paymentTerms: po.paymentTerms || 'Net 30',
      items: po.items,
      subtotal,
      discountTotal,
      taxTotal,
      roundOff: 0,
      grandTotal,
      invoicedAmount: 0,
      budgetCategoryCode: po.budgetCategoryCode || 'INFRA',
      budgetCommitmentAmount: grandTotal,
      status: validation.status === 'NEEDS_APPROVAL' ? 'Pending Approval' : 'Approved',
    };

    // Create automatic Budget Commitment per Section 51
    const commitment: BudgetCommitmentRecord = {
      id: `bcom-${Date.now()}`,
      poId: savedPO.id,
      poNumber: savedPO.poNumber,
      categoryCode: savedPO.budgetCategoryCode || 'INFRA',
      department: savedPO.department,
      originalAmount: grandTotal,
      releasedAmount: 0,
      activeCommitment: grandTotal,
      date: savedPO.date,
      status: 'Active',
    };
    this.budgetCommitments.unshift(commitment);
    this.persist(STORAGE_KEYS.BUDGET_COMMITMENTS, this.budgetCommitments);

    this.purchaseOrders.unshift(savedPO);
    this.persist(STORAGE_KEYS.PURCHASE_ORDERS, this.purchaseOrders);

    this.logAudit({
      module: 'Purchase Order',
      action: 'Create',
      entityId: savedPO.id,
      entityNumber: savedPO.poNumber,
      details: `Created and committed PO for ₹${grandTotal} with ${savedPO.vendorName}`,
    });

    return savedPO;
  }

  public updatePurchaseOrderStatus(id: string, status: PurchaseOrder['status']): void {
    const po = this.purchaseOrders.find((p) => p.id === id);
    if (po) {
      po.status = status;
      this.persist(STORAGE_KEYS.PURCHASE_ORDERS, this.purchaseOrders);
    }
  }

  public approvePurchaseOrder(poId: string, approvedBy = 'Finance Manager'): PurchaseOrder {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error('Purchase Order not found.');

    po.status = 'Approved';
    const existingCommitment = this.budgetCommitments.find((bc) => bc.poId === po.id);
    if (!existingCommitment) {
      const commitment: BudgetCommitmentRecord = {
        id: `bcom-${Date.now()}`,
        poId: po.id,
        poNumber: po.poNumber,
        categoryCode: po.budgetCategoryCode || 'INFRA',
        department: po.department,
        originalAmount: po.grandTotal,
        releasedAmount: 0,
        activeCommitment: po.grandTotal,
        date: new Date().toISOString().split('T')[0],
        status: 'Active',
      };
      this.budgetCommitments.unshift(commitment);
      this.persist(STORAGE_KEYS.BUDGET_COMMITMENTS, this.budgetCommitments);
    }

    this.persist(STORAGE_KEYS.PURCHASE_ORDERS, this.purchaseOrders);
    this.logAudit({
      module: 'Purchase Order',
      action: 'Approve',
      entityId: po.id,
      entityNumber: po.poNumber,
      details: `PO approved by ${approvedBy}. Budget commitment activated.`,
    });
    return po;
  }

  public convertPOToPurchaseInvoice(poId: string): PurchaseInvoiceRecord {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error('Purchase Order not found.');

    return this.postPurchaseInvoice({
      poId: po.id,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      costCenter: po.costCenter,
      paymentTerms: po.paymentTerms,
      items: po.items,
    });
  }

  public getPurchaseInvoices(): PurchaseInvoiceRecord[] {
    return [...this.purchaseInvoices];
  }

  /**
   * Posts a Purchase Invoice into the ERP
   * 1. Updates Vendor Outstanding Balance
   * 2. Adds Inventory stock & records StockMovement (Purchase In)
   * 3. Releases active PO Budget Commitment
   * 4. Automatically creates Balanced Journal Entry in Accounting Foundation!
   */
  public postPurchaseInvoice(invoice: Partial<PurchaseInvoiceRecord> & {
    vendorId: string;
    vendorName: string;
    items: PurchaseInvoiceRecord['items'];
  }): PurchaseInvoiceRecord {
    const nextNum = this.purchaseInvoices.length + 1;
    const invoiceNumber = invoice.invoiceNumber || `PI-2026-${String(nextNum).padStart(4, '0')}`;
    const id = invoice.id || `pi-${Date.now()}`;

    const subtotal = invoice.items.reduce((s, i) => s + i.rate * i.quantity, 0);
    const discountTotal = invoice.items.reduce((s, i) => s + (i.rate * i.quantity * (i.discount || 0)) / 100, 0);
    const cgstTotal = invoice.items.reduce((s, i) => s + i.cgst, 0);
    const sgstTotal = invoice.items.reduce((s, i) => s + i.sgst, 0);
    const igstTotal = invoice.items.reduce((s, i) => s + i.igst, 0);
    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const grandTotal = Math.round((subtotal - discountTotal + totalTax) * 100) / 100;

    const savedInvoice: PurchaseInvoiceRecord = {
      id,
      invoiceNumber,
      date: invoice.date || new Date().toISOString().split('T')[0],
      vendorId: invoice.vendorId,
      vendorName: invoice.vendorName,
      poId: invoice.poId,
      poNumber: invoice.poNumber,
      grpoId: invoice.grpoId,
      grpoNumber: invoice.grpoNumber,
      grnReference: invoice.grnReference || invoice.grpoNumber,
      requestRefId: invoice.requestRefId,
      requestNumber: invoice.requestNumber,
      quotationRefId: invoice.quotationRefId,
      quotationNumber: invoice.quotationNumber,
      costCenter: invoice.costCenter || 'CC-OPERATIONS',
      items: invoice.items,
      subtotal,
      discountTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff: 0,
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      dueDate: invoice.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTerms: invoice.paymentTerms || 'Net 30',
      isReverseCharge: invoice.isReverseCharge || false,
      eInvoiceIrn: invoice.eInvoiceIrn || `IRN-${Date.now().toString().slice(-8)}`,
      status: 'Pending',
      approvalStatus: 'Approved',
      approvedBy: 'Finance Manager',
    };

    // 1. Update Party balance (Vendor payable increases)
    const vendor = this.parties.find((p) => p.id === savedInvoice.vendorId);
    if (vendor) {
      vendor.currentBalance -= grandTotal; // Vendor payable negative convention
      this.persist(STORAGE_KEYS.PARTIES, this.parties);
    }

    // 2. Increase Inventory stock & record Stock Movement ONLY IF NOT ALREADY RECEIVED VIA GRPO
    if (!savedInvoice.grpoId) {
      invoice.items.forEach((itemLine) => {
        const item = this.items.find((i) => i.id === itemLine.itemId);
        if (item) {
          item.currentStock += itemLine.quantity;
          this.recordStockMovement({
            date: savedInvoice.date,
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            type: 'Purchase In',
            quantity: itemLine.quantity,
            unit: itemLine.unit,
            unitCost: itemLine.rate,
            totalValue: itemLine.total,
            referenceType: 'PurchaseInvoice',
            referenceId: savedInvoice.id,
            referenceNumber: savedInvoice.invoiceNumber,
            warehouse: item.warehouse,
            balanceAfter: item.currentStock,
            notes: `Purchased from ${savedInvoice.vendorName}`,
            createdBy: 'Purchase Receiving',
          });
        }
      });
      this.persist(STORAGE_KEYS.ITEMS, this.items);
    } else {
      const gr = this.goodsReceiptPOs.find((g) => g.id === savedInvoice.grpoId);
      if (gr) {
        gr.status = 'Fully Invoiced';
        gr.invoiceId = savedInvoice.id;
        gr.invoiceNumber = savedInvoice.invoiceNumber;
        this.persist(STORAGE_KEYS.GOODS_RECEIPT_POS, this.goodsReceiptPOs);
      }
    }

    // 3. Release PO Commitment if linked or record actual spend
    if (savedInvoice.poId) {
      budgetEngine.onPoInvoiced({
        poId: savedInvoice.poId,
        invoicedAmountReleased: grandTotal,
        finalBilledAmount: grandTotal,
      });

      const bCom = this.budgetCommitments.find((bc) => bc.poId === savedInvoice.poId);
      if (bCom) {
        bCom.releasedAmount += grandTotal;
        bCom.activeCommitment = Math.max(0, bCom.originalAmount - bCom.releasedAmount);
        if (bCom.activeCommitment === 0) bCom.status = 'Fully Released';
        else bCom.status = 'Partially Released';
        this.persist(STORAGE_KEYS.BUDGET_COMMITMENTS, this.budgetCommitments);
      }
      const po = this.purchaseOrders.find((p) => p.id === savedInvoice.poId);
      if (po) {
        po.invoicedAmount += grandTotal;
        if (po.invoicedAmount >= po.grandTotal) po.status = 'Fully Invoiced';
        else po.status = 'Partially Invoiced';
        this.persist(STORAGE_KEYS.PURCHASE_ORDERS, this.purchaseOrders);
      }
    } else {
      // Direct purchase without prior PO - posts straight to Actual
      budgetEngine.recordActualExpenditure({
        category: 'Direct Operations Purchase',
        department: 'Operations',
        costCenter: savedInvoice.costCenter || 'CC-OPERATIONS',
        amount: grandTotal,
        referenceType: 'PurchaseInvoice',
        referenceId: savedInvoice.id,
        referenceNumber: savedInvoice.invoiceNumber,
      });
    }

    // 4. Double-Entry Accounting Journal Entry per Section 99.2
    // Dr. Inventory (1300) [or Expense if service]
    // Dr. Input GST (1400)
    // Cr. Accounts Payable (2000)
    const netMaterialValue = subtotal - discountTotal;
    accountingEngine.postJournalEntry({
      referenceType: 'PurchaseInvoice',
      referenceId: savedInvoice.id,
      referenceNumber: savedInvoice.invoiceNumber,
      date: savedInvoice.date,
      narration: `Purchase invoice ${savedInvoice.invoiceNumber} from ${savedInvoice.vendorName}`,
      lines: [
        {
          accountCode: '1300',
          accountName: 'Inventory Asset',
          partyId: savedInvoice.vendorId,
          partyName: savedInvoice.vendorName,
          debit: netMaterialValue,
          credit: 0,
        },
        {
          accountCode: '1400',
          accountName: 'Input GST (ITC Credit)',
          debit: totalTax,
          credit: 0,
        },
        {
          accountCode: '2000',
          accountName: 'Accounts Payable (Control)',
          partyId: savedInvoice.vendorId,
          partyName: savedInvoice.vendorName,
          debit: 0,
          credit: grandTotal,
        },
      ],
      createdBy: 'Purchase Invoice Poster',
    });

    // 5. RCM Self-Invoicing & Dual-Leg Journal Entry if Reverse Charge Applicable
    if (savedInvoice.isReverseCharge) {
      gstTaxEngine.createRcmSelfInvoice({
        vendorName: savedInvoice.vendorName,
        vendorGstin: vendor?.gstin,
        natureOfSupply: 'Inward Goods/Services under Reverse Charge',
        taxableAmount: netMaterialValue,
        ratePercent: savedInvoice.cgstTotal > 0 ? ((savedInvoice.cgstTotal + savedInvoice.sgstTotal) / netMaterialValue) * 100 : 18,
        partyState: 'Kerala',
        partyStateCode: '32',
        date: savedInvoice.date,
        notes: `RCM self-invoice generated for Bill ${savedInvoice.invoiceNumber}`,
      });
    }

    this.purchaseInvoices.unshift(savedInvoice);
    this.persist(STORAGE_KEYS.PURCHASE_INVOICES, this.purchaseInvoices);

    this.logAudit({
      module: 'Purchase Invoice',
      action: 'Post',
      entityId: savedInvoice.id,
      entityNumber: savedInvoice.invoiceNumber,
      details: `Posted vendor bill for ₹${grandTotal} with ${savedInvoice.vendorName}. Journal entry created.`,
    });

    return savedInvoice;
  }

  // --- Goods Receipt PO (SAP B1 Workflow) ---
  public getGoodsReceiptPOs(): GoodsReceiptPO[] {
    return [...this.goodsReceiptPOs];
  }

  public saveGoodsReceiptPO(grpo: Partial<GoodsReceiptPO> & {
    poId: string;
    items: GoodsReceiptPO['items'];
  }): GoodsReceiptPO {
    const nextNum = this.goodsReceiptPOs.length + 1;
    const grpoNumber = grpo.grpoNumber || `GRPO-2026-${String(nextNum).padStart(4, '0')}`;
    const id = grpo.id || `grpo-${Date.now()}`;
    const totalReceivedQty = grpo.items.reduce((s, i) => s + (i.receivedQty !== undefined ? i.receivedQty : i.quantity), 0);
    const totalAmount = grpo.items.reduce((s, i) => s + (i.total || (i.rate * i.quantity)), 0);

    const newGrpo: GoodsReceiptPO = {
      id,
      grpoNumber,
      date: grpo.date || new Date().toISOString().split('T')[0],
      poId: grpo.poId,
      poNumber: grpo.poNumber || '',
      requestRefId: grpo.requestRefId,
      requestNumber: grpo.requestNumber,
      quotationRefId: grpo.quotationRefId,
      quotationNumber: grpo.quotationNumber,
      vendorId: grpo.vendorId || '',
      vendorName: grpo.vendorName || '',
      vendorChallanNo: grpo.vendorChallanNo || `CH-${Math.floor(100000 + Math.random() * 900000)}`,
      challanDate: grpo.challanDate || new Date().toISOString().split('T')[0],
      warehouse: grpo.warehouse || 'Central IT Depot (Warehouse A)',
      items: grpo.items.map((it) => ({
        ...it,
        receivedQty: it.receivedQty !== undefined ? it.receivedQty : it.quantity,
        acceptedQty: it.acceptedQty !== undefined ? it.acceptedQty : it.quantity,
        rejectedQty: it.rejectedQty !== undefined ? it.rejectedQty : 0,
      })),
      totalReceivedQty,
      totalAmount,
      receivedBy: grpo.receivedBy || 'Rajeev Pillai (Warehouse In-Charge)',
      inspectionStatus: grpo.inspectionStatus || 'Inspected & Accepted',
      remarks: grpo.remarks || '',
      status: 'Open',
    };

    // Update physical stock in ItemMaster and record Stock Movement (Purchase In)
    newGrpo.items.forEach((itemLine) => {
      const item = this.items.find((i) => i.id === itemLine.itemId);
      if (item) {
        const qtyToAdd = itemLine.acceptedQty !== undefined ? itemLine.acceptedQty : itemLine.quantity;
        item.currentStock += qtyToAdd;
        if (itemLine.rate) item.purchasePrice = itemLine.rate;
        this.recordStockMovement({
          date: newGrpo.date,
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          type: 'Purchase In',
          quantity: qtyToAdd,
          unit: itemLine.unit,
          unitCost: itemLine.rate,
          totalValue: itemLine.total,
          referenceType: 'GoodsReceiptPO' as any,
          referenceId: newGrpo.id,
          referenceNumber: newGrpo.grpoNumber,
          warehouse: newGrpo.warehouse,
          balanceAfter: item.currentStock,
          notes: `GRPO against PO ${newGrpo.poNumber}`,
          createdBy: newGrpo.receivedBy,
        });
      }
    });
    this.persist(STORAGE_KEYS.ITEMS, this.items);

    // Update PO linkage
    const po = this.purchaseOrders.find((p) => p.id === newGrpo.poId);
    if (po) {
      po.grpoId = newGrpo.id;
      po.grpoNumber = newGrpo.grpoNumber;
      po.status = 'Fully Received';
      this.persist(STORAGE_KEYS.PURCHASE_ORDERS, this.purchaseOrders);
    }

    this.goodsReceiptPOs.unshift(newGrpo);
    this.persist(STORAGE_KEYS.GOODS_RECEIPT_POS, this.goodsReceiptPOs);

    this.logAudit({
      module: 'Goods Receipt PO',
      action: 'Create',
      entityId: newGrpo.id,
      entityNumber: newGrpo.grpoNumber,
      details: `Goods Receipt PO created for ${totalReceivedQty} units against PO ${newGrpo.poNumber}`,
    });

    return newGrpo;
  }

  public convertPOToGRPO(poId: string, overrides?: Partial<GoodsReceiptPO>): GoodsReceiptPO {
    const po = this.purchaseOrders.find((p) => p.id === poId);
    if (!po) throw new Error('Purchase Order not found.');

    return this.saveGoodsReceiptPO({
      poId: po.id,
      poNumber: po.poNumber,
      requestRefId: po.requestRefId,
      requestNumber: po.requestNumber,
      quotationRefId: po.quotationRefId,
      quotationNumber: po.quotationNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      vendorChallanNo: overrides?.vendorChallanNo || `CH-${Math.floor(100000 + Math.random() * 900000)}`,
      challanDate: overrides?.challanDate || new Date().toISOString().split('T')[0],
      warehouse: overrides?.warehouse || 'Central IT Depot (Warehouse A)',
      receivedBy: overrides?.receivedBy || 'Rajeev Pillai (Warehouse In-Charge)',
      inspectionStatus: overrides?.inspectionStatus || 'Inspected & Accepted',
      remarks: overrides?.remarks || `Goods received against PO ${po.poNumber}`,
      items: po.items.map((it) => ({
        ...it,
        receivedQty: it.quantity,
        acceptedQty: it.quantity,
        rejectedQty: 0,
      })),
    });
  }

  public convertGRPOToPurchaseInvoice(grpoId: string): PurchaseInvoiceRecord {
    const grpo = this.goodsReceiptPOs.find((g) => g.id === grpoId);
    if (!grpo) throw new Error('Goods Receipt PO not found.');

    const po = this.purchaseOrders.find((p) => p.id === grpo.poId);

    const invoice = this.postPurchaseInvoice({
      poId: grpo.poId,
      poNumber: grpo.poNumber,
      grpoId: grpo.id,
      grpoNumber: grpo.grpoNumber,
      grnReference: grpo.grpoNumber,
      requestRefId: grpo.requestRefId,
      requestNumber: grpo.requestNumber,
      quotationRefId: grpo.quotationRefId,
      quotationNumber: grpo.quotationNumber,
      vendorId: grpo.vendorId,
      vendorName: grpo.vendorName,
      costCenter: po?.costCenter || 'CC-OPERATIONS',
      paymentTerms: po?.paymentTerms || 'Net 30',
      items: grpo.items.map((i) => ({
        itemId: i.itemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        hsnCode: i.hsnCode,
        quantity: i.acceptedQty !== undefined ? i.acceptedQty : i.quantity,
        unit: i.unit,
        rate: i.rate,
        discount: i.discount,
        taxPercent: i.taxPercent,
        cgst: i.cgst,
        sgst: i.sgst,
        igst: i.igst,
        total: i.total,
      })),
    });

    grpo.status = 'Fully Invoiced';
    grpo.invoiceId = invoice.id;
    grpo.invoiceNumber = invoice.invoiceNumber;
    this.persist(STORAGE_KEYS.GOODS_RECEIPT_POS, this.goodsReceiptPOs);

    if (po) {
      po.invoiceId = invoice.id;
      po.invoiceNumber = invoice.invoiceNumber;
      po.status = 'Fully Invoiced';
      this.persist(STORAGE_KEYS.PURCHASE_ORDERS, this.purchaseOrders);
    }

    return invoice;
  }

  /**
   * Returns complete SAP B1-style chain of Related Documents for any Purchase document
   */
  public getRelatedPurchaseDocuments(docType: 'Request' | 'Quotation' | 'Order' | 'Goods Receipt' | 'Invoice', docId: string): Array<{
    stage: 'Request' | 'Quotation' | 'Order' | 'Goods Receipt' | 'Invoice';
    id: string;
    number: string;
    date: string;
    partyName: string;
    amount: number;
    status: string;
    isCurrent: boolean;
  }> {
    const results: Array<{
      stage: 'Request' | 'Quotation' | 'Order' | 'Goods Receipt' | 'Invoice';
      id: string;
      number: string;
      date: string;
      partyName: string;
      amount: number;
      status: string;
      isCurrent: boolean;
    }> = [];

    // Find starting anchors
    let prId = '';
    let pqId = '';
    let poId = '';
    let grpoId = '';
    let piId = '';

    if (docType === 'Request') {
      prId = docId;
      const pr = this.purchaseRequests.find((r) => r.id === docId);
      if (pr?.poId) poId = pr.poId;
      if (pr?.quotationIds?.length) pqId = pr.quotationIds[0];
    } else if (docType === 'Quotation') {
      pqId = docId;
      const pq = this.purchaseQuotations.find((q) => q.id === docId);
      if (pq?.requestRefId) prId = pq.requestRefId;
      if (pq?.poId) poId = pq.poId;
    } else if (docType === 'Order') {
      poId = docId;
      const po = this.purchaseOrders.find((p) => p.id === docId);
      if (po?.requestRefId) prId = po.requestRefId;
      if (po?.quotationRefId) pqId = po.quotationRefId;
      if (po?.grpoId) grpoId = po.grpoId;
      if (po?.invoiceId) piId = po.invoiceId;
    } else if (docType === 'Goods Receipt') {
      grpoId = docId;
      const gr = this.goodsReceiptPOs.find((g) => g.id === docId);
      if (gr?.poId) poId = gr.poId;
      if (gr?.requestRefId) prId = gr.requestRefId;
      if (gr?.quotationRefId) pqId = gr.quotationRefId;
      if (gr?.invoiceId) piId = gr.invoiceId;
    } else if (docType === 'Invoice') {
      piId = docId;
      const pi = this.purchaseInvoices.find((i) => i.id === docId);
      if (pi?.poId) poId = pi.poId;
      if (pi?.grpoId) grpoId = pi.grpoId;
      if (pi?.requestRefId) prId = pi.requestRefId;
      if (pi?.quotationRefId) pqId = pi.quotationRefId;
    }

    // Traverse relationships to find linked IDs if still missing
    if (poId && !grpoId) {
      const gr = this.goodsReceiptPOs.find((g) => g.poId === poId);
      if (gr) grpoId = gr.id;
    }
    if (poId && !piId) {
      const pi = this.purchaseInvoices.find((i) => i.poId === poId);
      if (pi) piId = pi.id;
    }
    if (grpoId && !piId) {
      const pi = this.purchaseInvoices.find((i) => i.grpoId === grpoId);
      if (pi) piId = pi.id;
    }
    if (poId && !pqId) {
      const pq = this.purchaseQuotations.find((q) => q.poId === poId);
      if (pq) pqId = pq.id;
    }
    if (pqId && !prId) {
      const pq = this.purchaseQuotations.find((q) => q.id === pqId);
      if (pq?.requestRefId) prId = pq.requestRefId;
    }
    if (poId && !prId) {
      const po = this.purchaseOrders.find((p) => p.id === poId);
      if (po?.requestRefId) prId = po.requestRefId;
    }

    // 1. Request
    if (prId) {
      const pr = this.purchaseRequests.find((r) => r.id === prId);
      if (pr) {
        results.push({
          stage: 'Request',
          id: pr.id,
          number: pr.requestNumber,
          date: pr.requiredDate || pr.date || '',
          partyName: pr.department,
          amount: pr.estimatedTotal,
          status: pr.status,
          isCurrent: docType === 'Request' && docId === pr.id,
        });
      }
    }

    // 2. Quotation(s)
    if (prId) {
      const pqs = this.purchaseQuotations.filter((q) => q.requestRefId === prId);
      pqs.forEach((pq) => {
        if (!results.some((r) => r.id === pq.id)) {
          results.push({
            stage: 'Quotation',
            id: pq.id,
            number: pq.quotationNumber,
            date: pq.date,
            partyName: pq.vendorName,
            amount: pq.grandTotal,
            status: pq.status,
            isCurrent: docType === 'Quotation' && docId === pq.id,
          });
        }
      });
    } else if (pqId) {
      const pq = this.purchaseQuotations.find((q) => q.id === pqId);
      if (pq && !results.some((r) => r.id === pq.id)) {
        results.push({
          stage: 'Quotation',
          id: pq.id,
          number: pq.quotationNumber,
          date: pq.date,
          partyName: pq.vendorName,
          amount: pq.grandTotal,
          status: pq.status,
          isCurrent: docType === 'Quotation' && docId === pq.id,
        });
      }
    }

    // 3. Order
    if (poId) {
      const po = this.purchaseOrders.find((p) => p.id === poId);
      if (po) {
        results.push({
          stage: 'Order',
          id: po.id,
          number: po.poNumber,
          date: po.date,
          partyName: po.vendorName,
          amount: po.grandTotal,
          status: po.status,
          isCurrent: docType === 'Order' && docId === po.id,
        });
      }
    }

    // 4. Goods Receipt
    if (grpoId) {
      const gr = this.goodsReceiptPOs.find((g) => g.id === grpoId);
      if (gr) {
        results.push({
          stage: 'Goods Receipt',
          id: gr.id,
          number: gr.grpoNumber,
          date: gr.date,
          partyName: gr.vendorName,
          amount: gr.totalAmount,
          status: gr.status,
          isCurrent: docType === 'Goods Receipt' && docId === gr.id,
        });
      }
    }

    // 5. Invoice
    if (piId) {
      const pi = this.purchaseInvoices.find((i) => i.id === piId);
      if (pi) {
        results.push({
          stage: 'Invoice',
          id: pi.id,
          number: pi.invoiceNumber,
          date: pi.date,
          partyName: pi.vendorName,
          amount: pi.grandTotal,
          status: pi.status,
          isCurrent: docType === 'Invoice' && docId === pi.id,
        });
      }
    }

    return results;
  }

  /**
   * Unified Procurement Traceability Chain
   * Traces all linked procurement documents (Purchase Request -> Quotation -> Comparison -> PO -> Goods Receipt -> Invoice)
   * under a shared reference ID for end-to-end transparency.
   */
  public getProcurementTraceabilityChain(
    docType: 'Request' | 'Quotation' | 'Order' | 'Goods Receipt' | 'Invoice',
    docId: string
  ): ProcurementTraceabilityChain {
    // Find starting anchors
    let prId = '';
    let pqId = '';
    let poId = '';
    let grpoId = '';
    let piId = '';
    let activeDocNumber = '';

    if (docType === 'Request') {
      prId = docId;
      const pr = this.purchaseRequests.find((r) => r.id === docId);
      activeDocNumber = pr?.requestNumber || '';
      if (pr?.poId) poId = pr.poId;
      if (pr?.quotationIds?.length) pqId = pr.quotationIds[0];
    } else if (docType === 'Quotation') {
      pqId = docId;
      const pq = this.purchaseQuotations.find((q) => q.id === docId);
      activeDocNumber = pq?.quotationNumber || '';
      if (pq?.requestRefId) prId = pq.requestRefId;
      if (pq?.poId) poId = pq.poId;
    } else if (docType === 'Order') {
      poId = docId;
      const po = this.purchaseOrders.find((p) => p.id === docId);
      activeDocNumber = po?.poNumber || '';
      if (po?.requestRefId) prId = po.requestRefId;
      if (po?.quotationRefId) pqId = po.quotationRefId;
      if (po?.grpoId) grpoId = po.grpoId;
      if (po?.invoiceId) piId = po.invoiceId;
    } else if (docType === 'Goods Receipt') {
      grpoId = docId;
      const gr = this.goodsReceiptPOs.find((g) => g.id === docId);
      activeDocNumber = gr?.grpoNumber || '';
      if (gr?.poId) poId = gr.poId;
      if (gr?.requestRefId) prId = gr.requestRefId;
      if (gr?.quotationRefId) pqId = gr.quotationRefId;
      if (gr?.invoiceId) piId = gr.invoiceId;
    } else if (docType === 'Invoice') {
      piId = docId;
      const pi = this.purchaseInvoices.find((i) => i.id === docId);
      activeDocNumber = pi?.invoiceNumber || '';
      if (pi?.poId) poId = pi.poId;
      if (pi?.grpoId) grpoId = pi.grpoId;
      if (pi?.requestRefId) prId = pi.requestRefId;
      if (pi?.quotationRefId) pqId = pi.quotationRefId;
    }

    // Traverse relationships
    if (poId && !grpoId) {
      const gr = this.goodsReceiptPOs.find((g) => g.poId === poId);
      if (gr) grpoId = gr.id;
    }
    if (poId && !piId) {
      const pi = this.purchaseInvoices.find((i) => i.poId === poId);
      if (pi) piId = pi.id;
    }
    if (grpoId && !piId) {
      const pi = this.purchaseInvoices.find((i) => i.grpoId === grpoId);
      if (pi) piId = pi.id;
    }
    if (poId && !pqId) {
      const pq = this.purchaseQuotations.find((q) => q.poId === poId);
      if (pq) pqId = pq.id;
    }
    if (pqId && !prId) {
      const pq = this.purchaseQuotations.find((q) => q.id === pqId);
      if (pq?.requestRefId) prId = pq.requestRefId;
    }
    if (poId && !prId) {
      const po = this.purchaseOrders.find((p) => p.id === poId);
      if (po?.requestRefId) prId = po.requestRefId;
    }
    if (prId && !poId) {
      const pr = this.purchaseRequests.find((r) => r.id === prId);
      if (pr?.poId) poId = pr.poId;
    }

    // Collect concrete documents
    const request = prId ? this.purchaseRequests.find((r) => r.id === prId) || null : null;
    let quotations: PurchaseQuotation[] = [];
    if (prId) {
      quotations = this.purchaseQuotations.filter((q) => q.requestRefId === prId);
    }
    if (quotations.length === 0 && pqId) {
      const singlePq = this.purchaseQuotations.find((q) => q.id === pqId);
      if (singlePq) quotations = [singlePq];
    }

    const order = poId ? this.purchaseOrders.find((p) => p.id === poId) || null : null;
    const goodsReceipt = grpoId ? this.goodsReceiptPOs.find((g) => g.id === grpoId) || null : null;
    const invoice = piId ? this.purchaseInvoices.find((i) => i.id === piId) || null : null;

    // Shared Reference ID: deterministic based on root PR or first available document
    const sharedReferenceId =
      request?.requestNumber ||
      order?.poNumber ||
      quotations[0]?.quotationNumber ||
      goodsReceipt?.grpoNumber ||
      invoice?.invoiceNumber ||
      `REF-${docId.slice(-6).toUpperCase()}`;

    // Compute Comparison metrics
    const sortedByPrice = [...quotations].sort((a, b) => a.grandTotal - b.grandTotal);
    const lowestPriceQuote = sortedByPrice[0];
    const highestPriceQuote = sortedByPrice[sortedByPrice.length - 1];
    const priceVariance =
      highestPriceQuote && lowestPriceQuote ? highestPriceQuote.grandTotal - lowestPriceQuote.grandTotal : 0;
    const potentialSavings =
      request && lowestPriceQuote ? Math.max(0, request.estimatedTotal - lowestPriceQuote.grandTotal) : 0;

    let fastestDeliveryQuote: PurchaseQuotation | undefined;
    let earliestTime = Infinity;
    quotations.forEach((q) => {
      if (q.deliveryDate) {
        const t = new Date(q.deliveryDate).getTime();
        if (!isNaN(t) && t < earliestTime) {
          earliestTime = t;
          fastestDeliveryQuote = q;
        }
      }
    });

    const selectedQuote =
      quotations.find((q) => q.status === 'Converted to PO' || q.status === 'Approved' || (order && q.poId === order.id)) ||
      (order ? quotations[0] : undefined);

    let evaluationStatus: 'Awaiting Bids' | 'Single Bid' | 'Ready for Comparison' | 'Evaluated & Awarded' =
      'Awaiting Bids';
    if (order || selectedQuote) {
      evaluationStatus = 'Evaluated & Awarded';
    } else if (quotations.length >= 2) {
      evaluationStatus = 'Ready for Comparison';
    } else if (quotations.length === 1) {
      evaluationStatus = 'Single Bid';
    }

    const comparison = {
      hasComparison: quotations.length >= 1,
      totalQuotations: quotations.length,
      lowestPriceQuote,
      highestPriceQuote,
      selectedQuote,
      priceVariance,
      potentialSavings,
      fastestDeliveryQuote,
      evaluationStatus,
      summary:
        quotations.length >= 2
          ? `${quotations.length} supplier quotes evaluated. Best bid: ${lowestPriceQuote?.vendorName} (${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(lowestPriceQuote?.grandTotal || 0)})`
          : quotations.length === 1
          ? `1 quote received from ${quotations[0].vendorName}`
          : 'Awaiting vendor quote submission',
    };

    // Construct 6-stage Traceability Model
    const stages: ProcurementTraceabilityStage[] = [
      {
        stage: 'Request',
        stageName: 'Purchase Request',
        stageCode: 'PR',
        sequence: 1,
        docNumber: request?.requestNumber || 'Pending Requisition',
        docId: request?.id || '',
        status: request?.status || 'Not Started',
        date: request?.requiredDate || request?.date || '—',
        partyName: request?.department ? `Dept: ${request.department}` : 'Internal',
        amount: request?.estimatedTotal || 0,
        isCompleted: !!request,
        isCurrent: docType === 'Request' && docId === request?.id,
        documentCount: request ? 1 : 0,
        summaryText: request ? `${request.items.length} item line(s) requested by ${request.requestedBy}` : undefined,
      },
      {
        stage: 'Quotation',
        stageName: 'Vendor Quotations',
        stageCode: 'PQ',
        sequence: 2,
        docNumber:
          quotations.length > 0
            ? quotations.length === 1
              ? quotations[0].quotationNumber
              : `${quotations.length} Vendor Quotes`
            : 'Pending Bids',
        docId: quotations[0]?.id || '',
        status: quotations.length > 0 ? `${quotations.length} Received` : 'Not Started',
        date: quotations[0]?.date || '—',
        partyName:
          quotations.length > 0
            ? quotations.length === 1
              ? quotations[0].vendorName
              : `${quotations.map((q) => q.vendorName).join(', ')}`
            : 'Multiple Vendors',
        amount: lowestPriceQuote?.grandTotal || 0,
        isCompleted: quotations.length > 0,
        isCurrent: docType === 'Quotation' && quotations.some((q) => q.id === docId),
        documentCount: quotations.length,
        summaryText: quotations.length > 0 ? `${quotations.length} active quote(s) received` : 'No quotations received yet',
      },
      {
        stage: 'Comparison',
        stageName: 'Quotation Comparison & Evaluation',
        stageCode: 'COMP',
        sequence: 3,
        docNumber:
          quotations.length >= 2
            ? `COMP-${sharedReferenceId}`
            : quotations.length === 1
            ? 'Single Vendor Bid'
            : 'Pending Multi-Bids',
        docId: `comp-${prId || docId}`,
        status: evaluationStatus,
        date: quotations[0]?.date || '—',
        partyName: selectedQuote
          ? `Awarded: ${selectedQuote.vendorName}`
          : lowestPriceQuote
          ? `L1: ${lowestPriceQuote.vendorName}`
          : 'Pending Evaluation',
        amount: lowestPriceQuote?.grandTotal || 0,
        isCompleted: quotations.length >= 2 || !!order,
        isCurrent: false,
        documentCount: quotations.length >= 2 ? 1 : 0,
        summaryText: comparison.summary,
      },
      {
        stage: 'Order',
        stageName: 'Purchase Order',
        stageCode: 'PO',
        sequence: 4,
        docNumber: order?.poNumber || 'Pending PO Issue',
        docId: order?.id || '',
        status: order?.status || 'Pending',
        date: order?.date || '—',
        partyName: order?.vendorName || '—',
        amount: order?.grandTotal || 0,
        isCompleted: !!order,
        isCurrent: docType === 'Order' && docId === order?.id,
        documentCount: order ? 1 : 0,
        summaryText: order
          ? `Committed PO to ${order.vendorName} with ${(order as any).deliveryTerms || (order as any).paymentTerms || 'standard delivery'}`
          : undefined,
      },
      {
        stage: 'Goods Receipt',
        stageName: 'Goods Receipt PO (GRPO)',
        stageCode: 'GRPO',
        sequence: 5,
        docNumber: goodsReceipt?.grpoNumber || 'Pending Warehouse Inward',
        docId: goodsReceipt?.id || '',
        status: goodsReceipt?.status || 'Pending Inward',
        date: goodsReceipt?.date || '—',
        partyName: goodsReceipt?.warehouse ? `Whse: ${goodsReceipt.warehouse}` : 'Central Warehouse',
        amount: goodsReceipt?.totalAmount || (order ? order.grandTotal : 0),
        isCompleted: !!goodsReceipt,
        isCurrent: docType === 'Goods Receipt' && docId === goodsReceipt?.id,
        documentCount: goodsReceipt ? 1 : 0,
        summaryText: goodsReceipt
          ? `Stock inward accepted: ${goodsReceipt.items.reduce((s, it) => s + (it.acceptedQty || it.receivedQty), 0)} unit(s)`
          : undefined,
      },
      {
        stage: 'Invoice',
        stageName: 'A/P Purchase Invoice',
        stageCode: 'PI',
        sequence: 6,
        docNumber: invoice?.invoiceNumber || 'Pending Invoice',
        docId: invoice?.id || '',
        status: invoice?.status || 'Pending Posting',
        date: invoice?.date || '—',
        partyName: invoice?.vendorName || '—',
        amount: invoice?.grandTotal || 0,
        isCompleted: !!invoice,
        isCurrent: docType === 'Invoice' && docId === invoice?.id,
        documentCount: invoice ? 1 : 0,
        summaryText: invoice
          ? `Balance Due: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(invoice.balanceAmount)}`
          : undefined,
      },
    ];

    const completedCount = stages.filter((s) => s.isCompleted).length;
    const totalStages = stages.length;
    const progressPercentage = Math.round((completedCount / totalStages) * 100);

    return {
      sharedReferenceId,
      rootDocType: docType,
      activeDoc: {
        stage: docType,
        id: docId,
        number: activeDocNumber,
      },
      request,
      quotations,
      comparison,
      order,
      goodsReceipt,
      invoice,
      stages,
      completedCount,
      totalStages,
      progressPercentage,
    };
  }

  public getPurchaseReturnRequests(): PurchaseReturnRequest[] {
    return [...this.purchaseReturnRequests];
  }

  public savePurchaseReturnRequest(req: Partial<PurchaseReturnRequest> & {
    vendorId: string;
    vendorName: string;
    originalInvoiceId: string;
    items: PurchaseReturnRequest['items'];
    totalAmount: number;
  }): PurchaseReturnRequest {
    const nextNum = this.purchaseReturnRequests.length + 1;
    const returnRequestNumber = req.returnRequestNumber || `PRR-2026-${String(nextNum).padStart(4, '0')}`;
    const id = req.id || `prr-${Date.now()}`;

    const newReq: PurchaseReturnRequest = {
      id,
      returnRequestNumber,
      date: req.date || new Date().toISOString().split('T')[0],
      vendorId: req.vendorId,
      vendorName: req.vendorName,
      originalInvoiceId: req.originalInvoiceId,
      originalInvoiceNumber: req.originalInvoiceNumber || 'PI-2026-0041',
      items: req.items,
      totalAmount: req.totalAmount,
      reason: req.reason || 'Damaged',
      remarks: req.remarks,
      status: req.status || 'Pending Approval',
    };

    this.purchaseReturnRequests.unshift(newReq);
    this.persist(STORAGE_KEYS.PURCHASE_RETURN_REQUESTS, this.purchaseReturnRequests);

    this.logAudit({
      module: 'Purchase Return Request',
      action: 'Create',
      entityId: newReq.id,
      entityNumber: newReq.returnRequestNumber,
      details: `Raised Purchase Return Request for ₹${newReq.totalAmount} against invoice ${newReq.originalInvoiceNumber}`,
    });

    return newReq;
  }

  public approvePurchaseReturnRequest(id: string, approvedBy = 'Store / Purchase Head'): {
    returnRecord: PurchaseReturnRecord;
    debitNote: DebitNoteRecord;
  } {
    const req = this.purchaseReturnRequests.find((r) => r.id === id);
    if (!req) throw new Error('Return Request not found.');

    req.status = 'Approved';
    this.persist(STORAGE_KEYS.PURCHASE_RETURN_REQUESTS, this.purchaseReturnRequests);

    const subtotal = req.items.reduce((s, i) => s + (i.rate * i.quantity - (i.rate * i.quantity * (i.discount || 0)) / 100), 0);
    const taxTotal = req.items.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
    const grandTotal = req.totalAmount || Math.round((subtotal + taxTotal) * 100) / 100;

    const returnNext = this.purchaseReturns.length + 1;
    const returnNumber = `PR-RET-2026-${String(returnNext).padStart(4, '0')}`;
    const returnRecord: PurchaseReturnRecord = {
      id: `pret-${Date.now()}`,
      returnNumber,
      date: new Date().toISOString().split('T')[0],
      vendorId: req.vendorId,
      vendorName: req.vendorName,
      originalInvoiceId: req.originalInvoiceId,
      originalInvoiceNumber: req.originalInvoiceNumber,
      returnRequestId: req.id,
      items: req.items,
      subtotal,
      taxTotal,
      grandTotal,
      reason: req.remarks || req.reason,
      status: 'Completed',
    };

    // Decrement stock for returned items
    req.items.forEach((itemLine) => {
      const item = this.items.find((i) => i.id === itemLine.itemId);
      if (item && !item.isService) {
        item.currentStock = Math.max(0, item.currentStock - itemLine.quantity);
        this.recordStockMovement({
          date: returnRecord.date,
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          type: 'Purchase Return',
          quantity: itemLine.quantity,
          unit: itemLine.unit,
          unitCost: itemLine.rate,
          totalValue: itemLine.total,
          referenceType: 'PurchaseReturn',
          referenceId: returnRecord.id,
          referenceNumber: returnRecord.returnNumber,
          warehouse: item.warehouse,
          balanceAfter: item.currentStock,
          notes: `Return to ${returnRecord.vendorName}`,
          createdBy: approvedBy,
        });
      }
    });
    this.persist(STORAGE_KEYS.ITEMS, this.items);

    // Generate Debit Note
    const debitNote = this.saveDebitNote({
      date: returnRecord.date,
      vendorId: req.vendorId,
      vendorName: req.vendorName,
      originalInvoiceId: req.originalInvoiceId,
      originalInvoiceNumber: req.originalInvoiceNumber,
      returnId: returnRecord.id,
      reason: 'Purchase Return',
      items: req.items,
      subtotal,
      taxTotal,
      grandTotal,
    });

    returnRecord.debitNoteId = debitNote.id;
    returnRecord.debitNoteNumber = debitNote.noteNumber;

    this.purchaseReturns.unshift(returnRecord);
    this.persist(STORAGE_KEYS.PURCHASE_RETURNS, this.purchaseReturns);

    this.logAudit({
      module: 'Purchase Return',
      action: 'Approve',
      entityId: returnRecord.id,
      entityNumber: returnRecord.returnNumber,
      details: `Approved return request ${req.returnRequestNumber}, generated Debit Note ${debitNote.noteNumber} for ₹${grandTotal}`,
    });

    return { returnRecord, debitNote };
  }

  public getPurchaseReturns(): PurchaseReturnRecord[] {
    return [...this.purchaseReturns];
  }

  // Debit Notes
  public getDebitNotes(): DebitNoteRecord[] {
    return [...this.debitNotes];
  }

  public saveDebitNote(note: Omit<DebitNoteRecord, 'id' | 'noteNumber' | 'status' | 'approvalStatus'> & {
    status?: DebitNoteRecord['status'];
    approvalStatus?: DebitNoteRecord['approvalStatus'];
  }): DebitNoteRecord {
    const nextNum = this.debitNotes.length + 1;
    const noteNumber = `DN-2026-${String(nextNum).padStart(4, '0')}`;
    const newNote: DebitNoteRecord = {
      ...note,
      id: `dn-${Date.now()}`,
      noteNumber,
      status: 'Approved',
      approvalStatus: 'Approved',
    };

    // Reduce vendor payable
    const vendor = this.parties.find((p) => p.id === note.vendorId);
    if (vendor) {
      vendor.currentBalance += note.grandTotal;
      this.persist(STORAGE_KEYS.PARTIES, this.parties);
    }

    // Reverse Inventory & post Journal Entry
    // Dr. Accounts Payable (2000)
    // Cr. Purchase Return / Inventory (5100 or 1300)
    // Cr. Input GST (1400)
    const netReturnVal = note.subtotal;
    accountingEngine.postJournalEntry({
      referenceType: 'DebitNote',
      referenceId: newNote.id,
      referenceNumber: newNote.noteNumber,
      date: note.date,
      narration: `Debit note ${newNote.noteNumber} issued to ${note.vendorName} against ${note.originalInvoiceNumber}`,
      lines: [
        {
          accountCode: '2000',
          accountName: 'Accounts Payable (Control)',
          partyId: note.vendorId,
          partyName: note.vendorName,
          debit: note.grandTotal,
          credit: 0,
        },
        {
          accountCode: '5100',
          accountName: 'Purchase Returns & Allowances (Contra)',
          debit: 0,
          credit: netReturnVal,
        },
        {
          accountCode: '1400',
          accountName: 'Input GST (ITC Credit)',
          debit: 0,
          credit: note.taxTotal,
        },
      ],
    });

    this.debitNotes.unshift(newNote);
    this.persist(STORAGE_KEYS.DEBIT_NOTES, this.debitNotes);
    return newNote;
  }

  // ==========================================
  // SALES WORKFLOW (Section 19, 20, 21 & 99)
  // ==========================================

  // --- Sales Requests ---
  public getSalesRequests(): SalesRequest[] {
    return [...this.salesRequests];
  }

  public saveSalesRequest(req: Partial<SalesRequest> & {
    customerId: string;
    customerName: string;
    requestedBy: string;
    items: SalesRequest['items'];
  }): SalesRequest {
    const nextNum = this.salesRequests.length + 1;
    const requestNumber = req.requestNumber || `SR-2026-${String(nextNum).padStart(4, '0')}`;
    const id = req.id || `sr-${Date.now()}`;
    const estimatedTotal = req.items.reduce((s, i) => s + (i.total || (i.rate * i.quantity - (i.rate * i.quantity * (i.discount || 0)) / 100)), 0);

    const newRequest: SalesRequest = {
      id,
      requestNumber,
      date: req.date || new Date().toISOString().split('T')[0],
      customerId: req.customerId,
      customerName: req.customerName,
      requestedBy: req.requestedBy,
      department: req.department || 'EdTech Sales',
      branch: req.branch || 'Kochi Campus',
      project: req.project,
      requiredDate: req.requiredDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      priority: req.priority || 'Medium',
      items: req.items,
      estimatedTotal,
      remarks: req.remarks,
      status: req.status || 'Draft',
    };

    this.salesRequests.unshift(newRequest);
    this.persist(STORAGE_KEYS.SALES_REQUESTS, this.salesRequests);

    this.logAudit({
      module: 'Sales Request',
      action: 'Create',
      entityId: newRequest.id,
      entityNumber: newRequest.requestNumber,
      details: `Created Sales Request for ₹${estimatedTotal} for customer ${newRequest.customerName}`,
    });

    return newRequest;
  }

  public updateSalesRequestStatus(id: string, status: SalesRequest['status']): void {
    const req = this.salesRequests.find((r) => r.id === id);
    if (req) {
      req.status = status;
      this.persist(STORAGE_KEYS.SALES_REQUESTS, this.salesRequests);
      this.logAudit({
        module: 'Sales Request',
        action: 'Edit',
        entityId: req.id,
        entityNumber: req.requestNumber,
        details: `Updated Sales Request status to ${status}`,
      });
    }
  }

  public convertSalesRequestToQuotation(requestId: string): SalesQuotation {
    const sr = this.salesRequests.find((r) => r.id === requestId);
    if (!sr) throw new Error('Sales Request not found.');

    const quotation = this.saveSalesQuotation({
      customerId: sr.customerId,
      customerName: sr.customerName,
      requestRefId: sr.id,
      requestNumber: sr.requestNumber,
      items: sr.items,
      paymentTerms: 'Net 30',
      notes: `Generated from Sales Request ${sr.requestNumber}`,
    });

    this.updateSalesRequestStatus(sr.id, 'Converted');
    return quotation;
  }

  public convertSalesRequestToOrder(requestId: string): SalesOrder {
    const sr = this.salesRequests.find((r) => r.id === requestId);
    if (!sr) throw new Error('Sales Request not found.');

    const order = this.saveSalesOrder({
      customerId: sr.customerId,
      customerName: sr.customerName,
      items: sr.items,
      paymentTerms: 'Net 30',
      remarks: `Directly generated from Sales Request ${sr.requestNumber}`,
    });

    this.updateSalesRequestStatus(sr.id, 'Converted');
    return order;
  }

  // --- Sales Quotations ---
  public getSalesQuotations(): SalesQuotation[] {
    return [...this.salesQuotations];
  }

  public saveSalesQuotation(quote: Partial<SalesQuotation> & {
    customerId: string;
    customerName: string;
    items: SalesQuotation['items'];
  }): SalesQuotation {
    const nextNum = this.salesQuotations.length + 1;
    const quotationNumber = quote.quotationNumber || `SQ-2026-${String(nextNum).padStart(4, '0')}`;
    const id = quote.id || `sq-${Date.now()}`;

    const subtotal = quote.items.reduce((s, i) => s + i.rate * i.quantity, 0);
    const discountTotal = quote.items.reduce((s, i) => s + (i.rate * i.quantity * (i.discount || 0)) / 100, 0);
    const taxTotal = quote.items.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
    const otherCharges = quote.otherCharges || 0;
    const grandTotal = Math.round((subtotal - discountTotal + taxTotal + otherCharges) * 100) / 100;

    const newQuotation: SalesQuotation = {
      id,
      quotationNumber,
      date: quote.date || new Date().toISOString().split('T')[0],
      customerId: quote.customerId,
      customerName: quote.customerName,
      requestRefId: quote.requestRefId,
      requestNumber: quote.requestNumber,
      validUntil: quote.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTerms: quote.paymentTerms || 'Net 30',
      deliveryTerms: quote.deliveryTerms || 'Door Delivery at customer premises',
      items: quote.items,
      subtotal,
      discountTotal,
      taxTotal,
      otherCharges,
      grandTotal,
      notes: quote.notes,
      status: quote.status || 'Draft',
    };

    this.salesQuotations.unshift(newQuotation);
    this.persist(STORAGE_KEYS.SALES_QUOTATIONS, this.salesQuotations);

    this.logAudit({
      module: 'Sales Quotation',
      action: 'Create',
      entityId: newQuotation.id,
      entityNumber: newQuotation.quotationNumber,
      details: `Generated Sales Quotation for ₹${grandTotal} for ${newQuotation.customerName}`,
    });

    return newQuotation;
  }

  public updateSalesQuotationStatus(id: string, status: SalesQuotation['status']): void {
    const q = this.salesQuotations.find((item) => item.id === id);
    if (q) {
      q.status = status;
      this.persist(STORAGE_KEYS.SALES_QUOTATIONS, this.salesQuotations);
    }
  }

  public convertQuotationToSalesOrder(quotationId: string): SalesOrder {
    const quote = this.salesQuotations.find((q) => q.id === quotationId);
    if (!quote) throw new Error('Quotation not found.');

    const order = this.saveSalesOrder({
      customerId: quote.customerId,
      customerName: quote.customerName,
      quotationRefId: quote.id,
      quotationNumber: quote.quotationNumber,
      paymentTerms: quote.paymentTerms,
      items: quote.items,
      remarks: `Converted from Quotation ${quote.quotationNumber}`,
    });

    this.updateSalesQuotationStatus(quote.id, 'Accepted');
    return order;
  }

  // --- Sales Orders ---
  public getSalesOrders(): SalesOrder[] {
    return [...this.salesOrders];
  }

  public saveSalesOrder(so: Partial<SalesOrder> & {
    customerId: string;
    customerName: string;
    items: SalesOrder['items'];
  }): SalesOrder {
    const nextNum = this.salesOrders.length + 1;
    const orderNumber = so.orderNumber || `SO-2026-${String(nextNum).padStart(4, '0')}`;
    const id = so.id || `so-${Date.now()}`;

    const subtotal = so.items.reduce((s, i) => s + i.rate * i.quantity, 0);
    const discountTotal = so.items.reduce((s, i) => s + (i.rate * i.quantity * (i.discount || 0)) / 100, 0);
    const taxTotal = so.items.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
    const otherCharges = so.otherCharges || 0;
    const grandTotal = Math.round((subtotal - discountTotal + taxTotal + otherCharges) * 100) / 100;

    // Credit limit check per Section 21
    const creditCheck = this.checkCreditLimit(so.customerId, grandTotal);
    if (!creditCheck.allowed) {
      throw new Error(creditCheck.message || 'Credit limit check failed.');
    }

    const savedOrder: SalesOrder = {
      id,
      orderNumber,
      date: so.date || new Date().toISOString().split('T')[0],
      customerId: so.customerId,
      customerName: so.customerName,
      quotationRefId: so.quotationRefId,
      quotationNumber: so.quotationNumber,
      costCenter: so.costCenter || 'CC-REV-EDUTECH',
      deliveryDate: so.deliveryDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      deliveryAddress: so.deliveryAddress,
      paymentTerms: so.paymentTerms || 'Net 30',
      remarks: so.remarks,
      items: so.items,
      subtotal,
      discountTotal,
      taxTotal,
      otherCharges,
      grandTotal,
      invoicedAmount: 0,
      status: so.status || 'Confirmed',
    };

    this.salesOrders.unshift(savedOrder);
    this.persist(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);

    this.logAudit({
      module: 'Sales Order',
      action: 'Create',
      entityId: savedOrder.id,
      entityNumber: savedOrder.orderNumber,
      details: `Created Sales Order for ₹${grandTotal} with customer ${savedOrder.customerName}`,
    });

    return savedOrder;
  }

  public updateSalesOrderStatus(id: string, status: SalesOrder['status']): void {
    const order = this.salesOrders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      this.persist(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);
    }
  }

  public convertSalesOrderToInvoice(orderId: string): SalesInvoiceRecord {
    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Sales Order not found.');

    const invoice = this.postSalesInvoice({
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      costCenter: order.costCenter,
      paymentTerms: order.paymentTerms,
      items: order.items,
    });

    order.invoicedAmount += invoice.grandTotal;
    if (order.invoicedAmount >= order.grandTotal) {
      order.status = 'Fully Delivered';
    } else {
      order.status = 'Partially Delivered';
    }
    this.persist(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);

    return invoice;
  }

  // --- Sales Invoices ---
  public getSalesInvoices(): SalesInvoiceRecord[] {
    return [...this.salesInvoices];
  }

  public postSalesInvoice(invoice: Partial<SalesInvoiceRecord> & {
    customerId: string;
    customerName: string;
    items: SalesInvoiceRecord['items'];
  }): SalesInvoiceRecord {
    const nextNum = this.salesInvoices.length + 1;
    const invoiceNumber = invoice.invoiceNumber || `SI-2026-${String(nextNum).padStart(4, '0')}`;
    const id = invoice.id || `si-${Date.now()}`;

    const subtotal = invoice.items.reduce((s, i) => s + i.rate * i.quantity, 0);
    const discountTotal = invoice.items.reduce((s, i) => s + (i.rate * i.quantity * (i.discount || 0)) / 100, 0);
    const cgstTotal = invoice.items.reduce((s, i) => s + i.cgst, 0);
    const sgstTotal = invoice.items.reduce((s, i) => s + i.sgst, 0);
    const igstTotal = invoice.items.reduce((s, i) => s + i.igst, 0);
    const totalTax = cgstTotal + sgstTotal + igstTotal;
    const grandTotal = Math.round((subtotal - discountTotal + totalTax) * 100) / 100;

    // Credit limit check per Section 21
    const customer = this.parties.find((p) => p.id === invoice.customerId);
    // Credit limit check
    if (customer) {
      const creditCheck = this.checkCreditLimit(customer.id, grandTotal);
      if (!creditCheck.allowed) {
        throw new Error(creditCheck.message || 'Credit limit check failed.');
      }
    }

    const savedInvoice: SalesInvoiceRecord = {
      id,
      invoiceNumber,
      date: invoice.date || new Date().toISOString().split('T')[0],
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      orderId: invoice.orderId,
      orderNumber: invoice.orderNumber,
      deliveryId: invoice.deliveryId,
      deliveryNumber: invoice.deliveryNumber,
      quotationRefId: invoice.quotationRefId,
      quotationNumber: invoice.quotationNumber,
      requestRefId: invoice.requestRefId,
      requestNumber: invoice.requestNumber,
      costCenter: invoice.costCenter || 'CC-REV-EDUTECH',
      items: invoice.items,
      subtotal,
      discountTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff: 0,
      grandTotal,
      paidAmount: 0,
      balanceAmount: grandTotal,
      dueDate: invoice.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      paymentTerms: invoice.paymentTerms || 'Net 30',
      eInvoiceIrn: `IRN-${Date.now().toString().slice(-10)}-KER`,
      eWayBillNo: grandTotal > 50000 ? `2418${Date.now().toString().slice(-8)}` : undefined,
      status: 'Pending',
      approvalStatus: 'Approved',
      approvedBy: 'Sales Director',
    };

    // 1. Update Customer ledger balance (receivable increases)
    if (customer) {
      customer.currentBalance += grandTotal;
      this.persist(STORAGE_KEYS.PARTIES, this.parties);
    }

    // 2. Decrement inventory ONLY IF NOT ALREADY DISPATCHED VIA DELIVERY
    let totalCogs = 0;
    if (!savedInvoice.deliveryId) {
      invoice.items.forEach((itemLine) => {
        const item = this.items.find((i) => i.id === itemLine.itemId);
        if (item && !item.isService) {
          item.currentStock -= itemLine.quantity;
          const lineCost = item.purchasePrice * itemLine.quantity;
          totalCogs += lineCost;

          this.recordStockMovement({
            date: savedInvoice.date,
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            type: 'Sales Out',
            quantity: itemLine.quantity,
            unit: itemLine.unit,
            unitCost: item.purchasePrice,
            totalValue: lineCost,
            referenceType: 'SalesInvoice',
            referenceId: savedInvoice.id,
            referenceNumber: savedInvoice.invoiceNumber,
            warehouse: item.warehouse,
            balanceAfter: item.currentStock,
            notes: `Dispatched to ${savedInvoice.customerName}`,
            createdBy: 'Warehouse Shipping',
          });
        }
      });
      this.persist(STORAGE_KEYS.ITEMS, this.items);
    } else {
      const dlv = this.salesDeliveries.find((d) => d.id === savedInvoice.deliveryId);
      if (dlv) {
        dlv.status = 'Invoiced';
        dlv.invoiceId = savedInvoice.id;
        dlv.invoiceNumber = savedInvoice.invoiceNumber;
        this.persist(STORAGE_KEYS.SALES_DELIVERIES, this.salesDeliveries);
      }
    }

    // 3. Double-Entry Accounting Journal Entry per Section 99.2
    // Dr. Accounts Receivable (1200) = Grand Total
    // Cr. Sales Revenue (4000) = Net Sales (Subtotal - Discount)
    // Cr. Output GST (2100) = Total Tax
    // And Perpetual Inventory Entry:
    // Dr. COGS (5000) = totalCogs
    // Cr. Inventory Asset (1300) = totalCogs
    const netRevenue = subtotal - discountTotal;
    const lines = [
      {
        accountCode: '1200',
        accountName: 'Accounts Receivable (Control)',
        partyId: savedInvoice.customerId,
        partyName: savedInvoice.customerName,
        debit: grandTotal,
        credit: 0,
      },
      {
        accountCode: '4000',
        accountName: 'Sales & Service Revenue',
        debit: 0,
        credit: netRevenue,
      },
      {
        accountCode: '2100',
        accountName: 'Output GST (Tax Liability)',
        debit: 0,
        credit: totalTax,
      },
    ];

    if (totalCogs > 0) {
      lines.push(
        {
          accountCode: '5000',
          accountName: 'Cost of Goods Sold (COGS)',
          debit: totalCogs,
          credit: 0,
          partyId: undefined,
          partyName: undefined,
        },
        {
          accountCode: '1300',
          accountName: 'Inventory Asset',
          debit: 0,
          credit: totalCogs,
          partyId: undefined,
          partyName: undefined,
        }
      );
    }

    accountingEngine.postJournalEntry({
      referenceType: 'SalesInvoice',
      referenceId: savedInvoice.id,
      referenceNumber: savedInvoice.invoiceNumber,
      date: savedInvoice.date,
      narration: `Sales Invoice ${savedInvoice.invoiceNumber} billed to ${savedInvoice.customerName}`,
      lines,
      createdBy: 'Billing Engine',
    });

    this.salesInvoices.unshift(savedInvoice);
    this.persist(STORAGE_KEYS.SALES_INVOICES, this.salesInvoices);

    this.logAudit({
      module: 'Sales Invoice',
      action: 'Post',
      entityId: savedInvoice.id,
      entityNumber: savedInvoice.invoiceNumber,
      details: `Generated tax invoice for ₹${grandTotal} to ${savedInvoice.customerName} with IRN`,
    });

    return savedInvoice;
  }

  // --- Sales Delivery (SAP B1 Workflow) ---
  public getSalesDeliveries(): SalesDelivery[] {
    return [...this.salesDeliveries];
  }

  public saveSalesDelivery(delivery: Partial<SalesDelivery> & {
    salesOrderId: string;
    items: SalesDelivery['items'];
  }): SalesDelivery {
    const nextNum = this.salesDeliveries.length + 1;
    const deliveryNumber = delivery.deliveryNumber || `DLV-2026-${String(nextNum).padStart(4, '0')}`;
    const id = delivery.id || `dlv-${Date.now()}`;
    const totalDeliveredQty = delivery.items.reduce((s, i) => s + (i.deliveredQty !== undefined ? i.deliveredQty : i.quantity), 0);
    const totalAmount = delivery.items.reduce((s, i) => s + (i.total || (i.rate * i.quantity)), 0);

    const newDelivery: SalesDelivery = {
      id,
      deliveryNumber,
      date: delivery.date || new Date().toISOString().split('T')[0],
      salesOrderId: delivery.salesOrderId,
      salesOrderNumber: delivery.salesOrderNumber || '',
      customerId: delivery.customerId || '',
      customerName: delivery.customerName || '',
      shippingAddress: delivery.shippingAddress || 'Head Office Delivery Bay',
      warehouse: delivery.warehouse || 'Central Finished Goods Warehouse',
      dispatchVehicleNo: delivery.dispatchVehicleNo || 'KL-07-CD-4192',
      trackingNumber: delivery.trackingNumber || `TRACK-${Math.floor(1000000 + Math.random() * 9000000)}`,
      items: delivery.items.map((it) => ({
        ...it,
        orderedQty: it.orderedQty !== undefined ? it.orderedQty : it.quantity,
        deliveredQty: it.deliveredQty !== undefined ? it.deliveredQty : it.quantity,
      })),
      totalDeliveredQty,
      totalAmount,
      dispatchedBy: delivery.dispatchedBy || 'Suresh Menon (Dispatch Supervisor)',
      remarks: delivery.remarks || '',
      status: 'Dispatched',
    };

    // Decrement physical inventory stock & log StockMovement ('Sales Out')
    newDelivery.items.forEach((itemLine) => {
      const item = this.items.find((i) => i.id === itemLine.itemId);
      if (item && !item.isService) {
        const qtyToReduce = itemLine.deliveredQty !== undefined ? itemLine.deliveredQty : itemLine.quantity;
        item.currentStock -= qtyToReduce;
        const lineCost = item.purchasePrice * qtyToReduce;

        this.recordStockMovement({
          date: newDelivery.date,
          itemId: item.id,
          itemCode: item.code,
          itemName: item.name,
          type: 'Sales Out',
          quantity: qtyToReduce,
          unit: itemLine.unit,
          unitCost: item.purchasePrice,
          totalValue: lineCost,
          referenceType: 'SalesDelivery' as any,
          referenceId: newDelivery.id,
          referenceNumber: newDelivery.deliveryNumber,
          warehouse: newDelivery.warehouse,
          balanceAfter: item.currentStock,
          notes: `Dispatched to ${newDelivery.customerName} against SO ${newDelivery.salesOrderNumber}`,
          createdBy: newDelivery.dispatchedBy,
        });
      }
    });
    this.persist(STORAGE_KEYS.ITEMS, this.items);

    // Update Sales Order linkage and status
    const order = this.salesOrders.find((o) => o.id === newDelivery.salesOrderId);
    if (order) {
      order.deliveryId = newDelivery.id;
      order.deliveryNumber = newDelivery.deliveryNumber;
      order.status = 'Fully Delivered';
      this.persist(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);
    }

    this.salesDeliveries.unshift(newDelivery);
    this.persist(STORAGE_KEYS.SALES_DELIVERIES, this.salesDeliveries);

    this.logAudit({
      module: 'Sales Delivery',
      action: 'Create',
      entityId: newDelivery.id,
      entityNumber: newDelivery.deliveryNumber,
      details: `Dispatched delivery note for ${totalDeliveredQty} units against SO ${newDelivery.salesOrderNumber}`,
    });

    return newDelivery;
  }

  public convertSalesOrderToDelivery(orderId: string, overrides?: Partial<SalesDelivery>): SalesDelivery {
    const order = this.salesOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('Sales Order not found.');

    return this.saveSalesDelivery({
      salesOrderId: order.id,
      salesOrderNumber: order.orderNumber,
      customerId: order.customerId,
      customerName: order.customerName,
      shippingAddress: overrides?.shippingAddress || order.deliveryAddress || 'Client Delivery Location',
      warehouse: overrides?.warehouse || 'Central Finished Goods Warehouse',
      dispatchVehicleNo: overrides?.dispatchVehicleNo || 'KL-07-CD-4192',
      trackingNumber: overrides?.trackingNumber || `TRACK-${Date.now().toString().slice(-6)}`,
      dispatchedBy: overrides?.dispatchedBy || 'Suresh Menon (Dispatch Supervisor)',
      remarks: overrides?.remarks || `Goods dispatched against Sales Order ${order.orderNumber}`,
      items: order.items.map((it) => ({
        ...it,
        orderedQty: it.quantity,
        deliveredQty: it.quantity,
      })),
    });
  }

  public convertDeliveryToSalesInvoice(deliveryId: string): SalesInvoiceRecord {
    const dlv = this.salesDeliveries.find((d) => d.id === deliveryId);
    if (!dlv) throw new Error('Sales Delivery record not found.');

    const order = this.salesOrders.find((o) => o.id === dlv.salesOrderId);

    const invoice = this.postSalesInvoice({
      orderId: dlv.salesOrderId,
      orderNumber: dlv.salesOrderNumber,
      deliveryId: dlv.id,
      deliveryNumber: dlv.deliveryNumber,
      quotationRefId: order?.quotationRefId,
      quotationNumber: order?.quotationNumber,
      customerId: dlv.customerId,
      customerName: dlv.customerName,
      costCenter: order?.costCenter || 'CC-REV-EDUTECH',
      paymentTerms: order?.paymentTerms || 'Net 30',
      items: dlv.items.map((i) => ({
        itemId: i.itemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        hsnCode: i.hsnCode,
        quantity: i.deliveredQty !== undefined ? i.deliveredQty : i.quantity,
        unit: i.unit,
        rate: i.rate,
        discount: i.discount,
        taxPercent: i.taxPercent,
        cgst: i.cgst,
        sgst: i.sgst,
        igst: i.igst,
        total: i.total,
      })),
    });

    dlv.status = 'Invoiced';
    dlv.invoiceId = invoice.id;
    dlv.invoiceNumber = invoice.invoiceNumber;
    this.persist(STORAGE_KEYS.SALES_DELIVERIES, this.salesDeliveries);

    if (order) {
      order.invoiceId = invoice.id;
      order.invoiceNumber = invoice.invoiceNumber;
      order.status = 'Closed';
      this.persist(STORAGE_KEYS.SALES_ORDERS, this.salesOrders);
    }

    return invoice;
  }

  public convertSalesDeliveryToInvoice(deliveryId: string): SalesInvoiceRecord {
    return this.convertDeliveryToSalesInvoice(deliveryId);
  }

  /**
   * Returns complete SAP B1-style chain of Related Documents for any Sales document
   */
  public getRelatedSalesDocuments(docType: 'Request' | 'Quotation' | 'Order' | 'Delivery' | 'Invoice', docId: string): Array<{
    stage: 'Request' | 'Quotation' | 'Order' | 'Delivery' | 'Invoice';
    id: string;
    number: string;
    date: string;
    partyName: string;
    amount: number;
    status: string;
    isCurrent: boolean;
  }> {
    const results: Array<{
      stage: 'Request' | 'Quotation' | 'Order' | 'Delivery' | 'Invoice';
      id: string;
      number: string;
      date: string;
      partyName: string;
      amount: number;
      status: string;
      isCurrent: boolean;
    }> = [];

    let srId = '';
    let sqId = '';
    let soId = '';
    let dlvId = '';
    let siId = '';

    if (docType === 'Request') {
      srId = docId;
      const sr = this.salesRequests.find((r) => r.id === docId);
      if (sr?.quotationId) sqId = sr.quotationId;
    } else if (docType === 'Quotation') {
      sqId = docId;
      const sq = this.salesQuotations.find((q) => q.id === docId);
      if (sq?.requestRefId) srId = sq.requestRefId;
      if (sq?.salesOrderId) soId = sq.salesOrderId;
    } else if (docType === 'Order') {
      soId = docId;
      const so = this.salesOrders.find((o) => o.id === docId);
      if (so?.quotationRefId) sqId = so.quotationRefId;
      if (so?.deliveryId) dlvId = so.deliveryId;
      if (so?.invoiceId) siId = so.invoiceId;
    } else if (docType === 'Delivery') {
      dlvId = docId;
      const dlv = this.salesDeliveries.find((d) => d.id === docId);
      if (dlv?.salesOrderId) soId = dlv.salesOrderId;
      if (dlv?.invoiceId) siId = dlv.invoiceId;
    } else if (docType === 'Invoice') {
      siId = docId;
      const si = this.salesInvoices.find((i) => i.id === docId);
      if (si?.orderId) soId = si.orderId;
      if (si?.deliveryId) dlvId = si.deliveryId;
      if (si?.quotationRefId) sqId = si.quotationRefId;
    }

    // Traverse linkages
    if (soId && !dlvId) {
      const dlv = this.salesDeliveries.find((d) => d.salesOrderId === soId);
      if (dlv) dlvId = dlv.id;
    }
    if (soId && !siId) {
      const si = this.salesInvoices.find((i) => i.orderId === soId);
      if (si) siId = si.id;
    }
    if (dlvId && !siId) {
      const si = this.salesInvoices.find((i) => i.deliveryId === dlvId);
      if (si) siId = si.id;
    }
    if (soId && !sqId) {
      const sq = this.salesQuotations.find((q) => q.salesOrderId === soId);
      if (sq) sqId = sq.id;
    }
    if (sqId && !srId) {
      const sq = this.salesQuotations.find((q) => q.id === sqId);
      if (sq?.requestRefId) srId = sq.requestRefId;
    }

    // 1. Request
    if (srId) {
      const sr = this.salesRequests.find((r) => r.id === srId);
      if (sr) {
        results.push({
          stage: 'Request',
          id: sr.id,
          number: sr.requestNumber,
          date: sr.requiredDate || sr.date,
          partyName: sr.customerName || 'Standard Client',
          amount: sr.estimatedTotal,
          status: sr.status,
          isCurrent: docType === 'Request' && docId === sr.id,
        });
      }
    }

    // 2. Quotation
    if (sqId) {
      const sq = this.salesQuotations.find((q) => q.id === sqId);
      if (sq) {
        results.push({
          stage: 'Quotation',
          id: sq.id,
          number: sq.quotationNumber,
          date: sq.date,
          partyName: sq.customerName,
          amount: sq.grandTotal,
          status: sq.status,
          isCurrent: docType === 'Quotation' && docId === sq.id,
        });
      }
    }

    // 3. Order
    if (soId) {
      const so = this.salesOrders.find((o) => o.id === soId);
      if (so) {
        results.push({
          stage: 'Order',
          id: so.id,
          number: so.orderNumber,
          date: so.date,
          partyName: so.customerName,
          amount: so.grandTotal,
          status: so.status,
          isCurrent: docType === 'Order' && docId === so.id,
        });
      }
    }

    // 4. Delivery
    if (dlvId) {
      const dlv = this.salesDeliveries.find((d) => d.id === dlvId);
      if (dlv) {
        results.push({
          stage: 'Delivery',
          id: dlv.id,
          number: dlv.deliveryNumber,
          date: dlv.date,
          partyName: dlv.customerName,
          amount: dlv.totalAmount,
          status: dlv.status,
          isCurrent: docType === 'Delivery' && docId === dlv.id,
        });
      }
    }

    // 5. Invoice
    if (siId) {
      const si = this.salesInvoices.find((i) => i.id === siId);
      if (si) {
        results.push({
          stage: 'Invoice',
          id: si.id,
          number: si.invoiceNumber,
          date: si.date,
          partyName: si.customerName,
          amount: si.grandTotal,
          status: si.status,
          isCurrent: docType === 'Invoice' && docId === si.id,
        });
      }
    }

    return results;
  }

  // --- Sales Return Requests & Returns ---
  public getSalesReturnRequests(): SalesReturnRequest[] {
    return [...this.salesReturnRequests];
  }

  public saveSalesReturnRequest(req: Partial<SalesReturnRequest> & {
    customerId: string;
    customerName: string;
    originalInvoiceId: string;
    items: SalesReturnRequest['items'];
    totalAmount: number;
  }): SalesReturnRequest {
    const nextNum = this.salesReturnRequests.length + 1;
    const returnRequestNumber = req.returnRequestNumber || `SRR-2026-${String(nextNum).padStart(4, '0')}`;
    const id = req.id || `srr-${Date.now()}`;

    const newReq: SalesReturnRequest = {
      id,
      returnRequestNumber,
      date: req.date || new Date().toISOString().split('T')[0],
      customerId: req.customerId,
      customerName: req.customerName,
      originalInvoiceId: req.originalInvoiceId,
      originalInvoiceNumber: req.originalInvoiceNumber || 'SI-2026-0082',
      items: req.items,
      totalAmount: req.totalAmount,
      reason: req.reason || 'Defective Goods',
      condition: req.condition || 'Inspection Needed',
      remarks: req.remarks,
      status: req.status || 'Pending Approval',
    };

    this.salesReturnRequests.unshift(newReq);
    this.persist(STORAGE_KEYS.SALES_RETURN_REQUESTS, this.salesReturnRequests);

    this.logAudit({
      module: 'Sales Return Request',
      action: 'Create',
      entityId: newReq.id,
      entityNumber: newReq.returnRequestNumber,
      details: `Customer return request raised for ₹${newReq.totalAmount} against invoice ${newReq.originalInvoiceNumber}`,
    });

    return newReq;
  }

  public approveSalesReturnRequest(id: string, approvedBy = 'Quality & Sales Manager'): {
    returnRecord: SalesReturnRecord;
    creditNote: CreditNoteRecord;
  } {
    const req = this.salesReturnRequests.find((r) => r.id === id);
    if (!req) throw new Error('Sales Return Request not found.');

    req.status = 'Approved';
    this.persist(STORAGE_KEYS.SALES_RETURN_REQUESTS, this.salesReturnRequests);

    const subtotal = req.items.reduce((s, i) => s + (i.rate * i.quantity - (i.rate * i.quantity * (i.discount || 0)) / 100), 0);
    const taxTotal = req.items.reduce((s, i) => s + (i.cgst + i.sgst + i.igst), 0);
    const grandTotal = req.totalAmount || Math.round((subtotal + taxTotal) * 100) / 100;

    const returnNext = this.salesReturns.length + 1;
    const returnNumber = `SR-RET-2026-${String(returnNext).padStart(4, '0')}`;
    const returnRecord: SalesReturnRecord = {
      id: `sret-${Date.now()}`,
      returnNumber,
      date: new Date().toISOString().split('T')[0],
      customerId: req.customerId,
      customerName: req.customerName,
      originalInvoiceId: req.originalInvoiceId,
      originalInvoiceNumber: req.originalInvoiceNumber,
      returnRequestId: req.id,
      items: req.items,
      subtotal,
      taxTotal,
      grandTotal,
      reason: req.remarks || req.reason,
      condition: req.condition,
      status: 'Completed',
    };

    // If restockable/good condition, put back into inventory
    if (req.condition === 'Resaleable') {
      req.items.forEach((itemLine) => {
        const item = this.items.find((i) => i.id === itemLine.itemId);
        if (item && !item.isService) {
          item.currentStock += itemLine.quantity;
          this.recordStockMovement({
            date: returnRecord.date,
            itemId: item.id,
            itemCode: item.code,
            itemName: item.name,
            type: 'Sales Return',
            quantity: itemLine.quantity,
            unit: itemLine.unit,
            unitCost: item.purchasePrice,
            totalValue: itemLine.total,
            referenceType: 'SalesReturn',
            referenceId: returnRecord.id,
            referenceNumber: returnRecord.returnNumber,
            warehouse: item.warehouse,
            balanceAfter: item.currentStock,
            notes: `Restocked from customer return ${returnRecord.returnNumber}`,
            createdBy: approvedBy,
          });
        }
      });
      this.persist(STORAGE_KEYS.ITEMS, this.items);
    }

    // Generate Credit Note
    const creditNote = this.saveCreditNote({
      date: returnRecord.date,
      customerId: req.customerId,
      customerName: req.customerName,
      originalInvoiceId: req.originalInvoiceId,
      originalInvoiceNumber: req.originalInvoiceNumber,
      returnId: returnRecord.id,
      reason: 'Sales Return',
      items: req.items,
      subtotal,
      taxTotal,
      grandTotal,
    });

    returnRecord.creditNoteId = creditNote.id;
    returnRecord.creditNoteNumber = creditNote.noteNumber;

    this.salesReturns.unshift(returnRecord);
    this.persist(STORAGE_KEYS.SALES_RETURNS, this.salesReturns);

    this.logAudit({
      module: 'Sales Return',
      action: 'Approve',
      entityId: returnRecord.id,
      entityNumber: returnRecord.returnNumber,
      details: `Approved sales return request ${req.returnRequestNumber}, generated Credit Note ${creditNote.noteNumber} for ₹${grandTotal}`,
    });

    return { returnRecord, creditNote };
  }

  public getSalesReturns(): SalesReturnRecord[] {
    return [...this.salesReturns];
  }

  // Credit Notes
  public getCreditNotes(): CreditNoteRecord[] {
    return [...this.creditNotes];
  }

  public saveCreditNote(note: Omit<CreditNoteRecord, 'id' | 'noteNumber' | 'status' | 'approvalStatus'> & {
    status?: CreditNoteRecord['status'];
    approvalStatus?: CreditNoteRecord['approvalStatus'];
  }): CreditNoteRecord {
    const nextNum = this.creditNotes.length + 1;
    const noteNumber = `CN-2026-${String(nextNum).padStart(4, '0')}`;
    const newNote: CreditNoteRecord = {
      ...note,
      id: `cn-${Date.now()}`,
      noteNumber,
      status: 'Approved',
      approvalStatus: 'Approved',
    };

    // Reduce customer receivable
    const customer = this.parties.find((p) => p.id === note.customerId);
    if (customer) {
      customer.currentBalance -= note.grandTotal;
      this.persist(STORAGE_KEYS.PARTIES, this.parties);
    }

    // Dr. Sales Returns (4100)
    // Dr. Output GST (2100)
    // Cr. Accounts Receivable (1200)
    accountingEngine.postJournalEntry({
      referenceType: 'CreditNote',
      referenceId: newNote.id,
      referenceNumber: newNote.noteNumber,
      date: note.date,
      narration: `Credit note ${newNote.noteNumber} issued to ${note.customerName} against ${note.originalInvoiceNumber}`,
      lines: [
        {
          accountCode: '4100',
          accountName: 'Sales Returns & Allowances (Contra)',
          debit: note.subtotal,
          credit: 0,
        },
        {
          accountCode: '2100',
          accountName: 'Output GST (Tax Liability)',
          debit: note.taxTotal,
          credit: 0,
        },
        {
          accountCode: '1200',
          accountName: 'Accounts Receivable (Control)',
          partyId: note.customerId,
          partyName: note.customerName,
          debit: 0,
          credit: note.grandTotal,
        },
      ],
    });

    this.creditNotes.unshift(newNote);
    this.persist(STORAGE_KEYS.CREDIT_NOTES, this.creditNotes);
    return newNote;
  }

  // ==========================================
  // PAYMENTS, RECEIPTS & CHEQUES (Section 25, 26, 27 & 99)
  // ==========================================
  public getPayments(): PaymentTransactionRecord[] {
    return [...this.payments];
  }

  /**
   * Sequential approval chain rule based on payment outflow amount:
   * <= ₹25,000: Single tier ['FinanceManager']
   * > ₹25,000 to ₹1,00,000: 2 tiers ['DeptManager', 'FinanceManager']
   * > ₹1,00,000: 3 tiers ['DeptManager', 'FinanceManager', 'Management']
   */
  public getPaymentSequentialTiers(amount: number): ApprovalTier[] {
    if (amount <= 25000) {
      return ['FinanceManager'];
    } else if (amount <= 100000) {
      return ['DeptManager', 'FinanceManager'];
    } else {
      return ['DeptManager', 'FinanceManager', 'Management'];
    }
  }

  public getNextPaymentNumber(isAdvance = false): string {
    if (isAdvance) {
      const advCount = this.payments.filter((p) => p.isAdvance).length + this.receipts.filter((r) => r.isAdvance).length + 1;
      return `ADV-2026-${String(advCount).padStart(4, '0')}`;
    }
    const payCount = this.payments.filter((p) => !p.isAdvance).length + 1;
    return `PAY-2026-${String(payCount).padStart(4, '0')}`;
  }

  public getNextReceiptNumber(isAdvance = false): string {
    if (isAdvance) {
      const advCount = this.payments.filter((p) => p.isAdvance).length + this.receipts.filter((r) => r.isAdvance).length + 1;
      return `ADV-2026-${String(advCount).padStart(4, '0')}`;
    }
    const recCount = this.receipts.filter((r) => !r.isAdvance).length + 1;
    return `REC-2026-${String(recCount).padStart(4, '0')}`;
  }

  /**
   * Posts Vendor Payment with TDS deduction, multiple invoice allocations,
   * sequential approval chain enforcement, and journal entry:
   * Dr. Accounts Payable (2000) or Advance to Vendors (2350) = Gross Amount
   * Cr. TDS Payable (2150) = TDS Withheld (if applicable)
   * Cr. Bank / Cash (1100 or 1000) = Net Paid
   */
  public postPayment(payment: Partial<PaymentTransactionRecord> & {
    partyId: string;
    partyName: string;
    amount: number;
    paymentMethod: PaymentTransactionRecord['paymentMethod'];
    accountId: string;
    accountName: string;
    referenceNumber: string;
    skipApproval?: boolean;
    requestedBy?: string;
  }): PaymentTransactionRecord {
    const isAdvance = payment.isAdvance || false;
    const paymentNumber = payment.paymentNumber || this.getNextPaymentNumber(isAdvance);
    const id = payment.id || `pay-${Date.now()}`;

    // Live Budget Control Check for Expense Payments
    const budgetCheck = budgetEngine.checkBudgetControl({
      module: 'Expense',
      department: 'Operations',
      requestedAmount: payment.amount,
    });
    if (!budgetCheck.allowed) {
      throw new Error(`Budget Control Block: ${budgetCheck.message}`);
    }

    // TDS Calculation
    const tdsRate = payment.tdsRate !== undefined ? payment.tdsRate : (payment.tdsSection ? 2 : 0);
    const tdsAmount = payment.tdsAmount !== undefined
      ? payment.tdsAmount
      : (tdsRate > 0 ? Math.round((payment.amount * tdsRate) / 100) : 0);
    const netPaid = Math.round((payment.amount - tdsAmount) * 100) / 100;

    // Multi-invoice allocation calculations
    const allocations = payment.allocations || [];
    const allocatedAmount = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    const unallocatedAmount = Math.max(0, payment.amount - allocatedAmount);
    const advanceStatus = isAdvance
      ? (unallocatedAmount === 0 ? 'Fully Adjusted' : (allocatedAmount > 0 ? 'Partially Adjusted' : 'Unadjusted'))
      : undefined;

    // Sequential approval chain requirements
    let requiresApproval = !payment.skipApproval;
    const requiredTiers = this.getPaymentSequentialTiers(payment.amount);

    // Live Budget Validation for Direct Expense / Payment
    const expenseDept = payment.remarks?.includes('IT') ? 'IT & Tech' : 'Operations';
    const expenseVal = budgetValidationService.validateDirectExpense({
      department: expenseDept,
      amount: payment.amount,
      description: payment.remarks || `Vendor disbursement to ${payment.partyName}`,
      referenceNumber: paymentNumber,
    });

    if (expenseVal.status === 'BLOCKED' && !payment.skipApproval) {
      throw new Error(`[BUDGET VALIDATION BLOCKED] ${expenseVal.message}`);
    }

    if (expenseVal.status === 'NEEDS_APPROVAL') {
      requiresApproval = true;
    }

    const initialStatus = requiresApproval ? 'Pending Approval' : 'Completed';
    const initialApprovalStatus = requiresApproval ? 'Pending' : 'Approved';

    const savedPayment: PaymentTransactionRecord = {
      id,
      paymentNumber,
      date: payment.date || new Date().toISOString().split('T')[0],
      partyId: payment.partyId,
      partyName: payment.partyName,
      partyType: 'Vendor',
      amount: payment.amount,
      tdsSection: payment.tdsSection,
      tdsRate,
      tdsAmount,
      netPaid,
      paymentMethod: payment.paymentMethod,
      accountId: payment.accountId,
      accountName: payment.accountName,
      referenceNumber: payment.referenceNumber,
      chequeNumber: payment.chequeNumber,
      transactionId: payment.transactionId,
      attachmentName: payment.attachmentName,
      attachmentUrl: payment.attachmentUrl,
      allocations,
      allocatedAmount,
      unallocatedAmount,
      isAdvance,
      advanceStatus,
      status: initialStatus,
      approvalStatus: initialApprovalStatus,
      currentTier: requiresApproval ? requiredTiers[0] : undefined,
      requiredTiers,
      approvedTiers: [],
      requestedBy: payment.requestedBy || 'Finance Officer',
      requestedDate: payment.date || new Date().toISOString().split('T')[0],
      approvedBy: requiresApproval ? undefined : (payment.approvedBy || 'Finance Officer'),
      remarks: payment.remarks,
    };

    if (requiresApproval) {
      // Create Approval Request in sequential workflow
      const approvalReq: ApprovalRequestRecord = {
        id: `appr-pay-${Date.now()}`,
        entityType: 'Payment',
        entityId: savedPayment.id,
        entityNumber: savedPayment.paymentNumber,
        partyName: savedPayment.partyName,
        amount: savedPayment.amount,
        requestedBy: savedPayment.requestedBy || 'Finance Officer',
        requestedDate: savedPayment.date,
        currentTier: requiredTiers[0],
        requiredTiers,
        approvedTiers: [],
        status: 'Pending',
        comments: `Payment ${paymentNumber} for ₹${payment.amount.toLocaleString('en-IN')} pending Step 1 (${requiredTiers[0]}) approval (Tier 1 of ${requiredTiers.length})`,
      };
      savedPayment.approvalRequestId = approvalReq.id;
      this.approvals.unshift(approvalReq);
      this.persist(STORAGE_KEYS.APPROVAL_REQUESTS, this.approvals);

      this.logAudit({
        module: 'Payments',
        action: 'Create',
        entityId: savedPayment.id,
        entityNumber: savedPayment.paymentNumber,
        details: `Payment ₹${payment.amount} submitted. Step 1 awaiting ${requiredTiers[0]} approval (${requiredTiers.join(' → ')})`,
      });
    } else {
      // Skip approval: disburse and settle immediately
      this.executePaymentSettlement(savedPayment, savedPayment.approvedBy);
    }

    this.payments.unshift(savedPayment);
    this.persist(STORAGE_KEYS.PAYMENTS, this.payments);
    this.emitEvent('erp_payments_changed', this.payments);

    return savedPayment;
  }

  /**
   * Approves a single step in the sequential payment approval chain.
   * If all required tiers approve, automatically executes payment settlement,
   * deducts cash/bank balance, marks invoices paid, and posts journal entry.
   */
  public approvePaymentStep(
    paymentId: string,
    approverName: string,
    role?: string,
    comment?: string
  ): PaymentTransactionRecord {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error(`Payment with id ${paymentId} not found`);
    if (payment.status !== 'Pending Approval') {
      throw new Error(`Payment ${payment.paymentNumber} is not pending approval (status: ${payment.status})`);
    }

    const currentTier = payment.currentTier || (payment.requiredTiers && payment.requiredTiers[0]) || 'FinanceManager';
    payment.approvedTiers = payment.approvedTiers || [];
    payment.approvedTiers.push({
      tier: currentTier,
      approverName,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      comment: comment || `Step approved by ${approverName} (${currentTier})`,
    });

    const tiers = payment.requiredTiers && payment.requiredTiers.length > 0
      ? payment.requiredTiers
      : this.getPaymentSequentialTiers(payment.amount);

    const currentIdx = tiers.indexOf(currentTier);
    const isFinalTier = currentIdx === -1 || currentIdx >= tiers.length - 1;

    // Sync with linked approval request
    const approvalReq = this.approvals.find(
      (a) => a.id === payment.approvalRequestId || (a.entityId === payment.id && a.entityType === 'Payment')
    );
    if (approvalReq) {
      approvalReq.approvedTiers = [...payment.approvedTiers];
    }

    if (isFinalTier) {
      // Final tier reached: Payment is fully approved!
      payment.status = 'Completed';
      payment.approvalStatus = 'Approved';
      payment.approvedBy = approverName;
      payment.currentTier = undefined;

      if (approvalReq) {
        approvalReq.status = 'Approved';
        approvalReq.currentTier = undefined;
        approvalReq.comments = `Sequential approval chain completed (${tiers.join(' → ')}). Final authorization by ${approverName}.`;
      }

      // Execute financial settlement and journal entry posting
      this.executePaymentSettlement(payment, approverName);

      this.logAudit({
        module: 'Payments',
        action: 'Approve',
        entityId: payment.id,
        entityNumber: payment.paymentNumber,
        details: `Payment fully approved by ${approverName}. Disbursed Net ₹${payment.netPaid} to ${payment.partyName}`,
      });
    } else {
      // Advance to next tier in sequential chain
      const nextTier = tiers[currentIdx + 1];
      payment.currentTier = nextTier;

      if (approvalReq) {
        approvalReq.currentTier = nextTier;
        approvalReq.comments = `Step ${currentIdx + 1}/${tiers.length} (${currentTier}) approved by ${approverName}. Awaiting Tier: ${nextTier}.`;
      }

      this.logAudit({
        module: 'Payments',
        action: 'Approve',
        entityId: payment.id,
        entityNumber: payment.paymentNumber,
        details: `Sequential tier approved (${currentTier}) by ${approverName}. Next required tier: ${nextTier}`,
      });
    }

    this.persist(STORAGE_KEYS.PAYMENTS, this.payments);
    this.persist(STORAGE_KEYS.APPROVAL_REQUESTS, this.approvals);
    this.emitEvent('erp_payments_changed', this.payments);
    this.emitEvent('erp_approvals_changed', this.approvals);

    return payment;
  }

  /**
   * Rejects a payment in the approval workflow.
   */
  public rejectPayment(paymentId: string, approverName: string, reason: string): PaymentTransactionRecord {
    const payment = this.payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error(`Payment with id ${paymentId} not found`);

    payment.status = 'Cancelled';
    payment.approvalStatus = 'Rejected';
    payment.remarks = payment.remarks
      ? `${payment.remarks} | Rejected by ${approverName}: ${reason}`
      : `Rejected by ${approverName}: ${reason}`;

    const approvalReq = this.approvals.find(
      (a) => a.id === payment.approvalRequestId || (a.entityId === payment.id && a.entityType === 'Payment')
    );
    if (approvalReq) {
      approvalReq.status = 'Rejected';
      approvalReq.comments = `Rejected by ${approverName}: ${reason}`;
    }

    this.persist(STORAGE_KEYS.PAYMENTS, this.payments);
    this.persist(STORAGE_KEYS.APPROVAL_REQUESTS, this.approvals);
    this.emitEvent('erp_payments_changed', this.payments);
    this.emitEvent('erp_approvals_changed', this.approvals);

    this.logAudit({
      module: 'Payments',
      action: 'Reject',
      entityId: payment.id,
      entityNumber: payment.paymentNumber,
      details: `Payment rejected by ${approverName}: ${reason}`,
    });

    return payment;
  }

  /**
   * Settles payment balances, updates vendor ledger, deducts cash/bank balance,
   * marks invoice allocations, and posts General Ledger double entries.
   */
  private executePaymentSettlement(savedPayment: PaymentTransactionRecord, approverName?: string): void {
    // 1. Update Vendor balance (vendor payable decreases -> more positive)
    const vendor = this.parties.find((p) => p.id === savedPayment.partyId);
    if (vendor) {
      vendor.currentBalance += savedPayment.amount;
      this.persist(STORAGE_KEYS.PARTIES, this.parties);
    }

    // 2. Update linked Purchase Invoices
    if (savedPayment.allocations && savedPayment.allocations.length > 0) {
      savedPayment.allocations.forEach((alloc) => {
        const inv = this.purchaseInvoices.find(
          (pi) => pi.id === alloc.invoiceId || pi.invoiceNumber === alloc.invoiceNumber
        );
        if (inv) {
          inv.paidAmount += alloc.amount;
          inv.balanceAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
          if (inv.balanceAmount === 0) inv.status = 'Paid';
          else inv.status = 'Partially Paid';
        }
      });
      this.persist(STORAGE_KEYS.PURCHASE_INVOICES, this.purchaseInvoices);
    }

    // 3. Deduct from Bank or Cash account balance (net of any TDS deducted)
    const bankAcc = this.bankAccounts.find((b) => b.id === savedPayment.accountId);
    if (bankAcc) {
      bankAcc.currentBalance -= savedPayment.netPaid;
      this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    }
    const cashAcc = this.cashAccounts.find((c) => c.id === savedPayment.accountId);
    if (cashAcc) {
      cashAcc.currentBalance -= savedPayment.netPaid;
      this.persist(STORAGE_KEYS.CASH_ACCOUNTS, this.cashAccounts);
    }

    // 4. Double Entry Posting
    const bankGlCode = bankAcc?.glAccountCode || cashAcc?.glAccountCode || '1100';
    const debitAccountCode = savedPayment.isAdvance ? '2350' : '2000';
    const debitAccountName = savedPayment.isAdvance ? 'Advance to Vendors' : 'Accounts Payable (Control)';

    const lines = [
      {
        accountCode: debitAccountCode,
        accountName: debitAccountName,
        partyId: savedPayment.partyId,
        partyName: savedPayment.partyName,
        debit: savedPayment.amount,
        credit: 0,
      },
      {
        accountCode: bankGlCode,
        accountName: savedPayment.accountName,
        debit: 0,
        credit: savedPayment.netPaid,
      },
    ];

    if ((savedPayment.tdsAmount || 0) > 0) {
      lines.push({
        accountCode: '2150',
        accountName: `TDS Payable (${savedPayment.tdsSection || 'Statutory'})`,
        debit: 0,
        credit: savedPayment.tdsAmount || 0,
      });

      // Statutory TDS Ledger Registration in GST/Tax Engine
      gstTaxEngine.recordTdsDeduction({
        paymentId: savedPayment.id,
        paymentNumber: savedPayment.paymentNumber,
        date: savedPayment.date,
        vendorId: savedPayment.partyId,
        vendorName: savedPayment.partyName,
        vendorPan: vendor?.pan || 'AAAPL1234C',
        section: (savedPayment.tdsSection as any) || '194C',
        grossAmount: savedPayment.amount,
        tdsRate: savedPayment.tdsRate || 2,
        tdsAmount: savedPayment.tdsAmount || 0,
        netPaidAmount: savedPayment.netPaid,
        certificateIssued: false,
        quarter: 'Q4',
      });
    }

    accountingEngine.postJournalEntry({
      referenceType: savedPayment.isAdvance ? 'AdvancePayment' : 'Payment',
      referenceId: savedPayment.id,
      referenceNumber: savedPayment.paymentNumber,
      date: savedPayment.date,
      narration: `Payment to ${savedPayment.partyName} (Net: ₹${savedPayment.netPaid}, TDS: ₹${savedPayment.tdsAmount || 0})`,
      lines,
      createdBy: approverName || 'Payment Engine',
    });
  }

  public getReceipts(): ReceiptTransactionRecord[] {
    return [...this.receipts];
  }

  /**
   * Posts Customer Receipt:
   * Dr. Bank / Cash (1100 or 1000) = Amount
   * Cr. Accounts Receivable (1200) or Advance from Customers (2300) = Amount
   */
  public postReceipt(receipt: Partial<ReceiptTransactionRecord> & {
    partyId: string;
    partyName: string;
    amount: number;
    paymentMethod: ReceiptTransactionRecord['paymentMethod'];
    accountId: string;
    accountName: string;
    referenceNumber: string;
  }): ReceiptTransactionRecord {
    const isAdvance = receipt.isAdvance || false;
    const receiptNumber = receipt.receiptNumber || this.getNextReceiptNumber(isAdvance);
    const id = receipt.id || `rec-${Date.now()}`;

    // Multi-invoice allocation calculations
    const allocations = receipt.allocations || [];
    const allocatedAmount = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
    const unallocatedAmount = Math.max(0, receipt.amount - allocatedAmount);
    const advanceStatus = isAdvance
      ? (unallocatedAmount === 0 ? 'Fully Adjusted' : (allocatedAmount > 0 ? 'Partially Adjusted' : 'Unadjusted'))
      : undefined;

    const savedReceipt: ReceiptTransactionRecord = {
      id,
      receiptNumber,
      date: receipt.date || new Date().toISOString().split('T')[0],
      partyId: receipt.partyId,
      partyName: receipt.partyName,
      amount: receipt.amount,
      paymentMethod: receipt.paymentMethod,
      accountId: receipt.accountId,
      accountName: receipt.accountName,
      referenceNumber: receipt.referenceNumber,
      chequeNumber: receipt.chequeNumber,
      transactionId: receipt.transactionId,
      attachmentName: receipt.attachmentName,
      attachmentUrl: receipt.attachmentUrl,
      allocations,
      allocatedAmount,
      unallocatedAmount,
      isAdvance,
      advanceStatus,
      status: 'Completed',
      approvalStatus: 'Approved',
      remarks: receipt.remarks,
    };

    // 1. Reduce customer receivables
    const customer = this.parties.find((p) => p.id === savedReceipt.partyId);
    if (customer) {
      customer.currentBalance -= savedReceipt.amount;
      this.persist(STORAGE_KEYS.PARTIES, this.parties);
    }

    // 2. Update linked Sales Invoices
    if (savedReceipt.allocations && savedReceipt.allocations.length > 0) {
      savedReceipt.allocations.forEach((alloc) => {
        const inv = this.salesInvoices.find(
          (si) => si.id === alloc.invoiceId || si.invoiceNumber === alloc.invoiceNumber
        );
        if (inv) {
          inv.paidAmount += alloc.amount;
          inv.balanceAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
          if (inv.balanceAmount === 0) inv.status = 'Paid';
          else inv.status = 'Partially Paid';
        }
      });
      this.persist(STORAGE_KEYS.SALES_INVOICES, this.salesInvoices);
    }

    // 3. Add to Bank or Cash account balance
    const bankAcc = this.bankAccounts.find((b) => b.id === savedReceipt.accountId);
    if (bankAcc) {
      bankAcc.currentBalance += savedReceipt.amount;
      this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    }
    const cashAcc = this.cashAccounts.find((c) => c.id === savedReceipt.accountId);
    if (cashAcc) {
      cashAcc.currentBalance += savedReceipt.amount;
      this.persist(STORAGE_KEYS.CASH_ACCOUNTS, this.cashAccounts);
    }

    // 4. Double Entry
    const bankGlCode = bankAcc?.glAccountCode || cashAcc?.glAccountCode || '1100';
    const creditAccountCode = savedReceipt.isAdvance ? '2300' : '1200';
    const creditAccountName = savedReceipt.isAdvance ? 'Advance from Customers' : 'Accounts Receivable (Control)';

    accountingEngine.postJournalEntry({
      referenceType: savedReceipt.isAdvance ? 'AdvanceReceipt' : 'Receipt',
      referenceId: savedReceipt.id,
      referenceNumber: savedReceipt.receiptNumber,
      date: savedReceipt.date,
      narration: `Customer receipt from ${savedReceipt.partyName} (Ref: ${savedReceipt.referenceNumber})`,
      lines: [
        {
          accountCode: bankGlCode,
          accountName: savedReceipt.accountName,
          debit: savedReceipt.amount,
          credit: 0,
        },
        {
          accountCode: creditAccountCode,
          accountName: creditAccountName,
          partyId: savedReceipt.partyId,
          partyName: savedReceipt.partyName,
          debit: 0,
          credit: savedReceipt.amount,
        },
      ],
      createdBy: 'Cashier / Accountant',
    });

    this.receipts.unshift(savedReceipt);
    this.persist(STORAGE_KEYS.RECEIPTS, this.receipts);
    this.emitEvent('erp_receipts_changed', this.receipts);

    this.logAudit({
      module: 'Receipts',
      action: 'Post',
      entityId: savedReceipt.id,
      entityNumber: savedReceipt.receiptNumber,
      details: `Received ₹${savedReceipt.amount} from ${savedReceipt.partyName} into ${savedReceipt.accountName}`,
    });

    return savedReceipt;
  }

  /**
   * Adjusts an existing Customer Advance or Vendor Advance against open invoices.
   * Reuses the multi-invoice allocation logic and posts:
   * - Customer Advance: Dr Advance from Customers (2300) → Cr Accounts Receivable (1200)
   * - Vendor Advance: Dr Accounts Payable (2000) → Cr Advance to Vendors (2350)
   */
  public adjustAdvance(params: {
    advanceId: string;
    allocations: InvoiceAllocation[];
    remarks?: string;
    adjustedBy?: string;
    date?: string;
  }): AdvanceAdjustmentRecord {
    const paymentAdvance = this.payments.find((p) => p.id === params.advanceId && p.isAdvance);
    const receiptAdvance = this.receipts.find((r) => r.id === params.advanceId && r.isAdvance);

    if (!paymentAdvance && !receiptAdvance) {
      throw new Error(`Advance record with id ${params.advanceId} not found`);
    }

    const isCustomer = !!receiptAdvance;
    const advance = (isCustomer ? receiptAdvance : paymentAdvance)!;
    const totalAdjusted = params.allocations.reduce((sum, a) => sum + (a.amount || 0), 0);

    const currentUnallocated = advance.unallocatedAmount !== undefined
      ? advance.unallocatedAmount
      : Math.max(0, advance.amount - (advance.allocatedAmount || 0));

    if (totalAdjusted <= 0) {
      throw new Error('Allocation amount must be greater than zero');
    }

    if (totalAdjusted > currentUnallocated) {
      throw new Error(
        `Total adjustment amount (₹${totalAdjusted}) exceeds available unallocated advance (₹${currentUnallocated})`
      );
    }

    // 1. Update Invoices
    if (isCustomer) {
      params.allocations.forEach((alloc) => {
        const inv = this.salesInvoices.find(
          (si) => si.id === alloc.invoiceId || si.invoiceNumber === alloc.invoiceNumber
        );
        if (inv) {
          inv.paidAmount += alloc.amount;
          inv.balanceAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
          inv.status = inv.balanceAmount === 0 ? 'Paid' : 'Partially Paid';
        }
      });
      this.persist(STORAGE_KEYS.SALES_INVOICES, this.salesInvoices);
    } else {
      params.allocations.forEach((alloc) => {
        const inv = this.purchaseInvoices.find(
          (pi) => pi.id === alloc.invoiceId || pi.invoiceNumber === alloc.invoiceNumber
        );
        if (inv) {
          inv.paidAmount += alloc.amount;
          inv.balanceAmount = Math.max(0, inv.grandTotal - inv.paidAmount);
          inv.status = inv.balanceAmount === 0 ? 'Paid' : 'Partially Paid';
        }
      });
      this.persist(STORAGE_KEYS.PURCHASE_INVOICES, this.purchaseInvoices);
    }

    // 2. Update Advance Record
    advance.allocatedAmount = (advance.allocatedAmount || 0) + totalAdjusted;
    advance.unallocatedAmount = Math.max(0, advance.amount - advance.allocatedAmount);
    advance.advanceStatus = advance.unallocatedAmount === 0 ? 'Fully Adjusted' : 'Partially Adjusted';

    // 3. Create Advance Adjustment Record
    const nextAdjNum = this.advanceAdjustments.length + 1;
    const adjRecord: AdvanceAdjustmentRecord = {
      id: `adj-${Date.now()}`,
      adjustmentNumber: `ADJ-2026-${String(nextAdjNum).padStart(4, '0')}`,
      date: params.date || new Date().toISOString().split('T')[0],
      advanceId: advance.id,
      advanceNumber: isCustomer
        ? (advance as ReceiptTransactionRecord).receiptNumber
        : (advance as PaymentTransactionRecord).paymentNumber,
      advanceType: isCustomer ? 'Customer' : 'Vendor',
      partyId: advance.partyId,
      partyName: advance.partyName,
      totalAdvanceAmount: advance.amount,
      adjustedAmount: totalAdjusted,
      remainingAdvanceAmount: advance.unallocatedAmount,
      allocations: params.allocations,
      remarks: params.remarks || `Advance adjusted against ${params.allocations.map((a) => a.invoiceNumber).join(', ')}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    // 4. Double-Entry Journal Entry
    if (isCustomer) {
      // Dr. Advance from Customers (2300) -> Cr. Accounts Receivable (1200)
      accountingEngine.postJournalEntry({
        referenceType: 'AdvanceAdjustment',
        referenceId: adjRecord.id,
        referenceNumber: adjRecord.adjustmentNumber,
        date: adjRecord.date,
        narration: `Adjustment of Customer Advance ${adjRecord.advanceNumber} against ${params.allocations.map((a) => a.invoiceNumber).join(', ')}`,
        lines: [
          {
            accountCode: '2300',
            accountName: 'Advance from Customers',
            partyId: advance.partyId,
            partyName: advance.partyName,
            debit: totalAdjusted,
            credit: 0,
          },
          {
            accountCode: '1200',
            accountName: 'Accounts Receivable (Control)',
            partyId: advance.partyId,
            partyName: advance.partyName,
            debit: 0,
            credit: totalAdjusted,
          },
        ],
        createdBy: params.adjustedBy || 'Finance Officer',
      });
    } else {
      // Dr. Accounts Payable (2000) -> Cr. Advance to Vendors (2350)
      accountingEngine.postJournalEntry({
        referenceType: 'AdvanceAdjustment',
        referenceId: adjRecord.id,
        referenceNumber: adjRecord.adjustmentNumber,
        date: adjRecord.date,
        narration: `Adjustment of Vendor Advance ${adjRecord.advanceNumber} against ${params.allocations.map((a) => a.invoiceNumber).join(', ')}`,
        lines: [
          {
            accountCode: '2000',
            accountName: 'Accounts Payable (Control)',
            partyId: advance.partyId,
            partyName: advance.partyName,
            debit: totalAdjusted,
            credit: 0,
          },
          {
            accountCode: '2350',
            accountName: 'Advance to Vendors',
            partyId: advance.partyId,
            partyName: advance.partyName,
            debit: 0,
            credit: totalAdjusted,
          },
        ],
        createdBy: params.adjustedBy || 'Finance Officer',
      });
    }

    this.advanceAdjustments.unshift(adjRecord);
    this.persist(STORAGE_KEYS.ADVANCE_ADJUSTMENTS, this.advanceAdjustments);

    if (isCustomer) {
      this.persist(STORAGE_KEYS.RECEIPTS, this.receipts);
      this.emitEvent('erp_receipts_changed', this.receipts);
    } else {
      this.persist(STORAGE_KEYS.PAYMENTS, this.payments);
      this.emitEvent('erp_payments_changed', this.payments);
    }

    this.logAudit({
      module: 'Advances',
      action: 'Post',
      entityId: adjRecord.id,
      entityNumber: adjRecord.adjustmentNumber,
      details: `Adjusted ₹${totalAdjusted} of ${adjRecord.advanceNumber} (${adjRecord.advanceType}) against ${params.allocations.length} invoice(s)`,
    });

    return adjRecord;
  }

  public getAdvanceAdjustments(): AdvanceAdjustmentRecord[] {
    return [...this.advanceAdjustments];
  }

  public getAdvances(type?: 'Customer' | 'Vendor'): (PaymentTransactionRecord | ReceiptTransactionRecord)[] {
    if (type === 'Customer') {
      return this.receipts.filter((r) => r.isAdvance);
    }
    if (type === 'Vendor') {
      return this.payments.filter((p) => p.isAdvance);
    }
    return [
      ...this.payments.filter((p) => p.isAdvance),
      ...this.receipts.filter((r) => r.isAdvance),
    ];
  }

  // Cheque Management & Bounce Reversal (Section 27)
  public getCheques(): ChequeRecord[] {
    return [...this.cheques];
  }

  public saveCheque(cheque: Partial<ChequeRecord> & { chequeNumber: string; amount: number; partyId: string; partyName: string }): ChequeRecord {
    const id = cheque.id || `chq-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const maturity = cheque.maturityDate || today;
    
    // Auto classify as Post-Dated if maturity date is in the future and status not specified
    let status = cheque.status;
    if (!status) {
      status = maturity > today ? 'Post-Dated' : 'Pending';
    }

    const newCheque: ChequeRecord = {
      id,
      chequeNumber: cheque.chequeNumber,
      bankName: cheque.bankName || 'Federal Bank',
      partyId: cheque.partyId,
      partyName: cheque.partyName,
      type: cheque.type || 'Received',
      amount: cheque.amount,
      chequeDate: cheque.chequeDate || today,
      maturityDate: maturity,
      depositDate: cheque.depositDate,
      clearanceDate: cheque.clearanceDate,
      status,
      bounceReason: cheque.bounceReason,
      bouncedAt: cheque.bouncedAt,
      linkedTransactionId: cheque.linkedTransactionId,
      notes: cheque.notes,
    };
    this.cheques.unshift(newCheque);
    this.persist(STORAGE_KEYS.CHEQUES, this.cheques);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_cheques_changed');

    this.logAudit({
      module: 'Cheque Register',
      action: 'Create',
      entityId: newCheque.id,
      entityNumber: newCheque.chequeNumber,
      details: `${newCheque.type} Cheque #${newCheque.chequeNumber} for ₹${newCheque.amount} registered (${newCheque.status}).`,
    });

    return newCheque;
  }

  public depositCheque(chequeId: string, depositBankId?: string, depositDate?: string): ChequeRecord {
    const chq = this.cheques.find((c) => c.id === chequeId);
    if (!chq) throw new Error('Cheque not found');

    const dDate = depositDate || new Date().toISOString().split('T')[0];
    chq.status = 'Deposited';
    chq.depositDate = dDate;

    this.persist(STORAGE_KEYS.CHEQUES, this.cheques);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_cheques_changed');

    this.logAudit({
      module: 'Cheque Register',
      action: 'Edit',
      entityId: chq.id,
      entityNumber: chq.chequeNumber,
      details: `Cheque #${chq.chequeNumber} marked as Deposited for clearing on ${dDate}.`,
    });

    return chq;
  }

  public clearCheque(chequeId: string, clearanceDate?: string): ChequeRecord {
    const chq = this.cheques.find((c) => c.id === chequeId);
    if (!chq) throw new Error('Cheque not found');

    const cDate = clearanceDate || new Date().toISOString().split('T')[0];
    chq.status = 'Cleared';
    chq.clearanceDate = cDate;

    this.persist(STORAGE_KEYS.CHEQUES, this.cheques);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_cheques_changed');

    this.logAudit({
      module: 'Cheque Register',
      action: 'Edit',
      entityId: chq.id,
      entityNumber: chq.chequeNumber,
      details: `Cheque #${chq.chequeNumber} Cleared into bank account on ${cDate}.`,
    });

    return chq;
  }

  public cancelCheque(chequeId: string, notes?: string): ChequeRecord {
    const chq = this.cheques.find((c) => c.id === chequeId);
    if (!chq) throw new Error('Cheque not found');

    chq.status = 'Cancelled';
    if (notes) chq.notes = (chq.notes ? chq.notes + ' | ' : '') + notes;

    this.persist(STORAGE_KEYS.CHEQUES, this.cheques);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_cheques_changed');

    this.logAudit({
      module: 'Cheque Register',
      action: 'Edit',
      entityId: chq.id,
      entityNumber: chq.chequeNumber,
      details: `Cheque #${chq.chequeNumber} was cancelled.`,
    });

    return chq;
  }

  /**
   * Cheque Bounce Workflow:
   * 1. Marks cheque as Bounced with reason and timestamp
   * 2. Reverses the original Payment / Receipt
   * 3. Restores Outstanding party balance and linked invoice balance
   * 4. Flags the Party (isFlagged: true, flagReason, status: 'On Hold')
   * 5. Reverses the linked journal entry (Dr Accounts Receivable -> Cr Bank or Dr Bank -> Cr Accounts Payable)
   * 6. Appears in "Critical" Action Required dashboard section
   * 7. Emits events and records audit trail
   */
  public processChequeBounce(
    chequeId: string,
    bounceReasonInput: string | { bounceReason?: string; bounceDate?: string; bounceFee?: number; notes?: string }
  ): ChequeRecord {
    const chq = this.cheques.find((c) => c.id === chequeId);
    if (!chq) throw new Error('Cheque not found');

    const reason = typeof bounceReasonInput === 'string' ? bounceReasonInput : (bounceReasonInput.bounceReason || 'Cheque dishonoured');
    const bounceDate = typeof bounceReasonInput === 'object' && bounceReasonInput.bounceDate ? bounceReasonInput.bounceDate : new Date().toISOString().split('T')[0];
    const notes = typeof bounceReasonInput === 'object' && bounceReasonInput.notes ? bounceReasonInput.notes : undefined;
    const todayStr = bounceDate;
    const bounceReason = reason;

    chq.status = 'Bounced';
    chq.bounceReason = reason;
    chq.bouncedAt = bounceDate;
    if (notes) {
      chq.notes = (chq.notes ? chq.notes + ' | ' : '') + notes;
    }

    // 1. Party restoration and flagging
    const party = this.parties.find((p) => p.id === chq.partyId);

    if (chq.type === 'Received') {
      // Received cheque from Customer bounced
      if (party) {
        party.currentBalance += chq.amount; // Restore receivable balance
        party.isFlagged = true;
        party.flagReason = `Cheque #${chq.chequeNumber} bounced on ${bounceDate} (Reason: ${reason})`;
        party.status = 'On Hold';
        this.persist(STORAGE_KEYS.PARTIES, this.parties);
      }

      // Reverses linked receipt if any
      if (chq.linkedTransactionId) {
        const receipt = this.receipts.find((r) => r.id === chq.linkedTransactionId || r.receiptNumber === chq.linkedTransactionId);
        if (receipt) {
          receipt.status = 'Cancelled';
          receipt.remarks = (receipt.remarks || '') + ` [BOUNCED: Chq #${chq.chequeNumber} dishonoured - reversed]`;
          this.persist(STORAGE_KEYS.RECEIPTS, this.receipts);
        }
      }

      // Restore outstanding on sales invoice if applicable
      const customerSales = this.salesInvoices.filter((s) => s.customerId === chq.partyId);
      if (customerSales.length > 0) {
        const candidate = customerSales.find((s) => s.status === 'Paid' || s.balanceAmount < s.grandTotal);
        if (candidate) {
          candidate.balanceAmount = Math.min(candidate.grandTotal, candidate.balanceAmount + chq.amount);
          candidate.status = candidate.balanceAmount >= candidate.grandTotal ? 'Pending' : 'Partially Paid';
          this.persist(STORAGE_KEYS.SALES_INVOICES, this.salesInvoices);
        }
      }

      // Reversal Journal Entry:
      // Dr. Accounts Receivable (1200) -> Cr. Bank Account (1100)
      accountingEngine.postJournalEntry({
        referenceType: 'ManualJournal',
        referenceId: chq.id,
        referenceNumber: `REV-${chq.chequeNumber}`,
        date: todayStr,
        narration: `REVERSAL: Received Cheque #${chq.chequeNumber} from ${chq.partyName} bounced (${bounceReason}). Receivable restored.`,
        lines: [
          {
            accountCode: '1200',
            accountName: 'Accounts Receivable (Control)',
            partyId: chq.partyId,
            partyName: chq.partyName,
            debit: chq.amount,
            credit: 0,
          },
          {
            accountCode: '1100',
            accountName: 'Federal Bank - Current A/c',
            debit: 0,
            credit: chq.amount,
          },
        ],
        createdBy: 'Cheque Clearance Engine',
      });
    } else {
      // Issued cheque to Vendor bounced / dishonoured
      if (party) {
        party.currentBalance -= chq.amount; // Restore payable liability
        party.isFlagged = true;
        party.flagReason = `Issued Cheque #${chq.chequeNumber} dishonoured on ${todayStr} (Reason: ${bounceReason})`;
        this.persist(STORAGE_KEYS.PARTIES, this.parties);
      }

      // Reverses linked payment if any
      if (chq.linkedTransactionId) {
        const payment = this.payments.find((p) => p.id === chq.linkedTransactionId || p.paymentNumber === chq.linkedTransactionId);
        if (payment) {
          payment.status = 'Cancelled';
          payment.remarks = (payment.remarks || '') + ` [BOUNCED: Chq #${chq.chequeNumber} dishonoured - reversed]`;
          this.persist(STORAGE_KEYS.PAYMENTS, this.payments);
        }
      }

      // Restore outstanding on purchase invoice
      const vendorPurchases = this.purchaseInvoices.filter((p) => p.vendorId === chq.partyId);
      if (vendorPurchases.length > 0) {
        const candidate = vendorPurchases.find((p) => p.status === 'Paid' || p.balanceAmount < p.grandTotal);
        if (candidate) {
          candidate.balanceAmount = Math.min(candidate.grandTotal, candidate.balanceAmount + chq.amount);
          candidate.status = candidate.balanceAmount >= candidate.grandTotal ? 'Pending' : 'Partially Paid';
          this.persist(STORAGE_KEYS.PURCHASE_INVOICES, this.purchaseInvoices);
        }
      }

      // Reversal Journal Entry:
      // Dr. Bank Account (1100) -> Cr. Accounts Payable (2000)
      accountingEngine.postJournalEntry({
        referenceType: 'ManualJournal',
        referenceId: chq.id,
        referenceNumber: `REV-${chq.chequeNumber}`,
        date: todayStr,
        narration: `REVERSAL: Issued Cheque #${chq.chequeNumber} to ${chq.partyName} bounced (${bounceReason}). Payable restored.`,
        lines: [
          {
            accountCode: '1100',
            accountName: 'Federal Bank - Current A/c',
            debit: chq.amount,
            credit: 0,
          },
          {
            accountCode: '2000',
            accountName: 'Accounts Payable (Control)',
            partyId: chq.partyId,
            partyName: chq.partyName,
            debit: 0,
            credit: chq.amount,
          },
        ],
        createdBy: 'Cheque Clearance Engine',
      });
    }

    this.persist(STORAGE_KEYS.CHEQUES, this.cheques);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_cheques_changed');
    this.emitEvent('erp_parties_changed');

    this.logAudit({
      module: 'Cheque Register',
      action: 'Reverse',
      entityId: chq.id,
      entityNumber: chq.chequeNumber,
      details: `Critical: Cheque #${chq.chequeNumber} (${chq.type}) bounced for ₹${chq.amount}. Party flagged, outstanding restored, and reversal journal posted.`,
    });

    return chq;
  }

  // ==========================================
  // CASH, BANK & FUND TRANSFERS
  // ==========================================
  public getBankAccounts(): BankAccountRecord[] {
    return [...this.bankAccounts];
  }

  public addBankAccount(acc: Partial<BankAccountRecord> & { name: string; bankName: string; accountNumber: string }): BankAccountRecord {
    const id = `bnk-${Date.now()}`;
    const newAcc: BankAccountRecord = {
      id,
      name: acc.name,
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      ifscCode: acc.ifscCode || 'FDRL0001000',
      branch: acc.branch || 'Main Branch',
      accountType: acc.accountType || 'Current',
      openingBalance: Number(acc.openingBalance || 0),
      currentBalance: Number(acc.openingBalance || 0),
      glAccountCode: acc.glAccountCode || '1100',
      isDefault: Boolean(acc.isDefault),
      currency: acc.currency || 'INR',
      status: acc.status || 'Active',
    };

    if (newAcc.isDefault) {
      this.bankAccounts.forEach((b) => (b.isDefault = false));
    }

    this.bankAccounts.push(newAcc);
    this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_bank_accounts_changed');
    return newAcc;
  }

  public updateBankAccount(id: string, updates: Partial<BankAccountRecord>): BankAccountRecord {
    const acc = this.bankAccounts.find((b) => b.id === id);
    if (!acc) throw new Error('Bank account not found');

    Object.assign(acc, updates);
    if (updates.isDefault) {
      this.bankAccounts.forEach((b) => {
        if (b.id !== id) b.isDefault = false;
      });
    }

    this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_bank_accounts_changed');
    return acc;
  }

  public getCashAccounts(): CashAccountRecord[] {
    return [...this.cashAccounts];
  }

  public addCashAccount(acc: Partial<CashAccountRecord> & { name: string; custodian: string }): CashAccountRecord {
    const id = `csh-${Date.now()}`;
    const newAcc: CashAccountRecord = {
      id,
      name: acc.name,
      type: acc.type || 'Petty Cash',
      custodian: acc.custodian,
      openingBalance: Number(acc.openingBalance || 0),
      currentBalance: Number(acc.openingBalance || 0),
      glAccountCode: acc.glAccountCode || (acc.type === 'Petty Cash' ? '1010' : '1000'),
      currency: acc.currency || 'INR',
      status: acc.status || 'Active',
    };

    this.cashAccounts.push(newAcc);
    this.persist(STORAGE_KEYS.CASH_ACCOUNTS, this.cashAccounts);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_cash_accounts_changed');
    return newAcc;
  }

  public updateCashAccount(id: string, updates: Partial<CashAccountRecord>): CashAccountRecord {
    const acc = this.cashAccounts.find((c) => c.id === id);
    if (!acc) throw new Error('Cash account not found');

    Object.assign(acc, updates);
    this.persist(STORAGE_KEYS.CASH_ACCOUNTS, this.cashAccounts);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_cash_accounts_changed');
    return acc;
  }

  public getFundTransfers(): FundTransferRecord[] {
    return [...this.fundTransfers];
  }

  /**
   * Fund Transfer:
   * Supports Cash <-> Bank, Bank <-> Bank, Cash <-> Cash, Petty Cash, Other
   * Automatically updates both account balances
   * Posts Journal: Dr Destination Cash/Bank -> Cr Source Cash/Bank
   */
  public postFundTransfer(transfer: {
    fromAccountId: string;
    fromAccountName: string;
    fromAccountType: string;
    toAccountId: string;
    toAccountName: string;
    toAccountType: string;
    amount: number;
    referenceNumber: string;
    remarks?: string;
    date?: string;
  }): FundTransferRecord {
    const nextNum = this.fundTransfers.length + 1;
    const transferNumber = `TRF-2026-${String(nextNum).padStart(4, '0')}`;
    const tDate = transfer.date || new Date().toISOString().split('T')[0];

    const newTransfer: FundTransferRecord = {
      id: `trf-${Date.now()}`,
      transferNumber,
      date: tDate,
      fromAccountId: transfer.fromAccountId,
      fromAccountName: transfer.fromAccountName,
      fromAccountType: transfer.fromAccountType,
      toAccountId: transfer.toAccountId,
      toAccountName: transfer.toAccountName,
      toAccountType: transfer.toAccountType,
      amount: transfer.amount,
      referenceNumber: transfer.referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
      remarks: transfer.remarks,
      createdBy: 'Treasury Officer',
    };

    // 1. Deduct from Source Account (search bank and cash accounts)
    const sourceBank = this.bankAccounts.find((acc) => acc.id === transfer.fromAccountId);
    const sourceCash = this.cashAccounts.find((acc) => acc.id === transfer.fromAccountId);
    if (sourceBank) {
      sourceBank.currentBalance -= transfer.amount;
    } else if (sourceCash) {
      sourceCash.currentBalance -= transfer.amount;
    }

    // 2. Add to Destination Account (search bank and cash accounts)
    const targetBank = this.bankAccounts.find((acc) => acc.id === transfer.toAccountId);
    const targetCash = this.cashAccounts.find((acc) => acc.id === transfer.toAccountId);
    if (targetBank) {
      targetBank.currentBalance += transfer.amount;
    } else if (targetCash) {
      targetCash.currentBalance += transfer.amount;
    }

    this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    this.persist(STORAGE_KEYS.CASH_ACCOUNTS, this.cashAccounts);

    // 3. Post Contra Journal Entry:
    // Dr. Destination Cash/Bank -> Cr. Source Cash/Bank
    const fromGl = sourceBank?.glAccountCode || sourceCash?.glAccountCode || '1000';
    const toGl = targetBank?.glAccountCode || targetCash?.glAccountCode || '1100';

    accountingEngine.postJournalEntry({
      referenceType: 'FundTransfer',
      referenceId: newTransfer.id,
      referenceNumber: newTransfer.transferNumber,
      date: newTransfer.date,
      narration: `Contra Transfer: ₹${transfer.amount} from ${transfer.fromAccountName} to ${transfer.toAccountName}. Ref: ${newTransfer.referenceNumber}`,
      lines: [
        {
          accountCode: toGl,
          accountName: transfer.toAccountName,
          debit: transfer.amount,
          credit: 0,
        },
        {
          accountCode: fromGl,
          accountName: transfer.fromAccountName,
          debit: 0,
          credit: transfer.amount,
        },
      ],
      createdBy: 'Treasury Contra Engine',
    });

    this.fundTransfers.unshift(newTransfer);
    this.persist(STORAGE_KEYS.FUND_TRANSFERS, this.fundTransfers);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_transfers_changed');

    this.logAudit({
      module: 'Cash & Bank',
      action: 'Create',
      entityId: newTransfer.id,
      entityNumber: newTransfer.transferNumber,
      details: `Fund transfer of ₹${transfer.amount} executed from ${transfer.fromAccountName} to ${transfer.toAccountName}.`,
    });

    return newTransfer;
  }

  // ==========================================
  // BANK RECONCILIATION
  // ==========================================
  public getBankReconciliations(bankAccountId?: string): BankReconciliationRecord[] {
    if (bankAccountId) {
      return this.bankReconciliations.filter((r) => r.bankAccountId === bankAccountId);
    }
    return [...this.bankReconciliations];
  }

  public saveBankReconciliation(rec: BankReconciliationRecord): BankReconciliationRecord {
    const existingIndex = this.bankReconciliations.findIndex((r) => r.id === rec.id);
    if (existingIndex >= 0) {
      this.bankReconciliations[existingIndex] = rec;
    } else {
      this.bankReconciliations.unshift(rec);
    }
    this.persist(STORAGE_KEYS.BANK_RECONCILIATIONS, this.bankReconciliations);
    this.emitEvent('mysar_finance_data_changed');
    this.emitEvent('erp_reconciliation_changed');

    this.logAudit({
      module: 'Bank Reconciliation',
      action: rec.status === 'Reconciled' ? 'Approve' : 'Edit',
      entityId: rec.id,
      entityNumber: rec.reconciliationNumber,
      details: `Bank Reconciliation for ${rec.bankAccountName} saved. Status: ${rec.status}. Matched: ${rec.matchedLinesCount}/${rec.lines.length}. Difference: ₹${rec.difference}`,
    });

    return rec;
  }

  public deleteBankReconciliation(id: string): void {
    this.bankReconciliations = this.bankReconciliations.filter((r) => r.id !== id);
    this.persist(STORAGE_KEYS.BANK_RECONCILIATIONS, this.bankReconciliations);
    this.emitEvent('mysar_finance_data_changed');
  }

  // ==========================================
  // SYSTEM CASH & BANK TRANSACTIONS QUERIES
  // ==========================================
  public getBankTransactions(bankAccountId?: string): SystemBankTransaction[] {
    const list: SystemBankTransaction[] = [];

    // 1. Vendor Payments
    this.payments.forEach((p) => {
      if (p.paymentMethod === 'Bank Transfer' || p.paymentMethod === 'Cheque') {
        const isTarget = !bankAccountId || p.accountId === bankAccountId;
        if (isTarget) {
          list.push({
            id: p.id,
            date: p.date,
            type: 'Withdrawal',
            category: 'Payment',
            bankAccountId: p.accountId,
            partyName: p.partyName,
            referenceNumber: p.paymentNumber,
            description: `Payment to ${p.partyName} (${p.referenceNumber || 'Inv settlement'})`,
            withdrawal: p.amount,
            deposit: 0,
            status: p.status === 'Completed' ? 'Matched' : 'Pending',
          });
        }
      }
    });

    // 2. Customer Receipts
    this.receipts.forEach((r) => {
      if (r.paymentMethod === 'Bank Transfer' || r.paymentMethod === 'Cheque') {
        const isTarget = !bankAccountId || r.accountId === bankAccountId;
        if (isTarget) {
          list.push({
            id: r.id,
            date: r.date,
            type: 'Deposit',
            category: 'Receipt',
            bankAccountId: r.accountId,
            partyName: r.partyName,
            referenceNumber: r.receiptNumber,
            description: `Receipt from ${r.partyName} (${r.referenceNumber || 'Sales collection'})`,
            withdrawal: 0,
            deposit: r.amount,
            status: r.status === 'Completed' ? 'Matched' : 'Pending',
          });
        }
      }
    });

    // 3. Fund Transfers Out / In
    this.fundTransfers.forEach((t) => {
      if (t.fromAccountType === 'Bank' && (!bankAccountId || t.fromAccountId === bankAccountId)) {
        list.push({
          id: `${t.id}-out`,
          date: t.date,
          type: 'Withdrawal',
          category: 'Transfer',
          bankAccountId: t.fromAccountId,
          partyName: t.toAccountName,
          referenceNumber: t.transferNumber,
          description: `Transfer Out to ${t.toAccountName} (${t.referenceNumber || ''})`,
          withdrawal: t.amount,
          deposit: 0,
          status: 'Matched',
        });
      }
      if (t.toAccountType === 'Bank' && (!bankAccountId || t.toAccountId === bankAccountId)) {
        list.push({
          id: `${t.id}-in`,
          date: t.date,
          type: 'Deposit',
          category: 'Transfer',
          bankAccountId: t.toAccountId,
          partyName: t.fromAccountName,
          referenceNumber: t.transferNumber,
          description: `Transfer In from ${t.fromAccountName} (${t.referenceNumber || ''})`,
          withdrawal: 0,
          deposit: t.amount,
          status: 'Matched',
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  public getCashTransactions(cashAccountId?: string): SystemCashTransaction[] {
    const list: SystemCashTransaction[] = [];

    // 1. Cash Payments
    this.payments.forEach((p) => {
      if (p.paymentMethod === 'Cash') {
        const isTarget = !cashAccountId || p.accountId === cashAccountId;
        if (isTarget) {
          list.push({
            id: p.id,
            date: p.date,
            type: 'Outflow',
            category: 'Payment',
            cashAccountId: p.accountId,
            partyName: p.partyName,
            referenceNumber: p.paymentNumber,
            description: `Cash payment to ${p.partyName}`,
            outflow: p.amount,
            inflow: 0,
          });
        }
      }
    });

    // 2. Cash Receipts
    this.receipts.forEach((r) => {
      if (r.paymentMethod === 'Cash') {
        const isTarget = !cashAccountId || r.accountId === cashAccountId;
        if (isTarget) {
          list.push({
            id: r.id,
            date: r.date,
            type: 'Inflow',
            category: 'Receipt',
            cashAccountId: r.accountId,
            partyName: r.partyName,
            referenceNumber: r.receiptNumber,
            description: `Cash collection from ${r.partyName}`,
            inflow: r.amount,
            outflow: 0,
          });
        }
      }
    });

    // 3. Fund Transfers
    this.fundTransfers.forEach((t) => {
      if (t.fromAccountType !== 'Bank' && (!cashAccountId || t.fromAccountId === cashAccountId)) {
        list.push({
          id: `${t.id}-out`,
          date: t.date,
          type: 'Outflow',
          category: 'Transfer',
          cashAccountId: t.fromAccountId,
          partyName: t.toAccountName,
          referenceNumber: t.transferNumber,
          description: `Cash Transfer Out to ${t.toAccountName}`,
          outflow: t.amount,
          inflow: 0,
        });
      }
      if (t.toAccountType !== 'Bank' && (!cashAccountId || t.toAccountId === cashAccountId)) {
        list.push({
          id: `${t.id}-in`,
          date: t.date,
          type: 'Inflow',
          category: 'Transfer',
          cashAccountId: t.toAccountId,
          partyName: t.fromAccountName,
          referenceNumber: t.transferNumber,
          description: `Cash Transfer In from ${t.fromAccountName}`,
          inflow: t.amount,
          outflow: 0,
        });
      }
    });

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ==========================================
  // LOANS & DEBT MANAGEMENT (Section 34 & 99)
  // ==========================================
  public getLoans(): LoanRecord[] {
    return [...this.loans];
  }

  public getLoanById(id: string): LoanRecord | undefined {
    return this.loans.find((l) => l.id === id);
  }

  public getLoanRepayments(loanId?: string): LoanRepaymentRecord[] {
    if (loanId) {
      return this.loanRepayments.filter((r) => r.loanId === loanId);
    }
    return [...this.loanRepayments];
  }

  public createLoan(loanData: {
    loanNumber: string;
    lenderName: string;
    loanType: LoanRecord['loanType'];
    principalAmount: number;
    interestRate: number;
    interestType?: LoanRecord['interestType'];
    tenureMonths: number;
    emiAmount?: number;
    startDate: string;
    endDate?: string;
    loanDate?: string;
    paymentFrequency?: LoanRecord['paymentFrequency'];
    bankAccountId: string;
    collateral?: string;
    documents?: string;
    remarks?: string;
    status?: LoanRecord['status'];
    notes?: string;
  }): LoanRecord {
    // Calculate EMI if not provided
    let calculatedEmi = loanData.emiAmount;
    if (!calculatedEmi || calculatedEmi <= 0) {
      const p = loanData.principalAmount;
      const r = loanData.interestRate / 12 / 100;
      const n = loanData.tenureMonths;
      if (r === 0 || n === 0) {
        calculatedEmi = n > 0 ? Math.round(p / n) : p;
      } else {
        calculatedEmi = Math.round((p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
      }
    }

    // Auto-calculate end date if not provided
    let endDate = loanData.endDate;
    if (!endDate && loanData.startDate) {
      const d = new Date(loanData.startDate);
      d.setMonth(d.getMonth() + (loanData.tenureMonths || 12));
      endDate = d.toISOString().split('T')[0];
    }

    const initialStatus = loanData.status || 'Active';
    const loanId = `loan-${Date.now()}`;

    const newLoan: LoanRecord = {
      id: loanId,
      loanNumber: loanData.loanNumber || `LN-2026-${String(this.loans.length + 1).padStart(4, '0')}`,
      lenderName: loanData.lenderName,
      loanType: loanData.loanType || 'Term Loan',
      principalAmount: loanData.principalAmount,
      interestRate: loanData.interestRate,
      interestType: loanData.interestType || 'Reducing Balance',
      tenureMonths: loanData.tenureMonths,
      emiAmount: calculatedEmi,
      startDate: loanData.startDate,
      endDate: endDate || loanData.startDate,
      loanDate: loanData.loanDate || loanData.startDate,
      paymentFrequency: loanData.paymentFrequency || 'Monthly',
      bankAccountId: loanData.bankAccountId,
      collateral: loanData.collateral || '',
      documents: loanData.documents || '',
      remarks: loanData.remarks || '',
      totalPrincipalRepaid: 0,
      totalInterestPaid: 0,
      outstandingPrincipal: loanData.principalAmount,
      status: initialStatus,
      notes: loanData.notes || loanData.remarks || '',
    };

    // If initial status is Active, post disbursement journal immediately
    if (initialStatus === 'Active') {
      const bank = this.bankAccounts.find((acc) => acc.id === newLoan.bankAccountId);
      const bankAccountName = bank ? `${bank.bankName} - ${bank.accountNumber.slice(-4)}` : 'Federal Bank - Current A/c';
      const bankGlCode = bank?.glAccountCode || '1100';

      if (bank) {
        bank.currentBalance += newLoan.principalAmount;
        this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
      }

      // Journal on disbursement: Dr Cash/Bank → Cr Loans Payable.
      const entry = accountingEngine.postJournalEntry({
        referenceType: 'LoanDisbursement',
        referenceId: newLoan.id,
        referenceNumber: newLoan.loanNumber,
        date: newLoan.loanDate || newLoan.startDate,
        narration: `Disbursement of Loan ${newLoan.loanNumber} from ${newLoan.lenderName}: Principal ₹${newLoan.principalAmount}`,
        lines: [
          {
            accountCode: bankGlCode,
            accountName: bankAccountName,
            debit: newLoan.principalAmount,
            credit: 0,
          },
          {
            accountCode: '2200',
            accountName: 'Loans Payable (Bank Borrowings)',
            debit: 0,
            credit: newLoan.principalAmount,
          },
        ],
      });

      newLoan.disbursedDate = newLoan.loanDate || newLoan.startDate;
      newLoan.disbursementJournalId = entry.id;
    }

    this.loans.unshift(newLoan);
    this.persist(STORAGE_KEYS.LOANS, this.loans);

    this.logAudit({
      module: 'Loans & Debt',
      action: 'Create',
      entityId: newLoan.id,
      entityNumber: newLoan.loanNumber,
      details: `Created loan ${newLoan.loanNumber} from ${newLoan.lenderName} for ₹${newLoan.principalAmount} (${newLoan.status})`,
    });

    return newLoan;
  }

  public updateLoan(id: string, updates: Partial<LoanRecord>): LoanRecord {
    const loan = this.loans.find((l) => l.id === id);
    if (!loan) throw new Error('Loan not found');

    Object.assign(loan, updates);
    this.persist(STORAGE_KEYS.LOANS, this.loans);

    this.logAudit({
      module: 'Loans & Debt',
      action: 'Edit',
      entityId: loan.id,
      entityNumber: loan.loanNumber,
      details: `Updated loan ${loan.loanNumber} details / status: ${loan.status}`,
    });

    return loan;
  }

  public disburseLoan(loanId: string, bankAccountId?: string, disbursementDate?: string): LoanRecord {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    if (loan.status === 'Active' || loan.status === 'Completed' || loan.status === 'Closed') {
      throw new Error(`Loan is already ${loan.status}`);
    }

    const bId = bankAccountId || loan.bankAccountId;
    const bank = this.bankAccounts.find((acc) => acc.id === bId);
    const bankAccountName = bank ? `${bank.bankName} - ${bank.accountNumber.slice(-4)}` : 'Federal Bank - Current A/c';
    const bankGlCode = bank?.glAccountCode || '1100';
    const date = disbursementDate || new Date().toISOString().split('T')[0];

    if (bank) {
      bank.currentBalance += loan.principalAmount;
      this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    }

    // Journal on disbursement: Dr Cash/Bank → Cr Loans Payable.
    const entry = accountingEngine.postJournalEntry({
      referenceType: 'LoanDisbursement',
      referenceId: loan.id,
      referenceNumber: loan.loanNumber,
      date,
      narration: `Disbursement of Loan ${loan.loanNumber} from ${loan.lenderName}: Principal ₹${loan.principalAmount}`,
      lines: [
        {
          accountCode: bankGlCode,
          accountName: bankAccountName,
          debit: loan.principalAmount,
          credit: 0,
        },
        {
          accountCode: '2200',
          accountName: 'Loans Payable (Bank Borrowings)',
          debit: 0,
          credit: loan.principalAmount,
        },
      ],
    });

    loan.status = 'Active';
    loan.disbursedDate = date;
    loan.disbursementJournalId = entry.id;
    if (bankAccountId) loan.bankAccountId = bankAccountId;

    this.persist(STORAGE_KEYS.LOANS, this.loans);

    this.logAudit({
      module: 'Loans & Debt',
      action: 'Post',
      entityId: loan.id,
      entityNumber: loan.loanNumber,
      details: `Disbursed loan ${loan.loanNumber} of ₹${loan.principalAmount} to ${bankAccountName}`,
    });

    return loan;
  }

  public deleteLoan(id: string): boolean {
    const idx = this.loans.findIndex((l) => l.id === id);
    if (idx === -1) return false;

    // Check if repayments exist
    const hasRepayments = this.loanRepayments.some((r) => r.loanId === id);
    if (hasRepayments) {
      throw new Error('Cannot delete loan with existing repayment records. Reverse repayments first.');
    }

    const removed = this.loans.splice(idx, 1)[0];
    this.persist(STORAGE_KEYS.LOANS, this.loans);

    this.logAudit({
      module: 'Loans & Debt',
      action: 'Cancel',
      entityId: removed.id,
      entityNumber: removed.loanNumber,
      details: `Deleted loan facility ${removed.loanNumber} from ${removed.lenderName}`,
    });

    return true;
  }

  public postLoanRepayment(repayment: {
    loanId: string;
    repaymentNumber?: string;
    dueDate?: string;
    paymentDate?: string;
    date?: string;
    principalPaid: number;
    interestPaid: number;
    penaltyPaid: number;
    paymentMethod: PaymentTransactionRecord['paymentMethod'];
    accountId: string;
    referenceNumber: string;
    remarks?: string;
    notes?: string;
  }): LoanRepaymentRecord {
    const loan = this.loans.find((l) => l.id === repayment.loanId);
    if (!loan) throw new Error('Loan not found');

    const totalPaid = Math.round((repayment.principalPaid + repayment.interestPaid + (repayment.penaltyPaid || 0)) * 100) / 100;
    const nextNum = this.loanRepayments.length + 1;
    const repaymentNumber = repayment.repaymentNumber || `LRP-2026-${String(nextNum).padStart(4, '0')}`;
    const pDate = repayment.paymentDate || repayment.date || new Date().toISOString().split('T')[0];

    // Deduct from bank
    const b = this.bankAccounts.find((acc) => acc.id === repayment.accountId);
    const bankGlCode = b?.glAccountCode || '1100';
    const bankName = b ? `${b.bankName} - ${b.accountNumber.slice(-4)}` : 'Federal Bank - Current A/c';

    if (b) {
      b.currentBalance -= totalPaid;
      this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
    }

    // Journal Entry:
    // Dr. Loans Payable (2200) = Principal
    // Dr. Interest Expense (6100) = Interest + Penalty
    // Cr. Cash/Bank (1100 or bank GL) = Total Paid
    const journalEntry = accountingEngine.postJournalEntry({
      referenceType: 'LoanRepayment',
      referenceId: `lrp-${Date.now()}`,
      referenceNumber: repayment.referenceNumber || repaymentNumber,
      date: pDate,
      narration: `EMI Repayment for ${loan.loanNumber} (${loan.lenderName}): Principal ₹${repayment.principalPaid}, Interest ₹${repayment.interestPaid}${repayment.penaltyPaid ? `, Penalty ₹${repayment.penaltyPaid}` : ''}`,
      lines: [
        {
          accountCode: '2200',
          accountName: 'Loans Payable (Bank Borrowings)',
          debit: repayment.principalPaid,
          credit: 0,
        },
        {
          accountCode: '6100',
          accountName: 'Bank Charges & Loan Interest',
          debit: repayment.interestPaid + (repayment.penaltyPaid || 0),
          credit: 0,
        },
        {
          accountCode: bankGlCode,
          accountName: bankName,
          debit: 0,
          credit: totalPaid,
        },
      ],
    });

    const newRepayment: LoanRepaymentRecord = {
      id: `lrp-${Date.now()}`,
      loanId: repayment.loanId,
      repaymentNumber,
      date: pDate,
      dueDate: repayment.dueDate,
      paymentDate: pDate,
      principalPaid: repayment.principalPaid,
      interestPaid: repayment.interestPaid,
      penaltyPaid: repayment.penaltyPaid || 0,
      totalPaid,
      paymentMethod: repayment.paymentMethod,
      accountId: repayment.accountId,
      referenceNumber: repayment.referenceNumber,
      remarks: repayment.remarks || repayment.notes,
      notes: repayment.notes || repayment.remarks,
      journalEntryId: journalEntry.id,
    };

    // Update loan record
    loan.totalPrincipalRepaid += repayment.principalPaid;
    loan.totalInterestPaid += repayment.interestPaid;
    loan.outstandingPrincipal = Math.max(0, loan.outstandingPrincipal - repayment.principalPaid);
    if (loan.outstandingPrincipal === 0) {
      loan.status = 'Completed';
    }
    this.persist(STORAGE_KEYS.LOANS, this.loans);

    this.loanRepayments.unshift(newRepayment);
    this.persist(STORAGE_KEYS.LOAN_REPAYMENTS, this.loanRepayments);

    this.logAudit({
      module: 'Loans & Debt',
      action: 'Post',
      entityId: newRepayment.id,
      entityNumber: newRepayment.repaymentNumber,
      details: `Recorded repayment ${newRepayment.repaymentNumber} for ${loan.loanNumber}: Principal ₹${repayment.principalPaid}, Interest ₹${repayment.interestPaid}, Total ₹${totalPaid}`,
    });

    return newRepayment;
  }

  public calculateLoanAmortizationSchedule(loanId: string): LoanAmortizationScheduleItem[] {
    const loan = this.loans.find((l) => l.id === loanId);
    if (!loan) return [];

    const schedule: LoanAmortizationScheduleItem[] = [];
    let currentBalance = loan.principalAmount;
    const monthlyRate = loan.interestRate / 12 / 100;
    const tenure = loan.tenureMonths || 12;
    const emi = loan.emiAmount;
    const repayments = this.getLoanRepayments(loanId);

    const startDate = new Date(loan.startDate);

    for (let i = 1; i <= tenure; i++) {
      if (currentBalance <= 0) break;

      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      let interestComp = Math.round(currentBalance * monthlyRate);
      let principalComp = Math.min(currentBalance, Math.max(0, emi - interestComp));
      if (i === tenure) {
        principalComp = currentBalance;
      }
      const actualEmi = principalComp + interestComp;
      const endingBalance = Math.max(0, currentBalance - principalComp);

      // Check if this installment was paid
      const repayment = repayments[i - 1];
      const isPastDue = new Date(dueDateStr) < new Date();
      let status: 'Paid' | 'Pending' | 'Overdue' = 'Pending';
      if (repayment) {
        status = 'Paid';
      } else if (isPastDue) {
        status = 'Overdue';
      }

      schedule.push({
        installmentNumber: i,
        dueDate: dueDateStr,
        beginningBalance: currentBalance,
        emiAmount: actualEmi,
        principalComponent: principalComp,
        interestComponent: interestComp,
        endingBalance,
        status,
        paidDate: repayment?.date,
        repaymentId: repayment?.id,
      });

      currentBalance = endingBalance;
    }

    return schedule;
  }

  // ==========================================
  // BUDGET ENGINE: COMMITMENTS & TRANSFERS (Section 51, 52 & 53)
  // ==========================================
  public getBudgetCommitments(): BudgetCommitmentRecord[] {
    return [...this.budgetCommitments];
  }

  public getBudgetTransfers(): BudgetTransferRecord[] {
    return [...this.budgetTransfers];
  }

  public postBudgetTransfer(transfer: {
    sourceCategoryCode: string;
    sourceCategoryName: string;
    destinationCategoryCode: string;
    destinationCategoryName: string;
    amount: number;
    reason: string;
    requestedBy: string;
  }): BudgetTransferRecord {
    const nextNum = this.budgetTransfers.length + 1;
    const transferNumber = `BTR-2026-${String(nextNum).padStart(4, '0')}`;

    const newTransfer: BudgetTransferRecord = {
      id: `btr-${Date.now()}`,
      transferNumber,
      date: new Date().toISOString().split('T')[0],
      sourceCategoryCode: transfer.sourceCategoryCode,
      sourceCategoryName: transfer.sourceCategoryName,
      destinationCategoryCode: transfer.destinationCategoryCode,
      destinationCategoryName: transfer.destinationCategoryName,
      amount: transfer.amount,
      reason: transfer.reason,
      requestedBy: transfer.requestedBy,
      approvedBy: 'Management Board',
      status: 'Approved',
    };

    this.budgetTransfers.unshift(newTransfer);
    this.persist(STORAGE_KEYS.BUDGET_TRANSFERS, this.budgetTransfers);

    this.logAudit({
      module: 'Budget Transfers',
      action: 'Approve',
      entityId: newTransfer.id,
      entityNumber: newTransfer.transferNumber,
      details: `Reallocated budget ₹${transfer.amount} from ${transfer.sourceCategoryName} to ${transfer.destinationCategoryName}`,
    });

    return newTransfer;
  }

  // ==========================================
  // APPROVAL ENGINE (Section 1)
  // ==========================================
  public getApprovalRequests(): ApprovalRequestRecord[] {
    return [...this.approvals];
  }

  public processApprovalAction(params: {
    requestId: string;
    action: 'Approve' | 'Reject';
    approverName: string;
    comment?: string;
  }): ApprovalRequestRecord {
    const req = this.approvals.find((a) => a.id === params.requestId);
    if (!req) throw new Error('Approval request not found');

    if (req.entityType === 'Payment') {
      if (params.action === 'Approve') {
        this.approvePaymentStep(req.entityId, params.approverName, undefined, params.comment);
      } else {
        this.rejectPayment(req.entityId, params.approverName, params.comment || 'Rejected by approver');
      }
      return req;
    }

    if (params.action === 'Reject') {
      req.status = 'Rejected';
      req.comments = params.comment || 'Rejected by approver';
    } else {
      req.approvedTiers.push({
        tier: req.currentTier,
        approverName: params.approverName,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        comment: params.comment,
      });

      // Find next required tier
      const currentIdx = req.requiredTiers.indexOf(req.currentTier);
      if (currentIdx < req.requiredTiers.length - 1) {
        req.currentTier = req.requiredTiers[currentIdx + 1];
      } else {
        req.status = 'Approved';
      }
    }

    this.persist(STORAGE_KEYS.APPROVAL_REQUESTS, this.approvals);
    this.emitEvent('erp_approvals_changed', this.approvals);

    this.logAudit({
      module: 'Approval Engine',
      action: params.action === 'Approve' ? 'Approve' : 'Reject',
      entityId: req.entityId,
      entityNumber: req.entityNumber,
      details: `${params.action}d by ${params.approverName} for ${req.entityType} (${req.entityNumber})`,
    });

    return req;
  }

  // ==========================================
  // YEAR-END CLOSING (Section 61)
  // ==========================================
  public performYearEndClosing(closingDate: string, closedBy: string): {
    closingJournalEntry: JournalEntry;
    netProfit: number;
  } {
    const pnl = accountingEngine.getProfitAndLossStatement();
    const netProfit = pnl.netProfit;

    // Journal Entry to transfer Net Profit to Retained Earnings
    // Dr. Current Year Earnings (3200)
    // Cr. Retained Earnings (3100)
    const je = accountingEngine.postJournalEntry({
      referenceType: 'ManualJournal',
      referenceId: `YEC-${COMPANY_CONFIG.financialYear}`,
      referenceNumber: `YEC-2026-FINAL`,
      date: closingDate,
      narration: `Year-End Closing FY 2026-27: Net Profit ₹${netProfit} transferred to Retained Earnings`,
      lines: [
        {
          accountCode: '3200',
          accountName: 'Current Year Earnings (Surplus)',
          debit: netProfit,
          credit: 0,
        },
        {
          accountCode: '3100',
          accountName: 'Retained Earnings',
          debit: 0,
          credit: netProfit,
        },
      ],
      createdBy: closedBy,
    });

    this.logAudit({
      module: 'Year-End Closing',
      action: 'YearEndClose',
      entityId: je.id,
      entityNumber: je.entryNumber,
      details: `Year-End closing completed by ${closedBy}. Net Surplus of ₹${netProfit} transferred to Retained Earnings.`,
    });

    return {
      closingJournalEntry: je,
      netProfit,
    };
  }

  // ==========================================
  // EXPENSES & RECURRING EXPENSES MODULE
  // ==========================================

  public getExpenses(): ExpenseRecord[] {
    return [...this.expenses];
  }

  public getExpenseById(id: string): ExpenseRecord | undefined {
    return this.expenses.find((e) => e.id === id || e.expenseNumber === id);
  }

  public saveExpense(data: Partial<ExpenseRecord> & {
    categoryId: string;
    amount: number;
    description: string;
  }): ExpenseRecord {
    const isNew = !data.id || !this.expenses.some((e) => e.id === data.id);
    const category = this.expenseCategories.find((c) => c.id === data.categoryId);
    const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : 0;
    const amount = Number(data.amount) || 0;
    const taxAmount = data.taxAmount !== undefined ? Number(data.taxAmount) : Math.round((amount * taxRate) / 100);
    const totalAmount = data.totalAmount !== undefined ? Number(data.totalAmount) : (amount + taxAmount);

    let saved: ExpenseRecord;

    if (isNew) {
      const count = this.expenses.length + 1;
      const expenseNumber = data.expenseNumber || `EXP-2026-${String(count).padStart(4, '0')}`;
      const id = data.id || `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      saved = {
        id,
        expenseNumber,
        date: data.date || new Date().toISOString().split('T')[0],
        categoryId: data.categoryId,
        categoryName: data.categoryName || category?.name || 'General',
        subCategory: data.subCategory,
        partyId: data.partyId,
        partyName: data.partyName,
        department: data.department || 'Operations',
        branch: data.branch || 'Headquarters',
        project: data.project,
        costCenter: data.costCenter,
        amount,
        taxRate,
        taxAmount,
        totalAmount,
        paymentMethod: data.paymentMethod || 'Bank Transfer',
        cashBankAccountId: data.cashBankAccountId,
        cashBankAccountName: data.cashBankAccountName,
        cashBankAccountGlCode: data.cashBankAccountGlCode || '1100',
        description: data.description,
        attachment: data.attachment,
        remarks: data.remarks,
        status: data.status || 'Draft',
        createdAt: new Date().toISOString(),
        createdBy: data.createdBy || 'Finance User',
      };

      this.expenses.unshift(saved);

      this.logAudit({
        module: 'Expenses',
        action: 'Create',
        entityId: saved.id,
        entityNumber: saved.expenseNumber,
        details: `Created expense ${saved.expenseNumber} for ${saved.categoryName} ₹${saved.totalAmount.toLocaleString('en-IN')}`,
      });
    } else {
      const index = this.expenses.findIndex((e) => e.id === data.id);
      const existing = this.expenses[index];

      saved = {
        ...existing,
        ...data,
        categoryName: data.categoryName || category?.name || existing.categoryName,
        amount,
        taxRate,
        taxAmount,
        totalAmount,
      };

      this.expenses[index] = saved;

      this.logAudit({
        module: 'Expenses',
        action: 'Edit',
        entityId: saved.id,
        entityNumber: saved.expenseNumber,
        details: `Updated expense ${saved.expenseNumber} (${saved.categoryName} ₹${saved.totalAmount.toLocaleString('en-IN')})`,
      });
    }

    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);
    return saved;
  }

  public submitExpense(id: string, submittedBy?: string): ExpenseRecord {
    const expense = this.getExpenseById(id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status !== 'Draft') {
      throw new Error(`Expense cannot be submitted from status ${expense.status}`);
    }

    expense.status = 'Pending Approval';
    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);

    this.logAudit({
      module: 'Expenses',
      action: 'Edit',
      entityId: expense.id,
      entityNumber: expense.expenseNumber,
      details: `Submitted expense ${expense.expenseNumber} by ${submittedBy || 'Requester'} for approval`,
    });

    return expense;
  }

  /**
   * Approves an Expense:
   * 1. Updates status to 'Approved' (or 'Paid' if immediately settled)
   * 2. Updates Expense Category Master actual spend
   * 3. Records actual expenditure in monthly budget module
   * 4. Updates Party balance / records ledger if payee is linked
   * 5. Posts double-entry Journal Entry (Accounting Foundation):
   *    Dr. Expense Account (Category GL Code 5200-5900)
   *    Dr. Input Tax Credit (1400) if taxAmount > 0
   *    Cr. Cash/Bank (1100/1000) if paid, or Cr. Accounts Payable (2000) if accrued
   */
  public approveExpense(id: string, approverName: string = 'Finance Manager', options?: { immediatePayment?: boolean }): ExpenseRecord {
    const expense = this.getExpenseById(id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status === 'Approved' || expense.status === 'Paid') {
      return expense;
    }
    if (expense.status === 'Cancelled' || expense.status === 'Rejected') {
      throw new Error(`Cannot approve expense in ${expense.status} status.`);
    }

    const category = this.expenseCategories.find((c) => c.id === expense.categoryId || c.name === expense.categoryName);
    const glAccountCode = category?.glAccountCode || accountingEngine.ensureExpenseAccount(expense.categoryName).code;

    // 1. Update Category Master spend
    if (category) {
      category.actualSpend = (category.actualSpend || 0) + expense.amount;
      this.persist(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories);
    }

    // 2. Update Budget Actual via financeStorage
    const expDate = new Date(expense.date);
    const monthNames: MonthShort[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[expDate.getMonth()] || 'Sep';
    const year = expDate.getFullYear() || 2026;

    try {
      financeStorage.addTransaction({
        date: expense.date,
        month,
        year,
        category: expense.categoryName,
        department: expense.department || 'Operations',
        amount: expense.amount,
        vendor: expense.partyName || 'Various',
        paymentMode: (expense.paymentMethod === 'Cash' ? 'Bank Transfer' : expense.paymentMethod) as any,
        invoiceRef: expense.expenseNumber,
        description: `[${expense.expenseNumber}] ${expense.description}`,
        status: 'Approved',
        approvedBy: approverName,
      });
    } catch (e) {
      console.warn('Failed to sync expense with budget actuals', e);
    }

    // 3. Post balanced Journal Entry (Accounting Foundation, Sec 99)
    const lines = [
      {
        accountCode: glAccountCode,
        accountName: category?.glAccountName || `${expense.categoryName} Expense`,
        debit: expense.amount,
        credit: 0,
      },
    ];

    if (expense.taxAmount && expense.taxAmount > 0) {
      lines.push({
        accountCode: '1400',
        accountName: 'Input Tax Credit (GST Receivable)',
        debit: expense.taxAmount,
        credit: 0,
      });
    }

    const isImmediateSettlement = options?.immediatePayment || (expense.status as string) === 'Paid';
    if (isImmediateSettlement) {
      lines.push({
        accountCode: expense.cashBankAccountGlCode || '1100',
        accountName: expense.cashBankAccountName || 'Cash / Bank Clearing',
        debit: 0,
        credit: expense.totalAmount,
      });

      // Update cash/bank balance
      this.deductCashBankBalance(expense.cashBankAccountId, expense.totalAmount);
    } else {
      // Accrued: Credit Accounts Payable
      lines.push({
        accountCode: '2000',
        accountName: 'Accounts Payable (Trade)',
        debit: 0,
        credit: expense.totalAmount,
      });
    }

    const je = accountingEngine.postJournalEntry({
      referenceType: 'Expense',
      referenceId: expense.id,
      referenceNumber: expense.expenseNumber,
      date: expense.date,
      narration: `Expense booking ${expense.expenseNumber} - ${expense.categoryName} (${expense.description})`,
      lines,
      createdBy: approverName,
    });

    expense.status = isImmediateSettlement ? 'Paid' : 'Approved';
    expense.approvedBy = approverName;
    expense.approvedAt = new Date().toISOString();
    expense.journalEntryId = je.id;
    expense.journalEntryNumber = je.entryNumber;

    // 4. Update linked party balance if applicable
    if (expense.partyId) {
      const party = this.parties.find((p) => p.id === expense.partyId);
      if (party) {
        if (!isImmediateSettlement) {
          // Outstanding increases for vendor
          party.currentBalance += expense.totalAmount;
        }
        this.persist(STORAGE_KEYS.PARTIES, this.parties);
      }
    }

    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);

    this.logAudit({
      module: 'Expenses',
      action: 'Approve',
      entityId: expense.id,
      entityNumber: expense.expenseNumber,
      details: `Approved expense ${expense.expenseNumber} (${expense.categoryName} ₹${expense.totalAmount.toLocaleString('en-IN')}) by ${approverName}. Posted JE ${je.entryNumber}.`,
    });

    return expense;
  }

  public rejectExpense(id: string, reason: string, rejectedBy: string = 'Finance Manager'): ExpenseRecord {
    const expense = this.getExpenseById(id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status === 'Approved' || expense.status === 'Paid') {
      throw new Error('Cannot reject an already approved or paid expense.');
    }

    expense.status = 'Rejected';
    expense.rejectionReason = reason;
    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);

    this.logAudit({
      module: 'Expenses',
      action: 'Reject',
      entityId: expense.id,
      entityNumber: expense.expenseNumber,
      details: `Rejected expense ${expense.expenseNumber}: ${reason} (by ${rejectedBy})`,
    });

    return expense;
  }

  /**
   * Marks an Approved expense as Paid and posts payment settlement journal entry:
   * Dr. Accounts Payable (2000)
   * Cr. Cash / Bank Account (1100/1000)
   */
  public payExpense(id: string, paymentDetails?: {
    paymentMethod?: string;
    cashBankAccountId?: string;
    cashBankAccountName?: string;
    cashBankAccountGlCode?: string;
    paidBy?: string;
  }): ExpenseRecord {
    const expense = this.getExpenseById(id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status === 'Paid') return expense;
    if (expense.status !== 'Approved') {
      throw new Error(`Expense must be in Approved status before payment. Current status: ${expense.status}`);
    }

    const payMethod = paymentDetails?.paymentMethod || expense.paymentMethod || 'Bank Transfer';
    const bankAccId = paymentDetails?.cashBankAccountId || expense.cashBankAccountId;
    const bankAccName = paymentDetails?.cashBankAccountName || expense.cashBankAccountName || 'Federal Bank - Current A/c (Primary)';
    const bankGlCode = paymentDetails?.cashBankAccountGlCode || expense.cashBankAccountGlCode || '1100';

    // Post settlement journal entry if accrued previously
    const je = accountingEngine.postJournalEntry({
      referenceType: 'Payment',
      referenceId: expense.id,
      referenceNumber: `PAY-${expense.expenseNumber}`,
      date: new Date().toISOString().split('T')[0],
      narration: `Payment settlement for expense ${expense.expenseNumber} to ${expense.partyName || expense.categoryName}`,
      lines: [
        {
          accountCode: '2000',
          accountName: 'Accounts Payable (Trade)',
          debit: expense.totalAmount,
          credit: 0,
        },
        {
          accountCode: bankGlCode,
          accountName: bankAccName,
          debit: 0,
          credit: expense.totalAmount,
        },
      ],
      createdBy: paymentDetails?.paidBy || 'Finance Cashier',
    });

    // Deduct Cash/Bank Balance
    this.deductCashBankBalance(bankAccId, expense.totalAmount);

    // If party was linked, decrease vendor balance
    if (expense.partyId) {
      const party = this.parties.find((p) => p.id === expense.partyId);
      if (party) {
        party.currentBalance = Math.max(0, party.currentBalance - expense.totalAmount);
        this.persist(STORAGE_KEYS.PARTIES, this.parties);
      }
    }

    expense.status = 'Paid';
    expense.paymentMethod = payMethod as ExpenseRecord['paymentMethod'];
    expense.cashBankAccountId = bankAccId;
    expense.cashBankAccountName = bankAccName;
    expense.cashBankAccountGlCode = bankGlCode;
    expense.paidAt = new Date().toISOString();
    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);

    this.logAudit({
      module: 'Expenses',
      action: 'Post',
      entityId: expense.id,
      entityNumber: expense.expenseNumber,
      details: `Settled payment ₹${expense.totalAmount.toLocaleString('en-IN')} for ${expense.expenseNumber} via ${payMethod}. Settlement JE ${je.entryNumber}.`,
    });

    return expense;
  }

  public cancelExpense(id: string, reason?: string, cancelledBy: string = 'Admin'): ExpenseRecord {
    const expense = this.getExpenseById(id);
    if (!expense) throw new Error('Expense not found');
    if (expense.status === 'Paid') {
      throw new Error('Cannot cancel a Paid expense. Please process an adjustment or refund journal.');
    }

    expense.status = 'Cancelled';
    expense.remarks = `${expense.remarks ? expense.remarks + ' | ' : ''}Cancelled: ${reason || 'By User'}`;
    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);

    this.logAudit({
      module: 'Expenses',
      action: 'Cancel',
      entityId: expense.id,
      entityNumber: expense.expenseNumber,
      details: `Cancelled expense ${expense.expenseNumber}. Reason: ${reason || 'N/A'} (by ${cancelledBy})`,
    });

    return expense;
  }

  public deleteExpense(id: string): boolean {
    const expense = this.getExpenseById(id);
    if (!expense) return false;
    if (expense.status !== 'Draft' && expense.status !== 'Cancelled') {
      throw new Error(`Cannot delete expense with status ${expense.status}. Only Draft or Cancelled expenses may be removed.`);
    }

    this.expenses = this.expenses.filter((e) => e.id !== id);
    this.persist(STORAGE_KEYS.EXPENSES, this.expenses);

    this.logAudit({
      module: 'Expenses',
      action: 'Cancel',
      entityId: id,
      entityNumber: expense.expenseNumber,
      details: `Deleted draft/cancelled expense ${expense.expenseNumber}`,
    });

    return true;
  }

  private deductCashBankBalance(accountId?: string, amount: number = 0) {
    if (!accountId || amount <= 0) return;
    const bank = this.bankAccounts.find((b) => b.id === accountId);
    if (bank) {
      bank.currentBalance -= amount;
      this.persist(STORAGE_KEYS.BANK_ACCOUNTS, this.bankAccounts);
      return;
    }
    const cash = this.cashAccounts.find((c) => c.id === accountId);
    if (cash) {
      cash.currentBalance -= amount;
      this.persist(STORAGE_KEYS.CASH_ACCOUNTS, this.cashAccounts);
    }
  }

  // --- Category Master ---

  public getExpenseCategories(): ExpenseCategoryMaster[] {
    return [...this.expenseCategories];
  }

  public getExpenseCategoryById(id: string): ExpenseCategoryMaster | undefined {
    return this.expenseCategories.find((c) => c.id === id || c.code === id);
  }

  public createExpenseCategory(data: {
    name: string;
    subCategories?: string[];
    allocatedBudget?: number;
    description?: string;
    color?: string;
    preferredGlCode?: string;
  }): ExpenseCategoryMaster {
    // Auto-creates matching GL Expense account (5200–5900 range) on creation!
    const glAccount = accountingEngine.ensureExpenseAccount(
      data.name,
      data.preferredGlCode,
      data.description || `${data.name} Operating Expenses`
    );

    const code = `CAT-${data.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X')}`;
    const id = `cat-${Date.now().toString(36)}`;

    const newCat: ExpenseCategoryMaster = {
      id,
      name: data.name,
      code,
      glAccountCode: glAccount.code,
      glAccountName: glAccount.name,
      subCategories: data.subCategories && data.subCategories.length > 0 ? data.subCategories : ['General'],
      description: data.description || `${data.name} corporate operational expenses`,
      allocatedBudget: Number(data.allocatedBudget) || 100000,
      actualSpend: 0,
      color: data.color || '#0B5D2A',
      isSystem: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    this.expenseCategories.push(newCat);
    this.persist(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories);

    this.logAudit({
      module: 'Expense Categories',
      action: 'Create',
      entityId: newCat.id,
      entityNumber: newCat.code,
      details: `Created custom expense category "${newCat.name}" with matching GL account ${glAccount.code} (${glAccount.name})`,
    });

    return newCat;
  }

  public updateExpenseCategory(id: string, updates: Partial<ExpenseCategoryMaster>): ExpenseCategoryMaster {
    const cat = this.expenseCategories.find((c) => c.id === id);
    if (!cat) throw new Error('Category not found');

    Object.assign(cat, updates);
    this.persist(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories);

    this.logAudit({
      module: 'Expense Categories',
      action: 'Edit',
      entityId: cat.id,
      entityNumber: cat.code,
      details: `Updated category "${cat.name}"`,
    });

    return cat;
  }

  public deleteExpenseCategory(id: string): boolean {
    const cat = this.expenseCategories.find((c) => c.id === id);
    if (!cat) return false;
    if (cat.isSystem) {
      throw new Error('System standard categories cannot be deleted.');
    }
    const hasExpenses = this.expenses.some((e) => e.categoryId === id);
    if (hasExpenses) {
      throw new Error(`Cannot delete category "${cat.name}" because expenses are linked to it.`);
    }

    this.expenseCategories = this.expenseCategories.filter((c) => c.id !== id);
    this.persist(STORAGE_KEYS.EXPENSE_CATEGORIES, this.expenseCategories);

    this.logAudit({
      module: 'Expense Categories',
      action: 'Cancel',
      entityId: id,
      entityNumber: cat.code,
      details: `Deleted expense category "${cat.name}"`,
    });

    return true;
  }

  // --- Recurring Expense Templates ---

  public getRecurringTemplates(): RecurringTemplate[] {
    return [...this.recurringTemplates];
  }

  public getRecurringTemplateById(id: string): RecurringTemplate | undefined {
    return this.recurringTemplates.find((r) => r.id === id);
  }

  public saveRecurringTemplate(data: Partial<RecurringTemplate> & {
    templateName: string;
    categoryId: string;
    amount: number;
    frequency: RecurringTemplate['frequency'];
  }): RecurringTemplate {
    const isNew = !data.id || !this.recurringTemplates.some((r) => r.id === data.id);
    const category = this.expenseCategories.find((c) => c.id === data.categoryId);
    const taxRate = data.taxRate ? Number(data.taxRate) : 0;
    const amount = Number(data.amount) || 0;
    const taxAmount = data.taxAmount !== undefined ? Number(data.taxAmount) : Math.round((amount * taxRate) / 100);
    const totalAmount = data.totalAmount !== undefined ? Number(data.totalAmount) : (amount + taxAmount);

    let saved: RecurringTemplate;

    if (isNew) {
      const id = data.id || `rec-tpl-${Date.now()}`;
      saved = {
        id,
        templateName: data.templateName,
        frequency: data.frequency,
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        endDate: data.endDate,
        occurrencesLimit: data.occurrencesLimit,
        occurrencesCompleted: 0,
        postingMode: data.postingMode || 'Draft-for-review',
        categoryId: data.categoryId,
        categoryName: data.categoryName || category?.name || 'General',
        subCategory: data.subCategory,
        partyId: data.partyId,
        partyName: data.partyName,
        department: data.department || 'Operations',
        branch: data.branch || 'Headquarters',
        project: data.project,
        costCenter: data.costCenter,
        amount,
        taxRate,
        taxAmount,
        totalAmount,
        paymentMethod: data.paymentMethod || 'Bank Transfer',
        cashBankAccountId: data.cashBankAccountId,
        cashBankAccountName: data.cashBankAccountName,
        cashBankAccountGlCode: data.cashBankAccountGlCode || '1100',
        description: data.description || data.templateName,
        nextDueDate: data.nextDueDate || data.startDate || new Date().toISOString().split('T')[0],
        status: data.status || 'Active',
        createdAt: new Date().toISOString().split('T')[0],
        remarks: data.remarks,
      };

      this.recurringTemplates.unshift(saved);

      this.logAudit({
        module: 'Recurring Expenses',
        action: 'Create',
        entityId: saved.id,
        entityNumber: saved.templateName,
        details: `Created recurring template "${saved.templateName}" (${saved.frequency} - ₹${saved.totalAmount.toLocaleString('en-IN')})`,
      });
    } else {
      const index = this.recurringTemplates.findIndex((r) => r.id === data.id);
      saved = {
        ...this.recurringTemplates[index],
        ...data,
        categoryName: data.categoryName || category?.name || this.recurringTemplates[index].categoryName,
        amount,
        taxRate,
        taxAmount,
        totalAmount,
      };
      this.recurringTemplates[index] = saved;

      this.logAudit({
        module: 'Recurring Expenses',
        action: 'Edit',
        entityId: saved.id,
        entityNumber: saved.templateName,
        details: `Updated recurring template "${saved.templateName}"`,
      });
    }

    this.persist(STORAGE_KEYS.RECURRING_TEMPLATES, this.recurringTemplates);
    return saved;
  }

  public deleteRecurringTemplate(id: string): boolean {
    const tpl = this.getRecurringTemplateById(id);
    if (!tpl) return false;

    this.recurringTemplates = this.recurringTemplates.filter((r) => r.id !== id);
    this.persist(STORAGE_KEYS.RECURRING_TEMPLATES, this.recurringTemplates);

    this.logAudit({
      module: 'Recurring Expenses',
      action: 'Cancel',
      entityId: id,
      entityNumber: tpl.templateName,
      details: `Deleted recurring template "${tpl.templateName}"`,
    });

    return true;
  }

  public toggleRecurringTemplateStatus(id: string): RecurringTemplate {
    const tpl = this.getRecurringTemplateById(id);
    if (!tpl) throw new Error('Template not found');

    tpl.status = tpl.status === 'Active' ? 'Paused' : 'Active';
    this.persist(STORAGE_KEYS.RECURRING_TEMPLATES, this.recurringTemplates);

    this.logAudit({
      module: 'Recurring Expenses',
      action: 'Edit',
      entityId: tpl.id,
      entityNumber: tpl.templateName,
      details: `Toggled recurring template status to "${tpl.status}" for "${tpl.templateName}"`,
    });

    return tpl;
  }

  /**
   * Generates expenses from due recurring templates.
   * If templateId is provided, forces execution for that template.
   * Advances nextDueDate according to frequency.
   */
  public processDueRecurringTemplates(templateId?: string): { generatedExpenses: ExpenseRecord[]; count: number } {
    const today = new Date().toISOString().split('T')[0];
    const templatesToProcess = this.recurringTemplates.filter((t) => {
      if (templateId) return t.id === templateId;
      if (t.status !== 'Active') return false;
      return t.nextDueDate <= today;
    });

    const generatedExpenses: ExpenseRecord[] = [];

    for (const tpl of templatesToProcess) {
      const exp = this.saveExpense({
        date: tpl.nextDueDate,
        categoryId: tpl.categoryId,
        categoryName: tpl.categoryName,
        subCategory: tpl.subCategory,
        partyId: tpl.partyId,
        partyName: tpl.partyName,
        department: tpl.department,
        branch: tpl.branch,
        project: tpl.project,
        costCenter: tpl.costCenter,
        amount: tpl.amount,
        taxRate: tpl.taxRate,
        taxAmount: tpl.taxAmount,
        totalAmount: tpl.totalAmount,
        paymentMethod: tpl.paymentMethod,
        cashBankAccountId: tpl.cashBankAccountId,
        cashBankAccountName: tpl.cashBankAccountName,
        cashBankAccountGlCode: tpl.cashBankAccountGlCode,
        description: `[Recurring - ${tpl.frequency}] ${tpl.description}`,
        remarks: `Generated automatically from template: ${tpl.templateName}`,
        status: tpl.postingMode === 'Auto-post' ? 'Draft' : 'Draft',
        createdBy: 'Recurring Engine',
      });

      if (tpl.postingMode === 'Auto-post') {
        const approvedExp = this.approveExpense(exp.id, 'Recurring Scheduler');
        generatedExpenses.push(approvedExp);
      } else {
        generatedExpenses.push(exp);
      }

      // Advance recurrence tracking
      tpl.lastGeneratedDate = tpl.nextDueDate;
      tpl.occurrencesCompleted = (tpl.occurrencesCompleted || 0) + 1;

      if (tpl.occurrencesLimit && tpl.occurrencesCompleted >= tpl.occurrencesLimit) {
        tpl.status = 'Completed';
      } else {
        tpl.nextDueDate = this.calculateNextDueDate(tpl.nextDueDate, tpl.frequency);
      }
    }

    this.persist(STORAGE_KEYS.RECURRING_TEMPLATES, this.recurringTemplates);

    if (generatedExpenses.length > 0) {
      this.logAudit({
        module: 'Recurring Expenses',
        action: 'Post',
        entityId: `batch-${Date.now()}`,
        entityNumber: `Processed ${generatedExpenses.length} templates`,
        details: `Successfully processed ${generatedExpenses.length} recurring expense(s).`,
      });
    }

    return {
      generatedExpenses,
      count: generatedExpenses.length,
    };
  }

  private calculateNextDueDate(currentDateStr: string, frequency: RecurringTemplate['frequency']): string {
    const d = new Date(currentDateStr);
    switch (frequency) {
      case 'Daily':
        d.setDate(d.getDate() + 1);
        break;
      case 'Weekly':
        d.setDate(d.getDate() + 7);
        break;
      case 'Monthly':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'Quarterly':
        d.setMonth(d.getMonth() + 3);
        break;
      case 'Yearly':
        d.setFullYear(d.getFullYear() + 1);
        break;
    }
    return d.toISOString().split('T')[0];
  }
}

export const erpFinanceStorage = new ERPFinanceStorageService();
