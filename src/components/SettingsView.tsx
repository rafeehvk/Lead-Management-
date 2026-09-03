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
} from 'lucide-react';
import { Settings, User, UserRole, ProposalContentConfig, Lead } from '../types';
import { hasPermission } from '../utils/rbac';
import { PricingMasterManager } from './PricingMasterManager';
import { TeamRbacManager } from './TeamRbacManager';
import { ProposalContentManager } from './ProposalContentManager';
import { CsvLeadImporter } from './CsvLeadImporter';

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
  const [formData, setFormData] = useState<Settings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canManage = hasPermission.canManageSettings(currentUser);

  const handleLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size must be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setFormData((prev) => ({
          ...prev,
          companyLogo: e.target?.result as string,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDropLogo = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    if (!canManage) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleLogoFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      companyLogo: undefined,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      alert('Only administrators can update core company settings.');
      return;
    }
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

            {/* COMPANY LOGO UPLOAD & PREVIEW */}
            <div className="bg-[#F7FAF8] border border-[#D9E5DD] rounded-xl p-4.5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#168A45]" />
                    Company & Brand Logo
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Upload your official company logo. It will automatically be rendered in the top-left app bar, generated commercial PDF proposals, and printable documents.
                  </p>
                </div>
                {formData.companyLogo && canManage && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="self-start sm:self-auto text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Logo</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Upload / Drop Box */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (canManage) setIsDraggingLogo(true);
                  }}
                  onDragLeave={() => setIsDraggingLogo(false)}
                  onDrop={handleDropLogo}
                  onClick={() => {
                    if (canManage && fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className={`md:col-span-6 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[120px] ${
                    isDraggingLogo
                      ? 'border-[#168A45] bg-[#EAF7EF]'
                      : 'border-gray-300 hover:border-[#168A45] bg-white hover:bg-[#F7FAF8]'
                  } ${!canManage ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    className="hidden"
                    disabled={!canManage}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-10 h-10 rounded-full bg-[#EAF7EF] text-[#168A45] flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {formData.companyLogo ? 'Click or drag to replace logo' : 'Upload Company Logo'}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    PNG, SVG, JPG, or WebP (transparent background recommended, max 3MB)
                  </p>
                </div>

                {/* Live Previews Container */}
                <div className="md:col-span-6 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Live Display Previews
                  </div>

                  {/* 1. App Top-Left Navbar Preview */}
                  <div className="bg-white border border-gray-200 rounded-xl p-2.5 shadow-2xs">
                    <div className="text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Top-Left App Navigation Preview</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">App Bar</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      {formData.companyLogo ? (
                        <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 p-1 flex items-center justify-center overflow-hidden shadow-2xs shrink-0">
                          <img
                            src={formData.companyLogo}
                            alt="Logo preview"
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
                          {formData.brandName ? (formData.brandName.includes('ERP') ? formData.brandName : `${formData.brandName} ERP`) : 'MYSAR ERP'}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {formData.companyName || 'Casbiro Solutions Private Limited'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. PDF & Document Header Preview */}
                  <div className="bg-[#168A45] text-white rounded-xl p-2.5 shadow-2xs">
                    <div className="text-[10px] font-semibold text-white/70 mb-1.5 flex items-center justify-between">
                      <span>Document & PDF Proposal Header Preview</span>
                      <span className="text-[9px] bg-white/20 text-white px-1.5 py-0.5 rounded font-bold">PDF / Print</span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                      {formData.companyLogo ? (
                        <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                          <img
                            src={formData.companyLogo}
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
