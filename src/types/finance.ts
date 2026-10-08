export type MonthShort =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';

export type BudgetHealthStatus = 'Under Budget' | 'On Track' | 'Over Budget';

export interface MonthlyBudgetExpenditure {
  month: MonthShort;
  fullMonth: string;
  monthIndex: number; // 1-12
  year: number;
  budgetLimit: number; // in ₹ INR
  actualExpenditure: number; // in ₹ INR
  committedExpenditure?: number; // POs / encumbered funds
  variance: number; // budgetLimit - actualExpenditure (positive = surplus/under budget)
  variancePercent: number; // actualExpenditure / budgetLimit * 100
  status: BudgetHealthStatus;
  departmentBreakdown?: Record<string, number>;
  categoryBreakdown?: Record<string, number>;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  allocatedBudget: number;
  actualSpend: number;
  color: string;
  iconName?: string;
  description?: string;
}

export type PaymentMode =
  | 'Cash'
  | 'Bank Transfer'
  | 'UPI'
  | 'Card'
  | 'Cheque'
  | 'Other'
  | 'NEFT/RTGS'
  | 'Corporate Card';

export interface ExpenseTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  month: MonthShort;
  year: number;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  department: string;
  paymentMode: PaymentMode;
  invoiceRef: string;
  approvedBy: string;
  status: 'Approved' | 'Paid' | 'Under Review';
  notes?: string;
}

export type ExpenseStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Rejected'
  | 'Paid'
  | 'Cancelled';

export interface ExpenseRecord {
  id: string;
  expenseNumber: string; // e.g. 'EXP-2026-0001'
  date: string; // YYYY-MM-DD
  categoryId: string;
  categoryName: string;
  subCategory: string;
  partyId?: string; // from PartyMaster if vendor/party
  partyName: string; // Payee / Party name
  department: string;
  branch: string;
  project: string;
  costCenter: string;
  amount: number; // Base net amount in ₹
  taxAmount: number; // GST/Tax amount in ₹
  taxRate?: number; // e.g. 0, 5, 12, 18, 28
  totalAmount: number; // amount + taxAmount
  paymentMethod: 'Cash' | 'Bank Transfer' | 'NEFT/RTGS' | 'Corporate Card' | 'Cheque' | 'UPI';
  cashBankAccountId: string;
  cashBankAccountName: string;
  cashBankAccountGlCode: string; // e.g. '1000', '1100', '1110'
  description: string;
  attachment?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  remarks?: string;
  status: ExpenseStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  journalEntryId?: string;
  journalEntryNumber?: string;
  isRecurringGenerated?: boolean;
  recurringTemplateId?: string;
  createdAt: string;
  createdBy: string;
}

export interface ExpenseCategoryMaster {
  id: string;
  name: string; // e.g. Salary, Rent, Electricity, Internet
  code: string; // e.g. CAT-SAL, CAT-RENT
  glAccountCode: string; // 5200-5900
  glAccountName: string;
  subCategories: string[];
  description?: string;
  allocatedBudget: number; // in ₹
  actualSpend: number; // in ₹
  color: string;
  isSystem: boolean;
  createdAt: string;
}

export type RecurringFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
export type RecurringPostingMode = 'Auto-post' | 'Draft-for-review';

export interface RecurringTemplate {
  id: string;
  templateName: string;
  frequency: RecurringFrequency;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  occurrencesLimit?: number; // number of times or undefined for indefinite
  occurrencesCompleted: number;
  postingMode: RecurringPostingMode;
  categoryId: string;
  categoryName: string;
  subCategory: string;
  partyId?: string;
  partyName: string;
  department: string;
  branch: string;
  project: string;
  costCenter: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'NEFT/RTGS' | 'Corporate Card' | 'Cheque' | 'UPI';
  cashBankAccountId: string;
  cashBankAccountName: string;
  cashBankAccountGlCode: string;
  description: string;
  attachment?: string;
  remarks?: string;
  nextDueDate: string; // YYYY-MM-DD
  lastGeneratedDate?: string;
  status: 'Active' | 'Paused' | 'Completed';
  createdAt: string;
}

export interface FinanceDashboardMetrics {
  fiscalYear: number;
  totalAnnualBudget: number;
  totalActualExpenditure: number;
  totalVariance: number;
  overallUtilizationRate: number; // percentage
  averageMonthlyExpenditure: number;
  highestSpendMonth: {
    month: string;
    amount: number;
  };
  lowestSpendMonth: {
    month: string;
    amount: number;
  };
  overBudgetMonthsCount: number;
  activeTransactionsCount: number;
}

export interface CategoryBudgetCapConfig {
  categoryId: string;
  categoryName: string;
  code: string;
  department: string;
  annualCap: number; // in ₹ INR
  monthlyCaps: Record<MonthShort, number>; // in ₹ INR
  color: string;
  description?: string;
  alertThresholdPercent?: number; // per-category threshold, e.g. 90%
  isHardCap?: boolean; // whether cap blocks transactions
}

export interface FinanceModuleSettings {
  fiscalYear: number;
  fiscalYearStartMonth: MonthShort; // e.g. 'Jan' or 'Apr'
  currency: string;
  currencySymbol: string;
  defaultAlertThresholdPercent: number; // e.g., 90
  enforceHardCaps: boolean; // if true, warns strongly or restricts
  autoSyncMonthlyBudgetLimits: boolean; // sync MonthlyBudgetExpenditure.budgetLimit with sum of category caps
  planStatus: 'Draft' | 'Under Review' | 'Approved' | 'Locked';
  approvedBy: string;
  approvedDate: string;
  planVersion: string;
  notes: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface MonthlyCategoryCapSummary {
  month: MonthShort;
  fullMonth: string;
  monthIndex: number;
  year: number;
  totalMonthlyCap: number;
  totalActualSpend: number;
  remainingHeadroom: number;
  utilizationRate: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    cap: number;
    actualSpend: number;
    headroom: number;
    utilizationRate: number;
    isOverCap: boolean;
    isNearThreshold: boolean;
    color: string;
  }[];
}

