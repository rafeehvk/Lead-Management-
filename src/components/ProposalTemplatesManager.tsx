import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  Edit,
  Copy,
  Star,
  Eye,
  RotateCcw,
  Sparkles,
  FileSignature,
  Layers,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  ProposalTemplate,
  ProposalTemplatePricingConfig,
  ProposalTemplateAgreementConfig,
  PricingPlan,
  User,
} from '../types';
import { storage } from '../services/storageService';
import { formatINR } from '../utils/pdfGenerator';
import { hasPermission } from '../utils/rbac';

interface ProposalTemplatesManagerProps {
  currentUser: User;
  onSelectTemplateForProposal?: (template: ProposalTemplate) => void;
}

export const ProposalTemplatesManager: React.FC<ProposalTemplatesManagerProps> = ({
  currentUser,
  onSelectTemplateForProposal,
}) => {
  const canManage = hasPermission.canManageSettings(currentUser);

  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  // Modal States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProposalTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<ProposalTemplate['category']>('K-12 Schools');
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formDefaultStudents, setFormDefaultStudents] = useState<number>(500);

  // Pricing Items Form State
  const [pricingItems, setPricingItems] = useState<ProposalTemplatePricingConfig[]>([]);

  // Agreement Details Form State
  const [agreementPeriod, setAgreementPeriod] = useState('5 Years');
  const [registrationFee, setRegistrationFee] = useState<number>(30000);
  const [trialPrice, setTrialPrice] = useState<number>(30);
  const [trialAcademicYear, setTrialAcademicYear] = useState('2026–2027 Academic Year');
  const [planChosen, setPlanChosen] = useState('Institute Payment');
  const [hasSpecialPrice, setHasSpecialPrice] = useState(true);
  const [specialPrice, setSpecialPrice] = useState<number>(65);
  const [specialPriceLabel, setSpecialPriceLabel] = useState('Institute Subscription (Special Price)');
  const [paymentSchedule, setPaymentSchedule] = useState<string[]>([]);
  const [newScheduleItem, setNewScheduleItem] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<string[]>([]);
  const [newPaymentTerm, setNewPaymentTerm] = useState('');
  const [acceptanceClause, setAcceptanceClause] = useState('');
  const [clientDesignation, setClientDesignation] = useState('Principal / Authorized Signatory');
  const [companyAuthorizedPerson, setCompanyAuthorizedPerson] = useState('Sakeer Ali V');
  const [companyDesignation, setCompanyDesignation] = useState('Director & Authorized Signatory');

  const [activeFormTab, setActiveFormTab] = useState<'general' | 'pricing' | 'agreement'>('general');

  const loadTemplates = () => {
    const loaded = storage.getProposalTemplates();
    setTemplates(loaded);
  };

  useEffect(() => {
    loadTemplates();

    const handleTemplatesChanged = () => loadTemplates();
    window.addEventListener('mysar_proposal_templates_changed', handleTemplatesChanged);
    return () => window.removeEventListener('mysar_proposal_templates_changed', handleTemplatesChanged);
  }, []);

  const showNotification = (msg: string) => {
    setSavedSuccessMessage(msg);
    setTimeout(() => setSavedSuccessMessage(null), 3000);
  };

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormCode(`TMPL-${templates.length + 1}`);
    setFormDescription('');
    setFormCategory('K-12 Schools');
    setFormIsDefault(false);
    setFormDefaultStudents(500);

    setPricingItems([
      {
        id: `pi-${Date.now()}-1`,
        pricingType: 'Institute Payment',
        pricePerStudent: 100,
        studentCount: 500,
        totalAmount: 50000,
        description: 'Core ERP institutional campus subscription with academic modules.',
        isPrimary: true,
      },
      {
        id: `pi-${Date.now()}-2`,
        pricingType: 'School Premium with ID',
        pricePerStudent: 150,
        studentCount: 500,
        totalAmount: 75000,
        description: 'Complete ERP plus smart student RFID badge cards.',
        isPrimary: false,
      },
    ]);

    setAgreementPeriod('5 Years');
    setRegistrationFee(30000);
    setTrialPrice(30);
    setTrialAcademicYear('2026–2027 Academic Year');
    setPlanChosen('Institute Payment');
    setHasSpecialPrice(true);
    setSpecialPrice(65);
    setSpecialPriceLabel('Institute Subscription (Special Price)');
    setPaymentSchedule([
      'Registration fee at the time of registration',
      'Balance 60% after students onboarding, after two months balance 40% will pay.',
    ]);
    setPaymentTerms([
      'Registration Fee will be included in the Trial Price and will be deducted from it.',
      'The Trial Price is applicable only for the current academic year (2026–2027 Academic Year).',
      'Payment shall be made according to the payment schedule specified in this proposal.',
      'The student subscription price is based on a five (5) year agreement between the client/institution and Casbiro Solutions Private Limited (MYSAR).',
      'Any applicable taxes, government charges, or additional services outside the agreed scope will be charged separately.',
    ]);
    setAcceptanceClause(
      'We hereby acknowledge that we have received and reviewed the proposal issued by Casbiro Solutions Private Limited (MYSAR) and confirm our acceptance to proceed with the proposed services, subject to the agreed commercial terms.'
    );
    setClientDesignation('Principal / Authorized Signatory');
    setCompanyAuthorizedPerson('Sakeer Ali V');
    setCompanyDesignation('Director & Authorized Signatory');
    setActiveFormTab('general');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (template: ProposalTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormCode(template.code || '');
    setFormDescription(template.description || '');
    setFormCategory(template.category || 'K-12 Schools');
    setFormIsDefault(template.isDefault || false);
    setFormDefaultStudents(template.defaultStudentCount || 500);

    setPricingItems(template.pricingItems ? JSON.parse(JSON.stringify(template.pricingItems)) : []);

    const ag = template.agreementDetails;
    if (ag) {
      setAgreementPeriod(ag.agreementPeriod || '5 Years');
      setRegistrationFee(ag.registrationFee ?? 30000);
      setTrialPrice(ag.trialPrice ?? 30);
      setTrialAcademicYear(ag.trialAcademicYear || '2026–2027 Academic Year');
      setPlanChosen(ag.planChosen || 'Institute Payment');
      setHasSpecialPrice(ag.hasSpecialPrice ?? true);
      setSpecialPrice(ag.specialPrice ?? 65);
      setSpecialPriceLabel(ag.specialPriceLabel || 'Institute Subscription (Special Price)');
      setPaymentSchedule(ag.paymentSchedule ? [...ag.paymentSchedule] : []);
      setPaymentTerms(ag.paymentTerms ? [...ag.paymentTerms] : []);
      setAcceptanceClause(ag.acceptanceClause || '');
      setClientDesignation(ag.clientDesignation || 'Principal / Authorized Signatory');
      setCompanyAuthorizedPerson(ag.companyAuthorizedPerson || 'Sakeer Ali V');
      setCompanyDesignation(ag.companyDesignation || 'Director & Authorized Signatory');
    }

    setActiveFormTab('general');
    setIsEditorOpen(true);
  };

  const handleDuplicate = (template: ProposalTemplate) => {
    const duplicated: Partial<ProposalTemplate> = {
      name: `${template.name} (Copy)`,
      code: `${template.code || 'TMPL'}-COPY`,
      description: template.description,
      category: template.category,
      isDefault: false,
      defaultStudentCount: template.defaultStudentCount,
      pricingItems: JSON.parse(JSON.stringify(template.pricingItems)),
      agreementDetails: JSON.parse(JSON.stringify(template.agreementDetails)),
    };

    storage.saveProposalTemplate(duplicated as any);
    loadTemplates();
    showNotification(`Duplicated template "${template.name}" successfully!`);
  };

  const handleDelete = (id: string, name: string) => {
    if (!canManage) return;
    if (window.confirm(`Are you sure you want to delete proposal template "${name}"?`)) {
      storage.deleteProposalTemplate(id);
      loadTemplates();
      showNotification(`Deleted template "${name}".`);
    }
  };

  const handleSetDefault = (id: string, name: string) => {
    storage.setDefaultProposalTemplate(id);
    loadTemplates();
    showNotification(`Set "${name}" as the default proposal template.`);
  };

  const handleResetToDefaults = () => {
    if (!canManage) return;
    if (
      window.confirm(
        'Reset all proposal templates back to the default Casbiro MYSAR official institutional packages?'
      )
    ) {
      storage.resetProposalTemplates();
      loadTemplates();
      showNotification('Reset all templates to official defaults.');
    }
  };

  // Pricing items row manipulations
  const handleAddPricingItem = () => {
    const newItem: ProposalTemplatePricingConfig = {
      id: `pi-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pricingType: 'Custom Module',
      pricePerStudent: 50,
      studentCount: formDefaultStudents,
      totalAmount: 50 * formDefaultStudents,
      description: 'Add-on module or specialized institutional feature package.',
      isPrimary: pricingItems.length === 0,
    };
    setPricingItems([...pricingItems, newItem]);
  };

  const handleUpdatePricingItem = (
    index: number,
    field: keyof ProposalTemplatePricingConfig,
    val: any
  ) => {
    const updated = [...pricingItems];
    (updated[index] as any)[field] = val;

    if (field === 'pricePerStudent' || field === 'studentCount') {
      const price = field === 'pricePerStudent' ? Number(val) || 0 : updated[index].pricePerStudent;
      const count = field === 'studentCount' ? Number(val) || 0 : updated[index].studentCount || formDefaultStudents;
      updated[index].totalAmount = price * count;
    }

    if (field === 'isPrimary' && val === true) {
      updated.forEach((item, i) => {
        if (i !== index) item.isPrimary = false;
      });
    }

    setPricingItems(updated);
  };

  const handleRemovePricingItem = (index: number) => {
    if (pricingItems.length === 1) {
      alert('A proposal template must contain at least one pricing item configuration.');
      return;
    }
    const updated = pricingItems.filter((_, i) => i !== index);
    if (!updated.some((item) => item.isPrimary) && updated.length > 0) {
      updated[0].isPrimary = true;
    }
    setPricingItems(updated);
  };

  // Schedule & terms manipulations
  const handleAddScheduleItem = () => {
    if (!newScheduleItem.trim()) return;
    setPaymentSchedule([...paymentSchedule, newScheduleItem.trim()]);
    setNewScheduleItem('');
  };

  const handleRemoveScheduleItem = (index: number) => {
    setPaymentSchedule(paymentSchedule.filter((_, i) => i !== index));
  };

  const handleAddPaymentTerm = () => {
    if (!newPaymentTerm.trim()) return;
    setPaymentTerms([...paymentTerms, newPaymentTerm.trim()]);
    setNewPaymentTerm('');
  };

  const handleRemovePaymentTerm = (index: number) => {
    setPaymentTerms(paymentTerms.filter((_, i) => i !== index));
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter a template name.');
      return;
    }

    const templateData: Partial<ProposalTemplate> = {
      id: editingTemplate ? editingTemplate.id : undefined,
      name: formName.trim(),
      code: formCode.trim() || `TMPL-${templates.length + 1}`,
      description: formDescription.trim(),
      category: formCategory,
      isDefault: formIsDefault,
      defaultStudentCount: Number(formDefaultStudents) || 500,
      pricingItems: pricingItems.map((item) => ({
        ...item,
        studentCount: Number(formDefaultStudents) || 500,
        totalAmount: (Number(item.pricePerStudent) || 0) * (Number(formDefaultStudents) || 500),
      })),
      agreementDetails: {
        agreementPeriod,
        registrationFee: Number(registrationFee) || 0,
        trialPrice: Number(trialPrice) || 0,
        trialAcademicYear,
        planChosen,
        hasSpecialPrice,
        specialPrice: hasSpecialPrice ? Number(specialPrice) || 0 : undefined,
        specialPriceLabel: hasSpecialPrice ? specialPriceLabel : undefined,
        paymentSchedule,
        paymentTerms,
        acceptanceClause,
        clientDesignation,
        companyAuthorizedPerson,
        companyDesignation,
      },
    };

    storage.saveProposalTemplate(templateData as any);
    loadTemplates();
    setIsEditorOpen(false);
    showNotification(
      editingTemplate
        ? `Updated template "${formName}" successfully!`
        : `Created new proposal template "${formName}"!`
    );
  };

  const filteredTemplates = templates.filter((t) => {
    if (categoryFilter !== 'All' && t.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = t.name.toLowerCase().includes(q);
      const matchCode = (t.code || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchPlan = t.pricingItems.some((pi) => pi.pricingType.toLowerCase().includes(q));
      return matchName || matchCode || matchDesc || matchPlan;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-200/80">
                <FileSignature className="w-5 h-5 text-[#168A45]" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Proposal Templates Master
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                {templates.length} Saved Presets
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl">
              Save, standardize, and reuse commercial pricing item tiers, registration fee structures, trial rates,
              and 5-year agreement text templates. When creating proposals for institutions, simply apply a template
              to instantly populate verified commercial terms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Restore standard institutional templates"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Factory Presets</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Proposal Template</span>
                </button>
              </>
            )}
          </div>
        </div>

        {savedSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-semibold flex items-center space-x-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{savedSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search template name, code, plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-gray-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:border-[#168A45] focus:bg-white"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="K-12 Schools">K-12 Schools</option>
            <option value="Colleges & Higher Ed">Colleges & Higher Ed</option>
            <option value="Private Academies">Private Academies</option>
            <option value="Government & Grants">Government & Grants</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-bold text-slate-800">{filteredTemplates.length}</span> of {templates.length} templates
        </div>
      </div>

      {/* Templates Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTemplates.map((template) => {
          const primaryItem = template.pricingItems.find((pi) => pi.isPrimary) || template.pricingItems[0];
          const totalVal = template.pricingItems.reduce(
            (sum, item) => sum + item.pricePerStudent * (template.defaultStudentCount || 500),
            0
          );

          return (
            <div
              key={template.id}
              className={`bg-white border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative ${
                template.isDefault
                  ? 'border-emerald-500/80 ring-1 ring-emerald-500/30 bg-linear-to-b from-emerald-50/20 to-white'
                  : 'border-gray-200'
              }`}
            >
              <div className="space-y-3">
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {template.code || 'TMPL'}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                        {template.category || 'General'}
                      </span>
                      {template.isDefault && (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>Default Template</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1.5 leading-snug">
                      {template.name}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewTemplate(template);
                        setIsPreviewOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Inspect full template details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDuplicate(template)}
                          className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Clone this template"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(template)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!template.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleDelete(template.id, template.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {template.description || 'Custom configuration of pricing tiers, trial prices, and 5-year agreement clauses.'}
                </p>

                {/* Pricing Breakdown Card */}
                <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Pricing Item Configuration ({template.pricingItems.length} tiers)</span>
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Basis: <b>{template.defaultStudentCount || 500} students</b>
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-0.5">
                    {template.pricingItems.map((item, idx) => (
                      <div key={item.id || idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1.5 truncate">
                          {item.isPrimary ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Primary
                            </span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                          )}
                          <span className="font-semibold text-slate-800 truncate">{item.pricingType}</span>
                        </div>
                        <div className="font-mono text-slate-900 font-bold shrink-0">
                          ₹{item.pricePerStudent}<span className="text-[10px] text-slate-400 font-normal">/student</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {template.agreementDetails.hasSpecialPrice && (
                    <div className="mt-1 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                      <span>Special Rate: {template.agreementDetails.specialPriceLabel || 'Special Price'}</span>
                      <span className="font-bold font-mono">₹{template.agreementDetails.specialPrice}/student</span>
                    </div>
                  )}
                </div>

                {/* Agreement & Commercial Clauses Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-medium uppercase block">Agreement Period</span>
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{template.agreementDetails.agreementPeriod || '5 Years'}</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-gray-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-medium uppercase block">Registration Fee</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {formatINR(template.agreementDetails.registrationFee || 0)}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-gray-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-medium uppercase block">Trial Price</span>
                    <span className="font-bold text-slate-800 font-mono">
                      ₹{template.agreementDetails.trialPrice || 0}/student
                    </span>
                  </div>

                  <div className="p-2.5 bg-white border border-gray-200 rounded-xl space-y-0.5">
                    <span className="text-[10px] text-slate-500 font-medium uppercase block">Milestones & Clauses</span>
                    <span className="font-semibold text-slate-700">
                      {template.agreementDetails.paymentSchedule?.length || 0} stages &bull;{' '}
                      {template.agreementDetails.paymentTerms?.length || 0} terms
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                {!template.isDefault && canManage && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(template.id, template.name)}
                    className="text-slate-500 hover:text-emerald-700 font-medium transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Star className="w-3.5 h-3.5 text-slate-400" />
                    <span>Set as Default</span>
                  </button>
                )}
                {template.isDefault && (
                  <span className="text-emerald-700 text-[11px] font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Applied by default</span>
                  </span>
                )}

                <div className="flex items-center space-x-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTemplate(template);
                      setIsPreviewOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Preview
                  </button>

                  {onSelectTemplateForProposal && (
                    <button
                      type="button"
                      onClick={() => onSelectTemplateForProposal(template)}
                      className="px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-lg text-xs transition-colors flex items-center space-x-1 cursor-pointer shadow-2xs"
                    >
                      <span>Use in Proposal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-gray-200 max-h-[92vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-800">
                  <FileSignature className="w-4 h-4 text-[#168A45]" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingTemplate ? 'Edit Proposal Template' : 'Create New Proposal Template'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tab Navigator */}
            <div className="flex items-center gap-2 pt-3 border-b border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setActiveFormTab('general')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  activeFormTab === 'general'
                    ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                1. Template Info
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('pricing')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeFormTab === 'pricing'
                    ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>2. Pricing Items ({pricingItems.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('agreement')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
                  activeFormTab === 'agreement'
                    ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span>3. Agreement & Terms ({paymentSchedule.length} stages)</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1">
              {/* TAB 1: GENERAL INFO */}
              {activeFormTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Template Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Standard 5-Year Institutional ERP Model"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#168A45]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Template Code</label>
                      <input
                        type="text"
                        placeholder="e.g. TMPL-INST-5Y"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Sector</label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        <option value="K-12 Schools">K-12 Schools</option>
                        <option value="Colleges & Higher Ed">Colleges & Higher Ed</option>
                        <option value="Private Academies">Private Academies</option>
                        <option value="Government & Grants">Government & Grants</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Default Student Count Basis
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formDefaultStudents}
                        onChange={(e) => setFormDefaultStudents(Number(e.target.value) || 500)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Scope</label>
                    <textarea
                      rows={3}
                      placeholder="Explain when and where this proposal template should be used..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs resize-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Default Proposal Template</span>
                      <span className="text-[11px] text-slate-500">
                        Automatically apply this template when generating new proposals from leads.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formIsDefault}
                        onChange={(e) => setFormIsDefault(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#168A45]" />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: PRICING ITEMS CONFIGURATION */}
              {activeFormTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Configure Commercial Pricing Items</h4>
                      <p className="text-[11px] text-slate-500">
                        Define pricing lines, primary rates, student subscriptions, and hardware items.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPricingItem}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0B5D2A] rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Pricing Line</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {pricingItems.map((item, index) => (
                      <div
                        key={item.id || index}
                        className={`p-3.5 rounded-xl border space-y-3 transition-all ${
                          item.isPrimary
                            ? 'bg-emerald-50/40 border-emerald-300'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-800">
                              Item #{index + 1}
                            </span>
                            {item.isPrimary && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Primary Proposal Plan
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => handleUpdatePricingItem(index, 'isPrimary', true)}
                              className={`text-[11px] font-semibold px-2 py-1 rounded transition-colors cursor-pointer ${
                                item.isPrimary
                                  ? 'text-emerald-800 bg-emerald-100'
                                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                              }`}
                            >
                              {item.isPrimary ? '✓ Set as Primary' : 'Make Primary'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemovePricingItem(index)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Plan / Tier Name
                            </label>
                            <input
                              type="text"
                              value={item.pricingType}
                              onChange={(e) => handleUpdatePricingItem(index, 'pricingType', e.target.value)}
                              placeholder="e.g. Institute Payment or School Premium with ID"
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Rate per Student (₹)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={item.pricePerStudent}
                              onChange={(e) =>
                                handleUpdatePricingItem(index, 'pricePerStudent', Number(e.target.value) || 0)
                              }
                              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            Line Item Description
                          </label>
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleUpdatePricingItem(index, 'description', e.target.value)}
                            placeholder="Deliverables included in this pricing tier..."
                            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>
                            Calculation: {formDefaultStudents} students &times; ₹{item.pricePerStudent}
                          </span>
                          <span className="font-bold font-mono text-slate-800">
                            Total: {formatINR(item.pricePerStudent * formDefaultStudents)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AGREEMENT TEXT & COMMERCIAL CLAUSES */}
              {activeFormTab === 'agreement' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">5-Year Agreement Details & Clauses</h4>
                    <p className="text-[11px] text-slate-500">
                      Standardize contract term, trial fees, milestone schedules, and signatory text.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Agreement Period</label>
                      <select
                        value={agreementPeriod}
                        onChange={(e) => setAgreementPeriod(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        <option value="5 Years">5 Years (Standard)</option>
                        <option value="3 Years">3 Years</option>
                        <option value="2 Years">2 Years</option>
                        <option value="1 Year">1 Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Registration Fee (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={registrationFee}
                        onChange={(e) => setRegistrationFee(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Trial Price / Student (₹)</label>
                      <input
                        type="number"
                        min="0"
                        value={trialPrice}
                        onChange={(e) => setTrialPrice(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Trial Academic Year</label>
                      <input
                        type="text"
                        value={trialAcademicYear}
                        onChange={(e) => setTrialAcademicYear(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Designated Plan</label>
                      <input
                        type="text"
                        value={planChosen}
                        onChange={(e) => setPlanChosen(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  {/* Special Rate Toggle */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Include Special Institutional Price</span>
                      <input
                        type="checkbox"
                        checked={hasSpecialPrice}
                        onChange={(e) => setHasSpecialPrice(e.target.checked)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    {hasSpecialPrice && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Special Price Label</label>
                          <input
                            type="text"
                            value={specialPriceLabel}
                            onChange={(e) => setSpecialPriceLabel(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Special Price (₹/student)</label>
                          <input
                            type="number"
                            value={specialPrice}
                            onChange={(e) => setSpecialPrice(Number(e.target.value) || 0)}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Schedule Milestones */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Payment Schedule Milestones ({paymentSchedule.length})
                    </label>
                    <div className="space-y-1.5">
                      {paymentSchedule.map((stg, i) => (
                        <div key={i} className="flex items-center space-x-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-slate-700">{stg}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveScheduleItem(i)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add new milestone (e.g. 50% upon deployment)..."
                        value={newScheduleItem}
                        onChange={(e) => setNewScheduleItem(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddScheduleItem}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Add Stage
                      </button>
                    </div>
                  </div>

                  {/* Payment Terms Clauses */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      Commercial Payment Terms & Conditions ({paymentTerms.length})
                    </label>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {paymentTerms.map((term, i) => (
                        <div key={i} className="flex items-start space-x-2 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <span className="text-slate-400 text-xs shrink-0 mt-0.5">•</span>
                          <span className="flex-1 text-slate-700">{term}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePaymentTerm(i)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add custom legal or commercial term..."
                        value={newPaymentTerm}
                        onChange={(e) => setNewPaymentTerm(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddPaymentTerm}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                      >
                        Add Term
                      </button>
                    </div>
                  </div>

                  {/* Acceptance Clause */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Agreement Acceptance Declaration (Page 14)
                    </label>
                    <textarea
                      rows={3}
                      value={acceptanceClause}
                      onChange={(e) => setAcceptanceClause(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs resize-none"
                    />
                  </div>

                  {/* Authorized Signatories */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Client Signatory Designation
                      </label>
                      <input
                        type="text"
                        value={clientDesignation}
                        onChange={(e) => setClientDesignation(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Company Signatory Name & Role
                      </label>
                      <input
                        type="text"
                        value={companyAuthorizedPerson}
                        onChange={(e) => setCompanyAuthorizedPerson(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between shrink-0">
                <div className="text-[11px] text-slate-500">
                  Step {activeFormTab === 'general' ? '1 of 3' : activeFormTab === 'pricing' ? '2 of 3' : '3 of 3'}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>

                  {activeFormTab !== 'agreement' ? (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFormTab(activeFormTab === 'general' ? 'pricing' : 'agreement')
                      }
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Next Step &rarr;
                    </button>
                  ) : (
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Save Template
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PREVIEW TEMPLATE MODAL */}
      {isPreviewOpen && previewTemplate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 max-h-[90vh] flex flex-col my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-800">
                  <Eye className="w-4 h-4 text-blue-700" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{previewTemplate.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">{previewTemplate.code}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-700 leading-relaxed">{previewTemplate.description}</p>
              </div>

              {/* Pricing breakdown */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>Configured Pricing Items ({previewTemplate.pricingItems.length})</span>
                </h4>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {previewTemplate.pricingItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold text-slate-900">{item.pricingType}</span>
                          {item.isPrimary && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                              Primary
                            </span>
                          )}
                        </div>
                        {item.description && <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>}
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-900 text-sm">₹{item.pricePerStudent}</span>
                        <span className="text-[10px] text-slate-400 block">/ student</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Agreement summary */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center space-x-1.5">
                  <FileSignature className="w-4 h-4 text-blue-700" />
                  <span>Agreement & Payment Terms</span>
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                  <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Period</span>
                      <span className="font-bold text-slate-800">{previewTemplate.agreementDetails.agreementPeriod}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Registration Fee</span>
                      <span className="font-bold font-mono text-slate-800">
                        {formatINR(previewTemplate.agreementDetails.registrationFee)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Trial Price</span>
                      <span className="font-bold font-mono text-slate-800">
                        ₹{previewTemplate.agreementDetails.trialPrice}/student
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Academic Year</span>
                      <span className="font-bold text-slate-800">
                        {previewTemplate.agreementDetails.trialAcademicYear}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Payment Schedule Milestones:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {previewTemplate.agreementDetails.paymentSchedule?.map((sch, i) => (
                        <li key={i}>{sch}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                      Commercial Terms:
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-700">
                      {previewTemplate.agreementDetails.paymentTerms?.map((term, i) => (
                        <li key={i}>{term}</li>
                      ))}
                    </ul>
                  </div>

                  {previewTemplate.agreementDetails.acceptanceClause && (
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">
                        Acceptance Clause:
                      </span>
                      <p className="text-slate-600 italic whitespace-pre-line">
                        "{previewTemplate.agreementDetails.acceptanceClause}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
              {onSelectTemplateForProposal && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplateForProposal(previewTemplate);
                    setIsPreviewOpen(false);
                  }}
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Use Template in Proposal
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
