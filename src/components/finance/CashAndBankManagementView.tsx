import React, { useState, useMemo, useEffect } from 'react';
import {
  Landmark,
  Wallet,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Search,
  X,
  CreditCard,
  Building2,
  Calendar,
  Receipt,
  Layers,
  FileSpreadsheet,
  Edit2,
  FileText,
  DollarSign,
} from 'lucide-react';

import {
  BankAccountRecord,
  CashAccountRecord,
  ChequeRecord,
  FundTransferRecord,
  PaymentTransactionRecord,
  ReceiptTransactionRecord,
} from '../../types/finance';

import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import { PaymentManagementView } from './payments/PaymentManagementView';
import { ReceiptManagementView } from './payments/ReceiptManagementView';
import { AdvanceAdjustmentManagementView } from './payments/AdvanceAdjustmentManagementView';
import { AccountManagementModal } from './cashbank/AccountManagementModal';
import { FundTransferModal } from './cashbank/FundTransferModal';
import { BankReconciliationView } from './cashbank/BankReconciliationView';
import { ChequeManagementView } from './cashbank/ChequeManagementView';
import { CashTransactionsView } from './cashbank/CashTransactionsView';
import { BankTransactionsView } from './cashbank/BankTransactionsView';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export type CashBankTab =
  | 'accounts'
  | 'bank-tx'
  | 'cash-tx'
  | 'transfers'
  | 'reconciliation'
  | 'cheques'
  | 'payments'
  | 'receipts'
  | 'advances';

interface CashAndBankManagementViewProps {
  currentUserName?: string;
  userRole?: string;
  initialTab?: CashBankTab;
  onNavigateTab?: (tab: string) => void;
}