export interface VendorBankDetails {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  beneficiaryName: string;
}

export interface Vendor {
  id: string; // e.g. VND-001
  code: string; // e.g. AWS-01
  name: string;
  legalName?: string;
  categoryId: string; // linked to CategoryBudgetCapConfig or ExpenseCategory
  categoryName: string; // e.g. "Campus IT & Cloud Infrastructure"
  department: string; // e.g. "IT & Tech"
  contactPerson: string;
  email: string;
  phone: string;
  gstin: string;
  pan?: string;
  address: string;
  city: string;
  state: string;
  paymentTerms: 'Immediate' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60';
  bankDetails?: VendorBankDetails;
  status: 'Active' | 'Under Review' | 'Inactive' | 'On Hold';
  rating?: number; // 1 to 5
  notes?: string;
  createdDate: string; // YYYY-MM-DD
}

export interface VendorInvoice {
  id: string; // e.g. INV-2026-041
  invoiceNumber: string;
  vendorId: string;
  vendorName: string;
  categoryId: string;
  categoryName: string;
  department: string;
  description: string;
  invoiceDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  amount: number; // gross amount in ₹
  taxAmount?: number; // GST in ₹
  tdsAmount?: number; // TDS in ₹
  paidAmount: number;
  pendingAmount: number;
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  paymentMode?: PaymentMode;
  purchaseOrderRef?: string;
  referenceTransactionId?: string; // linked ExpenseTransaction ID
  paidDate?: string;
  notes?: string;
}

export interface VendorPaymentRecord {
  id: string; // e.g. PAY-2026-001
  paymentDate: string; // YYYY-MM-DD
  vendorId: string;
  vendorName: string;
  invoiceId: string;
  invoiceNumber: string;
  categoryId: string;
  categoryName: string;
  department: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber: string; // UTR / Cheque / Ref ID
  approvedBy: string;
  status: 'Completed' | 'Processing';
  notes?: string;
  linkedTransactionId?: string;
}

export interface VendorSummaryMetrics {
  totalVendors: number;
  activeVendors: number;
  totalPayablesPending: number;
  overduePayables: number;
  overdueInvoicesCount: number;
  pendingInvoicesCount: number;
  totalPaidYTD: number;
  totalTransactionsCount: number;
}

export interface DailyTrajectoryPoint {
  day: number;
  dayLabel: string;
  actualSpend: number | null;
  projectedSpend: number;
  budgetCeiling: number;
  proratedBudget: number;
  isBreach?: boolean;
}

export interface CategoryBurnProjection {
  categoryId: string;
  categoryName: string;
  code: string;
  department: string;
  monthlyCap: number;
  currentSpend: number;
  dailyBurnRate: number;
  projectedEOMSpend: number;
  projectedVariance: number; // positive = surplus, negative = overrun
  projectedVariancePercent: number; // projectedSpend / monthlyCap * 100
  status: BudgetHealthStatus;
  depletionDay: number | null;
  safeRemainingDailyBurn: number;
  color: string;
}

export interface BudgetProjectionSummary {
  month: MonthShort;
  fullMonth: string;
  year: number;
  daysInMonth: number;
  daysElapsed: number;
  daysRemaining: number;
  currentSpend: number;
  monthlyBudgetLimit: number;
  dailyBurnRate: number;
  idealLinearDailyBurn: number;
  projectedEOMSpend: number;
  projectedVariance: number;
  projectedVariancePercent: number;
  status: BudgetHealthStatus;
  depletionDay: number | null;
  isBreachProjected: boolean;
  safeRemainingDailyBurn: number;
  burnRateMultiplier: number; // 1.0 = standard, 1.2 = +20%
  categoryProjections: CategoryBurnProjection[];
  dailyTrajectory: DailyTrajectoryPoint[];
}

export interface VendorSpendBudgetContribution {
  vendorId: string;
  vendorName: string;
  vendorCode: string;
  categoryName: string;
  categoryId: string;
  department: string;
  totalInvoiced: number; // gross billed amount
  totalPaid: number; // settled payments
  totalPending: number; // outstanding liabilities
  effectiveSpend: number; // active spend benchmark
  categoryBudgetCap: number; // allocated budget for linked category
  categorySpendSharePercent: number; // % of linked category budget consumed by this vendor
  totalInstitutionBudget: number; // total overall institution budget limit
  totalBudgetContributionPercent: number; // % of total institution budget consumed by this vendor
  procurementSharePercent: number; // % of overall vendor procurement pool
  cumulativeProcurementPercent: number; // running cumulative % for Pareto analysis
  concentrationRisk: 'High' | 'Moderate' | 'Low';
  primaryCostDriver: string;
  costOptimizationStrategy: string;
  potentialAnnualSavings: number;
  paymentTerms: string;
  invoicesCount: number;
  paymentsCount: number;
  color: string;
  rank: number;
}

export interface VendorSpendAnalysisSummary {
  timeframe: 'Annual' | 'Monthly';
  fiscalYear: number;
  month: MonthShort;
  totalInstitutionBudget: number;
  totalProcurementSpend: number;
  procurementToBudgetRatio: number; // % of institutional budget consumed by external vendors
  totalActiveVendors: number;
  topVendorsConcentrationRatio: number; // % of procurement taken by Top 3 vendors
  highestBudgetVendor: VendorSpendBudgetContribution | null;
  totalPotentialSavings: number; // aggregated potential cost-optimization savings
  vendorContributions: VendorSpendBudgetContribution[];
  categorySummaries: {
    categoryId: string;
    categoryName: string;
    budgetCap: number;
    vendorSpend: number;
    vendorSpendSharePercent: number;
    vendorsCount: number;
    topVendorName: string;
    topVendorSpend: number;
    color: string;
  }[];
}

// ==========================================
// 1. ACCOUNTING FOUNDATION (Chart of Accounts & Journal Entries)
// ==========================================

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense';

