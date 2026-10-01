/**
 * gstTaxEngine.ts
 * 
 * Core GST & Tax Compliance Engine for Casbiro Solutions Private Limited (MYSAR).
 * Implements:
 * - Mod-36 GSTIN checksum validation
 * - Automatic Intra-state vs Inter-state detection based on Party state vs Company state (Kerala, 32)
 * - Detailed Tax Breakup: CGST / SGST / IGST / CESS
 * - Reverse Charge Mechanism (RCM) self-invoicing and accounting rules
 * - TDS & TCS calculations and Form 26Q / 27Q report models
 */

import {
  TaxMasterRecord,
  RcmSelfInvoiceRecord,
  TdsRecord,
  TdsEntryRecord,
  TcsEntryRecord,
  TaxType,
} from '../../types/finance';
import { COMPANY_CONFIG } from './erpFinanceStorage';
import { accountingEngine } from './accountingEngine';

// Mod-36 Character set for GSTIN validation (0-9 followed by A-Z)
const MOD36_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Validates a 15-character Indian GSTIN with format regex and Luhn Mod-36 checksum algorithm.
 */
export function validateGstinChecksum(gstin: string): {
  isValid: boolean;
  stateCode?: string;
  pan?: string;
  entityCode?: string;
  checksumDigit?: string;
  error?: string;
} {
  if (!gstin) {
    return { isValid: false, error: 'GSTIN is empty' };
  }

  const clean = gstin.trim().toUpperCase();

  if (clean.length !== 15) {
    return { isValid: false, error: 'GSTIN must be exactly 15 alphanumeric characters' };
  }

  // Regex pattern for GSTIN: 2 digits (state), 5 letters, 4 digits, 1 letter (PAN), 1 char (entity), 1 'Z', 1 check char
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(clean)) {
    return { isValid: false, error: 'Invalid GSTIN structure or format' };
  }

  const stateCode = clean.substring(0, 2);
  const pan = clean.substring(2, 12);
  const entityCode = clean.substring(12, 13);
  const checkChar = clean.substring(14, 15);

  // Luhn Mod-36 Checksum verification
  let factor = 1;
  let sum = 0;
  const mod = 36;

  for (let i = 0; i < 14; i++) {
    const char = clean[i];
    const codePoint = MOD36_CHARS.indexOf(char);
    if (codePoint === -1) {
      return { isValid: false, error: `Invalid character '${char}' in GSTIN` };
    }

    factor = (i % 2 === 0) ? 1 : 2;
    const digit = codePoint * factor;
    sum += Math.floor(digit / mod) + (digit % mod);
  }

  const remainder = sum % mod;
  const calculatedCodePoint = (mod - remainder) % mod;
  const expectedCheckChar = MOD36_CHARS[calculatedCodePoint];

  const isValid = expectedCheckChar === checkChar;

  return {
    isValid,
    stateCode,
    pan,
    entityCode,
    checksumDigit: checkChar,
    error: isValid ? undefined : `Checksum mismatch (expected '${expectedCheckChar}', got '${checkChar}')`,
  };
}

/**
 * Determine whether a transaction is Intra-State or Inter-State
 */
export function detectSupplyType(
  partyState: string,
  partyStateCode?: string,
  companyStateCode: string = COMPANY_CONFIG.stateCode
): { isIntraState: boolean; stateCodeUsed: string; partyState: string } {
  const compCode = (companyStateCode || '32').padStart(2, '0');
  let pCode = (partyStateCode || '').trim();

  // If code not provided, attempt to infer from state name
  if (!pCode && partyState) {
    const STATE_CODE_MAP: Record<string, string> = {
      kerala: '32',
      maharashtra: '27',
      karnataka: '29',
      'tamil nadu': '33',
      delhi: '07',
      telangana: '36',
      'andhra pradesh': '37',
      gujarat: '24',
      'west bengal': '19',
      rajasthan: '08',
      'uttar pradesh': '09',
    };
    pCode = STATE_CODE_MAP[partyState.toLowerCase()] || '';
  }

  pCode = pCode ? pCode.padStart(2, '0') : compCode; // default to intra if unknown
  const isIntraState = pCode === compCode;

  return {
    isIntraState,
    stateCodeUsed: pCode,
    partyState: partyState || (isIntraState ? 'Kerala' : 'Other State'),
  };
}

