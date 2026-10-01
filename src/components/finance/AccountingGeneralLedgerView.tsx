import React, { useState, useMemo, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  Scale,
  TrendingUp,
  Landmark,
  Plus,
  Search,
  Layers,
  Eye,
  X,
} from 'lucide-react';

import { GLAccount, JournalEntry } from '../../types/finance';
import { accountingEngine } from '../../services/finance/accountingEngine';
import { COMPANY_CONFIG } from '../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface AccountingGeneralLedgerViewProps {
  currentUserName?: string;
  userRole?: string;
}

export const AccountingGeneralLedgerView: React.FC<AccountingGeneralLedgerViewProps> = ({
  currentUserName = 'Chief Financial Officer',
  userRole = 'Admin',
}) => {
  const [activeTab, setActiveTab] = useState<'coa' | 'journal' | 'trial-balance' | 'pnl' | 'balance-sheet'>('coa');

  // Chart of Accounts state
  const [accounts, setAccounts] = useState<GLAccount[]>([]);
  const [coaCategoryFilter, setCoaCategoryFilter] = useState<string>('All');
  const [coaSearch, setCoaSearch] = useState('');

  // Journal Entries state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [journalSearch, setJournalSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  // Financial Reports state
  const [trialBalance, setTrialBalance] = useState<ReturnType<typeof accountingEngine.getTrialBalance> | null>(null);
  const [pnlReport, setPnlReport] = useState<ReturnType<typeof accountingEngine.getProfitAndLossStatement> | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<ReturnType<typeof accountingEngine.getFinancialPosition> | null>(null);

  // New Manual Journal Entry Modal
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [newEntryForm, setNewEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    narration: '',
    debitAccountCode: '6100',
    creditAccountCode: '1100',
    amount: '',
  });

  const loadData = () => {
    setAccounts(accountingEngine.getAccounts());
    setJournalEntries(accountingEngine.getJournalEntries());
    setTrialBalance(accountingEngine.getTrialBalance());
    setPnlReport(accountingEngine.getProfitAndLossStatement());
    setBalanceSheet(accountingEngine.getFinancialPosition());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  // Filtered COA
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (coaCategoryFilter !== 'All' && acc.type !== coaCategoryFilter) {
        return false;
      }
      if (coaSearch.trim()) {
        const q = coaSearch.toLowerCase();
        return (
          acc.code.toLowerCase().includes(q) ||
          acc.name.toLowerCase().includes(q) ||
          acc.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accounts, coaCategoryFilter, coaSearch]);

  // Filtered Journal Entries
  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter((je) => {
      if (journalSearch.trim()) {
        const q = journalSearch.toLowerCase();
        const matchesRef = (je.referenceNumber || '').toLowerCase().includes(q);
        const matchesNo = je.entryNumber.toLowerCase().includes(q);
        const matchesNarr = je.narration.toLowerCase().includes(q);
        const matchesLine = je.lines.some(
          (l) => l.accountName.toLowerCase().includes(q) || l.accountCode.includes(q)
        );
        return matchesRef || matchesNo || matchesNarr || matchesLine;
      }
      return true;
    });
  }, [journalEntries, journalSearch]);

  // Handle post manual entry
  const handlePostManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newEntryForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const drAcc = accounts.find((a) => a.code === newEntryForm.debitAccountCode);
    const crAcc = accounts.find((a) => a.code === newEntryForm.creditAccountCode);
    if (!drAcc || !crAcc) {
      alert('Invalid accounts selected');
      return;
    }

    try {
      accountingEngine.postJournalEntry({
        referenceType: 'ManualJournal',
        referenceId: `ADJ-${Date.now()}`,
        referenceNumber: newEntryForm.referenceNumber || `ADJ-${Date.now().toString().slice(-6)}`,
        date: newEntryForm.date,
        narration: newEntryForm.narration || 'Manual Journal Adjustment Voucher',
        lines: [
          {
            accountCode: drAcc.code,
            accountName: drAcc.name,
            debit: amt,
            credit: 0,
          },
          {
            accountCode: crAcc.code,
            accountName: crAcc.name,
            debit: 0,
            credit: amt,
          },
        ],
        createdBy: currentUserName,
      });

      setIsNewEntryOpen(false);
      setNewEntryForm({
        date: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        narration: '',
        debitAccountCode: '6100',
        creditAccountCode: '1100',
        amount: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error posting journal entry');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-blue-50 rounded-xl text-blue-700 border border-blue-200/80">
                <BookOpen className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Accounting Foundation & General Ledger
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                Double-Entry Compliant
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl">
              Strict mathematical double-entry engine. Every invoice, disbursement, and contra voucher writes balanced
              journal records to the Chart of Accounts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsNewEntryOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post Journal Voucher</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Pills */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('coa')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'coa'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Chart of Accounts (COA)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-800 text-blue-100 rounded-full font-bold">
              {accounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'journal'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Journal Entry Register</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-blue-800 text-blue-100 rounded-full font-bold">
              {journalEntries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trial-balance')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trial-balance'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Trial Balance</span>
            {trialBalance && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  trialBalance.isBalanced ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {trialBalance.isBalanced ? 'Balanced' : 'Out of Balance'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pnl')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pnl'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Profit & Loss (P&L)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('balance-sheet')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'balance-sheet'
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Balance Sheet</span>
          </button>
        </div>
      </div>

      {/* 1. CHART OF ACCOUNTS VIEW */}
      {activeTab === 'coa' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          {/* Search and Classification Filter */}
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={coaCategoryFilter}
                onChange={(e) => setCoaCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="All">All Classifications</option>
                <option value="Asset">Assets (1000-1999)</option>
                <option value="Liability">Liabilities (2000-2999)</option>
                <option value="Equity">Equity (3000-3999)</option>
                <option value="Income">Revenue / Income (4000-4999)</option>
                <option value="Expense">Expenses (5000-6999)</option>
              </select>

              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search account code or name..."
                  value={coaSearch}
                  onChange={(e) => setCoaSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredAccounts.length}</span> active GL accounts
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Title</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Current Ledger Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAccounts.map((acc) => (
                  <tr key={acc.code} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{acc.code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{acc.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          acc.type === 'Asset'
                            ? 'bg-blue-50 text-blue-800 border border-blue-200'
                            : acc.type === 'Liability'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : acc.type === 'Equity'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : acc.type === 'Income'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {acc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(Math.abs(acc.balance))}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. JOURNAL ENTRY REGISTER */}
      {activeTab === 'journal' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[250px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search entry no, narration, reference..."
                value={journalSearch}
                onChange={(e) => setJournalSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500">
              Total Posted Entries: <span className="font-bold text-slate-800">{filteredJournalEntries.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Voucher No & Date</th>
                  <th className="py-3 px-4">Reference & Type</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4">Account Debited</th>
                  <th className="py-3 px-4">Account Credited</th>
                  <th className="py-3 px-4 text-right">Balanced Amount</th>
                  <th className="py-3 px-4 text-center">Drilldown</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJournalEntries.map((je) => {
                  const debitLines = je.lines.filter((l) => l.debit > 0);
                  const creditLines = je.lines.filter((l) => l.credit > 0);

                  return (
                    <tr key={je.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-blue-800">{je.entryNumber}</div>
                        <div className="text-[11px] text-slate-500">{je.date}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800">{je.referenceNumber}</div>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {je.referenceType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{je.narration}</td>
                      <td className="py-3 px-4">
                        {debitLines.map((l, idx) => (
                          <div key={idx} className="font-medium text-emerald-800">
                            Dr: <span className="font-mono">{l.accountCode}</span> ({l.accountName})
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4">
                        {creditLines.map((l, idx) => (
                          <div key={idx} className="font-medium text-amber-900">
                            Cr: <span className="font-mono">{l.accountCode}</span> ({l.accountName})
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(je.totalDebit)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedEntry(je)}
                          className="p-1 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="View balanced double-entry lines"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TRIAL BALANCE */}
      {activeTab === 'trial-balance' && trialBalance && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">General Ledger Trial Balance</h3>
              <p className="text-xs text-slate-500">As of September 2026 • All Subsidiary Ledgers Reconciled</p>
            </div>

            <div
              className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                trialBalance.isBalanced
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {trialBalance.isBalanced ? '✓ Debits Equal Credits' : '⚠️ Unbalanced Ledger Variance'}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Account Code</th>
                  <th className="py-3 px-4">Account Title</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4 text-right">Debit Balance (₹)</th>
                  <th className="py-3 px-4 text-right">Credit Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {trialBalance.accounts.map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{row.code}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800">{row.name}</td>
                    <td className="py-2.5 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-800">
                      {row.debit > 0 ? formatINR(row.debit) : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-amber-900">
                      {row.credit > 0 ? formatINR(row.credit) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold border-t border-gray-300 text-xs">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right text-slate-800">
                    Total Balanced Sums:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-900">
                    {formatINR(trialBalance.totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-amber-950">
                    {formatINR(trialBalance.totalCredit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* 4. PROFIT & LOSS REPORT */}
      {activeTab === 'pnl' && pnlReport && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-gray-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">{COMPANY_CONFIG.legalName}</h2>
            <h3 className="text-sm font-semibold text-slate-600">Statement of Profit & Loss</h3>
            <p className="text-xs text-slate-400">For Financial Year 2026-27 (INR)</p>
          </div>

          {/* Revenue */}
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-emerald-800 flex justify-between border-b pb-1">
              <span>I. Gross Revenue</span>
              <span>{formatINR(pnlReport.grossRevenue)}</span>
            </div>
            <div className="flex justify-between text-xs py-1 px-2 text-slate-700">
              <span>Gross Sales & Consulting Invoicing</span>
              <span className="font-mono font-semibold">{formatINR(pnlReport.grossRevenue)}</span>
            </div>
          </div>

          {/* Direct Costs */}
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-amber-800 flex justify-between border-b pb-1">
              <span>II. Cost of Goods Sold (COGS)</span>
              <span>{formatINR(pnlReport.cogs)}</span>
            </div>
          </div>

          {/* Gross Profit Strip */}
          <div className="p-3 bg-emerald-50 rounded-xl flex justify-between items-center text-xs font-bold text-[#0B5D2A] border border-emerald-200">
            <span>Gross Profit ({pnlReport.grossMarginPercent.toFixed(1)}% Margin)</span>
            <span className="font-mono text-sm">{formatINR(pnlReport.grossProfit)}</span>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-2">
            <div className="font-bold text-xs uppercase tracking-wider text-rose-800 flex justify-between border-b pb-1">
              <span>III. Operating & Administrative Expenses</span>
              <span>{formatINR(pnlReport.totalOperatingExpenses)}</span>
            </div>
            {pnlReport.operatingExpenses.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs py-1 px-2 text-slate-700 hover:bg-slate-50 rounded">
                <span>{item.name} ({item.code})</span>
                <span className="font-mono font-semibold">{formatINR(item.amount)}</span>
              </div>
            ))}
          </div>

          {/* Net Profit */}
          <div className="p-4 bg-slate-900 rounded-xl flex justify-between items-center text-white font-bold text-sm">
            <span>Net Operating Profit ({pnlReport.netProfitMarginPercent.toFixed(1)}% Margin)</span>
            <span className="font-mono text-base text-emerald-400">{formatINR(pnlReport.netProfit)}</span>
          </div>
        </div>
      )}

      {/* 5. BALANCE SHEET */}
      {activeTab === 'balance-sheet' && balanceSheet && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden p-6 max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-gray-200 pb-4">
            <h2 className="text-lg font-bold text-slate-900">{COMPANY_CONFIG.legalName}</h2>
            <h3 className="text-sm font-semibold text-slate-600">Balance Sheet Statement</h3>
            <p className="text-xs text-slate-400">As of Financial Year 2026-27 • Audited Ledger Basis</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Assets */}
            <div className="space-y-4">
              <div className="p-2.5 bg-blue-50 rounded-xl font-bold text-xs text-blue-900 flex justify-between border border-blue-200">
                <span>Total Assets</span>
                <span className="font-mono text-sm">{formatINR(balanceSheet.totalAssets)}</span>
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Asset Items</span>
                {balanceSheet.assets.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 px-2 text-slate-700 hover:bg-slate-50 rounded">
                    <span>{item.name}</span>
                    <span className="font-mono font-semibold">{formatINR(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Liabilities & Equity */}
            <div className="space-y-4">
              <div className="p-2.5 bg-purple-50 rounded-xl font-bold text-xs text-purple-900 flex justify-between border border-purple-200">
                <span>Total Liabilities & Equity</span>
                <span className="font-mono text-sm">
                  {formatINR(balanceSheet.totalLiabilities + balanceSheet.totalEquity)}
                </span>
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Liabilities</span>
                {balanceSheet.liabilities.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 px-2 text-slate-700 hover:bg-slate-50 rounded">
                    <span>{item.name}</span>
                    <span className="font-mono font-semibold">{formatINR(item.amount)}</span>
                  </div>
                ))}
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block pt-2">Equity & Reserves</span>
                {balanceSheet.equity.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1 px-2 text-slate-700 hover:bg-slate-50 rounded">
                    <span>{item.name}</span>
                    <span className="font-mono font-semibold">{formatINR(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`p-3 rounded-xl text-center text-xs font-bold border ${
              balanceSheet.isBalanced
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {balanceSheet.isBalanced
              ? '✓ Fundamental Accounting Equation Satisfied (Assets = Liabilities + Equity)'
              : '⚠️ Accounting Equation Out of Balance'}
          </div>
        </div>
      )}

      {/* MODAL: POST MANUAL JOURNAL ENTRY */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Post Manual Journal Adjustment</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewEntryOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePostManualEntry} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Voucher Date *</label>
                  <input
                    type="date"
                    required
                    value={newEntryForm.date}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. ADJ-DEP-01"
                    value={newEntryForm.referenceNumber}
                    onChange={(e) => setNewEntryForm({ ...newEntryForm, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Debit Account (Dr) *</label>
                <select
                  value={newEntryForm.debitAccountCode}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, debitAccountCode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                >
                  {accounts.map((acc) => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Credit Account (Cr) *</label>
                <select
                  value={newEntryForm.creditAccountCode}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, creditAccountCode: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                >
                  {accounts.map((acc) => (
                    <option key={acc.code} value={acc.code}>
                      {acc.code} - {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  placeholder="e.g. 25000"
                  value={newEntryForm.amount}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Narration / Justification *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the reason for this journal entry..."
                  value={newEntryForm.narration}
                  onChange={(e) => setNewEntryForm({ ...newEntryForm, narration: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewEntryOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Post to General Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW ENTRY DETAILS */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Journal Entry {selectedEntry.entryNumber}</h3>
                <div className="text-xs text-slate-500">
                  {selectedEntry.date} • {selectedEntry.referenceNumber}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100 italic text-slate-700">
                "{selectedEntry.narration}"
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Account Code & Name</th>
                      <th className="p-2.5 text-right">Debit (₹)</th>
                      <th className="p-2.5 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedEntry.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-800">
                          <span className="font-mono text-blue-700 font-bold">{line.accountCode}</span> - {line.accountName}
                        </td>
                        <td className="p-2.5 text-right font-mono text-emerald-700">
                          {line.debit > 0 ? formatINR(line.debit) : '-'}
                        </td>
                        <td className="p-2.5 text-right font-mono text-amber-800">
                          {line.credit > 0 ? formatINR(line.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-gray-200">
                    <tr>
                      <td className="p-2.5 text-slate-700">Total (Balanced)</td>
                      <td className="p-2.5 text-right font-mono text-emerald-800">
                        {formatINR(selectedEntry.totalDebit)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-amber-900">
                        {formatINR(selectedEntry.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
