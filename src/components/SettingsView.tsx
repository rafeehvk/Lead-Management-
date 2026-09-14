import React, { useState, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  FileSpreadsheet,
  Users,
  Save,
  RotateCcw,
  CheckCircle2,
  Layers,
  Plus,
  Trash2,
  Mail,
  X,
  ShieldCheck,
  Bell,
  Lock,
  Tag,
  Upload,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Compass,
  LogIn,
  Globe,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { Settings, User, UserRole, ProposalContentConfig, Lead } from '../types';
import { hasPermission } from '../utils/rbac';
import { storage } from '../services/storageService';
import { optimizeLogoImage } from '../utils/imageOptimizer';
import { PricingMasterManager } from './PricingMasterManager';
import { TeamRbacManager } from './TeamRbacManager';
import { ProposalContentManager } from './ProposalContentManager';
import { CsvLeadImporter } from './CsvLeadImporter';

export type LogoSlot = 'master' | 'navbar' | 'document' | 'login';

interface SettingsViewProps {
  settings: Settings;
  users: User[];
  currentUser: User;
  leads?: Lead[];
  onSaveSettings: (settings: Settings) => void;
  onSaveUser: (user: User) => void;
  onUpdateUser?: (user: User) => void;
  onDeleteUser?: (userId: string) => void;
  onResetDemo: () => void;
  onBulkImportLeads?: (leadsData: Array<Partial<Lead>>) => { successCount: number; createdLeads: Lead[]; errors: string[] };
  onNavigateToLeads?: () => void;
  initialTab?: 'pricing' | 'company' | 'proposal' | 'users' | 'import' | 'integrations';
  onTabChange?: (tab: 'pricing' | 'company' | 'proposal' | 'users' | 'import' | 'integrations') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  users,
  currentUser,
  leads = [],
  onSaveSettings,
  onSaveUser,
  onUpdateUser,
  onDeleteUser,
  onResetDemo,
  onBulkImportLeads,
  onNavigateToLeads,
  initialTab = 'pricing',
  onTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'company' | 'proposal' | 'users' | 'import' | 'integrations'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSubTabSelect = (tab: 'pricing' | 'company' | 'proposal' | 'users' | 'import' | 'integrations') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [selectedLogoSlot, setSelectedLogoSlot] = useState<LogoSlot>('master');
  const [formData, setFormData] = useState<Settings>(() => {
    const persistentLogo = storage.getCompanyLogo();
    const pNav = storage.getNavbarLogo();
    const pDoc = storage.getDocumentLogo();
    const pLogin = storage.getLoginLogo();
    return {
      ...settings,
      companyLogo: settings.companyLogo || persistentLogo,
      navbarLogo: settings.navbarLogo || pNav,
      documentLogo: settings.documentLogo || pDoc,
      loginLogo: settings.loginLogo || pLogin,
    };
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [dragTargetSlot, setDragTargetSlot] = useState<LogoSlot | null>(null);
  const [isOptimizingLogo, setIsOptimizingLogo] = useState(false);
  const [logoStatusMessage, setLogoStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep formData in sync when settings prop updates
  React.useEffect(() => {
    const persistentLogo = storage.getCompanyLogo();
    const pNav = storage.getNavbarLogo();
    const pDoc = storage.getDocumentLogo();
    const pLogin = storage.getLoginLogo();
    setFormData((prev) => ({
      ...settings,
      companyLogo: settings.companyLogo || persistentLogo || prev.companyLogo,
      navbarLogo: settings.navbarLogo || pNav || prev.navbarLogo,
      documentLogo: settings.documentLogo || pDoc || prev.documentLogo,
      loginLogo: settings.loginLogo || pLogin || prev.loginLogo,
    }));
  }, [settings]);

  const canManage = hasPermission.canManageSettings(currentUser);

  const handleLogoFile = async (file: File, targetSlot: LogoSlot = selectedLogoSlot) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Logo file size must be under 5MB.');
      return;
    }

    try {
      setIsOptimizingLogo(true);
      // Optimize image to max 512px to prevent localStorage quota issues
      const optimizedDataUrl = await optimizeLogoImage(file, 512);

      const updatedSettings: Settings = {
        ...formData,
      };

      let slotName = 'Master Company Logo';
      if (targetSlot === 'master') {
        updatedSettings.companyLogo = optimizedDataUrl;
        storage.saveCompanyLogo(optimizedDataUrl);
        slotName = 'Master Company Logo';
      } else if (targetSlot === 'navbar') {
        updatedSettings.navbarLogo = optimizedDataUrl;
        storage.saveNavbarLogo(optimizedDataUrl);
        slotName = 'App Navigation Logo';
      } else if (targetSlot === 'document') {
        updatedSettings.documentLogo = optimizedDataUrl;
        storage.saveDocumentLogo(optimizedDataUrl);
        slotName = 'Document & PDF Print Logo';
      } else if (targetSlot === 'login') {
        updatedSettings.loginLogo = optimizedDataUrl;
        storage.saveLoginLogo(optimizedDataUrl);
        slotName = 'Login Screen Emblem';
      }

      // Immediately update component state and propagate to App
      setFormData(updatedSettings);
      onSaveSettings(updatedSettings);

      setLogoStatusMessage(`${slotName} saved permanently! Active across all views.`);
      setTimeout(() => setLogoStatusMessage(null), 4000);
    } catch (err) {
      console.error('Failed to optimize and save logo', err);
      alert('Failed to process image. Please try another image file.');
    } finally {
      setIsOptimizingLogo(false);
      setDragTargetSlot(null);
    }
  };

  const handleDropLogo = (e: React.DragEvent, targetSlot: LogoSlot = selectedLogoSlot) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    setDragTargetSlot(null);
    if (!canManage) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0], targetSlot);
    }
  };

  const triggerUploadForSlot = (slot: LogoSlot) => {
    if (!canManage || isOptimizingLogo) return;
    setSelectedLogoSlot(slot);
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }, 50);
  };

  const handleRemoveLogo = (targetSlot: LogoSlot = selectedLogoSlot) => {
    let confirmMsg = 'Are you sure you want to remove this logo?';
    if (targetSlot === 'master') {
      confirmMsg = 'Remove Master Company Logo? Views without custom logos will revert to default system glyphs.';
    } else if (targetSlot === 'navbar') {
      confirmMsg = 'Reset App Navigation logo to inherit from the Master Company Logo?';
    } else if (targetSlot === 'document') {
      confirmMsg = 'Reset Document & PDF logo to inherit from the Master Company Logo?';
    } else if (targetSlot === 'login') {
      confirmMsg = 'Reset Login Screen emblem to inherit from the Master Company Logo?';
    }

    if (!confirm(confirmMsg)) {
      return;
    }

    const updatedSettings: Settings = {
      ...formData,
    };

    if (targetSlot === 'master') {
      updatedSettings.companyLogo = undefined;
      storage.saveCompanyLogo(undefined);
      setLogoStatusMessage('Master company logo removed.');
    } else if (targetSlot === 'navbar') {
      updatedSettings.navbarLogo = undefined;
      storage.saveNavbarLogo(undefined);
      setLogoStatusMessage('App Navbar logo reset to use Master logo.');
    } else if (targetSlot === 'document') {
      updatedSettings.documentLogo = undefined;
      storage.saveDocumentLogo(undefined);
      setLogoStatusMessage('Document & PDF logo reset to use Master logo.');
    } else if (targetSlot === 'login') {
      updatedSettings.loginLogo = undefined;
      storage.saveLoginLogo(undefined);
      setLogoStatusMessage('Login emblem badge reset to use Master logo.');
    }

    setFormData(updatedSettings);
    onSaveSettings(updatedSettings);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setLogoStatusMessage(null), 4000);
  };

  const handleApplyMasterToAll = () => {
    const master = formData.companyLogo;
    if (!master) {
      alert('Please upload a Master Company Logo first before copying to all placements.');
      return;
    }
    if (!confirm('Copy the Master Company Logo to all 3 placements (App Navbar, Document/PDF, and Login Screen)?')) {
      return;
    }

    const updatedSettings: Settings = {
      ...formData,
      navbarLogo: master,
      documentLogo: master,
      loginLogo: master,
    };

    setFormData(updatedSettings);
    storage.saveNavbarLogo(master);
    storage.saveDocumentLogo(master);
    storage.saveLoginLogo(master);
    onSaveSettings(updatedSettings);

    setLogoStatusMessage('Master logo copied to App Navbar, Documents & PDF, and Login Screen!');
    setTimeout(() => setLogoStatusMessage(null), 4000);
  };

  const handleManualSaveLogo = () => {
    storage.saveCompanyLogo(formData.companyLogo);
    storage.saveNavbarLogo(formData.navbarLogo);
    storage.saveDocumentLogo(formData.documentLogo);
    storage.saveLoginLogo(formData.loginLogo);
    onSaveSettings(formData);
    setLogoStatusMessage('All brand logo configurations verified and saved permanently!');
    setTimeout(() => setLogoStatusMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Only administrators can update core company settings.');
      return;
    }
    if (formData.companyLogo) storage.saveCompanyLogo(formData.companyLogo);
    if (formData.navbarLogo) storage.saveNavbarLogo(formData.navbarLogo);
    if (formData.documentLogo) storage.saveDocumentLogo(formData.documentLogo);
    if (formData.loginLogo) storage.saveLoginLogo(formData.loginLogo);
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSaveProposalContent = (newContent: ProposalContentConfig) => {
    const updated = {
      ...formData,
      proposalContent: newContent,
    };
    setFormData(updated);
    onSaveSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-slate-800">
              System Settings & Masters
            </h2>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                currentUser.role === 'Admin'
                  ? 'bg-emerald-50 text-[#0B5D2A] border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-gray-200'
              }`}
            >
              Role: {currentUser.role}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Configure pricing plans master, proposal document content & modules, company branding, and team permissions
          </p>
        </div>

        {canManage && (
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => {
                if (confirm('Reset all leads, proposals, pricing plans, and settings back to initial demo data?')) {
                  onResetDemo();
                }
              }}
              className="bg-white hover:bg-red-50 text-red-700 border border-red-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Demo Data</span>
            </button>
          </div>
        )}
      </div>

      {!canManage && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3.5 rounded-xl flex items-center space-x-2.5 shadow-2xs">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            You are currently logged in as <strong>{currentUser.role}</strong>. Viewing in read-only mode. Switch to an <strong>Admin</strong> account from the top menu to modify system settings and manage team users.
          </span>
        </div>
      )}

      {savedSuccess && (
        <div className="bg-[#EAF7EF] border border-[#168A45] text-[#0B5D2A] text-xs font-bold px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
          <span>Settings saved successfully to persistent storage!</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={() => handleSubTabSelect('pricing')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'pricing'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Pricing Plan / Type Master</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabSelect('proposal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'proposal'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Proposal Document Content</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabSelect('company')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'company'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company & Branding</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabSelect('import')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'import'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Import Leads from CSV</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabSelect('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'users'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & RBAC Roles</span>
        </button>

        <button
          type="button"
          onClick={() => handleSubTabSelect('integrations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
            activeTab === 'integrations'
              ? 'bg-[#168A45] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Integrations & Automation</span>
        </button>
      </div>

      {/* TAB 1: PRICING TYPE / PLAN MASTER */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <PricingMasterManager currentUser={currentUser} />
        </div>
      )}

      {/* TAB 2: PROPOSAL DOCUMENT CONTENT */}
      {activeTab === 'proposal' && (
        <ProposalContentManager
          settings={formData}
          currentUser={currentUser}
          onSaveProposalContent={handleSaveProposalContent}
        />
      )}

      {/* TAB 2: COMPANY & BRANDING */}
      {activeTab === 'company' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Building2 className="w-4 h-4 text-[#168A45]" />
              Company & Branding Profile
            </h3>

            {/* SEPARATE LOGO SELECTION & MANAGEMENT */}
            <div className="bg-[#F7FAF8] border border-[#D9E5DD] rounded-xl p-4.5 space-y-4">
              {logoStatusMessage && (
                <div className="bg-[#EAF7EF] border border-[#168A45] text-[#0B5D2A] text-xs font-bold px-3.5 py-2.5 rounded-lg flex items-center space-x-2 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-[#168A45] shrink-0" />
                  <span>{logoStatusMessage}</span>
                </div>
              )}

              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#168A45]" />
                      Separate Brand Logo Selection
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0B5D2A] bg-[#EAF7EF] border border-[#D9E5DD] px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-[#168A45]" />
                      Persistent Storage
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select and customize individual logos for the <strong>App Header</strong>, <strong>PDF Proposals/Documents</strong>, and <strong>Login Portal</strong>, or use a universal <strong>Master Logo</strong>.
                  </p>
                </div>

                {canManage && (
                  <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                    {formData.companyLogo && (
                      <button
                        type="button"
                        onClick={handleApplyMasterToAll}
                        className="text-xs text-[#0B5D2A] bg-white hover:bg-[#EAF7EF] px-2.5 py-1.5 rounded-lg border border-[#D9E5DD] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copy Master Company Logo to all 3 placements"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#168A45]" />
                        <span>Sync Master to All</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleManualSaveLogo}
                      className="text-xs text-[#0B5D2A] bg-[#EAF7EF] hover:bg-[#d5eedf] px-2.5 py-1.5 rounded-lg border border-[#D9E5DD] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Confirm all logos are saved permanently"
                    >
                      <Save className="w-3.5 h-3.5 text-[#168A45]" />
                      <span>Save Logos</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SEPARATE LOGO SELECTION TABS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
                {/* 1. Master Logo Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedLogoSlot('master')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedLogoSlot === 'master'
                      ? 'bg-white border-[#168A45] ring-2 ring-[#168A45]/30 shadow-xs'
                      : 'bg-white/70 hover:bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedLogoSlot === 'master' ? 'bg-[#EAF7EF] text-[#168A45]' : 'bg-slate-100 text-slate-500'}`}>
                        <Globe className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Master Logo</span>
                    </div>
                    {formData.companyLogo ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                        Configured
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Not Set
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    Universal default fallback
                  </div>
                </button>

                {/* 2. App Navbar Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedLogoSlot('navbar')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedLogoSlot === 'navbar'
                      ? 'bg-white border-[#168A45] ring-2 ring-[#168A45]/30 shadow-xs'
                      : 'bg-white/70 hover:bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedLogoSlot === 'navbar' ? 'bg-[#EAF7EF] text-[#168A45]' : 'bg-slate-100 text-slate-500'}`}>
                        <Compass className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">App Navbar</span>
                    </div>
                    {formData.navbarLogo ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                        Custom
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Uses Master
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    Top-left navigation bar
                  </div>
                </button>

                {/* 3. Document / PDF Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedLogoSlot('document')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedLogoSlot === 'document'
                      ? 'bg-white border-[#168A45] ring-2 ring-[#168A45]/30 shadow-xs'
                      : 'bg-white/70 hover:bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedLogoSlot === 'document' ? 'bg-[#EAF7EF] text-[#168A45]' : 'bg-slate-100 text-slate-500'}`}>
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Documents & PDF</span>
                    </div>
                    {formData.documentLogo ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                        Custom
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Uses Master
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    Proposals & print exports
                  </div>
                </button>

                {/* 4. Login Emblem Tab */}
                <button
                  type="button"
                  onClick={() => setSelectedLogoSlot('login')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedLogoSlot === 'login'
                      ? 'bg-white border-[#168A45] ring-2 ring-[#168A45]/30 shadow-xs'
                      : 'bg-white/70 hover:bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${selectedLogoSlot === 'login' ? 'bg-[#EAF7EF] text-[#168A45]' : 'bg-slate-100 text-slate-500'}`}>
                        <LogIn className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">Login Emblem</span>
                    </div>
                    {formData.loginLogo ? (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                        Custom
                      </span>
                    ) : (
                      <span className="text-[9px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        Uses Master
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">
                    Central sign-in portal badge
                  </div>
                </button>
              </div>

              {/* MAIN LOGO WORKSPACE: Selected Slot Dropzone & Live Display Previews */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Left: Upload & Management Panel for Selected Slot */}
                <div className="md:col-span-6 space-y-3">
                  {/* Slot Descriptor Banner */}
                  <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {selectedLogoSlot === 'master' && <Globe className="w-4 h-4 text-[#168A45]" />}
                        {selectedLogoSlot === 'navbar' && <Compass className="w-4 h-4 text-[#168A45]" />}
                        {selectedLogoSlot === 'document' && <FileText className="w-4 h-4 text-[#168A45]" />}
                        {selectedLogoSlot === 'login' && <LogIn className="w-4 h-4 text-[#168A45]" />}
                        <span className="text-xs font-bold text-slate-800">
                          {selectedLogoSlot === 'master' && 'Configuring: Master Company Logo'}
                          {selectedLogoSlot === 'navbar' && 'Configuring: App Navigation Bar Logo'}
                          {selectedLogoSlot === 'document' && 'Configuring: Document & PDF Proposal Logo'}
                          {selectedLogoSlot === 'login' && 'Configuring: Login Screen Emblem Badge'}
                        </span>
                      </div>

                      {/* Remove / Reset Button for current slot */}
                      {canManage && (
                        <div>
                          {selectedLogoSlot === 'master' && formData.companyLogo && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo('master')}
                              className="text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md border border-red-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Remove</span>
                            </button>
                          )}
                          {selectedLogoSlot === 'navbar' && formData.navbarLogo && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo('navbar')}
                              className="text-[11px] text-slate-600 hover:text-red-600 hover:bg-slate-100 px-2 py-1 rounded-md border border-gray-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Revert to using Master Company Logo"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revert to Master</span>
                            </button>
                          )}
                          {selectedLogoSlot === 'document' && formData.documentLogo && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo('document')}
                              className="text-[11px] text-slate-600 hover:text-red-600 hover:bg-slate-100 px-2 py-1 rounded-md border border-gray-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Revert to using Master Company Logo"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revert to Master</span>
                            </button>
                          )}
                          {selectedLogoSlot === 'login' && formData.loginLogo && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLogo('login')}
                              className="text-[11px] text-slate-600 hover:text-red-600 hover:bg-slate-100 px-2 py-1 rounded-md border border-gray-200 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Revert to using Master Company Logo"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revert to Master</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {selectedLogoSlot === 'master' && 'The universal fallback logo. Used on navbar, documents, and login screen unless a dedicated logo is specified below.'}
                      {selectedLogoSlot === 'navbar' && 'Displayed at the top-left navigation bar. Ideal for compact horizontal logos or square badges (36-48px height) with transparent backgrounds.'}
                      {selectedLogoSlot === 'document' && 'High-resolution logo printed on official PDF proposals, institutional reports, and executive summary documents.'}
                      {selectedLogoSlot === 'login' && 'Emblem badge displayed at the center of the authentication login screen and mobile portal.'}
                    </p>

                    {/* Status pill */}
                    <div className="pt-1">
                      {selectedLogoSlot === 'master' ? (
                        formData.companyLogo ? (
                          <div className="text-[11px] text-[#168A45] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Master Logo Active and stored permanently</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400">
                            No master logo uploaded yet. Default MYSAR glyph is in use.
                          </div>
                        )
                      ) : selectedLogoSlot === 'navbar' ? (
                        formData.navbarLogo ? (
                          <div className="text-[11px] text-[#168A45] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dedicated App Navbar logo active</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>↳ Inheriting from Master Company Logo</span>
                            {formData.companyLogo && (
                              <span className="text-emerald-700 font-bold">({formData.brandName || 'Configured'})</span>
                            )}
                          </div>
                        )
                      ) : selectedLogoSlot === 'document' ? (
                        formData.documentLogo ? (
                          <div className="text-[11px] text-[#168A45] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dedicated Document & PDF print logo active</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>↳ Inheriting from Master Company Logo</span>
                            {formData.companyLogo && (
                              <span className="text-emerald-700 font-bold">({formData.brandName || 'Configured'})</span>
                            )}
                          </div>
                        )
                      ) : (
                        formData.loginLogo ? (
                          <div className="text-[11px] text-[#168A45] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dedicated Login Screen emblem active</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span>↳ Inheriting from Master Company Logo</span>
                            {formData.companyLogo && (
                              <span className="text-emerald-700 font-bold">({formData.brandName || 'Configured'})</span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Upload Dropzone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (canManage && !isOptimizingLogo) setIsDraggingLogo(true);
                    }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={(e) => handleDropLogo(e, selectedLogoSlot)}
                    onClick={() => {
                      if (canManage && !isOptimizingLogo && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[140px] ${
                      isDraggingLogo
                        ? 'border-[#168A45] bg-[#EAF7EF]'
                        : 'border-gray-300 hover:border-[#168A45] bg-white hover:bg-[#F7FAF8]'
                    } ${!canManage || isOptimizingLogo ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      disabled={!canManage || isOptimizingLogo}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleLogoFile(e.target.files[0], selectedLogoSlot);
                        }
                      }}
                    />
                    {isOptimizingLogo ? (
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-8 h-8 border-3 border-[#168A45]/30 border-t-[#168A45] rounded-full animate-spin mb-2" />
                        <div className="text-xs font-bold text-[#168A45]">Optimizing & saving logo permanently...</div>
                        <div className="text-[10px] text-slate-400">Preserving crisp transparency & scaling for fast loading</div>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#EAF7EF] text-[#168A45] flex items-center justify-center mb-2 shadow-2xs">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-xs font-bold text-slate-800">
                          {selectedLogoSlot === 'master' && (formData.companyLogo ? 'Click or drag to replace Master Logo' : 'Upload Master Company Logo')}
                          {selectedLogoSlot === 'navbar' && (formData.navbarLogo ? 'Click or drag to replace App Navbar Logo' : 'Upload Dedicated App Navbar Logo')}
                          {selectedLogoSlot === 'document' && (formData.documentLogo ? 'Click or drag to replace Document Logo' : 'Upload Dedicated Document & PDF Logo')}
                          {selectedLogoSlot === 'login' && (formData.loginLogo ? 'Click or drag to replace Login Emblem' : 'Upload Dedicated Login Screen Emblem')}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          PNG, SVG, JPG, or WebP (auto-optimized to max 512px, transparent background recommended)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Live Interactive Display Previews */}
                <div className="md:col-span-6 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Live Display Previews & Quick Selector
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Click any card to select & customize
                    </span>
                  </div>

                  {/* 1. App Top-Left Navbar Preview */}
                  {(() => {
                    const activeNavbarLogo = formData.navbarLogo || formData.companyLogo;
                    const isSelected = selectedLogoSlot === 'navbar';
                    return (
                      <div
                        onClick={() => setSelectedLogoSlot('navbar')}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragTargetSlot('navbar');
                        }}
                        onDragLeave={() => setDragTargetSlot(null)}
                        onDrop={(e) => handleDropLogo(e, 'navbar')}
                        className={`bg-white border rounded-xl p-3 shadow-2xs cursor-pointer transition-all ${
                          dragTargetSlot === 'navbar'
                            ? 'border-[#168A45] bg-[#EAF7EF] ring-2 ring-[#168A45]'
                            : isSelected
                            ? 'border-[#168A45] ring-2 ring-[#168A45]/40 bg-emerald-50/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="text-[10px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Compass className="w-3.5 h-3.5 text-[#168A45]" />
                            <span className="font-bold text-slate-700">Top-Left App Navigation Preview</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {formData.navbarLogo ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                Custom Logo
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                Uses Master
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerUploadForSlot('navbar');
                              }}
                              className="text-[9px] text-[#168A45] font-bold hover:underline ml-1"
                            >
                              Change
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          {activeNavbarLogo ? (
                            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
                              <img
                                src={activeNavbarLogo}
                                alt="App Navbar preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-[#168A45] flex items-center justify-center text-white font-extrabold text-lg shadow-sm shrink-0">
                              {formData.brandName ? formData.brandName.charAt(0) : 'M'}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              {formData.brandName || 'MYSAr'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {formData.companyName || 'Casbiro Solutions Private Limited'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. PDF & Document Header Preview */}
                  {(() => {
                    const activeDocumentLogo = formData.documentLogo || formData.companyLogo;
                    const isSelected = selectedLogoSlot === 'document';
                    return (
                      <div
                        onClick={() => setSelectedLogoSlot('document')}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragTargetSlot('document');
                        }}
                        onDragLeave={() => setDragTargetSlot(null)}
                        onDrop={(e) => handleDropLogo(e, 'document')}
                        className={`bg-[#168A45] text-white rounded-xl p-3 shadow-2xs cursor-pointer transition-all ${
                          dragTargetSlot === 'document'
                            ? 'ring-4 ring-emerald-300'
                            : isSelected
                            ? 'ring-2 ring-emerald-300 shadow-md'
                            : 'hover:opacity-95'
                        }`}
                      >
                        <div className="text-[10px] font-semibold text-white/80 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-white" />
                            <span className="font-bold text-white">Document & PDF Proposal Header Preview</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {formData.documentLogo ? (
                              <span className="text-[9px] bg-white text-[#168A45] px-1.5 py-0.5 rounded font-bold">
                                Custom Logo
                              </span>
                            ) : (
                              <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-medium">
                                Uses Master
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerUploadForSlot('document');
                              }}
                              className="text-[9px] text-white font-bold underline hover:text-emerald-100 ml-1"
                            >
                              Change
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          {activeDocumentLogo ? (
                            <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                              <img
                                src={activeDocumentLogo}
                                alt="Document Logo preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-white text-[#168A45] flex items-center justify-center font-black text-xl shadow-sm shrink-0">
                              {formData.brandName ? formData.brandName.charAt(0) : 'M'}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="text-xs font-black text-white tracking-wide truncate">
                              {formData.brandName || 'MYSAR'}
                            </div>
                            <div className="text-[10px] text-white/80 truncate">
                              {formData.companyName || 'Casbiro Solutions Private Limited'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3. Login Screen Emblem Badge Preview */}
                  {(() => {
                    const activeLoginLogo = formData.loginLogo || formData.companyLogo;
                    const isSelected = selectedLogoSlot === 'login';
                    return (
                      <div
                        onClick={() => setSelectedLogoSlot('login')}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragTargetSlot('login');
                        }}
                        onDragLeave={() => setDragTargetSlot(null)}
                        onDrop={(e) => handleDropLogo(e, 'login')}
                        className={`bg-white border rounded-xl p-3 shadow-2xs cursor-pointer transition-all ${
                          dragTargetSlot === 'login'
                            ? 'border-[#168A45] bg-[#EAF7EF] ring-2 ring-[#168A45]'
                            : isSelected
                            ? 'border-[#168A45] ring-2 ring-[#168A45]/40 bg-emerald-50/20'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <div className="text-[10px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <LogIn className="w-3.5 h-3.5 text-[#168A45]" />
                            <span className="font-bold text-slate-700">Login Screen Emblem Badge Preview</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {formData.loginLogo ? (
                              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                                Custom Logo
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded">
                                Uses Master
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                triggerUploadForSlot('login');
                              }}
                              className="text-[9px] text-[#168A45] font-bold hover:underline ml-1"
                            >
                              Change
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-white border-2 border-[#235E3F] p-1 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                            {activeLoginLogo ? (
                              <img
                                src={activeLoginLogo}
                                alt="Login emblem preview"
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <div className="text-center font-black text-[#235E3F] text-[10px] leading-tight">
                                mysar
                              </div>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-slate-800 truncate">
                              Central Login Brand Emblem
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              Circular emblem rendered on sign-in screen and mobile portal
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Parent Company Name
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Product Brand Name
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  GST / Tax ID Number
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Contact Phone
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Registered Office Address
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>
            </div>
          </div>

          {/* Proposal Numbering */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-gray-100">
              <FileSpreadsheet className="w-4 h-4 text-[#168A45]" />
              Proposal Numbering & Google Integration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Proposal Prefix Format
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={formData.proposalPrefix}
                  onChange={(e) => setFormData({ ...formData, proposalPrefix: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Next will be: {formData.proposalPrefix}{String(formData.proposalSequence).padStart(3, '0')}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Current Sequence Counter
                </label>
                <input
                  type="number"
                  disabled={!canManage}
                  value={formData.proposalSequence}
                  onChange={(e) => setFormData({ ...formData, proposalSequence: Number(e.target.value) })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-xs flex items-center space-x-2 transition-all active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 3: IMPORT LEADS FROM CSV */}
      {activeTab === 'import' && (
        <CsvLeadImporter
          users={users}
          currentUser={currentUser}
          existingLeads={leads}
          onBulkImport={(data) => {
            if (onBulkImportLeads) {
              return onBulkImportLeads(data);
            }
            return { successCount: 0, createdLeads: [], errors: ['No import handler configured'] };
          }}
          onNavigateToLeads={onNavigateToLeads}
        />
      )}

      {/* TAB 4: USERS & RBAC */}
      {activeTab === 'users' && (
        <TeamRbacManager
          users={users}
          currentUser={currentUser}
          onSaveUser={onSaveUser}
          onUpdateUser={onUpdateUser}
          onDeleteUser={onDeleteUser}
        />
      )}

      {/* TAB 4: INTEGRATIONS & AUTOMATION */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Bell className="w-4 h-4 text-[#168A45]" />
              Automated Gmail Follow-up Notification Engine
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              MYSAR sends automated HTML email reminders directly to assigned sales representatives via Google Apps Script (GAS) <code className="text-[#0B5D2A] font-bold">GmailApp.sendEmail()</code>. Reminders are dispatched for follow-ups due today, tomorrow, or overdue.
            </p>
            <div className="bg-[#F7FAF8] p-3.5 rounded-xl border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Trigger Frequency:</span>
                <span className="bg-[#EAF7EF] text-[#0B5D2A] font-bold px-2 py-0.5 rounded border border-[#D9E5DD]">
                  Daily 8:00 AM Time-Driven Trigger
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">GAS Dispatch Function:</span>
                <code className="text-[#0B5D2A] font-bold">sendDailyFollowUpReminders()</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">Recipient Scope:</span>
                <span className="text-slate-600">Assigned Sales Representative's Email</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-gray-100">
              <FileSpreadsheet className="w-4 h-4 text-[#168A45]" />
              Google Drive PDF Export & Webhook Integration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Google Drive Folder ID (For Proposal PDFs)
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  placeholder="Google Drive Folder ID"
                  value={formData.driveFolderId}
                  onChange={(e) => setFormData({ ...formData, driveFolderId: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Google Apps Script Web App Endpoint URL
                </label>
                <input
                  type="url"
                  disabled={!canManage}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={formData.gasWebAppUrl || ''}
                  onChange={(e) => setFormData({ ...formData, gasWebAppUrl: e.target.value })}
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
