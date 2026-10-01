import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  X,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';

import { BankAccountRecord, SystemBankTransaction } from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface BankTransactionsViewProps {
  bankAccounts: BankAccountRecord[];
  onOpenReconciliation?: () => void;
}

export const BankTransactionsView: React.FC<BankTransactionsViewProps> = ({
  bankAccounts,
  onOpenReconciliation,
}) => {
  const [selectedBankId, setSelectedBankId] = useState<string>('All');
  const [filterType, setFilterType] = useState<'All' | 'Deposit' | 'Withdrawal'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all transactions across bank accounts
  const allTransactions = useMemo(() => {
    let list: SystemBankTransaction[] = [];
    bankAccounts.forEach((b) => {
      const txs = erpFinanceStorage.getBankTransactions(b.id);
      list = list.concat(txs);
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bankAccounts]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const matchesBank =
        selectedBankId === 'All' || tx.bankAccountId === selectedBankId;
      const matchesType =
        filterType === 'All' ||
        (filterType === 'Deposit' && (tx.deposit || 0) > 0) ||
        (filterType === 'Withdrawal' && (tx.withdrawal || 0) > 0);
      const matchesSearch =
        searchQuery === '' ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.partyName?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesBank && matchesType && matchesSearch;
    });
  }, [allTransactions, selectedBankId, filterType, searchQuery]);

  const totalDeposits = filteredTransactions.reduce((s, t) => s + (t.deposit || 0), 0);
  const totalWithdrawals = filteredTransactions.reduce((s, t) => s + (t.withdrawal || 0), 0);
  const netBankMovement = totalDeposits - totalWithdrawals;

  return (
    <div className="space-y-6">
      {/* Header & Metric Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Bank Transactions & Movements</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Real-time Core GL Feed
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Consolidated view of customer collections, vendor settlements, contra transfers, and cheque clearings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReconciliation && (
              <button
                onClick={onOpenReconciliation}
                className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Landmark className="w-4 h-4 text-indigo-600" />
                <span>Reconcile with Statement</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Bank Movement Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-900 mb-1">Total Credits (Deposits)</div>
            <div className="text-lg font-bold font-mono text-emerald-700">{formatINR(totalDeposits)}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Inward receipts, RTGS/NEFT & cheque deposits</div>
          </div>

          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
            <div className="text-xs font-semibold text-rose-900 mb-1">Total Debits (Withdrawals)</div>
            <div className="text-lg font-bold font-mono text-rose-700">{formatINR(totalWithdrawals)}</div>
            <div className="text-[11px] text-rose-600 mt-0.5">Vendor payments, loan EMIs, & contra transfers</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-1">Net Flow</div>
            <div
              className={`text-lg font-bold font-mono ${
                netBankMovement >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatINR(netBankMovement)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across {filteredTransactions.length} bank transactions</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search party, reference #, bank, or notes..."
            className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Bank Account Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Bank Account:</label>
            <select
              value={selectedBankId}
              onChange={(e) => setSelectedBankId(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="All">All Bank Accounts</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.accountNumber.slice(-4)})
                </option>
              ))}
            </select>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Deposit', 'Withdrawal'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => setFilterType(dir)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filterType === dir
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {dir}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-900">
              Bank General Ledger ({filteredTransactions.length} Items)
            </span>
          </div>
          <span className="text-xs text-slate-500">Live bank feeds and settlements</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Bank Account</th>
                <th className="py-3 px-4">Party & Reference</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Withdrawal (Debit)</th>
                <th className="py-3 px-4 text-right">Deposit (Credit)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Landmark className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">No bank transactions match the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const bank = bankAccounts.find((b) => b.id === tx.bankAccountId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{bank?.name || 'Bank Account'}</div>
                        <div className="text-[10px] text-slate-400 font-mono">A/c: {bank?.accountNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{tx.partyName || tx.referenceNumber}</div>
                        <div className="text-[11px] font-mono text-slate-500">{tx.referenceNumber}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-sm">{tx.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                        {tx.withdrawal ? formatINR(tx.withdrawal) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {tx.deposit ? formatINR(tx.deposit) : '—'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            tx.status === 'Reconciled'
                              ? 'bg-purple-100 text-purple-800'
                              : tx.status === 'Matched'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
