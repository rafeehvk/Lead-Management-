import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Upload,
  Trash2,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  PartyMaster,
  PartyType,
  GSTRegistrationType,
  PartyDocument,
} from '../../../types/finance';
import { validateGSTIN, validatePAN, GST_STATE_CODES } from '../../../utils/gstUtils';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface PartyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (savedParty: PartyMaster) => void;
  initialParty?: PartyMaster | null;
}

const CATEGORY_PRESETS: Record<PartyType, string[]> = {
  Customer: ['Retail', 'Corporate', 'Institution', 'Distributor', 'Dealer', 'Government', 'NGO', 'Other'],
  Vendor: ['Supplier', 'Service Provider', 'Contractor', 'Manufacturer', 'Dealer', 'Other'],
  'Customer & Vendor': ['Corporate', 'Institution', 'Government', 'Manufacturer', 'Contractor', 'Other'],
};

export const PartyFormModal: React.FC<PartyFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialParty,
}) => {
  const isEdit = Boolean(initialParty?.id);

  // Form states
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<PartyType>('Customer');
  const [category, setCategory] = useState('Corporate');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [city, setCity] = useState('Kochi');
  const [state, setState] = useState('Kerala');
  const [stateCode, setStateCode] = useState('32');
  const [country, setCountry] = useState('India');

  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [gstType, setGstType] = useState<GSTRegistrationType>('Regular');
  const [placeOfSupply, setPlaceOfSupply] = useState('32-Kerala');

  const [creditLimit, setCreditLimit] = useState(500000);
  const [creditLimitAction, setCreditLimitAction] = useState<'Block' | 'Warning' | 'Approval'>('Warning');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [openingBalance, setOpeningBalance] = useState(0);
  const [balanceDirection, setBalanceDirection] = useState<'Dr' | 'Cr'>('Dr');

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [beneficiaryName, setBeneficiaryName] = useState('');

  const [documents, setDocuments] = useState<PartyDocument[]>([]);
  const [status, setStatus] = useState<PartyMaster['status']>('Active');
  const [notes, setNotes] = useState('');

  const [activeTab, setActiveTab] = useState<'general' | 'contact' | 'gst' | 'financial' | 'bank' | 'docs'>('general');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Load existing party data if editing
  useEffect(() => {
    if (initialParty) {
      setName(initialParty.name || '');
      setLegalName(initialParty.legalName || initialParty.name || '');
      setCode(initialParty.code || '');
      setType(initialParty.type || 'Customer');

      const presets = CATEGORY_PRESETS[initialParty.type] || [];
      if (presets.includes(initialParty.category)) {
        setCategory(initialParty.category);
        setIsCustomCategory(false);
      } else {
        setCategory('Other');
        setCustomCategory(initialParty.category);
        setIsCustomCategory(true);
      }

      setContactPerson(initialParty.contactPerson || '');
      setPhone(initialParty.phone || '');
      setWhatsapp(initialParty.whatsapp || initialParty.phone || '');
      setEmail(initialParty.email || '');

      setBillingAddress(initialParty.billingAddress || '');
      setShippingAddress(initialParty.shippingAddress || initialParty.billingAddress || '');
      setCity(initialParty.city || 'Kochi');
      setState(initialParty.state || 'Kerala');
      setStateCode(initialParty.stateCode || '32');
      setCountry(initialParty.country || 'India');

      setGstin(initialParty.gstin || '');
      setPan(initialParty.pan || '');
      setGstType(initialParty.gstType || 'Regular');
      setPlaceOfSupply(initialParty.placeOfSupply || '32-Kerala');

      setCreditLimit(initialParty.creditLimit || 0);
      setCreditLimitAction((initialParty.creditLimitAction as any) || 'Warning');
      setPaymentTerms(initialParty.paymentTerms || 'Net 30');

      if (initialParty.openingBalance < 0) {
        setOpeningBalance(Math.abs(initialParty.openingBalance));
        setBalanceDirection('Cr');
      } else {
        setOpeningBalance(initialParty.openingBalance || 0);
        setBalanceDirection('Dr');
      }

      if (initialParty.bankDetails) {
        setBankName(initialParty.bankDetails.bankName || '');
        setAccountNumber(initialParty.bankDetails.accountNumber || '');
        setIfscCode(initialParty.bankDetails.ifscCode || '');
        setBranch(initialParty.bankDetails.branch || '');
        setBeneficiaryName(initialParty.bankDetails.beneficiaryName || '');
      }

      setDocuments(initialParty.documents || []);
      setStatus(initialParty.status || 'Active');
      setNotes(initialParty.notes || '');
    } else {
      // Reset form
      setName('');
      setLegalName('');
      setCode('');
      setType('Customer');
      setCategory('Corporate');
      setIsCustomCategory(false);
      setCustomCategory('');
      setContactPerson('');
      setPhone('');
      setWhatsapp('');
      setEmail('');
      setBillingAddress('');
      setShippingAddress('');
      setCity('Kochi');
      setState('Kerala');
      setStateCode('32');
      setCountry('India');
      setGstin('');
      setPan('');
      setGstType('Regular');
      setPlaceOfSupply('32-Kerala');
      setCreditLimit(500000);
      setCreditLimitAction('Warning');
      setPaymentTerms('Net 30');
      setOpeningBalance(0);
      setBalanceDirection('Dr');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setBranch('');
      setBeneficiaryName('');
      setDocuments([]);
      setStatus('Active');
      setNotes('');
    }
    setValidationError(null);
  }, [initialParty, isOpen]);

  // Real-time GSTIN validation
  const gstValidation = useMemo(() => {
    if (!gstin.trim()) return null;
    return validateGSTIN(gstin);
  }, [gstin]);

  // Auto-fill state and PAN from GSTIN if valid
  const handleGstinChange = (val: string) => {
    const uppercaseVal = val.toUpperCase().trim();
    setGstin(uppercaseVal);

    if (uppercaseVal.length >= 12) {
      const extractedPan = uppercaseVal.substring(2, 12);
      if (/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(extractedPan) && !pan) {
        setPan(extractedPan);
      }
    }

    if (uppercaseVal.length >= 2) {
      const code = uppercaseVal.substring(0, 2);
      const stateMatch = GST_STATE_CODES.find((s) => s.code === code);
      if (stateMatch) {
        setStateCode(code);
        setState(stateMatch.name);
        setPlaceOfSupply(`${code}-${stateMatch.name}`);
      }
    }
  };

  // Real-time duplicate check
  const duplicateCheck = useMemo(() => {
    if (!isOpen) return { isDuplicate: false, matches: [] };
    return erpFinanceStorage.checkPartyDuplicates({
      gstin: gstin.trim() || undefined,
      pan: pan.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      name: name.trim() || undefined,
      excludeId: initialParty?.id,
    });
  }, [gstin, pan, phone, email, name, initialParty?.id, isOpen]);

  // Handle document upload simulation
  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newDoc: PartyDocument = {
      id: `DOC-${Date.now().toString().slice(-4)}`,
      name: file.name.replace(/\.[^/.]+$/, ''),
      type: file.name.toLowerCase().includes('gst')
        ? 'GST Certificate'
        : file.name.toLowerCase().includes('pan')
        ? 'PAN Card'
        : file.name.toLowerCase().includes('msme')
        ? 'MSME / Udyam'
        : 'Agreement / Contract',
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(0)} KB`,
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    setDocuments([...documents, newDoc]);
    e.target.value = '';
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments(documents.filter((d) => d.id !== docId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('Party Name is mandatory.');
      setActiveTab('general');
      return;
    }

    if (gstin.trim() && gstValidation && !gstValidation.formatValid) {
      setValidationError(`Invalid GSTIN format: ${gstValidation.error}`);
      setActiveTab('gst');
      return;
    }

    const calculatedOpeningBalance = balanceDirection === 'Cr' ? -Math.abs(openingBalance) : Math.abs(openingBalance);
    const finalCategory = isCustomCategory ? customCategory.trim() || 'General' : category;

    const payload: Partial<PartyMaster> & { name: string; type: PartyType } = {
      id: initialParty?.id,
      code: code.trim() || undefined,
      name: name.trim(),
      legalName: legalName.trim() || name.trim(),
      type,
      category: finalCategory,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      email: email.trim(),
      billingAddress: billingAddress.trim(),
      shippingAddress: shippingAddress.trim() || billingAddress.trim(),
      city: city.trim(),
      state: state.trim(),
      stateCode: stateCode.trim(),
      country: country.trim() || 'India',
      gstin: gstin.trim().toUpperCase() || undefined,
      pan: pan.trim().toUpperCase() || undefined,
      gstType,
      placeOfSupply,
      creditLimit: Number(creditLimit) || 0,
      creditLimitAction,
      paymentTerms,
      openingBalance: calculatedOpeningBalance,
      status,
      notes: notes.trim(),
      documents,
    };

    if (bankName.trim() || accountNumber.trim()) {
      payload.bankDetails = {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        branch: branch.trim(),
        beneficiaryName: beneficiaryName.trim() || legalName.trim() || name.trim(),
      };
    }

    try {
      const saved = erpFinanceStorage.saveParty(payload);
      onSave(saved);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to save party master.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? `Edit Party: ${initialParty?.name}` : 'New Party Master Registration'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified entity profile for Customers, Vendors, and Dual Trading Partners
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateCheck.isDuplicate && (
          <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-semibold">Potential Duplicate Entity Detected: </span>
              {duplicateCheck.matches.map((m, idx) => (
                <span key={idx} className="mr-2">
                  Matching {m.field} ({m.value}) with{' '}
                  <strong className="underline">{m.existingParty.name}</strong> ({m.existingParty.code})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 flex items-center gap-2 text-xs text-red-700">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 bg-white overflow-x-auto scrollbar-none text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            1. General & Classification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'contact'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Contact & Address
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gst')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'gst'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            3. GSTIN & Tax Compliance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'financial'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Credit & Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'bank'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            5. Bank Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            6. Documents & Notes ({documents.length})
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: General & Classification */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Party Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Technologies Pvt Ltd"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Legal / Registered Entity Name
                  </label>
                  <input
                    type="text"
                    placeholder="As registered with Ministry of Corporate Affairs / GST"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Party Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Party Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={type}
                    onChange={(e) => {
                      const newType = e.target.value as PartyType;
                      setType(newType);
                      const presets = CATEGORY_PRESETS[newType];
                      if (!presets.includes(category)) {
                        setCategory(presets[0]);
                        setIsCustomCategory(false);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Customer">Customer (Sales & Receivables)</option>
                    <option value="Vendor">Vendor (Purchases & Payables)</option>
                    <option value="Customer & Vendor">Customer & Vendor (Dual Partner)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {type === 'Customer & Vendor'
                      ? 'Participates in both sales and purchase transactions from a single ledger profile.'
                      : type === 'Customer'
                      ? 'Entity that purchases products and services from your company.'
                      : 'Entity that supplies raw materials, equipment, or contracted services.'}
                  </p>
                </div>

                {/* Party Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Party Category <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={isCustomCategory ? 'Other' : category}
                      onChange={(e) => {
                        if (e.target.value === 'Other') {
                          setIsCustomCategory(true);
                          setCategory('Other');
                        } else {
                          setIsCustomCategory(false);
                          setCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      {CATEGORY_PRESETS[type].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {isCustomCategory && (
                      <input
                        type="text"
                        placeholder="Enter custom category name..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-blue-50/20"
                      />
                    )}
                  </div>
                </div>

                {/* Status & Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Active">Active (Permit All Transactions)</option>
                    <option value="Under Review">Under Review (KYC Verification)</option>
                    <option value="On Hold">On Hold (Temporary Stop)</option>
                    <option value="Blacklisted">Blacklisted (Strict Block)</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Unique Party Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Party Code / Reference ID
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if left blank (e.g. CUST-1042)"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Internal Notes / Tags
                  </label>
                  <input
                    type="text"
                    placeholder="Contract notes, key client tag, special terms..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Contact & Address */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Person Name & Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Suresh Nambiar (Director)"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Official Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 94471 23456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    WhatsApp Business Contact
                  </label>
                  <input
                    type="text"
                    placeholder="+91 94471 23456"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Billing Email Address (Invoices & Statements)
                </label>
                <input
                  type="email"
                  placeholder="accounts@clientdomain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Address (for GST Tax Invoices)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Building, street, tech park..."
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shipping / Delivery Address (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Leave blank if identical to billing address"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State Code</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GSTIN & Tax Compliance */}
          {activeTab === 'gst' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GSTIN Input with Checksum Validation Badge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN (15-Digit Goods & Services Tax Number)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="e.g. 32AACTA9876C1Z3"
                      value={gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                    {gstValidation && (
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                        {gstValidation.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Checksum Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <AlertTriangle className="w-3.5 h-3.5" /> Checksum Mismatch
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {gstValidation?.error && (
                    <p className="text-xs text-amber-600 mt-1">{gstValidation.error}</p>
                  )}
                  {gstValidation?.isValid && (
                    <p className="text-xs text-emerald-600 mt-1">
                      Validated GSTN entity for State: <strong>{gstValidation.stateName}</strong> (Code: {gstValidation.stateCode}), PAN: <strong>{gstValidation.pan}</strong>
                    </p>
                  )}
                </div>

                {/* PAN Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. AACTA9876C"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase().trim())}
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">10-character alphanumeric PAN used for TDS and Income Tax filing</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GST Registration Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GST Registration Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gstType}
                    onChange={(e) => setGstType(e.target.value as GSTRegistrationType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Regular">Regular Taxpayer (Issues Tax Invoices / Claims ITC)</option>
                    <option value="Composition">Composition Dealer (Turnover &lt; ₹1.5 Cr / No ITC)</option>
                    <option value="SEZ">Special Economic Zone (SEZ Unit / Zero-rated)</option>
                    <option value="Unregistered">Unregistered Entity (No GSTIN)</option>
                    <option value="Consumer">Consumer / End User (B2C)</option>
                  </select>
                </div>

                {/* Place of Supply */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Place of Supply (GST Jurisdiction) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={placeOfSupply}
                    onChange={(e) => {
                      setPlaceOfSupply(e.target.value);
                      const code = e.target.value.substring(0, 2);
                      const stateObj = GST_STATE_CODES.find((s) => s.code === code);
                      if (stateObj) {
                        setStateCode(code);
                        setState(stateObj.name);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {GST_STATE_CODES.map((s) => (
                      <option key={s.code} value={`${s.code}-${s.name}`}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Determines CGST + SGST (intra-state: 32-Kerala) vs. IGST (inter-state).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Credit & Terms */}
          {activeTab === 'financial' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Credit Limit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Limit (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="500000"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Maximum authorized credit exposure. Set to 0 for unlimited.</p>
                </div>

                {/* Credit Limit Enforcement */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Limit Enforcement Rule <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={creditLimitAction}
                    onChange={(e) => setCreditLimitAction(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  >
                    <option value="Block">Block — Hard prevent transaction when limit breached</option>
                    <option value="Warning">Warning — Show warning banner but permit billing</option>
                    <option value="Approval">Approval — Requires Finance Manager / Director approval</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Applies to Sales Orders and Invoices when outstanding exceeds limit.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Payment Terms */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="Immediate">Immediate / Advance Payment</option>
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days (Standard)</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Net 60">Net 60 Days (Institutional)</option>
                  </select>
                </div>

                {/* Opening Balance */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Opening Balance (At Start / Go-Live)
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={balanceDirection}
                      onChange={(e) => setBalanceDirection(e.target.value as any)}
                      className="w-32 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white font-medium"
                    >
                      <option value="Dr">Debit (Receivable)</option>
                      <option value="Cr">Credit (Payable)</option>
                    </select>
                    <input
                      type="number"
                      min={0}
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(Number(e.target.value))}
                      className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg font-medium"
                      placeholder="Amount ₹"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Debit: Customer owes company. Credit: Company owes vendor.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Bank Details */}
          {activeTab === 'bank' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Primary bank disbursement details for vendor settlements and payment receipts.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank / State Bank of India"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Beneficiary Account Name
                  </label>
                  <input
                    type="text"
                    placeholder="Name as it appears on bank passbook"
                    value={beneficiaryName}
                    onChange={(e) => setBeneficiaryName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 50200012345678"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="e.g. HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm font-mono uppercase border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch City & Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kakkanad InfoPark Branch, Kochi"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {/* TAB 6: Documents & Notes */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-800">Compliance & KYC Documents</h3>
                  <p className="text-[11px] text-slate-500">
                    GST Certificate, PAN Copy, MSME Udyam, Service Agreement, or Cancelled Cheque
                  </p>
                </div>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-medium border border-blue-200">
                  <Upload className="w-3.5 h-3.5" />
                  Upload Document
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    onChange={handleAddDocument}
                  />
                </label>
              </div>

              {/* Documents List */}
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                {documents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No documents attached yet. Click "Upload Document" to attach GSTIN certificates or contracts.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-xs font-medium text-slate-900">{doc.fileName}</p>
                          <p className="text-[11px] text-slate-400">
                            {doc.type} • {doc.fileSize} • Uploaded {doc.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"
                        title="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              * Required fields. All changes are logged to the Finance Audit Trail.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                {isEdit ? 'Save Party Changes' : 'Register Party'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
