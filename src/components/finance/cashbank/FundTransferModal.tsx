import React, { useState } from 'react';
import { X, ArrowRightLeft, ShieldCheck, AlertCircle, Info, Landmark, Wallet } from 'lucide-react';
import { BankAccountRecord, CashAccountRecord } from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

interface FundTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccountRecord[];
  cashAccounts: CashAccountRecord[];
  onSuccess: () => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const FundTransferModal: React.FC<FundTransferModalProps> = ({
  isOpen,
  onClose,
  bankAccounts,
  cashAccounts,
  onSuccess,
}) => {
  // Combine accounts with explicit source tagging
  const allAccounts = [
    ...bankAccounts.map((b) => ({
      id: b.id,
      name: b.name,
      type: 'Bank' as const,
      glCode: b.glAccountCode,
      balance: b.currentBalance,
      subType: b.accountType,
    })),
    ...cashAccounts.map((c) => ({
      id: c.id,
      name: c.name,
      type: (c.type === 'Petty Cash' ? 'Petty Cash' : c.type === 'Other' ? 'Other' : 'Cash') as 'Cash' | 'Petty Cash' | 'Other',
      glCode: c.glAccountCode,
      balance: c.currentBalance,
      subType: c.type,
    })),
  ];

  const [fromAccountId, setFromAccountId] = useState(allAccounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(allAccounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [referenceNumber, setReferenceNumber] = useState(`REF-${Date.now().toString().slice(-6)}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sourceAccount = allAccounts.find((a) => a.id === fromAccountId);
  const targetAccount = allAccounts.find((a) => a.id === toAccountId);

  const transferNum = `TRF-2026-${String(erpFinanceStorage.getFundTransfers().length + 1).padStart(4, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid transfer amount greater than 0.');
      return;
    }

    if (!fromAccountId || !toAccountId) {
      setError('Both source and destination accounts must be selected.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Source and Destination accounts cannot be the same.');
      return;
    }

    if (sourceAccount && sourceAccount.subType !== 'OD/CC' && numAmount > sourceAccount.balance) {
      setError(
        `Insufficient funds in ${sourceAccount.name}. Available balance is ${formatINR(sourceAccount.balance)}.`
      );
      return;
    }

    try {
      erpFinanceStorage.postFundTransfer({
        fromAccountId: sourceAccount!.id,
        fromAccountName: sourceAccount!.name,
        fromAccountType: sourceAccount!.type,
        toAccountId: targetAccount!.id,
        toAccountName: targetAccount!.name,
        toAccountType: targetAccount!.type,
        amount: numAmount,
        referenceNumber,
        remarks: remarks || `Treasury fund transfer from ${sourceAccount!.name} to ${targetAccount!.name}`,
        date,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to post fund transfer.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Contra Fund Transfer</h3>
              <p className="text-xs text-slate-500">Cash↔Bank, Bank↔Bank, Cash↔Cash Inter-Account Transfers</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
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

          {/* Transfer Info Header */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transfer Voucher</span>
              <div className="text-xs font-mono font-bold text-slate-900 mt-0.5">{transferNum}</div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution Date</span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs font-medium text-slate-900 bg-transparent border-b border-slate-200 focus:outline-none focus:border-slate-900 py-0.5"
              />
            </div>
          </div>

          {/* From Account & To Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Account */}
            <div className="p-3.5 bg-rose-50/40 rounded-xl border border-rose-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  From (Source / Credit)
                </label>
                {sourceAccount && (
                  <span className="text-[11px] font-semibold text-rose-700 font-mono">
                    Bal: {formatINR(sourceAccount.balance)}
                  </span>
                )}
              </div>
              <select
                required
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white font-medium text-slate-800"
              >
                <optgroup label="Bank Accounts">
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({formatINR(b.currentBalance)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cash & Petty Cash Floats">
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatINR(c.currentBalance)})
                    </option>
                  ))}
                </optgroup>
              </select>
              {sourceAccount && (
                <div className="text-[10px] text-rose-600 font-mono flex items-center justify-between pt-0.5">
                  <span>GL Code: {sourceAccount.glCode}</span>
                  <span className="font-semibold text-rose-700">{sourceAccount.subType}</span>
                </div>
              )}
            </div>

            {/* To Account */}
            <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  To (Destination / Debit)
                </label>
                {targetAccount && (
                  <span className="text-[11px] font-semibold text-emerald-700 font-mono">
                    Bal: {formatINR(targetAccount.balance)}
                  </span>
                )}
              </div>
              <select
                required
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-800"
              >
                <optgroup label="Bank Accounts">
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({formatINR(b.currentBalance)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Cash & Petty Cash Floats">
                  {cashAccounts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({formatINR(c.currentBalance)})
                    </option>
                  ))}
                </optgroup>
              </select>
              {targetAccount && (
                <div className="text-[10px] text-emerald-600 font-mono flex items-center justify-between pt-0.5">
                  <span>GL Code: {targetAccount.glCode}</span>
                  <span className="font-semibold text-emerald-700">{targetAccount.subType}</span>
                </div>
              )}
            </div>
          </div>

          {/* Amount & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transfer Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full px-3 py-2 text-sm font-bold font-mono text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instrument / Reference No. <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. CHQ-889102 / NEFT-29910"
                className="w-full px-3 py-2 text-xs font-mono text-slate-900 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Remarks / Purpose</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Monthly petty cash imprest float replenishment or bank liquidity transfer"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Journal Entry Preview */}
          <div className="p-3 bg-slate-900 text-slate-100 rounded-xl space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800 text-[10px] font-sans uppercase font-bold tracking-wider">
              <span>Automatic Contra Journal Preview</span>
              <span>Double Entry Engine</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>
                Dr. {targetAccount?.name || 'Destination A/c'} ({targetAccount?.glCode || '1100'})
              </span>
              <span>{amount ? formatINR(Number(amount)) : '₹0'}</span>
            </div>
            <div className="flex justify-between text-rose-300 pl-4">
              <span>
                Cr. {sourceAccount?.name || 'Source A/c'} ({sourceAccount?.glCode || '1000'})
              </span>
              <span>{amount ? formatINR(Number(amount)) : '₹0'}</span>
            </div>
          </div>

          {/* Buttons */}
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
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Post Fund Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
