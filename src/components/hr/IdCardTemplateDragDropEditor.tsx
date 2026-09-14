import React, { useState, useRef } from 'react';
import {
  IdCardTemplateSettings,
  IdCardFieldConfig,
  IdCardFieldCategory,
  StaffMember,
} from '../../types/hr';
import { StaffIdCardRenderer } from './StaffIdCardRenderer';
import {
  GripVertical,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Move,
  Sliders,
  Type,
  Image as ImageIcon,
  Layers,
  Sparkles,
  RotateCw,
  Maximize2,
  Grid,
  Magnet,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  User,
  QrCode,
  Barcode,
  PenTool,
  Shield,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Camera,
  Hash,
  Phone,
  Mail,
  Calendar,
  MapPin,
  HeartPulse,
} from 'lucide-react';

interface IdCardTemplateDragDropEditorProps {
  template: IdCardTemplateSettings;
  onChangeTemplate: (template: IdCardTemplateSettings) => void;
  staffList?: StaffMember[];
  onSave?: () => void;
}

// Palette Item Definition
interface PaletteItemDefinition {
  id: string;
  category: IdCardFieldCategory;
  type: IdCardFieldConfig['type'];
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  defaultConfig: Partial<IdCardFieldConfig>;
}

export const IdCardTemplateDragDropEditor: React.FC<IdCardTemplateDragDropEditorProps> = ({
  template,
  onChangeTemplate,
  staffList = [],
  onSave,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>('photo');
  const [selectedStaffIndex, setSelectedStaffIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isWireframeMode, setIsWireframeMode] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showGuides, setShowGuides] = useState<boolean>(true);
  const [paletteTab, setPaletteTab] = useState<'static' | 'dynamic' | 'image'>('dynamic');
  const [inspectorTab, setInspectorTab] = useState<'properties' | 'layers'>('properties');
  const [notification, setNotification] = useState<string | null>(null);

  const selectedStaff = staffList[selectedStaffIndex] || null;

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  // Static Text Palette Items
  const staticTextItems: PaletteItemDefinition[] = [
    {
      id: 'static_inst_title',
      category: 'static_text',
      type: 'text',
      label: 'Card Title / Pass Type',
      icon: Type,
      description: 'e.g. "STAFF IDENTITY CARD", "VISITOR PASS"',
      defaultConfig: {
        category: 'static_text',
        label: 'STAFF IDENTITY CARD',
        customValue: 'STAFF IDENTITY CARD',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#168A45',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
    },
    {
      id: 'static_status_badge',
      category: 'static_text',
      type: 'badge',
      label: 'Status Badge / Pill',
      icon: Sparkles,
      description: 'Pill badge e.g. "PERMANENT", "MANAGEMENT"',
      defaultConfig: {
        category: 'static_text',
        type: 'badge',
        label: 'Staff Status Pill',
        customValue: 'PERMANENT STAFF',
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0B5D2A',
        backgroundColor: '#EAF7EF',
        borderRadius: 9999,
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
    },
    {
      id: 'static_wing_label',
      category: 'static_text',
      type: 'text',
      label: 'Institutional Subtitle / Wing',
      icon: Shield,
      description: 'e.g. "Campus Management & HR Division"',
      defaultConfig: {
        category: 'static_text',
        label: 'Division Subtitle',
        customValue: 'Campus Management & HR Wing',
        fontSize: 9,
        fontWeight: 'medium',
        color: '#64748B',
        textAlign: 'center',
      },
    },
    {
      id: 'static_disclaimer',
      category: 'static_text',
      type: 'text',
      label: 'Notice / Policy Disclaimer',
      icon: Type,
      description: 'Small disclaimer or card return note',
      defaultConfig: {
        category: 'static_text',
        label: 'Security Disclaimer',
        customValue: 'Property of Casbiro Solutions. If found, please return to campus HR.',
        fontSize: 7,
        fontWeight: 'normal',
        color: '#94A3B8',
        textAlign: 'center',
      },
    },
    {
      id: 'static_custom_text',
      category: 'static_text',
      type: 'text',
      label: 'Custom Static Text Field',
      icon: Type,
      description: 'User-defined static label or value',
      defaultConfig: {
        category: 'static_text',
        label: 'Static Label',
        customValue: 'CONFIDENTIAL',
        fontSize: 10,
        fontWeight: 'semibold',
        color: '#334155',
        textAlign: 'center',
      },
    },
  ];

  // Dynamic Staff Data Palette Items
  const dynamicFieldItems: PaletteItemDefinition[] = [
    {
      id: 'fullName',
      category: 'dynamic_field',
      type: 'text',
      label: 'Full Name',
      icon: User,
      description: 'Employee full legal name',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'fullName',
        label: 'Staff Full Name',
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0F172A',
        textAlign: 'center',
      },
    },
    {
      id: 'staffId',
      category: 'dynamic_field',
      type: 'text',
      label: 'Staff ID / Code',
      icon: Hash,
      description: 'Unique ID code (e.g. CB/101/001)',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'staffId',
        label: 'Employee ID',
        showLabel: true,
        customPrefix: 'ID: ',
        fontSize: 11,
        fontWeight: 'semibold',
        color: '#168A45',
        textAlign: 'center',
      },
    },
    {
      id: 'position',
      category: 'dynamic_field',
      type: 'text',
      label: 'Designation / Position',
      icon: Shield,
      description: 'Job role title or academic rank',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'position',
        label: 'Designation',
        fontSize: 11,
        fontWeight: 'semibold',
        color: '#334155',
        textAlign: 'center',
      },
    },
    {
      id: 'department',
      category: 'dynamic_field',
      type: 'text',
      label: 'Department',
      icon: Layers,
      description: 'Department (Academic, IT, Admin)',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'department',
        label: 'Department',
        showLabel: true,
        customPrefix: 'Dept: ',
        fontSize: 10,
        fontWeight: 'medium',
        color: '#64748B',
        textAlign: 'center',
      },
    },
    {
      id: 'division',
      category: 'dynamic_field',
      type: 'text',
      label: 'Division / Branch',
      icon: Layers,
      description: 'Operational branch or institutional wing',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'division',
        label: 'Division',
        fontSize: 10,
        fontWeight: 'normal',
        color: '#64748B',
        textAlign: 'center',
      },
    },
    {
      id: 'bloodGroup',
      category: 'dynamic_field',
      type: 'text',
      label: 'Blood Group',
      icon: HeartPulse,
      description: 'Medical blood group emergency info',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'bloodGroup',
        label: 'Blood Group',
        showLabel: true,
        customPrefix: 'Blood: ',
        fontSize: 10,
        fontWeight: 'bold',
        color: '#B91C1C',
        textAlign: 'left',
      },
    },
    {
      id: 'emergencyPhone',
      category: 'dynamic_field',
      type: 'text',
      label: 'Emergency Contact Phone',
      icon: Phone,
      description: 'Emergency helpline number',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'emergencyPhone',
        label: 'Emergency Phone',
        showLabel: true,
        customPrefix: 'Emerg: ',
        fontSize: 10,
        fontWeight: 'medium',
        color: '#1E293B',
        textAlign: 'right',
      },
    },
    {
      id: 'contactNumber',
      category: 'dynamic_field',
      type: 'text',
      label: 'Contact Mobile Number',
      icon: Phone,
      description: 'Official phone number',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'contactNumber',
        label: 'Contact Number',
        showLabel: true,
        customPrefix: 'Mob: ',
        fontSize: 10,
        fontWeight: 'normal',
        color: '#334155',
        textAlign: 'center',
      },
    },
    {
      id: 'email',
      category: 'dynamic_field',
      type: 'text',
      label: 'Official Email ID',
      icon: Mail,
      description: 'Employee corporate email',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'email',
        label: 'Official Email',
        fontSize: 9,
        fontWeight: 'normal',
        color: '#475569',
        textAlign: 'center',
      },
    },
    {
      id: 'joiningDate',
      category: 'dynamic_field',
      type: 'text',
      label: 'Date of Joining',
      icon: Calendar,
      description: 'Service commencement date',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'joiningDate',
        label: 'Date of Joining',
        showLabel: true,
        customPrefix: 'Joined: ',
        fontSize: 9,
        fontWeight: 'normal',
        color: '#64748B',
        textAlign: 'center',
      },
    },
    {
      id: 'validUntil',
      category: 'dynamic_field',
      type: 'text',
      label: 'Validity Expiry Date',
      icon: Calendar,
      description: 'Card expiration or renewal date',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'validUntil',
        label: 'Valid Until',
        showLabel: true,
        customPrefix: 'Expires: ',
        fontSize: 9,
        fontWeight: 'medium',
        color: '#64748B',
        textAlign: 'center',
      },
    },
    {
      id: 'workLocation',
      category: 'dynamic_field',
      type: 'text',
      label: 'Work Campus / Location',
      icon: MapPin,
      description: 'Campus name or office station',
      defaultConfig: {
        category: 'dynamic_field',
        dynamicBindingKey: 'workLocation',
        label: 'Work Campus',
        showLabel: true,
        customPrefix: 'Campus: ',
        fontSize: 9,
        fontWeight: 'normal',
        color: '#475569',
        textAlign: 'center',
      },
    },
    {
      id: 'qrcode',
      category: 'dynamic_field',
      type: 'qrcode',
      label: 'Dynamic QR Code (Digital Pass)',
      icon: QrCode,
      description: 'Scannable digital identity verification QR code',
      defaultConfig: {
        category: 'dynamic_field',
        type: 'qrcode',
        label: 'Digital QR Code',
        width: 44,
        height: 44,
      },
    },
    {
      id: 'barcode',
      category: 'dynamic_field',
      type: 'barcode',
      label: 'Barcode (Turnstile / Scanner)',
      icon: Barcode,
      description: 'Optical scanner barcode for gate entry',
      defaultConfig: {
        category: 'dynamic_field',
        type: 'barcode',
        label: 'Turnstile Barcode',
        width: 140,
        height: 26,
      },
    },
    {
      id: 'signature',
      category: 'dynamic_field',
      type: 'signature',
      label: 'Authorized Signatory Block',
      icon: PenTool,
      description: 'Institutional signature and verification title',
      defaultConfig: {
        category: 'dynamic_field',
        type: 'signature',
        label: 'Authorized Signatory',
        fontSize: 8,
        fontWeight: 'medium',
        color: '#475569',
        textAlign: 'center',
      },
    },
  ];

  // Image Placeholders Palette Items (Specifically requested for employee photos)
  const imagePlaceholderItems: PaletteItemDefinition[] = [
    {
      id: 'photo_circle',
      category: 'image_placeholder',
      type: 'photo',
      label: 'Circular Photo Placeholder',
      icon: Camera,
      description: 'Standard 84×84px round photo frame',
      defaultConfig: {
        category: 'image_placeholder',
        type: 'photo',
        label: 'Employee Photo (Circle)',
        placeholderLabel: 'EMPLOYEE PHOTO',
        shape: 'circle',
        width: 84,
        height: 84,
        borderWidth: 3,
        borderColor: '#168A45',
      },
    },
    {
      id: 'photo_rounded',
      category: 'image_placeholder',
      type: 'photo',
      label: 'Rounded Photo Placeholder',
      icon: Camera,
      description: 'Modern CR80 84×100px portrait rounded frame',
      defaultConfig: {
        category: 'image_placeholder',
        type: 'photo',
        label: 'Employee Photo (Rounded)',
        placeholderLabel: 'EMPLOYEE PHOTO',
        shape: 'rounded',
        width: 84,
        height: 100,
        borderWidth: 3,
        borderColor: '#168A45',
      },
    },
    {
      id: 'photo_square',
      category: 'image_placeholder',
      type: 'photo',
      label: 'Square Photo Placeholder',
      icon: Camera,
      description: 'Classic 84×84px crisp square frame',
      defaultConfig: {
        category: 'image_placeholder',
        type: 'photo',
        label: 'Employee Photo (Square)',
        placeholderLabel: 'EMPLOYEE PHOTO',
        shape: 'square',
        width: 84,
        height: 84,
        borderWidth: 3,
        borderColor: '#168A45',
      },
    },
    {
      id: 'photo_secondary',
      category: 'image_placeholder',
      type: 'image',
      label: 'Secondary Photo / Verification Image',
      icon: ImageIcon,
      description: 'Security hologram or secondary photo box',
      defaultConfig: {
        category: 'image_placeholder',
        type: 'image',
        label: 'Security Photo Box',
        placeholderLabel: 'VERIFIED PHOTO',
        shape: 'rounded',
        width: 60,
        height: 60,
        borderWidth: 2,
        borderColor: '#0B5D2A',
      },
    },
  ];

  // Helper: check if a field is placed on the template
  const isFieldPlaced = (item: PaletteItemDefinition) => {
    if (item.category === 'image_placeholder' && item.type === 'photo') {
      return template.fields.some((f) => f.id === 'photo' || f.type === 'photo');
    }
    if (item.defaultConfig.dynamicBindingKey) {
      return template.fields.some(
        (f) => f.id === item.id || f.dynamicBindingKey === item.defaultConfig.dynamicBindingKey
      );
    }
    return false;
  };

  // Add Item to Card
  const addFieldToCard = (
    item: PaletteItemDefinition,
    position?: { x: number; y: number }
  ) => {
    // If it's a primary photo field and one already exists, update its shape/config and make visible
    if (item.type === 'photo') {
      const existingPhoto = template.fields.find((f) => f.id === 'photo' || f.type === 'photo');
      if (existingPhoto) {
        onChangeTemplate({
          ...template,
          photoShape: item.defaultConfig.shape || template.photoShape || 'circle',
          photoSize: item.defaultConfig.width || template.photoSize || 84,
          fields: template.fields.map((f) =>
            f.id === existingPhoto.id
              ? {
                  ...f,
                  visible: true,
                  shape: item.defaultConfig.shape || f.shape,
                  width: item.defaultConfig.width || f.width,
                  height: item.defaultConfig.height || f.height,
                  x: position ? position.x : f.x,
                  y: position ? position.y : f.y,
                }
              : f
          ),
        });
        setSelectedFieldId(existingPhoto.id);
        notify(`Selected existing employee photo placeholder`);
        return;
      }
    }

    // Default stacking position if not dropped
    const targetX = position ? position.x : 50;
    const targetY = position ? position.y : 60 + (template.fields.length % 5) * 6;

    const newFieldId = `${item.id}_${Date.now()}`;
    const newField: IdCardFieldConfig = {
      id: newFieldId,
      label: item.defaultConfig.label || item.label,
      type: item.type,
      category: item.category,
      visible: true,
      x: targetX,
      y: targetY,
      ...item.defaultConfig,
    };

    onChangeTemplate({
      ...template,
      fields: [...template.fields, newField],
    });

    setSelectedFieldId(newFieldId);
    notify(`Added "${newField.label}" to ID card`);
  };

  // Move a field on canvas
  const handleMoveField = (fieldId: string, newX: number, newY: number) => {
    onChangeTemplate({
      ...template,
      fields: template.fields.map((f) => (f.id === fieldId ? { ...f, x: newX, y: newY } : f)),
    });
  };

  // Nudge field
  const nudgeField = (fieldId: string, dx: number, dy: number) => {
    onChangeTemplate({
      ...template,
      fields: template.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const nx = Math.max(0, Math.min(100, f.x + dx));
        const ny = Math.max(0, Math.min(100, f.y + dy));
        return { ...f, x: nx, y: ny };
      }),
    });
  };

  // Duplicate Field
  const duplicateField = (fieldId: string) => {
    const original = template.fields.find((f) => f.id === fieldId);
    if (!original) return;
    const duplicated: IdCardFieldConfig = {
      ...original,
      id: `copy_${Date.now()}`,
      label: `${original.label} (Copy)`,
      x: Math.min(95, original.x + 4),
      y: Math.min(95, original.y + 4),
      isCustom: true,
    };
    onChangeTemplate({
      ...template,
      fields: [...template.fields, duplicated],
    });
    setSelectedFieldId(duplicated.id);
    notify(`Duplicated "${original.label}"`);
  };

  // Remove Field
  const removeField = (fieldId: string) => {
    onChangeTemplate({
      ...template,
      fields: template.fields.filter((f) => f.id !== fieldId),
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
    notify('Field removed from card');
  };

  // Toggle Visibility
  const toggleVisibility = (fieldId: string) => {
    onChangeTemplate({
      ...template,
      fields: template.fields.map((f) => (f.id === fieldId ? { ...f, visible: !f.visible } : f)),
    });
  };

  // Update properties of selected field
  const updateField = (fieldId: string, updates: Partial<IdCardFieldConfig>) => {
    onChangeTemplate({
      ...template,
      fields: template.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    });
  };

  // Reorder layer
  const reorderLayer = (fieldId: string, direction: 'up' | 'down') => {
    const idx = template.fields.findIndex((f) => f.id === fieldId);
    if (idx < 0) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= template.fields.length) return;

    const updated = [...template.fields];
    const [moved] = updated.splice(idx, 1);
    updated.splice(newIdx, 0, moved);
    onChangeTemplate({ ...template, fields: updated });
  };

  // Handle drop from palette to canvas
  const handleDropFromPalette = (itemPayload: any, xPct: number, yPct: number) => {
    if (!itemPayload) return;
    // Find matching palette item
    const allItems = [...staticTextItems, ...dynamicFieldItems, ...imagePlaceholderItems];
    const matched = allItems.find((i) => i.id === itemPayload.id) || itemPayload;
    addFieldToCard(matched, { x: xPct, y: yPct });
  };

  const selectedField = template.fields.find((f) => f.id === selectedFieldId);

  return (
    <div className="space-y-4">
      {/* Top Action Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: View Controls */}
        <div className="flex items-center space-x-2">
          {/* Front / Back Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveSide('front')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeSide === 'front'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Front Side
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeSide === 'back'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Back Side
            </button>
          </div>

          {/* Orientation Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onChangeTemplate({ ...template, orientation: 'portrait' })}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                template.orientation !== 'landscape'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => onChangeTemplate({ ...template, orientation: 'landscape' })}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                template.orientation === 'landscape'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Landscape
            </button>
          </div>

          {/* Mode Switcher: Wireframe vs Live Data */}
          <button
            onClick={() => setIsWireframeMode(!isWireframeMode)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer ${
              isWireframeMode
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Wireframe mode to see field boundaries and photo placeholders"
          >
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>{isWireframeMode ? 'Wireframe Mode' : 'Live Data Mode'}</span>
          </button>
        </div>

        {/* Center: Grid & Guides Toggles */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showGrid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
            title="Toggle Alignment Grid (20px)"
          >
            <Grid className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowGuides(!showGuides)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              showGuides
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
            title="Toggle Magnetic Snap Guidelines"
          >
            <Magnet className="w-4 h-4" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-mono">
            <button
              onClick={() => setZoomLevel(0.85)}
              className={`px-1.5 py-0.5 rounded-md cursor-pointer ${
                zoomLevel === 0.85 ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              85%
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className={`px-1.5 py-0.5 rounded-md cursor-pointer ${
                zoomLevel === 1 ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              100%
            </button>
            <button
              onClick={() => setZoomLevel(1.15)}
              className={`px-1.5 py-0.5 rounded-md cursor-pointer ${
                zoomLevel === 1.15 ? 'bg-white font-bold text-emerald-800 shadow-2xs' : 'text-slate-600'
              }`}
            >
              115%
            </button>
          </div>

          {/* Sample Employee Switcher */}
          {staffList.length > 0 && (
            <div className="flex items-center space-x-1 bg-white border border-slate-200 px-2 py-1 rounded-xl">
              <span className="text-slate-400 font-medium">Sample:</span>
              <select
                value={selectedStaffIndex}
                onChange={(e) => setSelectedStaffIndex(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-800 text-xs focus:outline-hidden"
              >
                {staffList.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {s.fullName} ({s.id})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: Save / Notification */}
        <div className="flex items-center space-x-2">
          {notification && (
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold flex items-center space-x-1 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{notification}</span>
            </span>
          )}

          {onSave && (
            <button
              onClick={onSave}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ========================================================= */}
        {/* COLUMN 1: THE 3 DRAGGABLE TOOLBOX TRAYS (3 Cols)          */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
              <GripVertical className="w-4 h-4 text-emerald-700" />
              <span>Element Toolbox</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Drag elements onto the card canvas or click <span className="font-bold text-emerald-700">+</span> to insert.
            </p>
          </div>

          {/* Trays Tab Selector */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setPaletteTab('dynamic')}
              className={`py-1.5 px-1 rounded-lg font-bold text-[11px] text-center transition-all cursor-pointer ${
                paletteTab === 'dynamic'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Staff Data
            </button>
            <button
              onClick={() => setPaletteTab('image')}
              className={`py-1.5 px-1 rounded-lg font-bold text-[11px] text-center transition-all cursor-pointer ${
                paletteTab === 'image'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setPaletteTab('static')}
              className={`py-1.5 px-1 rounded-lg font-bold text-[11px] text-center transition-all cursor-pointer ${
                paletteTab === 'static'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Static Text
            </button>
          </div>

          {/* TRAY 1: DYNAMIC STAFF DATA FIELDS */}
          {paletteTab === 'dynamic' && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                Dynamic Employee Fields ({dynamicFieldItems.length})
              </div>
              {dynamicFieldItems.map((item) => {
                const placed = isFieldPlaced(item);
                const IconComp = item.icon;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(item));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className={`group p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                      placed
                        ? 'border-slate-200 bg-slate-50/70 hover:border-emerald-400'
                        : 'border-slate-200 hover:border-emerald-500 bg-white hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px] leading-tight">
                            {item.label}
                          </div>
                          <div className="text-[9px] text-slate-400 leading-tight">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {placed && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            Placed
                          </span>
                        )}
                        <button
                          onClick={() => addFieldToCard(item)}
                          className="p-1 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 cursor-pointer transition-colors"
                          title="Add to Card"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TRAY 2: IMAGE PLACEHOLDERS FOR EMPLOYEE PHOTOS */}
          {paletteTab === 'image' && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                Employee Photo Placeholders ({imagePlaceholderItems.length})
              </div>
              <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-200 text-[11px] text-emerald-900">
                <span className="font-bold block mb-0.5">Photo Framing Options:</span>
                Drag a photo frame placeholder onto the card to position where employee portraits will render.
              </div>
              {imagePlaceholderItems.map((item) => {
                const placed = isFieldPlaced(item);
                const IconComp = item.icon;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(item));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="group p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:shadow-xs transition-all cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px] leading-tight">
                            {item.label}
                          </div>
                          <div className="text-[9px] text-slate-400 leading-tight">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        {placed && (
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                        <button
                          onClick={() => addFieldToCard(item)}
                          className="p-1 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 cursor-pointer transition-colors"
                          title="Add to Card"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TRAY 3: STATIC TEXT FIELDS */}
          {paletteTab === 'static' && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1">
                Static Text Elements ({staticTextItems.length})
              </div>
              {staticTextItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(item));
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="group p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:shadow-xs transition-all cursor-grab active:cursor-grabbing"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                          <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-[11px] leading-tight">
                            {item.label}
                          </div>
                          <div className="text-[9px] text-slate-400 leading-tight">
                            {item.description}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => addFieldToCard(item)}
                        className="p-1 rounded-md bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 cursor-pointer transition-colors"
                        title="Add to Card"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: THE INTERACTIVE ID CARD CANVAS (5 Cols)         */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col items-center bg-slate-100/80 p-6 rounded-2xl border border-slate-200 shadow-2xs relative">
          {/* Card Dimension Tag */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                CR80 {template.orientation === 'landscape' ? '86×54 mm (Landscape)' : '54×86 mm (Portrait)'}
              </span>
              <span className="text-[11px] text-slate-500">
                {template.fields.filter((f) => f.visible).length} visible fields
              </span>
            </div>

            {selectedField && (
              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Selected: {selectedField.x}%, {selectedField.y}%
              </span>
            )}
          </div>

          {/* THE CARD STAGE */}
          <div className="py-2 flex justify-center w-full overflow-hidden min-h-[520px] items-center">
            <StaffIdCardRenderer
              template={template}
              staff={selectedStaff}
              side={activeSide}
              scale={zoomLevel}
              isInteractive={true}
              isWireframeMode={isWireframeMode}
              showGrid={showGrid}
              showGuides={showGuides}
              selectedFieldId={selectedFieldId}
              onSelectField={(id) => setSelectedFieldId(id)}
              onMoveField={handleMoveField}
              onDropItem={handleDropFromPalette}
            />
          </div>

          {/* Quick Floating Alignment Bar for Selected Element */}
          {selectedField && (
            <div className="w-full mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-500 font-medium">Nudge:</span>
                <button
                  onClick={() => nudgeField(selectedField.id, -2, 0)}
                  className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                  title="Nudge Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => nudgeField(selectedField.id, 0, -2)}
                  className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                  title="Nudge Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => nudgeField(selectedField.id, 0, 2)}
                  className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                  title="Nudge Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => nudgeField(selectedField.id, 2, 0)}
                  className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                  title="Nudge Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Center X Alignment */}
              <button
                onClick={() => updateField(selectedField.id, { x: 50 })}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-[11px] text-emerald-800 cursor-pointer shadow-2xs"
              >
                Snap Center X (50%)
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => duplicateField(selectedField.id)}
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                  title="Duplicate Field"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => toggleVisibility(selectedField.id)}
                  className="p-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                  title={selectedField.visible ? 'Hide on card' : 'Show on card'}
                >
                  {selectedField.visible ? (
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => removeField(selectedField.id)}
                  className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-lg cursor-pointer shadow-2xs"
                  title="Delete Field"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: ELEMENT INSPECTOR & LAYERS (4 Cols)             */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-xs">
          {/* Header tabs: Properties vs Layers List */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setInspectorTab('properties')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  inspectorTab === 'properties'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Properties</span>
              </button>
              <button
                onClick={() => setInspectorTab('layers')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  inspectorTab === 'layers'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Layers ({template.fields.length})</span>
              </button>
            </div>
          </div>

          {/* INSPECTOR TAB: DETAILED PROPERTIES FOR SELECTED FIELD */}
          {inspectorTab === 'properties' && (
            <>
              {selectedField ? (
                <div className="space-y-3.5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {selectedField.category === 'static_text'
                          ? 'Static Text Field'
                          : selectedField.category === 'image_placeholder'
                          ? 'Image Placeholder'
                          : 'Dynamic Staff Field'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">
                        {selectedField.label}
                      </h4>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400">
                      ID: {selectedField.id.slice(0, 12)}
                    </span>
                  </div>

                  {/* 1. TEXT CONTENT OR DYNAMIC BINDING KEY */}
                  {selectedField.category === 'static_text' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Static Text String
                      </label>
                      <input
                        type="text"
                        value={selectedField.customValue ?? selectedField.label}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            customValue: e.target.value,
                            label: e.target.value || 'Static Text',
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  )}

                  {selectedField.category === 'dynamic_field' && (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Staff Data Binding Key
                      </label>
                      <select
                        value={selectedField.dynamicBindingKey || selectedField.id}
                        onChange={(e) =>
                          updateField(selectedField.id, {
                            dynamicBindingKey: e.target.value,
                          })
                        }
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-emerald-600"
                      >
                        <option value="fullName">Full Legal Name</option>
                        <option value="staffId">Staff ID / Code</option>
                        <option value="position">Designation / Role</option>
                        <option value="department">Department</option>
                        <option value="division">Division / Branch</option>
                        <option value="bloodGroup">Blood Group</option>
                        <option value="contactNumber">Contact Mobile</option>
                        <option value="email">Official Email</option>
                        <option value="emergencyPhone">Emergency Helpline</option>
                        <option value="joiningDate">Date of Joining</option>
                        <option value="validUntil">Valid Upto Date</option>
                        <option value="workLocation">Work Campus</option>
                        <option value="signature">Authorized Signatory</option>
                      </select>
                    </div>
                  )}

                  {/* 2. PHOTO / IMAGE PLACEHOLDER CONTROLS */}
                  {(selectedField.type === 'photo' || selectedField.type === 'image') && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="font-bold text-slate-800 text-[11px] flex items-center space-x-1.5">
                        <Camera className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Photo Placeholder Formatting</span>
                      </div>

                      {/* Shape selector */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Frame Shape
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['circle', 'rounded', 'square'] as const).map((s) => (
                            <button
                              key={s}
                              onClick={() => {
                                updateField(selectedField.id, { shape: s });
                                if (selectedField.id === 'photo') {
                                  onChangeTemplate({ ...template, photoShape: s });
                                }
                              }}
                              className={`py-1.5 px-2 rounded-lg border font-semibold text-[11px] capitalize cursor-pointer transition-all ${
                                (selectedField.shape || template.photoShape) === s
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dimensions slider */}
                      <div>
                        <div className="flex justify-between items-center mb-1 text-[11px]">
                          <span className="font-semibold text-slate-600">Frame Size</span>
                          <span className="font-mono text-emerald-800 font-bold">
                            {selectedField.width || template.photoSize || 84}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={50}
                          max={140}
                          step={2}
                          value={selectedField.width || template.photoSize || 84}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            updateField(selectedField.id, { width: val, height: val });
                            if (selectedField.id === 'photo') {
                              onChangeTemplate({ ...template, photoSize: val });
                            }
                          }}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      {/* Border Width & Color */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Border Width
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            value={selectedField.borderWidth ?? template.photoBorderWidth ?? 3}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              updateField(selectedField.id, { borderWidth: val });
                              if (selectedField.id === 'photo') {
                                onChangeTemplate({ ...template, photoBorderWidth: val });
                              }
                            }}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                            Border Color
                          </label>
                          <div className="flex items-center space-x-1">
                            <input
                              type="color"
                              value={selectedField.borderColor || template.photoBorderColor || '#168A45'}
                              onChange={(e) => {
                                updateField(selectedField.id, { borderColor: e.target.value });
                                if (selectedField.id === 'photo') {
                                  onChangeTemplate({ ...template, photoBorderColor: e.target.value });
                                }
                              }}
                              className="w-7 h-7 rounded-md border border-slate-300 cursor-pointer p-0.5"
                            />
                            <span className="font-mono text-[10px] uppercase font-bold text-slate-700">
                              {selectedField.borderColor || template.photoBorderColor || '#168A45'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Wireframe Placeholder Label */}
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          Placeholder Caption
                        </label>
                        <input
                          type="text"
                          value={selectedField.placeholderLabel || 'EMPLOYEE PHOTO'}
                          onChange={(e) =>
                            updateField(selectedField.id, { placeholderLabel: e.target.value })
                          }
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. TYPOGRAPHY & STYLING (For text, badges, and dynamic fields) */}
                  {selectedField.type !== 'photo' &&
                    selectedField.type !== 'image' &&
                    selectedField.type !== 'qrcode' &&
                    selectedField.type !== 'barcode' && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                        <div className="font-bold text-slate-800 text-[11px] flex items-center space-x-1.5">
                          <Type className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Typography & Color</span>
                        </div>

                        {/* Font Size & Weight */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              Font Size ({selectedField.fontSize || 12}px)
                            </label>
                            <input
                              type="range"
                              min={8}
                              max={24}
                              value={selectedField.fontSize || 12}
                              onChange={(e) =>
                                updateField(selectedField.id, { fontSize: Number(e.target.value) })
                              }
                              className="w-full accent-emerald-600 cursor-pointer"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                              Font Weight
                            </label>
                            <select
                              value={selectedField.fontWeight || 'normal'}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  fontWeight: e.target.value as any,
                                })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                            >
                              <option value="normal">Normal</option>
                              <option value="medium">Medium</option>
                              <option value="semibold">Semibold</option>
                              <option value="bold">Bold</option>
                            </select>
                          </div>
                        </div>

                        {/* Text Alignment */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            Alignment
                          </label>
                          <div className="grid grid-cols-3 gap-1">
                            {(['left', 'center', 'right'] as const).map((a) => (
                              <button
                                key={a}
                                onClick={() => updateField(selectedField.id, { textAlign: a })}
                                className={`py-1 rounded-md border font-semibold text-[11px] capitalize cursor-pointer ${
                                  (selectedField.textAlign || 'left') === a
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-500'
                                    : 'bg-white border-slate-200 text-slate-600'
                                }`}
                              >
                                {a}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Text Color */}
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                            Text Color
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={selectedField.color || '#0F172A'}
                              onChange={(e) => updateField(selectedField.id, { color: e.target.value })}
                              className="w-7 h-7 rounded-md border border-slate-300 cursor-pointer p-0.5"
                            />
                            {/* Preset swatches */}
                            <div className="flex items-center space-x-1">
                              {['#0F172A', '#168A45', '#0B5D2A', '#1E3A8A', '#B91C1C', '#FFFFFF'].map(
                                (c) => (
                                  <button
                                    key={c}
                                    onClick={() => updateField(selectedField.id, { color: c })}
                                    style={{ backgroundColor: c }}
                                    className="w-4 h-4 rounded-full border border-slate-300 cursor-pointer"
                                  />
                                )
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Prefix and Label Toggle */}
                        <div className="pt-2 border-t border-slate-200 space-y-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedField.showLabel)}
                              onChange={(e) =>
                                updateField(selectedField.id, { showLabel: e.target.checked })
                              }
                              className="accent-emerald-600 rounded-sm"
                            />
                            <span className="font-semibold text-slate-700 text-[11px]">
                              Show Prefix Label
                            </span>
                          </label>

                          {selectedField.showLabel && (
                            <input
                              type="text"
                              placeholder="e.g. ID: or Blood: "
                              value={selectedField.customPrefix || ''}
                              onChange={(e) =>
                                updateField(selectedField.id, { customPrefix: e.target.value })
                              }
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs"
                            />
                          )}
                        </div>

                        {/* Badge / Pill styling */}
                        <div className="pt-2 border-t border-slate-200">
                          <label className="flex items-center space-x-2 cursor-pointer mb-1.5">
                            <input
                              type="checkbox"
                              checked={Boolean(selectedField.backgroundColor)}
                              onChange={(e) =>
                                updateField(selectedField.id, {
                                  backgroundColor: e.target.checked ? '#EAF7EF' : undefined,
                                  borderRadius: e.target.checked ? 9999 : undefined,
                                })
                              }
                              className="accent-emerald-600 rounded-sm"
                            />
                            <span className="font-semibold text-slate-700 text-[11px]">
                              Render as Status Pill / Badge
                            </span>
                          </label>

                          {selectedField.backgroundColor && (
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={selectedField.backgroundColor || '#EAF7EF'}
                                onChange={(e) =>
                                  updateField(selectedField.id, { backgroundColor: e.target.value })
                                }
                                className="w-6 h-6 rounded-md border border-slate-300 cursor-pointer p-0.5"
                              />
                              <span className="text-[10px] text-slate-500 font-mono">
                                Pill Background Color
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {/* 4. EXACT COORDINATES & BOUNDS */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="font-bold text-slate-800 text-[11px] flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Move className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Coordinates (%)</span>
                      </span>
                      <span className="font-mono text-emerald-800 font-bold">
                        X: {selectedField.x}%, Y: {selectedField.y}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>Horizontal (X)</span>
                          <span>{selectedField.x}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={selectedField.x}
                          onChange={(e) =>
                            updateField(selectedField.id, { x: Number(e.target.value) })
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                          <span>Vertical (Y)</span>
                          <span>{selectedField.y}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={selectedField.y}
                          onChange={(e) =>
                            updateField(selectedField.id, { y: Number(e.target.value) })
                          }
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 space-y-2">
                  <Sliders className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="font-semibold text-xs text-slate-600">No Field Selected</p>
                  <p className="text-[11px] text-slate-400">
                    Click any field on the canvas or in the element toolbox to inspect and customize its settings.
                  </p>
                </div>
              )}
            </>
          )}

          {/* LAYERS TAB: FULL LIST OF PLACED FIELDS */}
          {inspectorTab === 'layers' && (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Z-Order & Placed Elements ({template.fields.length})
              </div>
              {template.fields.map((field, idx) => {
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
                    <div className="flex items-center space-x-2 truncate">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(field.id);
                        }}
                        className={`p-1 rounded-md cursor-pointer ${
                          field.visible ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-300'
                        }`}
                        title={field.visible ? 'Hide field' : 'Show field'}
                      >
                        {field.visible ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <div className="truncate">
                        <div className="font-bold text-slate-800 text-[11px] truncate">
                          {field.label}
                        </div>
                        <div className="text-[9px] text-slate-400 font-mono">
                          ({field.x}%, {field.y}%) • {field.type}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderLayer(field.id, 'up');
                        }}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reorderLayer(field.id, 'down');
                        }}
                        disabled={idx === template.fields.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeField(field.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete Layer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
