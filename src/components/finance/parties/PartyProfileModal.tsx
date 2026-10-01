import React, { useState, useMemo } from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Download,
  Receipt,
  FileCheck,
  Edit2,
  ExternalLink,
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { PartyMaster, PartyLedgerEntry } from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { validateGSTIN } from '../../../utils/gstUtils';

interface PartyProfileModalProps {
  party: PartyMaster | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (party: PartyMaster) => void;
  onOpenStatement: (party: PartyMaster) => void;
}

export const PartyProfileModal: React.FC<PartyProfileModalProps> = ({
  party,
  isOpen,
  onClose,
  onEdit,
  onOpenStatement,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'sales' | 'purchases' | 'terms' | 'docs'>('ledger');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch full ledger statement from storage engine
  const ledgerData = useMemo(() => {
    if (!party) return null;
    return erpFinanceStorage.getPartyLedger(party.id, {
      fromDate: dateFrom || undefined,
      toDate: dateTo || undefined,
    });
  }, [party, dateFrom, dateTo]);

  // Fetch linked sales invoices
  const salesInvoices = useMemo(() => {
    if (!party) return [];
    return erpFinanceStorage.getSalesInvoices().filter((inv) => inv.customerId === party.id);
  }, [party]);

  // Fetch linked purchase invoices
  const purchaseInvoices = useMemo(() => {
    if (!party) return [];
    return erpFinanceStorage.getPurchaseInvoices().filter((inv) => inv.vendorId === party.id);
  }, [party]);

  if (!isOpen || !party) return null;

  const gstValid = party.gstin ? validateGSTIN(party.gstin) : null;
  const creditUsagePercent =
    party.creditLimit > 0
      ? Math.min(100, Math.round((Math.max(0, party.currentBalance) / party.creditLimit) * 100))
      : 0;

  const isOverCredit = party.creditLimit > 0 && party.currentBalance > party.creditLimit;

  // Export ledger CSV
  const handleExportCSV = () => {
    if (!ledgerData) return;
    const headers = ['Date', 'Type', 'Voucher Number', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)', 'Narration'];
    const rows = ledgerData.entries.map((e) => [
      e.date,
      e.type,
      e.referenceNumber,
      e.debit || 0,
      e.credit || 0,
      e.runningBalance,
      `"${(e.narration || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${party.code}_Ledger_Statement.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header Profile Bar */}
        <div className="px-6 py-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-white/10 rounded-xl border border-white/20">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white">{party.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-md font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {party.code}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                    party.type === 'Customer & Vendor'
                      ? 'bg-purple-500/30 text-purple-200 border border-purple-400/30'
                      : party.type === 'Customer'
                      ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30'
                      : 'bg-amber-500/30 text-amber-200 border border-amber-400/30'
                  }`}
                >
                  {party.type}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                  {party.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Legal Entity: <span className="text-slate-200">{party.legalName || party.name}</span> • Place of Supply:{' '}
                <span className="text-slate-200">{party.placeOfSupply}</span> • {party.city}, {party.state}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={() => onOpenStatement(party)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              Statement of Account
            </button>
            <button
              onClick={() => onEdit(party)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">Current Outstanding Balance</span>
            <span
              className={`text-base font-bold ${
                party.currentBalance > 0
                  ? 'text-emerald-700'
                  : party.currentBalance < 0
                  ? 'text-amber-700'
                  : 'text-slate-700'
              }`}
            >
              ₹{Math.abs(party.currentBalance).toLocaleString('en-IN')}{' '}
              <span className="text-xs font-normal">
                {party.currentBalance > 0 ? '(Receivable / Dr)' : party.currentBalance < 0 ? '(Payable / Cr)' : '(Settled)'}
              </span>
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Credit Limit & Rule</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-semibold text-slate-800">
                {party.creditLimit > 0 ? `₹${party.creditLimit.toLocaleString('en-IN')}` : 'No Limit'}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                  party.creditLimitAction === 'Block'
                    ? 'bg-red-100 text-red-700'
                    : party.creditLimitAction === 'Approval'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {party.creditLimitAction}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block">GSTIN / Registration</span>
            <span className="font-mono text-xs font-medium text-slate-800 block mt-0.5">
              {party.gstin || 'Unregistered'}
            </span>
            <span className="text-[10px] text-slate-500">
              {party.gstType} • PAN: {party.pan || 'N/A'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 block">Primary Contact</span>
            <span className="text-xs font-medium text-slate-800 block mt-0.5">
              {party.contactPerson || 'Office Administration'}
            </span>
            <span className="text-[10px] text-slate-500">
              {party.phone} {party.email && `• ${party.email}`}
            </span>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex items-center gap-2 px-6 pt-2 border-b border-slate-200 bg-white text-xs font-medium overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ledger'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            Detailed Subledger ({ledgerData?.entries.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            Sales Invoices ({salesInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'purchases'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600" />
            Purchase Bills ({purchaseInvoices.length})
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Terms, Credit & Bank Details
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            Compliance Docs ({party.documents?.length || 0})
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Detailed Subledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Filter bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-medium text-slate-600">Period:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setDateFrom('');
                        setDateTo('');
                      }}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export CSV
                  </button>
                </div>
              </div>

              {/* Ledger Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Voucher #</th>
                      <th className="py-2.5 px-4">Narration / Details</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                      <th className="py-2.5 px-4 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {/* Opening Balance Row */}
                    <tr className="bg-slate-50/50 font-sans text-slate-600">
                      <td className="py-2 px-3 font-mono">{ledgerData?.period.from || '2026-01-01'}</td>
                      <td className="py-2 px-3 font-semibold">Opening Balance</td>
                      <td className="py-2 px-3">-</td>
                      <td className="py-2 px-4 italic text-slate-500">Brought forward from books</td>
                      <td className="py-2 px-3 text-right">
                        {(ledgerData?.openingBalance || 0) > 0
                          ? `₹${ledgerData?.openingBalance.toLocaleString('en-IN')}`
                          : '-'}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {(ledgerData?.openingBalance || 0) < 0
                          ? `₹${Math.abs(ledgerData?.openingBalance || 0).toLocaleString('en-IN')}`
                          : '-'}
                      </td>
                      <td className="py-2 px-4 text-right font-bold">
                        ₹{Math.abs(ledgerData?.openingBalance || 0).toLocaleString('en-IN')}{' '}
                        <span className="text-[10px] font-normal">
                          {(ledgerData?.openingBalance || 0) >= 0 ? 'Dr' : 'Cr'}
                        </span>
                      </td>
                    </tr>

                    {/* Entries */}
                    {ledgerData?.entries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                          No transactions recorded during selected period.
                        </td>
                      </tr>
                    ) : (
                      ledgerData?.entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-700">{entry.date}</td>
                          <td className="py-2.5 px-3 font-sans">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                entry.type === 'Sales Invoice'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : entry.type === 'Receipt'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : entry.type === 'Purchase Bill'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : entry.type === 'Payment'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {entry.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{entry.referenceNumber}</td>
                          <td className="py-2.5 px-4 font-sans text-slate-600 truncate max-w-xs">
                            {entry.narration}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800">
                            {entry.debit ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800">
                            {entry.credit ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            ₹{Math.abs(entry.runningBalance).toLocaleString('en-IN')}{' '}
                            <span className="text-[10px] font-normal text-slate-500">
                              {entry.balanceType}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>

                  {/* Summary Footer */}
                  <tfoot className="bg-slate-100/80 border-t border-slate-200 font-semibold text-slate-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 font-sans text-right">
                        Total Period Flow / Closing Balance:
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-700">
                        ₹{(ledgerData?.totalDebit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-700">
                        ₹{(ledgerData?.totalCredit || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right text-blue-700 font-bold">
                        ₹{Math.abs(ledgerData?.closingBalance || 0).toLocaleString('en-IN')}{' '}
                        <span className="text-xs">{ledgerData?.balanceType}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Sales Invoices */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-800">Sales Invoices Billed to {party.name}</h3>
                <span className="text-xs text-slate-500">Total: {salesInvoices.length} Invoices</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Invoice #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Grand Total (₹)</th>
                      <th className="py-2.5 px-3 text-right">Balance Due (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salesInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No sales invoices recorded for this party.
                        </td>
                      </tr>
                    ) : (
                      salesInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.date}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.dueDate}</td>
                          <td className="py-2.5 px-3 text-right font-medium">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{inv.balanceAmount.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : inv.status === 'Partially Paid'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Purchase Invoices */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-800">Vendor Bills from {party.name}</h3>
                <span className="text-xs text-slate-500">Total: {purchaseInvoices.length} Bills</span>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Bill #</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Bill Total (₹)</th>
                      <th className="py-2.5 px-3 text-right">Outstanding (₹)</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No purchase bills recorded for this party.
                        </td>
                      </tr>
                    ) : (
                      purchaseInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-semibold text-amber-700">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.date}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inv.dueDate}</td>
                          <td className="py-2.5 px-3 text-right font-medium">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{inv.balanceAmount.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: Credit Terms & Bank Details */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              {/* Credit Limit Meter */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800">Credit Exposure & Limit Health</h4>
                    <p className="text-[11px] text-slate-500">
                      Enforced rule: <strong>{party.creditLimitAction}</strong>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500">Used: </span>
                    <span className="text-sm font-bold text-slate-900">{creditUsagePercent}%</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      creditUsagePercent > 90
                        ? 'bg-red-500'
                        : creditUsagePercent > 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, creditUsagePercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                  <span>Current Due: ₹{Math.max(0, party.currentBalance).toLocaleString('en-IN')}</span>
                  <span>Limit: ₹{party.creditLimit.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Direct Bank Remittance Particulars
                </h4>
                {party.bankDetails ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Bank Name</span>
                      <span className="font-medium text-slate-900">{party.bankDetails.bankName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Beneficiary Name</span>
                      <span className="font-medium text-slate-900">{party.bankDetails.beneficiaryName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Account Number</span>
                      <span className="font-mono font-medium text-slate-900">{party.bankDetails.accountNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">IFSC Code</span>
                      <span className="font-mono font-medium text-slate-900">{party.bankDetails.ifscCode || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Branch Location</span>
                      <span className="font-medium text-slate-900">{party.bankDetails.branch || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Payment Terms</span>
                      <span className="font-medium text-slate-900">{party.paymentTerms || 'Net 30'}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No bank details added for this party yet.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Compliance Documents */}
          {activeTab === 'docs' && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-800">Attached Documents & Statutory Proofs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {party.documents?.length === 0 || !party.documents ? (
                  <div className="col-span-2 py-8 text-center text-xs text-slate-400">
                    No documents on file. Edit party to upload GST certificate or agreements.
                  </div>
                ) : (
                  party.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{doc.fileName}</p>
                          <p className="text-[11px] text-slate-500">
                            {doc.type} • {doc.fileSize} • Uploaded {doc.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-blue-600 hover:underline cursor-pointer">
                        View
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Party ID: {party.id}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
