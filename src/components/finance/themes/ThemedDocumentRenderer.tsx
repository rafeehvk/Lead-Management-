import React from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Printer,
  FileText,
  Receipt,
  ShoppingBag,
  Truck,
  ArrowRight,
} from 'lucide-react';
import {
  DocumentThemeConfig,
  ThemedDocumentCategory,
  THEME_COLOR_PALETTES,
} from '../../../types/invoiceTheme';
import { storage } from '../../../services/storageService';

export interface ThemedDocumentData {
  documentNumber: string;
  documentType: string;
  date: string;
  dueDate?: string;
  referenceNumber?: string;
  paymentMethod?: string;
  partyName: string;
  partyGstin?: string;
  partyAddress?: string;
  partyState?: string;
  partyPhone?: string;
  items: Array<{
    id: string;
    name: string;
    description?: string;
    hsn: string;
    quantity: number;
    unit: string;
    rate: number;
    taxable: number;
    taxPercent: number;
    taxTotal: number;
    total: number;
  }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  otherCharges?: number;
  discount?: number;
  grandTotal: number;
  allocations?: Array<{
    invoiceNumber: string;
    amount: number;
  }>;
  tdsAmount?: number;
  tdsSection?: string;
  accountName?: string;
  previousBalance?: number;
  signatoryName?: string;
  signatoryRole?: string;
}

export interface ThemedDocumentRendererProps {
  category: ThemedDocumentCategory;
  themeConfig: DocumentThemeConfig;
  data?: ThemedDocumentData;
  isSample?: boolean;
  currentUserName?: string;
  currentUserRole?: string;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val || 0);
};

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teen = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n < 10) return single[n];
    if (n < 20) return teen[n - 10];
    const unit = n % 10;
    return `${tens[Math.floor(n / 10)]}${unit ? ' ' + single[unit] : ''}`;
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred > 0) {
      res += `${single[hundred]} Hundred`;
      if (rest > 0) res += ' and ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  const crore = Math.floor(rounded / 10000000);
  const lakh = Math.floor((rounded % 10000000) / 100000);
  const thousand = Math.floor((rounded % 100000) / 1000);
  const hundred = rounded % 1000;

  let words = '';
  if (crore > 0) words += `${convertTwoDigits(crore)} Crore `;
  if (lakh > 0) words += `${convertTwoDigits(lakh)} Lakh `;
  if (thousand > 0) words += `${convertTwoDigits(thousand)} Thousand `;
  if (hundred > 0) words += convertThreeDigits(hundred);

  return `${words.trim()} Rupees Only`;
}

// Sample fallback dataset for interactive previewing in Settings
const SAMPLE_DATA: Partial<Record<ThemedDocumentCategory, ThemedDocumentData>> = {
  sales: {
    documentNumber: 'INV-2026-0842',
    documentType: 'Tax Invoice',
    date: '2026-09-27',
    dueDate: '2026-10-12',
    referenceNumber: 'PO-MYSAR-9921',
    paymentMethod: 'Bank Transfer (NEFT/RTGS)',
    partyName: 'Apex Educational Consortium Pvt Ltd',
    partyGstin: '32AABCA4321A1Z2',
    partyAddress: 'Techno Campus, Suite 402, Civil Station Road, Ernakulam, Kerala - 682030',
    partyState: 'Kerala (32)',
    partyPhone: '+91 98470 12345',
    items: [
      {
        id: '1',
        name: 'Enterprise School ERP Campus Suite',
        description: 'Annual cloud subscription license including student management & LMS',
        hsn: '998313',
        quantity: 1,
        unit: 'Year',
        rate: 85000,
        taxable: 85000,
        taxPercent: 18,
        taxTotal: 15300,
        total: 100300,
      },
      {
        id: '2',
        name: 'RFID Biometric Smart Attendance Terminal',
        description: 'Dual-frequency Wi-Fi card reader with cloud sync',
        hsn: '847160',
        quantity: 3,
        unit: 'Units',
        rate: 12500,
        taxable: 37500,
        taxPercent: 18,
        taxTotal: 6750,
        total: 44250,
      },
      {
        id: '3',
        name: 'PVC Student ID Smart Cards (Bulk)',
        description: 'Full color 300dpi thermal encoded badge cards',
        hsn: '392690',
        quantity: 500,
        unit: 'Pcs',
        rate: 45,
        taxable: 22500,
        taxPercent: 12,
        taxTotal: 2700,
        total: 25200,
      },
    ],
    subtotal: 145000,
    cgst: 12375,
    sgst: 12375,
    igst: 0,
    otherCharges: 1500,
    discount: 5000,
    grandTotal: 166250,
    previousBalance: 18400,
  },
  purchase: {
    documentNumber: 'PO-2026-0319',
    documentType: 'Purchase Bill / Order',
    date: '2026-09-27',
    dueDate: '2026-10-27',
    referenceNumber: 'RFQ-2026-104',
    paymentMethod: 'Direct Bank Transfer',
    partyName: 'National Plastic & Smartcards Corp',
    partyGstin: '32BBBCP9988G1ZQ',
    partyAddress: 'Industrial Development Area, Edayar, Aluva, Kerala - 683502',
    partyState: 'Kerala (32)',
    partyPhone: '+91 484 254 9900',
    items: [
      {
        id: '1',
        name: 'CR-80 Blank PVC Cards Premium Grade',
        description: 'Magnetic stripe & contactless chip dual substrate',
        hsn: '392690',
        quantity: 2000,
        unit: 'Pcs',
        rate: 18.5,
        taxable: 37000,
        taxPercent: 18,
        taxTotal: 6660,
        total: 43660,
      },
      {
        id: '2',
        name: 'YMCKO Dye-Sublimation Color Ribbon',
        description: 'High capacity 300 impressions per spool',
        hsn: '961210',
        quantity: 8,
        unit: 'Spools',
        rate: 3400,
        taxable: 27200,
        taxPercent: 18,
        taxTotal: 4896,
        total: 32096,
      },
    ],
    subtotal: 64200,
    cgst: 5778,
    sgst: 5778,
    igst: 0,
    otherCharges: 850,
    discount: 0,
    grandTotal: 76606,
    previousBalance: 42000,
  },
  receipt: {
    documentNumber: 'RCP-2026-0518',
    documentType: 'Official Receipt',
    date: '2026-09-27',
    referenceNumber: 'UPI-REF-99201948',
    paymentMethod: 'UPI / Immediate Transfer',
    accountName: 'HDFC Corporate Operating A/c (..8239)',
    partyName: 'St. Thomas Higher Secondary Academy',
    partyGstin: '32AAACT8821K1ZZ',
    partyAddress: 'Bishop Palace Road, Thrissur, Kerala - 680005',
    partyState: 'Kerala (32)',
    partyPhone: '+91 94471 22334',
    items: [],
    allocations: [
      { invoiceNumber: 'INV-2026-0791', amount: 55000 },
      { invoiceNumber: 'INV-2026-0814', amount: 28500 },
    ],
    subtotal: 83500,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 83500,
    previousBalance: 32100,
  },
  payment: {
    documentNumber: 'PV-2026-0274',
    documentType: 'Payment Voucher',
    date: '2026-09-27',
    referenceNumber: 'NEFT-CMS-4829104',
    paymentMethod: 'NEFT / RTGS Corporate Banking',
    accountName: 'State Bank of India Current A/c (..4410)',
    partyName: 'CloudMatrix Hosting & Infotech Solutions',
    partyGstin: '29AACCC3322E1Z5',
    partyAddress: 'Outer Ring Road, Bellandur, Bengaluru, Karnataka - 560103',
    partyState: 'Karnataka (29)',
    partyPhone: '+91 80 4910 8800',
    items: [],
    allocations: [
      { invoiceNumber: 'BILL-CM-9102', amount: 48000 },
      { invoiceNumber: 'BILL-CM-9344', amount: 24500 },
    ],
    subtotal: 72500,
    tdsAmount: 1450,
    tdsSection: '194J (2%)',
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 71050,
    previousBalance: 0,
  },
};

