import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowRightLeft,
  Search,
  Filter,
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  Clock,
  User,
  Building,
  ShieldCheck,
  Layers,
  Eye,
  X,
  Tag,
  MapPin,
  ExternalLink,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { Asset, AssetMovement } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';

export interface AssetMovementRegisterViewProps {
  actorName?: string;
  initialAssetId?: string;
  onSelectAssetId?: (assetId: string) => void;
  onViewAssetDetail?: (asset: Asset) => void;
  onAllocate?: (asset: Asset) => void;
  onTransfer?: (asset: Asset) => void;
  onReturn?: (asset: Asset) => void;
}

export const AssetMovementRegisterView: React.FC<AssetMovementRegisterViewProps> = ({
  actorName = 'Admin',
  initialAssetId,
  onSelectAssetId,
  onViewAssetDetail,
  onAllocate,
  onTransfer,
  onReturn,
}) => {
  const [movements, setMovements] = useState<AssetMovement[]>(() =>
    assetStorage.getMovements()
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDirection, setSelectedDirection] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [reversalModalOpen, setReversalModalOpen] = useState(false);
  const [targetMovement, setTargetMovement] = useState<AssetMovement | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Sync with prop change (e.g. when navigated from register with a specific asset)
  useEffect(() => {
    if (initialAssetId) {
      setSelectedAssetId(initialAssetId);
    }
  }, [initialAssetId]);

  const allAssets = useMemo(() => assetStorage.getAssets(), [movements]);

  const currentAsset = useMemo(() => {
    if (selectedAssetId === 'ALL') return null;
    return assetStorage.getAssetById(selectedAssetId) || allAssets.find((a) => a.id === selectedAssetId) || null;
  }, [selectedAssetId, allAssets]);

  const refreshData = () => {
    setMovements(assetStorage.getMovements());
  };

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.assetId.toLowerCase().includes(q) ||
        m.assetName.toLowerCase().includes(q) ||
        m.referenceNumber.toLowerCase().includes(q) ||
        (m.fromEmployee && m.fromEmployee.toLowerCase().includes(q)) ||
        (m.toEmployee && m.toEmployee.toLowerCase().includes(q)) ||
        m.reason.toLowerCase().includes(q);

      const matchesType = selectedType === 'ALL' || m.movementType === selectedType;
      const matchesDirection =
        selectedDirection === 'ALL' || m.direction === selectedDirection;
      const matchesAsset = selectedAssetId === 'ALL' || m.assetId === selectedAssetId;

      return matchesSearch && matchesType && matchesDirection && matchesAsset;
    });
  }, [movements, searchQuery, selectedType, selectedDirection, selectedAssetId]);

  const handleOpenReversal = (mov: AssetMovement) => {
    setTargetMovement(mov);
    setReversalReason(`Correction / administrative reversal of movement ${mov.referenceNumber}`);
    setReversalModalOpen(true);
  };

  const handleExecuteReversal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetMovement) return;

    assetStorage.reverseMovement(targetMovement.id, reversalReason, actorName);
    refreshData();
    setReversalModalOpen(false);
  };

  const handleExportCsv = () => {
    const csv = assetStorage.exportMovementsToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileName = selectedAssetId !== 'ALL'
      ? `Asset_Movement_Ledger_${selectedAssetId}_${new Date().toISOString().split('T')[0]}.csv`
      : `Asset_Movement_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAssetSelectChange = (assetId: string) => {
    setSelectedAssetId(assetId);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      {/* 1. Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Asset Movement & Custody Ledger</h2>
            {selectedAssetId !== 'ALL' && (
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black">
                Filtered: {selectedAssetId}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Immutable physical movement register tracking every check-in, check-out, transfer, and return
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {selectedAssetId !== 'ALL' && (
            <button
              onClick={() => setSelectedAssetId('ALL')}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Reset to view all assets"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show All Assets</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Ledger</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Filters Row with Prominent Asset Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Asset ID, Name, Employee, Reference, Reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
          />
        </div>

        {/* ASSET SELECTOR DROPDOWN - KEY FEATURE */}
        <div className="relative min-w-[240px] max-w-sm flex-1 sm:flex-initial">
          <div className="flex items-center space-x-1.5">
            <Layers className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedAssetId}
              onChange={(e) => handleAssetSelectChange(e.target.value)}
              className={`w-full text-xs px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none font-medium transition-colors ${
                selectedAssetId !== 'ALL'
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              <option value="ALL">All Assets ({allAssets.length} Registered)</option>
              <optgroup label="Select Asset to View Movement Trail:">
                {allAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.id} - {asset.name} [{asset.category}] ({asset.status})
                  </option>
                ))}
              </optgroup>
            </select>
            {selectedAssetId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedAssetId('ALL')}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Clear selected asset"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Direction Filter */}
        <div>
          <select
            value={selectedDirection}
            onChange={(e) => setSelectedDirection(e.target.value as any)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white font-medium"
          >
            <option value="ALL">All Directions (IN & OUT)</option>
            <option value="IN">IN (Incoming / Returns / Intake)</option>
            <option value="OUT">OUT (Issued / Check-Out / Transferred)</option>
          </select>
        </div>

        {/* Movement Type Filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white font-medium"
          >
            <option value="ALL">All Movement Types</option>
            <option value="Allocated to Employee">Allocated to Employee</option>
            <option value="Returned by Employee">Returned by Employee</option>
            <option value="Custodian Transfer">Custodian Transfer</option>
            <option value="Temporary Check-Out">Temporary Check-Out</option>
            <option value="Check-In Return">Check-In Return</option>
            <option value="Sent for Maintenance">Sent for Maintenance</option>
            <option value="Received from Maintenance">Received from Maintenance</option>
            <option value="Retired / Disposal">Retired / Disposal</option>
            <option value="Purchase Intake">Purchase Intake</option>
            <option value="Movement Reversal">Movement Reversal</option>
          </select>
        </div>
      </div>

      {/* 3. SELECTED ASSET SPOTLIGHT CARD (Appears when an asset is selected) */}
      {currentAsset && (
        <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-4 shadow-sm relative overflow-hidden animate-in slide-in-from-top-2 duration-150">
          <div className="absolute top-0 right-0 w-32 h-32 bg-radial from-emerald-100/40 to-transparent pointer-events-none rounded-bl-full" />

          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Left: Identity & Specifications */}
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm font-black px-2.5 py-1 bg-slate-900 text-white rounded-lg">
                  {currentAsset.id}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {currentAsset.name}
                </h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">
                  {currentAsset.category}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    currentAsset.status === 'Active' || currentAsset.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : currentAsset.status === 'Allocated' || currentAsset.status === 'Deployed'
                      ? 'bg-[#EAF7EF] text-[#0B5D2A] border border-[#168A45]'
                      : currentAsset.status === 'Under Maintenance' || currentAsset.status === 'In Maintenance'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : currentAsset.status === 'Checked Out'
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  ● {currentAsset.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                <span>
                  <strong>Brand:</strong> {currentAsset.brand} {currentAsset.model}
                </span>
                <span className="font-mono">
                  <strong>S/N:</strong> {currentAsset.serialNumber}
                </span>
                <span>
                  <strong>Condition:</strong>{' '}
                  <span className="font-semibold text-emerald-800">{currentAsset.condition}</span>
                </span>
                <span>
                  <strong>Location:</strong> {currentAsset.location.branch} ({currentAsset.location.room})
                </span>
              </div>

              {/* Current Custodian / Holder info */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-2 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold">Current Custody Status:</span>
                  {currentAsset.currentAssignment ? (
                    <span className="font-bold text-slate-900">
                      Assigned to {currentAsset.currentAssignment.employeeName} ({currentAsset.currentAssignment.department}) since {currentAsset.currentAssignment.allocatedDate}
                    </span>
                  ) : currentAsset.temporaryCheckOut ? (
                    <span className="font-bold text-indigo-900">
                      Temporarily Checked Out to {currentAsset.temporaryCheckOut.person} ({currentAsset.temporaryCheckOut.destination})
                    </span>
                  ) : currentAsset.status === 'Under Maintenance' ? (
                    <span className="font-bold text-amber-900">
                      Currently at Authorized Service Center for Maintenance
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-800">
                      Available in Central Store ({currentAsset.location.storageLocation || currentAsset.location.room})
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Quick Metrics & Actions */}
            <div className="flex flex-col items-end space-y-2.5">
              <div className="text-right">
                <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  Movement Records
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {filteredMovements.length}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    {filteredMovements.length === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onViewAssetDetail) {
                      onViewAssetDetail(currentAsset);
                    } else if (onSelectAssetId) {
                      onSelectAssetId(currentAsset.id);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Asset Dossier</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedAssetId('ALL')}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-colors cursor-pointer"
                  title="Clear selection and view movements of all assets"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Filter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Bar helper */}
      {selectedAssetId !== 'ALL' && (
        <div className="bg-emerald-50/80 border border-emerald-200/80 px-4 py-2 rounded-xl flex items-center justify-between text-xs text-emerald-950 font-medium">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-700" />
            <span>
              Displaying chronological custody movements for <strong>{currentAsset?.name || selectedAssetId}</strong> ({selectedAssetId})
            </span>
          </div>
          <button
            onClick={() => setSelectedAssetId('ALL')}
            className="text-emerald-800 hover:text-emerald-950 underline font-bold cursor-pointer"
          >
            Show All Assets
          </button>
        </div>
      )}

      {/* 4. Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Direction</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Asset Identity</th>
                <th className="py-3 px-3">Movement Type</th>
                <th className="py-3 px-3">Origin (From)</th>
                <th className="py-3 px-3">Destination (To)</th>
                <th className="py-3 px-3">Condition</th>
                <th className="py-3 px-3">Reference No</th>
                <th className="py-3 px-3">Handover Reason</th>
                <th className="py-3 px-3 text-right">Audit / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                    <div className="max-w-xs mx-auto space-y-2">
                      <History className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-600">No movement events recorded.</p>
                      <p className="text-[11px] text-slate-400">
                        {selectedAssetId !== 'ALL'
                          ? `There are no custody movement transactions matching your filters for asset ${selectedAssetId}.`
                          : 'No movement events matching your filters.'}
                      </p>
                      {selectedAssetId !== 'ALL' && (
                        <button
                          onClick={() => setSelectedAssetId('ALL')}
                          className="mt-2 text-xs font-bold text-emerald-800 hover:underline inline-block"
                        >
                          View All Assets Ledger
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIN = m.direction === 'IN';
                  const isCurrentAsset = m.assetId === selectedAssetId;

                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-[#F7FAF8] transition-colors ${
                        isCurrentAsset ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      {/* Direction Badge */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isIN
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          }`}
                        >
                          {isIN ? '↓ IN' : '↑ OUT'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-600">
                        <span className="font-bold text-slate-800 block">{m.date}</span>
                        <span className="text-[10px] text-slate-400">{m.time}</span>
                      </td>

                      {/* Asset Identity - Interactive Click to Isolate Asset */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleAssetSelectChange(m.assetId)}
                          className="text-left group cursor-pointer"
                          title={`Click to filter ledger specifically for ${m.assetId}`}
                        >
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-slate-900 group-hover:text-emerald-800 group-hover:underline block">
                              {m.assetId}
                            </span>
                            {selectedAssetId !== m.assetId && (
                              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1 rounded transition-opacity">
                                filter
                              </span>
                            )}
                          </div>
                          <span className="text-slate-600 truncate block max-w-xs group-hover:text-slate-900">
                            {m.assetName}
                          </span>
                        </button>
                      </td>

                      {/* Movement Type */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">{m.movementType}</span>
                        <span className="text-[10px] text-slate-400">By {m.createdBy}</span>
                      </td>

                      {/* From */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        {m.fromEmployee || m.fromLocation || '—'}
                      </td>

                      {/* To */}
                      <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">
                        {m.toEmployee || m.toLocation || '—'}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold">
                          {m.condition}
                        </span>
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-3 whitespace-nowrap font-mono text-slate-500 font-bold">
                        {m.referenceNumber}
                      </td>

                      {/* Reason */}
                      <td className="py-3 px-3 text-slate-700 max-w-xs truncate" title={m.reason}>
                        {m.reason}
                        {m.missingAccessories && m.missingAccessories.length > 0 && (
                          <span className="text-red-700 font-bold block text-[10px]">
                            ⚠️ Missing: {m.missingAccessories.join(', ')}
                          </span>
                        )}
                      </td>

                      {/* Action: Non-destructive Reversal (Section 47) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {m.movementType !== 'Movement Reversal' ? (
                          <button
                            onClick={() => handleOpenReversal(m)}
                            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Record Correction Reversal"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 italic">Reversed</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{filteredMovements.length}</span> recorded physical movements
            {selectedAssetId !== 'ALL' && (
              <span className="ml-1 text-emerald-800 font-bold">
                (filtered for asset {selectedAssetId})
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            Immutable Audit Trail • Section 47 Custody Compliance
          </div>
        </div>
      </div>

      {/* Reversal Confirmation Modal */}
      {reversalModalOpen && targetMovement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-800 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">Post Reversal Entry (Section 47)</h3>
              </div>
              <button onClick={() => setReversalModalOpen(false)} className="text-white/80 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleExecuteReversal} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Audit Compliance Policy</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Historical movement transactions are never deleted. A compensating contra-entry will be posted to reverse "{targetMovement.referenceNumber}".
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Reversal *</label>
                <textarea
                  rows={2}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Confirm Reversal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

