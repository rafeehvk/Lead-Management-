import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Calendar,
  Download,
  Printer,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  Building2,
  Phone,
  Mail,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { erpFinanceStorage, COMPANY_CONFIG } from '../../../services/finance/erpFinanceStorage';
import { PartyMaster, PartyLedgerEntry } from '../../../types/finance';

interface PartyLedgerViewProps {
  partyId?: string;
  onSelectParty?: (party: PartyMaster) => void;
  onClose?: () => void;
  onViewTransaction?: (refNumber: string) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export const PartyLedgerView: React.FC<PartyLedgerViewProps> = ({
  partyId,
  onSelectParty,
  onClose,
  onViewTransaction,
}) => {
  const [parties, setParties] = useState<PartyMaster[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string>(partyId || '');
  const [fromDate, setFromDate] = useState<string>('2026-04-01');
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  useEffect(() => {
    const list = erpFinanceStorage.getParties();
    setParties(list);
    if (partyId) {
      setSelectedPartyId(partyId);
    } else if (list.length > 0 && !selectedPartyId) {
      setSelectedPartyId(list[0].id);
    }
  }, [partyId]);

  const selectedParty = useMemo(() => {
    return parties.find((p) => p.id === selectedPartyId || p.code === selectedPartyId) || null;
  }, [parties, selectedPartyId]);

  // Fetch Ledger data with opening balance
  const ledgerData = useMemo(() => {
    if (!selectedPartyId) {
      return {
        entries: [] as PartyLedgerEntry[],
        totalDebit: 0,
        totalCredit: 0,
        closingBalance: 0,
        balanceType: 'Dr' as 'Dr' | 'Cr',
      };
    }
    return erpFinanceStorage.getPartyLedger(selectedPartyId, {
      fromDate,
      toDate,
    });
  }, [selectedPartyId, fromDate, toDate]);

  // Filtered entries based on UI search & type
  const filteredEntries = useMemo(() => {
    return ledgerData.entries.filter((entry) => {
      const matchSearch =
        searchQuery === '' ||
        entry.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.narration && entry.narration.toLowerCase().includes(searchQuery.toLowerCase())) ||
        entry.transactionType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === 'All' || entry.transactionType === typeFilter;
      return matchSearch && matchType;
    });
  }, [ledgerData.entries, searchQuery, typeFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!selectedParty) return;
    const headers = ['Date', 'Reference Number', 'Transaction Type', 'Narration', 'Debit (INR)', 'Credit (INR)', 'Balance (INR)'];
    const rows = filteredEntries.map((e) => [
      e.date,
      `"${e.referenceNumber}"`,
      `"${e.transactionType}"`,
      `"${(e.narration || '').replace(/"/g, '""')}"`,
      e.debit.toFixed(2),
      e.credit.toFixed(2),
      e.balance.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PartyLedger_${selectedParty.name.replace(/\s+/g, '_')}_${fromDate}_to_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Professional PDF Export using jsPDF
  const handleExportPDF = () => {
    if (!selectedParty) return;
    setIsExportingPdf(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 14;

      // Header Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(14, y, pageWidth - 28, 22, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text(COMPANY_CONFIG.name.toUpperCase(), 18, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text(`GSTIN: ${COMPANY_CONFIG.gstin} | PAN: ${COMPANY_CONFIG.pan} | State: ${COMPANY_CONFIG.state}`, 18, y + 14);
      doc.text(`MYSAR ERP Financial Sub-Ledger Statement`, 18, y + 19);

      y += 28;

      // Title & Date Block
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('STATEMENT OF ACCOUNT / PARTY SUBLEDGER', 14, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Statement Period: ${fromDate} to ${toDate} | Generated: ${new Date().toLocaleString('en-IN')}`, 14, y + 5);

      y += 12;

      // Party Details Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, y, pageWidth - 28, 26, 2, 2, 'FD');

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${selectedParty.name} (${selectedParty.code})`, 18, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Party Type: ${selectedParty.type} | Category: ${selectedParty.category || 'General'}`, 18, y + 11);
      doc.text(`GSTIN: ${selectedParty.gstin || 'Unregistered'} | PAN: ${selectedParty.pan || 'N/A'}`, 18, y + 16);
      doc.text(`Address: ${selectedParty.billingAddress || selectedParty.city || 'Kochi, Kerala'}`, 18, y + 21);

      // Financial Summary Box on Right
      const rightX = pageWidth - 80;
      doc.setFont('helvetica', 'bold');
      doc.text(`Opening Balance: ${formatINR(selectedParty.openingBalance)}`, rightX, y + 6);
      doc.text(`Total Debits: ${formatINR(ledgerData.totalDebit)}`, rightX, y + 11);
      doc.text(`Total Credits: ${formatINR(ledgerData.totalCredit)}`, rightX, y + 16);
      doc.setTextColor(selectedParty.currentBalance >= 0 ? 22 : 180, selectedParty.currentBalance >= 0 ? 101 : 30, 40);
      doc.text(`Closing Balance: ${formatINR(Math.abs(ledgerData.closingBalance))} ${ledgerData.balanceType}`, rightX, y + 21);

      y += 32;

      // Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      doc.text('Date', 16, y + 5);
      doc.text('Reference #', 36, y + 5);
      doc.text('Voucher Type', 70, y + 5);
      doc.text('Narration', 105, y + 5);
      doc.text('Debit (INR)', 142, y + 5, { align: 'right' });
      doc.text('Credit (INR)', 168, y + 5, { align: 'right' });
      doc.text('Balance (INR)', 194, y + 5, { align: 'right' });

      y += 8;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);

      filteredEntries.forEach((entry, idx) => {
        // Page break if near bottom
        if (y > 275) {
          doc.addPage();
          y = 15;
          // Re-print table header
          doc.setFillColor(241, 245, 249);
          doc.rect(14, y, pageWidth - 28, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(30, 41, 59);
          doc.text('Date', 16, y + 5);
          doc.text('Reference #', 36, y + 5);
          doc.text('Voucher Type', 70, y + 5);
          doc.text('Narration', 105, y + 5);
          doc.text('Debit (INR)', 142, y + 5, { align: 'right' });
          doc.text('Credit (INR)', 168, y + 5, { align: 'right' });
          doc.text('Balance (INR)', 194, y + 5, { align: 'right' });
          y += 8;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
        }

        if (idx % 2 === 1) {
          doc.setFillColor(249, 250, 251);
          doc.rect(14, y - 3.5, pageWidth - 28, 6.5, 'F');
        }

        doc.setTextColor(30, 41, 59);
        doc.text(entry.date, 16, y);
        doc.text(entry.referenceNumber, 36, y);
        doc.text(entry.transactionType, 70, y);

        const narr = (entry.narration || '-').substring(0, 26);
        doc.text(narr, 105, y);

        doc.text(entry.debit > 0 ? entry.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-', 142, y, { align: 'right' });
        doc.text(entry.credit > 0 ? entry.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-', 168, y, { align: 'right' });

        const balFormatted = `${Math.abs(entry.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${
          entry.balance >= 0 ? 'Dr' : 'Cr'
        }`;
        doc.text(balFormatted, 194, y, { align: 'right' });

        y += 6.5;
      });

      // Total row
      y += 2;
      doc.setDrawColor(203, 213, 225);
      doc.line(14, y, pageWidth - 14, y);
      y += 5;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('Total Period Movement & Closing Balance', 16, y);
      doc.text(ledgerData.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 142, y, { align: 'right' });
      doc.text(ledgerData.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 168, y, { align: 'right' });
      doc.text(
        `${Math.abs(ledgerData.closingBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${ledgerData.balanceType}`,
        194,
        y,
        { align: 'right' }
      );

      // Signatory
      y += 18;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer generated financial ledger statement and does not require a physical signature.', 14, y);
      doc.text('For questions or reconciliation discrepancies, please email accounts@casbiro.com', 14, y + 4);

      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signatory', pageWidth - 45, y + 10);
      doc.text('Casbiro Solutions Private Limited', pageWidth - 60, y + 14);

      doc.save(`PartyLedger_${selectedParty.code}_${fromDate}_${toDate}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const transactionTypes = [
    'All',
    'Opening Balance',
    'Sales Invoice',
    'Purchase Invoice',
    'Receipt',
    'Payment',
    'Credit Note',
    'Debit Note',
    'Advance Receipt',
    'Advance Payment',
  ];

  return (
    <div className="space-y-4">
      {/* Top Header & Party Selector */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[#168A45]/10 text-[#168A45] rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Party Sub-Ledger & Transaction History</h1>
                <p className="text-xs text-slate-500">
                  Dual-trading entity historical ledger with opening balance integration and verifiable journal trail
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Party Selector Dropdown */}
            <div className="min-w-[240px]">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Select Trading Party
              </label>
              <select
                value={selectedPartyId}
                onChange={(e) => {
                  setSelectedPartyId(e.target.value);
                  const p = parties.find((item) => item.id === e.target.value);
                  if (p && onSelectParty) onSelectParty(p);
                }}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#168A45]"
              >
                {parties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code} - {p.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filters */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                title="Export CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportPDF}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#127038] text-white text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isExportingPdf ? 'Generating...' : 'Export PDF'}</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-3 py-2 border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Party Summary Bar */}
        {selectedParty && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Party Name & Code</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{selectedParty.name}</span>
              <span className="text-[11px] text-slate-500 font-mono">{selectedParty.code}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Type & Category</span>
              <span className="text-xs font-bold text-slate-800 block">{selectedParty.type}</span>
              <span className="text-[11px] text-slate-500">{selectedParty.category || 'General'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">GSTIN & PAN</span>
              <span className="text-xs font-mono font-semibold text-slate-800 block truncate">
                {selectedParty.gstin || 'Unregistered'}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{selectedParty.pan || 'N/A'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Opening Balance</span>
              <span
                className={`text-xs font-bold ${
                  selectedParty.openingBalance >= 0 ? 'text-blue-700' : 'text-purple-700'
                }`}
              >
                {formatINR(Math.abs(selectedParty.openingBalance))}{' '}
                {selectedParty.openingBalance >= 0 ? 'Dr' : 'Cr'}
              </span>
              <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Base FY Opening
              </span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Credit Limit</span>
              <span className="text-xs font-bold text-slate-800 block">{formatINR(selectedParty.creditLimit)}</span>
              <span className="text-[10px] text-amber-700 font-medium">Policy: {selectedParty.creditLimitAction}</span>
            </div>
            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold uppercase block">Net Current Balance</span>
              <span
                className={`text-sm font-black ${
                  ledgerData.closingBalance >= 0 ? 'text-emerald-700' : 'text-purple-800'
                }`}
              >
                {formatINR(Math.abs(ledgerData.closingBalance))} {ledgerData.balanceType}
              </span>
              <span className="text-[10px] text-emerald-600 block">
                {ledgerData.balanceType === 'Dr' ? 'Receivable from Party' : 'Payable to Party'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Movement Metrics KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Opening Balance (Period)</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">
            {formatINR(Math.abs(selectedParty?.openingBalance || 0))}{' '}
            <span className="text-xs font-semibold text-slate-500">
              {(selectedParty?.openingBalance || 0) >= 0 ? 'Dr' : 'Cr'}
            </span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Brought forward into selected window</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Debits</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-600 mt-2">{formatINR(ledgerData.totalDebit)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Invoices billed / vendor payments</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Credits</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-bold text-purple-700 mt-2">{formatINR(ledgerData.totalCredit)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Customer payments / vendor bills</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Period Closing Balance</span>
            <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p
            className={`text-lg font-bold mt-2 ${
              ledgerData.closingBalance >= 0 ? 'text-emerald-700' : 'text-purple-700'
            }`}
          >
            {formatINR(Math.abs(ledgerData.closingBalance))}{' '}
            <span className="text-xs font-semibold text-slate-600">{ledgerData.balanceType}</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {ledgerData.balanceType === 'Dr' ? 'Net Asset (Receivable)' : 'Net Liability (Payable)'}
          </p>
        </div>
      </div>

      {/* Ledger Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Filters Toolbar */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference # or narration..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#168A45]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
              >
                {transactionTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{filteredEntries.length}</span> ledger vouchers
          </div>
        </div>

        {/* Ledger Entries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Reference #</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Narration / Particulars</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
                <th className="py-3 px-4 text-right">Running Balance (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    No ledger transactions found for this party and date filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const isOpening = entry.transactionType === 'Opening Balance';
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isOpening ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">{entry.date}</td>
                      <td className="py-3 px-4 font-mono">
                        {onViewTransaction ? (
                          <button
                            onClick={() => onViewTransaction(entry.referenceNumber)}
                            className="text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>{entry.referenceNumber}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        ) : (
                          <span className="text-slate-800 font-semibold">{entry.referenceNumber}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            entry.transactionType.includes('Invoice')
                              ? 'bg-blue-100 text-blue-800'
                              : entry.transactionType.includes('Receipt')
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.transactionType.includes('Payment')
                              ? 'bg-purple-100 text-purple-800'
                              : entry.transactionType.includes('Credit Note') ||
                                entry.transactionType.includes('Debit Note')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {entry.transactionType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={entry.narration}>
                        {entry.narration || '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700 whitespace-nowrap">
                        {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-purple-700 whitespace-nowrap">
                        {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(Math.abs(entry.balance))}{' '}
                        <span
                          className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                            entry.balance >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {entry.balance >= 0 ? 'Dr' : 'Cr'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                  <td colSpan={4} className="py-3 px-4 text-right">
                    Total Movement:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-700">
                    {formatINR(ledgerData.totalDebit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-purple-700">
                    {formatINR(ledgerData.totalCredit)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    {formatINR(Math.abs(ledgerData.closingBalance))} {ledgerData.balanceType}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
