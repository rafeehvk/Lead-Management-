import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Receipt,
  Calendar,
  DollarSign,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronDown,
  ChevronRight,
  Landmark,
  CreditCard,
  Layers,
  X,
  Plus,
  ShieldCheck,
  Eye,
  RefreshCw,
  TrendingDown,
  Info,
} from 'lucide-react';

import {
  PartyMaster,
  PartyLedgerEntry,
  PurchaseInvoiceRecord,
  PaymentTransactionRecord,
  DebitNoteRecord,
  JournalEntry,
} from '../../types/finance';

import { erpFinanceStorage, COMPANY_CONFIG } from '../../services/finance/erpFinanceStorage';
import { accountingEngine } from '../../services/finance/accountingEngine';

// Format currency
const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface VendorSupplierLedgerViewProps {
  currentUserName?: string;
  userRole?: string;
  initialVendorId?: string;
  onSelectVendor?: (vendorId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const VendorSupplierLedgerView: React.FC<VendorSupplierLedgerViewProps> = ({
  currentUserName = 'Finance Administrator',
  userRole = 'Admin',
  initialVendorId,
  onSelectVendor,
  onNavigateTab,
}) => {
  // Data state
  const [vendors, setVendors] = useState<PartyMaster[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');
  const [invoices, setInvoices] = useState<PurchaseInvoiceRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionRecord[]>([]);
  const [debitNotes, setDebitNotes] = useState<DebitNoteRecord[]>([]);

  // Sub-view mode: 'ledger' (single vendor statement) | 'aging-matrix' (all suppliers outstanding) | 'settlements' (historical disbursements)
  const [viewMode, setViewMode] = useState<'ledger' | 'aging-matrix' | 'settlements'>('ledger');

  // Filters
  const [dateRange, setDateRange] = useState<'all' | 'fy26' | 'last30' | 'q1' | 'q2'>('fy26');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modals
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [isRecordBillOpen, setIsRecordBillOpen] = useState(false);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Settlement Form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    tdsSection: '194C',
    tdsRate: 2,
    paymentMethod: 'NEFT/RTGS' as PaymentTransactionRecord['paymentMethod'],
    accountId: 'bnk-01',
    accountName: 'Federal Bank - Current A/c (Primary)',
    referenceNumber: '',
    chequeNumber: '',
    date: new Date().toISOString().split('T')[0],
    selectedInvoiceIds: [] as string[],
    remarks: '',
  });

  // Bill Form state
  const [billForm, setBillForm] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    amount: '',
    taxPercent: 18,
    description: '',
    hsnCode: '84713010',
    poNumber: '',
  });

  // Load vendors and records
  const loadData = () => {
    const vList = erpFinanceStorage.getParties('Vendor');
    setVendors(vList);

    if (vList.length > 0) {
      if (initialVendorId && vList.some((v) => v.id === initialVendorId || v.code === initialVendorId)) {
        setSelectedVendorId(initialVendorId);
      } else if (!selectedVendorId || !vList.some((v) => v.id === selectedVendorId)) {
        setSelectedVendorId(vList[0].id);
      }
    }

    setInvoices(erpFinanceStorage.getPurchaseInvoices());
    setPayments(erpFinanceStorage.getPayments());
    setDebitNotes(erpFinanceStorage.getDebitNotes());
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, [initialVendorId]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Selected vendor entity
  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId || v.code === selectedVendorId) || vendors[0];
  }, [vendors, selectedVendorId]);

  // Selected vendor subledger calculation
  const ledgerData = useMemo(() => {
    if (!selectedVendor) {
      return { entries: [], totalDebit: 0, totalCredit: 0, closingBalance: 0 };
    }
    return erpFinanceStorage.getPartyLedger(selectedVendor.id);
  }, [selectedVendor, invoices, payments, debitNotes]);

  // Invoices specifically belonging to the selected vendor
  const vendorInvoices = useMemo(() => {
    if (!selectedVendor) return [];
    return invoices.filter(
      (inv) => inv.vendorId === selectedVendor.id || inv.vendorName === selectedVendor.name
    );
  }, [invoices, selectedVendor]);

  // Payments specifically belonging to the selected vendor
  const vendorPayments = useMemo(() => {
    if (!selectedVendor) return [];
    return payments.filter(
      (pay) => pay.partyId === selectedVendor.id || pay.partyName === selectedVendor.name
    );
  }, [payments, selectedVendor]);

  // Outstanding / Unpaid Invoices for this vendor
  const unpaidInvoices = useMemo(() => {
    return vendorInvoices.filter((inv) => inv.balanceAmount > 0 && inv.status !== 'Paid');
  }, [vendorInvoices]);

  // Calculate Aging Buckets for Selected Vendor
  const vendorAging = useMemo(() => {
    const today = new Date().getTime();
    let bucket0_30 = 0;
    let bucket31_60 = 0;
    let bucket61_90 = 0;
    let bucket90Plus = 0;

    unpaidInvoices.forEach((inv) => {
      const invDate = new Date(inv.date).getTime();
      const ageDays = Math.floor((today - invDate) / (1000 * 60 * 60 * 24));
      if (ageDays <= 30) bucket0_30 += inv.balanceAmount;
      else if (ageDays <= 60) bucket31_60 += inv.balanceAmount;
      else if (ageDays <= 90) bucket61_90 += inv.balanceAmount;
      else bucket90Plus += inv.balanceAmount;
    });

    const totalOutstanding = bucket0_30 + bucket31_60 + bucket61_90 + bucket90Plus;

    return {
      bucket0_30,
      bucket31_60,
      bucket61_90,
      bucket90Plus,
      totalOutstanding,
    };
  }, [unpaidInvoices]);

  // Cross-Supplier Aging Matrix (All Vendors)
  const allSuppliersAging = useMemo(() => {
    const today = new Date().getTime();
    return vendors.map((vnd) => {
      const vndInvs = invoices.filter((i) => (i.vendorId === vnd.id || i.vendorName === vnd.name) && i.balanceAmount > 0);
      let b0_30 = 0;
      let b31_60 = 0;
      let b61_90 = 0;
      let b90Plus = 0;

      vndInvs.forEach((inv) => {
        const invDate = new Date(inv.date).getTime();
        const ageDays = Math.floor((today - invDate) / (1000 * 60 * 60 * 24));
        if (ageDays <= 30) b0_30 += inv.balanceAmount;
        else if (ageDays <= 60) b31_60 += inv.balanceAmount;
        else if (ageDays <= 90) b61_90 += inv.balanceAmount;
        else b90Plus += inv.balanceAmount;
      });

      const total = b0_30 + b31_60 + b61_90 + b90Plus;
      return {
        vendor: vnd,
        b0_30,
        b31_60,
        b61_90,
        b90Plus,
        total,
        openBillsCount: vndInvs.length,
      };
    });
  }, [vendors, invoices]);

  // Filtered Ledger Entries
  const filteredLedgerEntries = useMemo(() => {
    return ledgerData.entries.filter((entry) => {
      // Type filter
      if (typeFilter !== 'All') {
        if (typeFilter === 'Invoices' && entry.transactionType !== 'Purchase Invoice') return false;
        if (typeFilter === 'Payments' && !entry.transactionType.includes('Payment')) return false;
        if (typeFilter === 'Debit Notes' && entry.transactionType !== 'Debit Note') return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesRef = entry.referenceNumber.toLowerCase().includes(q);
        const matchesNarr = (entry.narration || '').toLowerCase().includes(q);
        const matchesType = entry.transactionType.toLowerCase().includes(q);
        if (!matchesRef && !matchesNarr && !matchesType) return false;
      }

      // Date Range Filter
      if (dateRange === 'last30') {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
        if (entry.date < thirtyDaysAgo) return false;
      } else if (dateRange === 'q1') {
        // Apr - Jun
        if (entry.date < '2026-04-01' || entry.date > '2026-06-30') return false;
      } else if (dateRange === 'q2') {
        // Jul - Sep
        if (entry.date < '2026-07-01' || entry.date > '2026-09-30') return false;
      }

      return true;
    });
  }, [ledgerData.entries, typeFilter, searchQuery, dateRange]);

  // Handle Record Bill Submission
  const handleRecordBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    const amt = parseFloat(billForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid bill amount');
      return;
    }

    const gstCalc = erpFinanceStorage.calculateGST(amt, selectedVendor.stateCode, billForm.taxPercent);

    erpFinanceStorage.postPurchaseInvoice({
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.name,
      invoiceNumber: billForm.invoiceNumber || `BILL-${Date.now().toString().slice(-6)}`,
      date: billForm.date,
      dueDate: billForm.dueDate,
      poNumber: billForm.poNumber,
      items: [
        {
          itemId: 'ITM-001',
          itemCode: 'PROC-GEN',
          itemName: billForm.description || 'Procured Goods / Services',
          hsnCode: billForm.hsnCode,
          quantity: 1,
          unit: 'NOS',
          rate: amt,
          discount: 0,
          taxPercent: billForm.taxPercent,
          cgst: gstCalc.cgst,
          sgst: gstCalc.sgst,
          igst: gstCalc.igst,
          total: amt + gstCalc.taxTotal,
        },
      ],
    });

    setIsRecordBillOpen(false);
    setBillForm({
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      amount: '',
      taxPercent: 18,
      description: '',
      hsnCode: '84713010',
      poNumber: '',
    });
    loadData();
    showToast(`Bill successfully recorded for ${selectedVendor.name}. Journal entry posted.`);
  };

  // Handle Record Payment Submission with TDS & Allocation
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor) return;

    const amt = parseFloat(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    // TDS Calculation
    const tdsAmt = Math.round(((amt * paymentForm.tdsRate) / 100) * 100) / 100;
    const netPayable = amt - tdsAmt;

    // Build invoice allocations
    let remainingToAllocate = amt;
    const allocations: { invoiceId: string; invoiceNumber: string; amount: number }[] = [];

    // If user explicitly checked invoices, allocate to those; otherwise allocate FIFO to oldest unpaid
    const targetInvoices =
      paymentForm.selectedInvoiceIds.length > 0
        ? unpaidInvoices.filter((i) => paymentForm.selectedInvoiceIds.includes(i.id))
        : unpaidInvoices;

    for (const inv of targetInvoices) {
      if (remainingToAllocate <= 0) break;
      const allocAmt = Math.min(inv.balanceAmount, remainingToAllocate);
      allocations.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        amount: allocAmt,
      });
      remainingToAllocate -= allocAmt;
    }

    erpFinanceStorage.postPayment({
      partyId: selectedVendor.id,
      partyName: selectedVendor.name,
      amount: amt,
      tdsSection: paymentForm.tdsSection,
      tdsRate: paymentForm.tdsRate,
      tdsAmount: tdsAmt,
      paymentMethod: paymentForm.paymentMethod,
      accountId: paymentForm.accountId,
      accountName: paymentForm.accountName,
      referenceNumber: paymentForm.referenceNumber || `UTR-${Date.now().toString().slice(-8)}`,
      chequeNumber: paymentForm.chequeNumber,
      date: paymentForm.date,
      allocations,
      isAdvance: allocations.length === 0,
      remarks: paymentForm.remarks,
    });

    setIsRecordPaymentOpen(false);
    setPaymentForm({
      amount: '',
      tdsSection: '194C',
      tdsRate: 2,
      paymentMethod: 'NEFT/RTGS',
      accountId: 'bnk-01',
      accountName: 'Federal Bank - Current A/c (Primary)',
      referenceNumber: '',
      chequeNumber: '',
      date: new Date().toISOString().split('T')[0],
      selectedInvoiceIds: [],
      remarks: '',
    });
    loadData();
    showToast(
      `Disbursement of ₹${netPayable} (TDS: ₹${tdsAmt}) recorded to ${selectedVendor.name}. Journal entry posted!`
    );
  };

  // Export Statement of Account (CSV)
  const exportStatementCSV = () => {
    if (!selectedVendor) return;
    const headers = [
      'Date',
      'Transaction Type',
      'Reference Number',
      'Narration',
      'Debit (Disbursement) [INR]',
      'Credit (Billed Invoice) [INR]',
      'Running Balance [INR]',
    ];

    const rows = filteredLedgerEntries.map((e) => [
      e.date,
      e.transactionType,
      e.referenceNumber,
      `"${(e.narration || '').replace(/"/g, '""')}"`,
      e.debit,
      e.credit,
      e.balance,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Vendor_Ledger_${selectedVendor.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold border ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toastMessage.type === 'info'
              ? 'bg-blue-50 border-blue-200 text-blue-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage.text}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="p-0.5 text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Header Banner & View Switcher */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-purple-50 rounded-xl text-purple-700 border border-purple-200/80">
                <Receipt className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Vendor & Supplier Subledger (AP)
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                Real-Time GL Integrated
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl">
              Chronological statement of account tracking historical AP settlements, invoice accruals, TDS withholdings,
              and outstanding liabilities per supplier.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-settle-payable"
              onClick={() => setIsRecordPaymentOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
              <span>Settle Payable / Disburse</span>
            </button>

            <button
              type="button"
              id="btn-record-bill-ledger"
              onClick={() => setIsRecordBillOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-600" />
              <span>Record Bill / Invoice</span>
            </button>

            <button
              type="button"
              onClick={exportStatementCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Download Statement of Account CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export SOA</span>
            </button>
          </div>
        </div>

        {/* View Mode Switcher Pills */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('ledger')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Supplier Statement of Account</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('settlements')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'settlements'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Historical AP Settlements</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                {vendorPayments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('aging-matrix')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'aging-matrix'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Cross-Supplier Aging Matrix</span>
            </button>
          </div>

          {/* Supplier Dropdown Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Active Supplier:</span>
            <div className="relative">
              <select
                id="select-vendor-subledger"
                value={selectedVendorId}
                onChange={(e) => {
                  setSelectedVendorId(e.target.value);
                  onSelectVendor?.(e.target.value);
                }}
                className="pl-3 pr-8 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Supplier Info & AP KPI Ribbon (Only when single supplier view) */}
      {viewMode !== 'aging-matrix' && selectedVendor && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Vendor Profile Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {selectedVendor.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {selectedVendor.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{selectedVendor.name}</h3>
                <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                  <div>GSTIN: <span className="font-mono text-slate-700">{selectedVendor.gstin || 'Unregistered'}</span></div>
                  <div>PAN: <span className="font-mono text-slate-700">{selectedVendor.pan || 'N/A'}</span></div>
                  <div>Terms: <span className="font-semibold text-slate-700">{selectedVendor.paymentTerms}</span></div>
                  <div>Place of Supply: <span className="text-slate-700">{selectedVendor.placeOfSupply}</span></div>
                </div>
              </div>

              {selectedVendor.bankDetails && (
                <div className="mt-3 pt-2.5 border-t border-slate-200 text-[10px] text-slate-500 flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-slate-400" />
                  <span>{selectedVendor.bankDetails.bankName} - A/C: ...{selectedVendor.bankDetails.accountNumber.slice(-4)}</span>
                </div>
              )}
            </div>

            {/* Net Outstanding Balance Card */}
            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-900">Net Outstanding Payable</span>
                <span className="p-1.5 rounded-lg bg-purple-100 text-purple-800">
                  <Receipt className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-purple-950">
                  {formatINR(vendorAging.totalOutstanding)}
                </span>
                <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-purple-200 text-purple-900">
                  Cr (Payable)
                </span>
              </div>
              <div className="mt-2 text-[11px] text-purple-800 flex items-center justify-between">
                <span>Unsettled Bills: {unpaidInvoices.length}</span>
                <span className="text-purple-600 underline cursor-pointer" onClick={() => setIsRecordPaymentOpen(true)}>
                  Clear dues →
                </span>
              </div>
            </div>

            {/* Historical Disbursements YTD Card */}
            <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0B5D2A]">Disbursed Settlements YTD</span>
                <span className="p-1.5 rounded-lg bg-emerald-100 text-[#168A45]">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#0B5D2A]">
                  {formatINR(vendorPayments.reduce((s, p) => s + p.amount, 0))}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-[#0B5D2A] flex items-center justify-between">
                <span>Vouchers: {vendorPayments.length}</span>
                <span>TDS Withheld: {formatINR(vendorPayments.reduce((s, p) => s + (p.tdsAmount || 0), 0))}</span>
              </div>
            </div>

            {/* AP Aging Breakdown Strip */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                AP Aging Distribution
              </span>
              <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-1.5 bg-white rounded border border-gray-100">
                  <div className="text-slate-400 text-[10px]">0 - 30 Days</div>
                  <div className="font-bold text-slate-800">{formatINR(vendorAging.bucket0_30)}</div>
                </div>
                <div className="p-1.5 bg-white rounded border border-gray-100">
                  <div className="text-slate-400 text-[10px]">31 - 60 Days</div>
                  <div className="font-bold text-amber-700">{formatINR(vendorAging.bucket31_60)}</div>
                </div>
                <div className="p-1.5 bg-white rounded border border-gray-100">
                  <div className="text-slate-400 text-[10px]">61 - 90 Days</div>
                  <div className="font-bold text-orange-700">{formatINR(vendorAging.bucket61_90)}</div>
                </div>
                <div className="p-1.5 bg-white rounded border border-gray-100">
                  <div className="text-slate-400 text-[10px]">&gt; 90 Days (Overdue)</div>
                  <div className="font-bold text-rose-700">{formatINR(vendorAging.bucket90Plus)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT: SUBLEDGER OR AGING MATRIX OR SETTLEMENTS */}

      {/* VIEW MODE A: SINGLE SUPPLIER STATEMENT OF ACCOUNT */}
      {viewMode === 'ledger' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          {/* Filter and Search Bar */}
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="All">All Transactions</option>
                <option value="Invoices">Purchase Invoices Only</option>
                <option value="Payments">Payments & Disbursements Only</option>
                <option value="Debit Notes">Debit Notes Only</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none"
              >
                <option value="fy26">Full Financial Year 2026-27</option>
                <option value="last30">Last 30 Days</option>
                <option value="q1">Q1 (Apr - Jun 2026)</option>
                <option value="q2">Q2 (Jul - Sep 2026)</option>
                <option value="all">All Historical Records</option>
              </select>

              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search voucher, bill, UTR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-800">{filteredLedgerEntries.length}</span> ledger entries
            </div>
          </div>

          {/* Subledger Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Reference No.</th>
                  <th className="py-3 px-4">Narration / Allocation Details</th>
                  <th className="py-3 px-4 text-right">Debit (Payment/Settlement)</th>
                  <th className="py-3 px-4 text-right">Credit (Bill Accrual)</th>
                  <th className="py-3 px-4 text-right">Running Balance</th>
                  <th className="py-3 px-4 text-center">GL Entry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredLedgerEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No transaction records found for selected filters.</p>
                    </td>
                  </tr>
                ) : (
                  filteredLedgerEntries.map((entry) => {
                    const isCredit = entry.credit > 0;
                    const isDebit = entry.debit > 0;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono">
                          {entry.date}
                        </td>

                        {/* Transaction Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              entry.transactionType === 'Purchase Invoice'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : entry.transactionType.includes('Payment')
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : entry.transactionType === 'Debit Note'
                                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {entry.transactionType}
                          </span>
                        </td>

                        {/* Reference No */}
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                          {entry.referenceNumber}
                        </td>

                        {/* Narration */}
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                          {entry.narration || '-'}
                        </td>

                        {/* Debit (Payment) */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-700">
                          {isDebit ? formatINR(entry.debit) : '-'}
                        </td>

                        {/* Credit (Invoice Bill) */}
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-amber-800">
                          {isCredit ? formatINR(entry.credit) : '-'}
                        </td>

                        {/* Running Balance */}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatINR(Math.abs(entry.balance))}{' '}
                          <span
                            className={`text-[10px] font-bold px-1 py-0.2 rounded ${
                              entry.balance >= 0
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {entry.balance >= 0 ? 'Cr (Due)' : 'Dr (Adv)'}
                          </span>
                        </td>

                        {/* GL Traceability Link */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const entries = accountingEngine.getJournalEntries();
                              const je = entries.find(
                                (e) =>
                                  e.referenceNumber === entry.referenceNumber ||
                                  e.referenceId === entry.referenceNumber
                              );
                              if (je) {
                                setSelectedJournalEntry(je);
                              } else {
                                showToast(`Control account linked to A/c 2000 (Accounts Payable)`, 'info');
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Drill down to Journal Entry"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Table Footer Totals */}
              <tfoot className="bg-slate-50 font-bold text-xs border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="py-3.5 px-4 text-right text-slate-700">
                    Totals for filtered period:
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-700">
                    {formatINR(filteredLedgerEntries.reduce((s, e) => s + e.debit, 0))}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-amber-800">
                    {formatINR(filteredLedgerEntries.reduce((s, e) => s + e.credit, 0))}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-purple-900">
                    {formatINR(
                      filteredLedgerEntries.length > 0
                        ? Math.abs(filteredLedgerEntries[filteredLedgerEntries.length - 1].balance)
                        : 0
                    )}{' '}
                    Cr
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE B: HISTORICAL AP SETTLEMENTS LIST */}
      {viewMode === 'settlements' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Disbursement & Settlement History</h3>
              <p className="text-xs text-slate-500">
                Audit trail of all payments disbursed to {selectedVendor?.name}, including TDS deduction and invoice allocations.
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
              Total Settled:{' '}
              <span className="font-bold text-emerald-700">
                {formatINR(vendorPayments.reduce((s, p) => s + p.amount, 0))}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Voucher No & Date</th>
                  <th className="py-3 px-4">Payment Method & Account</th>
                  <th className="py-3 px-4">Reference / UTR No</th>
                  <th className="py-3 px-4 text-right">Gross Amount</th>
                  <th className="py-3 px-4 text-right">TDS Withheld</th>
                  <th className="py-3 px-4 text-right">Net Paid</th>
                  <th className="py-3 px-4">Allocated Invoices</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {vendorPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold text-slate-600">No disbursements recorded yet for this vendor.</p>
                      <button
                        type="button"
                        onClick={() => setIsRecordPaymentOpen(true)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                      >
                        Record first payment →
                      </button>
                    </td>
                  </tr>
                ) : (
                  vendorPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Voucher & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">{pay.paymentNumber}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{pay.date}</span>
                        </div>
                      </td>

                      {/* Method & Account */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{pay.paymentMethod}</div>
                        <div className="text-[11px] text-slate-500">{pay.accountName}</div>
                      </td>

                      {/* Reference No */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-700">
                        {pay.referenceNumber}
                      </td>

                      {/* Gross Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        {formatINR(pay.amount)}
                      </td>

                      {/* TDS */}
                      <td className="py-3.5 px-4 text-right font-mono text-purple-700">
                        {pay.tdsAmount && pay.tdsAmount > 0 ? (
                          <div>
                            <div>{formatINR(pay.tdsAmount)}</div>
                            <div className="text-[10px] text-purple-600">Sec {pay.tdsSection} ({pay.tdsRate}%)</div>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Net Paid */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {formatINR(pay.netPaid)}
                      </td>

                      {/* Allocated Invoices */}
                      <td className="py-3.5 px-4">
                        {pay.allocations && pay.allocations.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {pay.allocations.map((a, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[10px]"
                              >
                                {a.invoiceNumber}: {formatINR(a.amount)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unallocated Advance</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {pay.status}
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

      {/* VIEW MODE C: CROSS-SUPPLIER AGING MATRIX */}
      {viewMode === 'aging-matrix' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Accounts Payable Aging Matrix (All Suppliers)</h3>
              <p className="text-xs text-slate-500">
                Breakdown of outstanding dues by aging buckets (0-30, 31-60, 61-90, 90+ days past invoice date).
              </p>
            </div>

            <div className="text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
              Total AP Liabilities:{' '}
              <span className="font-bold text-purple-900">
                {formatINR(allSuppliersAging.reduce((s, a) => s + a.total, 0))}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier Name & Code</th>
                  <th className="py-3 px-4">Terms</th>
                  <th className="py-3 px-4 text-center">Open Bills</th>
                  <th className="py-3 px-4 text-right">Current (0-30d)</th>
                  <th className="py-3 px-4 text-right">31-60 Days</th>
                  <th className="py-3 px-4 text-right">61-90 Days</th>
                  <th className="py-3 px-4 text-right">&gt; 90 Days (Overdue)</th>
                  <th className="py-3 px-4 text-right">Total Payable</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {allSuppliersAging.map((row) => (
                  <tr key={row.vendor.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Supplier */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{row.vendor.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{row.vendor.code} • {row.vendor.city}</div>
                    </td>

                    {/* Terms */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      {row.vendor.paymentTerms}
                    </td>

                    {/* Open Bills */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {row.openBillsCount}
                      </span>
                    </td>

                    {/* 0-30 */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800">
                      {row.b0_30 > 0 ? formatINR(row.b0_30) : '-'}
                    </td>

                    {/* 31-60 */}
                    <td className="py-3.5 px-4 text-right font-mono text-amber-700">
                      {row.b31_60 > 0 ? formatINR(row.b31_60) : '-'}
                    </td>

                    {/* 61-90 */}
                    <td className="py-3.5 px-4 text-right font-mono text-orange-700">
                      {row.b61_90 > 0 ? formatINR(row.b61_90) : '-'}
                    </td>

                    {/* >90 */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                      {row.b90Plus > 0 ? formatINR(row.b90Plus) : '-'}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(row.total)}
                    </td>

                    {/* View Statement */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVendorId(row.vendor.id);
                          setViewMode('ledger');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        <span>View Ledger</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: RECORD BILL / PURCHASE INVOICE */}
      {isRecordBillOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-purple-50 rounded-lg text-purple-700">
                  <FileText className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Record Bill / Invoice</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordBillOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordBill} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="font-semibold text-slate-500">Supplier: </span>
                <span className="font-bold text-slate-800">{selectedVendor.name} ({selectedVendor.code})</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice / Bill Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-2026-99"
                    value={billForm.invoiceNumber}
                    onChange={(e) => setBillForm({ ...billForm, invoiceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">PO Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-2026-0001"
                    value={billForm.poNumber}
                    onChange={(e) => setBillForm({ ...billForm, poNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={billForm.date}
                    onChange={(e) => setBillForm({ ...billForm, date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item / Service Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Campus Fiber Optical Backbone Maintenance"
                  value={billForm.description}
                  onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Taxable Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="50000"
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GST Rate</label>
                  <select
                    value={billForm.taxPercent}
                    onChange={(e) => setBillForm({ ...billForm, taxPercent: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs cursor-pointer focus:outline-none"
                  >
                    <option value={18}>18% (Standard)</option>
                    <option value={12}>12% (IT Hardware)</option>
                    <option value={5}>5% (Essential)</option>
                    <option value={28}>28% (Luxury)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>
              </div>

              {/* Live GST preview */}
              {billForm.amount && parseFloat(billForm.amount) > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl text-xs border border-purple-100 flex items-center justify-between">
                  <span className="text-purple-900 font-semibold">Total Invoice Amount (with GST):</span>
                  <span className="font-mono font-bold text-purple-950">
                    {formatINR(
                      parseFloat(billForm.amount) + (parseFloat(billForm.amount) * billForm.taxPercent) / 100
                    )}
                  </span>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecordBillOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Post Bill & Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SETTLE PAYABLE / RECORD DISBURSEMENT */}
      {isRecordPaymentOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-[#168A45]">
                  <DollarSign className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Settle Payable / Disburse Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordPaymentOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600">Supplier: <strong className="text-slate-900">{selectedVendor.name}</strong></span>
                  <span className="font-bold text-purple-900">Due: {formatINR(vendorAging.totalOutstanding)}</span>
                </div>
              </div>

              {/* Payment Amount & TDS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gross Payment Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    placeholder="e.g. 150000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">TDS Withholding Section</label>
                  <select
                    value={`${paymentForm.tdsSection}_${paymentForm.tdsRate}`}
                    onChange={(e) => {
                      const [sec, rate] = e.target.value.split('_');
                      setPaymentForm({ ...paymentForm, tdsSection: sec, tdsRate: parseFloat(rate) });
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="194C_2">194C: Contractors (2% Co.)</option>
                    <option value="194C_1">194C: Contractors (1% Indiv.)</option>
                    <option value="194J_10">194J: Technical Services (10%)</option>
                    <option value="194I_10">194I: Rent (10%)</option>
                    <option value="NONE_0">No TDS Exemption</option>
                  </select>
                </div>
              </div>

              {/* Net Disbursed Live Preview */}
              {paymentForm.amount && parseFloat(paymentForm.amount) > 0 && (
                <div className="p-3 bg-emerald-50/70 rounded-xl text-xs border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-slate-600">TDS to Govt (2150): </span>
                    <span className="font-bold text-purple-700">
                      {formatINR((parseFloat(paymentForm.amount) * paymentForm.tdsRate) / 100)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#0B5D2A] font-semibold">Net Disbursed to Vendor: </span>
                    <span className="font-mono font-bold text-emerald-800">
                      {formatINR(
                        parseFloat(paymentForm.amount) -
                          (parseFloat(paymentForm.amount) * paymentForm.tdsRate) / 100
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Payment Mode & Bank Account */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="NEFT/RTGS">NEFT / RTGS Online</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                    <option value="Cheque">Bank Cheque</option>
                    <option value="Cash">Cash Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Disbursing Account</label>
                  <select
                    value={paymentForm.accountId}
                    onChange={(e) => {
                      const accId = e.target.value;
                      const accName =
                        accId === 'bnk-01'
                          ? 'Federal Bank - Current A/c (Primary)'
                          : accId === 'bnk-02'
                          ? 'HDFC Bank - Current A/c (Disbursement)'
                          : 'Cash on Hand Vault';
                      setPaymentForm({ ...paymentForm, accountId: accId, accountName: accName });
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="bnk-01">Federal Bank Current A/c (1100)</option>
                    <option value="bnk-02">HDFC Bank Operational A/c (1110)</option>
                    <option value="csh-01">Office Cash Vault (1000)</option>
                  </select>
                </div>
              </div>

              {/* Reference / UTR / Cheque */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Bank UTR / Reference No. *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FDRLN2612345678"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Cheque No. (if cheque)</label>
                  <input
                    type="text"
                    placeholder="e.g. 784512"
                    value={paymentForm.chequeNumber}
                    onChange={(e) => setPaymentForm({ ...paymentForm, chequeNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Unpaid Invoices Allocation Selector */}
              {unpaidInvoices.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Select Specific Invoices to Settle (Optional - FIFO default applied if none selected):
                  </label>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    {unpaidInvoices.map((inv) => (
                      <label key={inv.id} className="flex items-center justify-between p-1 hover:bg-white rounded cursor-pointer">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={paymentForm.selectedInvoiceIds.includes(inv.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPaymentForm({
                                  ...paymentForm,
                                  selectedInvoiceIds: [...paymentForm.selectedInvoiceIds, inv.id],
                                });
                              } else {
                                setPaymentForm({
                                  ...paymentForm,
                                  selectedInvoiceIds: paymentForm.selectedInvoiceIds.filter((id) => id !== inv.id),
                                });
                              }
                            }}
                            className="rounded text-emerald-600"
                          />
                          <span className="font-mono font-semibold text-slate-800">{inv.invoiceNumber}</span>
                          <span className="text-slate-500 text-[10px]">({inv.date})</span>
                        </div>
                        <span className="font-bold text-amber-800">{formatINR(inv.balanceAmount)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer"
                >
                  Disburse & Write Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DOUBLE-ENTRY JOURNAL ENTRY DRILLDOWN */}
      {selectedJournalEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    General Ledger Journal Entry: {selectedJournalEntry.entryNumber}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {selectedJournalEntry.date} • Reference: {selectedJournalEntry.referenceNumber} ({selectedJournalEntry.referenceType})
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJournalEntry(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl text-xs border border-slate-100 text-slate-700 italic">
                "{selectedJournalEntry.narration}"
              </div>

              {/* Lines Table */}
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
                    {selectedJournalEntry.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-medium text-slate-800">
                          <span className="font-mono text-purple-700 font-bold">{line.accountCode}</span> - {line.accountName}
                          {line.partyName && <span className="text-slate-500 text-[10px] ml-1">({line.partyName})</span>}
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
                        {formatINR(selectedJournalEntry.totalDebit)}
                      </td>
                      <td className="p-2.5 text-right font-mono text-amber-900">
                        {formatINR(selectedJournalEntry.totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedJournalEntry(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
