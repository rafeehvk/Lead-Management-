import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowRightLeft,
  User,
  UserCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  Check,
  ExternalLink,
  Layers,
  Search,
  Tag,
  MapPin,
  Clock,
  FileText,
} from 'lucide-react';
import { Asset, AssetCondition } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';
import { hrStorage } from '../../services/hrStorageService';

export interface InitiateTransferModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string, transferredAsset?: Asset, referenceNumber?: string) => void;
  onViewMovementLedger?: (assetId: string) => void;
  actorName?: string;
  allAssets?: Asset[];
}

export const InitiateTransferModal: React.FC<InitiateTransferModalProps> = ({
  asset: initialAsset,
  isOpen,
  onClose,
  onSuccess,
  onViewMovementLedger,
  actorName = 'Admin',
  allAssets: providedAssets,
}) => {
  if (!isOpen) return null;

  // Retrieve inventory assets if needed for dropdown
  const assetsList = useMemo(() => {
    return providedAssets || assetStorage.getAssets();
  }, [providedAssets]);

  // Selected Asset state
  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    initialAsset?.id || assetsList[0]?.id || ''
  );

  const activeAsset = useMemo(() => {
    return assetsList.find((a) => a.id === selectedAssetId) || initialAsset || null;
  }, [selectedAssetId, assetsList, initialAsset]);

  // Staff directory for destination user selection
  const staffList = useMemo(() => hrStorage.getStaff(), []);

  // Exclude current custodian from recipient list if applicable
  const currentCustodianEmpId = activeAsset?.currentAssignment?.employeeId;
  const eligibleStaff = useMemo(() => {
    return staffList.filter((s) => s.id !== currentCustodianEmpId);
  }, [staffList, currentCustodianEmpId]);

  // Form states
  const [destinationUserId, setDestinationUserId] = useState<string>('');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [destinationBranch, setDestinationBranch] = useState(
    activeAsset?.location.branch || 'Kochi Campus'
  );
  const [destinationRoom, setDestinationRoom] = useState(
    activeAsset?.location.room || 'General Bay'
  );
  const [condition, setCondition] = useState<AssetCondition>(
    activeAsset?.condition || 'Good'
  );
  const [accessories, setAccessories] = useState<string[]>(
    activeAsset?.accessories || []
  );
  const [newAccessoryInput, setNewAccessoryInput] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(true);

  // Status & Validation
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferCompletedResult, setTransferCompletedResult] = useState<{
    assetId: string;
    assetName: string;
    destinationName: string;
    referenceNumber: string;
    movementId: string;
  } | null>(null);

  // Update defaults when activeAsset changes
  useEffect(() => {
    if (activeAsset) {
      setCondition(activeAsset.condition || 'Good');
      setAccessories(activeAsset.accessories || []);
      setDestinationBranch(activeAsset.location.branch || 'Kochi Campus');
      setDestinationRoom(activeAsset.location.room || 'General Bay');
    }
  }, [activeAsset]);

  // Auto-update destination branch/room if destination user has specific department
  const selectedDestinationStaff = useMemo(() => {
    return staffList.find((s) => s.id === destinationUserId) || null;
  }, [destinationUserId, staffList]);

  useEffect(() => {
    if (selectedDestinationStaff) {
      if (selectedDestinationStaff.branch) {
        setDestinationBranch(selectedDestinationStaff.branch);
      }
      if (selectedDestinationStaff.department) {
        setDestinationRoom(`${selectedDestinationStaff.department} Dept`);
      }
    }
  }, [selectedDestinationStaff]);

  // Filtered staff for selector
  const filteredStaff = useMemo(() => {
    if (!staffSearchQuery.trim()) return eligibleStaff;
    const q = staffSearchQuery.toLowerCase();
    return eligibleStaff.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.department && s.department.toLowerCase().includes(q)) ||
        (s.position && s.position.toLowerCase().includes(q))
    );
  }, [eligibleStaff, staffSearchQuery]);

  const handleToggleAccessory = (item: string) => {
    setAccessories((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddAccessory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAccessoryInput.trim() && !accessories.includes(newAccessoryInput.trim())) {
      setAccessories([...accessories, newAccessoryInput.trim()]);
      setNewAccessoryInput('');
    }
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Mandatory Asset Check
    if (!activeAsset) {
      setError('Please select an active hardware asset to transfer.');
      return;
    }

    // 2. Mandatory Destination User Check
    if (!destinationUserId || !selectedDestinationStaff) {
      setError('Destination user selection is required. Please choose an employee from the directory.');
      return;
    }

    // 3. Prevent transferring to self
    if (activeAsset.currentAssignment?.employeeId === destinationUserId) {
      setError('The destination employee is already the current custodian of this asset.');
      return;
    }

    // 4. Mandatory Reason Check
    if (!transferReason.trim()) {
      setError('Please provide the operational reason or justification for this transfer.');
      return;
    }

    // 5. Custody Verification Checkbox
    if (!acknowledged) {
      setError('Please verify and acknowledge the digital custody handover.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = assetStorage.transferAsset(
        activeAsset.id,
        {
          newEmployeeId: selectedDestinationStaff.id,
          newEmployeeName: selectedDestinationStaff.fullName,
          newDepartment: selectedDestinationStaff.department || 'General',
          newLocation: {
            branch: destinationBranch,
            room: destinationRoom,
          },
          condition,
          accessories,
          reason: transferReason.trim(),
        },
        actorName
      );

      if (!res.success) {
        setError(res.message);
        setIsSubmitting(false);
        return;
      }

      const refNo = res.movement?.referenceNumber || `TRF-${activeAsset.id}-${Date.now().toString().slice(-4)}`;
      const movId = res.movement?.id || `MOV-${new Date().getFullYear()}-0001`;

      setTransferCompletedResult({
        assetId: activeAsset.id,
        assetName: activeAsset.name,
        destinationName: selectedDestinationStaff.fullName,
        referenceNumber: refNo,
        movementId: movId,
      });

      onSuccess(res.message, res.asset, refNo);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during asset transfer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-2xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-linear-to-r from-emerald-800 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ArrowRightLeft className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">Initiate Asset Transfer</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  Ledger Enforced
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                Reassign physical custodianship and automatically record movement into the immutable ledger
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {transferCompletedResult ? (
          /* Success Screen with Immediate Movement Ledger Action */
          <div className="p-8 text-center space-y-5 my-auto animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h4 className="text-lg font-bold text-slate-900">
                Asset Transfer Successfully Executed!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Custody of <strong>{transferCompletedResult.assetId}</strong> ({transferCompletedResult.assetName}) has been officially transferred to{' '}
                <span className="text-emerald-800 font-bold">{transferCompletedResult.destinationName}</span>.
              </p>
            </div>

            {/* Audit Receipt Badge */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-left space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Movement Ledger Reference:</span>
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {transferCompletedResult.referenceNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Ledger Transaction ID:</span>
                <span className="font-mono font-semibold text-emerald-800">
                  {transferCompletedResult.movementId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Timestamp:</span>
                <span className="text-slate-700">
                  {new Date().toISOString().split('T')[0]} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Ledger Audit Status:</span>
                <span className="inline-flex items-center text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Logged & Immutable
                </span>
              </div>
            </div>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onViewMovementLedger) {
                    onViewMovementLedger(transferCompletedResult.assetId);
                  }
                }}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <span>View in Movement Ledger</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Back to Asset Register
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitTransfer} className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Error Notification */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2.5 text-xs text-rose-800 animate-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{error}</div>
              </div>
            )}

            {/* 1. ASSET SELECTION & CURRENT ORIGIN */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Asset Identity to Transfer *</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">Step 1 of 3</span>
              </div>

              {/* Asset Dropdown if multiple available or user wants to switch */}
              <div>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                >
                  {assetsList.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} — {a.name} [{a.category}] • Currently:{' '}
                      {a.currentAssignment?.employeeName
                        ? `${a.currentAssignment.employeeName} (${a.currentAssignment.department})`
                        : `${a.status} in Central Store`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Asset Summary Pill */}
              {activeAsset && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-white border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Current Custodian (Origin)
                    </span>
                    <span className="font-bold text-slate-900 flex items-center space-x-1.5 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">
                        {activeAsset.currentAssignment?.employeeName || 'Central Store / IT Inventory'}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-500 block truncate pl-5">
                      {activeAsset.currentAssignment?.department || activeAsset.location.branch}
                    </span>
                  </div>

                  <div className="sm:border-l sm:border-slate-100 sm:pl-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Hardware Spec & Condition
                    </span>
                    <span className="font-bold text-slate-800 block truncate mt-0.5">
                      {activeAsset.brand} {activeAsset.model}
                    </span>
                    <span className="text-[11px] text-slate-500 flex items-center space-x-2 font-mono">
                      <span>S/N: {activeAsset.serialNumber}</span>
                      <span className="text-emerald-700 font-sans font-semibold">
                        • {activeAsset.condition}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 2. MANDATORY DESTINATION USER SELECTION */}
            <div className="p-4 bg-emerald-50/40 border-2 border-emerald-600/30 rounded-2xl space-y-3.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-900 flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span>Destination User (New Custodian) *</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  Required Selection
                </span>
              </div>

              {/* Destination Staff Dropdown */}
              <div className="space-y-2">
                <select
                  value={destinationUserId}
                  onChange={(e) => {
                    setDestinationUserId(e.target.value);
                    setError(null);
                  }}
                  className={`w-full text-xs px-3.5 py-2.5 border rounded-xl font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-none transition-colors ${
                    destinationUserId
                      ? 'border-emerald-500 bg-white text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-300 bg-white text-slate-500'
                  }`}
                  required
                >
                  <option value="">-- Click to Select Destination User from Staff Directory * --</option>
                  {eligibleStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName} ({staff.id}) — {staff.department} [{staff.position}]
                    </option>
                  ))}
                </select>

                <p className="text-[11px] text-slate-500">
                  Select the recipient employee who will take physical and administrative custody of this hardware asset.
                </p>
              </div>

              {/* Selected Destination User Detail Dossier Card */}
              {selectedDestinationStaff ? (
                <div className="p-3.5 bg-white border border-emerald-200 rounded-xl shadow-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {selectedDestinationStaff.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {selectedDestinationStaff.fullName}
                        </h4>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-600">
                          <span className="font-mono font-semibold text-emerald-800">
                            {selectedDestinationStaff.id}
                          </span>
                          <span>•</span>
                          <span>{selectedDestinationStaff.position}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                      {selectedDestinationStaff.department}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400 block">Work Email:</span>
                      <span className="font-medium text-slate-800 truncate block">
                        {selectedDestinationStaff.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Assigned Branch:</span>
                      <span className="font-medium text-slate-800 truncate block">
                        {selectedDestinationStaff.branch || destinationBranch}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white/70 border border-dashed border-amber-300 rounded-xl text-center text-xs text-amber-800">
                  Please choose a destination user from the dropdown above to proceed with the transfer.
                </div>
              )}
            </div>

            {/* 3. TRANSFER LOGISTICS & JUSTIFICATION */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Transfer Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Transfer Effective Date *</span>
                  </label>
                  <input
                    type="date"
                    value={transferDate}
                    onChange={(e) => setTransferDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                    required
                  />
                </div>

                {/* Condition at Handover */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    <span>Physical Condition at Handover *</span>
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as AssetCondition)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  >
                    <option value="New">New / Sealed</option>
                    <option value="Excellent">Excellent (No Wear)</option>
                    <option value="Good">Good (Normal Working Condition)</option>
                    <option value="Fair">Fair (Cosmetic Scratches)</option>
                    <option value="Damaged">Damaged / Issue Noted</option>
                  </select>
                </div>
              </div>

              {/* Destination Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <Building className="w-3.5 h-3.5 text-slate-500" />
                    <span>Destination Campus / Branch</span>
                  </label>
                  <input
                    type="text"
                    value={destinationBranch}
                    onChange={(e) => setDestinationBranch(e.target.value)}
                    placeholder="e.g. Kochi Campus"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>Destination Room / Workstation</span>
                  </label>
                  <input
                    type="text"
                    value={destinationRoom}
                    onChange={(e) => setDestinationRoom(e.target.value)}
                    placeholder="e.g. Engineering Bay Desk 14"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Accessories Checklist */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Handover Accessories Verification Checklist
                </label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {accessories.map((item) => (
                      <label
                        key={item}
                        className="flex items-center space-x-2 p-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleToggleAccessory(item)}
                          className="rounded text-emerald-800 focus:ring-emerald-700 w-3.5 h-3.5"
                        />
                        <span className="text-slate-700 truncate font-medium">{item}</span>
                      </label>
                    ))}
                  </div>

                  {/* Add accessory input */}
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="text"
                      placeholder="Add accessory (e.g. USB-C Dock, Bag, Dongle)..."
                      value={newAccessoryInput}
                      onChange={(e) => setNewAccessoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddAccessory(e);
                        }
                      }}
                      className="text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg flex-1 focus:ring-1 focus:ring-emerald-700 focus:outline-none bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddAccessory}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Mandatory Reason for Transfer */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Reason for Transfer (Audit Trail Justification) *</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Required</span>
                </div>

                <textarea
                  rows={2}
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="Explain why this asset is being reassigned (e.g. New employee joining Sales team, hardware upgrade for field demo, role change)..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />

                {/* Quick chip suggestions */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-slate-400">Quick reasons:</span>
                  {[
                    'Department Reallocation',
                    'Role Change / Promotion',
                    'New Onboarding Replacement',
                    'Project Deployment',
                    'Branch Transfer',
                  ].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => setTransferReason(quick)}
                      className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-600 rounded-md border border-slate-200 transition-colors cursor-pointer"
                    >
                      {quick}
                    </button>
                  ))}
                </div>
              </div>

              {/* Digital Acknowledgment Checkbox */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start space-x-2.5">
                <input
                  type="checkbox"
                  id="transfer-ack"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4 mt-0.5 cursor-pointer"
                />
                <label htmlFor="transfer-ack" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-bold text-slate-900 block">
                    Confirm Custody Handover & Ledger Registration
                  </span>
                  <span className="text-slate-500 text-[11px] block">
                    By submitting, the asset register will update the active custodian to{' '}
                    <strong>{selectedDestinationStaff?.fullName || 'the destination user'}</strong> and an immutable event will be logged in the Asset Movement Ledger.
                  </span>
                </label>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
              <div className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Authorized by: {actorName}</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !destinationUserId}
                  className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all flex items-center space-x-2 ${
                    !destinationUserId
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-emerald-800 hover:bg-emerald-900 cursor-pointer active:scale-95'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording Transfer...' : 'Complete & Log Transfer'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
