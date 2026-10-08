import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Printer,
  CheckCircle2,
  RotateCcw,
  Palette,
  Check,
  Building2,
  FileText,
  CreditCard,
  Receipt,
  ShoppingBag,
  Sliders,
  QrCode,
  ShieldCheck,
  Eye,
  Copy,
  Layers,
  HelpCircle,
  ArrowRight,
  ExternalLink,
  Upload,
  Trash2,
  MapPin,
  Image as ImageIcon,
} from 'lucide-react';
import {
  InvoiceThemesSettings,
  DocumentThemeConfig,
  InvoiceThemeStyle,
  InvoiceThemeColor,
  ThemedDocumentCategory,
  THEME_COLOR_PALETTES,
} from '../../../types/invoiceTheme';
import { invoiceThemeStorage } from '../../../services/finance/invoiceThemeStorage';
import { storage } from '../../../services/storageService';
import { optimizeLogoImage } from '../../../utils/imageOptimizer';
import { ThemedDocumentRenderer } from './ThemedDocumentRenderer';

interface ThemePresetCard {
  id: InvoiceThemeStyle;
  name: string;
  badge: string;
  description: string;
  bestFor: string;
}

const THEME_PRESETS: ThemePresetCard[] = [
  {
    id: 'classic',
    name: 'Classic (My Billbook Original)',
    badge: 'Popular',
    description: 'Clean double border, structured GST grid, traditional layout favored by Indian retailers & distributors.',
    bestFor: 'Wholesale, Trading, General Invoicing',
  },
  {
    id: 'stylish',
    name: 'Modern Stylish',
    badge: 'Trending',
    description: 'Rich colored banner header, rounded card details, modern zebra table with highlighted grand totals.',
    bestFor: 'Agencies, Tech, EdTech & Retail',
  },
  {
    id: 'advanced',
    name: 'Advanced GST Professional',
    badge: 'Full GST',
    description: 'Strict statutory GST format with full HSN/SAC summary table, Reverse charge flag, and dual tax columns.',
    bestFor: 'Manufacturing, Audited Firms & B2B GST',
  },
  {
    id: 'minimal',
    name: 'Minimalist Crisp',
    badge: 'Clean',
    description: 'Ultra-clean sans-serif typography, subtle borderless lines, and open whitespace.',
    bestFor: 'Services, Consulting & Design studios',
  },
  {
    id: 'corporate',
    name: 'Corporate Premium',
    badge: 'Formal',
    description: 'Dual-tone header bar, company CIN/PAN metadata, boxed legal agreements & corporate seal stamping box.',
    bestFor: 'Enterprises, Institutional Supplies & Contracts',
  },
  {
    id: 'thermal',
    name: 'Compact Thermal / POS',
    badge: 'Counter',
    description: 'High-density monospace receipt slip layout optimized for thermal counter printers and quick payments.',
    bestFor: 'Counter Billing, Cash Slips & POS Receipts',
  },
];

