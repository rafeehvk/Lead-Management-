import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Printer,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Wrench,
  RotateCcw,
  ArrowRightLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  Tag,
  Download,
  UserCheck,
} from 'lucide-react';
import { Asset, AssetMovement } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';
import { AssetQrModal } from './AssetQrModal';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen?: boolean;
  onClose: () => void;
  onOpenQrModal?: (asset: Asset) => void;
  onAllocate?: (asset: Asset) => void;
  onTransfer?: (asset: Asset) => void;
  onReturn?: (asset: Asset) => void;
  onCheckOut?: (asset: Asset) => void;
  onCheckIn?: (asset: Asset) => void;
  onMaintenance?: (asset: Asset) => void;
  onRetire?: (asset: Asset) => void;
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  isOpen = true,
  onClose,
  onOpenQrModal,
  onAllocate,
  onTransfer,
  onReturn,
  onCheckOut,
  onCheckIn,
  onMaintenance,
  onRetire,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'assignment' | 'purchase' | 'movement' | 'maintenance' | 'warranty' | 'documents' | 'audit'
  >('overview');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [movements, setMovements] = useState<AssetMovement[]>([]);

  useEffect(() => {
    if (asset) {
      setMovements(assetStorage.getMovementsForAsset(asset.id));
    }
  }, [asset]);

  if (isOpen === false || !asset) return null;

  const maintenanceRecords = assetStorage
    .getMaintenanceRecords()
    .filter((m) => m.assetId === asset.id);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Available':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Deployed':
      case 'Allocated':
        return 'bg-[#EAF7EF] text-[#0B5D2A] border-[#168A45]';
      case 'Checked Out':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'In Maintenance':
      case 'Under Maintenance':
        return 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      case 'Damaged':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Retired':
      case 'Disposed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-mono font-bold text-emerald-400">
              {asset.id.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm font-black text-emerald-400">{asset.id}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(asset.status)}`}>
                  {asset.status}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-medium">
                  {asset.category}
                </span>
              </div>
              <h2 className="text-base font-bold text-white truncate">{asset.name}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center space-x-1.5 transition-colors"
              title="View QR Code & Tag"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Tag</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-2.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center space-x-1.5 transition-colors"
              title="Print Asset Dossier"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 px-6 bg-slate-100/80 border-b border-slate-200 overflow-x-auto shrink-0 text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview & Specs' },
            { id: 'assignment', label: 'Current Assignment' },
            { id: 'purchase', label: 'Purchase & Valuation' },
            { id: 'movement', label: `Lifecycle Timeline (${movements.length})` },
            { id: 'maintenance', label: `Maintenance (${maintenanceRecords.length})` },
            { id: 'warranty', label: 'Warranty Policy' },
            { id: 'documents', label: 'Documents & Attachments' },
            { id: 'audit', label: 'Full Audit Trail' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-800 text-emerald-900 font-bold bg-white'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F7FAF8]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Quick Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Current Custodian</span>
                  <span className="text-sm font-black text-slate-900 block mt-1">
                    {asset.currentAssignment?.employeeName || 'Asset Store / Unassigned'}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    {asset.currentAssignment?.department || asset.location.branch}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Physical Location</span>
                  <span className="text-sm font-black text-slate-900 block mt-1 truncate">
                    {asset.location.branch}
                  </span>
                  <span className="text-xs text-slate-500 block truncate">
                    {asset.location.building}, {asset.location.room}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Book Valuation</span>
                  <span className="text-sm font-black text-emerald-800 block mt-1 font-mono">
                    ₹{(asset.purchaseInfo.currentBookValue || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Cost: ₹{(asset.purchaseInfo.purchaseCost || 0).toLocaleString()}
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-400 font-semibold block uppercase">Condition</span>
                  <span className="text-sm font-black text-slate-800 block mt-1">
                    {asset.condition}
                  </span>
                  <span className="text-xs text-slate-400 block">
                    Updated {asset.updatedDate}
                  </span>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Technical Specifications & Identity
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Asset ID:</span>
                    <span className="font-mono font-bold text-slate-900">{asset.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Serial Number:</span>
                    <span className="font-mono font-bold text-slate-900">{asset.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Brand:</span>
                    <span className="font-bold text-slate-800">{asset.brand}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Model:</span>
                    <span className="font-bold text-slate-800">{asset.model}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Category:</span>
                    <span className="font-bold text-slate-800">{asset.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Sub-Category:</span>
                    <span className="font-medium text-slate-700">{asset.subCategory || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Storage Bay:</span>
                    <span className="font-medium text-slate-700">{asset.location.storageLocation || 'Bay Standard'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Registered Date:</span>
                    <span className="font-mono text-slate-700">{asset.createdAt}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block font-medium text-xs mb-1">Configuration & Description:</span>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-800 font-sans leading-relaxed">
                    {asset.description || 'No custom configuration details specified.'}
                  </div>
                </div>

                {/* Standard Accessories Issued */}
                <div>
                  <span className="text-slate-400 block font-medium text-xs mb-1.5">Bundled Accessories:</span>
                  <div className="flex flex-wrap gap-2">
                    {asset.accessories.map((acc) => (
                      <span
                        key={acc}
                        className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200"
                      >
                        ✓ {acc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CURRENT ASSIGNMENT */}
          {activeTab === 'assignment' && (
            <div className="space-y-6">
              {(asset.status === 'Allocated' || asset.status === 'Deployed' || asset.currentAssignment) && asset.currentAssignment ? (
                <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          {asset.currentAssignment.employeeName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          ID: {asset.currentAssignment.employeeId} • Department: {asset.currentAssignment.department}
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                      Active Custodian
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Allocation Date:</span>
                      <span className="font-bold text-slate-800">{asset.currentAssignment.allocationDate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Expected Return:</span>
                      <span className="font-bold text-slate-800">
                        {asset.currentAssignment.expectedReturnDate || 'Permanent Assignment'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Condition at Allocation:</span>
                      <span className="font-bold text-emerald-800">
                        {asset.currentAssignment.conditionAtAllocation}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Handover Ack:</span>
                      <span className="font-bold text-emerald-700 flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Signed / Verified</span>
                      </span>
                    </div>
                  </div>

                  {asset.currentAssignment.remarks && (
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-emerald-950">
                      <span className="font-bold block mb-0.5">Allocation Purpose:</span>
                      {asset.currentAssignment.remarks}
                    </div>
                  )}

                  <div className="pt-2 flex space-x-2">
                    {onTransfer && (
                      <button
                        type="button"
                        onClick={() => onTransfer(asset)}
                        className="px-3.5 py-2 text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 rounded-lg shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>Transfer to Another Employee</span>
                      </button>
                    )}
                    {onReturn && (
                      <button
                        type="button"
                        onClick={() => onReturn(asset)}
                        className="px-3.5 py-2 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 rounded-lg shadow-2xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Process Asset Return</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : asset.status === 'Checked Out' && asset.temporaryCheckOut ? (
                <div className="bg-white p-6 rounded-xl border border-indigo-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Temporary Check-Out: {asset.temporaryCheckOut.person}
                      </h4>
                      <p className="text-xs text-indigo-700 font-semibold">
                        Destination: {asset.temporaryCheckOut.destination}
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold border border-indigo-200">
                      Outside Location
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Check-Out Date & Time:</span>
                      <span className="font-bold text-slate-800">
                        {asset.temporaryCheckOut.checkOutDate} {asset.temporaryCheckOut.checkOutTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Expected Return:</span>
                      <span className="font-bold text-rose-700 font-mono">
                        {asset.temporaryCheckOut.expectedReturnDate}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Approved By:</span>
                      <span className="font-bold text-slate-800">{asset.temporaryCheckOut.approvedBy}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs text-indigo-950">
                    <span className="font-bold block mb-0.5">Purpose:</span>
                    {asset.temporaryCheckOut.purpose}
                  </div>

                  {onCheckIn && (
                    <button
                      onClick={() => onCheckIn(asset)}
                      className="px-4 py-2 text-xs font-bold bg-indigo-900 text-white hover:bg-indigo-950 rounded-lg"
                    >
                      Check-In Back to Office
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Building className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Asset Currently in Store / Available</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    This asset is not assigned to any custodian. It is stored safely at {asset.location.branch} - {asset.location.room}.
                  </p>
                  {onAllocate && (
                    <button
                      type="button"
                      onClick={() => onAllocate(asset)}
                      className="px-4 py-2 text-xs font-bold bg-[#168A45] text-white hover:bg-[#0B5D2A] rounded-lg shadow-sm cursor-pointer inline-flex items-center space-x-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Allocate to Staff Member</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PURCHASE & VALUATION */}
          {activeTab === 'purchase' && (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <span>Procurement & Financial Valuation</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Supplier / Vendor:</span>
                    <span className="font-bold text-slate-800">{asset.purchaseInfo.vendorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Purchase Order:</span>
                    <span className="font-mono font-bold text-emerald-800">
                      {asset.purchaseInfo.poNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Invoice Number:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {asset.purchaseInfo.invoiceNumber || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Purchase Date:</span>
                    <span className="font-bold text-slate-800">{asset.purchaseInfo.purchaseDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Original Cost:</span>
                    <span className="font-mono font-black text-slate-900 text-sm">
                      ₹{(asset.purchaseInfo.purchaseCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Tax Incurred:</span>
                    <span className="font-mono font-medium text-slate-700">
                      ₹{(asset.purchaseInfo.tax || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Total CapEx Cost:</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{(asset.purchaseInfo.totalCost || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Annual Depreciation:</span>
                    <span className="font-bold text-amber-700">
                      {asset.purchaseInfo.depreciationRate || 20}% (Straight Line)
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-600 block">Current Depreciated Book Value</span>
                    <span className="text-lg font-black font-mono text-emerald-800">
                      ₹{(asset.purchaseInfo.currentBookValue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Accumulated Depreciation</span>
                    <span className="text-sm font-mono font-bold text-rose-700">
                      -₹{Math.max(0, (asset.purchaseInfo.purchaseCost || 0) - (asset.purchaseInfo.currentBookValue || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LIFECYCLE TIMELINE (Section 23) */}
          {activeTab === 'movement' && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Asset In / Out Movement Timeline</h3>
                  <p className="text-xs text-slate-500">
                    Complete immutable chronological trail from acquisition to current state
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-400">
                  {movements.length} Total Events
                </span>
              </div>

              {movements.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No movement history recorded yet.</p>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {movements.map((mov, idx) => {
                    const isIN = mov.direction === 'IN';
                    return (
                      <div key={mov.id} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-2xs ${
                            isIN ? 'bg-emerald-600' : 'bg-indigo-600'
                          }`}
                        >
                          {isIN ? '↓' : '↑'}
                        </div>

                        <div className="bg-slate-50/80 hover:bg-slate-50 p-4 rounded-xl border border-slate-200/80 transition-colors">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                                  isIN ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {mov.movementType}
                              </span>
                              <span className="font-mono text-slate-400 font-bold">[{mov.referenceNumber}]</span>
                            </div>
                            <span className="font-mono font-semibold text-slate-500">
                              {mov.date} at {mov.time}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-slate-800 mt-1">
                            {mov.reason}
                          </p>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                            {mov.fromEmployee && (
                              <div>
                                <span className="text-slate-400 block font-medium">From:</span>
                                <span className="font-semibold text-slate-700">{mov.fromEmployee}</span>
                              </div>
                            )}
                            {mov.toEmployee && (
                              <div>
                                <span className="text-slate-400 block font-medium">To:</span>
                                <span className="font-semibold text-emerald-800">{mov.toEmployee}</span>
                              </div>
                            )}
                            {mov.toLocation && (
                              <div>
                                <span className="text-slate-400 block font-medium">Location:</span>
                                <span className="font-semibold text-slate-700">{mov.toLocation}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-400 block font-medium">Condition:</span>
                              <span className="font-semibold text-slate-800">{mov.condition}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-medium">Recorded By:</span>
                              <span className="font-semibold text-slate-800">{mov.createdBy}</span>
                            </div>
                          </div>

                          {mov.missingAccessories && mov.missingAccessories.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200 text-[11px] text-red-800 font-bold">
                              ⚠️ Missing accessories reported: {mov.missingAccessories.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MAINTENANCE */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Maintenance & Repair Work Orders</h3>
                {onMaintenance && (
                  <button
                    onClick={() => onMaintenance(asset)}
                    className="px-3 py-1.5 text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 rounded-lg flex items-center space-x-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Create Work Order</span>
                  </button>
                )}
              </div>

              {maintenanceRecords.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                  No maintenance records logged for this asset.
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceRecords.map((m) => (
                    <div key={m.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-amber-800">{m.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {m.status}
                          </span>
                          <span className="text-slate-500 font-medium">({m.maintenanceType})</span>
                        </div>
                        <span className="font-mono text-slate-500">{m.serviceDate}</span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-800">{m.issue}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{m.description}</p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                        <div>
                          <span className="text-slate-400 block font-medium">Service Center:</span>
                          <span className="font-semibold text-slate-800">{m.serviceProvider}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Repair Cost:</span>
                          <span className="font-mono font-bold text-slate-900">₹{m.cost.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Warranty Covered:</span>
                          <span className="font-semibold text-emerald-700">
                            {m.warrantyClaim ? 'Yes (OEM Claim)' : 'No (Company Paid)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Parts Replaced:</span>
                          <span className="font-semibold text-slate-700">{m.partsReplaced || 'None'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: WARRANTY */}
          {activeTab === 'warranty' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Manufacturer Warranty & SLA Protection
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Warranty Provider:</span>
                  <span className="font-bold text-slate-800">{asset.warranty.provider}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Certificate / Policy No:</span>
                  <span className="font-mono font-bold text-slate-900">{asset.warranty.warrantyNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Current Status:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      asset.warranty.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : asset.warranty.status === 'Expiring Soon'
                        ? 'bg-amber-100 text-amber-800 animate-pulse'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {asset.warranty.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Coverage Start:</span>
                  <span className="font-mono text-slate-700">{asset.warranty.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Coverage Expiration:</span>
                  <span className="font-mono font-bold text-slate-900">{asset.warranty.endDate}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Attached Invoices, Warranty Cards & Handover Forms
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-5 h-5 text-emerald-700" />
                    <div>
                      <span className="font-bold text-slate-800 block">Vendor Commercial Invoice</span>
                      <span className="text-[10px] text-slate-400">PDF • Signed & Stamped</span>
                    </div>
                  </div>
                  <button className="text-emerald-800 font-bold hover:underline flex items-center space-x-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="w-5 h-5 text-indigo-700" />
                    <div>
                      <span className="font-bold text-slate-800 block">OEM Warranty Certificate</span>
                      <span className="text-[10px] text-slate-400">PDF • ProSupport Entitlement</span>
                    </div>
                  </div>
                  <button className="text-indigo-800 font-bold hover:underline flex items-center space-x-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Complete System Audit Log
              </h3>
              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700">
                  <span className="text-slate-400 font-semibold">[{asset.createdAt}]</span> Asset registered by {asset.createdBy} via System Intake
                </div>
                {movements.map((mov) => (
                  <div key={mov.id} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-slate-700">
                    <span className="text-slate-400 font-semibold">[{mov.date} {mov.time}]</span> {mov.movementType} ({mov.direction}) authorized by {mov.approvedBy || mov.createdBy}: {mov.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Quick Actions */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            ID: <span className="font-bold text-slate-900">{asset.id}</span>
          </div>

          <div className="flex items-center space-x-2">
            {(asset.status === 'Available' || asset.status === 'Active' || !asset.currentAssignment) && onAllocate && (
              <button
                type="button"
                onClick={() => onAllocate(asset)}
                className="px-3.5 py-1.5 text-xs font-bold bg-[#168A45] text-white hover:bg-[#0B5D2A] rounded-lg shadow-2xs cursor-pointer inline-flex items-center space-x-1"
              >
                <span>Allocate to Staff</span>
              </button>
            )}
            {(asset.status === 'Available' || asset.status === 'Active') && onCheckOut && (
              <button
                type="button"
                onClick={() => onCheckOut(asset)}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-800 text-white hover:bg-indigo-900 rounded-lg shadow-2xs cursor-pointer"
              >
                Check-Out
              </button>
            )}
            {(asset.status === 'Allocated' || asset.status === 'Deployed' || !!asset.currentAssignment) && onTransfer && (
              <button
                type="button"
                onClick={() => onTransfer(asset)}
                className="px-3 py-1.5 text-xs font-bold bg-teal-800 text-white hover:bg-teal-900 rounded-lg shadow-2xs cursor-pointer"
              >
                Transfer
              </button>
            )}
            {(asset.status === 'Allocated' || asset.status === 'Deployed' || !!asset.currentAssignment) && onReturn && (
              <button
                type="button"
                onClick={() => onReturn(asset)}
                className="px-3 py-1.5 text-xs font-bold bg-slate-800 text-white hover:bg-slate-900 rounded-lg shadow-2xs cursor-pointer"
              >
                Return
              </button>
            )}
            {asset.status === 'Checked Out' && onCheckIn && (
              <button
                type="button"
                onClick={() => onCheckIn(asset)}
                className="px-3 py-1.5 text-xs font-bold bg-indigo-900 text-white hover:bg-indigo-950 rounded-lg shadow-2xs cursor-pointer"
              >
                Check-In
              </button>
            )}
            {asset.status !== 'Under Maintenance' && asset.status !== 'In Maintenance' && asset.status !== 'Retired' && asset.status !== 'Disposed' && onMaintenance && (
              <button
                type="button"
                onClick={() => onMaintenance(asset)}
                className="px-3 py-1.5 text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 rounded-lg shadow-2xs cursor-pointer"
              >
                Maintenance
              </button>
            )}
            {asset.status !== 'Retired' && asset.status !== 'Disposed' && onRetire && (
              <button
                type="button"
                onClick={() => onRetire(asset)}
                className="px-3 py-1.5 text-xs font-bold bg-rose-800 text-white hover:bg-rose-900 rounded-lg shadow-2xs cursor-pointer"
              >
                Retire / Dispose
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Tag Modal */}
      <AssetQrModal
        asset={asset}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </div>
  );
};