export interface TaxBreakupResult {
  taxableAmount: number;
  totalRate: number;
  isIntraState: boolean;
  isRcm: boolean;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cessRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  grandTotal: number;
  rcmTaxPayable: number;
}

/**
 * Calculate multi-tier tax breakup (CGST + SGST vs IGST + CESS) with RCM support
 */
export function calculateTaxBreakup(params: {
  amount: number;
  taxRatePercent: number;
  partyState: string;
  partyStateCode?: string;
  isRcm?: boolean;
  cessPercent?: number;
  isSez?: boolean;
}): TaxBreakupResult {
  const {
    amount,
    taxRatePercent,
    partyState,
    partyStateCode,
    isRcm = false,
    cessPercent = 0,
    isSez = false,
  } = params;

  const { isIntraState } = detectSupplyType(partyState, partyStateCode);

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  const cessRate = cessPercent || 0;

  if (isSez) {
    // SEZ units are zero-rated / treated as inter-state with 0% tax or IGST
    igstRate = 0;
    cgstRate = 0;
    sgstRate = 0;
  } else if (isIntraState) {
    cgstRate = taxRatePercent / 2;
    sgstRate = taxRatePercent / 2;
    igstRate = 0;
  } else {
    igstRate = taxRatePercent;
    cgstRate = 0;
    sgstRate = 0;
  }

  const cgstAmount = Math.round((amount * (cgstRate / 100)) * 100) / 100;
  const sgstAmount = Math.round((amount * (sgstRate / 100)) * 100) / 100;
  const igstAmount = Math.round((amount * (igstRate / 100)) * 100) / 100;
  const cessAmount = Math.round((amount * (cessRate / 100)) * 100) / 100;

  const totalTaxAmount = cgstAmount + sgstAmount + igstAmount + cessAmount;

  // In RCM, the vendor does not collect tax; tax is paid directly by recipient
  const grandTotal = isRcm ? amount : amount + totalTaxAmount;
  const rcmTaxPayable = isRcm ? totalTaxAmount : 0;

  return {
    taxableAmount: amount,
    totalRate: taxRatePercent,
    isIntraState,
    isRcm,
    cgstRate,
    sgstRate,
    igstRate,
    cessRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    cessAmount,
    totalTaxAmount,
    grandTotal,
    rcmTaxPayable,
  };
}

/**
 * Standard default Tax Master rates for India GST
 */
