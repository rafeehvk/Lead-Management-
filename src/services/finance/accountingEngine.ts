import {
  GLAccount,
  JournalEntry,
  JournalLine,
  JournalReferenceType,
  TrialBalanceItem,
  AccountType,
} from '../../types/finance';

const STORAGE_KEYS = {
  CHART_OF_ACCOUNTS: 'mysar_finance_chart_of_accounts_v2',
  JOURNAL_ENTRIES: 'mysar_finance_journal_entries_v2',
};

// Seed Chart of Accounts per Section 99.1 of Specification
export const DEFAULT_CHART_OF_ACCOUNTS: GLAccount[] = [
  // ASSETS (1000 - 1999)
  { code: '1000', name: 'Cash on Hand', type: 'Asset', subtype: 'Cash', balance: 0, isSystem: true, description: 'Main office physical currency' },
  { code: '1010', name: 'Petty Cash', type: 'Asset', subtype: 'Cash', balance: 0, isSystem: true, description: 'Front desk daily disbursement float' },
  { code: '1100', name: 'Federal Bank - Current A/c (Primary)', type: 'Asset', subtype: 'Bank', balance: 0, isSystem: true, description: 'Primary institutional operational account' },
  { code: '1110', name: 'HDFC Bank - Current A/c (Disbursement)', type: 'Asset', subtype: 'Bank', balance: 0, isSystem: true, description: 'Secondary vendor & statutory clearing account' },
  { code: '1200', name: 'Accounts Receivable (Control)', type: 'Asset', subtype: 'AccountsReceivable', balance: 0, isSystem: true, description: 'Control account for all customer invoice dues' },
  { code: '1300', name: 'Inventory Asset', type: 'Asset', subtype: 'Inventory', balance: 0, isSystem: true, description: 'Total valuation of on-hand items & merchandise' },
  { code: '1400', name: 'Input GST (ITC Credit)', type: 'Asset', subtype: 'InputGST', balance: 0, isSystem: true, description: 'Input tax credit available on procurement' },
  { code: '1500', name: 'TDS Receivable', type: 'Asset', subtype: 'TDSReceivable', balance: 0, isSystem: true, description: 'Tax deducted at source by clients' },
  { code: '1900', name: 'Other Current Assets / Deposits', type: 'Asset', subtype: 'Other', balance: 0, isSystem: true, description: 'Electricity & rental security deposits' },

  // LIABILITIES (2000 - 2999)
  { code: '2000', name: 'Accounts Payable (Control)', type: 'Liability', subtype: 'AccountsPayable', balance: 0, isSystem: true, description: 'Control account for all vendor invoices & dues' },
  { code: '2100', name: 'Output GST (Tax Liability)', type: 'Liability', subtype: 'OutputGST', balance: 0, isSystem: true, description: 'GST collected on taxable billing' },
  { code: '2150', name: 'TDS Payable (Statutory)', type: 'Liability', subtype: 'TDSPayable', balance: 0, isSystem: true, description: 'TDS withheld from suppliers pending deposit to Govt' },
  { code: '2200', name: 'Loans Payable (Bank Borrowings)', type: 'Liability', subtype: 'LoansPayable', balance: 0, isSystem: true, description: 'Long term & equipment financing borrowings' },
  { code: '2300', name: 'Advance from Customers', type: 'Liability', subtype: 'CustomerAdvance', balance: 0, isSystem: true, description: 'Unallocated client prepayments' },
  { code: '2350', name: 'Advance to Vendors', type: 'Asset', subtype: 'VendorAdvance', balance: 0, isSystem: true, description: 'Unadjusted advance deposits paid to suppliers' },
  { code: '2900', name: 'Other Current Liabilities / Accruals', type: 'Liability', subtype: 'Other', balance: 0, isSystem: true, description: 'Accrued expenses & audit provisions' },

  // EQUITY (3000 - 3999)
  { code: '3000', name: 'Shareholder Capital', type: 'Equity', subtype: 'Capital', balance: 0, isSystem: true, description: 'Paid-up equity capital' },
  { code: '3100', name: 'Retained Earnings', type: 'Equity', subtype: 'RetainedEarnings', balance: 0, isSystem: true, description: 'Accumulated historic surpluses' },
  { code: '3200', name: 'Current Year Earnings (Surplus)', type: 'Equity', subtype: 'CurrentEarnings', balance: 0, isSystem: true, description: 'Current operating surplus' },

  // INCOME (4000 - 4999)
  { code: '4000', name: 'Sales & Service Revenue', type: 'Income', subtype: 'SalesRevenue', balance: 0, isSystem: true, description: 'Billed sales, services, software and hardware' },
  { code: '4100', name: 'Sales Returns & Allowances (Contra)', type: 'Income', subtype: 'SalesReturn', balance: 0, isSystem: true, description: 'Credit notes and customer allowances' },
  { code: '4900', name: 'Other Income / Interest Income', type: 'Income', subtype: 'Other', balance: 0, isSystem: true, description: 'FD interest and discount received' },

  // EXPENSES (5000 - 6999)
  { code: '5000', name: 'Cost of Goods Sold (COGS)', type: 'Expense', subtype: 'COGS', balance: 0, isSystem: true, description: 'Direct material and direct procurement costs' },
  { code: '5100', name: 'Purchase Returns & Allowances (Contra)', type: 'Expense', subtype: 'PurchaseReturn', balance: 0, isSystem: true, description: 'Debit notes and vendor purchase allowances' },
  { code: '5200', name: 'Staff Payroll & Salaries', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Faculty, engineering and corporate salaries' },
  { code: '5210', name: 'Office Rent & Facilities', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Premises lease and workspace rent' },
  { code: '5220', name: 'Electricity & Power Utility', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Power grid electricity and backup generator diesel' },
  { code: '5230', name: 'Internet & Communication', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'High-speed leased line, broadband and fiber' },
  { code: '5240', name: 'Business Travel & Conveyance', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Flights, trains, hotels and daily client visits' },
  { code: '5250', name: 'Transport & Freight Logistics', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Courier, dispatch, delivery and cargo freight' },
  { code: '5260', name: 'Telephone & Mobile Expenses', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Corporate CUG mobile plans and desk phones' },
  { code: '5300', name: 'Campus IT & Cloud Infrastructure', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'AWS, Google Cloud, SaaS licenses and ERP tools' },
  { code: '5400', name: 'Marketing & Branding Expenses', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Digital ads, exhibitions, flyers and sponsorships' },
  { code: '5500', name: 'Facilities & Maintenance Utility', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'HVAC repair, deep cleaning and plumbing maintenance' },
  { code: '5600', name: 'Academic & Lab Supplies', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Student kits, hardware consumables' },
  { code: '5700', name: 'Compliance & Legal Charges', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Statutory audit, legal retainer, GST filing fees' },
  { code: '5800', name: 'Office Supplies & Stationery', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Paper, toner, pantry supplies, desk accessories' },
  { code: '5810', name: 'General & Property Insurance', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Fire, property, transit and employee health coverage' },
  { code: '5820', name: 'Staff Training & Skill Development', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Workshops, certifications and technical seminars' },
  { code: '5900', name: 'Miscellaneous Operating Expenses', type: 'Expense', subtype: 'OperatingExpense', balance: 0, isSystem: true, description: 'Uncategorized petty disbursements and incidental costs' },
  { code: '6000', name: 'Round-Off / Price Variance Adjustment', type: 'Expense', subtype: 'RoundOff', balance: 0, isSystem: true, description: 'Pence/paise round-offs and invoice variances' },
  { code: '6100', name: 'Bank Charges & Loan Interest', type: 'Expense', subtype: 'InterestExpense', balance: 0, isSystem: true, description: 'EMI interest and bank processing charges' },
];

export class AccountingEngine {
  private accounts: GLAccount[] = [];
  private entries: JournalEntry[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedAccounts = localStorage.getItem(STORAGE_KEYS.CHART_OF_ACCOUNTS);
      if (storedAccounts) {
        this.accounts = JSON.parse(storedAccounts);
        // Ensure default accounts from updated seeds (like 15 default expense categories) exist
        let hasAdded = false;
        DEFAULT_CHART_OF_ACCOUNTS.forEach((def) => {
          if (!this.accounts.some((a) => a.code === def.code)) {
            this.accounts.push({ ...def });
            hasAdded = true;
          }
        });
        if (hasAdded) {
          this.saveAccounts();
        }
      } else {
        this.accounts = [...DEFAULT_CHART_OF_ACCOUNTS];
        this.saveAccounts();
      }

      const storedEntries = localStorage.getItem(STORAGE_KEYS.JOURNAL_ENTRIES);
      if (storedEntries) {
        this.entries = JSON.parse(storedEntries);
      } else {
        this.entries = this.generateInitialJournalEntries();
        this.saveEntries();
      }
    } catch {
      this.accounts = [...DEFAULT_CHART_OF_ACCOUNTS];
      this.entries = [];
    }
  }

  private saveAccounts() {
    try {
      localStorage.setItem(STORAGE_KEYS.CHART_OF_ACCOUNTS, JSON.stringify(this.accounts));
    } catch (e) {
      console.error('Failed to save Chart of Accounts', e);
    }
  }

  private saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNAL_ENTRIES, JSON.stringify(this.entries));
    } catch (e) {
      console.error('Failed to save Journal Entries', e);
    }
  }

  public getAccounts(): GLAccount[] {
    return [...this.accounts];
  }

  public getAccountByCode(code: string): GLAccount | undefined {
    return this.accounts.find((a) => a.code === code);
  }

  public addAccount(account: GLAccount): GLAccount {
    const existingIndex = this.accounts.findIndex((a) => a.code === account.code);
    if (existingIndex >= 0) {
      this.accounts[existingIndex] = { ...this.accounts[existingIndex], ...account };
    } else {
      this.accounts.push(account);
    }
    this.saveAccounts();
    return account;
  }

  /**
   * Returns next unused 4-digit code in the 5200-5900 expense range
   */
  public getNextAvailableExpenseCode(): string {
    const usedCodes = new Set(this.accounts.map((a) => a.code));
    // Check codes 5270, 5280, 5290, 5310, 5320 ... up to 5900
    for (let c = 5270; c <= 5900; c += 10) {
      const codeStr = String(c);
      if (!usedCodes.has(codeStr)) {
        return codeStr;
      }
    }
    // Fallback search any unit step
    for (let c = 5201; c < 5999; c++) {
      const codeStr = String(c);
      if (!usedCodes.has(codeStr)) {
        return codeStr;
      }
    }
    return '5950';
  }

  /**
   * Ensures an Expense GL Account in 5200-5900 range exists. If not, creates one.
   */
  public ensureExpenseAccount(name: string, preferredCode?: string, description?: string): GLAccount {
    if (preferredCode) {
      const existing = this.getAccountByCode(preferredCode);
      if (existing) return existing;
    }
    // Check by name case-insensitive
    const byName = this.accounts.find(
      (a) => a.type === 'Expense' && a.name.toLowerCase() === name.toLowerCase()
    );
    if (byName) return byName;

    const code = preferredCode || this.getNextAvailableExpenseCode();
    const newAcc: GLAccount = {
      code,
      name,
      type: 'Expense',
      subtype: 'OperatingExpense',
      balance: 0,
      description: description || `Operating expense account for ${name}`,
      isSystem: false,
    };
    return this.addAccount(newAcc);
  }

  public getJournalEntries(): JournalEntry[] {
    return [...this.entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Posts a balanced journal entry into the immutable journal ledger
   * Validates sum(debit) === sum(credit)
   * Section 99.2 & Section 60
   */
  public postJournalEntry(params: {
    referenceType: JournalReferenceType;
    referenceId: string;
    referenceNumber: string;
    date: string;
    narration: string;
    lines: JournalLine[];
    createdBy?: string;
  }): JournalEntry {
    const totalDebit = Math.round(params.lines.reduce((s, l) => s + (l.debit || 0), 0) * 100) / 100;
    const totalCredit = Math.round(params.lines.reduce((s, l) => s + (l.credit || 0), 0) * 100) / 100;

    // Small floating point rounding allowance (<= 0.05)
    if (Math.abs(totalDebit - totalCredit) > 0.05) {
      throw new Error(
        `Journal entry unbalanced: Total Debit (₹${totalDebit}) must equal Total Credit (₹${totalCredit})`
      );
    }

    const nextIdNum = this.entries.length + 1;
    const entryNumber = `JE-2026-${String(nextIdNum).padStart(4, '0')}`;

    const newEntry: JournalEntry = {
      id: `je-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entryNumber,
      date: params.date || new Date().toISOString().split('T')[0],
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      referenceNumber: params.referenceNumber,
      narration: params.narration,
      lines: params.lines.map((l) => ({
        ...l,
        debit: Math.round(l.debit * 100) / 100,
        credit: Math.round(l.credit * 100) / 100,
      })),
      totalDebit,
      totalCredit,
      isBalanced: true,
      createdAt: new Date().toISOString(),
      createdBy: params.createdBy || 'System Accounting Engine',
    };

    // Update GL account balances
    params.lines.forEach((line) => {
      const acc = this.accounts.find((a) => a.code === line.accountCode);
      if (acc) {
        if (acc.type === 'Asset' || acc.type === 'Expense') {
          acc.balance += line.debit - line.credit;
        } else {
          // Liability, Equity, Income have credit normal balance
          acc.balance += line.credit - line.debit;
        }
      }
    });

    this.entries.unshift(newEntry);
    this.saveEntries();
    this.saveAccounts();

    return newEntry;
  }

  /**
   * Generates a balanced Trial Balance by calculating debit and credit totals
   * per Section 99.3
   */
  public getTrialBalance(): {
    items: TrialBalanceItem[];
    totalDebit: number;
    totalCredit: number;
    isBalanced: boolean;
  } {
    const items: TrialBalanceItem[] = this.accounts.map((acc) => {
      let debit = 0;
      let credit = 0;
      if (acc.type === 'Asset' || acc.type === 'Expense') {
        if (acc.balance >= 0) {
          debit = acc.balance;
        } else {
          credit = Math.abs(acc.balance);
        }
      } else {
        if (acc.balance >= 0) {
          credit = acc.balance;
        } else {
          debit = Math.abs(acc.balance);
        }
      }
      return {
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        debitBalance: Math.round(debit * 100) / 100,
        creditBalance: Math.round(credit * 100) / 100,
      };
    });

    const totalDebit = Math.round(items.reduce((sum, item) => sum + item.debitBalance, 0) * 100) / 100;
    const totalCredit = Math.round(items.reduce((sum, item) => sum + item.creditBalance, 0) * 100) / 100;

    return {
      items,
      totalDebit,
      totalCredit,
      isBalanced: Math.abs(totalDebit - totalCredit) < 1,
    };
  }

  /**
   * Generates Profit & Loss Statement per Section 56 & 99.3
   */
  public getProfitAndLossStatement(): {
    grossRevenue: number;
    salesReturns: number;
    netRevenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    operatingExpenses: { code: string; name: string; amount: number }[];
    totalOperatingExpenses: number;
    operatingProfit: number;
    interestExpense: number;
    otherIncome: number;
    netProfit: number;
    netProfitMarginPercent: number;
  } {
    const revAccount = this.getAccountByCode('4000');
    const returnAccount = this.getAccountByCode('4100');
    const otherIncAccount = this.getAccountByCode('4900');
    const cogsAccount = this.getAccountByCode('5000');
    const interestAccount = this.getAccountByCode('6100');

    const grossRevenue = revAccount ? Math.max(0, revAccount.balance) : 0;
    const salesReturns = returnAccount ? Math.abs(returnAccount.balance) : 0;
    const netRevenue = grossRevenue - salesReturns;
    const cogs = cogsAccount ? Math.max(0, cogsAccount.balance) : 0;
    const grossProfit = netRevenue - cogs;
    const grossMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

    const opExpAccounts = this.accounts.filter(
      (a) => a.type === 'Expense' && a.code !== '5000' && a.code !== '5100' && a.code !== '6100'
    );

    const operatingExpenses = opExpAccounts.map((a) => ({
      code: a.code,
      name: a.name,
      amount: Math.max(0, a.balance),
    }));

    const totalOperatingExpenses = operatingExpenses.reduce((s, e) => s + e.amount, 0);
    const operatingProfit = grossProfit - totalOperatingExpenses;
    const interestExpense = interestAccount ? Math.max(0, interestAccount.balance) : 0;
    const otherIncome = otherIncAccount ? Math.max(0, otherIncAccount.balance) : 0;
    const netProfit = operatingProfit - interestExpense + otherIncome;
    const netProfitMarginPercent = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    return {
      grossRevenue,
      salesReturns,
      netRevenue,
      cogs,
      grossProfit,
      grossMarginPercent,
      operatingExpenses,
      totalOperatingExpenses,
      operatingProfit,
      interestExpense,
      otherIncome,
      netProfit,
      netProfitMarginPercent,
    };
  }

  /**
   * Generates Balance Sheet / Financial Position per Section 57 & 99.3
   */
  public getFinancialPosition(): {
    assets: { code: string; name: string; amount: number }[];
    totalAssets: number;
    liabilities: { code: string; name: string; amount: number }[];
    totalLiabilities: number;
    equity: { code: string; name: string; amount: number }[];
    totalEquity: number;
    isBalanced: boolean;
  } {
    const assets = this.accounts
      .filter((a) => a.type === 'Asset')
      .map((a) => ({ code: a.code, name: a.name, amount: Math.max(0, a.balance) }));
    const totalAssets = assets.reduce((s, a) => s + a.amount, 0);

    const liabilities = this.accounts
      .filter((a) => a.type === 'Liability')
      .map((a) => ({ code: a.code, name: a.name, amount: Math.max(0, a.balance) }));
    const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);

    const equity = this.accounts
      .filter((a) => a.type === 'Equity')
      .map((a) => ({ code: a.code, name: a.name, amount: a.balance }));
    const totalEquity = equity.reduce((s, e) => s + e.amount, 0);

    return {
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 100,
    };
  }

  /**
   * Pre-loads realistic balanced seed journal entries for traceability
   */
  private generateInitialJournalEntries(): JournalEntry[] {
    return [
      {
        id: 'je-seed-001',
        entryNumber: 'JE-2026-0001',
        date: '2026-09-01',
        referenceType: 'OpeningBalance',
        referenceId: 'OB-FY26',
        referenceNumber: 'OB-2026-001',
        narration: 'Opening financial balance carry-forward for FY 2026-27',
        lines: [
          { accountCode: '1000', accountName: 'Cash on Hand', debit: 145000, credit: 0 },
          { accountCode: '1100', accountName: 'Federal Bank - Current A/c', debit: 1850000, credit: 0 },
          { accountCode: '1300', accountName: 'Inventory Asset', debit: 2450000, credit: 0 },
          { accountCode: '1200', accountName: 'Accounts Receivable', debit: 1280000, credit: 0 },
          { accountCode: '2000', accountName: 'Accounts Payable', debit: 0, credit: 890000 },
          { accountCode: '2200', accountName: 'Loans Payable', debit: 0, credit: 3500000 },
          { accountCode: '3000', accountName: 'Shareholder Capital', debit: 0, credit: 1335000 },
        ],
        totalDebit: 5725000,
        totalCredit: 5725000,
        isBalanced: true,
        createdAt: '2026-09-01T09:00:00.000Z',
        createdBy: 'Finance Officer',
      },
      {
        id: 'je-seed-002',
        entryNumber: 'JE-2026-0002',
        date: '2026-09-03',
        referenceType: 'PurchaseInvoice',
        referenceId: 'pi-101',
        referenceNumber: 'PI-2026-0041',
        narration: 'Purchase invoice for Dell XPS Laptops & Server Upgrades from TechMart Info Ltd',
        lines: [
          { accountCode: '1300', accountName: 'Inventory Asset', debit: 380000, credit: 0, partyId: 'PRT-VND-01', partyName: 'TechMart Info Ltd' },
          { accountCode: '1400', accountName: 'Input GST (ITC Credit)', debit: 68400, credit: 0 },
          { accountCode: '2000', accountName: 'Accounts Payable (Control)', debit: 0, credit: 448400, partyId: 'PRT-VND-01', partyName: 'TechMart Info Ltd' },
        ],
        totalDebit: 448400,
        totalCredit: 448400,
        isBalanced: true,
        createdAt: '2026-09-03T11:20:00.000Z',
        createdBy: 'Purchase Officer',
      },
      {
        id: 'je-seed-003',
        entryNumber: 'JE-2026-0003',
        date: '2026-09-05',
        referenceType: 'SalesInvoice',
        referenceId: 'si-101',
        referenceNumber: 'SI-2026-0082',
        narration: 'Enterprise ERP deployment & infrastructure supply to Apex Global Academy',
        lines: [
          { accountCode: '1200', accountName: 'Accounts Receivable (Control)', debit: 590000, credit: 0, partyId: 'PRT-CUST-01', partyName: 'Apex Global Academy' },
          { accountCode: '5000', accountName: 'Cost of Goods Sold (COGS)', debit: 310000, credit: 0 },
          { accountCode: '4000', accountName: 'Sales & Service Revenue', debit: 0, credit: 500000 },
          { accountCode: '2100', accountName: 'Output GST (Tax Liability)', debit: 0, credit: 90000 },
          { accountCode: '1300', accountName: 'Inventory Asset', debit: 0, credit: 310000 },
        ],
        totalDebit: 900000,
        totalCredit: 900000,
        isBalanced: true,
        createdAt: '2026-09-05T14:45:00.000Z',
        createdBy: 'Sales Officer',
      },
      {
        id: 'je-seed-004',
        entryNumber: 'JE-2026-0004',
        date: '2026-09-08',
        referenceType: 'Payment',
        referenceId: 'pay-101',
        referenceNumber: 'PAY-2026-0012',
        narration: 'Payment to TechMart Info Ltd with 2% Section 194C TDS deduction',
        lines: [
          { accountCode: '2000', accountName: 'Accounts Payable (Control)', debit: 448400, credit: 0, partyId: 'PRT-VND-01', partyName: 'TechMart Info Ltd' },
          { accountCode: '2150', accountName: 'TDS Payable (Statutory)', debit: 0, credit: 7600 },
          { accountCode: '1100', accountName: 'Federal Bank - Current A/c', debit: 0, credit: 440800 },
        ],
        totalDebit: 448400,
        totalCredit: 448400,
        isBalanced: true,
        createdAt: '2026-09-08T16:10:00.000Z',
        createdBy: 'Finance Officer',
      },
      {
        id: 'je-seed-005',
        entryNumber: 'JE-2026-0005',
        date: '2026-09-10',
        referenceType: 'Receipt',
        referenceId: 'rec-101',
        referenceNumber: 'REC-2026-0034',
        narration: 'Customer receipt via NEFT from Apex Global Academy for Inv SI-2026-0082',
        lines: [
          { accountCode: '1100', accountName: 'Federal Bank - Current A/c', debit: 590000, credit: 0 },
          { accountCode: '1200', accountName: 'Accounts Receivable (Control)', debit: 0, credit: 590000, partyId: 'PRT-CUST-01', partyName: 'Apex Global Academy' },
        ],
        totalDebit: 590000,
        totalCredit: 590000,
        isBalanced: true,
        createdAt: '2026-09-10T12:00:00.000Z',
        createdBy: 'Accountant',
      },
    ];
  }
}

export const accountingEngine = new AccountingEngine();