const CATEGORY_TABS: Array<{
  id: ThemedDocumentCategory;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badgeColor: string;
}> = [
  {
    id: 'sales',
    name: 'Sales Documents',
    icon: ShoppingBag,
    description: 'Tax Invoices, Quotations, Sales Orders, Credit Notes',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'purchase',
    name: 'Purchase Documents',
    icon: FileText,
    description: 'Purchase Bills, Material Inward POs, Vendor Returns',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'receipt',
    name: 'Receipt Vouchers',
    icon: Receipt,
    description: 'Customer Payment In, Money Receipts, Advance Inward',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  {
    id: 'payment',
    name: 'Payment Vouchers',
    icon: CreditCard,
    description: 'Supplier Payment Out, Expense Vouchers, Advance Disbursements',
    badgeColor: 'bg-slate-200 text-slate-800',
  },
];

export const InvoiceThemeSettingsManager: React.FC = () => {
  const [themesSettings, setThemesSettings] = useState<InvoiceThemesSettings>(() =>
    invoiceThemeStorage.getSettings()
  );
  const [activeCategory, setActiveCategory] = useState<ThemedDocumentCategory>('sales');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<'normal' | 'fit'>('normal');

  // Dynamic invoice logo & company branding state
  const [invoiceLogo, setInvoiceLogo] = useState<string | undefined>(() => storage.getInvoiceLogo());
  const [companyLogo, setCompanyLogo] = useState<string | undefined>(() => storage.getCompanyLogo());
  const [companySettings, setCompanySettings] = useState(() => storage.getSettings());
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setThemesSettings(invoiceThemeStorage.getSettings());
    };
    const handleInvoiceLogoChange = () => {
      setInvoiceLogo(storage.getInvoiceLogo());
      setCompanyLogo(storage.getCompanyLogo());
      setCompanySettings(storage.getSettings());
    };
    window.addEventListener('erp_invoice_themes_changed', handleStorageChange);
    window.addEventListener('mysar_invoice_logo_changed', handleInvoiceLogoChange);
    window.addEventListener('mysar_company_logo_changed', handleInvoiceLogoChange);
    return () => {
      window.removeEventListener('erp_invoice_themes_changed', handleStorageChange);
      window.removeEventListener('mysar_invoice_logo_changed', handleInvoiceLogoChange);
      window.removeEventListener('mysar_company_logo_changed', handleInvoiceLogoChange);
    };
  }, []);

  const handleUploadInvoiceLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    try {
      setIsUploadingLogo(true);
      const optimized = await optimizeLogoImage(file, 512);
      storage.saveInvoiceLogo(optimized);
      setInvoiceLogo(optimized);
      triggerSavedNotice();
    } catch (err) {
      console.error('Failed to optimize and save invoice logo', err);
      alert('Failed to process image file. Please try another image.');
    } finally {
      setIsUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleResetInvoiceLogo = () => {
    if (confirm('Revert Invoice Logo to inherit from Master Company Logo?')) {
      storage.saveInvoiceLogo(undefined);
      setInvoiceLogo(undefined);
      triggerSavedNotice();
    }
  };

  const currentConfigKey: keyof InvoiceThemesSettings =
    activeCategory === 'sales'
      ? 'salesTheme'
      : activeCategory === 'purchase'
      ? 'purchaseTheme'
      : activeCategory === 'receipt'
      ? 'receiptTheme'
      : 'paymentTheme';

  const currentThemeConfig = themesSettings[currentConfigKey];

  const updateCurrentConfig = (updates: Partial<DocumentThemeConfig>) => {
    const updatedCategoryConfig: DocumentThemeConfig = {
      ...currentThemeConfig,
      ...updates,
    };
    const updatedSettings: InvoiceThemesSettings = {
      ...themesSettings,
      [currentConfigKey]: updatedCategoryConfig,
    };
    setThemesSettings(updatedSettings);
    invoiceThemeStorage.saveSettings(updatedSettings);
    triggerSavedNotice();
  };

  const triggerSavedNotice = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleApplyToAll = () => {
    if (
      confirm(
        `Apply the current theme (${currentThemeConfig.themeStyle.toUpperCase()}) and color (${currentThemeConfig.primaryColor.toUpperCase()}) to ALL document categories (Sales, Purchase, Receipts, Payments)?`
      )
    ) {
      const updated = invoiceThemeStorage.applyThemeToAllCategories(currentThemeConfig);
      setThemesSettings(updated);
      triggerSavedNotice();
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all invoice and voucher themes back to factory defaults?')) {
      const reset = invoiceThemeStorage.resetToDefaults();
      setThemesSettings(reset);
      triggerSavedNotice();
    }
  };

  const handlePrintTest = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-linear-to-r from-emerald-800 via-[#0B5D2A] to-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>My Billbook Style Invoice & Voucher Designer</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight">Invoice & Voucher Theme Selector</h2>
          <p className="text-emerald-100 text-xs max-w-2xl mt-1 leading-relaxed">
            Customize the visual presentation, color palettes, GST metadata, QR codes, and statutory terms for{' '}
            <b>Receipts</b>, <b>Payments</b>, <b>Sales Invoices</b>, and <b>Purchase Bills</b>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApplyToAll}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-xs"
            title="Sync this theme across Sales, Purchase, Receipts & Payments"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Apply to All Categories</span>
          </button>
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-white/10 hover:bg-red-500/20 border border-white/20 text-red-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            title="Reset to default templates"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CATEGORY_TABS.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const config = themesSettings[
            cat.id === 'sales'
              ? 'salesTheme'
              : cat.id === 'purchase'
              ? 'purchaseTheme'
              : cat.id === 'receipt'
              ? 'receiptTheme'
              : 'paymentTheme'
          ];
          const activePalette = THEME_COLOR_PALETTES[config.primaryColor];

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`p-4 rounded-xl text-left border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-[#168A45] shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white/80 hover:bg-white border-gray-200 shadow-2xs hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`p-2 rounded-lg ${
                    isActive ? 'bg-[#EAF7EF] text-[#0B5D2A]' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                    style={{ backgroundColor: activePalette?.hex || '#0B5D2A' }}
                  />
                  <span className="capitalize">{config.themeStyle}</span>
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 leading-tight">{cat.name}</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Split: Controls on Left, Real-Time Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: THEME & COLOR SELECTOR (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Preset Themes Gallery */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">Choose Theme Template</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">
                Category: <b className="text-slate-800 capitalize">{activeCategory}</b>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_PRESETS.map((preset) => {
                const isSelected = currentThemeConfig.themeStyle === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => updateCurrentConfig({ themeStyle: preset.id })}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0B5D2A] bg-[#EAF7EF]/50 shadow-2xs ring-2 ring-emerald-500/20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{preset.name}</span>
                        {isSelected ? (
                          <span className="p-0.5 rounded-full bg-[#0B5D2A] text-white">
                            <Check className="w-3 h-3" />
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                            {preset.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{preset.description}</p>
                    </div>
                    <div className="mt-2 text-[9px] font-bold text-emerald-800 bg-white/70 px-1.5 py-0.5 rounded border border-gray-100">
                      Best for: {preset.bestFor}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color Palette Selector */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Theme Color Palette</h3>
            </div>
            <p className="text-[11px] text-slate-500">
              Select the primary accent color applied to document borders, tables, headers, and badges.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(THEME_COLOR_PALETTES) as InvoiceThemeColor[]).map((cKey) => {
                const p = THEME_COLOR_PALETTES[cKey];
                const isSelected = currentThemeConfig.primaryColor === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => updateCurrentConfig({ primaryColor: cKey })}
                    className={`flex items-center space-x-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-800 bg-slate-50 shadow-2xs font-bold ring-2 ring-slate-400/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center text-white"
                      style={{ backgroundColor: p.hex }}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5" />}
                    </span>
                    <span className="text-[11px] text-slate-800 truncate">{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* INVOICE LOGO & COMPANY HEADER BRANDING */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">Invoice Logo & Company Header</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active on Header
              </span>
            </div>

            {/* Logo Preview & Upload */}
            <div className="p-3.5 bg-slate-50 border border-gray-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#168A45]" />
                  <span>Invoice Logo Slot</span>
                </span>
                {invoiceLogo ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-md">
                    Custom Dedicated Logo
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                    Inheriting Master Logo
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
                  {invoiceLogo || companyLogo ? (
                    <img
                      src={invoiceLogo || companyLogo}
                      alt="Invoice Logo"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full rounded-lg bg-[#168A45] flex items-center justify-center text-white font-black text-xl">
                      {companySettings.brandName ? companySettings.brandName.charAt(0) : 'M'}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      onChange={handleUploadInvoiceLogo}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="text-xs bg-[#168A45] hover:bg-[#127038] text-white px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingLogo ? 'Optimizing...' : invoiceLogo ? 'Replace Logo' : 'Upload Invoice Logo'}</span>
                    </button>

                    {invoiceLogo && (
                      <button
                        type="button"
                        onClick={handleResetInvoiceLogo}
                        className="text-xs text-slate-600 hover:text-red-600 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-gray-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Revert to master company logo"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Use Master</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    PNG, SVG, or JPG (crisp resolution, max 512px, transparent background recommended)
                  </p>
                </div>
              </div>

              {/* Company Name & Address Display */}
              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="font-bold text-slate-900 truncate">
                  {companySettings.companyName || 'Casbiro Solutions Private Limited'}
                  {companySettings.brandName && (
                    <span className="text-[#168A45] font-normal ml-1">({companySettings.brandName})</span>
                  )}
                </div>
                <div className="flex items-start gap-1 text-[10px] text-slate-500">
                  <MapPin className="w-3 h-3 text-[#168A45] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {companySettings.address || 'No. 4/461, 2nd Floor, Valamkattil Tower, Judgemukku, Kakkanad, Kochi, Kerala – 682021'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  GSTIN: {companySettings.gstNumber || '32AABCC8921F1ZX'}
                </div>
              </div>
            </div>

            {/* Quick Toggle for Logo Visibility */}
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Show Logo on Document Header</span>
                <span className="text-[10px] text-slate-400">Toggle whether to render logo or text-only header</span>
              </div>
              <input
                type="checkbox"
                checked={currentThemeConfig.showLogo}
                onChange={(e) => updateCurrentConfig({ showLogo: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>

          {/* Content & Layout Customization Toggles */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Document Elements & Toggles</h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Company Logo</span>
                  <span className="text-[10px] text-slate-400">Display official company logo on header</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showLogo}
                  onChange={(e) => updateCurrentConfig({ showLogo: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Bank Remittance Details</span>
                  <span className="text-[10px] text-slate-400">Display Bank Name, A/C number, IFSC, Branch</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showBankDetails}
                  onChange={(e) => updateCurrentConfig({ showBankDetails: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">UPI Payment QR Code</span>
                  <span className="text-[10px] text-slate-400">Scan-and-pay dynamic QR badge for instant verification</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showQrCode}
                  onChange={(e) => updateCurrentConfig({ showQrCode: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {(activeCategory === 'sales' || activeCategory === 'purchase') && (
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">HSN / SAC Tax Liability Summary</span>
                    <span className="text-[10px] text-slate-400">Itemized statutory breakdown of CGST, SGST & IGST</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentThemeConfig.showHsnSummary}
                    onChange={(e) => updateCurrentConfig({ showHsnSummary: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              )}

              {(activeCategory === 'receipt' || activeCategory === 'payment') && (
                <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                  <div>
                    <span className="font-bold text-slate-800 block">HSN / SAC Tax Summary Table</span>
                    <span className="text-[10px] text-slate-400">Display statutory HSN/SAC tax summary on voucher if applicable</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={currentThemeConfig.showHsnSummary}
                    onChange={(e) => updateCurrentConfig({ showHsnSummary: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                </label>
              )}

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Total Amount in Words</span>
                  <span className="text-[10px] text-slate-400">Automatic Indian Rupee currency text conversion</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showAmountInWords}
                  onChange={(e) => updateCurrentConfig({ showAmountInWords: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Authorized Signatory Stamp & Box</span>
                  <span className="text-[10px] text-slate-400">Official seal block with signature designation line</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showSignatory}
                  onChange={(e) => updateCurrentConfig({ showSignatory: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Terms & Conditions / Declaration</span>
                  <span className="text-[10px] text-slate-400">Include commercial legal clauses and payment notice</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showTerms}
                  onChange={(e) => updateCurrentConfig({ showTerms: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 block">Previous Balance Due</span>
                  <span className="text-[10px] text-slate-400">Show party outstanding ledger balance on invoice</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showBalanceDue}
                  onChange={(e) => updateCurrentConfig({ showBalanceDue: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Item Table Content & Columns Checkboxes */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">Item Table Content & HSN Summary</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Columns & Tax Table
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Show Item Table Content</span>
                  <span className="text-[10px] text-slate-500">Display line-item breakdown table on invoice / voucher</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showItemTable !== false && currentThemeConfig.itemTableContent?.showItemTable !== false}
                  onChange={(e) =>
                    updateCurrentConfig({
                      showItemTable: e.target.checked,
                      itemTableContent: {
                        ...(currentThemeConfig.itemTableContent || {
                          showItemTable: true,
                          showSerialNumber: true,
                          showItemDescription: true,
                          showHsnColumn: true,
                          showQuantity: true,
                          showUnit: true,
                          showRate: true,
                          showTaxableValue: true,
                          showGstPercent: true,
                          showTaxAmount: true,
                          showDiscountColumn: false,
                        }),
                        showItemTable: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Show HSN / SAC Summary Table</span>
                  <span className="text-[10px] text-slate-500">Include HSN/SAC-wise taxable value, CGST, SGST & total tax summary</span>
                </div>
                <input
                  type="checkbox"
                  checked={currentThemeConfig.showHsnSummary}
                  onChange={(e) => updateCurrentConfig({ showHsnSummary: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>

              {currentThemeConfig.showItemTable !== false &&
                currentThemeConfig.itemTableContent?.showItemTable !== false && (
                  <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-2">
                    {[
                      { key: 'showSerialNumber', label: 'S.No. Column' },
                      { key: 'showItemDescription', label: 'Item Description' },
                      { key: 'showHsnColumn', label: 'HSN / SAC Column' },
                      { key: 'showQuantity', label: 'Quantity (Qty)' },
                      { key: 'showUnit', label: 'Unit (UOM)' },
                      { key: 'showRate', label: 'Rate / Price' },
                      { key: 'showDiscountColumn', label: 'Discount Column' },
                      { key: 'showTaxableValue', label: 'Taxable Value' },
                      { key: 'showGstPercent', label: 'GST % Column' },
                      { key: 'showTaxAmount', label: 'Tax Amount' },
                    ].map((col) => {
                      const tbl = currentThemeConfig.itemTableContent || {
                        showItemTable: true,
                        showSerialNumber: true,
                        showItemDescription: true,
                        showHsnColumn: true,
                        showQuantity: true,
                        showUnit: true,
                        showRate: true,
                        showTaxableValue: true,
                        showGstPercent: true,
                        showTaxAmount: true,
                        showDiscountColumn: false,
                      };
                      const isChecked = (tbl as any)[col.key] !== false;
                      return (
                        <label
                          key={col.key}
                          className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-700 text-[11px]">{col.label}</span>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) =>
                              updateCurrentConfig({
                                itemTableContent: {
                                  ...tbl,
                                  [col.key]: e.target.checked,
                                },
                              })
                            }
                            className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
            </div>
          </div>

          {/* Text Labels & Customizer */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-2xs space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-sm text-slate-900">Custom Text & Header Titles</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Document Header Title</label>
                <input
                  type="text"
                  value={currentThemeConfig.headerTitle}
                  onChange={(e) => updateCurrentConfig({ headerTitle: e.target.value })}
                  placeholder="e.g. TAX INVOICE or OFFICIAL RECEIPT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UPI ID for Payment QR</label>
                <input
                  type="text"
                  value={currentThemeConfig.upiId || ''}
                  onChange={(e) => updateCurrentConfig({ upiId: e.target.value })}
                  placeholder="e.g. yourbusiness@hdfcbank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Authorized Signatory Label</label>
                <textarea
                  rows={2}
                  value={currentThemeConfig.signatoryText}
                  onChange={(e) => updateCurrentConfig({ signatoryText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Terms & Conditions Text</label>
                <textarea
                  rows={3}
                  value={currentThemeConfig.termsAndConditions}
                  onChange={(e) => updateCurrentConfig({ termsAndConditions: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: REAL-TIME INTERACTIVE LIVE PREVIEW (7 cols) */}
        <div className="lg:col-span-7 space-y-4 sticky top-6">
          <div className="bg-white rounded-2xl p-4 md:p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-900">
                  Live Interactive Preview: <span className="capitalize">{activeCategory}</span>
                </h3>
                {savedSuccess && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-in fade-in flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handlePrintTest}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sample</span>
                </button>
              </div>
            </div>

            {/* Live Document Canvas */}
            <div className="bg-slate-100/70 p-3 md:p-5 rounded-xl border border-gray-200 max-h-[82vh] overflow-y-auto flex flex-col items-center">
              <div className="mb-3 px-3 py-1 rounded-full bg-slate-900 text-slate-300 text-[11px] font-medium border border-slate-700 shadow-xs flex items-center space-x-2 no-print shrink-0 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-white">A4 Page Preview</span>
                <span className="text-slate-500">•</span>
                <span className="font-mono text-emerald-300">210mm × 297mm</span>
              </div>
              <div className="w-[210mm] max-w-full min-h-[297mm] shadow-xl bg-white print:shadow-none print:w-[210mm] print:m-0 erp-a4-document-sheet">
                <ThemedDocumentRenderer
                  category={activeCategory}
                  themeConfig={currentThemeConfig}
                  isSample={true}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 text-[11px] text-slate-600 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
                <span>
                  Active Theme: <b>{currentThemeConfig.themeStyle.toUpperCase()}</b> • Palette:{' '}
                  <b>{currentThemeConfig.primaryColor.toUpperCase()}</b>. Changes are saved automatically.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
