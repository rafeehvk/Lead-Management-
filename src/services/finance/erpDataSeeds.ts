import {
  TaxRateRecord,
  TdsRecord,
  UOMRecord,
  ItemMaster,
  PartyMaster,
  PurchaseRequest,
  PurchaseQuotation,
  PurchaseOrder,
  GoodsReceiptPO,
  PurchaseInvoiceRecord,
  PurchaseReturnRequest,
  PurchaseReturnRecord,
  SalesRequest,
  SalesQuotation,
  SalesOrder,
  SalesDelivery,
  SalesInvoiceRecord,
  SalesReturnRequest,
  SalesReturnRecord,
  PaymentTransactionRecord,
  ReceiptTransactionRecord,
  AdvanceAdjustmentRecord,
  ChequeRecord,
  BankAccountRecord,
  CashAccountRecord,
  LoanRecord,
  LoanRepaymentRecord,
  ApprovalRequestRecord,
  AuditLogRecord,
  OpeningBalanceRecord,
  BudgetCommitmentRecord,
  StockMovement,
  DebitNoteRecord,
  CreditNoteRecord,
  ExpenseCategoryMaster,
  ExpenseRecord,
  RecurringTemplate,
} from '../../types/finance';

export const SEED_TAX_RATES: TaxRateRecord[] = [
  { id: 'tax-01', name: 'GST 18% (Standard Electronics & IT)', code: 'GST18', rate: 18, cgst: 9, sgst: 9, igst: 18, cess: 0, appliesTo: 'Both', status: 'Active' },
  { id: 'tax-02', name: 'GST 12% (IT Hardware & Supplies)', code: 'GST12', rate: 12, cgst: 6, sgst: 6, igst: 12, cess: 0, appliesTo: 'Goods', status: 'Active' },
  { id: 'tax-03', name: 'GST 5% (Essential Lab & Printables)', code: 'GST05', rate: 5, cgst: 2.5, sgst: 2.5, igst: 5, cess: 0, appliesTo: 'Goods', status: 'Active' },
  { id: 'tax-04', name: 'GST 28% (Luxury & Heavy Electricals)', code: 'GST28', rate: 28, cgst: 14, sgst: 14, igst: 28, cess: 0, appliesTo: 'Goods', status: 'Active' },
  { id: 'tax-05', name: 'GST 0% (Exempt Educational & Statutory)', code: 'GST00', rate: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, appliesTo: 'Both', status: 'Active' },
];

export const SEED_TDS_SECTIONS: TdsRecord[] = [
  { id: 'tds-01', section: '194C', description: 'Payments to Contractors & Sub-contractors (Facilities/Logistics)', rateIndividual: 1, rateCompany: 2, thresholdLimit: 30000, status: 'Active' },
  { id: 'tds-02', section: '194J', description: 'Fees for Professional or Technical Services (Software/IT/Auditing)', rateIndividual: 10, rateCompany: 10, thresholdLimit: 30000, status: 'Active' },
  { id: 'tds-03', section: '194I', description: 'Rent on Land, Building or Furniture', rateIndividual: 10, rateCompany: 10, thresholdLimit: 240000, status: 'Active' },
  { id: 'tds-04', section: '194H', description: 'Commission or Brokerage', rateIndividual: 5, rateCompany: 5, thresholdLimit: 15000, status: 'Active' },
];

export const SEED_UOMS: UOMRecord[] = [
  { id: 'uom-01', code: 'NOS', name: 'Numbers / Units', symbol: 'Nos', type: 'Count' },
  { id: 'uom-02', code: 'BOX', name: 'Box (Packaging Unit)', symbol: 'Box', type: 'Count' },
  { id: 'uom-03', code: 'KG', name: 'Kilograms', symbol: 'Kg', type: 'Weight' },
  { id: 'uom-04', code: 'SET', name: 'Complete Kit / Set', symbol: 'Set', type: 'Count' },
  { id: 'uom-05', code: 'MTR', name: 'Meters (Cabling/Fiber)', symbol: 'm', type: 'Length' },
  { id: 'uom-06', code: 'USR', name: 'User Seat / License', symbol: 'Seat', type: 'Count' },
];