export const DEFAULT_TAX_MASTERS: TaxMasterRecord[] = [
  {
    id: 'TAX-001',
    taxName: 'GST 18% (Standard Rate)',
    taxCode: 'GST-18',
    rate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    cess: 0,
    taxType: 'Sales Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: false,
    appliesTo: 'Both',
    description: 'Standard rate for IT consulting, cloud services, and office equipment',
  },
  {
    id: 'TAX-002',
    taxName: 'GST 12% (IT Hardware & Peripherals)',
    taxCode: 'GST-12',
    rate: 12,
    cgst: 6,
    sgst: 6,
    igst: 12,
    cess: 0,
    taxType: 'Purchase Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: false,
    appliesTo: 'Goods',
    description: 'Hardware, printers, computing accessories and monitors',
  },
  {
    id: 'TAX-003',
    taxName: 'GST 5% (Essential Printables & Consumables)',
    taxCode: 'GST-05',
    rate: 5,
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    cess: 0,
    taxType: 'Purchase Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: false,
    appliesTo: 'Goods',
    description: 'Paper, books, educational stationery and essential consumables',
  },
  {
    id: 'TAX-004',
    taxName: 'GST 28% (Luxury & Heavy Electronics)',
    taxCode: 'GST-28',
    rate: 28,
    cgst: 14,
    sgst: 14,
    igst: 28,
    cess: 0,
    taxType: 'Sales Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: false,
    appliesTo: 'Goods',
    description: 'High-end audiovisual suites and heavy air conditioning units',
  },
  {
    id: 'TAX-005',
    taxName: 'GST 0% (Exempt / Nil Rated)',
    taxCode: 'GST-00',
    rate: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    cess: 0,
    taxType: 'Expense Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: false,
    appliesTo: 'Both',
    description: 'Exempt curriculum materials, interest, statutory fees',
  },
  {
    id: 'TAX-006',
    taxName: 'RCM 18% (Legal, Audit & Director Services)',
    taxCode: 'RCM-18',
    rate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    cess: 0,
    taxType: 'Expense Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: true,
    appliesTo: 'Services',
    description: 'Reverse Charge on Advocate legal fees and Director services (Sec 9(3))',
  },
  {
    id: 'TAX-007',
    taxName: 'RCM 5% (Goods Transport Agency / Freight)',
    taxCode: 'RCM-05',
    rate: 5,
    cgst: 2.5,
    sgst: 2.5,
    igst: 5,
    cess: 0,
    taxType: 'Purchase Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: true,
    appliesTo: 'Services',
    description: 'GTA Inward logistics reverse charge without input tax credit from transporter',
  },
  {
    id: 'TAX-008',
    taxName: 'GST 18% (Purchase Return Tax)',
    taxCode: 'PR-GST-18',
    rate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    cess: 0,
    taxType: 'Purchase Return Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: false,
    appliesTo: 'Goods',
    description: 'Debit Note tax reversal on returned equipment or components',
  },
  {
    id: 'TAX-009',
    taxName: 'GST 18% (Sales Return Tax)',
    taxCode: 'SR-GST-18',
    rate: 18,
    cgst: 9,
    sgst: 9,
    igst: 18,
    cess: 0,
    taxType: 'Sales Return Tax',
    effectiveDate: '2025-04-01',
    status: 'Active',
    isRcm: false,
    appliesTo: 'Both',
    description: 'Credit Note tax adjustment on returned goods or billed discounts',
  },
];

/**
 * Standard TDS Sections configured for Indian Income Tax Act
 */
export const DEFAULT_TDS_SECTIONS: TdsRecord[] = [
  {
    id: 'TDS-194C',
    section: '194C',
    description: 'Payment to Contractors & Sub-contractors (Civil, Facility, Transport)',
    rateIndividual: 1, // 1%
    rateCompany: 2, // 2%
    thresholdLimit: 30000, // Single transaction ₹30,000 or aggregate ₹1,00,000
    status: 'Active',
  },
  {
    id: 'TDS-194J',
    section: '194J',
    description: 'Fees for Professional or Technical Services (Software, Legal, Medical)',
    rateIndividual: 10,
    rateCompany: 10, // 2% for tech BPO, 10% for professional
    thresholdLimit: 30000,
    status: 'Active',
  },
  {
    id: 'TDS-194I',
    section: '194I',
    description: 'Rent on Land, Building, Furniture or Equipment',
    rateIndividual: 10,
    rateCompany: 10, // 2% for machinery, 10% for land/building
    thresholdLimit: 240000,
    status: 'Active',
  },
  {
    id: 'TDS-194Q',
    section: '194Q',
    description: 'Deduction of Tax at Source on Payment for Purchase of Goods (>₹50L)',
    rateIndividual: 0.1,
    rateCompany: 0.1,
    thresholdLimit: 5000000,
    status: 'Active',
  },
  {
    id: 'TDS-194H',
    section: '194H',
    description: 'Commission or Brokerage Services',
    rateIndividual: 5,
    rateCompany: 5,
    thresholdLimit: 15000,
    status: 'Active',
  },
];

/**
 * Seed TDS Deduction history for Form 26Q reports
 */
