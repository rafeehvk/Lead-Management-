import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle,
  Save,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Phone,
  HelpCircle,
  Check,
  AlertCircle,
  BookOpen,
  DollarSign,
  ClipboardList,
  Building,
} from 'lucide-react';
import {
  ProposalContentConfig,
  ProposalModuleItem,
  ProposalReportCategory,
  ProposalServiceItem,
  ProposalContactPerson,
  Settings,
  User,
} from '../types';
import { DEFAULT_PROPOSAL_CONTENT, getEffectiveProposalContent } from '../utils/defaultProposalContent';
import { hasPermission } from '../utils/rbac';

interface ProposalContentManagerProps {
  settings: Settings;
  currentUser: User;
  onSaveProposalContent: (newContent: ProposalContentConfig) => void;
}

export const ProposalContentManager: React.FC<ProposalContentManagerProps> = ({
  settings,
  currentUser,
  onSaveProposalContent,
}) => {
  const canManage = hasPermission.canManageSettings(currentUser);
  const [content, setContent] = useState<ProposalContentConfig>(() =>
    getEffectiveProposalContent(settings)
  );
  const [activeSection, setActiveSection] = useState<
    'modules' | 'reports' | 'services' | 'roadmap' | 'about' | 'contact' | 'pricing'
  >('modules');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [newFeatureText, setNewFeatureText] = useState<{ [moduleId: string]: string }>({});

  // Module addition state
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleCategory, setNewModuleCategory] = useState('Core Operations');
  const [newModuleFeatures, setNewModuleFeatures] = useState('');

  // Roadmap addition state
  const [newRoadmapItem, setNewRoadmapItem] = useState('');

  // Report Category addition
  const [isAddingReportCat, setIsAddingReportCat] = useState(false);
  const [newReportCatName, setNewReportCatName] = useState('');
  const [newReportItems, setNewReportItems] = useState('');

  const handleSave = () => {
    if (!canManage) {
      alert('Only administrators can update proposal content.');
      return;
    }
    onSaveProposalContent(content);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetToDefault = () => {
    if (!canManage) return;
    if (
      confirm(
        'Are you sure you want to reset all proposal document sections back to the official default MYSAR template?'
      )
    ) {
      setContent(DEFAULT_PROPOSAL_CONTENT);
      onSaveProposalContent(DEFAULT_PROPOSAL_CONTENT);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  // Move an upcoming roadmap module to Live Modules (e.g., Finance Management completed)
  const handlePromoteRoadmapToLive = (moduleName: string) => {
    // Check if already in live modules
    const existing = content.modules.find(
      (m) => m.name.toLowerCase() === moduleName.toLowerCase()
    );

    let updatedModules = [...content.modules];
    if (existing) {
      // make sure it's active
      updatedModules = updatedModules.map((m) =>
        m.id === existing.id ? { ...m, isLive: true } : m
      );
    } else {
      // Add as new live module
      const newMod: ProposalModuleItem = {
        id: `mod-${Date.now()}`,
        name: moduleName,
        category: 'Administration & Operations',
        features: [
          `${moduleName} setup & master configuration`,
          'Real-time automated tracking & reporting',
          'Role-based access & instant notifications',
        ],
        isLive: true,
      };
      updatedModules.push(newMod);
    }

    // Remove from upcoming roadmap
    const updatedRoadmap = content.upcomingModules.filter((m) => m !== moduleName);

    const updatedContent: ProposalContentConfig = {
      ...content,
      modules: updatedModules,
      upcomingModules: updatedRoadmap,
    };

    setContent(updatedContent);
    onSaveProposalContent(updatedContent);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Add new custom module
  const handleAddNewModule = () => {
    if (!newModuleName.trim()) return;
    const featuresList = newModuleFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    const newMod: ProposalModuleItem = {
      id: `mod-${Date.now()}`,
      name: newModuleName.trim(),
      category: newModuleCategory.trim() || 'General Operations',
      features: featuresList.length > 0 ? featuresList : ['Module configuration & tracking'],
      isLive: true,
    };

    // If it was in upcoming roadmap, remove it
    const updatedRoadmap = content.upcomingModules.filter(
      (item) => item.toLowerCase() !== newModuleName.trim().toLowerCase()
    );

    const updatedContent: ProposalContentConfig = {
      ...content,
      modules: [...content.modules, newMod],
      upcomingModules: updatedRoadmap,
    };

    setContent(updatedContent);
    setNewModuleName('');
    setNewModuleFeatures('');
    setIsAddingModule(false);
  };

  const handleToggleModuleLive = (modId: string) => {
    setContent((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === modId ? { ...m, isLive: !m.isLive } : m
      ),
    }));
  };

  const handleDeleteModule = (modId: string) => {
    const modToDelete = content.modules.find((m) => m.id === modId);
    if (!modToDelete) return;

    const moduleName = (modToDelete.name || '').trim();
    let updatedRoadmap = [...content.upcomingModules];

    if (moduleName) {
      const alreadyInRoadmap = content.upcomingModules.some(
        (item) => item.trim().toLowerCase() === moduleName.toLowerCase()
      );
      if (!alreadyInRoadmap) {
        updatedRoadmap = [...content.upcomingModules, moduleName];
      }
    }

    const updatedContent: ProposalContentConfig = {
      ...content,
      modules: content.modules.filter((m) => m.id !== modId),
      upcomingModules: updatedRoadmap,
    };

    setContent(updatedContent);
    setActionFeedback(
      moduleName
        ? `"${moduleName}" removed from Live Modules and added to Upcoming Roadmap.`
        : 'Module removed and added to Upcoming Roadmap.'
    );
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleAddFeatureToModule = (modId: string) => {
    const text = newFeatureText[modId]?.trim();
    if (!text) return;

    setContent((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === modId ? { ...m, features: [...m.features, text] } : m
      ),
    }));

    setNewFeatureText((prev) => ({ ...prev, [modId]: '' }));
  };

  const handleRemoveFeature = (modId: string, featureIndex: number) => {
    setContent((prev) => ({
      ...prev,
      modules: prev.modules.map((m) =>
        m.id === modId
          ? {
              ...m,
              features: m.features.filter((_, idx) => idx !== featureIndex),
            }
          : m
      ),
    }));
  };

  // Roadmap list handlers
  const handleAddRoadmapItem = () => {
    if (!newRoadmapItem.trim()) return;
    if (content.upcomingModules.includes(newRoadmapItem.trim())) return;

    setContent((prev) => ({
      ...prev,
      upcomingModules: [...prev.upcomingModules, newRoadmapItem.trim()],
    }));
    setNewRoadmapItem('');
  };

  const handleRemoveRoadmapItem = (index: number) => {
    setContent((prev) => ({
      ...prev,
      upcomingModules: prev.upcomingModules.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-[#0B5D2A] to-[#168A45] text-white rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                Proposal Content & Modules Master
              </h3>
            </div>
            <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
              Customize the text, live modules, reports, roadmap items, and contact information
              rendered across all generated commercial proposals and PDFs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Reset all sections to default template"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="bg-white text-[#0B5D2A] hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Proposal Content</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Quick completed module promotion highlight */}
        {content.upcomingModules.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-white/20 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-emerald-100">
              Completed a new module? Click to promote to Live Proposal:
            </span>
            {content.upcomingModules.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handlePromoteRoadmapToLive(item)}
                className="bg-white/20 hover:bg-white text-white hover:text-[#0B5D2A] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all"
                title={`Mark ${item} as completed and add to Section 3 Live Modules`}
              >
                <span>{item}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {savedSuccess && (
        <div className="bg-[#EAF7EF] border border-[#168A45] text-[#0B5D2A] text-xs font-bold px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xs animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-[#168A45]" />
          <span>Proposal content configuration saved successfully!</span>
        </div>
      )}

      {actionFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold px-4 py-3 rounded-xl flex items-center space-x-2 shadow-xs animate-fadeIn">
          <Sparkles className="w-4 h-4 text-[#168A45] shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Sub-tabs for content sections */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 pb-2">
        {[
          { id: 'modules', label: '3. Modules in MYSAR', icon: Layers, count: content.modules.filter(m => m.isLive).length },
          { id: 'roadmap', label: '8. Upcoming Roadmap', icon: Sparkles, count: content.upcomingModules.length },
          { id: 'reports', label: '4. Reports in MYSAR', icon: ClipboardList, count: content.reportCategories.length },
          { id: 'services', label: '5. Services & Support', icon: HelpCircle, count: content.services.length },
          { id: 'pricing', label: '6. Pricing Notes', icon: DollarSign },
          { id: 'about', label: '1 & 2. About Company & Product', icon: BookOpen },
          { id: 'contact', label: '7. Contact Info', icon: Phone },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
                isActive
                  ? 'bg-[#168A45] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-gray-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* SECTION 1: MODULES (PAGE 5, 6, 7) */}
      {activeSection === 'modules' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#168A45]" />
                  Section 3: Core Modules in MYSAR
                </h4>
                <p className="text-xs text-slate-500">
                  These modules are rendered in Pages 5, 6, and 7 of the generated proposal document.
                </p>
              </div>

              {canManage && !isAddingModule && (
                <button
                  type="button"
                  onClick={() => setIsAddingModule(true)}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Module</span>
                </button>
              )}
            </div>

            {/* Intro Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Section Introduction Text
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={content.modulesIntroText}
                onChange={(e) =>
                  setContent({ ...content, modulesIntroText: e.target.value })
                }
                className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
              />
            </div>

            {/* ADD NEW MODULE FORM */}
            {isAddingModule && (
              <div className="bg-[#EAF7EF] border-2 border-[#168A45] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-black text-[#0B5D2A] uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4" /> Add New Module to Proposal
                  </h5>
                  <button
                    type="button"
                    onClick={() => setIsAddingModule(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Module Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Finance Management"
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:border-[#168A45]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Administration & Finance"
                      value={newModuleCategory}
                      onChange={(e) => setNewModuleCategory(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:border-[#168A45]"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block font-bold text-slate-700 mb-1">
                    Key Features / Bullet Points (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Fee structure setup&#10;Payment tracking and reminders&#10;Collection and pending reports"
                    value={newModuleFeatures}
                    onChange={(e) => setNewModuleFeatures(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-slate-800 focus:border-[#168A45]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingModule(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewModule}
                    disabled={!newModuleName.trim()}
                    className="bg-[#168A45] hover:bg-[#0B5D2A] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Module</span>
                  </button>
                </div>
              </div>
            )}

            {/* LIST OF MODULES */}
            <div className="space-y-3 pt-2">
              {content.modules.map((mod, idx) => (
                <div
                  key={mod.id}
                  className={`border rounded-xl p-4 transition-all ${
                    mod.isLive
                      ? 'bg-white border-gray-200 shadow-2xs'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#EAF7EF] text-[#0B5D2A] font-black text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        disabled={!canManage}
                        value={mod.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContent((prev) => ({
                            ...prev,
                            modules: prev.modules.map((m) =>
                              m.id === mod.id ? { ...m, name: val } : m
                            ),
                          }));
                        }}
                        className="font-bold text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#168A45] px-1 py-0.5 focus:bg-white rounded"
                      />
                      {mod.category && (
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {mod.category}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleModuleLive(mod.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-colors ${
                          mod.isLive
                            ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#168A45]/30'
                            : 'bg-gray-200 text-slate-600'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{mod.isLive ? 'Live in Proposal' : 'Hidden'}</span>
                      </button>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteModule(mod.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete module and move to Upcoming Roadmap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Feature bullet points */}
                  <div className="mt-3 pl-8 space-y-1.5 text-xs">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Features / Bullet Points:
                    </div>
                    {mod.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2 group">
                        <span className="text-[#168A45] font-black">•</span>
                        <input
                          type="text"
                          disabled={!canManage}
                          value={feat}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContent((prev) => ({
                              ...prev,
                              modules: prev.modules.map((m) =>
                                m.id === mod.id
                                  ? {
                                      ...m,
                                      features: m.features.map((f, i) =>
                                        i === fIdx ? val : f
                                      ),
                                    }
                                  : m
                              ),
                            }));
                          }}
                          className="flex-1 bg-transparent hover:bg-[#F7FAF8] focus:bg-white border-b border-transparent hover:border-gray-200 focus:border-[#168A45] px-1 py-0.5 text-slate-700 rounded text-xs"
                        />
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFeature(mod.id, fIdx)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-0.5"
                            title="Remove feature"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Quick add feature line */}
                    {canManage && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[#168A45] font-black text-xs">+</span>
                        <input
                          type="text"
                          placeholder="Add new feature bullet..."
                          value={newFeatureText[mod.id] || ''}
                          onChange={(e) =>
                            setNewFeatureText({
                              ...newFeatureText,
                              [mod.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddFeatureToModule(mod.id);
                            }
                          }}
                          className="flex-1 bg-[#F7FAF8] border border-gray-200 rounded px-2 py-1 text-xs text-slate-800 focus:bg-white focus:border-[#168A45]"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddFeatureToModule(mod.id)}
                          className="bg-slate-100 hover:bg-[#EAF7EF] text-slate-700 hover:text-[#0B5D2A] px-2.5 py-1 rounded text-xs font-bold border border-gray-200"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: ROADMAP (PAGE 14) */}
      {activeSection === 'roadmap' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#168A45]" />
                Section 8: Upcoming Modules & Roadmap
              </h4>
              <p className="text-xs text-slate-500">
                These modules appear on the final Conclusion page (Page 14) as planned future features.
                When you complete any module, you can easily promote it to Live Modules with a single click.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Upcoming Modules Section Intro
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={content.upcomingModulesIntro}
                onChange={(e) =>
                  setContent({ ...content, upcomingModulesIntro: e.target.value })
                }
                className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
              />
            </div>

            {/* Quick add roadmap item */}
            {canManage && (
              <div className="flex items-center gap-2 bg-[#F7FAF8] p-3 rounded-xl border border-gray-200">
                <input
                  type="text"
                  placeholder="e.g. Finance Management, Smart Canteen..."
                  value={newRoadmapItem}
                  onChange={(e) => setNewRoadmapItem(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRoadmapItem();
                    }
                  }}
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-[#168A45]"
                />
                <button
                  type="button"
                  onClick={handleAddRoadmapItem}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Roadmap</span>
                </button>
              </div>
            )}

            {/* Grid of roadmap items */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {content.upcomingModules.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-between shadow-2xs hover:border-[#168A45] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#168A45]" />
                    <span className="font-bold text-xs text-slate-800">{item}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handlePromoteRoadmapToLive(item)}
                      className="bg-[#EAF7EF] hover:bg-[#168A45] text-[#0B5D2A] hover:text-white px-2 py-1 rounded text-[11px] font-black transition-colors"
                      title="Promote to Section 3 Live Modules"
                    >
                      Promote to Live
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRoadmapItem(idx)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Student App note & CTA */}
            <div className="space-y-3 pt-4 border-t border-gray-100 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Student Dedicated Application Note
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={content.studentAppNote}
                  onChange={(e) =>
                    setContent({ ...content, studentAppNote: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Final Call To Action Quote
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={content.finalCallToAction}
                  onChange={(e) =>
                    setContent({ ...content, finalCallToAction: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Use {'{{INSTITUTE_NAME}}'} for dynamic institution replacement.
                </span>
              </div>

              {/* Dedicated Signatories & Acceptance Section Settings */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <div>
                  <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[#168A45] flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Acceptance & Signatories Section (Page 15 Dedicated Sign-off Page)
                  </h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Customize labels and designations rendered on the final PDF proposal signature block.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Section Title
                    </label>
                    <input
                      type="text"
                      disabled={!canManage}
                      value={content.signatoryTitle || 'Proposal Acceptance & Signatories'}
                      onChange={(e) =>
                        setContent({ ...content, signatoryTitle: e.target.value })
                      }
                      className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Client Signature Box Label
                    </label>
                    <input
                      type="text"
                      disabled={!canManage}
                      value={content.clientSignatoryLabel || 'Client Signature'}
                      onChange={(e) =>
                        setContent({ ...content, clientSignatoryLabel: e.target.value })
                      }
                      className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Signatory Agreement / Declaration Statement
                    </label>
                    <textarea
                      rows={5}
                      disabled={!canManage}
                      value={
                        content.signatoryAgreementText !== undefined
                          ? content.signatoryAgreementText
                          : DEFAULT_PROPOSAL_CONTENT.signatoryAgreementText
                      }
                      onChange={(e) =>
                        setContent({ ...content, signatoryAgreementText: e.target.value })
                      }
                      className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 text-xs"
                      placeholder="Enter acceptance & declaration text..."
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Client Default Signatory Designation
                    </label>
                    <input
                      type="text"
                      disabled={!canManage}
                      value={content.clientSignatoryDesignation || 'Principal / Chairman / Trustee'}
                      onChange={(e) =>
                        setContent({ ...content, clientSignatoryDesignation: e.target.value })
                      }
                      className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Company Signatory Designation
                    </label>
                    <input
                      type="text"
                      disabled={!canManage}
                      value={content.companySignatoryDesignation || 'Director & Authorized Signatory'}
                      onChange={(e) =>
                        setContent({ ...content, companySignatoryDesignation: e.target.value })
                      }
                      className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: REPORTS (PAGE 8 & 9) */}
      {activeSection === 'reports' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#168A45]" />
                Section 4: Reports in MYSAR
              </h4>
              <p className="text-xs text-slate-500">
                Configured categories and reports rendered in Pages 8 and 9 of the proposal.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reports Intro Text
              </label>
              <textarea
                rows={2}
                disabled={!canManage}
                value={content.reportsIntroText}
                onChange={(e) =>
                  setContent({ ...content, reportsIntroText: e.target.value })
                }
                className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div className="space-y-4 pt-2">
              {content.reportCategories.map((cat, catIdx) => (
                <div key={cat.id} className="border border-gray-200 rounded-xl p-4 bg-[#F7FAF8] space-y-3">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      disabled={!canManage}
                      value={cat.categoryName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => ({
                          ...prev,
                          reportCategories: prev.reportCategories.map((c) =>
                            c.id === cat.id ? { ...c, categoryName: val } : c
                          ),
                        }));
                      }}
                      className="font-black text-slate-900 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg px-3 py-1.5 max-w-sm"
                    />

                    {canManage && (
                      <button
                        type="button"
                        onClick={() => {
                          setContent((prev) => ({
                            ...prev,
                            reportCategories: prev.reportCategories.filter(
                              (c) => c.id !== cat.id
                            ),
                          }));
                        }}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Reports list */}
                  <div className="space-y-1.5 pl-2 text-xs">
                    {cat.reports.map((rep, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-2 group">
                        <span className="text-[#168A45] font-black">•</span>
                        <input
                          type="text"
                          disabled={!canManage}
                          value={rep}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContent((prev) => ({
                              ...prev,
                              reportCategories: prev.reportCategories.map((c) =>
                                c.id === cat.id
                                  ? {
                                      ...c,
                                      reports: c.reports.map((r, i) =>
                                        i === rIdx ? val : r
                                      ),
                                    }
                                  : c
                              ),
                            }));
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded px-2.5 py-1 text-slate-700"
                        />
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => {
                              setContent((prev) => ({
                                ...prev,
                                reportCategories: prev.reportCategories.map((c) =>
                                  c.id === cat.id
                                    ? {
                                        ...c,
                                        reports: c.reports.filter((_, i) => i !== rIdx),
                                      }
                                    : c
                                ),
                              }));
                            }}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Add report item */}
                    {canManage && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[#168A45] font-black text-xs">+</span>
                        <input
                          type="text"
                          placeholder="Add new report title..."
                          id={`new-report-${cat.id}`}
                          className="flex-1 bg-white border border-gray-200 rounded px-2 py-1 text-xs text-slate-800"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const text = input.value.trim();
                              if (!text) return;
                              setContent((prev) => ({
                                ...prev,
                                reportCategories: prev.reportCategories.map((c) =>
                                  c.id === cat.id
                                    ? { ...c, reports: [...c.reports, text] }
                                    : c
                                ),
                              }));
                              input.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(
                              `new-report-${cat.id}`
                            ) as HTMLInputElement;
                            if (!input || !input.value.trim()) return;
                            const text = input.value.trim();
                            setContent((prev) => ({
                              ...prev,
                              reportCategories: prev.reportCategories.map((c) =>
                                c.id === cat.id
                                  ? { ...c, reports: [...c.reports, text] }
                                  : c
                              ),
                            }));
                            input.value = '';
                          }}
                          className="bg-slate-200 hover:bg-[#EAF7EF] text-slate-800 hover:text-[#0B5D2A] px-2.5 py-1 rounded text-xs font-bold"
                        >
                          Add Report
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: SERVICES & SUPPORT (PAGE 10 & 11) */}
      {activeSection === 'services' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#168A45]" />
                Section 5: Services from Team MYSAR
              </h4>
              <p className="text-xs text-slate-500">
                End-to-end implementation, training, onboarding, and advisory support points.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Services Intro Text
              </label>
              <textarea
                rows={2}
                disabled={!canManage}
                value={content.servicesIntroText}
                onChange={(e) =>
                  setContent({ ...content, servicesIntroText: e.target.value })
                }
                className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div className="space-y-4 pt-2">
              {content.services.map((srv, idx) => (
                <div key={srv.id} className="border border-gray-200 rounded-xl p-4 bg-[#F7FAF8] space-y-2">
                  <input
                    type="text"
                    disabled={!canManage}
                    value={srv.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContent((prev) => ({
                        ...prev,
                        services: prev.services.map((s) =>
                          s.id === srv.id ? { ...s, title: val } : s
                        ),
                      }));
                    }}
                    className="font-bold text-slate-900 text-xs sm:text-sm bg-white border border-gray-200 rounded px-2.5 py-1 w-full max-w-md"
                  />

                  <div className="space-y-1 pl-4 text-xs">
                    {srv.points.map((p, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="text-[#168A45] font-black">•</span>
                        <input
                          type="text"
                          disabled={!canManage}
                          value={p}
                          onChange={(e) => {
                            const val = e.target.value;
                            setContent((prev) => ({
                              ...prev,
                              services: prev.services.map((s) =>
                                s.id === srv.id
                                  ? {
                                      ...s,
                                      points: s.points.map((pt, i) =>
                                        i === pIdx ? val : pt
                                      ),
                                    }
                                  : s
                              ),
                            }));
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded px-2 py-0.5 text-slate-700"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: PRICING NOTES (PAGE 12) */}
      {activeSection === 'pricing' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#168A45]" />
                Section 6: Pricing Notes & Descriptions
              </h4>
              <p className="text-xs text-slate-500">
                Text and standard rates rendered on Page 12 alongside the proposal specific pricing breakdown.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pricing Intro Text
              </label>
              <input
                type="text"
                disabled={!canManage}
                value={content.pricingIntroText}
                onChange={(e) =>
                  setContent({ ...content, pricingIntroText: e.target.value })
                }
                className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Parent Payment Standard Rate Note
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={content.pricingNotes.parentPaymentNote}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pricingNotes: {
                        ...content.pricingNotes,
                        parentPaymentNote: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  School Payment Standard Rate Note
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={content.pricingNotes.schoolPaymentNote}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pricingNotes: {
                        ...content.pricingNotes,
                        schoolPaymentNote: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Introductory Trial Offer Note
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={content.pricingNotes.trialOfferNote}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      pricingNotes: {
                        ...content.pricingNotes,
                        trialOfferNote: e.target.value,
                      },
                    })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: ABOUT COMPANY & PRODUCT (PAGES 3 & 4) */}
      {activeSection === 'about' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#168A45]" />
                Section 1: About Company (Page 3)
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Company Paragraph 1
                </label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={content.aboutCompanyText1}
                  onChange={(e) =>
                    setContent({ ...content, aboutCompanyText1: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Company Paragraph 2
                </label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={content.aboutCompanyText2}
                  onChange={(e) =>
                    setContent({ ...content, aboutCompanyText2: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Company Objectives ("We aim to:")
                </label>
                {content.companyObjectives.map((obj, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[#168A45] font-black">•</span>
                    <input
                      type="text"
                      disabled={!canManage}
                      value={obj}
                      onChange={(e) => {
                        const val = e.target.value;
                        setContent((prev) => ({
                          ...prev,
                          companyObjectives: prev.companyObjectives.map((o, i) =>
                            i === idx ? val : o
                          ),
                        }));
                      }}
                      className="flex-1 bg-[#F7FAF8] border border-gray-200 rounded px-2.5 py-1 text-slate-800"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Scale Note
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={content.companyScaleNote}
                  onChange={(e) =>
                    setContent({ ...content, companyScaleNote: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-[#168A45]" />
                Section 2: About Product / Platform (Page 4)
              </h4>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Description
                  </label>
                  <textarea
                    rows={2}
                    disabled={!canManage}
                    value={content.aboutProductText}
                    onChange={(e) =>
                      setContent({ ...content, aboutProductText: e.target.value })
                    }
                    className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Highlights ("It provides:")
                  </label>
                  {content.productHighlights.map((hl, idx) => (
                    <div key={idx} className="flex items-center gap-2 mb-1.5">
                      <span className="text-[#168A45] font-black">•</span>
                      <input
                        type="text"
                        disabled={!canManage}
                        value={hl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContent((prev) => ({
                            ...prev,
                            productHighlights: prev.productHighlights.map((h, i) =>
                              i === idx ? val : h
                            ),
                          }));
                        }}
                        className="flex-1 bg-[#F7FAF8] border border-gray-200 rounded px-2.5 py-1 text-slate-800"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Summary Highlight Box
                  </label>
                  <input
                    type="text"
                    disabled={!canManage}
                    value={content.productSummaryQuote}
                    onChange={(e) =>
                      setContent({ ...content, productSummaryQuote: e.target.value })
                    }
                    className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 7: CONTACT INFO (PAGE 13) */}
      {activeSection === 'contact' && (
        <div className="space-y-5">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#168A45]" />
                Section 7: Contact Information (Page 13)
              </h4>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contact Section Intro Text
                </label>
                <input
                  type="text"
                  disabled={!canManage}
                  value={content.contactIntroText}
                  onChange={(e) =>
                    setContent({ ...content, contactIntroText: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              {/* Office Address Lines */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official Office Address Lines
                </label>
                {content.officeAddressLines.map((line, idx) => (
                  <input
                    key={idx}
                    type="text"
                    disabled={!canManage}
                    value={line}
                    onChange={(e) => {
                      const val = e.target.value;
                      setContent((prev) => ({
                        ...prev,
                        officeAddressLines: prev.officeAddressLines.map((l, i) =>
                          i === idx ? val : l
                        ),
                      }));
                    }}
                    className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800 mb-1.5"
                  />
                ))}
              </div>

              {/* Contact Persons */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Key Contact Persons
                </label>
                <div className="space-y-2">
                  {content.contactPersons.map((p, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#F7FAF8] p-2.5 rounded-lg border border-gray-200"
                    >
                      <input
                        type="text"
                        disabled={!canManage}
                        placeholder="Name"
                        value={p.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContent((prev) => ({
                            ...prev,
                            contactPersons: prev.contactPersons.map((cp, i) =>
                              i === idx ? { ...cp, name: val } : cp
                            ),
                          }));
                        }}
                        className="bg-white border border-gray-200 rounded px-2.5 py-1 text-slate-800 font-bold"
                      />
                      <input
                        type="text"
                        disabled={!canManage}
                        placeholder="Designation"
                        value={p.designation}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContent((prev) => ({
                            ...prev,
                            contactPersons: prev.contactPersons.map((cp, i) =>
                              i === idx ? { ...cp, designation: val } : cp
                            ),
                          }));
                        }}
                        className="bg-white border border-gray-200 rounded px-2.5 py-1 text-slate-800"
                      />
                      <input
                        type="text"
                        disabled={!canManage}
                        placeholder="Phone"
                        value={p.phone}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContent((prev) => ({
                            ...prev,
                            contactPersons: prev.contactPersons.map((cp, i) =>
                              i === idx ? { ...cp, phone: val } : cp
                            ),
                          }));
                        }}
                        className="bg-white border border-gray-200 rounded px-2.5 py-1 text-slate-800"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  disabled={!canManage}
                  value={content.contactEmail}
                  onChange={(e) =>
                    setContent({ ...content, contactEmail: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Closing Note
                </label>
                <textarea
                  rows={2}
                  disabled={!canManage}
                  value={content.closingNote}
                  onChange={(e) =>
                    setContent({ ...content, closingNote: e.target.value })
                  }
                  className="w-full bg-[#F7FAF8] disabled:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Save Bar */}
      {canManage && (
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleSave}
            className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs flex items-center space-x-2 transition-all active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save All Proposal Content</span>
          </button>
        </div>
      )}
    </div>
  );
};
