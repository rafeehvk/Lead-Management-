import React, { useState } from 'react';
import {
  X,
  UserCheck,
  ArrowRightLeft,
  RotateCcw,
  LogOut,
  LogIn,
  Wrench,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Building,
  Check,
} from 'lucide-react';
import { Asset, AssetCondition } from '../../types/asset';
import { assetStorage } from '../../services/assetStorageService';
import { hrStorage } from '../../services/hrStorageService';

interface ActionModalBaseProps {
  asset: Asset | null;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  actorName?: string;
}

// 1. ALLOCATE MODAL
export const AllocateAssetModal: React.FC<ActionModalBaseProps> = ({
  asset,
  isOpen = true,
  onClose,
  onSuccess,
  actorName = 'Admin',
}) => {
  if (isOpen === false || !asset) return null;

  const staffList = hrStorage.getStaff();
  const [selectedEmpId, setSelectedEmpId] = useState(staffList[0]?.id || '');
  const [allocationDate, setAllocationDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [condition, setCondition] = useState<AssetCondition>(asset.condition || 'Excellent');
  const [accessories, setAccessories] = useState<string[]>(asset.accessories || []);
  const [remarks, setRemarks] = useState('');
  const [acknowledged, setAcknowledged] = useState(true);
  const [error, setError] = useState('');

  const selectedStaff = staffList.find((s) => s.id === selectedEmpId) || staffList[0];

  const handleToggleAccessory = (item: string) => {
    setAccessories((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) {
      setError('Please select an employee.');
      return;
    }

    const res = assetStorage.allocateAsset(
      asset.id,
      {
        employeeId: selectedStaff.id,
        employeeName: selectedStaff.fullName,
        department: selectedStaff.department || 'General',
        condition,
        accessories,
        expectedReturnDate: expectedReturnDate || undefined,
        remarks,
      },
      actorName
    );

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Allocate Asset</h3>
              <p className="text-xs text-emerald-100 font-mono">{asset.id} - {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Employee (Custodian) *
            </label>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              required
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.id}) - {s.department} [{s.position}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Allocation Date *</label>
              <input
                type="date"
                value={allocationDate}
                onChange={(e) => setAllocationDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Return Date</label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Condition at Allocation *</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AssetCondition)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            >
              <option value="New">New (Factory Sealed)</option>
              <option value="Excellent">Excellent (Like New)</option>
              <option value="Good">Good (Working Condition)</option>
              <option value="Fair">Fair (Minor Scratches)</option>
            </select>
          </div>

          {/* Accessories Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Issued Accessories Checklist
            </label>
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              {['Power Cable / Charger', 'Laptop Bag', 'Wireless Mouse', 'HDMI Cable', 'Docking Station', 'Security Key'].map((item) => (
                <label key={item} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accessories.includes(item)}
                    onChange={() => handleToggleAccessory(item)}
                    className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4"
                  />
                  <span className="text-slate-700">{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Purpose</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Issued for client ERP implementation and field presentations..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="alloc-ack"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4"
            />
            <label htmlFor="alloc-ack" className="text-xs text-slate-600 cursor-pointer">
              Employee digital handover acknowledgement verified
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-lg shadow-sm"
            >
              Confirm Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import { InitiateTransferModal } from './InitiateTransferModal';

export { InitiateTransferModal };

// 2. TRANSFER MODAL
export const TransferAssetModal: React.FC<
  ActionModalBaseProps & { onViewMovementLedger?: (assetId: string) => void }
> = ({
  asset,
  isOpen = true,
  onClose,
  onSuccess,
  onViewMovementLedger,
  actorName = 'Admin',
}) => {
  return (
    <InitiateTransferModal
      asset={asset}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      onViewMovementLedger={onViewMovementLedger}
      actorName={actorName}
    />
  );
};

// 3. RETURN MODAL
export const ReturnAssetModal: React.FC<ActionModalBaseProps> = ({
  asset,
  isOpen = true,
  onClose,
  onSuccess,
  actorName = 'Admin',
}) => {
  if (isOpen === false || !asset) return null;

  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [returnedAccessories, setReturnedAccessories] = useState<string[]>(asset.accessories || []);
  const [verifiedBy, setVerifiedBy] = useState(actorName);
  const [returnLocation, setReturnLocation] = useState('Central Asset Locker');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const originalAccessories = asset.accessories || [];
  const missingItems = originalAccessories.filter((it) => !returnedAccessories.includes(it));

  const handleToggleReturned = (item: string) => {
    setReturnedAccessories((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = assetStorage.returnAsset(
      asset.id,
      {
        condition,
        accessoriesReturned: returnedAccessories,
        missingAccessories: missingItems,
        verifiedBy,
        remarks,
        returnLocation,
      },
      actorName
    );

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <RotateCcw className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Process Asset Return</h3>
              <p className="text-xs text-slate-300 font-mono">{asset.id} - {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center">
            <div>
              <span className="text-slate-400 block font-medium">Returning Custodian:</span>
              <span className="font-bold text-slate-800">
                {asset.currentAssignment?.employeeName || 'Staff Member'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block font-medium">Allocation Date:</span>
              <span className="font-mono text-slate-700">
                {asset.currentAssignment?.allocationDate || 'N/A'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Return Inspection Condition *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AssetCondition)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:outline-none"
            >
              <option value="Excellent">Excellent (No defects, perfectly operational)</option>
              <option value="Good">Good (Normal wear, operational)</option>
              <option value="Fair">Fair (Cosmetic scratches)</option>
              <option value="Damaged">Damaged (Requires maintenance / repair)</option>
              <option value="Critical">Critical (Non-operational / broken)</option>
            </select>
            {(condition === 'Damaged' || condition === 'Critical') && (
              <p className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Damaged assets will automatically move to "Under Maintenance" state.</span>
              </p>
            )}
          </div>

          {/* Accessories Verification */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Accessories Check-In (Uncheck if missing)
            </label>
            <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              {originalAccessories.map((item) => {
                const isChecked = returnedAccessories.includes(item);
                return (
                  <label
                    key={item}
                    className={`flex items-center justify-between p-1.5 rounded cursor-pointer ${
                      isChecked ? 'bg-emerald-50/50' : 'bg-red-50/80 border border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleReturned(item)}
                        className="rounded text-emerald-800 focus:ring-emerald-700 w-4 h-4"
                      />
                      <span className={isChecked ? 'text-slate-800' : 'text-red-800 font-bold'}>
                        {item}
                      </span>
                    </div>
                    {!isChecked && (
                      <span className="text-[10px] font-black uppercase text-red-700 px-1.5 py-0.2 bg-white rounded border border-red-300">
                        MISSING
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
            {missingItems.length > 0 && (
              <p className="text-[11px] text-red-600 mt-1 font-bold">
                ⚠️ Missing {missingItems.length} items: {missingItems.join(', ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Return Storage Bin</label>
              <input
                type="text"
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Verified By *</label>
              <input
                type="text"
                value={verifiedBy}
                onChange={(e) => setVerifiedBy(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Inspection Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Physical condition inspection notes..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-sm"
            >
              Confirm Return & Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 4. CHECK-OUT MODAL (Temporary movement / Outside Office)
export const CheckOutAssetModal: React.FC<ActionModalBaseProps> = ({
  asset,
  isOpen = true,
  onClose,
  onSuccess,
  actorName = 'Admin',
}) => {
  if (isOpen === false || !asset) return null;

  const staffList = hrStorage.getStaff();
  const [person, setPerson] = useState(staffList[0]?.fullName || 'Staff');
  const [destination, setDestination] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [purpose, setPurpose] = useState('');
  const [condition, setCondition] = useState<AssetCondition>(asset.condition || 'Good');
  const [accessories, setAccessories] = useState<string[]>(asset.accessories || []);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !purpose.trim()) {
      setError('Please provide destination and purpose.');
      return;
    }

    const res = assetStorage.checkOutAsset(
      asset.id,
      {
        person,
        destination,
        expectedReturnDate,
        purpose,
        accessories,
        condition,
        approvedBy: actorName,
        isOutsideOffice: true,
      },
      actorName
    );

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <LogOut className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Temporary Check-Out (Outside Location)</h3>
              <p className="text-xs text-indigo-200 font-mono">{asset.id} - {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Checked Out To (Person) *</label>
            <input
              type="text"
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-700 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Destination *</label>
              <input
                type="text"
                placeholder="e.g. St. Xavier College, Hall 3"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-700 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Return Date *</label>
              <input
                type="date"
                value={expectedReturnDate}
                onChange={(e) => setExpectedReturnDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-700 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Purpose of Check-Out *</label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="e.g. Educational presentation and student orientation software walkthrough..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-700 focus:outline-none"
              required
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-900 hover:bg-indigo-950 rounded-lg shadow-sm"
            >
              Confirm Check-Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 5. CHECK-IN MODAL
export const CheckInAssetModal: React.FC<ActionModalBaseProps> = ({
  asset,
  isOpen = true,
  onClose,
  onSuccess,
  actorName = 'Admin',
}) => {
  if (isOpen === false || !asset) return null;

  const [condition, setCondition] = useState<AssetCondition>('Good');
  const [accessoriesReturned, setAccessoriesReturned] = useState<string[]>(asset.accessories || []);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const originalAccessories = asset.accessories || [];
  const missingItems = originalAccessories.filter((i) => !accessoriesReturned.includes(i));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = assetStorage.checkInAsset(
      asset.id,
      {
        condition,
        accessoriesReturned,
        missingAccessories: missingItems,
        verifiedBy: actorName,
        remarks,
      },
      actorName
    );

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <LogIn className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Asset Check-In</h3>
              <p className="text-xs text-emerald-200 font-mono">{asset.id} - {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <span className="text-slate-400 block font-medium">Checked Out To:</span>
            <span className="font-bold text-slate-800">{asset.temporaryCheckOut?.person || 'Staff'}</span>
            <span className="text-[10px] text-slate-500 block">
              Destination: {asset.temporaryCheckOut?.destination}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Check-In Condition *</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AssetCondition)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Damaged">Damaged</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Received safely in store..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-900 hover:bg-emerald-950 rounded-lg shadow-sm"
            >
              Confirm Check-In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 6. MAINTENANCE MODAL
export const SendToMaintenanceModal: React.FC<ActionModalBaseProps> = ({
  asset,
  isOpen = true,
  onClose,
  onSuccess,
  actorName = 'Admin',
}) => {
  if (isOpen === false || !asset) return null;

  const [issue, setIssue] = useState('');
  const [serviceProvider, setServiceProvider] = useState('Authorized OEM Service Center');
  const [cost, setCost] = useState<number>(2500);
  const [isWarrantyClaim, setIsWarrantyClaim] = useState(asset.warranty?.status === 'Active');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) {
      setError('Please specify the issue.');
      return;
    }

    const res = assetStorage.sendForMaintenance(
      asset.id,
      {
        maintenanceType: isWarrantyClaim ? 'Warranty Claim' : 'Corrective',
        issue,
        serviceProvider,
        cost: Number(cost) || 0,
        isWarrantyClaim,
        nextServiceDate: nextServiceDate || undefined,
      },
      actorName
    );

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Wrench className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Send Asset for Maintenance</h3>
              <p className="text-xs text-amber-200 font-mono">{asset.id} - {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issue / Defect Description *</label>
            <textarea
              rows={2}
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g. Battery bulging / Display backlight flickering / Power failure..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Service Provider *</label>
              <input
                type="text"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Cost (₹)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-700 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="mnt-war"
              checked={isWarrantyClaim}
              onChange={(e) => setIsWarrantyClaim(e.target.checked)}
              className="rounded text-amber-800 focus:ring-amber-700 w-4 h-4"
            />
            <label htmlFor="mnt-war" className="text-xs text-slate-700 font-medium cursor-pointer">
              Covered under OEM Warranty Claim ({asset.warranty?.provider || 'Standard'})
            </label>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm"
            >
              Dispatch for Maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 7. RETIRE / DISPOSAL MODAL
export const RetireAssetModal: React.FC<ActionModalBaseProps> = ({
  asset,
  isOpen = true,
  onClose,
  onSuccess,
  actorName = 'Admin',
}) => {
  if (isOpen === false || !asset) return null;

  const [reason, setReason] = useState<any>('End of Life');
  const [disposalMethod, setDisposalMethod] = useState<any>('E-Waste Recycling');
  const [disposalValue, setDisposalValue] = useState<number>(asset.purchaseInfo?.currentBookValue ? Math.round(asset.purchaseInfo.currentBookValue * 0.1) : 1000);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = assetStorage.retireAsset(
      asset.id,
      {
        reason,
        disposalMethod,
        disposalValue: Number(disposalValue) || 0,
        approvedBy: actorName,
        remarks,
      },
      actorName
    );

    if (res.success) {
      onSuccess(res.message);
      onClose();
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Trash2 className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold">Asset Retirement / Disposal</h3>
              <p className="text-xs text-rose-200 font-mono">{asset.id} - {asset.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
            <p className="font-bold flex items-center space-x-1.5 mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Permanent Status Change Notice</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Once retired, this asset cannot be allocated or checked out. Historical movements and transactions remain permanently archived for auditing.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Retirement Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-700 focus:outline-none"
              >
                <option value="End of Life">End of Life</option>
                <option value="Damaged Beyond Repair">Damaged Beyond Repair</option>
                <option value="Obsolete">Obsolete</option>
                <option value="Lost">Lost / Unrecoverable</option>
                <option value="Sold">Sold</option>
                <option value="Scrapped">Scrapped</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Disposal Method *</label>
              <select
                value={disposalMethod}
                onChange={(e) => setDisposalMethod(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-700 focus:outline-none"
              >
                <option value="E-Waste Recycling">E-Waste Recycling</option>
                <option value="Scrap Auction">Scrap Auction</option>
                <option value="Donation">Donation</option>
                <option value="Employee Sale">Employee Sale</option>
                <option value="Write-Off">Write-Off</option>
                <option value="Returned to Lessor">Returned to Lessor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Book Value</label>
              <input
                type="text"
                disabled
                value={`₹${(asset.purchaseInfo?.currentBookValue || 0).toLocaleString()}`}
                className="w-full text-xs px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-slate-600 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Disposal / Salvage Value (₹)</label>
              <input
                type="number"
                value={disposalValue}
                onChange={(e) => setDisposalValue(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-700 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Disposal Remarks / Approval</label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Board approval reference or e-waste certificate details..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-700 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-rose-900 hover:bg-rose-950 rounded-lg shadow-sm"
            >
              Authorize Retirement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { SendToMaintenanceModal as MaintenanceModal };
