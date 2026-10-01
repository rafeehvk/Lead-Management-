import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Download,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Receipt,
  RotateCcw,
  IndianRupee,
  FileSpreadsheet,
  Printer,
  Maximize2,
} from 'lucide-react';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import {
  SalesQuotation,
  SalesOrder,
  SalesInvoiceRecord,
  SalesReturnRequest,
  SalesReturnRecord,
} from '../../types/finance';
import { DocumentPrintPdfModal } from '../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../finance/themes/ThemedDocumentRenderer';
import {
  convertSalesQuotationToDoc,
  convertSalesOrderToDoc,
  convertSalesInvoiceToDoc,
  convertSalesReturnRequestToDoc,
  convertSalesReturnToDoc,
} from '../../utils/documentConversionHelpers';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export type SalesReportType =
  | 'sales-quotation-report'
  | 'sales-order-report'
  | 'sales-invoice-report'
  | 'sales-return-request-report'
  | 'sales-return-report';

interface SalesReportsViewProps {
  reportType: SalesReportType;
  onNavigateTab?: (tab: string) => void;
}

export const SalesReportsView: React.FC<SalesReportsViewProps> = ({
  reportType,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter'>('all');

  const [printPdfModalOpen, setPrintPdfModalOpen] = useState(false);
  const [activePrintDocument, setActivePrintDocument] = useState<ThemedDocumentData | null>(null);
  const [openInFullScreen, setOpenInFullScreen] = useState(false);

  const openDocumentViewer = (docData: ThemedDocumentData, fullScreen = false) => {
    setActivePrintDocument(docData);
    setOpenInFullScreen(fullScreen);
    setPrintPdfModalOpen(true);
  };

  const quotations: SalesQuotation[] = useMemo(() => erpFinanceStorage.getSalesQuotations(), []);
  const orders: SalesOrder[] = useMemo(() => erpFinanceStorage.getSalesOrders(), []);
  const invoices: SalesInvoiceRecord[] = useMemo(() => erpFinanceStorage.getSalesInvoices(), []);
  const returnRequests: SalesReturnRequest[] = useMemo(() => erpFinanceStorage.getSalesReturnRequests(), []);
  const returns: SalesReturnRecord[] = useMemo(() => erpFinanceStorage.getSalesReturns(), []);

  // Configure Report metadata
  const meta = useMemo(() => {
    switch (reportType) {
      case 'sales-quotation-report':
        return {
          title: 'Sales Quotation Report',
          code: 'SQ-RPT',
          docName: 'Sales Quotation',
          description: 'Comprehensive report of customer price bids, validities, discount spreads, and conversion rates.',
          accentColor: 'blue',
          workflowTab: 'sales-quotation',
        };
      case 'sales-order-report':
        return {
          title: 'Sales Order Report',
          code: 'SO-RPT',
          docName: 'Sales Order',
          description: 'Committed commercial customer orders, fulfillment pipelines, and delivery commitments.',
          accentColor: 'emerald',
          workflowTab: 'sales-order',
        };
      case 'sales-invoice-report':
        return {
          title: 'Sales Invoice Report',
          code: 'SI-RPT',
          docName: 'A/R Sales Invoice',
          description: 'Official A/R tax invoices issued, GST tax breakdowns, collections, and aging outstanding balances.',
          accentColor: 'indigo',
          workflowTab: 'sales-invoice',
        };
      case 'sales-return-request-report':
        return {
          title: 'Sales Return Request Report',
          code: 'SRR-RPT',
          docName: 'Sales Return Request',
          description: 'Customer return requests, defect reasons, approval statuses, and RMA tracking.',
          accentColor: 'amber',
          workflowTab: 'sales-return-request',
        };
      case 'sales-return-report':
        return {
          title: 'Sales Return & Credit Note Report',
          code: 'SR-RPT',
          docName: 'Sales Return',
          description: 'Authorized stock returns received back into warehouse, restocking evaluations, and Credit Notes.',
          accentColor: 'rose',
          workflowTab: 'sales-return',
        };
    }
  }, [reportType]);

  // Filter items
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    switch (reportType) {
      case 'sales-quotation-report':
        return quotations.filter((q) => {
          const matchesTerm =
            q.quotationNumber.toLowerCase().includes(term) ||
            q.customerName.toLowerCase().includes(term) ||
            (q.notes && q.notes.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
          return matchesTerm && matchesStatus;
        });
      case 'sales-order-report':
        return orders.filter((o) => {
          const matchesTerm =
            o.orderNumber.toLowerCase().includes(term) ||
            o.customerName.toLowerCase().includes(term) ||
            (o.quotationNumber && o.quotationNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
          return matchesTerm && matchesStatus;
        });
      case 'sales-invoice-report':
        return invoices.filter((i) => {
          const matchesTerm =
            i.invoiceNumber.toLowerCase().includes(term) ||
            i.customerName.toLowerCase().includes(term) ||
            (i.orderNumber && i.orderNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
          return matchesTerm && matchesStatus;
        });
      case 'sales-return-request-report':
        return returnRequests.filter((r) => {
          const matchesTerm =
            r.returnRequestNumber.toLowerCase().includes(term) ||
            r.customerName.toLowerCase().includes(term) ||
            r.originalInvoiceNumber.toLowerCase().includes(term);
          const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
          return matchesTerm && matchesStatus;
        });
      case 'sales-return-report':
        return returns.filter((r) => {
          const matchesTerm =
            r.returnNumber.toLowerCase().includes(term) ||
            r.customerName.toLowerCase().includes(term) ||
            (r.creditNoteNumber && r.creditNoteNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
          return matchesTerm && matchesStatus;
        });
    }
  }, [reportType, quotations, orders, invoices, returnRequests, returns, searchTerm, statusFilter]);

  // Totals
  const totalAmount = useMemo(() => {
    switch (reportType) {
      case 'sales-quotation-report':
        return (filteredData as SalesQuotation[]).reduce((s, it) => s + it.grandTotal, 0);
      case 'sales-order-report':
        return (filteredData as SalesOrder[]).reduce((s, it) => s + it.grandTotal, 0);
      case 'sales-invoice-report':
        return (filteredData as SalesInvoiceRecord[]).reduce((s, it) => s + it.grandTotal, 0);
      case 'sales-return-request-report':
        return (filteredData as SalesReturnRequest[]).reduce((s, it) => s + it.totalAmount, 0);
      case 'sales-return-report':
        return (filteredData as SalesReturnRecord[]).reduce((s, it) => s + it.grandTotal, 0);
    }
  }, [filteredData, reportType]);

  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    switch (reportType) {
      case 'sales-quotation-report':
        csvContent += 'Quotation No,Customer,Date,Valid Until,Subtotal,Tax,Grand Total,Status\n';
        (filteredData as SalesQuotation[]).forEach((q) => {
          csvContent += `"${q.quotationNumber}","${q.customerName}","${q.date}","${q.validUntil}","${q.subtotal}","${q.taxTotal}","${q.grandTotal}","${q.status}"\n`;
        });
        break;
      case 'sales-order-report':
        csvContent += 'Order No,Customer,Date,Delivery Date,Subtotal,Tax,Grand Total,Status\n';
        (filteredData as SalesOrder[]).forEach((o) => {
          csvContent += `"${o.orderNumber}","${o.customerName}","${o.date}","${o.deliveryDate || ''}","${o.subtotal}","${o.taxTotal}","${o.grandTotal}","${o.status}"\n`;
        });
        break;
      case 'sales-invoice-report':
        csvContent += 'Invoice No,Customer,Date,Due Date,Grand Total,Paid,Balance,Status\n';
        (filteredData as SalesInvoiceRecord[]).forEach((i) => {
          csvContent += `"${i.invoiceNumber}","${i.customerName}","${i.date}","${i.dueDate}","${i.grandTotal}","${i.paidAmount}","${i.balanceAmount}","${i.status}"\n`;
        });
        break;
      case 'sales-return-request-report':
        csvContent += 'Request No,Customer,Date,Invoice Ref,Reason,Amount,Status\n';
        (filteredData as SalesReturnRequest[]).forEach((r) => {
          csvContent += `"${r.returnRequestNumber}","${r.customerName}","${r.date}","${r.originalInvoiceNumber}","${r.reason}","${r.totalAmount}","${r.status}"\n`;
        });
        break;
      case 'sales-return-report':
        csvContent += 'Return No,Customer,Date,Invoice Ref,Credit Note,Grand Total,Status\n';
        (filteredData as SalesReturnRecord[]).forEach((r) => {
          csvContent += `"${r.returnNumber}","${r.customerName}","${r.date}","${r.originalInvoiceNumber}","${(r as any).creditNoteNumber || ''}","${r.grandTotal}","${r.status}"\n`;
        });
        break;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Report Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {meta.code}
                </span>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{meta.title}</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">{meta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab(meta.workflowTab)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Go to {meta.docName}s</span>
              </button>
            )}
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#168A45] hover:bg-[#0B5D2A] text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Records</span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{filteredData.length} records</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">Report Value</span>
            <span className="text-lg font-bold text-emerald-800 mt-0.5 block">{formatINR(totalAmount)}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">Status Filter</span>
            <span className="text-lg font-bold text-blue-800 mt-0.5 block">{statusFilter}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search by document no, customer...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {reportType === 'sales-quotation-report' && (
                <>
                  <option value="Draft">Draft</option>
                  <option value="Sent">Sent</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </>
              )}
              {reportType === 'sales-order-report' && (
                <>
                  <option value="Draft">Draft</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Partially Delivered">Partially Delivered</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </>
              )}
              {reportType === 'sales-invoice-report' && (
                <>
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </>
              )}
              {reportType === 'sales-return-request-report' && (
                <>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </>
              )}
              {reportType === 'sales-return-report' && (
                <>
                  <option value="Processed">Processed</option>
                  <option value="Restocked">Restocked</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'sales-quotation-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Quotation No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as SalesQuotation[]).map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{q.quotationNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{q.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{q.date}</td>
                    <td className="py-3 px-4 text-slate-600">{q.validUntil}</td>
                    <td className="py-3 px-4 text-slate-500">{q.items.length} line(s)</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(q.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertSalesQuotationToDoc(q), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesQuotationToDoc(q), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Quotation"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesQuotationToDoc(q), false)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales-order-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Quote Ref</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as SalesOrder[]).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-900">{o.orderNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{o.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{o.date}</td>
                    <td className="py-3 px-4 text-slate-600">{o.deliveryDate || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{o.quotationNumber || '—'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(o.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertSalesOrderToDoc(o), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesOrderToDoc(o), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Order"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesOrderToDoc(o), false)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales-invoice-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Invoice Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as SalesInvoiceRecord[]).map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-900">{i.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{i.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{i.date}</td>
                    <td className="py-3 px-4 text-slate-600">{i.dueDate}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(i.grandTotal)}</td>
                    <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{formatINR(i.paidAmount)}</td>
                    <td className="py-3 px-4 text-right text-rose-700 font-bold">{formatINR(i.balanceAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {i.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertSalesInvoiceToDoc(i), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesInvoiceToDoc(i), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesInvoiceToDoc(i), false)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales-return-request-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Return Reason</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as SalesReturnRequest[]).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{r.returnRequestNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.originalInvoiceNumber}</td>
                    <td className="py-3 px-4 text-rose-700 font-medium">{r.reason}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(r.totalAmount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertSalesReturnRequestToDoc(r), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesReturnRequestToDoc(r), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Return Request"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesReturnRequestToDoc(r), false)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'sales-return-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Return No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice Ref</th>
                  <th className="py-3 px-4">Credit Note</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as SalesReturnRecord[]).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-900">{r.returnNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.customerName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.originalInvoiceNumber}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{(r as any).creditNoteNumber || 'Issued'}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">{formatINR(r.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertSalesReturnToDoc(r), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesReturnToDoc(r), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Return"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesReturnToDoc(r), false)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {filteredData.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-medium">No records found matching filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Universal Document Print, PDF & Full-Screen Modal */}
      <DocumentPrintPdfModal
        isOpen={printPdfModalOpen}
        onClose={() => {
          setPrintPdfModalOpen(false);
          setActivePrintDocument(null);
        }}
        documentData={activePrintDocument}
        category="sales"
        initialFullScreen={openInFullScreen}
      />
    </div>
  );
};
