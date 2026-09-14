import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  Users,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  Building,
  Phone,
  Mail,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AssetCategory,
  AssetLocation,
  AssetVendor,
  AssetSettingsConfig,
} from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';

// ==========================================
// 1. ASSET CATEGORIES (Section 17)
// ==========================================
export const AssetCategoriesView: React.FC = () => {
  const [categories, setCategories] = useState<AssetCategory[]>(() =>
    assetStorage.getCategories()
  );
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [usefulLifeYears, setUsefulLifeYears] = useState(3);
  const [depreciationRate, setDepreciationRate] = useState(25);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    assetStorage.saveCategory({
      id: `CAT-${Date.now().toString().slice(-4)}`,
      name,
      code: code.toUpperCase(),
      description: `${name} hardware inventory`,
      usefulLifeYears,
      defaultDepreciationRate: depreciationRate,
      depreciationRate,
      depreciationMethod: 'Straight Line',
      isActive: true,
    });

    setCategories(assetStorage.getCategories());
    setName('');
    setCode('');
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in max-w-4xl">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Asset Categories Master</h2>
          <p className="text-xs text-slate-500">
            Define classification, useful life standards, and straight-line depreciation rates
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs items-end">
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
          <input
            type="text"
            placeholder="e.g. Server Infrastructure"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Prefix Code *</label>
          <input
            type="text"
            placeholder="SRV"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg uppercase font-mono"
            required
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Useful Life (Yrs)</label>
          <input
            type="number"
            value={usefulLifeYears}
            onChange={(e) => setUsefulLifeYears(Number(e.target.value))}
            className="w-full p-2 border border-slate-300 rounded-lg font-mono"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
          >
            + Add Category
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Code</th>
              <th className="py-3 px-4">Category Name</th>
              <th className="py-3 px-4">Useful Life</th>
              <th className="py-3 px-4">Depreciation Method</th>
              <th className="py-3 px-4 text-right">Depr. Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-[#F7FAF8]">
                <td className="py-3 px-4 font-mono font-bold text-emerald-800">{c.code}</td>
                <td className="py-3 px-4 font-bold text-slate-800">{c.name}</td>
                <td className="py-3 px-4 font-semibold text-slate-600">{c.usefulLifeYears} Years</td>
                <td className="py-3 px-4 text-slate-600">{c.depreciationMethod}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                  {c.depreciationRate}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 2. ASSET LOCATIONS (Section 18)
// ==========================================
export const AssetLocationsView: React.FC = () => {
  const [locations, setLocations] = useState<AssetLocation[]>(() =>
    assetStorage.getLocations()
  );
  const [branch, setBranch] = useState('');
  const [building, setBuilding] = useState('');
  const [department, setDepartment] = useState('');
  const [room, setRoom] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch.trim() || !room.trim()) return;

    assetStorage.saveLocation({
      id: `LOC-${Date.now().toString().slice(-4)}`,
      branch,
      building: building || 'Main Block',
      floor: 'Floor 1',
      department: department || 'General',
      room,
      storageLocation: `${building || 'Main'} - ${room}`,
      isOffice: true,
    });

    setLocations(assetStorage.getLocations());
    setBranch('');
    setBuilding('');
    setDepartment('');
    setRoom('');
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in max-w-4xl">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Asset Locations Master</h2>
          <p className="text-xs text-slate-500">
            Physical organizational taxonomy: Branches, Buildings, Storage Lockers & Bays
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs items-end">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Branch *</label>
          <input
            type="text"
            placeholder="e.g. Pune Campus"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Building</label>
          <input
            type="text"
            placeholder="Building A"
            value={building}
            onChange={(e) => setBuilding(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Department</label>
          <input
            type="text"
            placeholder="IT / Lab"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Room / Locker *</label>
          <input
            type="text"
            placeholder="Server Room 102"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
          >
            + Add Location
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Branch</th>
              <th className="py-3 px-4">Building</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4">Room / Storage Bin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locations.map((loc) => (
              <tr key={loc.id} className="hover:bg-[#F7FAF8]">
                <td className="py-3 px-4 font-bold text-slate-800">{loc.branch}</td>
                <td className="py-3 px-4 text-slate-600">{loc.building}</td>
                <td className="py-3 px-4 text-slate-600">{loc.department}</td>
                <td className="py-3 px-4 font-semibold text-emerald-800">{loc.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 3. ASSET VENDORS (Section 19)
// ==========================================
export const AssetVendorsView: React.FC = () => {
  const [vendors, setVendors] = useState<AssetVendor[]>(() =>
    assetStorage.getVendors()
  );
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    assetStorage.saveVendor({
      id: `VND-${Date.now().toString().slice(-4)}`,
      vendorCode: `VND-${name.slice(0, 4).toUpperCase()}`,
      vendorName: name,
      name,
      contactPerson,
      phone,
      email,
      gstNumber,
      address: 'Industrial Area, Phase 2',
      productCategories: ['Hardware', 'IT Equipment'],
      paymentTerms: 'Net 30 Days',
      status: 'Active',
    });

    setVendors(assetStorage.getVendors());
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setGstNumber('');
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in max-w-5xl">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Approved Hardware Vendors & Suppliers</h2>
          <p className="text-xs text-slate-500">
            Supplier directory, GSTIN records, OEM service authorizations, and contact details
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs items-end">
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Company / Vendor *</label>
          <input
            type="text"
            placeholder="e.g. Cisco Systems India"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
          <input
            type="text"
            placeholder="Account Manager"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Phone</label>
          <input
            type="text"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
          <input
            type="text"
            placeholder="27AAACE1234F1Z5"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-lg uppercase font-mono"
          />
        </div>
        <div>
          <button
            type="submit"
            className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
          >
            + Add Vendor
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vendors.map((v) => (
          <div key={v.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900">{v.name}</h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {v.status}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600">
              <p className="flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{v.contactPerson}</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{v.phone}</span>
              </p>
              <p className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{v.email}</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>GSTIN:</span>
              <span className="font-bold text-slate-800">{v.gstNumber}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 4. ASSET SETTINGS (Section 21)
// ==========================================
export const AssetSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<AssetSettingsConfig>(() =>
    assetStorage.getSettings()
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    assetStorage.saveSettings(settings);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in max-w-3xl">
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Asset Management Configuration & Policies</h2>
          <p className="text-xs text-slate-500">
            System defaults, numbering conventions, reminder cadences, and approval thresholds
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-700" />
          <span>Asset system parameters saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1">
          Notification & Alert Reminders
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Warranty Expiry Alert Window (Days)
            </label>
            <input
              type="number"
              value={settings.warrantyReminderDays}
              onChange={(e) =>
                setSettings({ ...settings, warrantyReminderDays: Number(e.target.value) })
              }
              className="w-full p-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Check-Out Overdue Alert Window (Days)
            </label>
            <input
              type="number"
              value={settings.checkOutOverdueDays}
              onChange={(e) =>
                setSettings({ ...settings, checkOutOverdueDays: Number(e.target.value) })
              }
              className="w-full p-2 border border-slate-300 rounded-lg font-mono"
            />
          </div>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1 pt-2">
          Financial & Depreciation Standards
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Default Depreciation Method</label>
            <select
              value={settings.defaultDepreciationMethod}
              onChange={(e) =>
                setSettings({ ...settings, defaultDepreciationMethod: e.target.value as any })
              }
              className="w-full p-2 border border-slate-300 rounded-lg"
            >
              <option value="Straight Line">Straight Line (Equal Annual Amortization)</option>
              <option value="Written Down Value">Written Down Value (Accelerated)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Asset ID Tag Generation Prefix
            </label>
            <input
              type="text"
              value={settings.assetPrefix}
              onChange={(e) => setSettings({ ...settings, assetPrefix: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded-lg font-mono uppercase"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-lg shadow-sm"
          >
            Save Asset Settings
          </button>
        </div>
      </form>
    </div>
  );
};