export const CashAndBankManagementView: React.FC<CashAndBankManagementViewProps> = ({
  currentUserName = 'Treasury Manager',
  userRole = 'Admin',
  initialTab = 'accounts',
  onNavigateTab,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccountRecord[]>([]);
  const [cheques, setCheques] = useState<ChequeRecord[]>([]);
  const [transfers, setTransfers] = useState<FundTransferRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptTransactionRecord[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<CashBankTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<BankAccountRecord | CashAccountRecord | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const loadData = () => {
    setBankAccounts(erpFinanceStorage.getBankAccounts());
    setCashAccounts(erpFinanceStorage.getCashAccounts());
    setCheques(erpFinanceStorage.getCheques());
    setTransfers(erpFinanceStorage.getFundTransfers());
    setPayments(erpFinanceStorage.getPayments());
    setReceipts(erpFinanceStorage.getReceipts());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    window.addEventListener('erp_payments_changed', handleDataChange);
    window.addEventListener('erp_receipts_changed', handleDataChange);
    window.addEventListener('erp_cheques_changed', handleDataChange);
    return () => {
      window.removeEventListener('mysar_finance_data_changed', handleDataChange);
      window.removeEventListener('erp_payments_changed', handleDataChange);
      window.removeEventListener('erp_receipts_changed', handleDataChange);
      window.removeEventListener('erp_cheques_changed', handleDataChange);
    };
  }, []);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalBank = bankAccounts.reduce((sum, b) => sum + b.currentBalance, 0);
    const totalCash = cashAccounts.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalTreasury = totalBank + totalCash;
    const pendingCheques = cheques.filter((c) => c.status === 'Pending' || c.status === 'Post-Dated').length;
    const bouncedCheques = cheques.filter((c) => c.status === 'Bounced').length;
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const pdcMaturing = cheques.filter(
      (c) => (c.status === 'Post-Dated' || c.status === 'Pending') && c.maturityDate >= today && c.maturityDate <= sevenDaysLater
    ).length;

    return { totalBank, totalCash, totalTreasury, pendingCheques, bouncedCheques, pdcMaturing };
  }, [bankAccounts, cashAccounts, cheques]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-emerald-50 rounded-xl text-emerald-800 border border-emerald-200 shadow-2xs">
                <Landmark className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Cash, Bank & Treasury Operations
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                Core GL Integrated
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-3xl">
              Commercial bank accounts, physical cash registers & petty cash floats, automated contra fund transfers,
              statement reconciliation (CSV/MT940/CAMT), and complete cheque lifecycle with bounce reversal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAccountToEdit(null);
                setIsAccountModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span>New Account</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTransferModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Fund Transfer</span>
            </button>
          </div>
        </div>

        {/* Treasury Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Bank Balances</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {formatINR(summaryMetrics.totalBank)}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{bankAccounts.length} Commercial Accounts</div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Cash & Petty Cash</div>
            <div className="text-base font-bold font-mono text-emerald-900 mt-0.5">
              {formatINR(summaryMetrics.totalCash)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">{cashAccounts.length} Floats & Vaults</div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Total Liquid Treasury</div>
            <div className="text-base font-bold font-mono text-blue-900 mt-0.5">
              {formatINR(summaryMetrics.totalTreasury)}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">Instant Liquid Capital</div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Cheques & PDCs</div>
            <div className="text-base font-bold font-mono text-amber-900 mt-0.5">
              {summaryMetrics.pendingCheques} Active ({summaryMetrics.pdcMaturing} Maturing)
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">
              {summaryMetrics.bouncedCheques > 0 ? (
                <span className="text-rose-600 font-bold">⚠️ {summaryMetrics.bouncedCheques} Bounced Alert</span>
              ) : (
                'Zero Dishonours'
              )}
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Treasury Accounts</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-100 rounded-full font-bold">
              {bankAccounts.length + cashAccounts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bank-tx')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'bank-tx'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Bank Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cash-tx')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cash-tx'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Cash Transactions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'transfers'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Fund Transfers</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-100 rounded-full font-bold">
              {transfers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-indigo-700 hover:text-indigo-900 bg-indigo-50 font-semibold'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bank Reconciliation</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-indigo-700 text-white rounded-full font-bold">
              CSV/MT940/CAMT
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cheques')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'cheques'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 hover:text-rose-900 bg-rose-50 font-semibold'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Cheque Register & PDCs</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-rose-700 text-white rounded-full font-bold">
              {cheques.length}
            </span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Payments</span>
            <span className="text-[10px] text-slate-400">({payments.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Receipts</span>
            <span className="text-[10px] text-slate-400">({receipts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advances')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'advances'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>Advances</span>
          </button>
        </div>
      </div>

      {/* 1. TREASURY ACCOUNTS OVERVIEW */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          {/* Commercial Bank Accounts Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Landmark className="w-4 h-4 text-blue-700" />
                <h3 className="font-bold text-slate-900 text-sm">Commercial Bank Accounts</h3>
                <span className="text-xs text-slate-400">({bankAccounts.length} Facilities)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  Total Bank Balance:{' '}
                  <span className="font-mono font-bold text-slate-900">{formatINR(summaryMetrics.totalBank)}</span>
                </span>
                <button
                  onClick={() => {
                    setAccountToEdit(null);
                    setIsAccountModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Bank Account</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Account Display Name</th>
                    <th className="py-3 px-4">Bank Name & Branch</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">IFSC</th>
                    <th className="py-3 px-4">Facility Type</th>
                    <th className="py-3 px-4">GL Code</th>
                    <th className="py-3 px-4 text-right">Available Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bankAccounts.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{b.name}</span>
                          {b.isDefault && (
                            <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded text-[9px] font-bold">
                              Default
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.bankName}</div>
                        <div className="text-[11px] text-slate-500">{b.branch || 'Main Branch'}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{b.accountNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{b.ifscCode}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {b.accountType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-700 font-semibold">{b.glAccountCode}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatINR(b.currentBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAccountToEdit(b);
                            setIsAccountModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cash & Petty Cash Floats Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Cash Chests, Petty Cash & Other Accounts</h3>
                <span className="text-xs text-slate-400">({cashAccounts.length} Imprests)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  Total Cash on Hand:{' '}
                  <span className="font-mono font-bold text-slate-900">{formatINR(summaryMetrics.totalCash)}</span>
                </span>
                <button
                  onClick={() => {
                    setAccountToEdit(null);
                    setIsAccountModalOpen(true);
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Float / Account</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Account Type</th>
                    <th className="py-3 px-4">Designated Custodian</th>
                    <th className="py-3 px-4">GL Code</th>
                    <th className="py-3 px-4 text-right">Physical Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cashAccounts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.type === 'Petty Cash'
                              ? 'bg-amber-100 text-amber-800'
                              : c.type === 'Other'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{c.custodian || 'Cashier'}</td>
                      <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">{c.glAccountCode}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatINR(c.currentBalance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setAccountToEdit(c);
                            setIsAccountModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. BANK TRANSACTIONS */}
      {activeTab === 'bank-tx' && (
        <BankTransactionsView
          bankAccounts={bankAccounts}
          onOpenReconciliation={() => setActiveTab('reconciliation')}
        />
      )}

      {/* 3. CASH TRANSACTIONS */}
      {activeTab === 'cash-tx' && (
        <CashTransactionsView
          cashAccounts={cashAccounts}
          onNewTransfer={() => setIsTransferModalOpen(true)}
        />
      )}

      {/* 4. CONTRA FUND TRANSFERS REGISTER */}
      {activeTab === 'transfers' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-slate-900 text-sm">Contra Fund Transfer Register</h3>
                <span className="text-xs text-slate-400">({transfers.length} Vouchers)</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(true)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Fund Transfer</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Transfer Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">From (Credit Source)</th>
                    <th className="py-3 px-4">To (Debit Destination)</th>
                    <th className="py-3 px-4 text-right">Transfer Amount (₹)</th>
                    <th className="py-3 px-4">Instrument / Ref</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        No contra fund transfers posted yet.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{t.transferNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{t.date}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{t.fromAccountName}</div>
                          <span className="text-[10px] text-rose-600 font-medium">Cr. {t.fromAccountType}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{t.toAccountName}</div>
                          <span className="text-[10px] text-emerald-600 font-medium">Dr. {t.toAccountType}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                          {formatINR(t.amount)}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">{t.referenceNumber || '—'}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{t.remarks}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. BANK RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <BankReconciliationView
          bankAccounts={bankAccounts}
          onReconciliationSaved={loadData}
        />
      )}

      {/* 6. CHEQUE MANAGEMENT & PDC RADAR */}
      {activeTab === 'cheques' && (
        <ChequeManagementView
          bankAccounts={bankAccounts}
          onDataChanged={loadData}
        />
      )}

      {/* 7. VENDOR PAYMENTS */}
      {activeTab === 'payments' && (
        <PaymentManagementView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 8. CUSTOMER RECEIPTS */}
      {activeTab === 'receipts' && (
        <ReceiptManagementView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* 9. ADVANCE ADJUSTMENTS */}
      {activeTab === 'advances' && (
        <AdvanceAdjustmentManagementView
          currentUserName={currentUserName}
          userRole={userRole}
          onNavigateTab={onNavigateTab}
        />
      )}

      {/* Modals */}
      <AccountManagementModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        accountToEdit={accountToEdit}
        onSuccess={loadData}
      />

      <FundTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        bankAccounts={bankAccounts}
        cashAccounts={cashAccounts}
        onSuccess={loadData}
      />
    </div>
  );
};