export type AccountSubtype =
  | 'Cash'
  | 'Bank'
  | 'AccountsReceivable'
  | 'Inventory'
  | 'InputGST'
  | 'TDSReceivable'
  | 'AccountsPayable'
  | 'OutputGST'
  | 'TDSPayable'
  | 'LoansPayable'
  | 'CustomerAdvance'
  | 'VendorAdvance'
  | 'Capital'
  | 'RetainedEarnings'
  | 'CurrentEarnings'
  | 'SalesRevenue'
  | 'SalesReturn'
  | 'COGS'
  | 'PurchaseReturn'
  | 'OperatingExpense'
  | 'RoundOff'
  | 'InterestExpense'
  | 'Other';

export interface GLAccount {
  code: string; // e.g. 1000, 1200, 2000, 4000
  name: string;
  type: AccountType;
  subtype: AccountSubtype;
  balance: number;
  description?: string;
  isSystem: boolean;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  partyId?: string;
  partyName?: string;
  debit: number;
  credit: number;
  memo?: string;
}

export type JournalReferenceType =
  | 'PurchaseInvoice'
  | 'PurchaseReturn'
  | 'SalesInvoice'
  | 'SalesReturn'
  | 'Payment'
  | 'Receipt'
  | 'Expense'
  | 'AdvanceReceipt'
  | 'AdvancePayment'
  | 'AdvanceAdjustment'
  | 'LoanDisbursement'
  | 'LoanRepayment'
  | 'FundTransfer'
  | 'StockAdjustment'
  | 'CreditNote'
  | 'DebitNote'
  | 'OpeningBalance'
  | 'ManualJournal'
  | 'RcmSelfInvoice'
  | 'Journal';

export interface JournalEntry {
  id: string; // e.g. JE-2026-0001
  entryNumber: string;
  date: string; // YYYY-MM-DD
  referenceType: JournalReferenceType;
  referenceId: string;
  referenceNumber: string;
  narration: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  createdAt: string;
  createdBy: string;
}

export interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debitBalance: number;
  creditBalance: number;
}

// ==========================================
// 2. TAX, COMPLIANCE & TDS
// ==========================================

export type GSTRegistrationType = 'Regular' | 'Composition' | 'Unregistered' | 'SEZ' | 'Consumer';

export type TaxType =
  | 'Purchase Tax'
  | 'Sales Tax'
  | 'Expense Tax'
  | 'Purchase Return Tax'
  | 'Sales Return Tax';

export interface TaxRateRecord {
  id: string;
  name: string;
  code: string;
  rate: number; // e.g. 18 for 18%
  cgst: number; // e.g. 9
  sgst: number; // e.g. 9
  igst: number; // e.g. 18
  cess: number;
  taxType?: TaxType;
  effectiveDate?: string;
  isRcm?: boolean;
  appliesTo: 'Goods' | 'Services' | 'Both';
  status: 'Active' | 'Inactive';
}

export interface TaxMasterRecord {
  id: string;
  taxName: string;
  taxCode: string;
  rate: number; // Total rate %
  cgst: number; // CGST rate %
  sgst: number; // SGST rate %
  igst: number; // IGST rate %
  cess: number; // CESS rate %
  taxType: TaxType;
  effectiveDate: string;
  status: 'Active' | 'Inactive';
  isRcm: boolean; // Reverse Charge Mechanism
  appliesTo: 'Goods' | 'Services' | 'Both';
  description?: string;
}

export interface RcmSelfInvoiceRecord {
  id: string;
  voucherNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  date: string;
  vendorName: string;
  vendorGstin?: string;
  natureOfSupply: string; // e.g. 'Legal Advisory', 'Goods Transport Agency (GTA)', 'Director Remuneration'
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  totalVoucherAmount: number;
  itcClaimed: boolean;
  status: 'Generated' | 'Paid & Claimed' | 'Cancelled';
  journalEntryId?: string;
  notes?: string;
}

export interface TdsRecord {
  id: string;
  section: string; // e.g. '194C', '194J', '194I', '194Q'
  description: string;
  rateIndividual: number; // e.g. 1% or 10%
  rateCompany: number; // e.g. 2% or 10%
  thresholdLimit: number; // ₹ INR exemption limit
  status: 'Active' | 'Inactive';
}

export interface TdsEntryRecord {
  id: string;
  paymentId: string;
  paymentNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  vendorPan: string;
  section: string; // '194C', '194J', '194I', '194Q', etc.
  grossAmount: number;
  tdsRate: number;
  tdsAmount: number;
  netPaidAmount: number;
  challanNumber?: string;
  bsrCode?: string;
  depositDate?: string;
  certificateIssued: boolean;
  certificateNumber?: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
}

export interface TcsEntryRecord {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPan: string;
  section: string; // '206C(1H)', '206C(1)'
  saleAmount: number;
  tcsRate: number;
  tcsAmount: number;
  totalBillAmount: number;
  challanNumber?: string;
  depositDate?: string;
}

// ==========================================
// 3. INVENTORY, ITEM MASTER & UOM
// ==========================================

export interface UOMRecord {
  id: string;
  code: string; // e.g. 'NOS', 'BOX', 'KG', 'MTR'
  name: string;
  symbol: string;
  type: 'Count' | 'Weight' | 'Volume' | 'Length';
}

export type InventoryValuationMethod = 'FIFO' | 'Weighted Average' | 'Standard Cost';