export interface CompanyBrandingInfo {
  name: string;
  brandName: string;
  address: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
}

export const ThemedDocumentRenderer: React.FC<ThemedDocumentRendererProps> = ({
  category,
  themeConfig,
  data,
  isSample = false,
  currentUserName,
  currentUserRole,
}) => {
  const doc = data || (SAMPLE_DATA as any)[category] || SAMPLE_DATA.sales;
  const palette = THEME_COLOR_PALETTES[themeConfig.primaryColor] || THEME_COLOR_PALETTES.emerald;
  const logo = storage.getInvoiceLogo() || storage.getDocumentLogo() || storage.getCompanyLogo();

  // Dynamic Company & Branding profile retrieved from persistent settings
  const settings = storage.getSettings();
  const companyInfo: CompanyBrandingInfo = {
    name: settings.companyName || 'Casbiro Solutions Private Limited',
    brandName: settings.brandName || 'MYSAR',
    address: settings.address || 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
    gstin: settings.gstNumber || '32AABCC8921F1ZX',
    phone: settings.phone || '+91 7994 807 907 / +91 7994 806 906',
    email: settings.email || 'billing@casbiro.com',
    website: settings.website || 'https://mysar.in',
  };

  const sessionUser = storage.getSessionUser();
  const activeUserName =
    currentUserName ||
    doc.signatoryName ||
    sessionUser?.name ||
    (category === 'sales' ? 'Sales Manager' : category === 'purchase' ? 'Purchase Manager' : 'Operations Officer');
  const activeUserRole =
    currentUserRole ||
    doc.signatoryRole ||
    sessionUser?.role ||
    (category === 'sales' ? 'Authorized Sales Signatory' : category === 'purchase' ? 'Authorized Procurement Signatory' : 'Authorized Signatory');

  const title =
    doc.documentType ||
    themeConfig.headerTitle ||
    (category === 'sales'
      ? 'TAX INVOICE'
      : category === 'purchase'
      ? 'PURCHASE BILL'
      : category === 'receipt'
      ? 'OFFICIAL RECEIPT'
      : category === 'inventory'
      ? 'STOCK MOVEMENT VOUCHER'
      : category === 'asset'
      ? 'FIXED ASSET CERTIFICATE'
      : 'PAYMENT VOUCHER');

  // RENDER BASED ON THEME STYLE WITH COMPANY BRANDING & LOGO
  switch (themeConfig.themeStyle) {
    case 'stylish':
      return renderStylishTheme(category, themeConfig, doc, palette, logo, title, activeUserName, activeUserRole, companyInfo);
    case 'advanced':
      return renderAdvancedTheme(category, themeConfig, doc, palette, logo, title, activeUserName, activeUserRole, companyInfo);
    case 'minimal':
      return renderMinimalTheme(category, themeConfig, doc, palette, logo, title, activeUserName, activeUserRole, companyInfo);
    case 'corporate':
      return renderCorporateTheme(category, themeConfig, doc, palette, logo, title, activeUserName, activeUserRole, companyInfo);
    case 'thermal':
      return renderThermalTheme(category, themeConfig, doc, palette, logo, title, activeUserName, activeUserRole, companyInfo);
    case 'classic':
    default:
      return renderClassicTheme(category, themeConfig, doc, palette, logo, title, activeUserName, activeUserRole, companyInfo);
  }
};

/* =========================================================================
   UNIVERSAL DIGITAL SIGNATURE & ACCEPTANCE BLOCK
   ========================================================================= */
