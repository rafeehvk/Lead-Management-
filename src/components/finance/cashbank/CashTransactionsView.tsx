import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Calendar,
  Layers,
  FileSpreadsheet,
  X,
  Plus,
} from 'lucide-react';

import { CashAccountRecord, SystemCashTransaction } from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface CashTransactionsViewProps {
  cashAccounts: CashAccountRecord[];
  onNewTransfer?: () => void;
}

export const CashTransactionsView: React.FC<CashTransactionsViewProps> = ({
  cashAccounts,
  onNewTransfer,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('All');
  const [filterType, setFilterType] = useState<'All' | 'Inflow' | 'Outflow'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all transactions across cash accounts
  const allTransactions = useMemo(() => {
    let list: SystemCashTransaction[] = [];
    cashAccounts.forEach((c) => {
      const txs = erpFinanceStorage.getCashTransactions(c.id);
      list = list.concat(txs);
    });
    // Sort descending by date
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashAccounts]);

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      const matchesAccount =
        selectedAccountId === 'All' || tx.cashAccountId === selectedAccountId;
      const matchesType =
        filterType === 'All' ||
        (filterType === 'Inflow' && (tx.inflow || 0) > 0) ||
        (filterType === 'Outflow' && (tx.outflow || 0) > 0);
      const matchesSearch =
        searchQuery === '' ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.partyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.category?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesAccount && matchesType && matchesSearch;
    });
  }, [allTransactions, selectedAccountId, filterType, searchQuery]);

  const totalInflow = filteredTransactions.reduce((s, t) => s + (t.inflow || 0), 0);
  const totalOutflow = filteredTransactions.reduce((s, t) => s + (t.outflow || 0), 0);
  const netCashMovement = totalInflow - totalOutflow;

  return (
    <div className="space-y-6">
      {/* Header & Metric Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Cash & Petty Cash Transactions</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Imprest & Vault Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed audit trail of cash receipts, petty expenses, and contra vault replenishments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNewTransfer && (
              <button
                onClick={onNewTransfer}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Replenish Float (Transfer)</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Cash Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
          <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-900 mb-1">Total Cash Inflow</div>
            <div className="text-lg font-bold font-mono text-emerald-700">{formatINR(totalInflow)}</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Counter receipts & contra withdrawals</div>
          </div>

          <div className="p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
            <div className="text-xs font-semibold text-rose-900 mb-1">Total Cash Outflow</div>
            <div className="text-lg font-bold font-mono text-rose-700">{formatINR(totalOutflow)}</div>
            <div className="text-[11px] text-rose-600 mt-0.5">Petty vouchers & spot vendor payments</div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-xs font-semibold text-slate-700 mb-1">Net Cash Movement</div>
            <div
              className={`text-lg font-bold font-mono ${
                netCashMovement >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {formatINR(netCashMovement)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Across {filteredTransactions.length} recorded vouchers</div>
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
            placeholder="Search party, voucher #, description, or category..."
            className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Cash Account Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Account:</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="All">All Cash Accounts</option>
              {cashAccounts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          {/* Direction Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Inflow', 'Outflow'] as const).map((dir) => (
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
              Cash Journal Entries ({filteredTransactions.length} Items)
            </span>
          </div>
          <span className="text-xs text-slate-500">Real-time ledger updates</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Voucher / Ref</th>
                <th className="py-3 px-4">Account Float</th>
                <th className="py-3 px-4">Party & Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Inflow (Debit)</th>
                <th className="py-3 px-4 text-right">Outflow (Credit)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wallet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">No cash transactions match the selected filters.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const account = cashAccounts.find((c) => c.id === tx.cashAccountId);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{tx.date}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {tx.referenceNumber || 'VCH-CASH'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{account?.name || 'Cash Account'}</div>
                        <div className="text-[10px] text-slate-400">{account?.type} (GL: {account?.glAccountCode})</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900">{tx.partyName || 'Cash Counter'}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-sm">{tx.description}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {tx.category || tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                        {tx.inflow ? formatINR(tx.inflow) : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-rose-600 whitespace-nowrap">
                        {tx.outflow ? formatINR(tx.outflow) : '—'}
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
