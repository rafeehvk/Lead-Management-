import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Building2,
  Ban,
  Check,
  X,
  FileText,
  AlertTriangle,
  Info,
  DollarSign,
} from 'lucide-react';

import {
  ChequeRecord,
  ChequeStatus,
  ChequeType,
  BankAccountRecord,
} from '../../../types/finance';

import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface ChequeManagementViewProps {
  bankAccounts: BankAccountRecord[];
  onDataChanged?: () => void;
}

export const ChequeManagementView: React.FC<ChequeManagementViewProps> = ({
  bankAccounts,
  onDataChanged,
}) => {
  const [cheques, setCheques] = useState<ChequeRecord[]>(erpFinanceStorage.getCheques());
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | 'Received' | 'Issued'>('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Bounce Modal State
  const [chequeToBounce, setChequeToBounce] = useState<ChequeRecord | null>(null);
  const [bounceReason, setBounceReason] = useState('Insufficient Funds (Code 01)');
  const [bounceNotes, setBounceNotes] = useState('');

  // New Cheque Modal State
  const [isNewChequeModalOpen, setIsNewChequeModalOpen] = useState(false);
  const [newChequeForm, setNewChequeForm] = useState({
    chequeNumber: '',
    type: 'Received' as ChequeType,
    partyId: '',
    partyName: '',
    bankAccountId: bankAccounts[0]?.id || '',
    bankName: 'HDFC Bank',
    amount: '',
    chequeDate: new Date().toISOString().split('T')[0],
    maturityDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'danger' } | null>(null);

  const refreshCheques = () => {
    const fresh = erpFinanceStorage.getCheques();
    setCheques(fresh);
    if (onDataChanged) onDataChanged();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // PDC Maturity Radar
  const pdcMaturingNext7Days = useMemo(() => {
    return cheques.filter(
      (c) =>
        (c.status === 'Post-Dated' || c.status === 'Pending') &&
        c.maturityDate >= todayStr &&
        c.maturityDate <= next7DaysStr
    );
  }, [cheques, todayStr, next7DaysStr]);

  const pdcMaturingToday = useMemo(() => {
    return cheques.filter(
      (c) =>
        (c.status === 'Post-Dated' || c.status === 'Pending') &&
        c.maturityDate === todayStr
    );
  }, [cheques, todayStr]);

  const bouncedCheques = useMemo(() => {
    return cheques.filter((c) => c.status === 'Bounced');
  }, [cheques]);

  const depositedCheques = useMemo(() => {
    return cheques.filter((c) => c.status === 'Deposited');
  }, [cheques]);

  // Handle Cheque Actions
  const handleDeposit = (cheque: ChequeRecord) => {
    const depositDate = todayStr;
    const bankAccount = bankAccounts.find((b) => b.id === cheque.bankAccountId) || bankAccounts[0];
    erpFinanceStorage.depositCheque(cheque.id, depositDate, bankAccount?.id);
    refreshCheques();
    setNotification({
      message: `Cheque #${cheque.chequeNumber} marked as Deposited for clearing at ${bankAccount?.name || 'Bank'}.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleClear = (cheque: ChequeRecord) => {
    const clearanceDate = todayStr;
    erpFinanceStorage.clearCheque(cheque.id, clearanceDate);
    refreshCheques();
    setNotification({
      message: `Cheque #${cheque.chequeNumber} Cleared! General Ledger updated.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCancel = (cheque: ChequeRecord) => {
    erpFinanceStorage.cancelCheque(cheque.id, 'Cancelled by Treasury Manager');
    refreshCheques();
    setNotification({
      message: `Cheque #${cheque.chequeNumber} Cancelled.`,
      type: 'danger',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Submit Bounce Workflow
  const handleConfirmBounce = () => {
    if (!chequeToBounce) return;

    try {
      erpFinanceStorage.processChequeBounce(chequeToBounce.id, {
        bounceDate: todayStr,
        bounceReason,
        bounceFee: 350, // Standard bank cheque bounce charge
        notes: bounceNotes || `Cheque dishonoured by drawer bank: ${bounceReason}`,
      });

      refreshCheques();
      setChequeToBounce(null);
      setNotification({
        message: `Cheque #${chequeToBounce.chequeNumber} marked Bounced. Ledger reversed, invoice outstanding restored, and ${chequeToBounce.partyName} flagged on hold!`,
        type: 'danger',
      });
      setTimeout(() => setNotification(null), 6000);
    } catch (err: any) {
      alert(err?.message || 'Error processing cheque bounce');
    }
  };

  // Create Cheque
  const handleCreateCheque = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChequeForm.chequeNumber || !newChequeForm.partyName || !newChequeForm.amount) {
      alert('Please fill in Cheque Number, Party Name, and Amount.');
      return;
    }

    const isPostDated = newChequeForm.maturityDate > todayStr;
    const initialStatus: ChequeStatus = isPostDated ? 'Post-Dated' : 'Pending';

    const newRecord: ChequeRecord = {
      id: `chq-${Date.now()}`,
      chequeNumber: newChequeForm.chequeNumber,
      type: newChequeForm.type,
      partyId: newChequeForm.partyId || 'party-misc',
      partyName: newChequeForm.partyName,
      bankAccountId: newChequeForm.bankAccountId,
      bankName: newChequeForm.bankName,
      amount: Number(newChequeForm.amount),
      chequeDate: newChequeForm.chequeDate,
      maturityDate: newChequeForm.maturityDate,
      status: initialStatus,
      notes: newChequeForm.notes,
    };

    erpFinanceStorage.saveCheque(newRecord);
    refreshCheques();
    setIsNewChequeModalOpen(false);
    setNewChequeForm({
      chequeNumber: '',
      type: 'Received',
      partyId: '',
      partyName: '',
      bankAccountId: bankAccounts[0]?.id || '',
      bankName: 'HDFC Bank',
      amount: '',
      chequeDate: todayStr,
      maturityDate: todayStr,
      notes: '',
    });
    setNotification({
      message: `Cheque #${newRecord.chequeNumber} registered successfully as ${newRecord.status}!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered List
  const filteredCheques = useMemo(() => {
    return cheques.filter((c) => {
      const matchType = selectedTypeFilter === 'All' || c.type === selectedTypeFilter;
      const matchStatus = selectedStatusFilter === 'All' || c.status === selectedStatusFilter;
      const matchSearch =
        searchQuery === '' ||
        c.chequeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(c.amount).includes(searchQuery);

      return matchType && matchStatus && matchSearch;
    });
  }, [cheques, selectedTypeFilter, selectedStatusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Cheque Management & PDC Radar</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  Full Instrument Lifecycle
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Track Issued & Received cheques, post-dated maturities, bank clearing, and automated bounce reversals
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsNewChequeModalOpen(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start lg:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register Cheque</span>
          </button>
        </div>

        {/* Notifications */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
              notification.type === 'danger'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'danger' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          {/* PDCs Maturing this week */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200">
            <div className="flex items-center justify-between text-xs font-semibold text-amber-900 mb-1">
              <span>PDCs Maturing (7 Days)</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {pdcMaturingNext7Days.length} Instruments
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-amber-900">
              {formatINR(pdcMaturingNext7Days.reduce((s, c) => s + c.amount, 0))}
            </div>
            <div className="text-[11px] text-amber-700 mt-1">
              {pdcMaturingToday.length > 0
                ? `⚡ ${pdcMaturingToday.length} maturing TODAY for deposit`
                : 'Matures between today and next 7 days'}
            </div>
          </div>

          {/* Deposited in Clearing */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900 mb-1">
              <span>Deposited in Clearing</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {depositedCheques.length} In Transit
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-blue-900">
              {formatINR(depositedCheques.reduce((s, c) => s + c.amount, 0))}
            </div>
            <div className="text-[11px] text-blue-700 mt-1">Awaiting bank clearing confirmation</div>
          </div>

          {/* Bounced / Dishonoured Alert */}
          <div
            className={`p-4 rounded-xl border ${
              bouncedCheques.length > 0
                ? 'bg-rose-50/70 border-rose-200 animate-pulse-subtle'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className={bouncedCheques.length > 0 ? 'text-rose-900' : 'text-slate-600'}>
                Dishonoured / Bounced
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  bouncedCheques.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {bouncedCheques.length} Critical
              </span>
            </div>
            <div
              className={`text-lg font-bold font-mono ${
                bouncedCheques.length > 0 ? 'text-rose-700' : 'text-slate-700'
              }`}
            >
              {formatINR(bouncedCheques.reduce((s, c) => s + c.amount, 0))}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {bouncedCheques.length > 0 ? 'Ledger reversed; Party flagged On Hold' : 'No active bounced instruments'}
            </div>
          </div>

          {/* Total Instrument Register */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-1">
              <span>Cheque Register</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {cheques.length} Total
              </span>
            </div>
            <div className="text-lg font-bold font-mono text-slate-900">
              {formatINR(cheques.reduce((s, c) => s + c.amount, 0))}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {cheques.filter((c) => c.status === 'Cleared').length} Cleared | {cheques.filter((c) => c.status === 'Post-Dated').length} Post-Dated
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cheque #, party name, or bank..."
            className="w-full text-xs bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Received', 'Issued'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTypeFilter(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedTypeFilter === t
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {(['All', 'Post-Dated', 'Pending', 'Deposited', 'Cleared', 'Bounced', 'Cancelled'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(st)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  selectedStatusFilter === st
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cheque Register Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-900">
              Cheque Register ({filteredCheques.length} Records)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Total Filtered Value: <span className="font-bold font-mono text-slate-900">{formatINR(filteredCheques.reduce((s, c) => s + c.amount, 0))}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Cheque Number</th>
                <th className="py-3 px-4">Direction</th>
                <th className="py-3 px-4">Party & Bank</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4">Cheque Date</th>
                <th className="py-3 px-4">Maturity / Status Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCheques.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-medium">No cheques found matching the current filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredCheques.map((chq) => {
                  const isPDC = chq.status === 'Post-Dated' || chq.maturityDate > todayStr;
                  const isMaturingSoon = isPDC && chq.maturityDate <= next7DaysStr;

                  return (
                    <tr key={chq.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{chq.chequeNumber}</span>
                          {isMaturingSoon && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" title="Maturing soon" />
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{chq.notes || 'Standard instrument'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            chq.type === 'Received'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {chq.type === 'Received' ? (
                            <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                          )}
                          <span>{chq.type}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{chq.partyName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{chq.bankName}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(chq.amount)}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">{chq.chequeDate}</td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-800 font-semibold">{chq.maturityDate}</div>
                        {chq.depositDate && (
                          <div className="text-[10px] text-blue-600">Dep: {chq.depositDate}</div>
                        )}
                        {chq.clearanceDate && (
                          <div className="text-[10px] text-emerald-600">Clr: {chq.clearanceDate}</div>
                        )}
                        {chq.bounceDate && (
                          <div className="text-[10px] text-rose-600 font-bold">Bounced: {chq.bounceDate}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            chq.status === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : chq.status === 'Deposited'
                              ? 'bg-blue-100 text-blue-800'
                              : chq.status === 'Bounced'
                              ? 'bg-rose-100 text-rose-800 font-black'
                              : chq.status === 'Post-Dated'
                              ? 'bg-purple-100 text-purple-800'
                              : chq.status === 'Cancelled'
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {chq.status === 'Cleared' && <Check className="w-3 h-3 text-emerald-600" />}
                          {chq.status === 'Bounced' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                          {chq.status === 'Post-Dated' && <Clock className="w-3 h-3 text-purple-600" />}
                          <span>{chq.status}</span>
                        </span>
                        {chq.bounceReason && (
                          <div className="text-[9px] text-rose-600 mt-0.5 truncate max-w-[130px] mx-auto">
                            {chq.bounceReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Deposit button for Pending / Post-Dated */}
                          {(chq.status === 'Pending' || chq.status === 'Post-Dated') && (
                            <button
                              onClick={() => handleDeposit(chq)}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              title="Deposit in bank account for clearing"
                            >
                              Deposit
                            </button>
                          )}

                          {/* Clear button for Deposited */}
                          {chq.status === 'Deposited' && (
                            <button
                              onClick={() => handleClear(chq)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                              title="Mark cheque as cleared by bank"
                            >
                              Clear
                            </button>
                          )}

                          {/* Bounce button for non-bounced, non-cancelled */}
                          {chq.status !== 'Bounced' && chq.status !== 'Cancelled' && (
                            <button
                              onClick={() => {
                                setChequeToBounce(chq);
                                setBounceReason('Insufficient Funds (Code 01)');
                                setBounceNotes('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                              title="Trigger cheque bounce reversal workflow"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Bounce</span>
                            </button>
                          )}

                          {/* Cancel button */}
                          {(chq.status === 'Pending' || chq.status === 'Post-Dated') && (
                            <button
                              onClick={() => handleCancel(chq)}
                              className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Cancel cheque instrument"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cheque Bounce Modal (Critical Reversal Workflow) */}
      {chequeToBounce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-rose-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-rose-950">Cheque Dishonour / Bounce Reversal</h3>
                  <p className="text-xs text-rose-700">Automated multi-step GL & Ledger Reversal Workflow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChequeToBounce(null)}
                className="text-rose-400 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Instrument Summary */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    Cheque #{chequeToBounce.chequeNumber}
                  </span>
                  <span className="text-sm font-bold font-mono text-rose-700">
                    {formatINR(chequeToBounce.amount)}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Drawer/Payee: <span className="font-semibold text-slate-900">{chequeToBounce.partyName}</span> | Bank: {chequeToBounce.bankName}
                </div>
              </div>

              {/* Workflow Breakdown Warning */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
                <div className="font-bold flex items-center gap-1.5 text-rose-950">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>The following actions will be executed automatically:</span>
                </div>
                <ul className="space-y-1 pl-5 list-disc text-[11px] text-rose-800">
                  <li>Mark cheque status as <strong>Bounced</strong> with timestamp and reason.</li>
                  <li>Reverse original Payment/Receipt entry in General Ledger.</li>
                  <li>Restore outstanding balance on the related Customer/Vendor invoices.</li>
                  <li><strong>Flag Party as "On Hold"</strong> with high credit-risk warning for all sales & billing.</li>
                  <li>Auto-post reversing double-entry journal voucher in Accounting Engine.</li>
                  <li>Escalate instrument to the <strong>"Critical" Action Required</strong> dashboard section.</li>
                </ul>
              </div>

              {/* Bounce Reason Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dishonour / Return Reason <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bounceReason}
                  onChange={(e) => setBounceReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                >
                  <option value="Insufficient Funds (Code 01)">Insufficient Funds (Code 01)</option>
                  <option value="Refer to Drawer (Code 02)">Refer to Drawer (Code 02)</option>
                  <option value="Payment Stopped by Drawer (Code 10)">Payment Stopped by Drawer (Code 10)</option>
                  <option value="Signature Differs / Incomplete (Code 03)">Signature Differs / Incomplete (Code 03)</option>
                  <option value="Account Closed / Frozen (Code 04)">Account Closed / Frozen (Code 04)</option>
                  <option value="Instrument Stale / Post-Dated (Code 05)">Instrument Stale / Post-Dated (Code 05)</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Return Memo / Officer Notes
                </label>
                <input
                  type="text"
                  value={bounceNotes}
                  onChange={(e) => setBounceNotes(e.target.value)}
                  placeholder="e.g. Returned with memo by Federal Bank clearing house. Bank charges ₹350."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setChequeToBounce(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBounce}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Execute Bounce Reversal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Cheque Modal */}
      {isNewChequeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Register Cheque Instrument</h3>
                  <p className="text-xs text-slate-500">Record customer received cheque or vendor issued instrument</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChequeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCheque} className="p-6 space-y-4">
              {/* Type: Received / Issued */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewChequeForm({ ...newChequeForm, type: 'Received' })}
                  className={`p-3 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    newChequeForm.type === 'Received'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  <span>Received (from Customer)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNewChequeForm({ ...newChequeForm, type: 'Issued' })}
                  className={`p-3 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    newChequeForm.type === 'Issued'
                      ? 'border-rose-600 bg-rose-50 text-rose-900'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 mx-auto mb-1 text-rose-600" />
                  <span>Issued (to Vendor)</span>
                </button>
              </div>

              {/* Cheque # & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cheque Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newChequeForm.chequeNumber}
                    onChange={(e) => setNewChequeForm({ ...newChequeForm, chequeNumber: e.target.value })}
                    placeholder="e.g. 104925"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newChequeForm.amount}
                    onChange={(e) => setNewChequeForm({ ...newChequeForm, amount: e.target.value })}
                    placeholder="e.g. 125000"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Party Name & Bank Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Party Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newChequeForm.partyName}
                    onChange={(e) => setNewChequeForm({ ...newChequeForm, partyName: e.target.value })}
                    placeholder={newChequeForm.type === 'Received' ? 'e.g. Cochin Tech University' : 'e.g. Dell India IT Labs'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Instrument Bank <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newChequeForm.bankName}
                    onChange={(e) => setNewChequeForm({ ...newChequeForm, bankName: e.target.value })}
                    placeholder="e.g. HDFC Bank, SBI, ICICI"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cheque Date</label>
                  <input
                    type="date"
                    required
                    value={newChequeForm.chequeDate}
                    onChange={(e) => setNewChequeForm({ ...newChequeForm, chequeDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Maturity Date (PDC)
                  </label>
                  <input
                    type="date"
                    required
                    value={newChequeForm.maturityDate}
                    onChange={(e) => setNewChequeForm({ ...newChequeForm, maturityDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              {/* Target Bank Account for deposit/issuance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Bank Account
                </label>
                <select
                  value={newChequeForm.bankAccountId}
                  onChange={(e) => setNewChequeForm({ ...newChequeForm, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white"
                >
                  {bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.accountNumber.slice(-4)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Purpose</label>
                <input
                  type="text"
                  value={newChequeForm.notes}
                  onChange={(e) => setNewChequeForm({ ...newChequeForm, notes: e.target.value })}
                  placeholder="e.g. Quarterly maintenance fee or vendor advance deposit"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewChequeModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Save Cheque Instrument
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
