import React from 'react';
import { IdCardTemplateSettings, IdCardFieldConfig, StaffMember } from '../../types/hr';
import { QrCode, Shield, CheckCircle2 } from 'lucide-react';

interface StaffIdCardRendererProps {
  template: IdCardTemplateSettings;
  staff?: StaffMember | null;
  side?: 'front' | 'back';
  scale?: number;
  isInteractive?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  onMoveField?: (fieldId: string, newX: number, newY: number) => void;
}

export const StaffIdCardRenderer: React.FC<StaffIdCardRendererProps> = ({
  template,
  staff,
  side = 'front',
  scale = 1,
  isInteractive = false,
  selectedFieldId = null,
  onSelectField,
  onMoveField,
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [draggingFieldId, setDraggingFieldId] = React.useState<string | null>(null);

  // Fallback sample staff if none provided
  const activeStaff: StaffMember = staff || {
    id: 'CB/101/001',
    staffCode: 'CB/101/001',
    departmentCode: '101',
    fullName: 'Deepa Nair',
    dateOfBirth: '1982-11-20',
    gender: 'Female',
    email: 'deepa.nair@casbiro.com',
    contactNumber: '+91 98470 55667',
    whatsappNumber: '+91 98470 55667',
    emergencyContact: {
      name: 'Unnikrishnan Nair',
      relationship: 'Spouse',
      phone: '+91 98470 11223',
    },
    permanentAddress: {
      addressLine1: 'Flat 4B, Silver Oak Heights',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      pinCode: '682017',
    },
    communicationAddress: {
      sameAsPermanent: true,
      addressLine1: 'Flat 4B, Silver Oak Heights',
      city: 'Kochi',
      state: 'Kerala',
      country: 'India',
      pinCode: '682017',
    },
    joiningDate: '2025-06-01',
    division: 'Academic Wing',
    department: 'Academic',
    position: 'Vice Principal & Head of Academics',
    employmentType: 'Full Time',
    reportingManager: 'Dr. Ramesh Nambiar',
    workLocation: 'Kochi Main Campus',
    probationPeriod: 'Confirmed',
    employmentStatus: 'Active',
    documents: [],
    salary: {
      basicSalary: 42000,
      hra: 16800,
      allowances: 6200,
      specialAllowance: 3000,
      bonus: 0,
      otherEarnings: 0,
      grossSalary: 68000,
      pfDeduction: 1800,
      taxDeduction: 3200,
      otherDeductions: 0,
      totalDeductions: 5000,
      netSalary: 63000,
      salaryFrequency: 'Monthly',
      paymentMethod: 'Bank Transfer',
    },
    todayAttendanceStatus: 'Present',
    overallKpiScore: 91,
    createdDate: '2025-06-01',
    updatedDate: '2026-09-01',
  };

  const isPortrait = template.orientation !== 'landscape';
  // Standard CR80 aspect ratio ~ 1 : 1.58
  const baseWidth = isPortrait ? 320 : 500;
  const baseHeight = isPortrait ? 500 : 320;

  // Handle pointer down for dragging field elements
  const handlePointerDown = (e: React.PointerEvent, fieldId: string) => {
    if (!isInteractive) return;
    e.stopPropagation();
    if (onSelectField) onSelectField(fieldId);
    setDraggingFieldId(fieldId);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractive || !draggingFieldId || !cardRef.current || !onMoveField) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Calculate percentage coordinates
    const xPct = Math.max(0, Math.min(100, Math.round((clientX / rect.width) * 100)));
    const yPct = Math.max(0, Math.min(100, Math.round((clientY / rect.height) * 100)));
    onMoveField(draggingFieldId, xPct, yPct);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingFieldId) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture released
      }
      setDraggingFieldId(null);
    }
  };

  // Get value for a given field
  const getFieldValue = (field: IdCardFieldConfig): string => {
    if (field.customValue) return field.customValue;
    switch (field.id) {
      case 'fullName':
        return activeStaff.fullName;
      case 'staffId':
        return activeStaff.id || activeStaff.staffCode || 'CB/101/001';
      case 'position':
        return activeStaff.position;
      case 'department':
        return activeStaff.department;
      case 'departmentCode':
        return activeStaff.departmentCode || '101';
      case 'bloodGroup':
        return 'O+ Positive';
      case 'emergencyPhone':
        return activeStaff.emergencyContact?.phone || activeStaff.contactNumber;
      case 'contactNumber':
        return activeStaff.contactNumber;
      case 'joiningDate':
        return activeStaff.joiningDate;
      case 'validUntil':
        return '31-DEC-2028';
      case 'workLocation':
        return activeStaff.workLocation || 'Kochi Main Campus';
      case 'email':
        return activeStaff.email;
      case 'signature':
        return template.authorizedSignatoryTitle || 'Authorized Signatory';
      default:
        return field.customValue || field.label;
    }
  };

  const bgImage = side === 'front' ? template.backgroundImage : template.backBackgroundImage;
  const isCustomBg = Boolean(bgImage);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        borderRadius: `${template.cardCornerRadius || 16}px`,
      }}
      className={`relative select-none overflow-hidden shadow-xl bg-white border border-slate-300 font-sans transition-all text-slate-800 ${
        isInteractive ? 'cursor-default' : ''
      }`}
    >
      {/* Background Image if uploaded */}
      {isCustomBg ? (
        <img
          src={bgImage}
          alt="ID Card Template Background"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
        />
      ) : (
        /* Built-in subtle background pattern */
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />
        </div>
      )}

      {/* FRONT SIDE RENDERING */}
      {side === 'front' && (
        <>
          {/* Header Banner (shown if not using full background artwork) */}
          {(!isCustomBg || !template.useFullBackgroundArtwork) && (
            <div
              style={{
                backgroundColor: template.headerBgColor || '#0B5D2A',
                color: template.headerTextColor || '#FFFFFF',
              }}
              className="relative z-1 px-4 py-3 text-center shadow-xs"
            >
              <div className="flex items-center justify-center space-x-2">
                {template.logoUrl ? (
                  <img
                    src={template.logoUrl}
                    alt="Logo"
                    className="w-6 h-6 object-contain rounded-xs"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                    <Shield className="w-3 h-3 text-white" />
                  </div>
                )}
                <h3 className="text-xs font-black tracking-wide uppercase leading-tight truncate">
                  {template.institutionName || 'CASBIRO SOLUTIONS'}
                </h3>
              </div>
              {template.institutionSubtitle && (
                <p className="text-[9px] opacity-85 tracking-wider uppercase mt-0.5 font-medium truncate">
                  {template.institutionSubtitle}
                </p>
              )}
              {/* Accent Line */}
              <div
                style={{ backgroundColor: template.accentColor || '#168A45' }}
                className="absolute bottom-0 left-0 right-0 h-1"
              />
            </div>
          )}

          {/* DYNAMIC FIELDS OVERLAY */}
          {template.fields
            .filter((f) => f.visible)
            .map((field) => {
              const isSelected = isInteractive && selectedFieldId === field.id;
              const isDragging = isInteractive && draggingFieldId === field.id;

              if (field.type === 'photo') {
                const photoSize = template.photoSize || 84;
                const shapeClass =
                  template.photoShape === 'circle'
                    ? 'rounded-full'
                    : template.photoShape === 'rounded'
                    ? 'rounded-2xl'
                    : 'rounded-xs';

                return (
                  <div
                    key={field.id}
                    onPointerDown={(e) => handlePointerDown(e, field.id)}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${photoSize}px`,
                      height: `${photoSize}px`,
                      borderColor: template.photoBorderColor || '#168A45',
                      borderWidth: `${template.photoBorderWidth ?? 3}px`,
                    }}
                    className={`absolute z-10 flex items-center justify-center bg-slate-100 shadow-md overflow-hidden ${shapeClass} ${
                      isInteractive ? 'cursor-move hover:ring-2 hover:ring-emerald-500' : ''
                    } ${isSelected ? 'ring-2 ring-emerald-600 ring-offset-2' : ''} ${
                      isDragging ? 'opacity-80 scale-105' : ''
                    }`}
                  >
                    {activeStaff.profilePhoto ? (
                      <img
                        src={activeStaff.profilePhoto}
                        alt={activeStaff.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-700 to-[#0B5D2A] text-white">
                        <span className="text-2xl font-black">
                          {activeStaff.fullName.charAt(0)}
                        </span>
                        <span className="text-[8px] font-bold opacity-80 uppercase tracking-widest mt-0.5">
                          Staff
                        </span>
                      </div>
                    )}
                    {isInteractive && (
                      <div className="absolute inset-0 bg-emerald-900/10 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[9px] bg-black/70 text-white font-mono px-1 rounded-xs">
                          {field.x}%, {field.y}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              if (field.type === 'qrcode') {
                const qrSize = field.width || 44;
                return (
                  <div
                    key={field.id}
                    onPointerDown={(e) => handlePointerDown(e, field.id)}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${qrSize}px`,
                      height: `${qrSize}px`,
                    }}
                    className={`absolute z-10 p-1 bg-white border border-slate-300 rounded-lg shadow-2xs flex flex-col items-center justify-center ${
                      isInteractive ? 'cursor-move hover:ring-2 hover:ring-emerald-500' : ''
                    } ${isSelected ? 'ring-2 ring-emerald-600 ring-offset-2' : ''}`}
                  >
                    <QrCode className="w-full h-full text-slate-800" />
                  </div>
                );
              }

              if (field.type === 'barcode') {
                const bWidth = field.width || 140;
                const bHeight = field.height || 26;
                return (
                  <div
                    key={field.id}
                    onPointerDown={(e) => handlePointerDown(e, field.id)}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${bWidth}px`,
                      height: `${bHeight}px`,
                    }}
                    className={`absolute z-10 bg-white/90 p-1 rounded-xs flex flex-col items-center justify-center border border-slate-200 ${
                      isInteractive ? 'cursor-move hover:ring-2 hover:ring-emerald-500' : ''
                    } ${isSelected ? 'ring-2 ring-emerald-600 ring-offset-2' : ''}`}
                  >
                    {/* Simulated Clean Barcode Lines */}
                    <div className="flex items-center space-x-[2px] h-4 w-full justify-center overflow-hidden">
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-1.5 h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-[2px] h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-2 h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-[1px] h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                      <div className="w-[2px] h-full bg-slate-900" />
                      <div className="w-1 h-full bg-slate-900" />
                    </div>
                    <span className="text-[8px] font-mono font-bold text-slate-800">
                      {activeStaff.id}
                    </span>
                  </div>
                );
              }

              if (field.type === 'signature') {
                return (
                  <div
                    key={field.id}
                    onPointerDown={(e) => handlePointerDown(e, field.id)}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-10 text-center ${
                      isInteractive ? 'cursor-move hover:ring-2 hover:ring-emerald-500 p-1' : ''
                    } ${isSelected ? 'ring-2 ring-emerald-600 ring-offset-2' : ''}`}
                  >
                    {template.authorizedSignatureImage ? (
                      <img
                        src={template.authorizedSignatureImage}
                        alt="Signature"
                        className="h-6 mx-auto object-contain"
                      />
                    ) : (
                      <div className="font-serif italic text-xs text-slate-600 border-b border-slate-400 pb-0.5 px-2">
                        Ramesh.N
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: `${field.fontSize || 8}px`,
                        color: field.color || '#475569',
                      }}
                      className="block font-medium tracking-tight mt-0.5"
                    >
                      {template.authorizedSignatoryTitle || 'Authorized Signatory'}
                    </span>
                  </div>
                );
              }

              // Standard Text Field
              const val = getFieldValue(field);
              const prefix = field.showLabel ? field.customPrefix || '' : '';
              const weightClass =
                field.fontWeight === 'bold'
                  ? 'font-bold'
                  : field.fontWeight === 'semibold'
                  ? 'font-semibold'
                  : field.fontWeight === 'medium'
                  ? 'font-medium'
                  : 'font-normal';

              const alignTransform =
                field.textAlign === 'center'
                  ? 'translate(-50%, -50%)'
                  : field.textAlign === 'right'
                  ? 'translate(-100%, -50%)'
                  : 'translate(0%, -50%)';

              return (
                <div
                  key={field.id}
                  onPointerDown={(e) => handlePointerDown(e, field.id)}
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: alignTransform,
                    fontSize: `${field.fontSize || 12}px`,
                    color: field.color || '#0F172A',
                    textAlign: field.textAlign || 'left',
                  }}
                  className={`absolute z-10 whitespace-nowrap leading-tight transition-shadow ${weightClass} ${
                    isInteractive
                      ? 'cursor-move hover:ring-1 hover:ring-emerald-400 px-1 py-0.5 rounded-xs'
                      : ''
                  } ${isSelected ? 'ring-2 ring-emerald-600 bg-emerald-50/50 rounded-xs' : ''}`}
                >
                  {prefix && <span className="text-slate-500 font-normal mr-0.5">{prefix}</span>}
                  <span>{val}</span>
                </div>
              );
            })}

          {/* Bottom Accent Strip (if built-in theme) */}
          {(!isCustomBg || !template.useFullBackgroundArtwork) && (
            <div
              style={{ backgroundColor: template.headerBgColor || '#0B5D2A' }}
              className="absolute bottom-0 left-0 right-0 h-2 z-1"
            />
          )}
        </>
      )}

      {/* BACK SIDE RENDERING */}
      {side === 'back' && (
        <div className="relative z-1 p-5 h-full flex flex-col justify-between text-left">
          {/* Header */}
          <div className="border-b border-slate-200 pb-2 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Emergency & Institutional Notice
              </div>
              <div className="text-xs font-bold text-slate-900">
                {template.institutionName || 'Casbiro Solutions Pvt Ltd'}
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          {/* Terms & Instructions */}
          <div className="space-y-2 py-2">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Terms of Use & Instructions
            </div>
            <div className="text-[10px] text-slate-600 whitespace-pre-line leading-relaxed bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80">
              {template.backTermsAndConditions ||
                '1. This card is non-transferable and remains the property of the institution.\n2. In case of loss, report immediately to the HR office.\n3. Must be presented upon request by campus security.'}
            </div>
          </div>

          {/* Return Address & Emergency Help */}
          <div className="space-y-2 pt-2 border-t border-slate-200 text-[10px]">
            <div>
              <span className="font-bold text-slate-700 block">Emergency Helpline:</span>
              <span className="text-emerald-800 font-semibold">
                {template.backEmergencyHelpline || '+91 98470 55667 / hr@casbiro.com'}
              </span>
            </div>

            <div>
              <span className="font-bold text-slate-700 block">Campus Return Address:</span>
              <span className="text-slate-500 leading-tight block">
                {template.backReturnAddress ||
                  'Casbiro Campus, Infopark Phase II, Kochi, Kerala 682042'}
              </span>
            </div>

            {/* Verification Badge */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[9px] text-slate-400">
              <div className="flex items-center space-x-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Digitally Authenticated</span>
              </div>
              <span className="font-mono">EMP #{activeStaff.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
