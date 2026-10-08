import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Building2,
  Phone,
  User,
  CheckCircle2,
} from 'lucide-react';
import { BranchMaster } from '../../types/hr';
import { hrStorage } from '../../services/hrStorageService';

interface BranchMasterTableProps {
  onClose?: () => void;
  isModal?: boolean;
  onBranchChange?: (branches: BranchMaster[]) => void;
}

export const BranchMasterTable: React.FC<BranchMasterTableProps> = ({
  onClose,
  isModal = false,
  onBranchChange,
}) => {
  const [branchesList, setBranchesList] = useState<BranchMaster[]>(() =>
    hrStorage.getBranchesMaster()
  );
  const staff = useMemo(() => hrStorage.getStaff(), []);

  // Form State
  const [editingBranch, setEditingBranch] = useState<BranchMaster | null>(null);
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const refreshList = () => {
    const updated = hrStorage.getBranchesMaster();
    setBranchesList(updated);
    if (onBranchChange) {
      onBranchChange(updated);
    }
  };

  const resetForm = () => {
    setEditingBranch(null);
    setBranchCode('');
    setBranchName('');
    setCity('');
    setAddress('');
    setContactPerson('');
    setContactPhone('');
    setStatus('Active');
    setFormError('');
  };

  const handleEdit = (branch: BranchMaster) => {
    setEditingBranch(branch);
    setBranchCode(branch.branchCode);
    setBranchName(branch.branchName);
    setCity(branch.city || '');
    setAddress(branch.address || '');
    setContactPerson(branch.contactPerson || '');
    setContactPhone(branch.contactPhone || '');
    setStatus(branch.status || 'Active');
    setFormError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = branchName.trim();
    const cleanCode = (branchCode.trim() || `BR-${String(branchesList.length + 1).padStart(2, '0')}`).toUpperCase();

    if (!cleanName) {
      setFormError('Branch / Location Name is required.');
      return;
    }

    const duplicate = branchesList.find(
      (b) =>
        b.id !== editingBranch?.id &&
        (b.branchName.toLowerCase() === cleanName.toLowerCase() ||
          b.branchCode.toLowerCase() === cleanCode.toLowerCase())
    );
    if (duplicate) {
      setFormError(`Branch "${cleanName}" or Code "${cleanCode}" already exists.`);
      return;
    }

    hrStorage.saveBranch({
      id: editingBranch?.id,
      branchCode: cleanCode,
      branchName: cleanName,
      city: city.trim() || 'Kochi',
      address: address.trim(),
      contactPerson: contactPerson.trim(),
      contactPhone: contactPhone.trim(),
      status,
    });

    refreshList();
    setFeedbackNotice(
      editingBranch
        ? `Updated branch "${cleanName}" (${cleanCode}).`
        : `Added new branch "${cleanName}" (${cleanCode}).`
    );
    setTimeout(() => setFeedbackNotice(null), 3000);
    resetForm();
  };

  const handleDelete = (branch: BranchMaster) => {
    hrStorage.deleteBranch(branch.id);
    refreshList();
    setFeedbackNotice(`Removed branch "${branch.branchName}".`);
    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  const filteredBranches = branchesList.filter(
    (b) =>
      b.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 text-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#168A45] shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900">
                Branch Management (Branch / Location Master)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {branchesList.length} Branches
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Add, edit, or manage institutional campuses, regional centres, and work locations for staff onboarding &amp; attendance.
            </p>
          </div>
        </div>

        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer self-end sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {feedbackNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackNotice(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Add / Edit Branch Form Card */}
      <form
        onSubmit={handleSave}
        className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="font-bold text-slate-900 flex items-center space-x-1.5 text-xs">
            <Building2 className="w-4 h-4 text-[#168A45]" />
            <span>
              {editingBranch
                ? `Edit Branch / Location: ${editingBranch.branchName}`
                : 'Add New Branch / Campus Location'}
            </span>
          </div>
          {editingBranch && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {formError && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-[11px]">
            {formError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="font-semibold text-slate-700">Branch Code *</label>
            <input
              type="text"
              value={branchCode}
              onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
              placeholder="e.g. KCH-01 or BLR-05"
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-mono font-bold uppercase focus:outline-hidden focus:border-[#168A45]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700">Branch / Location Name *</label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g. Kochi Main Campus, Thrissur Academic Centre..."
              required
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white font-semibold focus:outline-hidden focus:border-[#168A45]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">City / District</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Kochi"
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-hidden focus:border-[#168A45]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="font-semibold text-slate-700">Full Address / Landmark</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Building, Road, Locality, PIN Code"
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-hidden focus:border-[#168A45]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Branch Head / Contact</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Dr. Ramesh Nambiar"
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-hidden focus:border-[#168A45]"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700">Contact Phone</label>
            <input
              type="text"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 94471 00000"
              className="w-full mt-1 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 bg-white focus:outline-hidden focus:border-[#168A45]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2">
            <label className="font-semibold text-slate-700">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="border border-slate-200 rounded-lg px-2.5 py-1 bg-white font-semibold text-slate-800"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <button
            type="submit"
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all"
          >
            {editingBranch ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingBranch ? 'Update Branch' : 'Add Branch / Location'}</span>
          </button>
        </div>
      </form>

      {/* Search & Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-3 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 flex-1 max-w-md bg-white border border-slate-200 rounded-xl px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search branches by name, code, or city..."
              className="w-full text-xs text-slate-800 focus:outline-hidden"
            />
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Showing <b>{filteredBranches.length}</b> of {branchesList.length} locations
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Branch / Location Name</th>
                <th className="px-4 py-3">City &amp; Address</th>
                <th className="px-4 py-3">Branch Head / Contact</th>
                <th className="px-4 py-3 text-center">Staff Count</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBranches.map((branch) => {
                const assignedCount = staff.filter(
                  (s) =>
                    (s.branchLocation || '').toLowerCase() === branch.branchName.toLowerCase() ||
                    (s.systemAccess?.branchAccess || '').toLowerCase() === branch.branchName.toLowerCase()
                ).length;

                return (
                  <tr key={branch.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0B5D2A]">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px]">
                        {branch.branchCode}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {branch.branchName}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{branch.city || '—'}</div>
                      {branch.address && (
                        <div className="text-[10px] text-slate-400 line-clamp-1">{branch.address}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {branch.contactPerson ? (
                        <div className="flex items-center space-x-1 text-slate-800 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{branch.contactPerson}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                      {branch.contactPhone && (
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-0.5">
                          <Phone className="w-2.5 h-2.5 text-emerald-600" />
                          <span>{branch.contactPhone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {assignedCount} Staff
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          branch.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {branch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(branch)}
                          title="Edit Branch"
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(branch)}
                          title="Delete Branch"
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredBranches.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400 italic">
                    No branches matching your search. Use the form above to add a new Branch / Location.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
