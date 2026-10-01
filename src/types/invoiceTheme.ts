export type InvoiceThemeStyle =
  | 'classic'        // Classic My Billbook (clean double border, standard GST grid, traditional compact layout)
  | 'stylish'        // Modern Stylish (rich color banner header, rounded card details, badge, prominent totals)
  | 'advanced'       // Advanced GST Professional (statutory compliance, full HSN/SAC summary, reverse charge, bank QR)
  | 'minimal'        // Minimalist Crisp (clean light typography, subtle dividers, modern borderless elegance)
  | 'corporate'      // Corporate Premium (dual-tone header, formal seal box, watermark crest, executive legal terms)
  | 'thermal';       // Compact Thermal / POS (condensed columns, slip layout, high information density)

export type InvoiceThemeColor =
  | 'emerald'        // #0B5D2A (My Billbook Default Emerald Green)
  | 'blue'           // #1E40AF (Sapphire Navy)
  | 'purple'         // #6B21A8 (Royal Purple)
  | 'red'            // #991B1B (Ruby Crimson)
  | 'teal'           // #0F766E (Teal Azure)
  | 'slate'          // #1E293B (Charcoal Slate)
  | 'amber';         // #B45309 (Warm Amber Gold)

export type ThemedDocumentCategory = 'sales' | 'purchase' | 'receipt' | 'payment' | 'inventory' | 'asset';

export interface DocumentThemeConfig {
  themeStyle: InvoiceThemeStyle;
  primaryColor: InvoiceThemeColor;
  showLogo: boolean;
  showBankDetails: boolean;
  showQrCode: boolean;
  showSignatory: boolean;
  showTerms: boolean;
  showHsnSummary: boolean;
  showAmountInWords: boolean;
  showBalanceDue: boolean;
  headerTitle: string;
  termsAndConditions: string;
  signatoryText: string;
  accentHex?: string;
  upiId?: string;
}

export interface InvoiceThemesSettings {
  salesTheme: DocumentThemeConfig;
  purchaseTheme: DocumentThemeConfig;
  receiptTheme: DocumentThemeConfig;
  paymentTheme: DocumentThemeConfig;
}

export interface ColorPaletteDef {
  id: InvoiceThemeColor;
  name: string;
  hex: string;
  primaryClass: string;
  bgLightClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  headerBg: string;
  headerText: string;
}

export const THEME_COLOR_PALETTES: Record<InvoiceThemeColor, ColorPaletteDef> = {
  emerald: {
    id: 'emerald',
    name: 'Emerald Green (My Billbook)',
    hex: '#0B5D2A',
    primaryClass: 'bg-[#0B5D2A]',
    bgLightClass: 'bg-[#EAF7EF]',
    borderClass: 'border-[#0B5D2A]',
    textClass: 'text-[#0B5D2A]',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    headerBg: '#0B5D2A',
    headerText: '#FFFFFF',
  },
  blue: {
    id: 'blue',
    name: 'Sapphire Navy',
    hex: '#1E40AF',
    primaryClass: 'bg-[#1E40AF]',
    bgLightClass: 'bg-blue-50',
    borderClass: 'border-[#1E40AF]',
    textClass: 'text-[#1E40AF]',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    headerBg: '#1E40AF',
    headerText: '#FFFFFF',
  },
  purple: {
    id: 'purple',
    name: 'Royal Purple',
    hex: '#6B21A8',
    primaryClass: 'bg-[#6B21A8]',
    bgLightClass: 'bg-purple-50',
    borderClass: 'border-[#6B21A8]',
    textClass: 'text-[#6B21A8]',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
    headerBg: '#6B21A8',
    headerText: '#FFFFFF',
  },
  red: {
    id: 'red',
    name: 'Ruby Crimson',
    hex: '#991B1B',
    primaryClass: 'bg-[#991B1B]',
    bgLightClass: 'bg-red-50',
    borderClass: 'border-[#991B1B]',
    textClass: 'text-[#991B1B]',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    headerBg: '#991B1B',
    headerText: '#FFFFFF',
  },
  teal: {
    id: 'teal',
    name: 'Teal Azure',
    hex: '#0F766E',
    primaryClass: 'bg-[#0F766E]',
    bgLightClass: 'bg-teal-50',
    borderClass: 'border-[#0F766E]',
    textClass: 'text-[#0F766E]',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
    headerBg: '#0F766E',
    headerText: '#FFFFFF',
  },
  slate: {
    id: 'slate',
    name: 'Charcoal Slate',
    hex: '#1E293B',
    primaryClass: 'bg-[#1E293B]',
    bgLightClass: 'bg-slate-100',
    borderClass: 'border-[#1E293B]',
    textClass: 'text-[#1E293B]',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    headerBg: '#1E293B',
    headerText: '#FFFFFF',
  },
  amber: {
    id: 'amber',
    name: 'Warm Amber Gold',
    hex: '#B45309',
    primaryClass: 'bg-[#B45309]',
    bgLightClass: 'bg-amber-50',
    borderClass: 'border-[#B45309]',
    textClass: 'text-[#B45309]',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    headerBg: '#B45309',
    headerText: '#FFFFFF',
  },
};

