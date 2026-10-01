import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ShoppingCart,
  Calendar,
  Search,
  Filter,
  Download,
  Printer,
  FileText,
  Mail,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PartyMaster } from '../../../types/finance';
import { PartyReportsModal } from '../parties/PartyReportsModal';

interface ReceivablesPayablesManagementViewProps {
  initialMode?: 'receivables' | 'payables';
  onViewTraceability?: (ref: string) => void;
  onOpenPartyLedger?: (partyId: string) => void;
}

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export const ReceivablesPayablesManagementView: React.FC<ReceivablesPayablesManagementViewProps> = ({
  initialMode = 'receivables',
  onViewTraceability,
  onOpenPartyLedger,
}) => {
  const [activeTab, setActiveTab] = useState<'receivables' | 'payables'>(initialMode);
  const [searchQuery, setSearchQuery] = useState('');
  const [agingFilter, setAgingFilter] = useState<'all' | 'current' | '1-30' | '31-60' | '61-90' | '90+'>('all');
  const [selectedPartyForReport, setSelectedPartyForReport] = useState<PartyMaster | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  // Helper to compute aging days
  const getDaysDiff = (dueDate: string): number => {
    const d1 = new Date(today);
    const d2 = new Date(dueDate);
    const diffTime = d1.getTime() - d2.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // Receivables Data
  const receivablesData = useMemo(() => {
    const invoices = erpFinanceStorage.getSalesInvoices().filter((i) => i.status !== 'Paid');
    const items = invoices.map((inv) => {
      const daysOverdue = inv.dueDate ? getDaysDiff(inv.dueDate) : 0;
      let bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+' = 'current';
      if (daysOverdue > 90) bucket = '90+';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';

      return {
        id: inv.id,
        partyId: inv.customerId,
        partyName: inv.customerName,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.date,
        dueDate: inv.dueDate || inv.date,
        totalAmount: inv.grandTotal,
        paidAmount: inv.grandTotal - inv.balanceAmount,
        outstandingAmount: inv.balanceAmount,
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
      };
    });

    const total = items.reduce((s, i) => s + i.outstandingAmount, 0);
    const current = items.filter((i) => i.bucket === 'current').reduce((s, i) => s + i.outstandingAmount, 0);
    const b1_30 = items.filter((i) => i.bucket === '1-30').reduce((s, i) => s + i.outstandingAmount, 0);
    const b31_60 = items.filter((i) => i.bucket === '31-60').reduce((s, i) => s + i.outstandingAmount, 0);
    const b61_90 = items.filter((i) => i.bucket === '61-90').reduce((s, i) => s + i.outstandingAmount, 0);
    const b90plus = items.filter((i) => i.bucket === '90+').reduce((s, i) => s + i.outstandingAmount, 0);

    const dueToday = items.filter((i) => i.dueDate === today).reduce((s, i) => s + i.outstandingAmount, 0);
    const overdue = items.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.outstandingAmount, 0);

    return { items, total, current, b1_30, b31_60, b61_90, b90plus, dueToday, overdue };
  }, []);

  // Payables Data
  const payablesData = useMemo(() => {
    const invoices = erpFinanceStorage.getPurchaseInvoices().filter((i) => i.status !== 'Paid');
    const items = invoices.map((inv) => {
      const daysOverdue = inv.dueDate ? getDaysDiff(inv.dueDate) : 0;
      let bucket: 'current' | '1-30' | '31-60' | '61-90' | '90+' = 'current';
      if (daysOverdue > 90) bucket = '90+';
      else if (daysOverdue > 60) bucket = '61-90';
      else if (daysOverdue > 30) bucket = '31-60';
      else if (daysOverdue > 0) bucket = '1-30';

      return {
        id: inv.id,
        partyId: inv.vendorId,
        partyName: inv.vendorName,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.date,
        dueDate: inv.dueDate || inv.date,
        totalAmount: inv.grandTotal,
        paidAmount: inv.grandTotal - inv.balanceAmount,
        outstandingAmount: inv.balanceAmount,
        daysOverdue: Math.max(0, daysOverdue),
        bucket,
      };
    });

    const total = items.reduce((s, i) => s + i.outstandingAmount, 0);
    const current = items.filter((i) => i.bucket === 'current').reduce((s, i) => s + i.outstandingAmount, 0);
    const b1_30 = items.filter((i) => i.bucket === '1-30').reduce((s, i) => s + i.outstandingAmount, 0);
    const b31_60 = items.filter((i) => i.bucket === '31-60').reduce((s, i) => s + i.outstandingAmount, 0);
    const b61_90 = items.filter((i) => i.bucket === '61-90').reduce((s, i) => s + i.outstandingAmount, 0);
    const b90plus = items.filter((i) => i.bucket === '90+').reduce((s, i) => s + i.outstandingAmount, 0);

    const dueToday = items.filter((i) => i.dueDate === today).reduce((s, i) => s + i.outstandingAmount, 0);
    const overdue = items.filter((i) => i.daysOverdue > 0).reduce((s, i) => s + i.outstandingAmount, 0);

    return { items, total, current, b1_30, b31_60, b61_90, b90plus, dueToday, overdue };
  }, []);

  const currentDataset = activeTab === 'receivables' ? receivablesData : payablesData;

  // Filtered rows
  const filteredRows = useMemo(() => {
    return currentDataset.items.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchAging = agingFilter === 'all' || item.bucket === agingFilter;

      return matchSearch && matchAging;
    });
  }, [currentDataset.items, searchQuery, agingFilter]);

  const handleOpenPartySOA = (partyId?: string, partyName?: string) => {
    const party =
      erpFinanceStorage.getPartyById(partyId || '') ||
      erpFinanceStorage.getParties().find((p) => p.name.toLowerCase() === (partyName || '').toLowerCase());
    if (party) {
      setSelectedPartyForReport(party);
      setIsReportModalOpen(true);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      activeTab === 'receivables' ? 'Customer' : 'Vendor',
      'Invoice #',
      'Invoice Date',
      'Due Date',
      'Total Amount',
      'Paid',
      'Outstanding',
      'Days Overdue',
      'Aging Bracket',
    ];
    const rows = filteredRows.map((r) => [
      `"${r.partyName}"`,
      `"${r.invoiceNumber}"`,
      r.invoiceDate,
      r.dueDate,
      r.totalAmount.toFixed(2),
      r.paidAmount.toFixed(2),
      r.outstandingAmount.toFixed(2),
      r.daysOverdue,
      r.bucket,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${activeTab}_Aging_Schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Toggle Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              activeTab === 'receivables' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
            }`}
          >
            {activeTab === 'receivables' ? <TrendingUp className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {activeTab === 'receivables' ? 'Accounts Receivable Management' : 'Accounts Payable Management'}
            </h2>
            <p className="text-xs text-slate-500">
              Contracted due dates, aging bracket segregation, DSO tracking, and automated statement generation
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              setActiveTab('receivables');
              setAgingFilter('all');
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'receivables'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Receivables ({receivablesData.items.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('payables');
              setAgingFilter('all');
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'payables'
                ? 'bg-white text-purple-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Payables ({payablesData.items.length})</span>
          </button>
        </div>
      </div>

      {/* Summary Aging Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div
          onClick={() => setAgingFilter('all')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            agingFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${agingFilter === 'all' ? 'text-slate-300' : 'text-slate-400'}`}>
            Total Outstanding
          </span>
          <div className="text-base font-black font-mono mt-1">{formatINR(currentDataset.total)}</div>
          <span className={`text-[10px] block mt-0.5 ${agingFilter === 'all' ? 'text-slate-300' : 'text-slate-500'}`}>
            {currentDataset.items.length} total bills
          </span>
        </div>

        <div
          onClick={() => setAgingFilter('current')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            agingFilter === 'current'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50/50 border-emerald-200 text-emerald-900 hover:border-emerald-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${agingFilter === 'current' ? 'text-emerald-100' : 'text-emerald-600'}`}>
            Not Due Yet (Current)
          </span>
          <div className="text-base font-black font-mono mt-1">{formatINR(currentDataset.current)}</div>
          <span className={`text-[10px] block mt-0.5 ${agingFilter === 'current' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Within credit term
          </span>
        </div>

        <div
          onClick={() => setAgingFilter('1-30')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            agingFilter === '1-30'
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-amber-50/50 border-amber-200 text-amber-900 hover:border-amber-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${agingFilter === '1-30' ? 'text-amber-100' : 'text-amber-600'}`}>
            1–30 Days Overdue
          </span>
          <div className="text-base font-black font-mono mt-1">{formatINR(currentDataset.b1_30)}</div>
          <span className={`text-[10px] block mt-0.5 ${agingFilter === '1-30' ? 'text-amber-100' : 'text-amber-700'}`}>
            1st reminder stage
          </span>
        </div>

        <div
          onClick={() => setAgingFilter('31-60')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            agingFilter === '31-60'
              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
              : 'bg-orange-50/50 border-orange-200 text-orange-900 hover:border-orange-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${agingFilter === '31-60' ? 'text-orange-100' : 'text-orange-600'}`}>
            31–60 Days Overdue
          </span>
          <div className="text-base font-black font-mono mt-1">{formatINR(currentDataset.b31_60)}</div>
          <span className={`text-[10px] block mt-0.5 ${agingFilter === '31-60' ? 'text-orange-100' : 'text-orange-700'}`}>
            Escalation level 2
          </span>
        </div>

        <div
          onClick={() => setAgingFilter('61-90')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            agingFilter === '61-90'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-rose-50/50 border-rose-200 text-rose-900 hover:border-rose-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${agingFilter === '61-90' ? 'text-rose-100' : 'text-rose-600'}`}>
            61–90 Days Overdue
          </span>
          <div className="text-base font-black font-mono mt-1">{formatINR(currentDataset.b61_90)}</div>
          <span className={`text-[10px] block mt-0.5 ${agingFilter === '61-90' ? 'text-rose-100' : 'text-rose-700'}`}>
            Credit freeze warning
          </span>
        </div>

        <div
          onClick={() => setAgingFilter('90+')}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            agingFilter === '90+'
              ? 'bg-red-800 text-white border-red-800 shadow-xs'
              : 'bg-red-50/60 border-red-200 text-red-950 hover:border-red-300'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${agingFilter === '90+' ? 'text-red-200' : 'text-red-700'}`}>
            90+ Days (Critical)
          </span>
          <div className="text-base font-black font-mono mt-1">{formatINR(currentDataset.b90plus)}</div>
          <span className={`text-[10px] block mt-0.5 ${agingFilter === '90+' ? 'text-red-200' : 'text-red-700'}`}>
            Provisioning & recovery
          </span>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        {/* Table Search Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search party or invoice #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-1 focus:ring-[#168A45] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={agingFilter}
                onChange={(e: any) => setAgingFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium"
              >
                <option value="all">All Aging Brackets</option>
                <option value="current">Current (Not Due)</option>
                <option value="1-30">1–30 Days</option>
                <option value="31-60">31–60 Days</option>
                <option value="61-90">61–90 Days</option>
                <option value="90+">90+ Days</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Invoices Aging Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3 px-4">{activeTab === 'receivables' ? 'Customer' : 'Vendor'}</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Invoice Date</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Invoice Amount (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Outstanding (₹)</th>
                <th className="py-3 px-4 text-center">Days Overdue</th>
                <th className="py-3 px-4 text-center">Statement / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    No outstanding invoices found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{row.partyName}</div>
                      {onOpenPartyLedger && (
                        <button
                          onClick={() => onOpenPartyLedger(row.partyId || row.partyName)}
                          className="text-[10px] text-blue-600 hover:underline font-medium"
                        >
                          View Subledger
                        </button>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {onViewTraceability ? (
                        <button
                          onClick={() => onViewTraceability(row.invoiceNumber)}
                          className="text-blue-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>{row.invoiceNumber}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      ) : (
                        row.invoiceNumber
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{row.invoiceDate}</td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{row.dueDate}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {formatINR(row.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-500">
                      {formatINR(row.paidAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                      {formatINR(row.outstandingAmount)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {row.daysOverdue === 0 ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Current
                        </span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            row.daysOverdue > 60
                              ? 'bg-red-100 text-red-800'
                              : row.daysOverdue > 30
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          +{row.daysOverdue} days
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleOpenPartySOA(row.partyId, row.partyName)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        title="Generate Statement of Account (SOA)"
                      >
                        <FileText className="w-3 h-3 text-[#168A45]" />
                        <span>SOA / PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Party Reports Modal for Statement of Account */}
      {selectedPartyForReport && (
        <PartyReportsModal
          isOpen={isReportModalOpen}
          onClose={() => {
            setIsReportModalOpen(false);
            setSelectedPartyForReport(null);
          }}
          initialTab="statement"
          selectedParty={selectedPartyForReport}
        />
      )}
    </div>
  );
};