export const SEED_TDS_ENTRIES: TdsEntryRecord[] = [
  {
    id: 'TDS-ENT-001',
    paymentId: 'pmt-101',
    paymentNumber: 'PMT-2026-0042',
    date: '2026-04-14',
    vendorId: 'VND-001',
    vendorName: 'Apex Cloud Systems Private Limited',
    vendorPan: 'AABCA1234F',
    section: '194J',
    grossAmount: 180000,
    tdsRate: 10,
    tdsAmount: 18000,
    netPaidAmount: 162000,
    challanNumber: 'CHL-004821',
    bsrCode: '0210045',
    depositDate: '2026-05-06',
    certificateIssued: true,
    certificateNumber: 'TDS-CERT-2026-Q1-001',
    quarter: 'Q1',
  },
  {
    id: 'TDS-ENT-002',
    paymentId: 'pmt-102',
    paymentNumber: 'PMT-2026-0056',
    date: '2026-05-18',
    vendorId: 'VND-002',
    vendorName: 'Sterling Facility & Maintenance Works',
    vendorPan: 'AABCB4455G',
    section: '194C',
    grossAmount: 95000,
    tdsRate: 2,
    tdsAmount: 1900,
    netPaidAmount: 93100,
    challanNumber: 'CHL-005912',
    bsrCode: '0210045',
    depositDate: '2026-06-05',
    certificateIssued: true,
    certificateNumber: 'TDS-CERT-2026-Q1-002',
    quarter: 'Q1',
  },
  {
    id: 'TDS-ENT-003',
    paymentId: 'pmt-103',
    paymentNumber: 'PMT-2026-0078',
    date: '2026-06-22',
    vendorId: 'VND-003',
    vendorName: 'Prime Heights Commercial Properties',
    vendorPan: 'AABCP1122Q',
    section: '194I',
    grossAmount: 250000,
    tdsRate: 10,
    tdsAmount: 25000,
    netPaidAmount: 225000,
    challanNumber: 'CHL-006411',
    bsrCode: '0210045',
    depositDate: '2026-07-06',
    certificateIssued: true,
    certificateNumber: 'TDS-CERT-2026-Q1-003',
    quarter: 'Q1',
  },
  {
    id: 'TDS-ENT-004',
    paymentId: 'pmt-104',
    paymentNumber: 'PMT-2026-0091',
    date: '2026-07-15',
    vendorId: 'VND-004',
    vendorName: 'Infosol Consultancy Services',
    vendorPan: 'AAECZ3344P',
    section: '194J',
    grossAmount: 120000,
    tdsRate: 10,
    tdsAmount: 12000,
    netPaidAmount: 108000,
    challanNumber: 'CHL-007833',
    bsrCode: '0210045',
    depositDate: '2026-08-05',
    certificateIssued: false,
    quarter: 'Q2',
  },
  {
    id: 'TDS-ENT-005',
    paymentId: 'pmt-105',
    paymentNumber: 'PMT-2026-0112',
    date: '2026-08-20',
    vendorId: 'VND-005',
    vendorName: 'QuickLogistics Express Freight',
    vendorPan: 'AABCT9988E',
    section: '194C',
    grossAmount: 64000,
    tdsRate: 1,
    tdsAmount: 640,
    netPaidAmount: 63360,
    challanNumber: 'CHL-008122',
    bsrCode: '0210045',
    depositDate: '2026-09-06',
    certificateIssued: false,
    quarter: 'Q2',
  },
];

/**
 * Seed RCM Self-Invoice Records
 */
export const SEED_RCM_VOUCHERS: RcmSelfInvoiceRecord[] = [
  {
    id: 'RCM-VCH-001',
    voucherNumber: 'SLF-INV-2026-001',
    date: '2026-05-12',
    vendorName: 'Advocate V. K. Nambiar & Associates',
    natureOfSupply: 'Legal Advisory & Corporate Compliance',
    taxableAmount: 45000,
    cgstAmount: 4050,
    sgstAmount: 4050,
    igstAmount: 0,
    cessAmount: 0,
    totalTaxAmount: 8100,
    totalVoucherAmount: 53100,
    itcClaimed: true,
    status: 'Paid & Claimed',
    notes: 'Legal opinion for cross-border software licensing terms under Sec 9(3)',
  },
  {
    id: 'RCM-VCH-002',
    voucherNumber: 'SLF-INV-2026-002',
    date: '2026-06-25',
    vendorName: 'Cochin Transporters Association (GTA)',
    natureOfSupply: 'Goods Transport Agency (GTA) Freight',
    taxableAmount: 32000,
    cgstAmount: 800,
    sgstAmount: 800,
    igstAmount: 0,
    cessAmount: 0,
    totalTaxAmount: 1600,
    totalVoucherAmount: 33600,
    itcClaimed: true,
    status: 'Paid & Claimed',
    notes: 'Server rack interstate logistics shipment via GTA without ITC consignment note',
  },
  {
    id: 'RCM-VCH-003',
    voucherNumber: 'SLF-INV-2026-003',
    date: '2026-08-10',
    vendorName: 'Independent Director Fee - Dr. K. Menon',
    natureOfSupply: 'Director Board Meeting Sitting Fees',
    taxableAmount: 50000,
    cgstAmount: 4500,
    sgstAmount: 4500,
    igstAmount: 0,
    cessAmount: 0,
    totalTaxAmount: 9000,
    totalVoucherAmount: 59000,
    itcClaimed: true,
    status: 'Paid & Claimed',
    notes: 'Director remuneration reverse charge tax liability under Sec 9(3)',
  },
];

