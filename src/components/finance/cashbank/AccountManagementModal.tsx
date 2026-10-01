import React, { useState } from 'react';
import { X, Building2, Wallet, DollarSign, ShieldCheck, AlertCircle } from 'lucide-react';
import { BankAccountRecord, CashAccountRecord, TreasuryAccountType } from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface AccountManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: (BankAccountRecord | CashAccountRecord) & { accountTypeCategory?: TreasuryAccountType } | null;
  onSuccess: () => void;
}

export const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
  onSuccess,
}) => {
  const [accountType, setAccountType] = useState<TreasuryAccountType>(
    accountToEdit
      ? 'bankName' in accountToEdit
        ? 'Bank'
        : (accountToEdit as CashAccountRecord).type === 'Petty Cash'
        ? 'Petty Cash'
        : (accountToEdit as CashAccountRecord).type === 'Other'
        ? 'Other'
        : 'Cash'
      : 'Bank'
  );

  const [formData, setFormData] = useState({
    name: accountToEdit?.name || '',
    bankName: (accountToEdit && 'bankName' in accountToEdit && accountToEdit.bankName) || '',
    accountNumber: (accountToEdit && 'accountNumber' in accountToEdit && accountToEdit.accountNumber) || '',
    ifscCode: (accountToEdit && 'ifscCode' in accountToEdit && accountToEdit.ifscCode) || 'FDRL0001288',
    branch: (accountToEdit && 'branch' in accountToEdit && accountToEdit.branch) || 'Marine Drive, Kochi',
    subType: (accountToEdit && 'accountType' in accountToEdit && accountToEdit.accountType) || 'Current',
    custodian: (accountToEdit && 'custodian' in accountToEdit && accountToEdit.custodian) || '',
    openingBalance: accountToEdit?.openingBalance !== undefined ? String(accountToEdit.openingBalance) : '0',
    glAccountCode:
      accountToEdit?.glAccountCode ||
      (accountType === 'Bank' ? '1100' : accountType === 'Petty Cash' ? '1010' : accountType === 'Other' ? '1030' : '1000'),
    isDefault: (accountToEdit && 'isDefault' in accountToEdit && Boolean(accountToEdit.isDefault)) || false,
    status: accountToEdit?.status || 'Active',
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Account name is required.');
      return;
    }

    if (accountType === 'Bank') {
      if (!formData.bankName.trim()) {
        setError('Bank name is required.');
        return;
      }
      if (!formData.accountNumber.trim()) {
        setError('Account number is required.');
        return;
      }
      if (accountToEdit && 'bankName' in accountToEdit) {
        erpFinanceStorage.updateBankAccount(accountToEdit.id, {
          name: formData.name,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branch: formData.branch,
          accountType: formData.subType as 'Current' | 'Savings' | 'OD/CC',
          glAccountCode: formData.glAccountCode,
          isDefault: formData.isDefault,
          status: formData.status as 'Active' | 'Inactive',
        });
      } else {
        erpFinanceStorage.addBankAccount({
          name: formData.name,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          branch: formData.branch,
          accountType: formData.subType as 'Current' | 'Savings' | 'OD/CC',
          openingBalance: Number(formData.openingBalance || 0),
          glAccountCode: formData.glAccountCode,
          isDefault: formData.isDefault,
          currency: 'INR',
          status: formData.status as 'Active' | 'Inactive',
        });
      }
    } else {
      if (!formData.custodian.trim()) {
        setError('Custodian / Keyholder name is required.');
        return;
      }
      if (accountToEdit && 'custodian' in accountToEdit) {
        erpFinanceStorage.updateCashAccount(accountToEdit.id, {
          name: formData.name,
          type: accountType,
          custodian: formData.custodian,
          glAccountCode: formData.glAccountCode,
          status: formData.status as 'Active' | 'Inactive',
        });
      } else {
        erpFinanceStorage.addCashAccount({
          name: formData.name,
          type: accountType,
          custodian: formData.custodian,
          openingBalance: Number(formData.openingBalance || 0),
          glAccountCode: formData.glAccountCode,
          currency: 'INR',
          status: formData.status as 'Active' | 'Inactive',
        });
      }
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              {accountType === 'Bank' ? <Building2 className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {accountToEdit ? 'Edit Treasury Account' : 'Create New Account'}
              </h3>
              <p className="text-xs text-slate-500">Configure bank, cash, petty cash float, or other treasury account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Account Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Bank', 'Cash', 'Petty Cash', 'Other'] as TreasuryAccountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  disabled={Boolean(accountToEdit)}
                  onClick={() => {
                    setAccountType(type);
                    if (type === 'Bank') {
                      setFormData((p) => ({ ...p, glAccountCode: '1100' }));
                    } else if (type === 'Petty Cash') {
                      setFormData((p) => ({ ...p, glAccountCode: '1010' }));
                    } else if (type === 'Other') {
                      setFormData((p) => ({ ...p, glAccountCode: '1030' }));
                    } else {
                      setFormData((p) => ({ ...p, glAccountCode: '1000' }));
                    }
                  }}
                  className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center ${
                    accountType === type
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  } ${accountToEdit ? 'opacity-75 cursor-not-allowed' : ''}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account Display Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={
                accountType === 'Bank'
                  ? 'e.g. Federal Bank Primary Current A/c'
                  : accountType === 'Petty Cash'
                  ? 'e.g. Campus Reception Petty Cash Float'
                  : 'e.g. Main Office Cash Chest'
              }
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
            />
          </div>

          {/* Bank Specific Fields */}
          {accountType === 'Bank' && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="e.g. Federal Bank / HDFC Bank / SBI"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="e.g. 12880200018942"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="e.g. FDRL0001288"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    placeholder="e.g. Marine Drive, Kochi"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Facility Subtype</label>
                  <select
                    value={formData.subType}
                    onChange={(e) => setFormData({ ...formData, subType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                  >
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                    <option value="OD/CC">OD / Cash Credit Facility</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Cash / Petty Cash / Other specific fields */}
          {accountType !== 'Bank' && (
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designated Custodian / Keyholder <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.custodian}
                  onChange={(e) => setFormData({ ...formData, custodian: e.target.value })}
                  placeholder="e.g. Head Cashier / Campus Front Desk Admin"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          {/* Shared Accounting & Balance Fields */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GL Account Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.glAccountCode}
                onChange={(e) => setFormData({ ...formData, glAccountCode: e.target.value })}
                placeholder="e.g. 1100, 1000, 1010"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Opening Balance (₹) {accountToEdit && <span className="text-slate-400 font-normal">(Locked)</span>}
              </label>
              <input
                type="number"
                disabled={Boolean(accountToEdit)}
                value={formData.openingBalance}
                onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                placeholder="0"
                className={`w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono ${
                  accountToEdit ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            {accountType === 'Bank' ? (
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-slate-900 focus:ring-slate-900 w-4 h-4"
                />
                <span>Set as Default Primary Bank Account for settlements</span>
              </label>
            ) : (
              <span className="text-xs text-slate-400">Imprest floating limit managed by custodian</span>
            )}

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600">Status:</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{accountToEdit ? 'Save Changes' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