export interface ItemMaster {
  id: string; // e.g. ITM-001
  code: string; // e.g. LAP-DELL-XPS
  name: string;
  sku: string;
  barcode?: string;
  description: string;
  brand: string;
  category: string;
  hsnCode?: string; // 8 digit HSN or 6 digit SAC (Optional)
  isService: boolean;
  baseUnit: string; // e.g. 'NOS'
  purchaseUnit: string; // e.g. 'BOX'
  purchaseUnitFactor: number; // e.g. 10 (1 BOX = 10 NOS)
  salesUnit: string; // e.g. 'NOS'
  salesUnitFactor: number; // e.g. 1
  purchasePrice: number;
  salesPrice: number;
  isPriceInclusiveOfTax?: boolean; // Whether price includes tax (Yes / No)
  wholesalePrice?: number;
  minSellingPrice: number;
  taxRatePercent: number; // Overall GST Rate % (e.g. 18)
  cgstPercent?: number; // Central GST % (e.g. 9)
  sgstPercent?: number; // State GST % (e.g. 9)
  igstPercent?: number; // Integrated GST % (e.g. 18)
  cessPercent?: number; // Cess % (e.g. 0)
  openingStock: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  warehouse: string;
  rackLocation?: string;
  itemType: 'Standard' | 'Serialized' | 'Batch';
  valuationMethod: InventoryValuationMethod;
  status: 'Active' | 'Inactive';
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  date: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  type:
    | 'Opening'
    | 'Purchase In'
    | 'Sales Out'
    | 'Purchase Return'
    | 'Sales Return'
    | 'Adjustment In'
    | 'Adjustment Out'
    | 'Transfer In'
    | 'Transfer Out';
  quantity: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  serialNumber?: string;
  batchNumber?: string;
  expiryDate?: string;
  warehouse: string;
  balanceAfter: number;
  notes?: string;
  createdBy: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  date: string;
  itemId: string;
  itemName: string;
  location: string;
  currentQty: number;
  adjustmentQty: number;
  direction: 'IN' | 'OUT';
  newQty: number;
  reason:
    | 'Physical Stock Difference'
    | 'Damaged'
    | 'Lost'
    | 'Expired'
    | 'Found'
    | 'Opening Adjustment'
    | 'Other';
  status: 'Draft' | 'Approved' | 'Rejected';
  approvedBy?: string;
  remarks?: string;
}

// ==========================================
// 4. UNIFIED PARTY MASTER (Customer / Vendor / Both)
// ==========================================

export type PartyType = 'Customer' | 'Vendor' | 'Customer & Vendor';

export interface PartyDocument {
  id: string;
  name: string;
  type: 'GST Certificate' | 'PAN Card' | 'MSME / Udyam' | 'Agreement / Contract' | 'Bank Cheque / Proof' | 'Other';
  fileName: string;
  fileSize?: string;
  uploadedAt: string;
  url?: string;
}

export interface PartyMaster {
  id: string; // e.g. PRT-001
  code: string;
  name: string;
  legalName?: string;
  type: PartyType;
  category: string; // e.g. Corporate, Retail, Contractor, Supplier, Institution
  contactPerson: string;
  phone: string;
  email: string;
  whatsapp?: string;
  billingAddress: string;
  shippingAddress?: string;
  city: string;
  state: string;
  stateCode: string; // 2 digit GST state code e.g. '32' for Kerala, '27' for Maharashtra
  country: string;
  gstin?: string;
  pan?: string;
  gstType: GSTRegistrationType;
  placeOfSupply: string;
  creditLimit: number;
  creditLimitAction: 'Block' | 'Warning' | 'Approval' | 'Requires Approval';
  paymentTerms: 'Immediate' | 'Net 15' | 'Net 30' | 'Net 45' | 'Net 60' | string;
  openingBalance: number; // positive = customer receivable (Dr), negative = vendor payable (Cr)
  currentBalance: number; // live calculated
  bankDetails?: VendorBankDetails;
  documents?: PartyDocument[];
  status: 'Active' | 'Under Review' | 'Inactive' | 'On Hold' | 'Blacklisted';
  isFlagged?: boolean;
  flagReason?: string;
  notes?: string;
  createdDate: string;
}

export interface PartyLedgerEntry {
  id: string;
  date: string;
  partyId: string;
  partyName: string;
  referenceNumber: string;
  transactionType:
    | 'Sales Invoice'
    | 'Purchase Invoice'
    | 'Receipt'
    | 'Payment'
    | 'Credit Note'
    | 'Debit Note'
    | 'Sales Return'
    | 'Purchase Return'
    | 'Advance Receipt'
    | 'Advance Payment'
    | 'Opening Balance'
    | 'Adjustment';
  debit: number; // charges/sales or payments to vendor
  credit: number; // receipts from customer or vendor bills
  balance: number; // running balance
  narration?: string;
}

// ==========================================
// 5. PURCHASE WORKFLOW
// ==========================================

export interface PurchaseItemLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number; // percentage
  taxPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  date: string;
  requestedBy: string;
  department: string;
  branch: string;
  project?: string;
  requiredDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  items: {
    itemId: string;
    itemCode: string;
    itemName: string;
    description?: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    estimatedTotal: number;
  }[];
  estimatedTotal: number;
  preferredVendorId?: string;
  preferredVendorName?: string;
  reason: string;
  remarks?: string;
  attachments?: string[];
  status: 'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted' | 'Cancelled' | 'Closed';
  quotationIds?: string[];
  quotationNumbers?: string[];
  poId?: string;
  poNumber?: string;
  grpoId?: string;
  grpoNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface PurchaseQuotation {
  id: string;
  quotationNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  requestRefId?: string;
  requestNumber?: string;
  validUntil: string;
  deliveryDate?: string;
  paymentTerms: string;
  items: PurchaseItemLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  otherCharges?: number;
  grandTotal: number;
  remarks?: string;
  attachments?: string[];
  status: 'Draft' | 'Received' | 'Under Review' | 'Approved' | 'Rejected' | 'Expired' | 'Converted to PO';
  isRecommended?: boolean;
  isSelectedForPO?: boolean;
  poId?: string;
  poNumber?: string;
  grpoId?: string;
  grpoNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  quotationRefId?: string;
  quotationNumber?: string;
  requestRefId?: string;
  requestNumber?: string;
  grpoId?: string;
  grpoNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  department: string;
  branch: string;
  project?: string;
  costCenter: string;
  deliveryLocation?: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  items: PurchaseItemLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  otherCharges?: number;
  roundOff: number;
  grandTotal: number;
  notes?: string;
  remarks?: string;
  attachments?: string[];
  invoicedAmount: number;
  budgetCategoryCode?: string;
  budgetCommitmentAmount: number;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Sent to Vendor' | 'Partially Received' | 'Fully Received' | 'Partially Invoiced' | 'Fully Invoiced' | 'Cancelled' | 'Closed';
}

