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
  Calendar,
  ShieldCheck,
  FileSignature,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Lead,
  PricingPlan,
  PricingType,
  Proposal,
  ProposalAgreementDetails,
  ProposalPricingItem,
  Settings,
  User,
} from '../types';
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
  editingProposal?: Proposal | null;
  onGenerateProposal: (proposalData: {
    leadId: string;
    instituteName: string;
    contactPerson: string;
    studentCount: number;
    pricingType: PricingType;
    pricePerStudent: number;
    totalAmount: number;
    pricingItems: ProposalPricingItem[];
    agreementDetails?: ProposalAgreementDetails;
    proposalDate?: string;
    notes?: string;
    leadEmail?: string;
    leadMobile?: string;
    editingProposalId?: string;
    revisionNotes?: string;
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

// Standard payment schedule and terms matching Casbiro MYSAR official proposal document
const DEFAULT_PAYMENT_SCHEDULE = [
  'Registration fee at the time of registration',
  'Balance 60% after students onboarding, after two months balance 40% will pay.',
];

const DEFAULT_PAYMENT_TERMS = [
  'Registration Fee will be included in the Trial Price and will be deducted from it.',
  'The Trial Price is applicable only for the current academic year (2026–2027 Academic Year).',
  'Payment shall be made according to the payment schedule specified in this proposal.',
  'The student subscription price is based on a five (5) year agreement between the client/institution and Casbiro Solutions Private Limited (MYSAR).',
  'Any applicable taxes, government charges, or additional services outside the agreed scope will be charged separately.',
  'Any additional requirements or changes to the agreed scope may be subject to additional charges.',
  'The terms and pricing specified in this proposal are subject to the agreed five-year contract period.',
];

export const CreateProposalModal: React.FC<CreateProposalModalProps> = ({
  isOpen,
  onClose,
  lead: initialLead,
  leads = [],
  settings,
  currentUser = { id: 'USR-001', name: 'Admin', email: 'admin@casbiro.com', mobile: '', role: 'Admin', status: 'Active' },
  editingProposal,
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
  const [revisionNotes, setRevisionNotes] = useState<string>('');

  // Agreement Details State
  const [agreementPeriod, setAgreementPeriod] = useState<string>('5 Years');
  const [registrationFee, setRegistrationFee] = useState<number>(30000);
  const [trialPrice, setTrialPrice] = useState<number>(30);
  const [trialAcademicYear, setTrialAcademicYear] = useState<string>(`${currentYear}–${currentYear + 1} Academic Year`);
  const [planChosen, setPlanChosen] = useState<string>('Institute Payment');
  const [hasSpecialPrice, setHasSpecialPrice] = useState<boolean>(true);
  const [specialPrice, setSpecialPrice] = useState<number>(65);
  const [specialPriceLabel, setSpecialPriceLabel] = useState<string>('Institute Subscription (Special Price)');
  const [paymentSchedule, setPaymentSchedule] = useState<string[]>([...DEFAULT_PAYMENT_SCHEDULE]);
  const [newCustomScheduleItem, setNewCustomScheduleItem] = useState<string>('');
  const [showScheduleList, setShowScheduleList] = useState<boolean>(true);
  const [paymentTerms, setPaymentTerms] = useState<string[]>([...DEFAULT_PAYMENT_TERMS]);
  const [newCustomTerm, setNewCustomTerm] = useState<string>('');
  const [clientAuthorizedPerson, setClientAuthorizedPerson] = useState<string>('');
  const [clientDesignation, setClientDesignation] = useState<string>('Principal / Authorized Signatory');
  const [companyAuthorizedPerson, setCompanyAuthorizedPerson] = useState<string>('Sakeer Ali V');
  const [companyDesignation, setCompanyDesignation] = useState<string>('Director & Authorized Signatory');
  const [acceptanceClause, setAcceptanceClause] = useState<string>('');
  const [showTermsList, setShowTermsList] = useState<boolean>(false);

  const loadMasterPlans = () => {
    const loaded = storage.getPricingPlans();
    setMasterPlans(loaded);
  };

  useEffect(() => {
    loadMasterPlans();
  }, [isOpen]);

  // Sync state when modal opens or initialLead / editingProposal changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingProposal) {
      setSelectedLeadId(editingProposal.leadId || 'CUSTOM');
      setCustomInstituteName(editingProposal.instituteName || '');
      setCustomContactPerson(editingProposal.contactPerson || '');
      setCustomEmail(editingProposal.leadEmail || '');
      setStudentCount(editingProposal.studentCount || 500);
      setNotes(editingProposal.notes || '');
      setRevisionNotes('');

      if (editingProposal.pricingItems && editingProposal.pricingItems.length > 0) {
        setPricingItems(editingProposal.pricingItems);
      } else {
        initPricingTiers(editingProposal.studentCount || 500);
      }

      const ag = editingProposal.agreementDetails;
      if (ag) {
        setAgreementPeriod(ag.agreementPeriod || '5 Years');
        setRegistrationFee(ag.registrationFee ?? 30000);
        setTrialPrice(ag.trialPrice ?? 30);
        setTrialAcademicYear(ag.trialAcademicYear || `${currentYear}–${currentYear + 1} Academic Year`);
        setPlanChosen(ag.planChosen || editingProposal.pricingType || 'Institute Payment');
        setHasSpecialPrice(ag.hasSpecialPrice ?? true);
        setSpecialPrice(ag.specialPrice ?? 65);
        setSpecialPriceLabel(ag.specialPriceLabel || 'Institute Subscription (Special Price)');
        setPaymentSchedule(ag.paymentSchedule && ag.paymentSchedule.length > 0 ? ag.paymentSchedule : [...DEFAULT_PAYMENT_SCHEDULE]);
        setPaymentTerms(ag.paymentTerms && ag.paymentTerms.length > 0 ? ag.paymentTerms : [...DEFAULT_PAYMENT_TERMS]);
        setClientAuthorizedPerson(ag.clientAuthorizedPerson || editingProposal.contactPerson || '');
        setClientDesignation(ag.clientDesignation || 'Principal / Authorized Signatory');
        setCompanyAuthorizedPerson(ag.companyAuthorizedPerson || currentUser.name || 'Sakeer Ali V');
        setCompanyDesignation(ag.companyDesignation || 'Director & Authorized Signatory');
        setAcceptanceClause(ag.acceptanceClause || '');
      } else {
        setAgreementPeriod('5 Years');
        setRegistrationFee(30000);
        setTrialPrice(30);
        setTrialAcademicYear(`${currentYear}–${currentYear + 1} Academic Year`);
        setPlanChosen(editingProposal.pricingType || 'Institute Payment');
        setHasSpecialPrice(true);
        setSpecialPrice(65);
        setSpecialPriceLabel('Institute Subscription (Special Price)');
        setPaymentSchedule([...DEFAULT_PAYMENT_SCHEDULE]);
        setPaymentTerms([...DEFAULT_PAYMENT_TERMS]);
        setClientAuthorizedPerson(editingProposal.contactPerson || '');
        setClientDesignation('Principal / Authorized Signatory');
        setCompanyAuthorizedPerson(currentUser.name || 'Sakeer Ali V');
        setCompanyDesignation('Director & Authorized Signatory');
        setAcceptanceClause('');
      }
      return;
    }

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
      setClientAuthorizedPerson(targetLead.contactPerson || '');
    } else {
      setSelectedLeadId('NEW_CUSTOM_LEAD');
      setCustomInstituteName('');
      setCustomContactPerson('');
      setCustomEmail('');
      setCustomMobile('');
      setStudentCount(500);
      initPricingTiers(500);
      setClientAuthorizedPerson('');
    }

    setAgreementPeriod('5 Years');
    setRegistrationFee(30000);
    setTrialPrice(30);
    setTrialAcademicYear(`${currentYear}–${currentYear + 1} Academic Year`);
    setPlanChosen('Institute Payment');
    setHasSpecialPrice(true);
    setSpecialPrice(65);
    setSpecialPriceLabel('Institute Subscription (Special Price)');
    setPaymentSchedule([...DEFAULT_PAYMENT_SCHEDULE]);
    setPaymentTerms([...DEFAULT_PAYMENT_TERMS]);
    setClientDesignation('Principal / Authorized Signatory');
    setCompanyAuthorizedPerson(currentUser.name || 'Sakeer Ali V');
    setCompanyDesignation('Director & Authorized Signatory');
    setNotes('');
  }, [isOpen, initialLead, leads, editingProposal]);

  const initPricingTiers = (count: number, currentPlans?: PricingPlan[]) => {
    const plansPool =
      currentPlans && currentPlans.length > 0
        ? currentPlans
        : masterPlans.length > 0
        ? masterPlans
        : storage.getPricingPlans();
    const active = plansPool.filter((p) => p.isActive);

    const initialTiers: ProposalPricingItem[] = DEFAULT_PRESET_TIERS.map((preset, idx) => {
      const matched = active.find((m) => m.name.toLowerCase() === preset.name.toLowerCase());
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
    const activePlansPool = masterPlans.length > 0 ? masterPlans : storage.getPricingPlans();
    const active = activePlansPool.filter((p) => p.isActive);
    const matchedMaster = active.find((p) => p.name.toLowerCase() === newType.toLowerCase());
    const matchedPreset = DEFAULT_PRESET_TIERS.find((p) => p.name.toLowerCase() === newType.toLowerCase());

    const defaultPrice = matchedMaster ? matchedMaster.defaultPrice : matchedPreset ? matchedPreset.price : 100;
    const defaultDesc = matchedMaster ? matchedMaster.description : matchedPreset ? matchedPreset.desc : 'Custom pricing package';

    const updated = [...pricingItems];
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
    const activePlansPool = masterPlans.length > 0 ? masterPlans : storage.getPricingPlans();
    const active = activePlansPool.filter((p) => p.isActive);
    const existingTypes = new Set(pricingItems.map((p) => p.pricingType));
    const nextUnused = active.find((p) => !existingTypes.has(p.name)) || active[0];

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

    const finalAgreementDetails: ProposalAgreementDetails = {
      agreementPeriod: agreementPeriod.trim() || '5 Years',
      registrationFee: Number(registrationFee) || 0,
      trialPrice: Number(trialPrice) || 0,
      trialAcademicYear: trialAcademicYear.trim() || `${currentYear}–${currentYear + 1} Academic Year`,
      planChosen: planChosen.trim() || mainItem.pricingType || 'Institute Payment',
      hasSpecialPrice,
      specialPrice: hasSpecialPrice ? Number(specialPrice) : undefined,
      specialPriceLabel: specialPriceLabel.trim() || 'Institute Subscription (Special Price)',
      agreementClause: `The student subscription price quoted in this proposal is applicable for a period of ${agreementPeriod.trim() || 'five (5) years'} from the date of commencement of the agreement, subject to the terms and conditions specified in this proposal.\n\nThe quoted student price covers the agreed MYSAR services and features for the full ${agreementPeriod.trim() || 'five-year'} agreement period. Any services, features, requirements, or changes outside the agreed scope may be subject to additional charges.`,
      acceptanceClause:
        acceptanceClause.trim() ||
        `We hereby acknowledge that we have received and reviewed the proposal issued by Casbiro Solutions Private Limited (MYSAR) for ${customInstituteName.trim() || 'the Institution'} and confirm our acceptance of the proposed scope of work, technical deliverables, pricing, and terms specified herein.\n\nBy accepting this proposal, the institution authorizes Casbiro Solutions Private Limited (MYSAR) to proceed with implementation planning, campus infrastructure setup, smart ID card configuration, and operational rollout.`,
      paymentSchedule: paymentSchedule.filter((t) => t.trim().length > 0),
      paymentTerms: paymentTerms.filter((t) => t.trim().length > 0),
      clientAuthorizedPerson: clientAuthorizedPerson.trim() || customContactPerson.trim() || 'Authorized Person',
      clientDesignation: clientDesignation.trim() || 'Principal / Authorized Signatory',
      companyAuthorizedPerson: companyAuthorizedPerson.trim() || currentUser.name || 'Sakeer Ali V',
      companyDesignation: companyDesignation.trim() || 'Director & Authorized Signatory',
    };

    onGenerateProposal({
      leadId: finalLeadId,
      instituteName: customInstituteName.trim(),
      contactPerson: customContactPerson.trim() || 'Principal / Management',
      studentCount: studentCount,
      pricingType: mainItem.pricingType as PricingType,
      pricePerStudent: mainItem.pricePerStudent,
      totalAmount: mainItem.totalAmount,
      pricingItems,
      agreementDetails: finalAgreementDetails,
      proposalDate: editingProposal ? editingProposal.proposalDate || today : today,
      notes: notes || undefined,
      leadEmail: customEmail.trim(),
      leadMobile: customMobile.trim(),
      editingProposalId: editingProposal?.id,
      revisionNotes: revisionNotes.trim() || undefined,
    });
  };

  if (!isOpen) return null;

  const activePlans = (masterPlans.length > 0 ? masterPlans : storage.getPricingPlans()).filter(
    (p) => p.isActive
  );

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
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  {editingProposal ? 'Edit Commercial Proposal' : 'Generate MYSAR Institutional Proposal'}
                </h3>
                {editingProposal && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Current: v{editingProposal.version || 1} → Next: v{(editingProposal.version || 1) + 1}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {editingProposal
                  ? `Updating existing proposal ${editingProposal.proposalNumber}. Saving will increment the version to v${(editingProposal.version || 1) + 1} and record an audit log.`
                  : 'Commercial proposal builder with multi-tier pricing options and 1-click PDF generation'}
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
                {editingProposal ? editingProposal.proposalNumber : autoProposalNumber}
              </strong>
              {editingProposal && (
                <span className="text-xs font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                  v{editingProposal.version || 1}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Proposal Date:</span>
              <strong className="text-slate-800">{editingProposal ? editingProposal.proposalDate : today}</strong>
            </div>
          </div>

          {/* Revision Notes if Editing */}
          {editingProposal && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Version History Note / Revision Reason</span>
                </label>
                <span className="text-[10px] text-amber-700 font-semibold">
                  Saved to v{(editingProposal.version || 1) + 1} version tracker
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. Rate revised to ₹65/student after management review; updated student count to 850"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                className="w-full bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-amber-400/80 focus:outline-none focus:border-[#168A45] focus:ring-1 focus:ring-[#168A45]"
              />
            </div>
          )}

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

          {/* AGREEMENT & CONTRACT TERMS SECTION */}
          <div className="bg-white border border-emerald-200/90 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF7EF] text-[#168A45] flex items-center justify-center font-bold">
                  <FileSignature className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Official Agreement & Acceptance Details
                    </h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-[#0B5D2A] text-[10px] font-bold rounded-full border border-emerald-200">
                      Pages 15 & 16
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Controls the Price Details table, multi-year agreement terms, payment schedule, and formal dual signatories.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAgreementPeriod('5 Years');
                  setRegistrationFee(30000);
                  setTrialPrice(30);
                  setTrialAcademicYear(`${currentYear}–${currentYear + 1} Academic Year`);
                  setPlanChosen('Institute Payment');
                  setHasSpecialPrice(true);
                  setSpecialPrice(65);
                  setSpecialPriceLabel('Institute Subscription (Special Price)');
                  setPaymentSchedule([...DEFAULT_PAYMENT_SCHEDULE]);
                  setPaymentTerms([...DEFAULT_PAYMENT_TERMS]);
                  setClientDesignation('Principal / Authorized Signatory');
                  setCompanyAuthorizedPerson(currentUser?.name || 'Sakeer Ali V');
                  setCompanyDesignation('Director & Authorized Signatory');
                }}
                className="text-[11px] font-semibold text-slate-500 hover:text-[#168A45] flex items-center gap-1 transition"
                title="Reset to Casbiro Standard Agreement Terms"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Standards</span>
              </button>
            </div>

            {/* Core Agreement Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {/* Agreement Period */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreement Period <span className="text-red-500">*</span>
                </label>
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    {['5 Years', '3 Years', '2 Years', '1 Year'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setAgreementPeriod(p)}
                        className={`px-2 py-1 text-[10.5px] font-bold rounded border transition ${
                          agreementPeriod === p
                            ? 'bg-[#168A45] text-white border-[#168A45]'
                            : 'bg-slate-50 text-slate-600 border-gray-200 hover:bg-slate-100'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    required
                    value={agreementPeriod}
                    onChange={(e) => setAgreementPeriod(e.target.value)}
                    placeholder="e.g. 5 Years"
                    className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-[#168A45]"
                  />
                </div>
              </div>

              {/* Plan Chosen in Contract */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plan Chosen (Contract Label)
                </label>
                <input
                  type="text"
                  value={planChosen}
                  onChange={(e) => setPlanChosen(e.target.value)}
                  placeholder="e.g. Institute Payment"
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
                <div className="flex gap-1 mt-1 text-[10px] text-slate-400">
                  <span>Quick:</span>
                  <button
                    type="button"
                    onClick={() => setPlanChosen('Institute Payment')}
                    className="text-[#168A45] hover:underline"
                  >
                    Institute Payment
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPlanChosen(
                        pricingItems.find((p) => p.isPrimary)?.pricingType || 'School Premium'
                      )
                    }
                    className="text-[#168A45] hover:underline truncate max-w-[120px]"
                  >
                    {pricingItems.find((p) => p.isPrimary)?.pricingType || 'Primary Plan'}
                  </button>
                </div>
              </div>

              {/* Trial Academic Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trial Academic Year
                </label>
                <input
                  type="text"
                  value={trialAcademicYear}
                  onChange={(e) => setTrialAcademicYear(e.target.value)}
                  placeholder="e.g. 2026–2027 Academic Year"
                  className="w-full bg-[#F7FAF8] border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                />
                <p className="text-[10px] text-slate-400 mt-1">Appears in Payment Terms bullet #2</p>
              </div>

              {/* Registration Fee */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registration Fee (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={registrationFee}
                    onChange={(e) => setRegistrationFee(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-[#F7FAF8] border border-gray-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                    placeholder="30000"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Included in Trial Price & deducted from it</p>
              </div>

              {/* Trail Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trail Price per Student (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={trialPrice}
                    onChange={(e) => setTrialPrice(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-[#F7FAF8] border border-gray-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                    placeholder="30"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Quoted as {trialPrice}/ Student in Price Details</p>
              </div>

              {/* Special Price Toggle Box */}
              <div className="bg-[#F7FAF8] border border-gray-200 rounded-lg p-2.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasSpecialPrice}
                      onChange={(e) => setHasSpecialPrice(e.target.checked)}
                      className="rounded text-[#168A45] focus:ring-[#168A45] w-3.5 h-3.5"
                    />
                    <span>Special Price Offer</span>
                  </label>
                  {hasSpecialPrice && (
                    <span className="text-[10px] font-bold text-[#0B5D2A] bg-emerald-100/70 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>

                {hasSpecialPrice && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Rate / Student</span>
                      <div className="relative mt-0.5">
                        <span className="absolute left-2 top-1.5 text-[11px] font-bold text-slate-400">₹</span>
                        <input
                          type="number"
                          value={specialPrice}
                          onChange={(e) => setSpecialPrice(Number(e.target.value))}
                          className="w-full pl-5 pr-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-[#0B5D2A] focus:outline-none focus:border-[#168A45]"
                          placeholder="65"
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium">Label</span>
                      <input
                        type="text"
                        value={specialPriceLabel}
                        onChange={(e) => setSpecialPriceLabel(e.target.value)}
                        className="w-full mt-0.5 px-2 py-1 bg-white border border-gray-200 rounded text-[11px] text-slate-800 focus:outline-none focus:border-[#168A45]"
                        placeholder="Special Price"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Document Price Details Live Preview Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Live Price Details Table Preview (Will appear on Page 15)
                </span>
                <span className="text-[10px] text-slate-400">Exact layout matching Casbiro PDF</span>
              </div>
              <div className="bg-white border border-gray-200 rounded overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-gray-200">
                      <th className="py-1.5 px-3 text-left">Description</th>
                      <th className="py-1.5 px-3 text-right w-40">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-slate-800">
                    <tr>
                      <td className="py-1.5 px-3">Registration Fee</td>
                      <td className="py-1.5 px-3 text-right font-bold">{formatINR(registrationFee)}</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3">Trail Price</td>
                      <td className="py-1.5 px-3 text-right font-bold">{trialPrice}/ Student</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3">{planChosen || 'Institute Subscription'}</td>
                      <td className="py-1.5 px-3 text-right font-bold text-[#168A45]">
                        ₹ {pricingItems.find((p) => p.isPrimary)?.pricePerStudent || 100} / Student
                      </td>
                    </tr>
                    {hasSpecialPrice && (
                      <tr className="bg-emerald-50/50">
                        <td className="py-1.5 px-3 font-semibold text-[#0B5D2A]">{specialPriceLabel}</td>
                        <td className="py-1.5 px-3 text-right font-black text-[#0B5D2A]">
                          ₹ {specialPrice} / Student
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Authorized Dual Signatories Configuration */}
            <div className="pt-2 border-t border-gray-100">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2.5">
                Dual Signatory Personnel (Page 16)
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Client Signatory */}
                <div className="bg-[#F7FAF8] border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="text-[10.5px] font-bold text-slate-700 uppercase tracking-wider">
                    Client Signatory (For {customInstituteName || 'Institution'})
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                      Authorized Person Name
                    </label>
                    <input
                      type="text"
                      value={clientAuthorizedPerson}
                      onChange={(e) => setClientAuthorizedPerson(e.target.value)}
                      placeholder={customContactPerson || 'Dr. Principal / Chairman'}
                      className="w-full bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={clientDesignation}
                      onChange={(e) => setClientDesignation(e.target.value)}
                      placeholder="Principal / Authorized Signatory"
                      className="w-full bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                    />
                  </div>
                </div>

                {/* Casbiro Signatory */}
                <div className="bg-[#F7FAF8] border border-emerald-200 rounded-lg p-3 space-y-2">
                  <div className="text-[10.5px] font-bold text-[#0B5D2A] uppercase tracking-wider">
                    For Casbiro Solutions Private Limited (MYSAR)
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                      Authorized Person Name
                    </label>
                    <input
                      type="text"
                      value={companyAuthorizedPerson}
                      onChange={(e) => setCompanyAuthorizedPerson(e.target.value)}
                      placeholder="Sakeer Ali V"
                      className="w-full bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#168A45]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={companyDesignation}
                      onChange={(e) => setCompanyDesignation(e.target.value)}
                      placeholder="Director & Authorized Signatory"
                      className="w-full bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Schedule Section */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowScheduleList(!showScheduleList)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">5. Payment Schedule (Milestones)</span>
                  <span className="px-2 py-0.5 bg-[#EAF7EF] text-[#168A45] text-[10px] font-bold rounded-full border border-[#168A45]/30">
                    {paymentSchedule.length} milestones active
                  </span>
                </div>
                {showScheduleList ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showScheduleList && (
                <div className="mt-2.5 space-y-2.5 animate-in fade-in duration-100">
                  <div className="bg-[#F7FAF8] border border-gray-200 rounded-md p-2.5 text-[11px] text-slate-600">
                    <div className="text-[10px] font-bold text-[#168A45] uppercase tracking-wider mb-1">
                      Standard Default Milestones
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-700 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#168A45] text-white text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
                        <span>Registration fee at registration</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#168A45] text-white text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
                        <span>Balance 60% after onboarding, balance 40% after 2 months</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {paymentSchedule.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#168A45]/15 text-[#0B5D2A] text-[10px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const updated = [...paymentSchedule];
                            updated[idx] = e.target.value;
                            setPaymentSchedule(updated);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded px-2.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-[#168A45]"
                        />
                        <button
                          type="button"
                          disabled={paymentSchedule.length <= 1}
                          onClick={() => {
                            setPaymentSchedule(paymentSchedule.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-20"
                          title="Remove milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add custom schedule milestone */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add an additional payment schedule milestone..."
                      value={newCustomScheduleItem}
                      onChange={(e) => setNewCustomScheduleItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCustomScheduleItem.trim()) {
                            setPaymentSchedule([...paymentSchedule, newCustomScheduleItem.trim()]);
                            setNewCustomScheduleItem('');
                          }
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCustomScheduleItem.trim()) {
                          setPaymentSchedule([...paymentSchedule, newCustomScheduleItem.trim()]);
                          setNewCustomScheduleItem('');
                        }
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Milestone</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentSchedule([...DEFAULT_PAYMENT_SCHEDULE])}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-[#168A45] flex items-center gap-1 transition"
                      title="Reset Payment Schedule to Default"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Terms Clause Editor Toggle */}
            <div className="pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowTermsList(!showTermsList)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 py-1"
              >
                <div className="flex items-center gap-2">
                  <span>Custom Payment Terms & Scope Clauses</span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                    {paymentTerms.length} clauses active
                  </span>
                </div>
                {showTermsList ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showTermsList && (
                <div className="mt-3 space-y-2 animate-in fade-in duration-100">
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {paymentTerms.map((term, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={term}
                          onChange={(e) => {
                            const updated = [...paymentTerms];
                            updated[idx] = e.target.value;
                            setPaymentTerms(updated);
                          }}
                          className="flex-1 bg-[#F7FAF8] border border-gray-200 rounded px-2.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:bg-white focus:border-[#168A45]"
                        />
                        <button
                          type="button"
                          disabled={paymentTerms.length <= 1}
                          onClick={() => {
                            setPaymentTerms(paymentTerms.filter((_, i) => i !== idx));
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 disabled:opacity-20"
                          title="Remove clause"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add custom term clause */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add an additional payment term or condition..."
                      value={newCustomTerm}
                      onChange={(e) => setNewCustomTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newCustomTerm.trim()) {
                            setPaymentTerms([...paymentTerms, newCustomTerm.trim()]);
                            setNewCustomTerm('');
                          }
                        }
                      }}
                      className="flex-1 bg-white border border-gray-200 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:border-[#168A45]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCustomTerm.trim()) {
                          setPaymentTerms([...paymentTerms, newCustomTerm.trim()]);
                          setNewCustomTerm('');
                        }
                      }}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Clause</span>
                    </button>
                  </div>
                </div>
              )}
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
                <span>
                  {editingProposal
                    ? `Save & Issue v${(editingProposal.version || 1) + 1}`
                    : 'Generate Proposal'}
                </span>
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
