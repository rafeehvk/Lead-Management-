import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Printer,
  QrCode,
  Eye,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  UserCheck,
  UserPlus,
  ArrowRightLeft,
  RotateCcw,
  Wrench,
  Trash2,
  CheckCircle2,
  FileSpreadsheet,
  Building,
  RefreshCw,
  History,
} from 'lucide-react';
import { Asset, AssetStatus } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';
import { AssetStatusDropdown } from './AssetStatusDropdown';
import { InitiateTransferModal } from './InitiateTransferModal';

interface AssetRegisterViewProps {
  initialFilter?: { category?: string; status?: string };
  actorName?: string;
  onSelectAsset: (asset: Asset) => void;
  onOpenCreateAsset: () => void;
  onOpenQrTag: (asset: Asset) => void;
  onAllocate: (asset: Asset) => void;
  onTransfer: (asset: Asset) => void;
  onReturn: (asset: Asset) => void;
  onMaintenance: (asset: Asset) => void;
  onRetire: (asset: Asset) => void;
  onViewMovements?: (assetId: string) => void;
}

export const AssetRegisterView: React.FC<AssetRegisterViewProps> = ({
  initialFilter,
  actorName = 'Admin / IT Officer',
  onSelectAsset,
  onOpenCreateAsset,
  onOpenQrTag,
  onAllocate,
  onTransfer,
  onReturn,
  onMaintenance,
  onRetire,
  onViewMovements,
}) => {
  const [assets, setAssets] = useState<Asset[]>(() => assetStorage.getAssets());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const categories = assetStorage.getCategories();
  const locations = assetStorage.getLocations();
  const vendors = assetStorage.getVendors();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialFilter?.category || 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter?.status || 'ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [selectedVendor, setSelectedVendor] = useState<string>('ALL');

  // Sorting
  const [sortField, setSortField] = useState<keyof Asset>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk selection
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Transfer modal state inside AssetRegister
  const [initiateTransferModalOpen, setInitiateTransferModalOpen] = useState(false);
  const [transferTargetAsset, setTransferTargetAsset] = useState<Asset | null>(null);

  const handleOpenInitiateTransfer = (targetAsset?: Asset | null) => {
    setTransferTargetAsset(targetAsset || null);
    setInitiateTransferModalOpen(true);
  };

  const refreshData = () => {
    setAssets(assetStorage.getAssets());
  };

  // Filter & Sort Logic
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        asset.id.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.serialNumber.toLowerCase().includes(query) ||
        asset.brand.toLowerCase().includes(query) ||
        asset.model.toLowerCase().includes(query) ||
        (asset.currentAssignment?.employeeName &&
          asset.currentAssignment.employeeName.toLowerCase().includes(query)) ||
        (asset.purchaseInfo?.vendorName &&
          asset.purchaseInfo.vendorName.toLowerCase().includes(query));

      // Category
      const matchesCategory =
        selectedCategory === 'ALL' || asset.category === selectedCategory;

      // Status
      const matchesStatus =
        selectedStatus === 'ALL' || asset.status === selectedStatus;

      // Location
      const matchesLocation =
        selectedLocation === 'ALL' ||
        asset.location.branch === selectedLocation;

      // Vendor
      const matchesVendor =
        selectedVendor === 'ALL' ||
        asset.purchaseInfo?.vendorName === selectedVendor;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesLocation &&
        matchesVendor
      );
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'purchaseInfo') {
        valA = a.purchaseInfo?.purchaseCost || 0;
        valB = b.purchaseInfo?.purchaseCost || 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [
    assets,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedLocation,
    selectedVendor,
    sortField,
    sortOrder,
  ]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedAssetIds(filteredAssets.map((a) => a.id));
    } else {
      setSelectedAssetIds([]);
    }
  };

  const handleToggleAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStatusChange = (assetId: string, newStatus: AssetStatus) => {
    const result = assetStorage.updateAssetStatus(assetId, newStatus, actorName);
    if (result.success && result.asset) {
      setAssets((prev) =>
        prev.map((a) => (a.id === assetId ? result.asset! : a))
      );
      setToastMessage(`Asset ${assetId} status changed to "${newStatus}"`);
      setTimeout(() => setToastMessage(null), 3200);
    }
  };

  const handleExportCsv = () => {
    const csvContent = assetStorage.exportAssetsToCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Asset_Register_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: AssetStatus) => {
    switch (status) {
      case 'Active':
      case 'Available':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'Deployed':
      case 'Allocated':
        return 'bg-[#EAF7EF] text-[#0B5D2A] border-[#D9E5DD] font-bold';
      case 'Checked Out':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'In Maintenance':
      case 'Under Maintenance':
        return 'bg-amber-50 text-amber-800 border-amber-300 animate-pulse';
      case 'Damaged':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Retired':
      case 'Disposed':
        return 'bg-slate-100 text-slate-600 border-slate-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in">
      {/* 1. Header Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900">Asset Register & Inventory Master</h2>
          <p className="text-xs text-slate-500">
            Displaying {filteredAssets.length} of {assets.length} total registered hardware assets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={refreshData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Table</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              const selectedOne =
                selectedAssetIds.length === 1
                  ? assets.find((a) => a.id === selectedAssetIds[0]) || null
                  : null;
              handleOpenInitiateTransfer(selectedOne);
            }}
            className="px-3 py-1.5 text-xs font-bold text-white bg-teal-800 hover:bg-teal-900 rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Initiate Asset Custody Transfer to Destination User"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Initiate Transfer</span>
          </button>
          <button
            onClick={onOpenCreateAsset}
            className="px-3 py-1.5 text-xs font-bold text-white bg-[#168A45] hover:bg-[#0B5D2A] rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Bar (Section 11) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Asset ID, Name, S/N, Brand, Custodian, Vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white text-slate-700"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white text-slate-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Deployed">Deployed</option>
              <option value="In Maintenance">In Maintenance</option>
              <option value="Retired">Retired</option>
              <option value="Available">Available (Store)</option>
              <option value="Allocated">Allocated (Staff)</option>
              <option value="Checked Out">Checked Out (Outside)</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Damaged">Damaged</option>
              <option value="Disposed">Disposed</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white text-slate-700"
            >
              <option value="ALL">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.branch}>
                  {loc.branch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(selectedCategory !== 'ALL' ||
          selectedStatus !== 'ALL' ||
          selectedLocation !== 'ALL' ||
          searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="font-semibold">Active Filters:</span>
            {searchQuery && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono">
                "{searchQuery}"
              </span>
            )}
            {selectedCategory !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedCategory}
              </span>
            )}
            {selectedStatus !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                Status: {selectedStatus}
              </span>
            )}
            {selectedLocation !== 'ALL' && (
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                {selectedLocation}
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
                setSelectedLocation('ALL');
                setSelectedVendor('ALL');
              }}
              className="text-emerald-800 font-bold hover:underline cursor-pointer ml-1"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* 3. Asset Table (Section 11) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredAssets.length > 0 &&
                      selectedAssetIds.length === filteredAssets.length
                    }
                    onChange={handleSelectAll}
                    className="rounded text-emerald-800 focus:ring-emerald-700 w-3.5 h-3.5"
                  />
                </th>
                <th className="py-3 px-3 cursor-pointer" onClick={() => setSortField('id')}>
                  <div className="flex items-center space-x-1">
                    <span>Asset ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Asset Details</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Serial No</th>
                <th className="py-3 px-3">Current Custodian</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 text-right">Cost (₹)</th>
                <th className="py-3 px-3 text-right">Book Value</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Condition</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400 text-xs">
                    No assets matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isChecked = selectedAssetIds.includes(asset.id);
                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-[#F7FAF8] transition-colors group ${
                        isChecked ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleAsset(asset.id)}
                          className="rounded text-emerald-800 focus:ring-emerald-700 w-3.5 h-3.5"
                        />
                      </td>

                      {/* Asset ID Clickable */}
                      <td className="py-3 px-3 font-mono font-black text-slate-900 whitespace-nowrap">
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="hover:text-[#168A45] hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{asset.id}</span>
                        </button>
                      </td>

                      {/* Name, Brand, Model */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectAsset(asset)}
                          className="text-left font-bold text-slate-800 hover:text-emerald-800 block truncate max-w-xs cursor-pointer"
                        >
                          {asset.name}
                        </button>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {asset.brand} • {asset.model}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                        {asset.category}
                      </td>

                      {/* Serial Number */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {asset.serialNumber}
                      </td>

                      {/* Custodian */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {asset.currentAssignment ? (
                          <div>
                            <span className="font-bold text-slate-900 block truncate">
                              {asset.currentAssignment.employeeName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {asset.currentAssignment.department}
                            </span>
                          </div>
                        ) : asset.temporaryCheckOut ? (
                          <div>
                            <span className="font-bold text-indigo-900 block truncate">
                              {asset.temporaryCheckOut.person}
                            </span>
                            <span className="text-[10px] text-indigo-700 font-semibold block">
                              Outside ({asset.temporaryCheckOut.destination})
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onAllocate(asset);
                            }}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-900 border border-emerald-200/60 transition-colors cursor-pointer"
                            title="Click to allocate asset to staff member"
                          >
                            <UserPlus className="w-3 h-3 text-emerald-600" />
                            <span>+ Assign Staff</span>
                          </button>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        <span className="block font-semibold text-slate-700 truncate">
                          {asset.location.branch}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {asset.location.room}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                        ₹{(asset.purchaseInfo?.purchaseCost || 0).toLocaleString()}
                      </td>

                      {/* Current Book Value */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                        ₹{(asset.purchaseInfo?.currentBookValue || 0).toLocaleString()}
                      </td>

                      {/* Status Dropdown */}
                      <td
                        className="py-3 px-3 text-center whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <AssetStatusDropdown
                          status={asset.status}
                          onChange={(newStatus) => handleStatusChange(asset.id, newStatus)}
                        />
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            asset.condition === 'New' || asset.condition === 'Excellent'
                              ? 'bg-emerald-50 text-emerald-800'
                              : asset.condition === 'Good'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {asset.condition}
                        </span>
                      </td>

                      {/* Action Menu Buttons */}
                      <td
                        className="py-3 px-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAsset(asset);
                            }}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                            title="View Asset Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenQrTag(asset);
                            }}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                            title="Print QR Asset Tag"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewMovements?.(asset.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                            title={`View Movement & Custody Ledger for ${asset.id}`}
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {(asset.status === 'Available' || asset.status === 'Active' || !asset.currentAssignment) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAllocate(asset);
                              }}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                              title="Allocate to Staff Member"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {(asset.status === 'Allocated' || asset.status === 'Deployed' || !!asset.currentAssignment) && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenInitiateTransfer(asset);
                                }}
                                className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg cursor-pointer transition-colors"
                                title="Initiate Custody Transfer to Destination User"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReturn(asset);
                                }}
                                className="p-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                                title="Process Asset Return"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {asset.status !== 'Under Maintenance' &&
                            asset.status !== 'In Maintenance' &&
                            asset.status !== 'Retired' &&
                            asset.status !== 'Disposed' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMaintenance(asset);
                              }}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg cursor-pointer transition-colors"
                              title="Send to Maintenance"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
            Showing <span className="font-bold text-slate-800">{filteredAssets.length}</span> records
            {selectedAssetIds.length > 0 && (
              <span className="ml-2 font-bold text-emerald-800">
                ({selectedAssetIds.length} assets selected)
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4 font-mono">
            <span>
              Total Cost:{' '}
              <strong className="text-slate-900">
                ₹{filteredAssets.reduce((s, a) => s + (a.purchaseInfo?.purchaseCost || 0), 0).toLocaleString()}
              </strong>
            </span>
            <span>
              Book Value:{' '}
              <strong className="text-emerald-800">
                ₹{filteredAssets.reduce((s, a) => s + (a.purchaseInfo?.currentBookValue || 0), 0).toLocaleString()}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Floating Status Update Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Initiate Custody Transfer Modal */}
      {initiateTransferModalOpen && (
        <InitiateTransferModal
          asset={transferTargetAsset}
          isOpen={true}
          allAssets={assets}
          onClose={() => {
            setInitiateTransferModalOpen(false);
            setTransferTargetAsset(null);
          }}
          onSuccess={(message, updatedAsset, refNo) => {
            refreshData();
            setToastMessage(`${message}${refNo ? ` • Logged to Movement Ledger [${refNo}]` : ''}`);
            setTimeout(() => setToastMessage(null), 7000);
          }}
          onViewMovementLedger={(assetId) => {
            setInitiateTransferModalOpen(false);
            if (onViewMovements) {
              onViewMovements(assetId);
            }
          }}
          actorName={actorName}
        />
      )}
    </div>
  );
};