export interface GoodsReceiptPO {
  id: string;
  grpoNumber: string; // e.g. GRPO-2026-0001
  date: string;
  poId: string;
  poNumber: string;
  requestRefId?: string;
  requestNumber?: string;
  quotationRefId?: string;
  quotationNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorChallanNo?: string;
  challanDate?: string;
  vehicleNo?: string;
  trackingNumber?: string;
  warehouse: string;
  items: Array<PurchaseItemLine & { receivedQty: number; acceptedQty: number; rejectedQty?: number }>;
  totalReceivedQty: number;
  totalAmount: number;
  receivedBy: string;
  inspectionStatus: 'Inspected & Accepted' | 'Partially Accepted' | 'Pending QC';
  remarks?: string;
  status: 'Open' | 'Partially Invoiced' | 'Fully Invoiced' | 'Closed';
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface PurchaseInvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  poId?: string;
  poNumber?: string;
  grpoId?: string;
  grpoNumber?: string;
  requestRefId?: string;
  requestNumber?: string;
  quotationRefId?: string;
  quotationNumber?: string;
  grnReference?: string;
  costCenter: string;
  items: PurchaseItemLine[];
  subtotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  otherCharges?: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  paymentTerms: string;
  isReverseCharge: boolean;
  referenceNumber?: string;
  remarks?: string;
  eInvoiceIrn?: string;
  eInvoiceQr?: string;
  attachments?: string[];
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
}

export interface PurchaseReturnRequest {
  id: string;
  returnRequestNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  items: PurchaseItemLine[];
  totalAmount: number;
  reason: 'Damaged' | 'Wrong Item' | 'Excess Quantity' | 'Quality Issue' | 'Incorrect Specification' | 'Expired' | 'Other';
  remarks?: string;
  attachments?: string[];
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted';
}

export interface PurchaseReturnRecord {
  id: string;
  returnNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  returnRequestId?: string;
  items: PurchaseItemLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  reason: string;
  status: 'Completed' | 'Processed';
  debitNoteId?: string;
  debitNoteNumber?: string;
}

