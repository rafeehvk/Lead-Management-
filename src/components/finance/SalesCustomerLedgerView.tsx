import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  Plus,
  Layers,
  X,
  AlertTriangle,
} from 'lucide-react';

import {
  PartyMaster,
  SalesInvoiceRecord,
  ReceiptTransactionRecord,
  PartyLedgerEntry,
} from '../../types/finance';

import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface SalesCustomerLedgerViewProps {
  currentUserName?: string;
  userRole?: string;
  initialCustomerId?: string;
}

export const SalesCustomerLedgerView: React.FC<SalesCustomerLedgerViewProps> = ({
  currentUserName = 'Sales & Finance Manager',
  userRole = 'Admin',
  initialCustomerId,
}) => {
  const [customers, setCustomers] = useState<PartyMaster[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoiceRecord[]>([]);
  const [receipts, setReceipts] = useState<ReceiptTransactionRecord[]>([]);

  // Sub-tabs: 'customers' | 'invoices' | 'receipts' | 'ledger'
  const [activeTab, setActiveTab] = useState<'customers' | 'invoices' | 'receipts' | 'ledger'>(
    initialCustomerId ? 'ledger' : 'customers'
  );

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [customerLedger, setCustomerLedger] = useState<PartyLedgerEntry[]>([]);

  // Modals
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<SalesInvoiceRecord | null>(null);

  // New Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    itemName: 'Enterprise ERP License & Implementation Services',
    hsnCode: '998313',
    quantity: '1',
    unitRate: '150000',
    gstRate: '18',
    notes: 'Standard 30 days payment terms',
  });

  // Receipt Form
  const [receiptForm, setReceiptForm] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMode: 'NEFT' as 'Cash' | 'Cheque' | 'UPI' | 'NEFT' | 'RTGS' | 'Bank Transfer',
    depositAccountId: 'bank-1',
    referenceNumber: '',
    notes: '',
  });

  const loadData = () => {
    const custs = erpFinanceStorage.getParties('Customer');
    setCustomers(custs);
    setInvoices(erpFinanceStorage.getSalesInvoices());
    setReceipts(erpFinanceStorage.getReceipts());

    const activeId = selectedCustomerId || (custs.length > 0 ? custs[0].id : '');
    if (activeId) {
      setSelectedCustomerId(activeId);
      setCustomerLedger(erpFinanceStorage.getPartyLedger(activeId));
    }
  };

  useEffect(() => {
    loadData();
    const handleDataChange = () => loadData();
    window.addEventListener('mysar_finance_data_changed', handleDataChange);
    return () => window.removeEventListener('mysar_finance_data_changed', handleDataChange);
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      setCustomerLedger(erpFinanceStorage.getPartyLedger(selectedCustomerId));
    }
  }, [selectedCustomerId]);

  // Overall Receivables Summary
  const receivablesSummary = useMemo(() => {
    const totalSales = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalCollected = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalOutstanding = invoices.reduce((sum, i) => sum + i.balanceAmount, 0);
    const overdueCount = invoices.filter((i) => i.status === 'Overdue').length;

    return { totalSales, totalCollected, totalOutstanding, overdueCount };
  }, [invoices, receipts]);

  // Selected customer outstanding
  const selectedCustomerRecord = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  const projectedInvoiceTotal = useMemo(() => {
    const qty = parseFloat(invoiceForm.quantity) || 1;
    const rate = parseFloat(invoiceForm.unitRate) || 0;
    const gst = parseFloat(invoiceForm.gstRate) || 0;
    return qty * rate * (1 + gst / 100);
  }, [invoiceForm.quantity, invoiceForm.unitRate, invoiceForm.gstRate]);

  const invoiceCreditCheck = useMemo(() => {
    if (!invoiceForm.customerId || projectedInvoiceTotal <= 0) return null;
    return erpFinanceStorage.checkCreditLimit(invoiceForm.customerId, projectedInvoiceTotal);
  }, [invoiceForm.customerId, projectedInvoiceTotal]);

  // Handle New Invoice Submit
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(invoiceForm.quantity) || 1;
    const rate = parseFloat(invoiceForm.unitRate) || 0;
    const taxable = qty * rate;
    const gstPct = parseFloat(invoiceForm.gstRate) || 18;
    const taxAmt = (taxable * gstPct) / 100;
    const totalAmt = taxable + taxAmt;

    const cust = customers.find((c) => c.id === invoiceForm.customerId);
    if (!cust) {
      alert('Please select a valid customer');
      return;
    }

    const nextIdNum = invoices.length + 1;
    const invoiceNumber = `INV-2026-${String(nextIdNum).padStart(4, '0')}`;

    const newInvoice: SalesInvoiceRecord = {
      id: `sinv-${Date.now()}`,
      invoiceNumber,
      date: invoiceForm.invoiceDate,
      customerId: cust.id,
      customerName: cust.name,
      costCenter: 'CC-HQ',
      items: [
        {
          itemId: 'ITM-SERV-01',
          itemCode: 'ERP-LIC',
          itemName: invoiceForm.itemName,
          hsnCode: invoiceForm.hsnCode,
          quantity: qty,
          unit: 'NOS',
          rate: rate,
          discount: 0,
          taxPercent: gstPct,
          cgst: taxAmt / 2,
          sgst: taxAmt / 2,
          igst: 0,
          total: totalAmt,
        },
      ],
      subtotal: taxable,
      discountTotal: 0,
      cgstTotal: taxAmt / 2,
      sgstTotal: taxAmt / 2,
      igstTotal: 0,
      roundOff: 0,
      grandTotal: totalAmt,
      paidAmount: 0,
      balanceAmount: totalAmt,
      dueDate: invoiceForm.dueDate,
      paymentTerms: 'Net 30 Days',
      status: 'Pending',
      approvalStatus: 'Approved',
    };

    try {
      erpFinanceStorage.postSalesInvoice(newInvoice);
      setIsNewInvoiceOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Credit limit breach or invoice posting error');
    }
  };

  // Handle Receipt Submit
  const handleReceiptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForReceipt) return;

    const amt = parseFloat(receiptForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid receipt amount');
      return;
    }

    erpFinanceStorage.postReceipt({
      partyId: selectedInvoiceForReceipt.customerId,
      partyName: selectedInvoiceForReceipt.customerName,
      amount: amt,
      paymentMethod: receiptForm.paymentMode,
      accountId: receiptForm.depositAccountId,
      accountName: receiptForm.depositAccountId === 'cash-1' ? 'Main Cash Chest' : 'Federal Bank - Current A/c',
      referenceNumber: receiptForm.referenceNumber || `REC-${Date.now().toString().slice(-6)}`,
      allocations: [
        {
          invoiceId: selectedInvoiceForReceipt.id,
          invoiceNumber: selectedInvoiceForReceipt.invoiceNumber,
          amount: amt,
        },
      ],
      remarks: receiptForm.notes || 'Customer receipt against invoice',
    });

    setIsNewReceiptOpen(false);
    setSelectedInvoiceForReceipt(null);
    setReceiptForm({
      receiptDate: new Date().toISOString().split('T')[0],
      amount: '',
      paymentMode: 'NEFT',
      depositAccountId: 'bank-1',
      referenceNumber: '',
      notes: '',
    });
    loadData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="p-2 bg-emerald-50 rounded-xl text-[#0B5D2A] border border-[#D9E5DD]">
                <TrendingUp className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Sales & Accounts Receivable Subledger
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7EF] text-[#0B5D2A] border border-[#D9E5DD]">
                GST Compliant
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-2xl">
              Track customer invoicing, tax invoice generation, payment collections, credit terms, and live Accounts
              Receivable subledger balances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (customers.length > 0) {
                  setInvoiceForm((prev) => ({ ...prev, customerId: customers[0].id }));
                }
                setIsNewInvoiceOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Sales Invoice</span>
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-gray-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Sales Invoiced</div>
            <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
              {formatINR(receivablesSummary.totalSales)}
            </div>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Total Collections</div>
            <div className="text-base font-bold font-mono text-[#0B5D2A] mt-0.5">
              {formatINR(receivablesSummary.totalCollected)}
            </div>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Outstanding AR</div>
            <div className="text-base font-bold font-mono text-amber-900 mt-0.5">
              {formatINR(receivablesSummary.totalOutstanding)}
            </div>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Overdue Bills</div>
            <div className="text-base font-bold font-mono text-rose-700 mt-0.5">
              {receivablesSummary.overdueCount} Invoices
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customer Directory</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-100 rounded-full font-bold">
              {customers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Sales Invoices</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-100 rounded-full font-bold">
              {invoices.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('receipts')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'receipts'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Customer Receipts</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-100 rounded-full font-bold">
              {receipts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 font-semibold'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Customer Statement & Subledger</span>
          </button>
        </div>
      </div>

      {/* 1. CUSTOMERS DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Customer Code & Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">GSTIN & PAN</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4 text-right">Credit Limit</th>
                  <th className="py-3 px-4 text-right">Receivable Balance</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{cust.name}</div>
                      <div className="font-mono text-[11px] text-blue-700 font-semibold">{cust.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{cust.contactPerson}</div>
                      <div className="text-[11px] text-slate-500">{cust.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div>{cust.gstin || 'Unregistered'}</div>
                      <div className="text-slate-400">{cust.pan}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {cust.paymentTermsDays ? `Net ${cust.paymentTermsDays} Days` : 'Immediate'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700">
                      {formatINR(cust.creditLimit || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-900">
                      {formatINR(cust.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(cust.id);
                          setActiveTab('ledger');
                        }}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs cursor-pointer"
                      >
                        View Ledger
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. SALES INVOICES */}
      {activeTab === 'invoices' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice No & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">GST</th>
                  <th className="py-3 px-4 text-right">Total Invoice</th>
                  <th className="py-3 px-4 text-right">Pending Balance</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-blue-800">{inv.invoiceNumber}</div>
                      <div className="text-[11px] text-slate-500">{inv.date}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{inv.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{inv.dueDate}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatINR(inv.subtotal)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatINR(inv.cgstTotal + inv.sgstTotal + inv.igstTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {formatINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-800">
                      {formatINR(inv.balanceAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-800'
                            : inv.status === 'Overdue'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inv.balanceAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInvoiceForReceipt(inv);
                            setReceiptForm((prev) => ({
                              ...prev,
                              amount: inv.balanceAmount.toString(),
                            }));
                            setIsNewReceiptOpen(true);
                          }}
                          className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Receive Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CUSTOMER RECEIPTS */}
      {activeTab === 'receipts' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt No & Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Mode & UTR Ref</th>
                  <th className="py-3 px-4">Allocated Invoice</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-center">GL Entry Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No receipt vouchers recorded yet.
                    </td>
                  </tr>
                ) : (
                  receipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{rec.receiptNumber}</div>
                        <div className="text-[11px] text-slate-500">{rec.date}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{rec.partyName}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{rec.paymentMethod}</div>
                        <div className="text-[11px] font-mono text-slate-500">{rec.referenceNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        {rec.allocations.map((a, i) => (
                          <div key={i} className="font-mono text-[11px] text-blue-700 font-semibold">
                            {a.invoiceNumber} ({formatINR(a.amount)})
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0B5D2A] text-sm">
                        {formatINR(rec.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold">
                          ✓ Sync Posted
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

      {/* 4. STATEMENT OF ACCOUNT (SUBLEDGER) */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <label className="text-xs font-semibold text-slate-600">Select Customer:</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-slate-800 cursor-pointer"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <div className="font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                Current Outstanding AR:{' '}
                <span className="font-mono">{formatINR(selectedCustomerRecord?.currentBalance || 0)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Document Type</th>
                    <th className="py-3 px-4">Reference No</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Debit (₹ Invoiced)</th>
                    <th className="py-3 px-4 text-right">Credit (₹ Received)</th>
                    <th className="py-3 px-4 text-right">Running AR Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customerLedger.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No transactions recorded for this customer yet.
                      </td>
                    </tr>
                  ) : (
                    customerLedger.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600">{entry.date}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              entry.documentType.includes('Invoice')
                                ? 'bg-blue-50 text-blue-800'
                                : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {entry.documentType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{entry.documentNumber}</td>
                        <td className="py-3 px-4 text-slate-600">{entry.narration}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                          {entry.debit > 0 ? formatINR(entry.debit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-[#0B5D2A]">
                          {entry.credit > 0 ? formatINR(entry.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatINR(entry.runningBalance)}
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

      {/* CREATE INVOICE MODAL */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-blue-50 rounded-lg text-blue-700">
                  <Plus className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Generate GST Tax Invoice</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewInvoiceOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Customer *</label>
                <select
                  required
                  value={invoiceForm.customerId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - {c.gstin || 'Unregistered'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.invoiceDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Item / Service Description *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.itemName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, itemName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">HSN / SAC</label>
                  <input
                    type="text"
                    value={invoiceForm.hsnCode}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, hsnCode: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={invoiceForm.quantity}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, quantity: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">GST Rate (%)</label>
                  <select
                    value={invoiceForm.gstRate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, gstRate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Unit Rate (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={invoiceForm.unitRate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, unitRate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-gray-100 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono">
                    {formatINR((parseFloat(invoiceForm.quantity) || 1) * (parseFloat(invoiceForm.unitRate) || 0))}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST ({invoiceForm.gstRate}%):</span>
                  <span className="font-mono">
                    {formatINR(
                      ((parseFloat(invoiceForm.quantity) || 1) *
                        (parseFloat(invoiceForm.unitRate) || 0) *
                        parseFloat(invoiceForm.gstRate)) /
                        100
                    )}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t">
                  <span>Total Payable:</span>
                  <span className="font-mono text-sm text-blue-700">
                    {formatINR(
                      (parseFloat(invoiceForm.quantity) || 1) *
                        (parseFloat(invoiceForm.unitRate) || 0) *
                        (1 + parseFloat(invoiceForm.gstRate) / 100)
                    )}
                  </span>
                </div>
              </div>

              {/* Credit Limit Verification Banner */}
              {invoiceCreditCheck && invoiceCreditCheck.action === 'Block' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Credit Limit Block Enforced</span>
                    <span>{invoiceCreditCheck.message}</span>
                  </div>
                </div>
              )}

              {invoiceCreditCheck && invoiceCreditCheck.action === 'Approval' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Manager Override / Approval Required</span>
                    <span>{invoiceCreditCheck.message}</span>
                  </div>
                </div>
              )}

              {invoiceCreditCheck && invoiceCreditCheck.action === 'Warning' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800 flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Credit Limit Advisory Warning</span>
                    <span>{invoiceCreditCheck.message}</span>
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={Boolean(invoiceCreditCheck && invoiceCreditCheck.action === 'Block')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shadow-2xs transition-colors ${
                    invoiceCreditCheck && invoiceCreditCheck.action === 'Block'
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : invoiceCreditCheck && invoiceCreditCheck.action === 'Approval'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-[#168A45] hover:bg-[#0B5D2A] text-white'
                  }`}
                >
                  {invoiceCreditCheck && invoiceCreditCheck.action === 'Approval'
                    ? 'Request Approval & Issue Invoice'
                    : 'Issue Invoice & Post to GL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD RECEIPT MODAL */}
      {isNewReceiptOpen && selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-emerald-50 rounded-lg text-[#0B5D2A]">
                  <DollarSign className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Record Customer Collection</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewReceiptOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs border border-gray-100 space-y-1">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Customer:</span>
                <span className="text-slate-900">{selectedInvoiceForReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice Ref:</span>
                <span className="font-mono text-blue-700">{selectedInvoiceForReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pending AR:</span>
                <span className="font-bold font-mono text-amber-800">
                  {formatINR(selectedInvoiceForReceipt.balanceAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleReceiptSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Receipt Date *</label>
                <input
                  type="date"
                  required
                  value={receiptForm.receiptDate}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receiptDate: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Collection Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedInvoiceForReceipt.balanceAmount}
                  step="0.01"
                  value={receiptForm.amount}
                  onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Mode *</label>
                  <select
                    value={receiptForm.paymentMode}
                    onChange={(e: any) => setReceiptForm({ ...receiptForm, paymentMode: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="Bank Transfer">IMPS / Netbanking</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deposit To *</label>
                  <select
                    value={receiptForm.depositAccountId}
                    onChange={(e) => setReceiptForm({ ...receiptForm, depositAccountId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                  >
                    <option value="bank-1">Federal Bank - Current A/c (1100)</option>
                    <option value="cash-1">Main Cash Chest (1000)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Bank Reference / UTR / Cheque No</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-HDFC-992102"
                  value={receiptForm.referenceNumber}
                  onChange={(e) => setReceiptForm({ ...receiptForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewReceiptOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#168A45] hover:bg-[#0B5D2A] text-white rounded-xl text-xs font-bold shadow-2xs"
                >
                  Confirm Receipt & Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
