import React, { useState, useRef } from 'react';
import {
  IdCardTemplateSettings,
  IdCardFieldConfig,
  StaffMember,
  HrSettingsConfig,
} from '../../types/hr';
import { StaffIdCardRenderer } from './StaffIdCardRenderer';
import { hrStorage } from '../../services/hrStorageService';
import {
  Upload,
  Image,
  Sliders,
  Type,
  Check,
  Trash2,
  Plus,
  Printer,
  Eye,
  EyeOff,
  RotateCw,
  Sparkles,
  Move,
  Palette,
  Shield,
  FileText,
  Save,
  CheckCircle2,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Info,
} from 'lucide-react';

interface IdCardSettingsViewProps {
  settings: HrSettingsConfig;
  onSaveSettings: (settings: HrSettingsConfig) => void;
}

export const IdCardSettingsView: React.FC<IdCardSettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  // Load initial ID card template settings
  const [template, setTemplate] = useState<IdCardTemplateSettings>(() => {
    return settings.idCardSettings || hrStorage.getIdCardSettings();
  });

  const [activeTab, setActiveTab] = useState<'template' | 'photo' | 'fields' | 'back'>('template');
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('photo');
  const [previewStaffList] = useState<StaffMember[]>(() => hrStorage.getStaff());
  const [selectedStaffIndex, setSelectedStaffIndex] = useState(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [cardScale, setCardScale] = useState(1);
  const [isAddingField, setIsAddingField] = useState(false);
  const [newFieldType, setNewFieldType] = useState<string>('bloodGroup');
  const [customFieldLabel, setCustomFieldLabel] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');

  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);

  const selectedStaff = previewStaffList[selectedStaffIndex] || null;

  // Save changes
  const handleSave = () => {
    hrStorage.saveIdCardSettings(template);
    const updatedConfig: HrSettingsConfig = {
      ...settings,
      idCardSettings: template,
    };
    onSaveSettings(updatedConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Upload background template image (Front or Back)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back' | 'logo' | 'signature'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (side === 'front') {
        setTemplate((prev) => ({
          ...prev,
          backgroundImage: dataUrl,
          useFullBackgroundArtwork: true, // Automatically enable full background overlay when uploaded
        }));
      } else if (side === 'back') {
        setTemplate((prev) => ({
          ...prev,
          backBackgroundImage: dataUrl,
        }));
      } else if (side === 'logo') {
        setTemplate((prev) => ({
          ...prev,
          logoUrl: dataUrl,
        }));
      } else if (side === 'signature') {
        setTemplate((prev) => ({
          ...prev,
          authorizedSignatureImage: dataUrl,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Move a field on the canvas
  const handleMoveField = (fieldId: string, newX: number, newY: number) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, x: newX, y: newY } : f)),
    }));
  };

  // Nudge field by delta
  const nudgeField = (fieldId: string, dx: number, dy: number) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const nx = Math.max(0, Math.min(100, f.x + dx));
        const ny = Math.max(0, Math.min(100, f.y + dy));
        return { ...f, x: nx, y: ny };
      }),
    }));
  };

  // Toggle field visibility
  const toggleFieldVisibility = (fieldId: string) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, visible: !f.visible } : f)),
    }));
  };

  // Update a field's properties
  const updateField = (fieldId: string, updates: Partial<IdCardFieldConfig>) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    }));
  };

  // Remove a field
  const removeField = (fieldId: string) => {
    setTemplate((prev) => ({
      ...prev,
      fields: prev.fields.filter((f) => f.id !== fieldId),
    }));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  // Add a new field
  const handleAddField = () => {
    let newField: IdCardFieldConfig;

    if (newFieldType === 'custom') {
      const fieldId = `custom_${Date.now()}`;
      newField = {
        id: fieldId,
        label: customFieldLabel.trim() || 'Custom Note',
        type: 'text',
        visible: true,
        x: 50,
        y: 70,
        fontSize: 11,
        fontWeight: 'normal',
        color: '#0F172A',
        textAlign: 'center',
        showLabel: true,
        customPrefix: `${customFieldLabel}: `,
        customValue: customFieldValue || 'Value',
        isCustom: true,
      };
    } else {
      const fieldPresets: Record<string, Partial<IdCardFieldConfig>> = {
        bloodGroup: {
          label: 'Blood Group',
          type: 'text',
          fontSize: 11,
          fontWeight: 'semibold',
          color: '#B91C1C',
          textAlign: 'left',
          showLabel: true,
          customPrefix: 'Blood: ',
        },
        emergencyPhone: {
          label: 'Emergency Contact',
          type: 'text',
          fontSize: 11,
          fontWeight: 'semibold',
          color: '#1E293B',
          textAlign: 'right',
          showLabel: true,
          customPrefix: 'Emerg: ',
        },
        joiningDate: {
          label: 'Date of Joining',
          type: 'text',
          fontSize: 10,
          fontWeight: 'normal',
          color: '#64748B',
          textAlign: 'center',
          showLabel: true,
          customPrefix: 'Joined: ',
        },
        validUntil: {
          label: 'Valid Upto',
          type: 'text',
          fontSize: 10,
          fontWeight: 'medium',
          color: '#64748B',
          textAlign: 'center',
          showLabel: true,
          customPrefix: 'Valid: ',
        },
        workLocation: {
          label: 'Work Campus',
          type: 'text',
          fontSize: 10,
          fontWeight: 'normal',
          color: '#475569',
          textAlign: 'center',
          showLabel: true,
          customPrefix: 'Campus: ',
        },
        contactNumber: {
          label: 'Contact Phone',
          type: 'text',
          fontSize: 10,
          fontWeight: 'normal',
          color: '#334155',
          textAlign: 'center',
          showLabel: true,
          customPrefix: 'Tel: ',
        },
        email: {
          label: 'Staff Email',
          type: 'text',
          fontSize: 9,
          fontWeight: 'normal',
          color: '#475569',
          textAlign: 'center',
          showLabel: false,
        },
        qrCode: {
          label: 'QR Code (Digital Auth)',
          type: 'qrcode',
          width: 44,
          height: 44,
        },
        barcode: {
          label: 'Barcode (Gate Scanner)',
          type: 'barcode',
          width: 140,
          height: 24,
        },
        signature: {
          label: 'Authorized Signatory',
          type: 'signature',
          fontSize: 9,
          fontWeight: 'semibold',
          color: '#475569',
          textAlign: 'center',
        },
      };

      const preset = fieldPresets[newFieldType] || {};
      const exists = template.fields.find((f) => f.id === newFieldType);
      if (exists) {
        // If already exists, just make sure it's visible and select it
        updateField(newFieldType, { visible: true });
        setSelectedFieldId(newFieldType);
        setIsAddingField(false);
        return;
      }

      newField = {
        id: newFieldType,
        label: preset.label || newFieldType,
        type: (preset.type as any) || 'text',
        visible: true,
        x: 50,
        y: 72,
        ...preset,
      };
    }

    setTemplate((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));

    setSelectedFieldId(newField.id);
    setIsAddingField(false);
    setCustomFieldLabel('');
    setCustomFieldValue('');
  };

  // Preset Template themes
  const applyPreset = (presetName: string) => {
    if (presetName === 'emerald') {
      setTemplate((prev) => ({
        ...prev,
        templateName: 'Casbiro Executive Emerald',
        headerBgColor: '#0B5D2A',
        headerTextColor: '#FFFFFF',
        accentColor: '#168A45',
        photoBorderColor: '#168A45',
        photoShape: 'circle',
        useFullBackgroundArtwork: false,
      }));
    } else if (presetName === 'sapphire') {
      setTemplate((prev) => ({
        ...prev,
        templateName: 'Sapphire Academic Modern',
        headerBgColor: '#1E3A8A',
        headerTextColor: '#FFFFFF',
        accentColor: '#3B82F6',
        photoBorderColor: '#2563EB',
        photoShape: 'rounded',
        useFullBackgroundArtwork: false,
      }));
    } else if (presetName === 'ruby') {
      setTemplate((prev) => ({
        ...prev,
        templateName: 'Ruby Corporate Executive',
        headerBgColor: '#881337',
        headerTextColor: '#FFFFFF',
        accentColor: '#E11D48',
        photoBorderColor: '#BE123C',
        photoShape: 'circle',
        useFullBackgroundArtwork: false,
      }));
    } else if (presetName === 'slate') {
      setTemplate((prev) => ({
        ...prev,
        templateName: 'Minimalist Slate Dark',
        headerBgColor: '#0F172A',
        headerTextColor: '#F8FAFC',
        accentColor: '#10B981',
        photoBorderColor: '#0F172A',
        photoShape: 'rounded',
        useFullBackgroundArtwork: false,
      }));
    }
  };

  const selectedField = template.fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Action Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
              Staff Identity
            </span>
            <h2 className="text-base font-bold text-slate-900">
              ID Card Template Designer & Settings
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Upload custom template graphics, customize staff photo styling, position dynamic fields, and print institutional ID badges.
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          {saveSuccess && (
            <span className="flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Saved Successfully</span>
            </span>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            title="Print test card"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Test Print</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {/* Main Designer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center: Interactive Live Canvas & Quick Controls (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center">
            {/* Top Toolbar for Canvas */}
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-slate-200 text-xs">
              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                <button
                  onClick={() => setActiveSide('front')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    activeSide === 'front'
                      ? 'bg-[#168A45] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Front Side
                </button>
                <button
                  onClick={() => setActiveSide('back')}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                    activeSide === 'back'
                      ? 'bg-[#168A45] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Back Side
                </button>
              </div>

              {/* Staff preview selector */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] text-slate-500 font-medium">Sample:</span>
                <select
                  value={selectedStaffIndex}
                  onChange={(e) => setSelectedStaffIndex(Number(e.target.value))}
                  className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:ring-1 focus:ring-emerald-600"
                >
                  {previewStaffList.map((s, idx) => (
                    <option key={s.id} value={idx}>
                      {s.fullName} ({s.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Instruction Tip */}
            <div className="w-full mb-3 flex items-center justify-between text-[11px] text-slate-500 bg-white/70 px-3 py-1.5 rounded-xl border border-slate-200">
              <div className="flex items-center space-x-1.5">
                <Move className="w-3.5 h-3.5 text-emerald-700" />
                <span>Drag any item or photo on the card to reposition it live</span>
              </div>
              <span className="font-mono text-[10px] text-emerald-800 font-semibold">
                CR80 Standard (54×86 mm)
              </span>
            </div>

            {/* THE LIVE CARD CANVAS */}
            <div className="py-2 flex justify-center w-full overflow-hidden">
              <StaffIdCardRenderer
                template={template}
                staff={selectedStaff}
                side={activeSide}
                scale={cardScale}
                isInteractive={true}
                selectedFieldId={selectedFieldId}
                onSelectField={(id) => {
                  setSelectedFieldId(id);
                  if (id === 'photo') {
                    setActiveTab('photo');
                  } else {
                    setActiveTab('fields');
                  }
                }}
                onMoveField={handleMoveField}
              />
            </div>

            {/* Card Orientation & Scale Control */}
            <div className="w-full mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-500">Orientation:</span>
                <div className="flex items-center space-x-1 bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setTemplate((prev) => ({ ...prev, orientation: 'portrait' }))}
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] cursor-pointer ${
                      template.orientation !== 'landscape'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Portrait
                  </button>
                  <button
                    onClick={() => setTemplate((prev) => ({ ...prev, orientation: 'landscape' }))}
                    className={`px-2 py-0.5 rounded-md font-bold text-[11px] cursor-pointer ${
                      template.orientation === 'landscape'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Landscape
                  </button>
                </div>
              </div>

              {/* Template Background Status */}
              <div className="text-[11px]">
                {template.backgroundImage ? (
                  <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Custom Graphic Active</span>
                  </span>
                ) : (
                  <span className="text-slate-400">Default Built-in Theme</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Configuration Tabs & Detailed Controls (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-5 text-xs">
          {/* Section Tabs */}
          <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('template')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                activeTab === 'template'
                  ? 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-4 h-4 text-[#168A45]" />
              <span>1. Upload Template & Theme</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('photo');
                setSelectedFieldId('photo');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                activeTab === 'photo'
                  ? 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Image className="w-4 h-4 text-[#168A45]" />
              <span>2. Photo Styling</span>
            </button>

            <button
              onClick={() => setActiveTab('fields')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                activeTab === 'fields'
                  ? 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Type className="w-4 h-4 text-[#168A45]" />
              <span>3. Fields & Placement</span>
              <span className="ml-1 bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {template.fields.filter((f) => f.visible).length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('back');
                setActiveSide('back');
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-colors ${
                activeTab === 'back'
                  ? 'bg-emerald-50 text-[#0B5D2A] border border-emerald-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4 text-[#168A45]" />
              <span>4. Back Side / Terms</span>
            </button>
          </div>

          {/* TAB 1: TEMPLATE & UPLOAD */}
          {activeTab === 'template' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Presets Bar */}
              <div>
                <label className="font-bold text-slate-800 block mb-2">
                  Choose Color Preset or Start From Scratch
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => applyPreset('emerald')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 text-left bg-white transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#0B5D2A] shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Emerald Pro</div>
                      <div className="text-[9px] text-slate-400">Casbiro Default</div>
                    </div>
                  </button>

                  <button
                    onClick={() => applyPreset('sapphire')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 text-left bg-white transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#1E3A8A] shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Sapphire Blue</div>
                      <div className="text-[9px] text-slate-400">Academic Wing</div>
                    </div>
                  </button>

                  <button
                    onClick={() => applyPreset('ruby')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-rose-500 text-left bg-white transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#881337] shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Ruby Executive</div>
                      <div className="text-[9px] text-slate-400">Leadership</div>
                    </div>
                  </button>

                  <button
                    onClick={() => applyPreset('slate')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-800 text-left bg-white transition-all cursor-pointer flex items-center space-x-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#0F172A] shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 text-[11px]">Minimal Slate</div>
                      <div className="text-[9px] text-slate-400">Modern Tech</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* UPLOAD CUSTOM TEMPLATE SECTION */}
              <div className="bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">
                        Upload Custom ID Card Template Graphic
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Upload your pre-designed institution background artwork (.png, .jpg, .svg).
                      </p>
                    </div>
                  </div>

                  {template.backgroundImage && (
                    <button
                      onClick={() =>
                        setTemplate((prev) => ({
                          ...prev,
                          backgroundImage: undefined,
                          useFullBackgroundArtwork: false,
                        }))
                      }
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Remove Background
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Front Template Upload Box */}
                  <div
                    onClick={() => frontFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      template.backgroundImage
                        ? 'border-emerald-400 bg-white'
                        : 'border-slate-300 hover:border-emerald-500 bg-white'
                    }`}
                  >
                    <input
                      ref={frontFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'front')}
                      className="hidden"
                    />
                    {template.backgroundImage ? (
                      <div className="space-y-2">
                        <div className="w-16 h-24 mx-auto rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                          <img
                            src={template.backgroundImage}
                            alt="Front Artwork"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-[11px] font-bold text-emerald-800">
                          Front Artwork Uploaded
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Click to upload replacement
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-3">
                        <Upload className="w-6 h-6 mx-auto text-emerald-600" />
                        <div className="font-bold text-slate-800 text-xs">
                          Upload Front Template Image
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Recommended ratio ~ 640 × 1014 px (CR80)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Back Template Upload Box */}
                  <div
                    onClick={() => backFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                      template.backBackgroundImage
                        ? 'border-emerald-400 bg-white'
                        : 'border-slate-300 hover:border-emerald-500 bg-white'
                    }`}
                  >
                    <input
                      ref={backFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'back')}
                      className="hidden"
                    />
                    {template.backBackgroundImage ? (
                      <div className="space-y-2">
                        <div className="w-16 h-24 mx-auto rounded-lg overflow-hidden border border-slate-300 shadow-2xs">
                          <img
                            src={template.backBackgroundImage}
                            alt="Back Artwork"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="text-[11px] font-bold text-emerald-800">
                          Back Artwork Uploaded
                        </div>
                        <span className="text-[10px] text-slate-500 block">
                          Click to upload replacement
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-3">
                        <Upload className="w-6 h-6 mx-auto text-slate-400" />
                        <div className="font-bold text-slate-700 text-xs">
                          Upload Back Template Image
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Optional reverse side artwork
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Option to hide generated header banner if graphic already contains header */}
                {template.backgroundImage && (
                  <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">
                        Use graphic as full card background
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Suppresses the built-in top header banner so your artwork's header and branding are visible.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={template.useFullBackgroundArtwork}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          useFullBackgroundArtwork: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
                    />
                  </div>
                )}
              </div>

              {/* Institution Header & Branding Form */}
              <div className="space-y-3 pt-2">
                <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-emerald-700" />
                  <span>Institution Details & Header Style</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      value={template.institutionName}
                      onChange={(e) =>
                        setTemplate((prev) => ({ ...prev, institutionName: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Header Subtitle / Wing
                    </label>
                    <input
                      type="text"
                      value={template.institutionSubtitle}
                      onChange={(e) =>
                        setTemplate((prev) => ({ ...prev, institutionSubtitle: e.target.value }))
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Header Banner Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={template.headerBgColor}
                        onChange={(e) =>
                          setTemplate((prev) => ({ ...prev, headerBgColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={template.headerBgColor}
                        onChange={(e) =>
                          setTemplate((prev) => ({ ...prev, headerBgColor: e.target.value }))
                        }
                        className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Accent Line Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={template.accentColor}
                        onChange={(e) =>
                          setTemplate((prev) => ({ ...prev, accentColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={template.accentColor}
                        onChange={(e) =>
                          setTemplate((prev) => ({ ...prev, accentColor: e.target.value }))
                        }
                        className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Upload */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="hidden"
                    />
                    {template.logoUrl ? (
                      <img
                        src={template.logoUrl}
                        alt="Logo"
                        className="w-8 h-8 object-contain border border-slate-200 rounded-md p-0.5"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <Shield className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-800">Institution Logo</div>
                      <div className="text-[10px] text-slate-400">
                        {template.logoUrl ? 'Custom logo uploaded' : 'Default shield icon used'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => logoFileInputRef.current?.click()}
                    className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                  >
                    {template.logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PHOTO STYLING */}
          {activeTab === 'photo' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Staff Profile Photo Element</h4>
                    <p className="text-[11px] text-slate-500">
                      Configure profile photo framing, border thickness, shape, and card coordinates.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-600 font-semibold">Visible:</span>
                    <input
                      type="checkbox"
                      checked={template.fields.find((f) => f.id === 'photo')?.visible !== false}
                      onChange={() => toggleFieldVisibility('photo')}
                      className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
                    />
                  </div>
                </div>

                {/* Photo Shape Selection */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1.5">Photo Frame Shape</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setTemplate((prev) => ({ ...prev, photoShape: 'circle' }))}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        template.photoShape === 'circle'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-600 mx-auto mb-1 bg-white" />
                      <span>Circle</span>
                    </button>

                    <button
                      onClick={() => setTemplate((prev) => ({ ...prev, photoShape: 'rounded' }))}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        template.photoShape === 'rounded'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl border-2 border-emerald-600 mx-auto mb-1 bg-white" />
                      <span>Rounded Square</span>
                    </button>

                    <button
                      onClick={() => setTemplate((prev) => ({ ...prev, photoShape: 'square' }))}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        template.photoShape === 'square'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xs border-2 border-emerald-600 mx-auto mb-1 bg-white" />
                      <span>Square</span>
                    </button>
                  </div>
                </div>

                {/* Photo Dimensions & Border */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700">Photo Dimension</label>
                      <span className="font-mono text-emerald-800 font-bold text-xs">
                        {template.photoSize || 84} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={60}
                      max={130}
                      step={2}
                      value={template.photoSize || 84}
                      onChange={(e) =>
                        setTemplate((prev) => ({ ...prev, photoSize: Number(e.target.value) }))
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-slate-700">Border Width</label>
                      <span className="font-mono text-emerald-800 font-bold text-xs">
                        {template.photoBorderWidth ?? 3} px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={1}
                      value={template.photoBorderWidth ?? 3}
                      onChange={(e) =>
                        setTemplate((prev) => ({
                          ...prev,
                          photoBorderWidth: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Border Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={template.photoBorderColor || '#168A45'}
                        onChange={(e) =>
                          setTemplate((prev) => ({ ...prev, photoBorderColor: e.target.value }))
                        }
                        className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={template.photoBorderColor || '#168A45'}
                        onChange={(e) =>
                          setTemplate((prev) => ({ ...prev, photoBorderColor: e.target.value }))
                        }
                        className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Quick Alignment Preset
                    </label>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          updateField('photo', { x: 50, y: 22 });
                        }}
                        className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-[11px] cursor-pointer"
                      >
                        Top Center
                      </button>
                      <button
                        onClick={() => {
                          updateField('photo', { x: 25, y: 30 });
                        }}
                        className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-[11px] cursor-pointer"
                      >
                        Left Aligned
                      </button>
                      <button
                        onClick={() => {
                          updateField('photo', { x: 50, y: 35 });
                        }}
                        className="px-2 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg font-semibold text-[11px] cursor-pointer"
                      >
                        Center Card
                      </button>
                    </div>
                  </div>
                </div>

                {/* Fine Nudge Controls for Photo Position */}
                {(() => {
                  const photoField = template.fields.find((f) => f.id === 'photo');
                  if (!photoField) return null;
                  return (
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-700 block">
                          Coordinates on Card:
                        </span>
                        <span className="font-mono text-emerald-800 text-[11px] font-bold">
                          X: {photoField.x}% | Y: {photoField.y}%
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => nudgeField('photo', -2, 0)}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                          title="Nudge Left"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => nudgeField('photo', 0, -2)}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                          title="Nudge Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => nudgeField('photo', 0, 2)}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                          title="Nudge Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => nudgeField('photo', 2, 0)}
                          className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                          title="Nudge Right"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* TAB 3: FIELDS & PLACEMENT ("for the templet need to add fields") */}
          {activeTab === 'fields' && (
            <div className="space-y-4 animate-in fade-in">
              {/* Header with Add Field button */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Configured Card Fields & Badges
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Click any field to adjust font, color, prefix, or nudge its position.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddingField(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {/* MODAL / POPOVER: ADD NEW FIELD */}
              {isAddingField && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-300 space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-950 text-xs">
                      Choose Field to Add to Card
                    </span>
                    <button
                      onClick={() => setIsAddingField(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Field Type</label>
                      <select
                        value={newFieldType}
                        onChange={(e) => setNewFieldType(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="bloodGroup">Blood Group (e.g. O+ Positive)</option>
                        <option value="emergencyPhone">Emergency Contact Phone</option>
                        <option value="joiningDate">Date of Joining</option>
                        <option value="validUntil">Validity Upto Date</option>
                        <option value="workLocation">Work Campus / Location</option>
                        <option value="contactNumber">Staff Mobile Number</option>
                        <option value="email">Official Email ID</option>
                        <option value="qrCode">Dynamic QR Code (Digital Profile)</option>
                        <option value="barcode">Barcode (Gate Scanner / Access)</option>
                        <option value="signature">Authorized Signature Block</option>
                        <option value="custom">Custom Text / Static Note</option>
                      </select>
                    </div>

                    {newFieldType === 'custom' && (
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">
                          Field Label
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Vehicle Pass No / PF ID"
                          value={customFieldLabel}
                          onChange={(e) => setCustomFieldLabel(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                        />
                      </div>
                    )}
                  </div>

                  {newFieldType === 'custom' && (
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Static Text</label>
                      <input
                        type="text"
                        placeholder="e.g. CAS-VP-9982"
                        value={customFieldValue}
                        onChange={(e) => setCustomFieldValue(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      onClick={() => setIsAddingField(false)}
                      className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddField}
                      className="px-4 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer"
                    >
                      Insert Onto Card
                    </button>
                  </div>
                </div>
              )}

              {/* LIST OF CURRENT FIELDS */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {template.fields.map((field) => {
                  const isSelected = selectedFieldId === field.id;
                  return (
                    <div
                      key={field.id}
                      onClick={() => setSelectedFieldId(field.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFieldVisibility(field.id);
                          }}
                          className={`p-1 rounded-md cursor-pointer transition-colors ${
                            field.visible
                              ? 'text-emerald-700 hover:bg-emerald-100'
                              : 'text-slate-300 hover:text-slate-500'
                          }`}
                          title={field.visible ? 'Hide field' : 'Show field'}
                        >
                          {field.visible ? (
                            <Eye className="w-3.5 h-3.5" />
                          ) : (
                            <EyeOff className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <div>
                          <div className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                            <span>{field.label}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 font-mono">
                              {field.type}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Pos: ({field.x}%, {field.y}%)
                            {field.showLabel && field.customPrefix && ` • "${field.customPrefix}"`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {field.isCustom && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(field.id);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer rounded-md"
                            title="Remove field"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-300'}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DETAILED SETTINGS FOR SELECTED FIELD */}
              {selectedField && selectedField.id !== 'photo' && (
                <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Customize: {selectedField.label}</span>
                    </span>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => nudgeField(selectedField.id, -2, 0)}
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                        title="Nudge Left"
                      >
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => nudgeField(selectedField.id, 0, -2)}
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                        title="Nudge Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => nudgeField(selectedField.id, 0, 2)}
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                        title="Nudge Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => nudgeField(selectedField.id, 2, 0)}
                        className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md cursor-pointer"
                        title="Nudge Right"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Prefix Label */}
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">
                        Prefix Label
                      </label>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="checkbox"
                          checked={selectedField.showLabel !== false}
                          onChange={(e) =>
                            updateField(selectedField.id, { showLabel: e.target.checked })
                          }
                          className="w-4 h-4 accent-emerald-600 rounded-sm cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedField.customPrefix || ''}
                          onChange={(e) =>
                            updateField(selectedField.id, {
                              customPrefix: e.target.value,
                              showLabel: true,
                            })
                          }
                          placeholder="e.g. ID: "
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-600 font-semibold">Font Size</label>
                        <span className="font-mono text-emerald-800 font-bold text-xs">
                          {selectedField.fontSize || 12} px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={8}
                        max={24}
                        step={1}
                        value={selectedField.fontSize || 12}
                        onChange={(e) =>
                          updateField(selectedField.id, { fontSize: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Text Color</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={selectedField.color || '#0F172A'}
                          onChange={(e) =>
                            updateField(selectedField.id, { color: e.target.value })
                          }
                          className="w-8 h-8 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={selectedField.color || '#0F172A'}
                          onChange={(e) =>
                            updateField(selectedField.id, { color: e.target.value })
                          }
                          className="w-24 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold uppercase"
                        />
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <label className="block text-slate-600 font-semibold mb-1">Alignment</label>
                      <div className="flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200">
                        <button
                          onClick={() => updateField(selectedField.id, { textAlign: 'left' })}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            selectedField.textAlign === 'left'
                              ? 'bg-emerald-100 text-emerald-900 font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          Left
                        </button>
                        <button
                          onClick={() => updateField(selectedField.id, { textAlign: 'center' })}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            selectedField.textAlign === 'center' || !selectedField.textAlign
                              ? 'bg-emerald-100 text-emerald-900 font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          Center
                        </button>
                        <button
                          onClick={() => updateField(selectedField.id, { textAlign: 'right' })}
                          className={`px-2 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                            selectedField.textAlign === 'right'
                              ? 'bg-emerald-100 text-emerald-900 font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          Right
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Position Sliders */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-500 text-[11px]">X Coordinate (Left-Right)</label>
                        <span className="font-mono text-slate-800 font-bold text-[11px]">
                          {selectedField.x}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={selectedField.x}
                        onChange={(e) =>
                          updateField(selectedField.id, { x: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-slate-500 text-[11px]">Y Coordinate (Top-Bottom)</label>
                        <span className="font-mono text-slate-800 font-bold text-[11px]">
                          {selectedField.y}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={selectedField.y}
                        onChange={(e) =>
                          updateField(selectedField.id, { y: Number(e.target.value) })
                        }
                        className="w-full accent-emerald-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BACK SIDE / TERMS */}
          {activeTab === 'back' && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  ID Card Reverse Side Configuration
                </h4>
                <p className="text-[11px] text-slate-500">
                  Configure institutional instructions, lost card notice, helpline, and return campus address.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Terms of Use & Instructions
                </label>
                <textarea
                  rows={4}
                  value={template.backTermsAndConditions}
                  onChange={(e) =>
                    setTemplate((prev) => ({ ...prev, backTermsAndConditions: e.target.value }))
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-sans text-slate-800 focus:bg-white focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Emergency Helpline & Email
                  </label>
                  <input
                    type="text"
                    value={template.backEmergencyHelpline}
                    onChange={(e) =>
                      setTemplate((prev) => ({ ...prev, backEmergencyHelpline: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Signatory Designation
                  </label>
                  <input
                    type="text"
                    value={template.authorizedSignatoryTitle}
                    onChange={(e) =>
                      setTemplate((prev) => ({
                        ...prev,
                        authorizedSignatoryTitle: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Campus Return Address
                </label>
                <input
                  type="text"
                  value={template.backReturnAddress}
                  onChange={(e) =>
                    setTemplate((prev) => ({ ...prev, backReturnAddress: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              {/* Upload Signature Image */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <input
                  ref={signatureFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'signature')}
                  className="hidden"
                />
                <div className="flex items-center space-x-2">
                  {template.authorizedSignatureImage ? (
                    <img
                      src={template.authorizedSignatureImage}
                      alt="Signature"
                      className="h-8 border border-slate-200 rounded-md p-1 bg-white"
                    />
                  ) : (
                    <div className="italic font-serif text-slate-500 text-xs px-2 py-1 bg-slate-100 rounded-md">
                      Digital Signature
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-slate-800">Authorized Signature Graphic</div>
                    <div className="text-[10px] text-slate-400">
                      Upload transparent PNG signature of Director / Principal
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => signatureFileInputRef.current?.click()}
                  className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg font-semibold text-xs cursor-pointer"
                >
                  {template.authorizedSignatureImage ? 'Change Signature' : 'Upload Signature'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