export interface DebitNoteRecord {
  id: string;
  noteNumber: string;
  date: string;
  vendorId: string;
  vendorName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  returnId?: string;
  reason: 'Purchase Return' | 'Price Discrepancy' | 'Discount Adjustment' | 'Defective Goods' | 'Other';
  items: PurchaseItemLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'Draft' | 'Approved' | 'Settled';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

// ==========================================
// 6. SALES WORKFLOW
// ==========================================

export interface SalesItemLine {
  itemId: string;
  itemCode: string;
  itemName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number; // percentage
  taxPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface SalesRequest {
  id: string;
  requestNumber: string;
  date: string;
  customerId?: string;
  customerName?: string;
  requestedBy: string;
  department: string;
  branch: string;
  project?: string;
  requiredDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  items: SalesItemLine[];
  estimatedTotal: number;
  remarks?: string;
  attachments?: string[];
  status: 'Draft' | 'Submitted' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted' | 'Cancelled';
  quotationId?: string;
  quotationNumber?: string;
  salesOrderId?: string;
  salesOrderNumber?: string;
  deliveryId?: string;
  deliveryNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  requestRefId?: string;
  requestNumber?: string;
  validUntil: string;
  items: SalesItemLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  otherCharges?: number;
  grandTotal: number;
  paymentTerms: string;
  deliveryTerms?: string;
  notes?: string;
  status: 'Draft' | 'Sent' | 'Viewed' | 'Negotiation' | 'Accepted' | 'Rejected' | 'Expired' | 'Converted';
  salesOrderId?: string;
  salesOrderNumber?: string;
  deliveryId?: string;
  deliveryNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  quotationRefId?: string;
  quotationNumber?: string;
  requestRefId?: string;
  requestNumber?: string;
  deliveryId?: string;
  deliveryNumber?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  costCenter: string;
  deliveryDate: string;
  deliveryAddress: string;
  items: SalesItemLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  otherCharges?: number;
  grandTotal: number;
  paymentTerms: string;
  remarks?: string;
  invoicedAmount: number;
  status: 'Draft' | 'Confirmed' | 'Processing' | 'Partially Delivered' | 'Fully Delivered' | 'Cancelled' | 'Closed';
}

export interface SalesDelivery {
  id: string;
  deliveryNumber: string; // e.g. DLV-2026-0001
  date: string;
  salesOrderId: string;
  salesOrderNumber: string;
  requestRefId?: string;
  requestNumber?: string;
  quotationRefId?: string;
  quotationNumber?: string;
  customerId: string;
  customerName: string;
  shippingAddress?: string;
  warehouse: string;
  dispatchVehicleNo?: string;
  trackingNumber?: string;
  items: Array<SalesItemLine & { orderedQty: number; deliveredQty: number }>;
  totalDeliveredQty: number;
  totalAmount: number;
  dispatchedBy: string;
  remarks?: string;
  status: 'Dispatched' | 'Delivered' | 'Invoiced' | 'Closed';
  invoiceId?: string;
  invoiceNumber?: string;
}

export interface SalesInvoiceRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  orderId?: string;
  orderNumber?: string;
  deliveryId?: string;
  deliveryNumber?: string;
  quotationRefId?: string;
  quotationNumber?: string;
  requestRefId?: string;
  requestNumber?: string;
  deliveryReference?: string;
  costCenter: string;
  items: SalesItemLine[];
  subtotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  otherCharges?: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: string;
  paymentTerms: string;
  eInvoiceIrn?: string;
  eWayBillNo?: string;
  qrCode?: string;
  notes?: string;
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue' | 'Cancelled';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
}

export interface SalesReturnRequest {
  id: string;
  returnRequestNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  items: SalesItemLine[];
  totalAmount: number;
  reason: 'Defective Goods' | 'Wrong Item Delivered' | 'Quality Issue' | 'Customer Cancelled' | 'Other';
  condition: 'Damaged' | 'Resaleable' | 'Inspection Needed';
  supportingDocuments?: string[];
  remarks?: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Converted';
}

export interface SalesReturnRecord {
  id: string;
  returnNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  returnRequestId?: string;
  items: SalesItemLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  reason: string;
  condition: string;
  status: 'Completed' | 'Processed';
  creditNoteId?: string;
  creditNoteNumber?: string;
}

export interface CreditNoteRecord {
  id: string;
  noteNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  returnId?: string;
  reason: 'Sales Return' | 'Price Correction' | 'Post-Sale Discount' | 'Defective Goods' | 'Other';
  items: SalesItemLine[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  status: 'Draft' | 'Approved' | 'Settled';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
}

// ==========================================
// 7. PAYMENTS, RECEIPTS & CHEQUES
// ==========================================

export type TdsSection = '194C' | '194J' | '194I' | '194H' | '194Q' | string;

export interface InvoiceAllocation {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
}

export interface PaymentTransactionRecord {
  id: string;
  paymentNumber: string;
  date: string;
  partyId: string;
  partyName: string;
  partyType: 'Vendor' | 'Customer';
  amount: number; // Gross amount
  tdsSection?: string; // e.g. 194C
  tdsRate?: number;
  tdsAmount?: number;
  netPaid: number; // amount - tdsAmount
  paymentMethod: PaymentMode;
  accountId: string; // Bank or Cash account id
  accountName: string;
  referenceNumber: string;
  chequeNumber?: string;
  transactionId?: string; // e.g. Bank UTR / Txn Reference
  attachmentName?: string;
  attachmentUrl?: string;
  allocations: InvoiceAllocation[];
  allocatedAmount?: number;
  unallocatedAmount?: number;
  isAdvance: boolean;
  advanceStatus?: 'Unadjusted' | 'Partially Adjusted' | 'Fully Adjusted';
  status: 'Completed' | 'Pending Approval' | 'Cancelled';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  currentTier?: ApprovalTier;
  requiredTiers?: ApprovalTier[];
  approvedTiers?: {
    tier: ApprovalTier;
    approverName: string;
    date: string;
    comment?: string;
  }[];
  approvalRequestId?: string;
  requestedBy?: string;
  requestedDate?: string;
  approvedBy?: string;
  remarks?: string;
}

export interface ReceiptTransactionRecord {
  id: string;
  receiptNumber: string;
  date: string;
  partyId: string;
  partyName: string;
  amount: number;
  paymentMethod: PaymentMode;
  accountId: string;
  accountName: string;
  referenceNumber: string;
  chequeNumber?: string;
  transactionId?: string;
  attachmentName?: string;
  attachmentUrl?: string;
  allocations: InvoiceAllocation[];
  allocatedAmount?: number;
  unallocatedAmount?: number;
  isAdvance: boolean;
  advanceStatus?: 'Unadjusted' | 'Partially Adjusted' | 'Fully Adjusted';
  status: 'Completed' | 'Pending Approval' | 'Cancelled';
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  remarks?: string;
  createdBy?: string;
}

export interface AdvanceAdjustmentRecord {
  id: string;
  adjustmentNumber: string; // e.g. ADJ-2026-0001
  date: string;
  advanceId: string;
  advanceNumber: string;
  advanceType: 'Customer' | 'Vendor';
  partyId: string;
  partyName: string;
  totalAdvanceAmount: number;
  adjustedAmount: number;
  remainingAdvanceAmount: number;
  allocations: InvoiceAllocation[];
  journalEntryId?: string;
  remarks?: string;
  createdAt: string;
}

export type ChequeStatus = 'Pending' | 'Deposited' | 'Cleared' | 'Bounced' | 'Cancelled' | 'Post-Dated';
export type ChequeType = 'Issued' | 'Received';

export interface ChequeRecord {
  id: string;
  chequeNumber: string;
  bankName: string;
  bankAccountId?: string;
  partyId: string;
  partyName: string;
  type: ChequeType;
  amount: number;
  chequeDate: string;
  maturityDate: string;
  depositDate?: string;
  clearanceDate?: string;
  status: ChequeStatus;
  bounceReason?: string;
  bouncedAt?: string;
  linkedTransactionId?: string;
  notes?: string;
}

export interface SystemBankTransaction {
  id: string;
  date: string;
  type: 'Deposit' | 'Withdrawal';
  category?: 'Payment' | 'Receipt' | 'Transfer' | 'Cheque' | string;
  bankAccountId?: string;
  partyName?: string;
  referenceNumber?: string;
  description: string;
  withdrawal?: number;
  deposit?: number;
  status: 'Matched' | 'Unmatched' | 'Pending' | 'Reconciled' | string;
  clearedDate?: string;
}

export interface SystemCashTransaction {
  id: string;
  date: string;
  type: 'Inflow' | 'Outflow';
  category?: 'Receipt' | 'Payment' | 'Transfer' | 'Expense' | string;
  cashAccountId?: string;
  partyName?: string;
  referenceNumber?: string;
  description: string;
  inflow?: number;
  outflow?: number;
}

// ==========================================
// 8. CASH, BANK & TRANSFERS
// ==========================================

export type TreasuryAccountType = 'Cash' | 'Petty Cash' | 'Bank' | 'Other';

export interface BankAccountRecord {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  accountType: 'Current' | 'Savings' | 'OD/CC' | string;
  openingBalance: number;
  currentBalance: number;
  glAccountCode: string;
  isDefault: boolean;
  currency?: string;
  status?: 'Active' | 'Inactive';
}

export interface CashAccountRecord {
  id: string;
  name: string;
  type: 'Cash' | 'Petty Cash' | 'Other' | string;
  custodian: string;
  openingBalance: number;
  currentBalance: number;
  glAccountCode: string;
  currency?: string;
  status?: 'Active' | 'Inactive';
}

export interface FundTransferRecord {
  id: string;
  transferNumber: string;
  date: string;
  fromAccountId: string;
  fromAccountName: string;
  fromAccountType: 'Cash' | 'Petty Cash' | 'Bank' | 'Other' | string;
  toAccountId: string;
  toAccountName: string;
  toAccountType: 'Cash' | 'Petty Cash' | 'Bank' | 'Other' | string;
  amount: number;
  referenceNumber: string;
  remarks?: string;
  createdBy: string;
}

export interface BankStatementLine {
  id: string;
  date: string;
  valueDate?: string;
  description: string;
  reference: string;
  withdrawal: number;
  deposit: number;
  balance?: number;
  status?: 'Matched' | 'Unmatched' | 'Pending' | 'Reconciled';
  matchStatus?: 'Matched' | 'Unmatched' | 'Pending' | 'Reconciled';
  flaggedForReview?: boolean;
  reviewReason?: string;
  reviewNotes?: string;
  reviewCategory?: 'Unrecorded Charge' | 'Timing Difference' | 'Missing Deposit' | 'Disputed Entry' | 'Other';
  suggestedAction?: string;
  matchedId?: string;
  matchedTransactionId?: string;
  matchedTransactionRef?: string;
  matchedType?: 'Payment' | 'Receipt' | 'FundTransfer' | 'Other';
  matchedReference?: string;
  isReconciled?: boolean;
}

export interface BankReconciliationRecord {
  id: string;
  reconciliationNumber: string;
  bankAccountId: string;
  bankAccountName: string;
  statementDate: string;
  statementBalance: number;
  systemBalance: number;
  difference: number;
  matchedLinesCount?: number;
  unmatchedLinesCount?: number;
  reconciledLinesCount?: number;
  matchedCount?: number;
  unmatchedCount?: number;
  status: 'Draft' | 'Reconciled' | 'Balanced' | 'Discrepancy' | string;
  lines?: BankStatementLine[];
  statementLines?: BankStatementLine[];
  reconciledDate?: string;
  reconciledBy?: string;
  notes?: string;
  createdAt: string;
}

// ==========================================
// 9. LOANS & DEBT MANAGEMENT
// ==========================================

export type LoanType =
  | 'Term Loan'
  | 'Working Capital'
  | 'Equipment Financing'
  | 'Promoter Loan'
  | 'Vehicle Loan'
  | 'Line of Credit'
  | string;

export type LoanStatus =
  | 'Draft'
  | 'Pending Approval'
  | 'Active'
  | 'Completed'
  | 'Overdue'
  | 'Closed'
  | 'Defaulted';

export type LoanInterestType = 'Reducing Balance' | 'Fixed' | 'Floating' | 'Flat';

export type LoanPaymentFrequency = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Annually' | 'Bullet';

export interface LoanRecord {
  id: string;
  loanNumber: string;
  lenderName: string;
  loanType: LoanType;
  principalAmount: number;
  interestRate: number; // annual percentage e.g. 9.5
  tenureMonths: number;
  emiAmount: number;
  startDate: string;
  endDate: string;
  bankAccountId: string;
  totalPrincipalRepaid: number;
  totalInterestPaid: number;
  outstandingPrincipal: number;
  status: LoanStatus;
  notes?: string;