export const SEED_ITEMS: ItemMaster[] = [];

export const SEED_PARTIES: PartyMaster[] = [];

export const SEED_BANK_ACCOUNTS: BankAccountRecord[] = [
  {
    id: 'bnk-01',
    name: 'Federal Bank Current Account',
    bankName: 'Federal Bank',
    accountNumber: '12880200018942',
    ifscCode: 'FDRL0001288',
    branch: 'Marine Drive, Kochi',
    accountType: 'Current',
    openingBalance: 0,
    currentBalance: 0,
    glAccountCode: '1100',
    isDefault: true,
    currency: 'INR',
    status: 'Active',
  },
  {
    id: 'bnk-02',
    name: 'HDFC Bank Operational Account',
    bankName: 'HDFC Bank',
    accountNumber: '50200098765432',
    ifscCode: 'HDFC0000543',
    branch: 'Kaloor, Kochi',
    accountType: 'Current',
    openingBalance: 0,
    currentBalance: 0,
    glAccountCode: '1110',
    isDefault: false,
    currency: 'INR',
    status: 'Active',
  },
  {
    id: 'bnk-03',
    name: 'State Bank of India - OD/CC Facility',
    bankName: 'State Bank of India',
    accountNumber: '38901245678',
    ifscCode: 'SBIN0000854',
    branch: 'MG Road, Ernakulam',
    accountType: 'OD/CC',
    openingBalance: 0,
    currentBalance: 0,
    glAccountCode: '1120',
    isDefault: false,
    currency: 'INR',
    status: 'Active',
  },
];

export const SEED_CASH_ACCOUNTS: CashAccountRecord[] = [
  {
    id: 'csh-01',
    name: 'Main Office Cash Vault',
    type: 'Cash',
    custodian: 'Head Cashier / Finance Officer',
    openingBalance: 0,
    currentBalance: 0,
    glAccountCode: '1000',
    currency: 'INR',
    status: 'Active',
  },
  {
    id: 'csh-02',
    name: 'Campus Reception Petty Cash Float',
    type: 'Petty Cash',
    custodian: 'Front Desk Administrator',
    openingBalance: 0,
    currentBalance: 0,
    glAccountCode: '1010',
    currency: 'INR',
    status: 'Active',
  },
  {
    id: 'csh-03',
    name: 'Facility & Operations Petty Cash',
    type: 'Petty Cash',
    custodian: 'Facility Supervisor',
    openingBalance: 0,
    currentBalance: 0,
    glAccountCode: '1020',
    currency: 'INR',
    status: 'Active',
  },
  {
    id: 'csh-04',
    name: 'Transit Cash & Escrow Float',
    type: 'Other',
    custodian: 'Logistics Officer',
    openingBalance: 0,
    currentBalance: 0,
    glAccountCode: '1030',
    currency: 'INR',
    status: 'Active',
  },
];

export const SEED_PURCHASE_ORDERS: PurchaseOrder[] = [];

export const SEED_PURCHASE_INVOICES: PurchaseInvoiceRecord[] = [];

export const SEED_SALES_INVOICES: SalesInvoiceRecord[] = [];

export const SEED_CHEQUES: ChequeRecord[] = [];

export const SEED_LOANS: LoanRecord[] = [];

export const SEED_LOAN_REPAYMENTS: LoanRepaymentRecord[] = [];

export const SEED_PAYMENTS: PaymentTransactionRecord[] = [];

export const SEED_RECEIPTS: ReceiptTransactionRecord[] = [];

export const SEED_ADVANCE_ADJUSTMENTS: AdvanceAdjustmentRecord[] = [];

export const SEED_APPROVAL_REQUESTS: ApprovalRequestRecord[] = [];

export const SEED_AUDIT_LOGS: AuditLogRecord[] = [];

export const SEED_PURCHASE_REQUESTS: PurchaseRequest[] = [];

export const SEED_PURCHASE_QUOTATIONS: PurchaseQuotation[] = [];

export const SEED_PURCHASE_RETURN_REQUESTS: PurchaseReturnRequest[] = [];

export const SEED_PURCHASE_RETURNS: PurchaseReturnRecord[] = [];

