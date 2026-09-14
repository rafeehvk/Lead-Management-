import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Calendar,
  DollarSign,
  User,
  Building,
  Upload,
  Bell,
  Check,
  AlertCircle,
  Shield,
  Layers,
} from 'lucide-react';
import {
  CustomDocumentType,
  ExpiryDocument,
  NotificationChannel,
  STANDARD_REMINDER_OPTIONS,
  NOTIFICATION_CHANNEL_META,
  DocumentStatus,
} from '../../types/documentExpiry';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (docData: Partial<ExpiryDocument>) => void;
  editDocument: ExpiryDocument | null;
  documentTypes: CustomDocumentType[];
  departments?: string[];
  currentUserName?: string;
}

const DEFAULT_DEPARTMENTS = [
  'Admin',
  'Finance',
  'HR',
  'IT',
  'Operations',
  'Legal',
  'Procurement',
  'Sales',
  'Management',
];

const RELATED_PARTY_TYPES = [
  'Supplier',
  'Customer',
  'Employee',
  'Government / Authority',
  'Institution',
  'Bank / Financial',
  'Other',
] as const;

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editDocument,
  documentTypes,
  departments = DEFAULT_DEPARTMENTS,
  currentUserName = 'Administrator',
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];

  const [documentTypeId, setDocumentTypeId] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [relatedParty, setRelatedParty] = useState<string>('');
  const [relatedPartyType, setRelatedPartyType] = useState<any>('Supplier');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [expiryDate, setExpiryDate] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('INR');
  const [responsiblePerson, setResponsiblePerson] = useState<string>(currentUserName);
  const [responsibleEmail, setResponsibleEmail] = useState<string>('');
  const [responsiblePhone, setResponsiblePhone] = useState<string>('');
  const [department, setDepartment] = useState<string>('Admin');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [attachmentSize, setAttachmentSize] = useState<string>('1.5 MB');
  const [remarks, setRemarks] = useState<string>('');
  const [status, setStatus] = useState<DocumentStatus>('Active');
  const [reminderDays, setReminderDays] = useState<number[]>([60, 30, 15, 7, 1, 0]);
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([
    'email',
    'system',
    'dashboard',
  ]);
  const [error, setError] = useState<string | null>(null);

  // Initialize on edit or type change
  useEffect(() => {
    if (editDocument) {
      setDocumentTypeId(editDocument.documentTypeId || '');
      setDocumentName(editDocument.documentName || '');
      setReferenceNumber(editDocument.referenceNumber || '');
      setRelatedParty(editDocument.relatedParty || '');
      setRelatedPartyType(editDocument.relatedPartyType || 'Supplier');
      setStartDate(editDocument.startDate || todayStr);
      setExpiryDate(editDocument.expiryDate || todayStr);
      setAmount(editDocument.amount || 0);
      setCurrency(editDocument.currency || 'INR');
      setResponsiblePerson(editDocument.responsiblePerson || currentUserName);
      setResponsibleEmail(editDocument.responsibleEmail || '');
      setResponsiblePhone(editDocument.responsiblePhone || '');
      setDepartment(editDocument.department || 'Admin');
      setAttachmentName(editDocument.attachmentName || '');
      setAttachmentSize(editDocument.attachmentSize || '1.5 MB');
      setRemarks(editDocument.remarks || '');
      setStatus(editDocument.status || 'Active');
      setReminderDays(editDocument.reminderDays || [60, 30, 15, 7, 1, 0]);
      setNotificationChannels(
        editDocument.notificationChannels || ['email', 'system', 'dashboard']
      );
    } else {
      // Default to first document type if available
      if (documentTypes.length > 0 && !documentTypeId) {
        const first = documentTypes[0];
        setDocumentTypeId(first.id);
        setDepartment(first.defaultDepartment || 'Admin');
        setReminderDays(first.defaultReminders || [60, 30, 15, 7, 1, 0]);
        setNotificationChannels(first.defaultNotificationChannels || ['email', 'system', 'dashboard']);
        if (first.responsiblePerson) {
          setResponsiblePerson(first.responsiblePerson);
        }
      }
    }
  }, [editDocument, isOpen]);

  // When user selects a document type in "Add" mode, automatically prefill default department, reminders, and channels
  const handleTypeChange = (newTypeId: string) => {
    setDocumentTypeId(newTypeId);
    if (!editDocument) {
      const selected = documentTypes.find((t) => t.id === newTypeId);
      if (selected) {
        if (selected.defaultDepartment) setDepartment(selected.defaultDepartment);
        if (selected.defaultReminders && selected.defaultReminders.length > 0) {
          setReminderDays(selected.defaultReminders);
        }
        if (selected.defaultNotificationChannels && selected.defaultNotificationChannels.length > 0) {
          setNotificationChannels(selected.defaultNotificationChannels);
        }
        if (selected.responsiblePerson) {
          setResponsiblePerson(selected.responsiblePerson);
        }
      }
    }
  };

  const handleQuickDuration = (monthsOrYears: number, unit: 'months' | 'years') => {
    try {
      const d = new Date(startDate || todayStr);
      if (unit === 'years') {
        d.setFullYear(d.getFullYear() + monthsOrYears);
      } else {
        d.setMonth(d.getMonth() + monthsOrYears);
      }
      setExpiryDate(d.toISOString().split('T')[0]);
    } catch {}
  };

  const toggleReminderDay = (day: number) => {
    if (reminderDays.includes(day)) {
      setReminderDays(reminderDays.filter((d) => d !== day));
    } else {
      setReminderDays([...reminderDays, day].sort((a, b) => b - a));
    }
  };

  const toggleChannel = (channel: NotificationChannel) => {
    if (notificationChannels.includes(channel)) {
      if (notificationChannels.length === 1) return; // keep at least one
      setNotificationChannels(notificationChannels.filter((c) => c !== channel));
    } else {
      setNotificationChannels([...notificationChannels, channel]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documentName.trim()) {
      setError('Please provide a Document Name/Title.');
      return;
    }
    if (!referenceNumber.trim()) {
      setError('Please provide a Reference Number (Invoice, Contract, or Policy ID).');
      return;
    }
    if (!startDate || !expiryDate) {
      setError('Please provide both Start and Expiry validity dates.');
      return;
    }
    if (new Date(expiryDate) <= new Date(startDate)) {
      setError('Expiry date must be strictly after the Start date.');
      return;
    }

    const selectedType = documentTypes.find((t) => t.id === documentTypeId);
    const documentTypeName = selectedType ? selectedType.name : 'Other / Custom Expiry';

    setError(null);
    onSave({
      id: editDocument?.id,
      documentTypeId,
      documentTypeName,
      documentName: documentName.trim(),
      referenceNumber: referenceNumber.trim(),
      relatedParty: relatedParty.trim() || 'Internal',
      relatedPartyType,
      startDate,
      expiryDate,
      amount: Number(amount) || 0,
      currency,
      responsiblePerson: responsiblePerson.trim() || currentUserName,
      responsibleEmail: responsibleEmail.trim(),
      responsiblePhone: responsiblePhone.trim(),
      department,
      attachmentName: attachmentName.trim() || undefined,
      attachmentSize: attachmentName ? attachmentSize : undefined,
      remarks: remarks.trim(),
      status,
      reminderDays,
      notificationChannels,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {editDocument ? 'Edit Document Record' : 'Register New Document & Expiry Tracking'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure validity dates, reminders (90d to 0d), and multi-channel notifications
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Classification & Core Identifiers */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3">
            <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-700" />
              <span>1. Classification & Document Identity</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document / Expiry Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={documentTypeId}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
                >
                  <optgroup label="Custom Document Types (Created by Admin)">
                    {documentTypes
                      .filter((t) => t.category === 'Custom')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          ⭐ {t.name} ({t.code})
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="Standard Document Types (18 Preset)">
                    {documentTypes
                      .filter((t) => t.category === 'Standard')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Document Title / Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g. AWS Production Database Cluster Subscription"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference / Contract / Policy No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="e.g. POL-99214 or INV-2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Related Party (Supplier, Client, Agency)
                </label>
                <input
                  type="text"
                  value={relatedParty}
                  onChange={(e) => setRelatedParty(e.target.value)}
                  placeholder="e.g. Amazon Web Services, BSI, HDFC"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Related Party Type</label>
                <select
                  value={relatedPartyType}
                  onChange={(e) => setRelatedPartyType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                >
                  {RELATED_PARTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Validity Period & Quick Add */}
          <div className="p-4 bg-emerald-50/40 border border-emerald-200/70 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#0B5D2A] text-xs flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#168A45]" />
                <span>2. Validity Period</span>
              </span>

              {/* Quick Presets */}
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-400 mr-1">Quick Set Expiry:</span>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(6, 'months')}
                  className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-[#0B5D2A] hover:bg-emerald-100 font-semibold cursor-pointer text-[10px]"
                >
                  +6 Mos
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(1, 'years')}
                  className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-[#0B5D2A] hover:bg-emerald-100 font-semibold cursor-pointer text-[10px]"
                >
                  +1 Year
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(2, 'years')}
                  className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-[#0B5D2A] hover:bg-emerald-100 font-semibold cursor-pointer text-[10px]"
                >
                  +2 Yrs
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDuration(3, 'years')}
                  className="px-2 py-0.5 rounded bg-white border border-emerald-300 text-[#0B5D2A] hover:bg-emerald-100 font-semibold cursor-pointer text-[10px]"
                >
                  +3 Yrs
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Start Date (Effective From) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Expiry Date (End of Validity) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={expiryDate}
                  min={startDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Department, Responsible Person & Financial Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Responsible Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-medium"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d} Department
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Responsible Person</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={responsiblePerson}
                  onChange={(e) => setResponsiblePerson(e.target.value)}
                  placeholder="e.g. Arun Kumar"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Renewal Amount & Currency</label>
              <div className="flex space-x-1.5">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-semibold"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="AED">AED</option>
                  <option value="SAR">SAR</option>
                  <option value="EUR">€ EUR</option>
                </select>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-semibold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Responsible Email (for automated email dispatch)
              </label>
              <input
                type="email"
                value={responsibleEmail}
                onChange={(e) => setResponsibleEmail(e.target.value)}
                placeholder="responsible.person@casbiro.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Responsible Phone (for WhatsApp / SMS alert dispatch)
              </label>
              <input
                type="text"
                value={responsiblePhone}
                onChange={(e) => setResponsiblePhone(e.target.value)}
                placeholder="+91 98470 12345"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
              />
            </div>
          </div>

          {/* Section 4: Automated Reminder Configuration */}
          <div className="p-4 bg-indigo-50/40 border border-indigo-200/70 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-950 text-xs flex items-center space-x-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-600" />
                <span>3. Automated Reminder Intervals</span>
              </span>
              <span className="text-[10px] text-indigo-700">Select all intervals to trigger</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {STANDARD_REMINDER_OPTIONS.map((opt) => {
                const isSelected = reminderDays.includes(opt.days);
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => toggleReminderDay(opt.days)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center border shrink-0 ${
                        isSelected ? 'bg-white text-indigo-600 border-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="text-[11px] font-semibold">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Notification Channels */}
          <div className="p-4 bg-purple-50/40 border border-purple-200/70 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-950 text-xs flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-600" />
                <span>4. Notification Channels (Select 1 or more)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {(Object.keys(NOTIFICATION_CHANNEL_META) as NotificationChannel[]).map((ch) => {
                const meta = NOTIFICATION_CHANNEL_META[ch];
                const isSelected = notificationChannels.includes(ch);
                return (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => toggleChannel(ch)}
                    className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-purple-400 ring-2 ring-purple-400/40 shadow-xs'
                        : 'bg-white/60 border-slate-200 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 text-xs ${
                        isSelected ? meta.color : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {ch === 'system' && '🔔'}
                      {ch === 'email' && '📧'}
                      {ch === 'sms' && '📱'}
                      {ch === 'whatsapp' && '💬'}
                      {ch === 'dashboard' && '🖥️'}
                    </div>
                    <span className="font-bold text-[11px] text-slate-800">{meta.label}</span>
                    <span className="text-[9px] text-slate-400 leading-tight line-clamp-1 mt-0.5">
                      {meta.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 6: Upload Attachment & Remarks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Document / Certificate Attachment (PDF / Image)
              </label>
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-3 bg-slate-50 text-center transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="e.g. License_Certificate_2026.pdf"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-center focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Simulate document upload by entering filename
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Compliance Remarks & Notes</label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Additional notes, escalation procedures, clauses, or statutory references..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {editDocument ? 'Update Document' : 'Save Document & Arm Reminders'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