  // Extended fields per specifications
  loanDate?: string;
  interestType?: LoanInterestType;
  paymentFrequency?: LoanPaymentFrequency;
  collateral?: string;
  documents?: string;
  remarks?: string;
  disbursedDate?: string;
  disbursementJournalId?: string;
}

export interface LoanRepaymentRecord {
  id: string;
  loanId: string;
  repaymentNumber: string;
  date: string; // payment date
  dueDate?: string;
  paymentDate?: string;
  principalPaid: number;
  interestPaid: number;
  penaltyPaid: number;
  totalPaid: number;
  paymentMethod: PaymentMode;
  accountId: string;
  referenceNumber: string;
  remarks?: string;
  notes?: string;
  journalEntryId?: string;
}

export interface LoanAmortizationScheduleItem {
  installmentNumber: number;
  dueDate: string;
  beginningBalance: number;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  endingBalance: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  paidDate?: string;
  repaymentId?: string;
}

// ==========================================
// 10. BUDGET MASTER, ALLOCATIONS, COMMITMENTS, TRANSFERS & REVISIONS
// ==========================================

export type BudgetType =
  | 'Annual'
  | 'Monthly'
  | 'Quarterly'
  | 'Department'
  | 'Branch'
  | 'Project'
  | 'Expense'
  | 'Purchase'
  | 'Sales'
  | 'Cash';

export type BudgetPeriod = 'Annual' | 'Monthly' | 'Quarterly' | 'H1' | 'H2';

export type BudgetStatus =
  | 'Draft'
  | 'Submitted'
  | 'Pending Approval'
  | 'Approved'
  | 'Active'
  | 'Closed'
  | 'Cancelled';

export interface BudgetMasterRecord {
  id: string; // e.g. BDG-2026-001
  budgetName: string;
  financialYear: string; // e.g. 2026-2027
  budgetPeriod: BudgetPeriod;
  budgetType: BudgetType;
  branch: string; // e.g. 'Kochi HQ', 'Calicut Branch'
  department: string; // e.g. 'IT & Tech', 'Operations'
  project: string; // e.g. 'Cloud Modernization', 'General'
  costCenter: string; // e.g. 'CC-101 Corporate HQ'
  currency: string; // 'INR'
  description: string;
  totalBudget: number; // Base initial allocation
  revisedBudget: number; // After any approved revisions
  status: BudgetStatus;
  approvedBy?: string;
  approvedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetAllocationRecord {
  id: string;
  budgetId: string;
  budgetName: string;
  category: string; // e.g. IT Equipment, Office Supplies, Travel
  department: string;
  branch: string;
  project: string;
  costCenter: string;
  period: string; // e.g. 'FY 2026-27' or 'Q1' or 'Apr'
  budgetAmount: number;
  remarks?: string;
}

export interface BudgetCommitmentRecord {
  id: string;
  budgetId?: string;
  poId: string;
  poNumber: string;
  categoryCode: string;
  categoryName?: string;
  department: string;
  branch?: string;
  project?: string;
  costCenter?: string;
  vendorName?: string;
  originalAmount: number;
  releasedAmount: number; // invoiced amount released
  activeCommitment: number; // originalAmount - releasedAmount
  date: string;
  status: 'Active' | 'Partially Released' | 'Fully Released' | 'Cancelled';
  invoicedActualAmount?: number; // actual billed amount (including price variances)
  varianceAmount?: number; // invoice price variance
}

export interface BudgetTransferRecord {
  id: string;
  transferNumber: string;
  date: string;
  sourceBudgetId?: string;
  sourceCategoryCode: string;
  sourceCategoryName: string;
  destinationBudgetId?: string;
  destinationCategoryCode: string;
  destinationCategoryName: string;
  amount: number;
  reason: string;
  requestedBy: string;
  approvedBy?: string;
  status: 'Draft' | 'Approved' | 'Rejected';
  auditNotes?: string;
}

export interface BudgetRevisionRecord {
  id: string;
  budgetId?: string;
  budgetName?: string;
  categoryCode: string;
  categoryName: string;
  originalCap: number; // original budget amount
  revisedCap: number; // new revised budget amount
  revisionAmount: number; // delta (positive or negative)
  reason: string;
  requestedBy?: string;
  approvedBy: string;
  date: string;
  revisionDate?: string;
}

export type BudgetControlRule = 'Block' | 'Warning' | 'Approval';

export interface BudgetControlConfig {
  id: string;
  module: 'Purchase' | 'Expense' | 'All';
  department: string;
  category?: string;
  rule: BudgetControlRule;
  isActive: boolean;
  description: string;
}

export interface BudgetAlertThresholds {
  normalBelow: number; // 75%
  warningAt: number; // 75%
  criticalAt: number; // 90%
  fullyUtilizedAt: number; // 100%
  overBudgetAbove: number; // 100%
  channels: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// ==========================================
// 11. APPROVAL ENGINE & AUDIT TRAIL
// ==========================================

export type ApprovalTier = 'DeptManager' | 'FinanceManager' | 'Management';

export interface ApprovalRequestRecord {
  id: string;
  entityType:
    | 'Payment'
    | 'SalesInvoice'
    | 'PurchaseInvoice'
    | 'PurchaseOrder'
    | 'Expense'
    | 'CreditNote'
    | 'DebitNote'
    | 'StockAdjustment'
    | 'BudgetTransfer';
  entityId: string;
  entityNumber: string;
  partyName?: string;
  amount: number;
  requestedBy: string;
  requestedDate: string;
  currentTier: ApprovalTier;
  requiredTiers: ApprovalTier[];
  approvedTiers: {
    tier: ApprovalTier;
    approverName: string;
    date: string;
    comment?: string;
  }[];
  status: 'Pending' | 'Approved' | 'Rejected';
  comments?: string;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  actorName: string;
  role: string;
  module: string;
  action: 'Create' | 'Edit' | 'Approve' | 'Reject' | 'Cancel' | 'Reverse' | 'Post' | 'YearEndClose';
  entityId: string;
  entityNumber: string;
  details: string;
}

// ==========================================
// 12. OPENING BALANCES & YEAR-END CLOSING
// ==========================================

export interface OpeningBalanceRecord {
  id: string;
  financialYear: string;
  date: string;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  partyBalancesCount: number;
  stockItemsCount: number;
  cashBankAccountsCount: number;
  totalReceivables: number;
  totalPayables: number;
  totalStockValue: number;
  totalCashBank: number;
}

export interface YearEndClosingRecord {
  id: string;
  financialYear: string;
  closingDate: string;
  closedBy: string;
  netProfitTransferred: number;
  retainedEarningsAccount: string;
  isClosed: boolean;
  notes?: string;
}

export interface DocumentNumberingConfig {
  prefix: string;
  nextNumber: number;
  numberLength: number;
  yearFormat: string; // e.g. '2026'
}

export interface ProcurementTraceabilityStage {
  stage: 'Request' | 'Quotation' | 'Comparison' | 'Order' | 'Goods Receipt' | 'Invoice';
  stageName: string;
  stageCode: 'PR' | 'PQ' | 'COMP' | 'PO' | 'GRPO' | 'PI';
  sequence: number;
  docNumber: string;
  docId: string;
  status: string;
  date: string;
  partyName: string;
  amount: number;
  isCompleted: boolean;
  isCurrent: boolean;
  documentCount: number;
  summaryText?: string;
}

export interface ProcurementTraceabilityChain {
  sharedReferenceId: string;
  rootDocType: 'Request' | 'Quotation' | 'Order' | 'Goods Receipt' | 'Invoice';
  activeDoc: {
    stage: 'Request' | 'Quotation' | 'Comparison' | 'Order' | 'Goods Receipt' | 'Invoice';
    id: string;
    number: string;
  };
  request: PurchaseRequest | null;
  quotations: PurchaseQuotation[];
  comparison: {
    hasComparison: boolean;
    totalQuotations: number;
    lowestPriceQuote?: PurchaseQuotation;
    highestPriceQuote?: PurchaseQuotation;
    selectedQuote?: PurchaseQuotation;
    priceVariance: number;
    potentialSavings: number;
    fastestDeliveryQuote?: PurchaseQuotation;
    evaluationStatus: 'Awaiting Bids' | 'Single Bid' | 'Ready for Comparison' | 'Evaluated & Awarded';
    summary: string;
  };
  order: PurchaseOrder | null;
  goodsReceipt: GoodsReceiptPO | null;
  invoice: PurchaseInvoiceRecord | null;
  stages: ProcurementTraceabilityStage[];
  completedCount: number;
  totalStages: number;
  progressPercentage: number;
}
