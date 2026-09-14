import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Shield,
  Edit2,
  Trash2,
  Check,
  X,
  FileText,
  User,
  Building,
  Bell,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  CustomDocumentType,
  ExpiryDocument,
  NotificationChannel,
  STANDARD_REMINDER_OPTIONS,
  NOTIFICATION_CHANNEL_META,
} from '../../types/documentExpiry';

interface DocumentTypesSettingsTabProps {
  documentTypes: CustomDocumentType[];
  documents: ExpiryDocument[];
  onAddCustomType: (typeData: Omit<CustomDocumentType, 'id' | 'isStandard' | 'createdAt'>) => void;
  onUpdateCustomType: (type: CustomDocumentType) => void;
  onDeleteCustomType: (id: string) => void;
  departments?: string[];
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

export const DocumentTypesSettingsTab: React.FC<DocumentTypesSettingsTabProps> = ({
  documentTypes,
  documents,
  onAddCustomType,
  onUpdateCustomType,
  onDeleteCustomType,
  departments = DEFAULT_DEPARTMENTS,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<CustomDocumentType | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Custom');
  const [defaultDepartment, setDefaultDepartment] = useState('Admin');
  const [responsiblePerson, setResponsiblePerson] = useState('Compliance Lead');
  const [defaultReminders, setDefaultReminders] = useState<number[]>([60, 30, 15, 7, 1, 0]);
  const [defaultNotificationChannels, setDefaultNotificationChannels] = useState<
    NotificationChannel[]
  >(['email', 'system', 'dashboard']);
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditItem(null);
    setName('');
    setCode('');
    setDescription('');
    setCategory('Custom');
    setDefaultDepartment('Admin');
    setResponsiblePerson('Compliance Lead');
    setDefaultReminders([60, 30, 15, 7, 1, 0]);
    setDefaultNotificationChannels(['email', 'system', 'dashboard']);
    setFormError(null);
    setIsCreateOpen(true);
  };

  const openEditModal = (item: CustomDocumentType) => {
    setEditItem(item);
    setName(item.name);
    setCode(item.code);
    setDescription(item.description || '');
    setCategory(item.category);
    setDefaultDepartment(item.defaultDepartment || 'Admin');
    setResponsiblePerson(item.responsiblePerson || 'Compliance Lead');
    setDefaultReminders(item.defaultReminders || [60, 30, 15, 7, 1, 0]);
    setDefaultNotificationChannels(
      item.defaultNotificationChannels || ['email', 'system', 'dashboard']
    );
    setFormError(null);
    setIsCreateOpen(true);
  };

  const toggleReminder = (days: number) => {
    if (defaultReminders.includes(days)) {
      setDefaultReminders(defaultReminders.filter((d) => d !== days));
    } else {
      setDefaultReminders([...defaultReminders, days].sort((a, b) => b - a));
    }
  };

  const toggleChannel = (ch: NotificationChannel) => {
    if (defaultNotificationChannels.includes(ch)) {
      if (defaultNotificationChannels.length === 1) return;
      setDefaultNotificationChannels(defaultNotificationChannels.filter((c) => c !== ch));
    } else {
      setDefaultNotificationChannels([...defaultNotificationChannels, ch]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Please provide a Document Type Name.');
      return;
    }
    const generatedCode = code.trim()
      ? code.trim().toUpperCase()
      : `DOC_${name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15)}`;

    if (editItem) {
      onUpdateCustomType({
        ...editItem,
        name: name.trim(),
        code: generatedCode,
        description: description.trim(),
        category,
        defaultDepartment,
        responsiblePerson: responsiblePerson.trim(),
        defaultReminders,
        defaultNotificationChannels,
      });
    } else {
      onAddCustomType({
        name: name.trim(),
        code: generatedCode,
        description: description.trim(),
        category,
        defaultDepartment,
        responsiblePerson: responsiblePerson.trim(),
        defaultReminders,
        defaultNotificationChannels,
      });
    }

    setIsCreateOpen(false);
  };

  const customTypes = documentTypes.filter((t) => !t.isStandard);
  const standardTypes = documentTypes.filter((t) => t.isStandard);

  return (
    <div className="space-y-6">
      {/* 1. Explanatory Header Banner */}
      <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl border border-emerald-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">
              Document & Expiry Types Architecture
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed mt-0.5">
              Equipped with all <strong>18 industry-standard expiry categories</strong>. Administrators can dynamically register custom document types with preset reminder policies and department handlers for any future corporate compliance requirements.
            </p>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Expiry Type</span>
        </button>
      </div>

      {/* 2. Custom Document Types Section (If any) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              Custom Defined Document Types ({customTypes.length})
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
              User Extensible
            </span>
          </div>
        </div>

        {customTypes.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {customTypes.map((type) => {
              const count = documents.filter((d) => d.documentTypeId === type.id).length;
              return (
                <div
                  key={type.id}
                  className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2.5">
                      <h4 className="font-bold text-slate-800 text-sm">{type.name}</h4>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {type.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {count} Active Documents
                      </span>
                    </div>
                    {type.description && (
                      <p className="text-slate-500 text-xs">{type.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dept: {type.defaultDepartment || 'Admin'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Lead: {type.responsiblePerson || 'Compliance Lead'}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Reminders: {type.defaultReminders?.join(', ')}d</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(type)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Are you sure you want to delete custom type '${type.name}'?`
                          )
                        ) {
                          onDeleteCustomType(type.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer"
                      title="Delete Custom Type"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            <Info className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
            <p className="font-semibold text-slate-600">No custom document types created yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click "Add Custom Expiry Type" to introduce specialized categories for your organization.
            </p>
          </div>
        )}
      </div>

      {/* 3. Preset Standard Types Grid (18 Types Specified by User) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              Standard Document & Expiry Types (18 Presets)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              System Built-in
            </span>
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {standardTypes.map((type) => {
            const usageCount = documents.filter(
              (d) => d.documentTypeId === type.id || d.documentTypeName === type.name
            ).length;

            return (
              <div
                key={type.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold font-mono text-slate-400">
                      {type.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {usageCount} Tracked
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs mt-1">{type.name}</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                    {type.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Dept: {type.defaultDepartment}</span>
                  <span>{type.defaultReminders?.length || 6} Interval Reminders</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Modal: Add / Edit Custom Document Type */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Layers className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    {editItem ? 'Edit Custom Expiry Type' : 'Register New Custom Document Type'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Define metadata, default reminders, and responsible department
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Type Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Fire Safety NOC Expiry"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    System Code / Identifier
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. DOC_FIRE_NOC (Auto-generated if empty)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description & Scope</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what documents belong to this expiry type..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsible Department
                  </label>
                  <select
                    value={defaultDepartment}
                    onChange={(e) => setDefaultDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  >
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d} Department
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Responsible Person / Role
                  </label>
                  <input
                    type="text"
                    value={responsiblePerson}
                    onChange={(e) => setResponsiblePerson(e.target.value)}
                    placeholder="e.g. Facilities Lead"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Default Reminders */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Default Reminder Cadence
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {STANDARD_REMINDER_OPTIONS.map((opt) => {
                    const isSelected = defaultReminders.includes(opt.days);
                    return (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => toggleReminder(opt.days)}
                        className={`p-1.5 rounded-lg border text-left cursor-pointer flex items-center space-x-1.5 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-[#0B5D2A] font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-[#168A45] text-white border-[#168A45]'
                              : 'border-slate-300'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="text-[10px] truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default Notification Channels */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Default Channels
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(Object.keys(NOTIFICATION_CHANNEL_META) as NotificationChannel[]).map((ch) => {
                    const isSelected = defaultNotificationChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => toggleChannel(ch)}
                        className={`p-2 rounded-lg border text-left cursor-pointer flex items-center space-x-2 ${
                          isSelected
                            ? 'bg-purple-50 border-purple-500 text-purple-900 font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">
                          {ch === 'system' && '🔔'}
                          {ch === 'email' && '📧'}
                          {ch === 'sms' && '📱'}
                          {ch === 'whatsapp' && '💬'}
                          {ch === 'dashboard' && '🖥️'}
                        </span>
                        <span className="text-[11px] truncate">
                          {NOTIFICATION_CHANNEL_META[ch].label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-xl shadow-xs hover:shadow-md cursor-pointer"
                >
                  {editItem ? 'Save Changes' : 'Create Expiry Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