export const DEFAULT_INVOICE_THEMES: InvoiceThemesSettings = {
  salesTheme: {
    themeStyle: 'classic',
    primaryColor: 'emerald',
    showLogo: true,
    showBankDetails: true,
    showQrCode: true,
    showSignatory: true,
    showTerms: true,
    showHsnSummary: true,
    showAmountInWords: true,
    showBalanceDue: true,
    headerTitle: 'TAX INVOICE',
    termsAndConditions:
      '1. Goods once sold will not be taken back without prior authorization.\n2. Interest @ 18% p.a. will be charged if payment is delayed beyond due date.\n3. All disputes are subject to Kochi jurisdiction.',
    signatoryText: 'For MYSAR GLOBAL TRADING LLC\nAuthorized Signatory',
    upiId: 'mysarglobal@hdfcbank',
  },
  purchaseTheme: {
    themeStyle: 'advanced',
    primaryColor: 'blue',
    showLogo: true,
    showBankDetails: true,
    showQrCode: false,
    showSignatory: true,
    showTerms: true,
    showHsnSummary: true,
    showAmountInWords: true,
    showBalanceDue: true,
    headerTitle: 'PURCHASE BILL / ORDER',
    termsAndConditions:
      '1. Items received subject to physical inspection & quality verification.\n2. Payment will be released strictly within agreed credit terms.\n3. Goods must match specification and PO reference.',
    signatoryText: 'For MYSAR GLOBAL TRADING LLC\nProcurement & Stores In-Charge',
    upiId: '',
  },
  receiptTheme: {
    themeStyle: 'stylish',
    primaryColor: 'emerald',
    showLogo: true,
    showBankDetails: true,
    showQrCode: true,
    showSignatory: true,
    showTerms: true,
    showHsnSummary: false,
    showAmountInWords: true,
    showBalanceDue: true,
    headerTitle: 'OFFICIAL RECEIPT / PAYMENT IN',
    termsAndConditions:
      '1. Receipt valid subject to realization of cheque / online fund transfer.\n2. Please quote this receipt number in all future payment correspondences.\n3. This is a computer-generated money receipt.',
    signatoryText: 'For MYSAR GLOBAL TRADING LLC\nAccounts & Finance Department',
    upiId: 'mysarglobal@hdfcbank',
  },
  paymentTheme: {
    themeStyle: 'corporate',
    primaryColor: 'slate',
    showLogo: true,
    showBankDetails: true,
    showQrCode: false,
    showSignatory: true,
    showTerms: true,
    showHsnSummary: false,
    showAmountInWords: true,
    showBalanceDue: false,
    headerTitle: 'PAYMENT VOUCHER / PAYMENT OUT',
    termsAndConditions:
      '1. Payment debited as per approved purchase order & vendor invoice settlement.\n2. TDS withheld wherever applicable under IT Act provisions.\n3. Payee acknowledges receipt of payment in full and final settlement.',
    signatoryText: 'For MYSAR GLOBAL TRADING LLC\nAuthorized Financial Controller',
    upiId: '',
  },
};
