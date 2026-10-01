import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Save,
  Plus,
  Trash2,
  Info,
  DollarSign,
  Building2,
  Wallet,
  PackageCheck,
  CreditCard,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PartyMaster } from '../../../types/finance';

interface OpeningBalanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

interface PartyBalanceRow {
  partyId: string;
  partyName: string;
  partyCode: string;
  type: string;
  direction: 'Dr' | 'Cr';
  amount: number;
  billNumber?: string;
  billDate?: string;
}

export const OpeningBalanceEntryModal: React.FC<OpeningBalanceEntryModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [rows, setRows] = useState<PartyBalanceRow[]>([]);
  const [parties, setParties] = useState<PartyMaster[]>([]);

  // Other system balances
  const [cashBalance, setCashBalance] = useState(150000);
  const [bankBalance, setBankBalance] = useState(4850000);
  const [inventoryValue, setInventoryValue] = useState(1280000);
  const [fixedAssetsValue, setFixedAssetsValue] = useState(3500000);
  const [loansPayable, setLoansPayable] = useState(2500000);

  const [activeTab, setActiveTab] = useState<'parties' | 'accounts' | 'summary'>('parties');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const overview = erpFinanceStorage.getOpeningBalancesOverview();
    setIsLocked(overview.isLocked);

    const allParties = erpFinanceStorage.getParties();
    setParties(allParties);

    // Populate rows from parties
    const initialRows: PartyBalanceRow[] = allParties.map((p) => {
      const isPayable = p.openingBalance < 0;
      return {
        partyId: p.id,
        partyName: p.name,
        partyCode: p.code,
        type: p.type,
        direction: isPayable ? 'Cr' : 'Dr',
        amount: Math.abs(p.openingBalance || 0),
        billNumber: `OB-${p.code}`,
        billDate: '2026-01-01',
      };
    });

    setRows(initialRows);
  }, [isOpen]);

  // Totals calculation
  const totals = useMemo(() => {
    let partyReceivablesDr = 0;
    let partyPayablesCr = 0;

    rows.forEach((r) => {
      if (r.direction === 'Dr') partyReceivablesDr += Number(r.amount) || 0;
      if (r.direction === 'Cr') partyPayablesCr += Number(r.amount) || 0;
    });

    // Total Debits = Party Receivables + Cash + Bank + Stock + Fixed Assets
    const totalDebits =
      partyReceivablesDr +
      (Number(cashBalance) || 0) +
      (Number(bankBalance) || 0) +
      (Number(inventoryValue) || 0) +
      (Number(fixedAssetsValue) || 0);

    // Total Credits = Party Payables + Loans + Opening Equity/Capital (balancing figure)
    const totalCreditsWithoutCapital = partyPayablesCr + (Number(loansPayable) || 0);
    const balancingCapital = totalDebits - totalCreditsWithoutCapital;

    return {
      partyReceivablesDr,
      partyPayablesCr,
      totalDebits,
      totalCredits: totalDebits, // Auto-balanced by Opening Equity
      balancingCapital,
      isBalanced: true,
    };
  }, [rows, cashBalance, bankBalance, inventoryValue, fixedAssetsValue, loansPayable]);

  const handleRowChange = (index: number, field: keyof PartyBalanceRow, value: any) => {
    if (isLocked) return;
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleSave = () => {
    if (isLocked) {
      setNotification({ type: 'error', message: 'Opening balances are locked and cannot be edited.' });
      return;
    }

    try {
      const partyBalancesPayload = rows.map((r) => ({
        partyId: r.partyId,
        amount: r.direction === 'Cr' ? -Math.abs(Number(r.amount) || 0) : Math.abs(Number(r.amount) || 0),
      }));

      erpFinanceStorage.savePartyOpeningBalances(partyBalancesPayload);
      setNotification({ type: 'success', message: 'Party opening balances updated successfully.' });
      onSaved();
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save opening balances.' });
    }
  };

  const handleLockSetup = () => {
    if (window.confirm('Are you sure you want to LOCK Opening Balances? Once locked, balances cannot be modified without audit override.')) {
      erpFinanceStorage.lockOpeningBalances();
      setIsLocked(true);
      setNotification({ type: 'success', message: 'Opening balances have been locked for Financial Year 2026-27.' });
      onSaved();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/30">
              <FileCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Opening Balance Entry & Verification</h2>
                {isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    <Lock className="w-3 h-3" /> Locked (Production)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Unlock className="w-3 h-3" /> Editable (Setup Phase)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Financial Year 2026-27 Opening State (Cut-over / Go-Live Ledger Balances)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification banner */}
        {notification && (
          <div
            className={`px-6 py-2.5 flex items-center gap-2 text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Top Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Party Receivables (Dr)</span>
            <span className="text-sm font-bold text-emerald-700">
              ₹{totals.partyReceivablesDr.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Party Payables (Cr)</span>
            <span className="text-sm font-bold text-amber-700">
              ₹{totals.partyPayablesCr.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Total Assets / Debits</span>
            <span className="text-sm font-bold text-slate-900">
              ₹{totals.totalDebits.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="bg-white p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block">Opening Owner Capital</span>
            <span className="text-sm font-bold text-blue-700">
              ₹{totals.balancingCapital.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-2.5 border-b border-slate-200 bg-white text-xs font-medium">
          <button
            onClick={() => setActiveTab('parties')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'parties'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Party Opening Balances ({rows.length})
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'accounts'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Cash, Bank & Inventory Opening
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-2 px-3 border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Trial Balance Reconciliation
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Party Opening Balances Table */}
          {activeTab === 'parties' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <p>
                  Enter opening balances for each customer, vendor, or dual entity. Use <strong>Debit (Dr)</strong> if they owe you, and <strong>Credit (Cr)</strong> if you owe them.
                </p>
                {isLocked && (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Read-only mode
                  </span>
                )}
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Party Name & Code</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Balance Direction</th>
                      <th className="py-2.5 px-3 text-right">Opening Amount (₹)</th>
                      <th className="py-2.5 px-3">Ref Bill / Voucher</th>
                      <th className="py-2.5 px-3">Bill Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, index) => (
                      <tr key={row.partyId} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{row.partyName}</span>
                          <span className="font-mono text-[11px] text-slate-500">{row.partyCode}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                            {row.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            disabled={isLocked}
                            value={row.direction}
                            onChange={(e) => handleRowChange(index, 'direction', e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-medium disabled:bg-slate-100"
                          >
                            <option value="Dr">Dr (Receivable from Party)</option>
                            <option value="Cr">Cr (Payable to Party)</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            disabled={isLocked}
                            value={row.amount}
                            onChange={(e) => handleRowChange(index, 'amount', Number(e.target.value))}
                            className="w-32 px-2 py-1 text-right border border-slate-300 rounded text-xs font-mono font-medium disabled:bg-slate-100"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            disabled={isLocked}
                            value={row.billNumber || ''}
                            onChange={(e) => handleRowChange(index, 'billNumber', e.target.value)}
                            className="w-28 px-2 py-1 border border-slate-300 rounded text-xs font-mono disabled:bg-slate-100"
                            placeholder="INV-PREV-01"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="date"
                            disabled={isLocked}
                            value={row.billDate || '2026-01-01'}
                            onChange={(e) => handleRowChange(index, 'billDate', e.target.value)}
                            className="px-2 py-1 border border-slate-300 rounded text-xs disabled:bg-slate-100"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Cash, Bank & Inventory Opening */}
          {activeTab === 'accounts' && (
            <div className="space-y-4 max-w-2xl">
              <p className="text-xs text-slate-500">
                Configure opening balances of Cash in Hand, Bank Accounts, Inventory Stock, and Fixed Assets to establish your balance sheet base.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" /> Cash in Hand (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={cashBalance}
                    onChange={(e) => setCashBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Bank Balances (HDFC + Federal) (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={bankBalance}
                    onChange={(e) => setBankBalance(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <PackageCheck className="w-3.5 h-3.5 text-indigo-600" /> Opening Inventory Valuation (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={inventoryValue}
                    onChange={(e) => setInventoryValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-600" /> Fixed Assets (Net Book Value) (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={fixedAssetsValue}
                    onChange={(e) => setFixedAssetsValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Long Term Loans & Borrowings (Cr) (₹)
                  </label>
                  <input
                    type="number"
                    disabled={isLocked}
                    value={loansPayable}
                    onChange={(e) => setLoansPayable(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg bg-white disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Trial Balance Reconciliation */}
          {activeTab === 'summary' && (
            <div className="space-y-4 max-w-2xl">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Opening Balance Reconciled</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Total Debits equal Total Credits. Any difference is posted to the <strong>Opening Equity / Retained Earnings</strong> account (Code 3000).
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 font-semibold text-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Account Head</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr>
                      <td className="py-2 px-3 font-sans">Accounts Receivable (Customers)</td>
                      <td className="py-2 px-3 text-right font-medium">₹{totals.partyReceivablesDr.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans">Cash in Hand</td>
                      <td className="py-2 px-3 text-right font-medium">₹{cashBalance.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans">Bank Accounts</td>
                      <td className="py-2 px-3 text-right font-medium">₹{bankBalance.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans">Finished Goods & Raw Material Inventory</td>
                      <td className="py-2 px-3 text-right font-medium">₹{inventoryValue.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans">Property, Plant & Equipment (Fixed Assets)</td>
                      <td className="py-2 px-3 text-right font-medium">₹{fixedAssetsValue.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans">Accounts Payable (Vendors)</td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                      <td className="py-2 px-3 text-right font-medium">₹{totals.partyPayablesCr.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-sans">Bank Borrowings & Term Loans</td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                      <td className="py-2 px-3 text-right font-medium">₹{loansPayable.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-blue-50/50">
                      <td className="py-2 px-3 font-sans font-semibold text-blue-900">
                        Opening Equity / Retained Earnings (Balancing Figure)
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">-</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700">
                        ₹{totals.balancingCapital.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-200">
                    <tr>
                      <td className="py-2.5 px-3 font-sans">Total Balanced Entry</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">₹{totals.totalDebits.toLocaleString('en-IN')}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-700">₹{totals.totalDebits.toLocaleString('en-IN')}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {!isLocked ? (
              <button
                type="button"
                onClick={handleLockSetup}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <Lock className="w-3.5 h-3.5" /> Lock Opening Balances
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic">
                Balances are locked to prevent inadvertent audit discrepancies.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
            >
              Close
            </button>
            {!isLocked && (
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" /> Save Opening Balances
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