function renderSignatureBlock(
  category: ThemedDocumentCategory,
  config: DocumentThemeConfig,
  doc: ThemedDocumentData,
  palette: typeof THEME_COLOR_PALETTES.emerald,
  currentUserName: string,
  currentUserRole: string,
  companyInfo: CompanyBrandingInfo
) {
  const isSalesOrPurchase = category === 'sales' || category === 'purchase';
  const companyName = companyInfo.name || companyInfo.brandName || 'Casbiro Solutions Private Limited';
  const cleanDocNum = (doc.documentNumber || 'ERP').replace(/[^a-zA-Z0-9]/g, '');
  const digitalSigHash = `DIGI-SIG-${cleanDocNum.slice(-6)}-${(doc.date || '2026').replace(/-/g, '')}`;

  return (
    <div className="pt-6 mt-6 border-t-2 border-slate-300 text-xs text-slate-800 break-inside-avoid print:break-inside-avoid">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
        {/* Left Column: Terms / Counter-signature / QR Code */}
        <div className="space-y-3">
          {config.showTerms && config.termsAndConditions && (
            <div>
              <h5 className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
                Terms & Conditions:
              </h5>
              <p className="text-slate-600 text-[10px] whitespace-pre-line leading-relaxed">
                {config.termsAndConditions}
              </p>
            </div>
          )}

          {/* Customer / Vendor Acknowledgment Box for Sales & Purchase */}
          {isSalesOrPurchase && (
            <div className="p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 max-w-sm">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-7">
                {category === 'sales'
                  ? "Customer / Consignee Acknowledgment & Stamp:"
                  : "Supplier / Dispatcher Acknowledgment & Stamp:"}
              </span>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500 flex justify-between font-medium">
                <span>Received By (Sign & Date)</span>
                <span>Authorized Stamp</span>
              </div>
            </div>
          )}

          {config.showQrCode && (
            <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-lg border border-gray-200 w-fit">
              <QrCode className="w-7 h-7 text-slate-800" />
              <div className="text-[10px] text-slate-600">
                <span className="font-bold block text-slate-800">Scan & Authenticate Document</span>
                Statutory GST & Payment Verification
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Official Digital Signature Block */}
        <div className="flex flex-col items-end text-right">
          <div className="w-72 max-w-full space-y-2">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">
              For {companyName}
            </div>

            {/* Digital Signature Placeholder Box */}
            <div className="p-3.5 rounded-xl border-2 border-emerald-600/40 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 shadow-xs relative overflow-hidden text-left">
              {/* Security Header Banner */}
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/80">
                <div className="flex items-center space-x-1.5 text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Digitally Verified</span>
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-200/60 text-emerald-900 font-bold">
                  256-BIT SECURE
                </span>
              </div>

              {/* Digital Signature Graphic & Signer Info */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider">
                    Digital Signature Placeholder
                  </div>
                  {/* Stylized Electronic Signature Simulation */}
                  <div className="font-serif italic text-base text-emerald-950 font-black tracking-wide truncate">
                    {currentUserName}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 truncate">
                    {currentUserRole}
                  </div>
                </div>

                {/* Digital Seal Stamp Badge */}
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-emerald-600/70 flex items-center justify-center shrink-0 bg-white shadow-2xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              {/* Cryptographic Metadata Verification Block */}
              <div className="pt-1.5 border-t border-emerald-200/80 text-[9px] font-mono text-emerald-950 space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Signer:</span>
                  <span className="font-bold truncate max-w-[150px]">{currentUserName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sign Date:</span>
                  <span>{doc.date}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Audit Hash:</span>
                  <span className="truncate max-w-[150px] text-emerald-800 font-bold">{digitalSigHash}</span>
                </div>
              </div>
            </div>

            {/* Signatory Text & Designation Footer */}
            <div className="text-center pt-0.5">
              <p className="font-bold text-slate-900 text-xs">
                {currentUserName}
              </p>
              <p className="text-[10px] font-semibold text-slate-500 whitespace-pre-line">
                {config.signatoryText || 'Authorized Signatory (Authenticated User)'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   1. CLASSIC THEME (My Billbook Original)
   ========================================================================= */
function renderClassicTheme(
  category: ThemedDocumentCategory,
  config: DocumentThemeConfig,
  doc: ThemedDocumentData,
  palette: typeof THEME_COLOR_PALETTES.emerald,
  logo?: string,
  title?: string,
  currentUserName: string = 'Sales Manager',
  currentUserRole: string = 'Authorized Signatory',
  companyInfo: CompanyBrandingInfo = {
    name: 'Casbiro Solutions Private Limited',
    brandName: 'MYSAR',
    address: 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
    gstin: '32AABCC8921F1ZX',
    phone: '+91 7994 807 907 / +91 7994 806 906',
    email: 'billing@casbiro.com',
    website: 'https://mysar.in',
  }
) {
  return (
    <div
      className="bg-white text-slate-800 text-xs p-6 md:p-8 rounded-xl shadow-xs border-2 transition-all font-sans relative"
      style={{ borderColor: palette.hex }}
    >
      {/* Top Header */}
      <div className="flex justify-between items-start pb-5 border-b border-gray-300">
        <div className="flex items-start gap-4 max-w-[62%]">
          {config.showLogo && logo ? (
            <img src={logo} alt={companyInfo.name || "Company Logo"} className="h-14 w-auto object-contain shrink-0" />
          ) : config.showLogo ? (
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-lg shrink-0 shadow-xs"
              style={{ backgroundColor: palette.hex }}
            >
              {(companyInfo.brandName || companyInfo.name || 'M').charAt(0)}
            </div>
          ) : null}
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
              {companyInfo.name}
            </h2>
            {companyInfo.brandName && companyInfo.brandName !== companyInfo.name && (
              <p className="text-[11px] font-bold text-emerald-800 tracking-wide uppercase mt-0.5">
                {companyInfo.brandName}
              </p>
            )}
            <p className="text-[11px] text-slate-600 mt-0.5">
              {companyInfo.address}
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              GSTIN: <span className="font-mono font-bold text-slate-800">{companyInfo.gstin}</span> | State: Kerala (32)
            </p>
            <p className="text-[10px] text-slate-500">Phone: {companyInfo.phone} • Email: {companyInfo.email}</p>
          </div>
        </div>

        <div className="text-right">
          <div
            className="inline-block px-3 py-1 rounded text-white text-xs font-black uppercase tracking-wider shadow-xs"
            style={{ backgroundColor: palette.hex }}
          >
            {title}
          </div>
          <div className="mt-2 text-xs space-y-0.5">
            <p className="font-mono font-black text-slate-900 text-sm">{doc.documentNumber}</p>
            <p className="text-slate-600">
              Date: <span className="font-semibold text-slate-800">{doc.date}</span>
            </p>
            {doc.dueDate && (
              <p className="text-slate-600">
                Due Date: <span className="font-semibold text-slate-800">{doc.dueDate}</span>
              </p>
            )}
            {doc.referenceNumber && (
              <p className="text-slate-600">
                Ref / PO: <span className="font-mono text-slate-800">{doc.referenceNumber}</span>
              </p>
            )}
            {doc.paymentMethod && (
              <p className="text-slate-600">
                Mode: <span className="font-medium text-slate-800">{doc.paymentMethod}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bill To & Ship To / Party Card */}
      <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-300 text-xs">
        <div className="p-3 bg-slate-50/70 rounded-lg border border-gray-200">
          <div className="font-bold uppercase text-[10px] tracking-wider mb-1" style={{ color: palette.hex }}>
            {category === 'sales' || category === 'receipt'
              ? 'Billed To (Customer):'
              : category === 'inventory'
              ? 'Issued To / Destination / Warehouse:'
              : category === 'asset'
              ? 'Assigned Custodian / Entity:'
              : 'Billed By (Supplier / Payee):'}
          </div>
          <p className="font-bold text-slate-900 text-sm leading-tight">{doc.partyName}</p>
          <p className="text-slate-600 text-[11px] mt-1">{doc.partyAddress}</p>
          {doc.partyGstin && (
            <p className="text-slate-700 text-[11px] mt-1">
              <b>GSTIN:</b> <span className="font-mono font-semibold">{doc.partyGstin}</span>
            </p>
          )}
          {doc.partyState && (
            <p className="text-slate-600 text-[10px]">
              <b>Place of Supply:</b> {doc.partyState}
            </p>
          )}
        </div>

        <div className="p-3 bg-slate-50/70 rounded-lg border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="font-bold uppercase text-[10px] tracking-wider mb-1 text-slate-500">
              {category === 'receipt'
                ? 'Receipt Transaction Details'
                : category === 'payment'
                ? 'Disbursement Account'
                : 'Shipping & Terms'}
            </div>
            {doc.accountName && (
              <p className="text-slate-800 text-[11px]">
                <b>Settlement Account:</b> {doc.accountName}
              </p>
            )}
            {doc.partyPhone && (
              <p className="text-slate-600 text-[11px]">
                <b>Contact:</b> {doc.partyPhone}
              </p>
            )}
            <p className="text-slate-600 text-[11px]">
              <b>Payment Terms:</b> 15 Days Net
            </p>
          </div>
          {config.showBalanceDue && doc.previousBalance !== undefined && doc.previousBalance > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Previous Balance:</span>
              <span className="font-bold font-mono text-amber-700">{formatINR(doc.previousBalance)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Items Table (for Sales, Purchase, Inventory & Assets) */}
      {(category === 'sales' || category === 'purchase' || category === 'inventory' || category === 'asset') && doc.items && doc.items.length > 0 && (
        <div className="my-4 overflow-hidden border border-gray-300 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="text-white font-bold text-[11px]" style={{ backgroundColor: palette.hex }}>
                <th className="p-2.5 w-8 text-center border-r border-white/20">#</th>
                <th className="p-2.5 border-r border-white/20">Item Description</th>
                <th className="p-2.5 w-16 text-center border-r border-white/20">HSN</th>
                <th className="p-2.5 w-14 text-right border-r border-white/20">Qty</th>
                <th className="p-2.5 w-14 text-center border-r border-white/20">Unit</th>
                <th className="p-2.5 w-20 text-right border-r border-white/20">Rate</th>
                <th className="p-2.5 w-24 text-right border-r border-white/20">Taxable</th>
                <th className="p-2.5 w-14 text-center border-r border-white/20">GST</th>
                <th className="p-2.5 w-20 text-right border-r border-white/20">Tax</th>
                <th className="p-2.5 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {doc.items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}>
                  <td className="p-2 border-r border-gray-200 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="p-2 border-r border-gray-200 font-semibold text-slate-900">
                    {item.name}
                    {item.description && (
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="p-2 border-r border-gray-200 text-center font-mono text-slate-600">{item.hsn}</td>
                  <td className="p-2 border-r border-gray-200 text-right font-bold text-slate-800">{item.quantity}</td>
                  <td className="p-2 border-r border-gray-200 text-center text-slate-600">{item.unit}</td>
                  <td className="p-2 border-r border-gray-200 text-right font-mono text-slate-800">
                    {formatINR(item.rate)}
                  </td>
                  <td className="p-2 border-r border-gray-200 text-right font-mono text-slate-800">
                    {formatINR(item.taxable)}
                  </td>
                  <td className="p-2 border-r border-gray-200 text-center text-slate-600">{item.taxPercent}%</td>
                  <td className="p-2 border-r border-gray-200 text-right font-mono text-slate-800">
                    {formatINR(item.taxTotal)}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-slate-900">{formatINR(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Allocations Table (for Receipt & Payment) */}
      {(category === 'receipt' || category === 'payment') && doc.allocations && doc.allocations.length > 0 && (
        <div className="my-4 overflow-hidden border border-gray-300 rounded-lg">
          <div className="bg-slate-100 px-3 py-2 border-b border-gray-300 font-bold text-slate-700 text-xs">
            Settled Invoices / Allocations Breakdown
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold text-[11px] border-b border-gray-200">
                <th className="p-2.5 w-10 text-center">#</th>
                <th className="p-2.5">Invoice Reference</th>
                <th className="p-2.5 text-right">Settled Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {doc.allocations.map((a, idx) => (
                <tr key={idx}>
                  <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                  <td className="p-2 font-mono font-bold text-slate-800">{a.invoiceNumber}</td>
                  <td className="p-2 text-right font-mono font-bold text-emerald-700">{formatINR(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-6 pt-3 border-t border-gray-300">
        <div className="space-y-3">
          {config.showAmountInWords && (
            <div>
              <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-0.5">
                Total in Words:
              </span>
              <p className="italic text-slate-900 font-semibold text-xs">{numberToWordsINR(doc.grandTotal)}</p>
            </div>
          )}

          {config.showBankDetails && (
            <div className="p-2.5 rounded-lg bg-slate-50 border border-gray-200 text-[11px] space-y-0.5">
              <span className="font-bold block uppercase text-[10px] tracking-wider" style={{ color: palette.hex }}>
                Bank Remittance Details:
              </span>
              <p className="text-slate-800">
                <b>Bank:</b> HDFC Bank Ltd • <b>A/C No:</b> 50200038918239
              </p>
              <p className="text-slate-800">
                <b>IFSC:</b> HDFC0001234 • <b>Branch:</b> MG Road, Kochi
              </p>
              {config.upiId && (
                <p className="text-slate-800">
                  <b>UPI ID:</b> <span className="font-mono font-semibold">{config.upiId}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Totals Box */}
        <div className="space-y-1.5 text-right font-mono text-xs">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal / Taxable:</span>
            <span className="font-semibold text-slate-900">{formatINR(doc.subtotal)}</span>
          </div>
          {doc.cgst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>CGST:</span>
              <span>{formatINR(doc.cgst)}</span>
            </div>
          )}
          {doc.sgst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>SGST:</span>
              <span>{formatINR(doc.sgst)}</span>
            </div>
          )}
          {doc.igst > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>IGST:</span>
              <span>{formatINR(doc.igst)}</span>
            </div>
          )}
          {doc.otherCharges !== undefined && doc.otherCharges > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Freight & Other:</span>
              <span>{formatINR(doc.otherCharges)}</span>
            </div>
          )}
          {doc.discount !== undefined && doc.discount > 0 && (
            <div className="flex justify-between text-rose-700">
              <span>Discount:</span>
              <span>-{formatINR(doc.discount)}</span>
            </div>
          )}
          {doc.tdsAmount !== undefined && doc.tdsAmount > 0 && (
            <div className="flex justify-between text-purple-700">
              <span>Less TDS ({doc.tdsSection}):</span>
              <span>-{formatINR(doc.tdsAmount)}</span>
            </div>
          )}
          <div
            className="flex justify-between text-sm font-black border-t-2 pt-2 text-slate-900"
            style={{ borderColor: palette.hex }}
          >
            <span>Total Payable:</span>
            <span className="text-base" style={{ color: palette.hex }}>
              {formatINR(doc.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer & Universal Digital Signature Block */}
      {renderSignatureBlock(category, config, doc, palette, currentUserName, currentUserRole, companyInfo)}
    </div>
  );
}

/* =========================================================================
   2. MODERN STYLISH THEME
   ========================================================================= */
function renderStylishTheme(
  category: ThemedDocumentCategory,
  config: DocumentThemeConfig,
  doc: ThemedDocumentData,
  palette: typeof THEME_COLOR_PALETTES.emerald,
  logo?: string,
  title?: string,
  currentUserName: string = 'Sales Manager',
  currentUserRole: string = 'Authorized Signatory',
  companyInfo: CompanyBrandingInfo = {
    name: 'Casbiro Solutions Private Limited',
    brandName: 'MYSAR',
    address: 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
    gstin: '32AABCC8921F1ZX',
    phone: '+91 7994 807 907 / +91 7994 806 906',
    email: 'billing@casbiro.com',
    website: 'https://mysar.in',
  }
) {
  return (
    <div className="bg-white text-slate-800 text-xs rounded-2xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      {/* Bold Colored Top Banner */}
      <div className="p-6 md:p-8 text-white relative" style={{ backgroundColor: palette.hex }}>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            {config.showLogo && logo ? (
              <div className="bg-white p-2 rounded-xl shadow-md">
                <img src={logo} alt={companyInfo.name || "Company Logo"} className="h-12 w-auto object-contain" />
              </div>
            ) : config.showLogo ? (
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-xl text-white">
                {(companyInfo.brandName || companyInfo.name || 'M').charAt(0)}
              </div>
            ) : null}
            <div>
              <h1 className="text-2xl font-black tracking-tight">{companyInfo.name}</h1>
              {companyInfo.brandName && companyInfo.brandName !== companyInfo.name && (
                <p className="text-white/90 text-xs font-bold uppercase tracking-wider">
                  {companyInfo.brandName}
                </p>
              )}
              <p className="text-white/80 text-[11px]">{companyInfo.address} • GSTIN: {companyInfo.gstin}</p>
              <p className="text-white/70 text-[10px]">Phone: {companyInfo.phone} • Email: {companyInfo.email}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="px-3 py-1 rounded-full bg-white text-slate-900 text-[11px] font-black uppercase tracking-wider shadow-sm">
              {title}
            </span>
            <p className="font-mono font-black text-xl mt-2 tracking-tight">{doc.documentNumber}</p>
            <p className="text-white/80 text-[11px]">Date: {doc.date}</p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-6">
        {/* Stylish Party Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-gray-100 shadow-2xs" style={{ backgroundColor: palette.bgLightClass.replace('bg-', '') ? undefined : '#f8fafc' }}>
            <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider mb-2" style={{ color: palette.hex }}>
              <Building2 className="w-3.5 h-3.5" />
              <span>
                Party / Destination (
                {category === 'sales' || category === 'receipt'
                  ? 'Customer'
                  : category === 'inventory'
                  ? 'Destination / Warehouse'
                  : category === 'asset'
                  ? 'Custodian / Dept'
                  : 'Supplier'}
                )
              </span>
            </div>
            <p className="font-bold text-slate-900 text-sm">{doc.partyName}</p>
            <p className="text-slate-600 text-xs mt-1 leading-relaxed">{doc.partyAddress}</p>
            {doc.partyGstin && (
              <p className="text-slate-700 text-xs mt-1">
                GSTIN: <span className="font-mono font-bold">{doc.partyGstin}</span>
              </p>
            )}
          </div>

          <div className="p-4 rounded-xl border border-gray-100 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="font-bold uppercase text-[10px] tracking-wider mb-2 text-slate-500">
                Transaction Metadata
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Mode</span>
                  <span className="font-semibold text-slate-800">{doc.paymentMethod || 'Bank Transfer'}</span>
                </div>
                {doc.dueDate && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Due Date</span>
                    <span className="font-semibold text-slate-800">{doc.dueDate}</span>
                  </div>
                )}
                {doc.referenceNumber && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Reference / PO</span>
                    <span className="font-mono font-bold text-slate-800">{doc.referenceNumber}</span>
                  </div>
                )}
                {doc.partyState && (
                  <div>
                    <span className="text-slate-400 block text-[10px]">Place of Supply</span>
                    <span className="font-medium text-slate-800">{doc.partyState}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        {(category === 'sales' || category === 'purchase' || category === 'inventory' || category === 'asset') && doc.items && doc.items.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-slate-700 font-bold border-b border-gray-200" style={{ backgroundColor: '#F8FAFC' }}>
                  <th className="p-3 w-8 text-center">#</th>
                  <th className="p-3">Item / Service</th>
                  <th className="p-3 text-center">HSN</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3 text-right">Taxable</th>
                  <th className="p-3 text-center">GST</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doc.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      {item.name}
                      {item.description && <div className="text-[10px] text-slate-500 font-normal">{item.description}</div>}
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">{item.hsn}</td>
                    <td className="p-3 text-right font-bold text-slate-800">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-800">{formatINR(item.rate)}</td>
                    <td className="p-3 text-right font-mono text-slate-800">{formatINR(item.taxable)}</td>
                    <td className="p-3 text-center text-slate-600">{item.taxPercent}%</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{formatINR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Allocations Table */}
        {(category === 'receipt' || category === 'payment') && doc.allocations && (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3">Invoice Number</th>
                  <th className="p-3 text-right">Settled Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doc.allocations.map((a, i) => (
                  <tr key={i}>
                    <td className="p-3 font-mono font-bold text-slate-800">{a.invoiceNumber}</td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">{formatINR(a.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Card with Gradient Total */}
        <div className="grid grid-cols-2 gap-6 items-end">
          <div className="space-y-3">
            {config.showAmountInWords && (
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Amount in Words
                </span>
                <span className="font-semibold text-slate-800 text-xs italic">{numberToWordsINR(doc.grandTotal)}</span>
              </div>
            )}
            {config.showBankDetails && (
              <div className="p-3 bg-slate-50 rounded-xl text-[11px] space-y-0.5">
                <span className="font-bold text-slate-700 block uppercase text-[10px]">Direct Bank Remittance</span>
                <p className="text-slate-600">
                  HDFC Bank • A/C: 50200038918239 • IFSC: HDFC0001234
                </p>
                {config.upiId && <p className="text-slate-600">UPI: {config.upiId}</p>}
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl text-white space-y-2 font-mono shadow-md" style={{ backgroundColor: palette.hex }}>
            <div className="flex justify-between text-xs text-white/80">
              <span>Subtotal:</span>
              <span>{formatINR(doc.subtotal)}</span>
            </div>
            {(doc.cgst > 0 || doc.sgst > 0) && (
              <div className="flex justify-between text-xs text-white/80">
                <span>Taxes (CGST + SGST):</span>
                <span>{formatINR(doc.cgst + doc.sgst)}</span>
              </div>
            )}
            {doc.igst > 0 && (
              <div className="flex justify-between text-xs text-white/80">
                <span>IGST:</span>
                <span>{formatINR(doc.igst)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black border-t border-white/20 pt-2 text-white">
              <span>Grand Total:</span>
              <span>{formatINR(doc.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Universal Digital Signature Block */}
        {renderSignatureBlock(category, config, doc, palette, currentUserName, currentUserRole, companyInfo)}
      </div>
    </div>
  );
}

/* =========================================================================
   3. ADVANCED GST PROFESSIONAL THEME
   ========================================================================= */
function renderAdvancedTheme(
  category: ThemedDocumentCategory,
  config: DocumentThemeConfig,
  doc: ThemedDocumentData,
  palette: typeof THEME_COLOR_PALETTES.emerald,
  logo?: string,
  title?: string,
  currentUserName: string = 'Sales Manager',
  currentUserRole: string = 'Authorized Signatory',
  companyInfo: CompanyBrandingInfo = {
    name: 'Casbiro Solutions Private Limited',
    brandName: 'MYSAR',
    address: 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
    gstin: '32AABCC8921F1ZX',
    phone: '+91 7994 807 907 / +91 7994 806 906',
    email: 'billing@casbiro.com',
    website: 'https://mysar.in',
  }
) {
  return (
    <div className="bg-white text-slate-900 text-xs p-6 md:p-8 rounded-xl shadow-xs border border-gray-300 font-sans space-y-4">
      {/* Statutory Header */}
      <div className="text-center pb-2 border-b-2" style={{ borderColor: palette.hex }}>
        <h4 className="font-black text-sm tracking-wider uppercase text-slate-800">
          {category === 'sales'
            ? 'TAX INVOICE (Under Rule 46 of the CGST Rules, 2017)'
            : category === 'purchase'
            ? 'PURCHASE VOUCHER & MATERIAL INWARD'
            : title}
        </h4>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">Original for Recipient</p>
      </div>

      <div className="flex justify-between items-start pb-4 border-b border-gray-300">
        <div className="max-w-[60%] flex items-start gap-3">
          {config.showLogo && logo && (
            <img src={logo} alt={companyInfo.name || "Company Logo"} className="h-12 w-auto object-contain shrink-0" />
          )}
          <div>
            <h2 className="text-lg font-black text-slate-900">{companyInfo.name}</h2>
            {companyInfo.brandName && companyInfo.brandName !== companyInfo.name && (
              <p className="text-xs font-bold text-slate-700">{companyInfo.brandName}</p>
            )}
            <p className="text-[11px] text-slate-600">{companyInfo.address}</p>
            <div className="mt-1 text-[11px] text-slate-700">
              <p>
                <b>GSTIN:</b> {companyInfo.gstin} | <b>PAN:</b> {companyInfo.gstin.slice(2, 12) || 'AABCC8921F'}
              </p>
              <p>
                <b>State:</b> Kerala (State Code: 32) • <b>Phone:</b> {companyInfo.phone} • <b>Email:</b> {companyInfo.email}
              </p>
            </div>
          </div>
        </div>

        <div className="border border-gray-300 rounded p-2 text-right text-xs bg-slate-50 font-mono">
          <p className="font-bold text-slate-900 text-sm">{doc.documentNumber}</p>
          <p className="text-slate-600">Date: {doc.date}</p>
          <p className="text-slate-600">Reverse Charge: <b>NO</b></p>
          <p className="text-slate-600">Place of Supply: <b>{doc.partyState || 'Kerala (32)'}</b></p>
        </div>
      </div>

      {/* Bill To & Ship To 2-Column Grid */}
      <div className="grid grid-cols-2 border border-gray-300 rounded divide-x divide-gray-300 text-xs">
        <div className="p-3">
          <h4 className="font-bold uppercase text-[10px] text-slate-500 mb-1">Details of Receiver / Billed to:</h4>
          <p className="font-bold text-slate-900">{doc.partyName}</p>
          <p className="text-slate-600 text-[11px]">{doc.partyAddress}</p>
          <p className="text-slate-700 text-[11px] mt-1">
            <b>GSTIN / UIN:</b> {doc.partyGstin || 'Unregistered'}
          </p>
        </div>
        <div className="p-3">
          <h4 className="font-bold uppercase text-[10px] text-slate-500 mb-1">Details of Consignee / Shipped to:</h4>
          <p className="font-bold text-slate-900">{doc.partyName}</p>
          <p className="text-slate-600 text-[11px]">{doc.partyAddress}</p>
          <p className="text-slate-700 text-[11px] mt-1">
            <b>Transport Mode:</b> Road / Courier | <b>Vehicle No:</b> KL-07-BW-4491
          </p>
        </div>
      </div>

      {/* GST Item Table */}
      {(category === 'sales' || category === 'purchase' || category === 'inventory' || category === 'asset') && doc.items && doc.items.length > 0 && (
        <table className="w-full border-collapse border border-gray-300 text-xs text-left">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-gray-300 text-[11px] text-slate-800">
              <th className="p-1.5 border-r border-gray-300 text-center w-8">#</th>
              <th className="p-1.5 border-r border-gray-300">Description of Goods / Services</th>
              <th className="p-1.5 border-r border-gray-300 text-center w-16">HSN/SAC</th>
              <th className="p-1.5 border-r border-gray-300 text-right w-14">Qty</th>
              <th className="p-1.5 border-r border-gray-300 text-right w-20">Rate</th>
              <th className="p-1.5 border-r border-gray-300 text-right w-24">Taxable Val</th>
              <th className="p-1.5 border-r border-gray-300 text-center w-16">CGST</th>
              <th className="p-1.5 border-r border-gray-300 text-center w-16">SGST</th>
              <th className="p-1.5 text-right w-24">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {doc.items.map((it, i) => (
              <tr key={it.id}>
                <td className="p-1.5 border-r border-gray-300 text-center font-mono">{i + 1}</td>
                <td className="p-1.5 border-r border-gray-300 font-semibold">{it.name}</td>
                <td className="p-1.5 border-r border-gray-300 text-center font-mono">{it.hsn}</td>
                <td className="p-1.5 border-r border-gray-300 text-right font-bold">
                  {it.quantity} {it.unit}
                </td>
                <td className="p-1.5 border-r border-gray-300 text-right font-mono">{formatINR(it.rate)}</td>
                <td className="p-1.5 border-r border-gray-300 text-right font-mono">{formatINR(it.taxable)}</td>
                <td className="p-1.5 border-r border-gray-300 text-center font-mono">
                  {it.taxPercent / 2}%
                </td>
                <td className="p-1.5 border-r border-gray-300 text-center font-mono">
                  {it.taxPercent / 2}%
                </td>
                <td className="p-1.5 text-right font-mono font-bold">{formatINR(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* HSN Summary Table (Special to Advanced Theme) */}
      {config.showHsnSummary && (category === 'sales' || category === 'purchase') && (
        <div className="border border-gray-300 rounded overflow-hidden">
          <div className="bg-slate-100 p-1.5 font-bold text-[10px] uppercase text-slate-700 border-b border-gray-300">
            HSN / SAC Tax Liability Summary
          </div>
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 font-semibold">
                <th className="p-1 border-r border-gray-200">HSN/SAC</th>
                <th className="p-1 border-r border-gray-200 text-right">Taxable Amount</th>
                <th className="p-1 border-r border-gray-200 text-right">CGST Amt</th>
                <th className="p-1 border-r border-gray-200 text-right">SGST Amt</th>
                <th className="p-1 text-right">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {doc.items.map((it) => (
                <tr key={it.id} className="border-b border-gray-100">
                  <td className="p-1 border-r border-gray-200 font-mono">{it.hsn}</td>
                  <td className="p-1 border-r border-gray-200 text-right font-mono">{formatINR(it.taxable)}</td>
                  <td className="p-1 border-r border-gray-200 text-right font-mono">{formatINR(it.taxTotal / 2)}</td>
                  <td className="p-1 border-r border-gray-200 text-right font-mono">{formatINR(it.taxTotal / 2)}</td>
                  <td className="p-1 text-right font-mono font-bold">{formatINR(it.taxTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-between items-start pt-2 border-t border-gray-300">
        <div className="text-xs space-y-2 max-w-[55%]">
          <div>
            <span className="font-bold text-slate-600 text-[10px]">Total in Words:</span>
            <p className="italic font-semibold text-slate-900">{numberToWordsINR(doc.grandTotal)}</p>
          </div>
          {config.showBankDetails && (
            <div className="text-[11px] text-slate-600">
              <b>Bank:</b> HDFC Bank Ltd • <b>A/C:</b> 50200038918239 • <b>IFSC:</b> HDFC0001234
            </div>
          )}
        </div>

        <div className="w-64 space-y-1 text-right font-mono text-xs">
          <div className="flex justify-between">
            <span>Total Taxable:</span>
            <span className="font-bold">{formatINR(doc.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total CGST:</span>
            <span>{formatINR(doc.cgst)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total SGST:</span>
            <span>{formatINR(doc.sgst)}</span>
          </div>
          <div
            className="flex justify-between text-sm font-black border-t border-slate-900 pt-1 text-slate-900"
            style={{ color: palette.hex }}
          >
            <span>Total Amount:</span>
            <span>{formatINR(doc.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Universal Digital Signature Block */}
      {renderSignatureBlock(category, config, doc, palette, currentUserName, currentUserRole, companyInfo)}
    </div>
  );
}

/* =========================================================================
   4. MINIMALIST CRISP THEME
   ========================================================================= */
function renderMinimalTheme(
  category: ThemedDocumentCategory,
  config: DocumentThemeConfig,
  doc: ThemedDocumentData,
  palette: typeof THEME_COLOR_PALETTES.emerald,
  logo?: string,
  title?: string,
  currentUserName: string = 'Sales Manager',
  currentUserRole: string = 'Authorized Signatory',
  companyInfo: CompanyBrandingInfo = {
    name: 'Casbiro Solutions Private Limited',
    brandName: 'MYSAR',
    address: 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
    gstin: '32AABCC8921F1ZX',
    phone: '+91 7994 807 907 / +91 7994 806 906',
    email: 'billing@casbiro.com',
    website: 'https://mysar.in',
  }
) {
  return (
    <div className="bg-white text-slate-900 text-xs p-8 rounded-xl shadow-xs border border-gray-100 font-sans space-y-8">
      {/* Ultra Clean Top */}
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3">
          {config.showLogo && logo && (
            <img src={logo} alt={companyInfo.name || "Company Logo"} className="h-10 w-auto object-contain" />
          )}
          <div>
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{title}</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{companyInfo.name}</h1>
            {companyInfo.brandName && companyInfo.brandName !== companyInfo.name && (
              <p className="text-xs font-bold text-slate-600 mt-0.5">{companyInfo.brandName}</p>
            )}
            <p className="text-slate-500 text-xs mt-0.5">{companyInfo.address} • GSTIN: {companyInfo.gstin}</p>
            <p className="text-slate-400 text-[10px]">Phone: {companyInfo.phone} • Email: {companyInfo.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-base font-bold text-slate-900">{doc.documentNumber}</p>
          <p className="text-slate-400 text-xs mt-0.5">{doc.date}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 text-xs border-y border-gray-100 py-4">
        <div>
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Client / Party</span>
          <p className="font-bold text-slate-900 text-sm">{doc.partyName}</p>
          <p className="text-slate-500 text-xs mt-0.5">{doc.partyAddress}</p>
          {doc.partyGstin && <p className="text-slate-600 font-mono text-xs mt-1">GSTIN: {doc.partyGstin}</p>}
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1">Details</span>
          <p className="text-slate-700">Due: {doc.dueDate || doc.date}</p>
          <p className="text-slate-700">Mode: {doc.paymentMethod || 'Transfer'}</p>
          {doc.referenceNumber && <p className="text-slate-700 font-mono">Ref: {doc.referenceNumber}</p>}
        </div>
      </div>

      {/* Borderless Table */}
      {(category === 'sales' || category === 'purchase' || category === 'inventory' || category === 'asset') && doc.items && doc.items.length > 0 && (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-200 text-slate-400 font-mono text-[10px] uppercase">
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Qty</th>
              <th className="pb-2 text-right">Rate</th>
              <th className="pb-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {doc.items.map((it) => (
              <tr key={it.id}>
                <td className="py-2.5 font-medium text-slate-800">{it.name}</td>
                <td className="py-2.5 text-right font-mono text-slate-600">
                  {it.quantity} {it.unit}
                </td>
                <td className="py-2.5 text-right font-mono text-slate-600">{formatINR(it.rate)}</td>
                <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatINR(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Summary */}
      <div className="flex justify-end pt-4 border-t border-gray-100">
        <div className="w-64 space-y-1.5 text-right font-mono text-xs">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span>
            <span>{formatINR(doc.subtotal)}</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Tax Amount</span>
            <span>{formatINR(doc.cgst + doc.sgst + doc.igst)}</span>
          </div>
          <div className="flex justify-between text-base font-black text-slate-900 border-t border-gray-900 pt-2">
            <span>Total</span>
            <span style={{ color: palette.hex }}>{formatINR(doc.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Universal Digital Signature Block */}
      {renderSignatureBlock(category, config, doc, palette, currentUserName, currentUserRole, companyInfo)}
    </div>
  );
}

/* =========================================================================
   5. CORPORATE PREMIUM THEME
   ========================================================================= */
function renderCorporateTheme(
  category: ThemedDocumentCategory,
  config: DocumentThemeConfig,
  doc: ThemedDocumentData,
  palette: typeof THEME_COLOR_PALETTES.emerald,
  logo?: string,
  title?: string,
  currentUserName: string = 'Sales Manager',
  currentUserRole: string = 'Authorized Signatory',
  companyInfo: CompanyBrandingInfo = {
    name: 'Casbiro Solutions Private Limited',
    brandName: 'MYSAR',
    address: 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
    gstin: '32AABCC8921F1ZX',
    phone: '+91 7994 807 907 / +91 7994 806 906',
    email: 'billing@casbiro.com',
    website: 'https://mysar.in',
  }
) {
  return (
    <div className="bg-white text-slate-800 text-xs rounded-xl shadow-xs border border-slate-300 font-sans p-6 md:p-8 space-y-6">
      {/* Two Tone Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-800 pb-5">
        <div className="flex items-start gap-4">
          {config.showLogo && logo && (
            <img src={logo} alt={companyInfo.name || "Company Logo"} className="h-12 w-auto object-contain shrink-0" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-8 bg-slate-900" style={{ backgroundColor: palette.hex }} />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{companyInfo.name}</h1>
            </div>
            {companyInfo.brandName && companyInfo.brandName !== companyInfo.name && (
              <p className="text-xs font-bold text-slate-600 mt-0.5">{companyInfo.brandName}</p>
            )}
            <p className="text-slate-500 text-xs mt-1">GSTIN: {companyInfo.gstin} • Phone: {companyInfo.phone} • Email: {companyInfo.email}</p>
            <p className="text-slate-500 text-xs">{companyInfo.address}</p>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-slate-900 text-white font-bold uppercase text-xs tracking-wider rounded">
            {title}
          </div>
          <p className="font-mono font-black text-slate-900 text-base mt-2">{doc.documentNumber}</p>
          <p className="text-slate-500 text-xs">Date: {doc.date}</p>
        </div>
      </div>

      {/* Party Columns */}
      <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
            Party / Consignee:
          </h4>
          <p className="font-bold text-slate-900 text-sm">{doc.partyName}</p>
          <p className="text-slate-600 text-xs mt-0.5">{doc.partyAddress}</p>
          {doc.partyGstin && (
            <p className="text-slate-700 text-xs mt-1">
              <b>GSTIN:</b> {doc.partyGstin}
            </p>
          )}
        </div>
        <div className="text-right space-y-1">
          <p className="text-slate-600">
            <b>Payment Method:</b> {doc.paymentMethod || 'Corporate Banking'}
          </p>
          {doc.accountName && (
            <p className="text-slate-600">
              <b>Settlement Account:</b> {doc.accountName}
            </p>
          )}
          {doc.referenceNumber && (
            <p className="text-slate-600">
              <b>Reference:</b> {doc.referenceNumber}
            </p>
          )}
        </div>
      </div>

      {/* Table */}
      {(category === 'sales' || category === 'purchase' || category === 'inventory' || category === 'asset') && doc.items && doc.items.length > 0 && (
        <table className="w-full text-left border-collapse border border-slate-300 text-xs">
          <thead>
            <tr className="bg-slate-800 text-white font-bold text-[11px]">
              <th className="p-2 border-r border-slate-700 w-8 text-center">#</th>
              <th className="p-2 border-r border-slate-700">Item Description</th>
              <th className="p-2 border-r border-slate-700 text-center w-16">HSN</th>
              <th className="p-2 border-r border-slate-700 text-right w-16">Qty</th>
              <th className="p-2 border-r border-slate-700 text-right w-24">Rate</th>
              <th className="p-2 border-r border-slate-700 text-right w-24">Taxable</th>
              <th className="p-2 text-right w-28">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doc.items.map((it, idx) => (
              <tr key={it.id}>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{idx + 1}</td>
                <td className="p-2 border-r border-slate-200 font-semibold text-slate-900">{it.name}</td>
                <td className="p-2 border-r border-slate-200 text-center font-mono">{it.hsn}</td>
                <td className="p-2 border-r border-slate-200 text-right font-bold">{it.quantity}</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono">{formatINR(it.rate)}</td>
                <td className="p-2 border-r border-slate-200 text-right font-mono">{formatINR(it.taxable)}</td>
                <td className="p-2 text-right font-mono font-bold">{formatINR(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Corporate Seal & Totals */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-300">
        <div>
          {config.showAmountInWords && (
            <p className="italic text-slate-700 text-xs mb-3">
              <b>Amount in Words:</b> {numberToWordsINR(doc.grandTotal)}
            </p>
          )}
          {config.showBankDetails && (
            <div className="p-3 bg-slate-100 rounded text-[11px] text-slate-700">
              <b>Corporate Bank A/C:</b> HDFC Bank • 50200038918239 • IFSC: HDFC0001234
            </div>
          )}
        </div>

        <div className="space-y-1.5 text-right font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Gross Total:</span>
            <span>{formatINR(doc.subtotal)}</span>
          </div>
          {doc.tdsAmount && doc.tdsAmount > 0 ? (
            <div className="flex justify-between text-purple-700">
              <span>Less TDS Withheld:</span>
              <span>-{formatINR(doc.tdsAmount)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm font-black border-t-2 border-slate-900 pt-2 text-slate-900">
            <span>Net Payable / Settled:</span>
            <span style={{ color: palette.hex }}>{formatINR(doc.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Universal Digital Signature Block */}
      {renderSignatureBlock(category, config, doc, palette, currentUserName, currentUserRole, companyInfo)}
    </div>
  );
}

/* =========================================================================
   6. COMPACT THERMAL / POS THEME
   ========================================================================= */
function renderThermalTheme(
  category: ThemedDocumentCategory,
  config: DocumentThemeConfig,
  doc: ThemedDocumentData,
  palette: typeof THEME_COLOR_PALETTES.emerald,
  logo?: string,
  title?: string,
  currentUserName: string = 'Sales Manager',
  currentUserRole: string = 'Authorized Signatory',
  companyInfo: CompanyBrandingInfo = {
    name: 'Casbiro Solutions Private Limited',
    brandName: 'MYSAR',
    address: 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021',
    gstin: '32AABCC8921F1ZX',
    phone: '+91 7994 807 907 / +91 7994 806 906',
    email: 'billing@casbiro.com',
    website: 'https://mysar.in',
  }
) {
  return (
    <div className="bg-white text-slate-900 font-mono text-[11px] p-6 max-w-md mx-auto rounded-lg shadow-sm border border-dashed border-gray-400 space-y-3">
      <div className="text-center pb-2 border-b border-dashed border-gray-400">
        {config.showLogo && logo && (
          <img src={logo} alt={companyInfo.name} className="h-8 w-auto object-contain mx-auto mb-1" />
        )}
        <h2 className="font-black text-sm tracking-tight">{companyInfo.name}</h2>
        {companyInfo.brandName && companyInfo.brandName !== companyInfo.name && (
          <p className="text-[10px] font-bold">{companyInfo.brandName}</p>
        )}
        <p className="text-[10px] text-slate-600">{companyInfo.address} • GSTIN: {companyInfo.gstin}</p>
        <p className="text-[9px] text-slate-500">Tel: {companyInfo.phone}</p>
        <div className="inline-block mt-1 font-bold uppercase text-[10px]">{title}</div>
      </div>

      <div className="flex justify-between text-[10px] border-b border-dashed border-gray-400 pb-2">
        <span>Doc: {doc.documentNumber}</span>
        <span>Date: {doc.date}</span>
      </div>

      <div className="text-[10px] pb-2 border-b border-dashed border-gray-400">
        <div>Party: {doc.partyName}</div>
        {doc.partyGstin && <div>GSTIN: {doc.partyGstin}</div>}
      </div>

      {/* Condensed Items */}
      {(category === 'sales' || category === 'purchase' || category === 'inventory' || category === 'asset') && doc.items && doc.items.length > 0 && (
        <div className="space-y-1.5 border-b border-dashed border-gray-400 pb-2">
          {doc.items.map((it) => (
            <div key={it.id} className="flex justify-between items-start text-[10px]">
              <div className="max-w-[65%]">
                <span className="font-bold block">{it.name}</span>
                <span className="text-slate-500">
                  {it.quantity} x {formatINR(it.rate)}
                </span>
              </div>
              <span className="font-bold">{formatINR(it.total)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Compact Total */}
      <div className="space-y-1 text-right text-xs pt-1 border-b border-dashed border-gray-400 pb-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatINR(doc.subtotal)}</span>
        </div>
        <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-900">
          <span>GRAND TOTAL:</span>
          <span style={{ color: palette.hex }}>{formatINR(doc.grandTotal)}</span>
        </div>
      </div>

      <div className="text-center text-[9px] text-slate-500 pt-2 space-y-1">
        <p className="font-bold text-slate-800">For {companyInfo.name}</p>
        <p className="italic">Digitally Verified: {currentUserName} ({currentUserRole})</p>
        <p>Thank you for choosing {companyInfo.brandName || companyInfo.name}!</p>
        <p>Computer Generated Receipt • Audit Validated</p>
      </div>
    </div>
  );
}