export const SEED_DEBIT_NOTES: DebitNoteRecord[] = [];

export const SEED_SALES_REQUESTS: SalesRequest[] = [];

export const SEED_SALES_QUOTATIONS: SalesQuotation[] = [];

export const SEED_SALES_ORDERS: SalesOrder[] = [];

export const SEED_SALES_RETURN_REQUESTS: SalesReturnRequest[] = [];

export const SEED_SALES_RETURNS: SalesReturnRecord[] = [];

export const SEED_CREDIT_NOTES: CreditNoteRecord[] = [];

export const SEED_EXPENSE_CATEGORIES: ExpenseCategoryMaster[] = [
  {
    id: 'cat-sal',
    name: 'Salary',
    code: 'CAT-SAL',
    glAccountCode: '5200',
    glAccountName: 'Staff Payroll & Salaries',
    subCategories: ['Faculty Payroll', 'Engineering Core', 'Admin & Operations', 'Sales Commission', 'Performance Bonus'],
    description: 'Corporate and faculty staff remuneration and allowances',
    allocatedBudget: 17500000,
    actualSpend: 1450000,
    color: '#0B5D2A',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-rent',
    name: 'Rent',
    code: 'CAT-RENT',
    glAccountCode: '5210',
    glAccountName: 'Office Rent & Facilities',
    subCategories: ['Headquarters Premises', 'Bangalore R&D Center', 'Warehouse & Logistics Facility', 'Guest House'],
    description: 'Commercial premises rental lease payments',
    allocatedBudget: 3000000,
    actualSpend: 250000,
    color: '#2563EB',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-elec',
    name: 'Electricity',
    code: 'CAT-ELEC',
    glAccountCode: '5220',
    glAccountName: 'Electricity & Power Utility',
    subCategories: ['KSEB Commercial Grid Power', 'Substation Maintenance', 'Generator Diesel Fuel', 'UPS Battery Servicing'],
    description: 'Electrical power supply and emergency backup utility',
    allocatedBudget: 800000,
    actualSpend: 68000,
    color: '#D97706',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-inet',
    name: 'Internet',
    code: 'CAT-INET',
    glAccountCode: '5230',
    glAccountName: 'Internet & Communication',
    subCategories: ['Primary Leased Line (1Gbps)', 'Secondary Fiber Failover', 'Server Room Static IP Block', '4G Field Dongles'],
    description: 'Corporate high-speed fiber internet and data connections',
    allocatedBudget: 450000,
    actualSpend: 36000,
    color: '#0891B2',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-trav',
    name: 'Travel',
    code: 'CAT-TRAV',
    glAccountCode: '5240',
    glAccountName: 'Business Travel & Conveyance',
    subCategories: ['Domestic Flight Tickets', 'Hotel & Boarding', 'Daily Per Diem Allowance', 'Airport Taxi & Transfers'],
    description: 'Executive and technical staff business travel expenses',
    allocatedBudget: 1000000,
    actualSpend: 84000,
    color: '#7C3AED',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-tran',
    name: 'Transport',
    code: 'CAT-TRAN',
    glAccountCode: '5250',
    glAccountName: 'Transport & Freight Logistics',
    subCategories: ['Local Logistics & Courier', 'Heavy Hardware Freight Cargo', 'Staff Commute Shuttle', 'Client Visit Conveyance'],
    description: 'Shipping, freight logistics and local travel reimbursement',
    allocatedBudget: 500000,
    actualSpend: 42000,
    color: '#4F46E5',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-mkt',
    name: 'Marketing',
    code: 'CAT-MKT',
    glAccountCode: '5400',
    glAccountName: 'Marketing & Branding Expenses',
    subCategories: ['Google & LinkedIn Ads', 'Tech Expo Exhibitions', 'Print Brochures & Banners', 'Conference Sponsorship'],
    description: 'Lead acquisition, digital advertising and corporate branding',
    allocatedBudget: 3500000,
    actualSpend: 290000,
    color: '#EC4899',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-soft',
    name: 'Software',
    code: 'CAT-SOFT',
    glAccountCode: '5300',
    glAccountName: 'Campus IT & Cloud Infrastructure',
    subCategories: ['AWS Cloud Hosting', 'Google Workspace Suite', 'Figma & JetBrains Licenses', 'GitHub Enterprise', 'Security SSL'],
    description: 'Cloud infrastructure hosting and SaaS software tooling',
    allocatedBudget: 4500000,
    actualSpend: 380000,
    color: '#0284C7',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-off',
    name: 'Office Supplies',
    code: 'CAT-OFF',
    glAccountCode: '5800',
    glAccountName: 'Office Supplies & Stationery',
    subCategories: ['Printing Paper & Stationery', 'Printer Toner Cartridges', 'Pantry Coffee & Refreshments', 'Desk Supplies'],
    description: 'Daily office consumables, print stationery and pantry float',
    allocatedBudget: 1400000,
    actualSpend: 115000,
    color: '#10B981',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-main',
    name: 'Maintenance',
    code: 'CAT-MAIN',
    glAccountCode: '5500',
    glAccountName: 'Facilities & Maintenance Utility',
    subCategories: ['HVAC Air Conditioning AMC', 'Facility Deep Sanitization', 'Plumbing & Water Filter Servicing', 'Office Furniture Repair'],
    description: 'Premises upkeep, equipment servicing and maintenance AMC',
    allocatedBudget: 3800000,
    actualSpend: 320000,
    color: '#F59E0B',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-prof',
    name: 'Professional Fees',
    code: 'CAT-PROF',
    glAccountCode: '5700',
    glAccountName: 'Compliance & Legal Charges',
    subCategories: ['Statutory Financial Audit', 'Corporate Legal Retainer', 'Company Secretarial RoC Filing', 'GST Compliance Advisory'],
    description: 'Legal, tax advisory, audit and compliance consultancy',
    allocatedBudget: 1000000,
    actualSpend: 85000,
    color: '#6366F1',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-ins',
    name: 'Insurance',
    code: 'CAT-INS',
    glAccountCode: '5810',
    glAccountName: 'General & Property Insurance',
    subCategories: ['Employee Group Health Insurance', 'Campus Fire & Peril Policy', 'Transit Marine Coverage', 'Cyber Liability Insurance'],
    description: 'Risk management, campus indemnity and employee health',
    allocatedBudget: 900000,
    actualSpend: 72000,
    color: '#14B8A6',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-tel',
    name: 'Telephone',
    code: 'CAT-TEL',
    glAccountCode: '5260',
    glAccountName: 'Telephone & Mobile Expenses',
    subCategories: ['Corporate Postpaid CUG Fleet', 'Executive Roaming Packs', 'Support Desk PBX SIP Trunks', 'Toll-Free Helpline'],
    description: 'Voice calling plans, telecommunication and PBX systems',
    allocatedBudget: 250000,
    actualSpend: 18000,
    color: '#3B82F6',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-trn',
    name: 'Training',
    code: 'CAT-TRN',
    glAccountCode: '5820',
    glAccountName: 'Staff Training & Skill Development',
    subCategories: ['Cloud Architecture Certifications', 'Leadership Development', 'Security Compliance Workshops', 'Onboarding Bootcamps'],
    description: 'Workforce continuous learning, skill bootcamps and upskilling',
    allocatedBudget: 700000,
    actualSpend: 55000,
    color: '#8B5CF6',
    isSystem: true,
    createdAt: '2026-04-01',
  },
  {
    id: 'cat-misc',
    name: 'Miscellaneous',
    code: 'CAT-MISC',
    glAccountCode: '5900',
    glAccountName: 'Miscellaneous Operating Expenses',
    subCategories: ['Emergency Petty Cash', 'Bank Processing Charges', 'Official Hospitality', 'Municipal Sundry'],
    description: 'Incidental overheads and minor general office disbursements',
    allocatedBudget: 500000,
    actualSpend: 38000,
    color: '#64748B',
    isSystem: true,
    createdAt: '2026-04-01',
  },
];

export const SEED_EXPENSES: ExpenseRecord[] = [];

export const SEED_RECURRING_TEMPLATES: RecurringTemplate[] = [];

export const SEED_GOODS_RECEIPT_POS: GoodsReceiptPO[] = [];

export const SEED_SALES_DELIVERIES: SalesDelivery[] = [];