class GstTaxEngineService {
  private taxMasters: TaxMasterRecord[] = [];
  private tdsSections: TdsRecord[] = [];
  private tdsEntries: TdsEntryRecord[] = [];
  private rcmVouchers: RcmSelfInvoiceRecord[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const storedTaxes = localStorage.getItem('mysar_erp_tax_masters_v1');
      this.taxMasters = storedTaxes ? JSON.parse(storedTaxes) : [...DEFAULT_TAX_MASTERS];

      const storedTds = localStorage.getItem('mysar_erp_tds_sections_v1');
      this.tdsSections = storedTds ? JSON.parse(storedTds) : [...DEFAULT_TDS_SECTIONS];

      const storedEntries = localStorage.getItem('mysar_erp_tds_entries_v1');
      this.tdsEntries = storedEntries ? JSON.parse(storedEntries) : [...SEED_TDS_ENTRIES];

      const storedRcm = localStorage.getItem('mysar_erp_rcm_vouchers_v1');
      this.rcmVouchers = storedRcm ? JSON.parse(storedRcm) : [...SEED_RCM_VOUCHERS];
    } catch {
      this.taxMasters = [...DEFAULT_TAX_MASTERS];
      this.tdsSections = [...DEFAULT_TDS_SECTIONS];
      this.tdsEntries = [...SEED_TDS_ENTRIES];
      this.rcmVouchers = [...SEED_RCM_VOUCHERS];
    }
  }

  private persistTaxes() {
    localStorage.setItem('mysar_erp_tax_masters_v1', JSON.stringify(this.taxMasters));
  }

  private persistTdsEntries() {
    localStorage.setItem('mysar_erp_tds_entries_v1', JSON.stringify(this.tdsEntries));
  }

  private persistRcmVouchers() {
    localStorage.setItem('mysar_erp_rcm_vouchers_v1', JSON.stringify(this.rcmVouchers));
  }

  // --- TAX MASTERS CRUD ---
  public getTaxMasters(): TaxMasterRecord[] {
    return this.taxMasters;
  }

  public saveTaxMaster(tax: Partial<TaxMasterRecord> & { taxName: string; taxCode: string; rate: number }): TaxMasterRecord {
    const id = tax.id || `TAX-${Date.now().toString().slice(-4)}`;
    const cgst = tax.cgst !== undefined ? tax.cgst : tax.rate / 2;
    const sgst = tax.sgst !== undefined ? tax.sgst : tax.rate / 2;
    const igst = tax.igst !== undefined ? tax.igst : tax.rate;

    const record: TaxMasterRecord = {
      id,
      taxName: tax.taxName,
      taxCode: tax.taxCode,
      rate: Number(tax.rate),
      cgst: Number(cgst),
      sgst: Number(sgst),
      igst: Number(igst),
      cess: Number(tax.cess || 0),
      taxType: tax.taxType || 'Purchase Tax',
      effectiveDate: tax.effectiveDate || new Date().toISOString().split('T')[0],
      status: tax.status || 'Active',
      isRcm: !!tax.isRcm,
      appliesTo: tax.appliesTo || 'Both',
      description: tax.description || '',
    };

    const idx = this.taxMasters.findIndex((t) => t.id === id);
    if (idx >= 0) {
      this.taxMasters[idx] = record;
    } else {
      this.taxMasters.push(record);
    }

    this.persistTaxes();
    return record;
  }

  public deleteTaxMaster(id: string): boolean {
    const initLen = this.taxMasters.length;
    this.taxMasters = this.taxMasters.filter((t) => t.id !== id);
    if (this.taxMasters.length !== initLen) {
      this.persistTaxes();
      return true;
    }
    return false;
  }

  // --- TDS CRUD & CALCULATIONS ---
  public getTdsSections(): TdsRecord[] {
    return this.tdsSections;
  }

  public getTdsEntries(): TdsEntryRecord[] {
    return this.tdsEntries;
  }

  public recordTdsDeduction(entry: Omit<TdsEntryRecord, 'id'>): TdsEntryRecord {
    const newEntry: TdsEntryRecord = {
      ...entry,
      id: `TDS-ENT-${Date.now().toString().slice(-4)}`,
    };
    this.tdsEntries.unshift(newEntry);
    this.persistTdsEntries();
    return newEntry;
  }

  // --- RCM SELF-INVOICING ---
  public getRcmVouchers(): RcmSelfInvoiceRecord[] {
    return this.rcmVouchers;
  }

  public createRcmSelfInvoice(params: {
    vendorName: string;
    vendorGstin?: string;
    natureOfSupply: string;
    taxableAmount: number;
    ratePercent: number;
    partyState?: string;
    partyStateCode?: string;
    date?: string;
    notes?: string;
  }): RcmSelfInvoiceRecord {
    const date = params.date || new Date().toISOString().split('T')[0];
    const voucherNumber = `SLF-INV-${new Date().getFullYear()}-${(this.rcmVouchers.length + 1).toString().padStart(3, '0')}`;

    const breakup = calculateTaxBreakup({
      amount: params.taxableAmount,
      taxRatePercent: params.ratePercent,
      partyState: params.partyState || 'Kerala',
      partyStateCode: params.partyStateCode || '32',
      isRcm: true,
    });

    // Generate accounting journal entry for RCM:
    // Dr. ITC Input Tax Credit RCM (GL 1315)
    // Cr. Output Tax Liability RCM (GL 2160)
    const journalEntry = accountingEngine.postJournalEntry({
      referenceType: 'Journal',
      referenceId: `rcm-${Date.now()}`,
      referenceNumber: voucherNumber,
      date,
      narration: `RCM Self-Invoice: ${params.natureOfSupply} from ${params.vendorName} (Taxable ₹${params.taxableAmount})`,
      lines: [
        {
          accountCode: '1315',
          accountName: 'Input Tax Credit - RCM (Asset)',
          debit: breakup.totalTaxAmount,
          credit: 0,
        },
        {
          accountCode: '2160',
          accountName: 'GST Output Liability - RCM (Liability)',
          debit: 0,
          credit: breakup.totalTaxAmount,
        },
      ],
      createdBy: 'GST Tax Compliance Engine',
    });

    const record: RcmSelfInvoiceRecord = {
      id: `RCM-${Date.now().toString().slice(-4)}`,
      voucherNumber,
      date,
      vendorName: params.vendorName,
      vendorGstin: params.vendorGstin,
      natureOfSupply: params.natureOfSupply,
      taxableAmount: params.taxableAmount,
      cgstAmount: breakup.cgstAmount,
      sgstAmount: breakup.sgstAmount,
      igstAmount: breakup.igstAmount,
      cessAmount: breakup.cessAmount,
      totalTaxAmount: breakup.totalTaxAmount,
      totalVoucherAmount: params.taxableAmount + breakup.totalTaxAmount,
      itcClaimed: true,
      status: 'Paid & Claimed',
      journalEntryId: journalEntry.id,
      notes: params.notes,
    };

    this.rcmVouchers.unshift(record);
    this.persistRcmVouchers();
    return record;
  }
}

export const gstTaxEngine = new GstTaxEngineService();
