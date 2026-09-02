import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  Search,
  IndianRupee,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Check,
  Shield,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { PricingPlan, User } from '../types';
import { storage } from '../services/storageService';
import { formatINR } from '../utils/pdfGenerator';
import { hasPermission } from '../utils/rbac';

interface PricingMasterManagerProps {
  currentUser: User;
  onPlansUpdated?: (plans: PricingPlan[]) => void;
  isModalMode?: boolean;
  onCloseModal?: () => void;
}

export const PricingMasterManager: React.FC<PricingMasterManagerProps> = ({
  currentUser,
  onPlansUpdated,
  isModalMode = false,
  onCloseModal,
}) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Add / Edit Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDefaultPrice, setFormDefaultPrice] = useState<number>(75);
  const [formBillingCycle, setFormBillingCycle] = useState('Per Student / Year');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPreset, setFormIsPreset] = useState(false);
  const [formMinStudents, setFormMinStudents] = useState<number>(100);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const canManage = hasPermission.canManageSettings(currentUser);

  const loadPlans = () => {
    const loaded = storage.getPricingPlans();
    setPlans(loaded);
    if (onPlansUpdated) {
      onPlansUpdated(loaded);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleOpenAdd = () => {
    if (!canManage) {
      alert('Only administrators or managers can add or modify Master pricing plans.');
      return;
    }
    setEditingPlan(null);
    setFormName('');
    setFormCode(`PLAN-${String(plans.length + 1).padStart(2, '0')}`);
    setFormDefaultPrice(75);
    setFormBillingCycle('Per Student / Year');
    setFormDescription('');
    setFormFeatures([
      'Full Academic ERP Modules',
      'Student & Staff Attendance',
      'Parent Mobile App Access',
    ]);
    setNewFeatureInput('');
    setFormIsActive(true);
    setFormIsPreset(false);
    setFormMinStudents(100);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (plan: PricingPlan) => {
    if (!canManage) {
      alert('Only administrators or managers can add or modify Master pricing plans.');
      return;
    }
    setEditingPlan(plan);
    setFormName(plan.name);
    setFormCode(plan.code || '');
    setFormDefaultPrice(plan.defaultPrice);
    setFormBillingCycle(plan.billingCycle || 'Per Student / Year');
    setFormDescription(plan.description || '');
    setFormFeatures(plan.features && plan.features.length > 0 ? [...plan.features] : []);
    setNewFeatureInput('');
    setFormIsActive(plan.isActive);
    setFormIsPreset(plan.isPreset || false);
    setFormMinStudents(plan.minStudents || 100);
    setIsEditorOpen(true);
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFormFeatures([...formFeatures, newFeatureInput.trim()]);
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (index: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== index));
  };

  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please provide a Plan Name.');
      return;
    }

    if (editingPlan) {
      // Update existing
      const updated: PricingPlan = {
        ...editingPlan,
        name: formName.trim(),
        code: formCode.trim().toUpperCase() || editingPlan.code,
        defaultPrice: Math.max(0, Number(formDefaultPrice)),
        billingCycle: formBillingCycle,
        description: formDescription.trim(),
        features: formFeatures,
        isActive: formIsActive,
        isPreset: formIsPreset,
        minStudents: Math.max(1, Number(formMinStudents)),
      };
      storage.updatePricingPlan(updated);
      showNotification(`Updated plan "${updated.name}" successfully!`);
    } else {
      // Add new
      const created = storage.addPricingPlan({
        name: formName.trim(),
        code: formCode.trim().toUpperCase(),
        defaultPrice: Math.max(0, Number(formDefaultPrice)),
        billingCycle: formBillingCycle,
        description: formDescription.trim(),
        features: formFeatures,
        isActive: formIsActive,
        isPreset: formIsPreset,
        minStudents: Math.max(1, Number(formMinStudents)),
      });
      showNotification(`Created new pricing plan "${created.name}" successfully!`);
    }

    setIsEditorOpen(false);
    loadPlans();
  };

  const handleToggleStatus = (id: string, currentName: string) => {
    if (!canManage) {
      alert('Only administrators or managers can toggle plan status.');
      return;
    }
    const updated = storage.togglePricingPlanStatus(id);
    if (updated) {
      showNotification(`"${currentName}" is now ${updated.isActive ? 'Active' : 'Inactive'}.`);
      loadPlans();
    }
  };

  const handleDeletePlan = (id: string, name: string) => {
    if (!canManage) {
      alert('Only administrators or managers can delete pricing plans.');
      return;
    }
    if (confirm(`Are you sure you want to remove "${name}" from the Pricing Master?`)) {
      storage.deletePricingPlan(id);
      showNotification(`Deleted plan "${name}" from master.`);
      loadPlans();
    }
  };

  const handleResetToDefaults = () => {
    if (!canManage) {
      alert('Only administrators can reset master data.');
      return;
    }
    if (confirm('Reset Pricing Master back to standard MYSAR 5 default pricing packages?')) {
      storage.resetPricingPlans();
      showNotification('Reset master plans back to standard MYSAR defaults.');
      loadPlans();
    }
  };

  const filteredPlans = plans.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === 'Active') return matchesSearch && p.isActive;
    if (statusFilter === 'Inactive') return matchesSearch && !p.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-[#EAF7EF] border-[#168A45] text-[#0B5D2A]'
              : 'bg-red-50 border-red-300 text-red-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#168A45]" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Header & Controls Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  Pricing Types & Commercial Plans Master
                </h3>
                <span className="text-[10px] bg-[#EAF7EF] text-[#0B5D2A] px-2 py-0.5 rounded-full font-bold border border-[#D9E5DD]">
                  {plans.filter((p) => p.isActive).length} Active Plans
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Define standard rates per student, billing cycles, package inclusions, and presets for proposal generators
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="bg-white hover:bg-gray-50 text-slate-600 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                  title="Reset to default 5 plans"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Pricing Plan</span>
                </button>
              </>
            )}

            {isModalMode && onCloseModal && (
              <button
                type="button"
                onClick={onCloseModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by plan name, code, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F7FAF8] border border-gray-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#168A45]"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-medium">Filter:</span>
            {(['All', 'Active', 'Inactive'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                  statusFilter === filter
                    ? 'bg-[#168A45] text-white shadow-2xs'
                    : 'bg-[#F7FAF8] text-slate-600 hover:bg-slate-200 border border-gray-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Master Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3.5 w-16">Plan Code</th>
                <th className="py-3 px-3.5 min-w-[200px]">Pricing Plan & Name</th>
                <th className="py-3 px-3.5 min-w-[130px]">Default Rate / Std</th>
                <th className="py-3 px-3.5 min-w-[140px]">Billing Cycle</th>
                <th className="py-3 px-3.5 min-w-[240px]">Deliverables & Features</th>
                <th className="py-3 px-3.5 text-center w-24">Preset Tier</th>
                <th className="py-3 px-3.5 text-center w-24">Status</th>
                {canManage && <th className="py-3 px-3.5 text-center w-24">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-slate-700">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                    No pricing plans found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-[#F7FAF8] transition-colors ${
                      !p.isActive ? 'opacity-60 bg-gray-50/50' : ''
                    }`}
                  >
                    {/* Code */}
                    <td className="py-3.5 px-3.5">
                      <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-gray-200">
                        {p.code || p.id}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {p.description}
                      </div>
                    </td>

                    {/* Default Rate */}
                    <td className="py-3.5 px-3.5">
                      <div className="font-extrabold text-[#0B5D2A] text-sm">
                        ₹{p.defaultPrice}
                        <span className="text-[10px] text-slate-500 font-normal ml-1">/ student</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Min. {p.minStudents || 100} students
                      </div>
                    </td>

                    {/* Billing Cycle */}
                    <td className="py-3.5 px-3.5">
                      <span className="bg-[#EAF7EF] text-[#0B5D2A] font-semibold text-[11px] px-2 py-0.5 rounded border border-[#D9E5DD]">
                        {p.billingCycle || 'Per Student / Year'}
                      </span>
                    </td>

                    {/* Features Chips */}
                    <td className="py-3.5 px-3.5">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {p.features && p.features.length > 0 ? (
                          p.features.slice(0, 3).map((f, i) => (
                            <span
                              key={i}
                              className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200"
                            >
                              • {f}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Standard modules</span>
                        )}
                        {p.features && p.features.length > 3 && (
                          <span className="text-[10px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-gray-200">
                            +{p.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Is Preset */}
                    <td className="py-3.5 px-3.5 text-center">
                      {p.isPreset ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#0B5D2A] bg-[#EAF7EF] px-2 py-0.5 rounded-full border border-[#D9E5DD]">
                          <Sparkles className="w-2.5 h-2.5 text-[#168A45]" />
                          Preset
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-3.5 text-center">
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p.id, p.name)}
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full transition-colors border ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </button>
                      ) : (
                        <span
                          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            p.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 text-slate-400 hover:text-[#168A45] hover:bg-[#EAF7EF] rounded transition-colors"
                            title="Edit plan details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeletePlan(p.id, p.name)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete plan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Add / Edit Modal */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#168A45] text-white flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editingPlan ? `Edit Pricing Plan: ${editingPlan.name}` : 'Create New Pricing Plan Master'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Configure commercial parameters for proposal generator and quotes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSavePlan} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Plan Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise School Cloud Plus"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>

                {/* Plan Code */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Plan Code / Short Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SCH-ENT"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>

                {/* Default Rate per Student */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Default Rate / Student (₹) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#168A45]">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formDefaultPrice || ''}
                      onChange={(e) => setFormDefaultPrice(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 bg-[#F7FAF8] border border-gray-200 rounded-lg text-slate-800 font-bold focus:outline-none focus:bg-white focus:border-[#168A45]"
                    />
                  </div>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={formBillingCycle}
                    onChange={(e) => setFormBillingCycle(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                  >
                    <option value="Per Student / Year">Per Student / Year</option>
                    <option value="Per Student / Term">Per Student / Term</option>
                    <option value="Per Student / Month">Per Student / Month</option>
                    <option value="One-Time License">One-Time License</option>
                  </select>
                </div>

                {/* Min Students */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Minimum Student Quota
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMinStudents || ''}
                    onChange={(e) => setFormMinStudents(Number(e.target.value))}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Package Description / Commercial Scope
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of the package scope and deliverables..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>

                {/* Features & Deliverables List Builder */}
                <div className="sm:col-span-2 space-y-2">
                  <label className="block font-bold text-slate-700">
                    Included Module Deliverables & Features
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="e.g. Smart RFID Cards + Attendance Sync"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                      className="flex-1 bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeature}
                      className="bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD] px-3 py-1.5 rounded-lg font-bold hover:bg-[#168A45] hover:text-white transition-colors"
                    >
                      Add Feature
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1 max-h-28 overflow-y-auto">
                    {formFeatures.map((f, i) => (
                      <span
                        key={i}
                        className="bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 flex items-center space-x-1.5"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeature(i)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Toggles: Active Status and Preset */}
                <div className="sm:col-span-2 flex flex-wrap items-center justify-between pt-2 border-t border-gray-100 gap-3">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-[#168A45] rounded focus:ring-[#168A45]"
                    />
                    <span className="font-bold text-slate-700">Plan is Active & Available in Proposals</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsPreset}
                      onChange={(e) => setFormIsPreset(e.target.checked)}
                      className="w-4 h-4 text-[#168A45] rounded focus:ring-[#168A45]"
                    />
                    <span className="font-bold text-[#0B5D2A]">Include in 3-Tier Quick Preset</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-98"
                >
                  {editingPlan ? 'Update Plan' : 'Create Pricing Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
