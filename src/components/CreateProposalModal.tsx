import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Building2,
  Users,
  IndianRupee,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  Search,
  User as UserIcon,
  Phone,
  Mail,
} from 'lucide-react';
import { Lead, PricingPlan, PricingType, ProposalPricingItem, Settings, User } from '../types';
import { formatINR } from '../utils/pdfGenerator';
import { storage } from '../services/storageService';
import { PricingMasterManager } from './PricingMasterManager';

interface CreateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  leads?: Lead[];
  settings: Settings;
  currentUser?: User;
  onGenerateProposal: (proposalData: {
    leadId: string;
    instituteName: string;
    contactPerson: string;
    studentCount: number;
    pricingType: PricingType;
    pricePerStudent: number;
    totalAmount: number;
    pricingItems: ProposalPricingItem[];
    proposalDate?: string;
    notes?: string;
    leadEmail?: string;
    leadMobile?: string;
  }) => void;
}

// Default 3 standard pricing tiers as requested
const DEFAULT_PRESET_TIERS = [
  {
    name: 'School Premium with ID',
    price: 150,
    desc: 'School ERP + Smart RFID/NFC Student Cards & Instant Gate Synchronization',
  },
  {
    name: 'School Premium',
    price: 100,
    desc: 'Complete School ERP + Student & Staff Mobile Apps + Attendance + Fees + Academic Reports',
  },
  {
    name: 'Parent Payment',
    price: 200,
    desc: 'Parent-oriented communication, digital diaries, direct fee payment gateway & media broadcast',
  },
];

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  lead: initialLead,
  leads = [],
  settings,
  currentUser = { id: 'USR-001', name: 'Admin', email: 'admin@casbiro.com', mobile: '', role: 'Admin', status: 'Active' },
  onGenerateProposal,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentYear = new Date().getFullYear();
  const nextSeq = String(settings.proposalSequence || 43).padStart(3, '0');
  const autoProposalNumber = `${settings.proposalPrefix || `MYSAR/PROP/${currentYear}/`}${nextSeq}`;

  // Master Plans from Storage
  const [masterPlans, setMasterPlans] = useState<PricingPlan[]>([]);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  // Selected Lead or Custom Lead Form State
  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
  const [customInstituteName, setCustomInstituteName] = useState<string>('');
  const [customContactPerson, setCustomContactPerson] = useState<string>('');
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customMobile, setCustomMobile] = useState<string>('');
  const [studentCount, setStudentCount] = useState<number>(500);

  // Multiple pricing rows state
  const [pricingItems, setPricingItems] = useState<ProposalPricingItem[]>([]);
  const [notes, setNotes] = useState<string>('');

  const loadMasterPlans = () => {
    const loaded = storage.getPricingPlans();
    setMasterPlans(loaded);
  };

  useEffect(() => {
    loadMasterPlans();
  }, [isOpen]);

  // Sync state when modal opens or initialLead changes
  useEffect(() => {
    if (!isOpen) return;

    let targetLead = initialLead;
    if (!targetLead && leads.length > 0) {
      targetLead = leads[0];
    }

    if (targetLead) {
      setSelectedLeadId(targetLead.id);
      setCustomInstituteName(targetLead.instituteName || '');
      setCustomContactPerson(targetLead.contactPerson || '');
      setCustomEmail(targetLead.email || '');
      setCustomMobile(targetLead.mobile || '');
      const count = targetLead.studentCount && targetLead.studentCount > 0 ? targetLead.studentCount : 500;
      setStudentCount(count);
      initPricingTiers(count);
    } else {
      setSelectedLeadId('NEW_CUSTOM_LEAD');
      setCustomInstituteName('');
      setCustomContactPerson('');
      setCustomEmail('');
      setCustomMobile('');
      setStudentCount(500);
      initPricingTiers(500);
    }
    setNotes('');
  }, [isOpen, initialLead, leads]);

  const initPricingTiers = (count: number) => {
    const activePlans = masterPlans.length > 0 ? masterPlans.filter((p) => p.isActive) : [];

    const initialTiers: ProposalPricingItem[] = DEFAULT_PRESET_TIERS.map((preset, idx) => {
      const matched = activePlans.find((m) => m.name.toLowerCase() === preset.name.toLowerCase());
      const typeName = matched ? matched.name : preset.name;
      const typePrice = matched ? matched.defaultPrice : preset.price;
      const typeDesc = matched ? matched.description : preset.desc;

      return {
        id: `plan-${Date.now()}-${idx + 1}`,
        pricingType: typeName,
        pricePerStudent: typePrice,
        studentCount: count,
        totalAmount: count * typePrice,
        description: typeDesc,
        isPrimary: idx === 0,
      };
    });

    setPricingItems(initialTiers);
  };

  if (!isOpen) return null;

  const handleLeadSelectChange = (newLeadId: string) => {
    setSelectedLeadId(newLeadId);
    if (newLeadId === 'NEW_CUSTOM_LEAD') {
      setCustomInstituteName('');
      setCustomContactPerson('');
      setCustomEmail('');
      setCustomMobile('');
      return;
    }

    const matched = leads.find((l) => l.id === newLeadId);
    if (matched) {
      setCustomInstituteName(matched.instituteName);
      setCustomContactPerson(matched.contactPerson);
      setCustomEmail(matched.email || '');
      setCustomMobile(matched.mobile || '');
      const count = matched.studentCount && matched.studentCount > 0 ? matched.studentCount : 500;
      setStudentCount(count);
      // Update student count in all pricing tiers
      setPricingItems((prev) =>
        prev.map((item) => ({
          ...item,
          studentCount: count,
          totalAmount: count * item.pricePerStudent,
        }))
      );
    }
  };

  const handleStudentCountChange = (newCount: number) => {
    const validCount = Math.max(1, newCount || 0);
    setStudentCount(validCount);
    setPricingItems((prev) =>
      prev.map((item) => ({
        ...item,
        studentCount: validCount,
        totalAmount: validCount * item.pricePerStudent,
      }))
    );
  };

  const handlePlanTypeChange = (index: number, newType: string) => {
    const updated = [...pricingItems];
    const activePlans = masterPlans.filter((p) => p.isActive);
    const matchedMaster = activePlans.find((p) => p.name.toLowerCase() === newType.toLowerCase());
    const matchedPreset = DEFAULT_PRESET_TIERS.find((p) => p.name.toLowerCase() === newType.toLowerCase());

    const defaultPrice = matchedMaster ? matchedMaster.defaultPrice : matchedPreset ? matchedPreset.price : 100;
    const defaultDesc = matchedMaster ? matchedMaster.description : matchedPreset ? matchedPreset.desc : 'Custom pricing package';

    updated[index] = {
      ...updated[index],
      pricingType: newType,
      pricePerStudent: defaultPrice,
      description: defaultDesc,
      studentCount: studentCount,
      totalAmount: studentCount * defaultPrice,
    };
    setPricingItems(updated);
  };

  const handlePriceChange = (index: number, newPrice: number) => {
    const updated = [...pricingItems];
    const validPrice = Math.max(0, newPrice);
    updated[index] = {
      ...updated[index],
      pricePerStudent: validPrice,
      studentCount: studentCount,
      totalAmount: studentCount * validPrice,
    };
    setPricingItems(updated);
  };

  const handleSetPrimary = (index: number) => {
    const updated = pricingItems.map((item, idx) => ({
      ...item,
      isPrimary: idx === index,
    }));
    setPricingItems(updated);
  };

  const handleAddRow = () => {
    const existingTypes = new Set(pricingItems.map((p) => p.pricingType));
    const activePlans = masterPlans.filter((p) => p.isActive);
    const nextUnused = activePlans.find((p) => !existingTypes.has(p.name)) || activePlans[0];

    const planName = nextUnused ? nextUnused.name : 'Custom Plan';
    const planPrice = nextUnused ? nextUnused.defaultPrice : 100;
    const planDesc = nextUnused ? nextUnused.description : 'Custom institutional pricing package';

    const newItem: ProposalPricingItem = {
      id: `plan-${Date.now()}-${pricingItems.length + 1}`,
      pricingType: planName,
      pricePerStudent: planPrice,
      studentCount: studentCount,
      totalAmount: studentCount * planPrice,
      description: planDesc,
      isPrimary: pricingItems.length === 0,
    };

    setPricingItems([...pricingItems, newItem]);
  };

  const handleRemoveRow = (index: number) => {
    if (pricingItems.length <= 1) return;
    const wasPrimary = pricingItems[index].isPrimary;
    const updated = pricingItems.filter((_, i) => i !== index);
    if (wasPrimary && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setPricingItems(updated);
  };

  const handleLoadTierPreset = () => {
    initPricingTiers(studentCount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInstituteName.trim()) {
      alert('Please enter or select an Institution Name.');
      return;
    }

    if (pricingItems.length === 0) {
      alert('Please add at least one pricing option.');
      return;
    }

    let finalLeadId = selectedLeadId;
    if (!finalLeadId || finalLeadId === 'NEW_CUSTOM_LEAD') {
      // Create lead in storage first if new
      const createdLead = storage.saveLead(
        {
          instituteName: customInstituteName.trim(),
          contactPerson: customContactPerson.trim() || 'Principal / Management',
          email: customEmail.trim(),
          mobile: customMobile.trim(),
          studentCount: studentCount,
          status: 'Proposal Sent',
          assignedTo: currentUser.name,
        },
        currentUser.name
      );
      finalLeadId = createdLead.id;
    }

    const mainItem = pricingItems.find((p) => p.isPrimary) || pricingItems[0];

    onGenerateProposal({
      leadId: finalLeadId,
      instituteName: customInstituteName.trim(),
      contactPerson: customContactPerson.trim() || 'Principal / Management',
      studentCount: studentCount,
      pricingType: mainItem.pricingType as PricingType,
      pricePerStudent: mainItem.pricePerStudent,
      totalAmount: mainItem.totalAmount,
      pricingItems,
      proposalDate: today,
      notes: notes || undefined,
      leadEmail: customEmail.trim(),
      leadMobile: customMobile.trim(),
    });
  };

  const activePlans = masterPlans.filter((p) => p.isActive);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#F7FAF8] border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#168A45] text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Generate MYSAR Institutional Proposal
              </h3>
              <p className="text-xs text-slate-500">
                Commercial proposal builder with multi-tier pricing options and 1-click PDF generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Metadata Top Bar */}
          <div className="flex flex-wrap items-center justify-between text-xs p-3 bg-slate-50 rounded-xl border border-gray-200 gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Proposal Reference:</span>
              <strong className="text-[#0B5D2A] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono">
                {autoProposalNumber}
              </strong>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Proposal Date:</span>
              <strong className="text-slate-800">{today}</strong>
            </div>
          </div>

          {/* Institution & Target Lead Selector */}
          <div className="bg-[#F7FAF8] border border-gray-200 rounded-xl p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-[#168A45]" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Target Institution Details
                </span>
              </div>

              {leads.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] text-slate-500 font-medium">Select Lead:</span>
                  <select
                    value={selectedLeadId}
                    onChange={(e) => handleLeadSelectChange(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#168A45]"
                  >
                    {leads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.instituteName} ({l.studentCount || 0} students)
                      </option>
                    ))}
                    <option value="NEW_CUSTOM_LEAD">+ Enter New Custom Institute</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Institute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Greenwood International Public School"
                  value={customInstituteName}
                  onChange={(e) => setCustomInstituteName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Contact Person / Management
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Ramesh Narayan (Principal)"
                  value={customContactPerson}
                  onChange={(e) => setCustomContactPerson(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Student Strength (Capacity) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    required
                    value={studentCount || ''}
                    onChange={(e) => handleStudentCountChange(Number(e.target.value))}
                    className="w-full bg-white border border-gray-200 rounded-lg pl-3 pr-16 py-2 text-xs font-extrabold text-[#0B5D2A] focus:outline-none focus:border-[#168A45]"
                    placeholder="500"
                  />
                  <span className="absolute right-3 text-[11px] font-bold text-slate-400 select-none pointer-events-none">
                    Students
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="principal@school.edu.in"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Contact Mobile Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98450 88776"
                  value={customMobile}
                  onChange={(e) => setCustomMobile(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                />
              </div>
            </div>
          </div>

          {/* MULTI-PRICING TYPES TABLE SECTION */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-800">
                  Pricing Plans & Commercial Options Table <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500">
                  Configure default pricing options and rates per student for the proposal (calculated for {studentCount} students)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-2xs"
                  title="Configure Master Pricing Plans, default rates, and deliverables"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#168A45]" />
                  <span>Manage Master</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadTierPreset}
                  className="bg-[#EAF7EF] hover:bg-[#D9E5DD] text-[#0B5D2A] border border-[#D9E5DD] px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                  title="Reset to the 3 standard default plans"
                >
                  <Sparkles className="w-3 h-3 text-[#168A45]" />
                  <span>Reset Default 3 Plans</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="bg-[#168A45] hover:bg-[#0B5D2A] text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plan Row</span>
                </button>
              </div>
            </div>

            {/* Editable Pricing Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-16 text-center">Primary</th>
                      <th className="py-2.5 px-4 min-w-[260px]">Pricing Type / Plan</th>
                      <th className="py-2.5 px-4 w-44">Rate / Student</th>
                      <th className="py-2.5 px-4 w-52 text-right">Calculated Total</th>
                      <th className="py-2.5 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {pricingItems.map((item, idx) => (
                      <tr
                        key={item.id || idx}
                        className={`transition-colors ${item.isPrimary ? 'bg-emerald-50/40' : 'hover:bg-[#F7FAF8]'}`}
                      >
                        {/* Primary Radio */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSetPrimary(idx)}
                            className="inline-flex items-center justify-center"
                            title={item.isPrimary ? 'Primary Featured Offer' : 'Click to set as Primary Offer'}
                          >
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                item.isPrimary
                                  ? 'bg-[#168A45] text-white ring-2 ring-emerald-200'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                            >
                              {item.isPrimary ? '✓' : idx + 1}
                            </span>
                          </button>
                        </td>

                        {/* Pricing Type Dropdown */}
                        <td className="py-3 px-4">
                          <select
                            value={item.pricingType}
                            onChange={(e) => handlePlanTypeChange(idx, e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45]"
                          >
                            {activePlans.map((opt) => (
                              <option key={opt.id} value={opt.name}>
                                {opt.name} (₹{opt.defaultPrice}/student)
                              </option>
                            ))}
                            {!activePlans.some((p) => p.name.toLowerCase() === item.pricingType.toLowerCase()) && (
                              <option value={item.pricingType}>{item.pricingType}</option>
                            )}
                            <option value="Custom Plan">Custom Plan / Special</option>
                          </select>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.description}</p>
                          )}
                        </td>

                        {/* Price Per Student Input */}
                        <td className="py-3 px-4">
                          <div className="relative flex items-center">
                            <span className="absolute left-3 text-xs font-bold text-[#168A45] pointer-events-none select-none">
                              ₹
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              required
                              value={item.pricePerStudent || ''}
                              onChange={(e) => handlePriceChange(idx, Number(e.target.value))}
                              className="w-full pl-7 pr-2 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45]"
                              placeholder="150"
                            />
                          </div>
                        </td>

                        {/* Calculated Total */}
                        <td className="py-3 px-4 text-right">
                          <div className="font-extrabold text-sm text-[#0B5D2A]">
                            {formatINR(item.totalAmount || (item.pricePerStudent * studentCount))}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {studentCount} × ₹{item.pricePerStudent}
                          </div>
                        </td>

                        {/* Delete Action */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            disabled={pricingItems.length <= 1}
                            onClick={() => handleRemoveRow(idx)}
                            className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-slate-400 rounded-md transition-colors"
                            title={
                              pricingItems.length <= 1
                                ? 'At least one pricing tier is required'
                                : 'Remove this pricing tier'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Footer Info */}
              <div className="bg-slate-50/70 border-t border-gray-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-[#168A45]" />
                  <span>
                    <strong>{pricingItems.length}</strong> commercial {pricingItems.length === 1 ? 'option' : 'options'} configured. Primary offer will be highlighted on Page 1 & 12 of the official proposal document.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAddRow}
                  className="text-xs font-bold text-[#168A45] hover:text-[#0B5D2A] flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Another Option</span>
                </button>
              </div>
            </div>
          </div>

          {/* Optional notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Additional Terms / Custom Commercial Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Includes free RFID cards for 1st batch, payment in 2 installments"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Primary Plan: <strong className="text-slate-800">{pricingItems.find((p) => p.isPrimary)?.pricingType || 'School Premium'}</strong> • Total Value: <strong className="text-[#0B5D2A]">{formatINR(pricingItems.find((p) => p.isPrimary)?.totalAmount || (studentCount * 150))}</strong>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition-all active:scale-98"
              >
                <span>Generate Proposal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Pricing Master Manager Modal */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-slate-100 rounded-2xl w-full max-w-5xl shadow-2xl p-4 my-4 max-h-[94vh] overflow-y-auto">
            <PricingMasterManager
              currentUser={currentUser}
              isModalMode={true}
              onCloseModal={() => {
                setIsMasterModalOpen(false);
                loadMasterPlans();
              }}
              onPlansUpdated={(updated) => {
                setMasterPlans(updated);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
