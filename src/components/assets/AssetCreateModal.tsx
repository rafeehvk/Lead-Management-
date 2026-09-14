import React, { useState } from 'react';
import {
  X,
  Plus,
  Package,
  Building,
  DollarSign,
  ShieldCheck,
  FileText,
  Check,
} from 'lucide-react';
import { Asset, AssetStatus, AssetCondition } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';
import { hrStorage } from '../../services/hrStorageService';

interface AssetCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAsset: Asset) => void;
  actorName?: string;
}

export const AssetCreateModal: React.FC<AssetCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actorName = 'Admin',
}) => {
  if (!isOpen) return null;

  const categories = assetStorage.getCategories();
  const locations = assetStorage.getLocations();
  const vendors = assetStorage.getVendors();
  const staff = hrStorage.getStaff();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'IT Equipment');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [description, setDescription] = useState('');

  // Purchase info
  const [vendorName, setVendorName] = useState(vendors[0]?.name || 'Dell Technologies India');
  const [purchaseCost, setPurchaseCost] = useState<number>(65000);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Math.floor(10000 + Math.random() * 90000)}`);
  const [poNumber, setPoNumber] = useState(`PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);

  // Warranty
  const [warrantyProvider, setWarrantyProvider] = useState(vendorName);
  const [warrantyEndDate, setWarrantyEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  // Location & Initial Status
  const [branch, setBranch] = useState(locations[0]?.branch || 'Headquarters');
  const [room, setRoom] = useState(locations[0]?.room || 'IT Floor 3');
  const [initialStatus, setInitialStatus] = useState<AssetStatus>('Available');
  const [allocatedStaffId, setAllocatedStaffId] = useState(staff[0]?.id || '');
  const [condition, setCondition] = useState<AssetCondition>('New');

  // Accessories
  const [accessories, setAccessories] = useState<string[]>([
    'Power Cable / Charger',
    'Laptop Bag',
  ]);
  const [customAccessory, setCustomAccessory] = useState('');
  const [error, setError] = useState('');

  const toggleAccessory = (acc: string) => {
    setAccessories((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc]
    );
  };

  const addCustomAccessory = () => {
    if (customAccessory.trim() && !accessories.includes(customAccessory.trim())) {
      setAccessories([...accessories, customAccessory.trim()]);
      setCustomAccessory('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim() || !serialNumber.trim()) {
      setError('Please fill in required fields: Name, Brand, and Serial Number.');
      return;
    }

    const selectedStaff = staff.find((s) => s.id === allocatedStaffId);

    const assetData: Partial<Asset> = {
      name,
      category,
      brand,
      model,
      serialNumber,
      description,
      status: initialStatus,
      condition,
      location: {
        branch,
        building: 'Main Tower',
        floor: '3rd Floor',
        department: 'Operations',
        room,
        storageLocation: 'Central Bay',
      },
      purchaseInfo: {
        vendorName,
        purchaseDate,
        purchaseCost: Number(purchaseCost) || 0,
        totalCost: Number(purchaseCost) || 0,
        currentBookValue: Number(purchaseCost) || 0,
        invoiceNumber,
        poNumber,
        depreciationRate: 20,
      },
      warranty: {
        provider: warrantyProvider,
        warrantyNumber: `WAR-${serialNumber.slice(-6)}`,
        startDate: purchaseDate,
        endDate: warrantyEndDate,
        status: new Date(warrantyEndDate) > new Date() ? 'Active' : 'Expired',
      },
      accessories,
      currentAssignment:
        (initialStatus === 'Allocated' || initialStatus === 'Deployed') && selectedStaff
          ? {
              employeeId: selectedStaff.id,
              employeeName: selectedStaff.fullName,
              department: selectedStaff.department || 'Operations',
              allocationDate: purchaseDate,
              conditionAtAllocation: condition,
              accessories,
            }
          : undefined,
    };

    const newAsset = assetStorage.saveAsset(assetData, actorName);
    onSuccess(newAsset);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 md:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <Package className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Register New Enterprise Asset</h3>
              <p className="text-xs text-emerald-100">Add hardware, equipment, or machinery to inventory</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* 1. Basic Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
              <Package className="w-4 h-4 text-emerald-700" />
              <span>1. Basic Asset Information</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Asset Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Latitude 5530 i7 Laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Brand / OEM *</label>
                <input
                  type="text"
                  placeholder="e.g. Dell, Apple, HP, Cisco"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Model / SKU</label>
                <input
                  type="text"
                  placeholder="e.g. Latitude 5530 / 16GB / 512GB"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 8VJ29X3 or unique IMEI"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Condition *</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as AssetCondition)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="New">New (Factory Sealed)</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description & Hardware Specs</label>
              <textarea
                rows={2}
                placeholder="Technical specifications, RAM, Storage, CPU or calibration parameters..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Purchase & Valuation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
              <DollarSign className="w-4 h-4 text-emerald-700" />
              <span>2. Procurement & Financial Info</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Supplier</label>
                <select
                  value={vendorName}
                  onChange={(e) => {
                    setVendorName(e.target.value);
                    setWarrantyProvider(e.target.value);
                  }}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Cost (₹) *</label>
                <input
                  type="number"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">PO Number</label>
                <input
                  type="text"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warranty Expiry Date</label>
                <input
                  type="date"
                  value={warrantyEndDate}
                  onChange={(e) => setWarrantyEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Location & Initial Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 flex items-center space-x-1.5">
              <Building className="w-4 h-4 text-emerald-700" />
              <span>3. Location & Initial State</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Branch / Facility</label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.branch}>
                      {loc.branch} - {loc.building}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Room / Floor</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Initial Status</label>
                <select
                  value={initialStatus}
                  onChange={(e) => setInitialStatus(e.target.value as AssetStatus)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Deployed">Deployed</option>
                  <option value="In Maintenance">In Maintenance</option>
                  <option value="Retired">Retired</option>
                  <option value="Available">Available (In Store)</option>
                  <option value="Allocated">Allocated Directly to Staff</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>

            {(initialStatus === 'Allocated' || initialStatus === 'Deployed') && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  Assign to Employee (Immediate Custodian) *
                </label>
                <select
                  value={allocatedStaffId}
                  onChange={(e) => setAllocatedStaffId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none bg-white"
                  required
                >
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.id}) - {s.department}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 4. Accessories Checklist */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
              4. Included Accessories Checklist
            </h4>
            <div className="flex flex-wrap gap-2">
              {['Power Cable / Charger', 'Laptop Bag', 'Wireless Mouse', 'HDMI Cable', 'Docking Station', 'Original Box'].map((acc) => {
                const checked = accessories.includes(acc);
                return (
                  <button
                    type="button"
                    key={acc}
                    onClick={() => toggleAccessory(acc)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                      checked
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {checked && <Check className="w-3.5 h-3.5" />}
                    <span>{acc}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="text"
                placeholder="Add custom accessory (e.g. Stylus Pen)"
                value={customAccessory}
                onChange={(e) => setCustomAccessory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAccessory())}
                className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none w-64"
              />
              <button
                type="button"
                onClick={addCustomAccessory}
                className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm"
            >
              Create Asset Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
