import React from 'react';
import { IdCardTemplateSettings, IdCardFieldConfig, StaffMember } from '../../types/hr';
import { QrCode, Shield, CheckCircle2, Camera, User, Image as ImageIcon } from 'lucide-react';

interface StaffIdCardRendererProps {
  template: IdCardTemplateSettings;
  staff?: StaffMember | null;
  side?: 'front' | 'back';
  scale?: number;
  isInteractive?: boolean;
  isWireframeMode?: boolean;
  showGrid?: boolean;
  showGuides?: boolean;
  selectedFieldId?: string | null;
  onSelectField?: (fieldId: string) => void;
  onMoveField?: (fieldId: string, newX: number, newY: number) => void;
  onDropItem?: (itemPayload: any, xPct: number, yPct: number) => void;
}

export const StaffIdCardRenderer: React.FC<StaffIdCardRendererProps> = ({
  template,
  staff,
  side = 'front',
  scale = 1,
  isInteractive = false,
  isWireframeMode = false,
  showGrid = false,
  showGuides = true,
  selectedFieldId = null,
  onSelectField,
  onMoveField,
  onDropItem,
}) => {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [draggingFieldId, setDraggingFieldId] = React.useState<string | null>(null);
  const [dragCurrentCoords, setDragCurrentCoords] = React.useState<{ x: number; y: number } | null>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [dropHoverCoords, setDropHoverCoords] = React.useState<{ x: number; y: number } | null>(null);

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
    const field = template.fields.find((f) => f.id === fieldId);
    if (field) {
      setDragCurrentCoords({ x: field.x, y: field.y });
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isInteractive || !draggingFieldId || !cardRef.current || !onMoveField) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Calculate percentage coordinates
    let xPct = Math.max(0, Math.min(100, Math.round((clientX / rect.width) * 100)));
    let yPct = Math.max(0, Math.min(100, Math.round((clientY / rect.height) * 100)));

    // Snap to center horizontal / vertical guides if within threshold
    if (showGuides) {
      if (Math.abs(xPct - 50) <= 2) xPct = 50;
      if (Math.abs(yPct - 50) <= 2) yPct = 50;
    }

    setDragCurrentCoords({ x: xPct, y: yPct });
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
      setDragCurrentCoords(null);
    }
  };

  // HTML5 Drag and Drop Handlers (From Toolbox Palette to Canvas)
  const handleDragOver = (e: React.DragEvent) => {
    if (!onDropItem || !cardRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    const rect = cardRef.current.getBoundingClientRect();
    let xPct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
    let yPct = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
    if (showGuides && Math.abs(xPct - 50) <= 3) xPct = 50;
    setDropHoverCoords({ x: xPct, y: yPct });
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
    setDropHoverCoords(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDropHoverCoords(null);
    if (!onDropItem || !cardRef.current) return;
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;
    try {
      const itemData = JSON.parse(rawData);
      const rect = cardRef.current.getBoundingClientRect();
      let xPct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
      let yPct = Math.max(0, Math.min(100, Math.round(((e.clientY - rect.top) / rect.height) * 100)));
      if (showGuides && Math.abs(xPct - 50) <= 3) xPct = 50;
      onDropItem(itemData, xPct, yPct);
    } catch (err) {
      console.error('Failed to parse dropped item', err);
    }
  };

  // Get value for a given field
  const getFieldValue = (field: IdCardFieldConfig): string => {
    // If static text or custom explicit value
    if (field.category === 'static_text' || field.customValue !== undefined) {
      return field.customValue ?? field.label;
    }
    const key = field.dynamicBindingKey || field.id;
    switch (key) {
      case 'fullName':
        return activeStaff.fullName;
      case 'staffId':
      case 'id':
      case 'staffCode':
        return activeStaff.id || activeStaff.staffCode || 'CB/101/001';
      case 'position':
        return activeStaff.position;
      case 'department':
        return activeStaff.department;
      case 'departmentCode':
        return activeStaff.departmentCode || '101';
      case 'division':
        return activeStaff.division || 'Academic Wing';
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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
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

      {/* Grid Overlay for Alignment */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none z-1 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, #168A45 1px, transparent 1px), linear-gradient(to bottom, #168A45 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Center Alignment Guides (Dashed snap lines) */}
      {showGuides && draggingFieldId && dragCurrentCoords && (
        <>
          {dragCurrentCoords.x === 50 && (
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-emerald-500/80 border-l border-dashed border-emerald-600 z-30 pointer-events-none animate-pulse">
              <span className="absolute top-2 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] font-mono px-1 rounded-xs">
                CENTER X (50%)
              </span>
            </div>
          )}
          {dragCurrentCoords.y === 50 && (
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500/80 border-t border-dashed border-emerald-600 z-30 pointer-events-none animate-pulse">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 bg-emerald-700 text-white text-[9px] font-mono px-1 rounded-xs">
                CENTER Y (50%)
              </span>
            </div>
          )}
        </>
      )}

      {/* Drag Over Drop Target Feedback */}
      {isDragOver && (
        <div className="absolute inset-0 border-2 border-dashed border-emerald-500 bg-emerald-50/40 z-40 pointer-events-none flex items-center justify-center">
          <div className="bg-emerald-800 text-white px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-2 text-xs font-bold animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>
              Drop field here {dropHoverCoords ? `(${dropHoverCoords.x}%, ${dropHoverCoords.y}%)` : ''}
            </span>
          </div>
          {dropHoverCoords && (
            <div
              style={{ left: `${dropHoverCoords.x}%`, top: `${dropHoverCoords.y}%` }}
              className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-emerald-600 bg-emerald-400/50 animate-ping pointer-events-none"
            />
          )}
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

          {/* DYNAMIC & STATIC FIELDS OVERLAY */}
          {template.fields
            .filter((f) => f.visible)
            .map((field) => {
              const isSelected = isInteractive && selectedFieldId === field.id;
              const isDragging = isInteractive && draggingFieldId === field.id;

              // IMAGE PLACEHOLDER FOR EMPLOYEE PHOTO
              if (field.type === 'photo' || field.type === 'image') {
                const photoSizeW = field.width || template.photoSize || 84;
                const photoSizeH = field.height || field.width || template.photoSize || 84;
                const shape = field.shape || template.photoShape || 'circle';
                const shapeClass =
                  shape === 'circle'
                    ? 'rounded-full'
                    : shape === 'rounded'
                    ? 'rounded-2xl'
                    : 'rounded-xs';

                const photoBorderColor = field.borderColor || template.photoBorderColor || '#168A45';
                const photoBorderWidth = field.borderWidth ?? template.photoBorderWidth ?? 3;
                const placeholderLabel = field.placeholderLabel || field.label || 'EMPLOYEE PHOTO';

                // Check whether to show wireframe placeholder or employee photo
                const showWireframe = isWireframeMode || (!activeStaff.profilePhoto && field.type === 'photo');

                return (
                  <div
                    key={field.id}
                    onPointerDown={(e) => handlePointerDown(e, field.id)}
                    style={{
                      left: `${field.x}%`,
                      top: `${field.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${photoSizeW}px`,
                      height: `${photoSizeH}px`,
                      borderColor: photoBorderColor,
                      borderWidth: `${photoBorderWidth}px`,
                    }}
                    className={`absolute z-10 flex items-center justify-center bg-slate-100 shadow-md overflow-hidden ${shapeClass} ${
                      isInteractive ? 'cursor-move hover:ring-2 hover:ring-emerald-500' : ''
                    } ${isSelected ? 'ring-2 ring-emerald-600 ring-offset-2' : ''} ${
                      isDragging ? 'opacity-85 scale-105 shadow-xl' : ''
                    }`}
                  >
                    {!showWireframe && activeStaff.profilePhoto ? (
                      <img
                        src={activeStaff.profilePhoto}
                        alt={activeStaff.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : showWireframe ? (
                      /* Distinct Graphic Design Wireframe Placeholder */
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100/90 text-slate-600 p-2 relative">
                        {/* Diagonal crosshair guide in wireframe */}
                        <div className="absolute inset-0 opacity-15 pointer-events-none">
                          <div className="w-full h-full border border-dashed border-slate-500" />
                        </div>
                        <Camera className="w-6 h-6 text-emerald-700 mb-1" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-slate-700 text-center leading-tight">
                          {placeholderLabel}
                        </span>
                        <span className="text-[7px] text-slate-400 font-mono mt-0.5">
                          {photoSizeW}×{photoSizeH}px
                        </span>
                      </div>
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

                    {/* Coordinates Tooltip while dragging or hovering in interactive mode */}
                    {isInteractive && (
                      <div className="absolute inset-0 bg-emerald-950/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[9px] bg-black/80 text-white font-mono px-1.5 py-0.5 rounded-xs shadow-xs">
                          {field.x}%, {field.y}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              }

              // QR CODE FIELD
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
                    {isInteractive && (
                      <span className="text-[7px] font-mono text-slate-400 absolute -bottom-3 bg-white/90 px-0.5 rounded-xs">
                        QR ({field.x}%, {field.y}%)
                      </span>
                    )}
                  </div>
                );
              }

              // BARCODE FIELD
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
                    className={`absolute z-10 bg-white/95 p-1 rounded-xs flex flex-col items-center justify-center border border-slate-200 shadow-2xs ${
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

              // SIGNATURE FIELD
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

              // TEXT & BADGE FIELDS (Static Text & Dynamic Staff Data)
              const val = isWireframeMode && field.category === 'dynamic_field'
                ? `[${field.label}]`
                : getFieldValue(field);
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

              const isBadge = field.type === 'badge' || Boolean(field.backgroundColor);

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
                    backgroundColor: field.backgroundColor || (isBadge ? '#EAF7EF' : undefined),
                    borderRadius: field.borderRadius ? `${field.borderRadius}px` : isBadge ? '9999px' : undefined,
                    letterSpacing: field.letterSpacing,
                    textTransform: field.textTransform,
                  }}
                  className={`absolute z-10 whitespace-nowrap leading-tight transition-all ${weightClass} ${
                    isBadge ? 'px-2.5 py-0.5 border border-black/10 shadow-2xs' : ''
                  } ${
                    isInteractive
                      ? 'cursor-move hover:ring-1 hover:ring-emerald-400 px-1 py-0.5 rounded-xs'
                      : ''
                  } ${isSelected ? 'ring-2 ring-emerald-600 bg-emerald-50/70 rounded-xs' : ''} ${
                    isDragging ? 'opacity-80 scale-105' : ''
                  }`}
                >
                  {prefix && <span className="text-slate-500 font-normal mr-0.5">{prefix}</span>}
                  <span>{val}</span>
                  {isInteractive && (
                    <span className="opacity-0 group-hover:opacity-100 text-[8px] font-mono text-slate-400 ml-1">
                      {field.x}%
                    </span>
                  )}
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

