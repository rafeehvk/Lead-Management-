import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Calendar,
  Building2,
  CreditCard,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import {
  PaymentTransactionRecord,
  ReceiptTransactionRecord,
  AdvanceAdjustmentRecord,
} from '../../../types/finance';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { AdvanceAdjustmentModal } from './AdvanceAdjustmentModal';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface AdvanceAdjustmentManagementViewProps {
  currentUserName?: string;
}

export const AdvanceAdjustmentManagementView: React.FC<AdvanceAdjustmentManagementViewProps> = ({
  currentUserName = 'Finance Officer',
}) => {
  const [payments, setPayments] = useState<PaymentTransactionRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptTransactionRecord[]>([]);
  const [adjustments, setAdjustments] = useState<AdvanceAdjustmentRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'open-advances' | 'history'>('open-advances');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Customer' | 'Vendor'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected advance to adjust
  const [selectedAdvanceForModal, setSelectedAdvanceForModal] = useState<{
    advance: PaymentTransactionRecord | ReceiptTransactionRecord;
    type: 'Customer' | 'Vendor';
  } | null>(null);

  const loadData = () => {
    setPayments(erpFinanceStorage.getPayments().filter((p) => p.isAdvance && p.status === 'Completed'));
    setReceipts(erpFinanceStorage.getReceipts().filter((r) => r.isAdvance));
    setAdjustments(erpFinanceStorage.getAdvanceAdjustments());
  };

  useEffect(() => {
    loadData();
    const handleChanged = () => loadData();
    window.addEventListener('erp_payments_changed', handleChanged);
    window.addEventListener('erp_receipts_changed', handleChanged);
    return () => {
      window.removeEventListener('erp_payments_changed', handleChanged);
      window.removeEventListener('erp_receipts_changed', handleChanged);
    };
  }, []);

  // Combine advances
  const combinedAdvances = useMemo(() => {
    const list: {
      id: string;
      advanceType: 'Customer' | 'Vendor';
      advanceNumber: string;
      date: string;
      partyId: string;
      partyName: string;
      amount: number;
      allocatedAmount: number;
      unallocatedAmount: number;
      status: 'Unadjusted' | 'Partially Adjusted' | 'Fully Adjusted';
      rawRecord: PaymentTransactionRecord | ReceiptTransactionRecord;
    }[] = [];

    // Customers (Receipts)
    receipts.forEach((r) => {
      const allocated = r.allocatedAmount || 0;
      const unallocated = r.unallocatedAmount !== undefined ? r.unallocatedAmount : Math.max(0, r.amount - allocated);
      let st: 'Unadjusted' | 'Partially Adjusted' | 'Fully Adjusted' = 'Unadjusted';
      if (unallocated === 0) st = 'Fully Adjusted';
      else if (allocated > 0) st = 'Partially Adjusted';

      list.push({
        id: r.id,
        advanceType: 'Customer',
        advanceNumber: r.receiptNumber,
        date: r.date,
        partyId: r.partyId,
        partyName: r.partyName,
        amount: r.amount,
        allocatedAmount: allocated,
        unallocatedAmount: unallocated,
        status: st,
        rawRecord: r,
      });
    });

    // Vendors (Payments)
    payments.forEach((p) => {
      const allocated = p.allocatedAmount || 0;
      const unallocated = p.unallocatedAmount !== undefined ? p.unallocatedAmount : Math.max(0, p.amount - allocated);
      let st: 'Unadjusted' | 'Partially Adjusted' | 'Fully Adjusted' = 'Unadjusted';
      if (unallocated === 0) st = 'Fully Adjusted';
      else if (allocated > 0) st = 'Partially Adjusted';

      list.push({
        id: p.id,
        advanceType: 'Vendor',
        advanceNumber: p.paymentNumber,
        date: p.date,
        partyId: p.partyId,
        partyName: p.partyName,
        amount: p.amount,
        allocatedAmount: allocated,
        unallocatedAmount: unallocated,
        status: st,
        rawRecord: p,
      });
    });

    return list;
  }, [payments, receipts]);

  // Filter advances
  const filteredAdvances = useMemo(() => {
    return combinedAdvances.filter((a) => {
      const matchType = typeFilter === 'All' || a.advanceType === typeFilter;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        a.advanceNumber.toLowerCase().includes(q) ||
        a.partyName.toLowerCase().includes(q);
      return matchType && matchQuery;
    });
  }, [combinedAdvances, typeFilter, searchQuery]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalCustomerAdv = receipts.reduce((s, r) => s + r.amount, 0);
    const unadjustedCust = receipts.reduce((s, r) => s + (r.unallocatedAmount || 0), 0);
    const totalVendorAdv = payments.reduce((s, p) => s + p.amount, 0);
    const unadjustedVend = payments.reduce((s, p) => s + (p.unallocatedAmount || 0), 0);

    return {
      totalCustomerAdv,
      unadjustedCust,
      totalVendorAdv,
      unadjustedVend,
      totalAdjustmentsLogged: adjustments.length,
    };
  }, [receipts, payments, adjustments]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-purple-50 rounded-xl text-purple-700 border border-purple-200">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Advance Payments & Receipts Adjustment Hub
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                Multi-Invoice Reconciliation
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 max-w-2xl">
              Track open customer retainers and vendor advance disbursements. Reconcile and adjust unallocated advances
              against newly raised invoices with automatic ledger adjustments.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/60">
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Customer Retainers</div>
            <div className="text-base font-bold font-mono text-blue-900 mt-0.5">
              {formatINR(summaryMetrics.unadjustedCust)}
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">
              Unadjusted of {formatINR(summaryMetrics.totalCustomerAdv)}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/60">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Vendor Advances</div>
            <div className="text-base font-bold font-mono text-emerald-900 mt-0.5">
              {formatINR(summaryMetrics.unadjustedVend)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5">
              Unadjusted of {formatINR(summaryMetrics.totalVendorAdv)}
            </div>
          </div>

          <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200/60">
            <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Total Active Float</div>
            <div className="text-base font-bold font-mono text-purple-900 mt-0.5">
              {formatINR(summaryMetrics.unadjustedCust + summaryMetrics.unadjustedVend)}
            </div>
            <div className="text-[10px] text-purple-700 mt-0.5">Open Unallocated Float</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Settlements Posted</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {summaryMetrics.totalAdjustmentsLogged}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Adjustment Journal Entries</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filters */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setActiveTab('open-advances')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'open-advances' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Open Advance Registers ({combinedAdvances.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'history' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              Adjustment History Logs ({adjustments.length})
            </button>
          </div>

          {activeTab === 'open-advances' && (
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {(['All', 'Customer', 'Vendor'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    typeFilter === t ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search advance # or party..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* Main Table Content */}
      {activeTab === 'open-advances' ? (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-gray-200">
                  <th className="py-3 px-4">Advance Ref / Date</th>
                  <th className="py-3 px-4">Party & Type</th>
                  <th className="py-3 px-4 text-right">Initial Advance</th>
                  <th className="py-3 px-4 text-right">Adjusted Amount</th>
                  <th className="py-3 px-4 text-right">Unadjusted Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {filteredAdvances.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Layers className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No advances found matching criteria
                    </td>
                  </tr>
                ) : (
                  filteredAdvances.map((adv) => {
                    const canAdjust = adv.unallocatedAmount > 0;
                    return (
                      <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{adv.advanceNumber}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{adv.date}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{adv.partyName}</div>
                          <span
                            className={`inline-block px-1.5 py-0.5 text-[10px] font-bold rounded mt-0.5 ${
                              adv.advanceType === 'Customer'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {adv.advanceType} Advance
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(adv.amount)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {formatINR(adv.allocatedAmount)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                          {formatINR(adv.unallocatedAmount)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              adv.status === 'Fully Adjusted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : adv.status === 'Partially Adjusted'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            <span>{adv.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {canAdjust ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedAdvanceForModal({
                                  advance: adv.rawRecord,
                                  type: adv.advanceType,
                                })
                              }
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>Adjust Against Invoices</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Fully settled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Adjustment History Logs Table */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-gray-200">
                  <th className="py-3 px-4">Adjustment # / Date</th>
                  <th className="py-3 px-4">Advance Ref</th>
                  <th className="py-3 px-4">Party & Type</th>
                  <th className="py-3 px-4 text-right">Adjusted Amount</th>
                  <th className="py-3 px-4">Settled Invoices</th>
                  <th className="py-3 px-4">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-slate-700">
                {adjustments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <RotateCcw className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      No advance adjustments recorded yet
                    </td>
                  </tr>
                ) : (
                  adjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{adj.adjustmentNumber}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{adj.date}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {adj.advanceNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{adj.partyName}</div>
                        <span className="text-[10px] text-slate-500">{adj.advanceType} Settlement</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(adj.amount)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {adj.allocations.map((a, i) => (
                            <div key={i} className="flex items-center space-x-2 text-[11px]">
                              <span className="font-mono font-semibold text-slate-800">{a.invoiceNumber}:</span>
                              <span className="font-mono text-emerald-700">{formatINR(a.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{adj.adjustedBy}</div>
                        {adj.remarks && <div className="text-[10px] text-slate-500 truncate max-w-xs">{adj.remarks}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {selectedAdvanceForModal && (
        <AdvanceAdjustmentModal
          isOpen={!!selectedAdvanceForModal}
          onClose={() => setSelectedAdvanceForModal(null)}
          onSuccess={() => {
            setSelectedAdvanceForModal(null);
            loadData();
          }}
          advance={selectedAdvanceForModal.advance}
          advanceType={selectedAdvanceForModal.type}
          currentUserName={currentUserName}
        />
      )}
    </div>
  );
};
