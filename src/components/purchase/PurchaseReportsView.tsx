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
  ShoppingBag,
  RotateCcw,
  IndianRupee,
  FileSpreadsheet,
  Layers,
  Award,
  Package,
  Printer,
  Maximize2,
} from 'lucide-react';
import { erpFinanceStorage } from '../../services/finance/erpFinanceStorage';
import {
  PurchaseRequest,
  PurchaseQuotation,
  PurchaseOrder,
  GoodsReceiptPO,
  PurchaseInvoiceRecord,
  PurchaseReturnRequest,
  PurchaseReturnRecord,
} from '../../types/finance';
import { DocumentPrintPdfModal } from '../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../finance/themes/ThemedDocumentRenderer';
import {
  convertPurchaseRequestToDoc,
  convertPurchaseQuotationToDoc,
  convertPurchaseOrderToDoc,
  convertGoodsReceiptToDoc,
  convertPurchaseInvoiceToDoc,
  convertPurchaseReturnRequestToDoc,
  convertPurchaseReturnToDoc,
} from '../../utils/documentConversionHelpers';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export type PurchaseReportType =
  | 'purchase-request-report'
  | 'purchase-quotation-report'
  | 'purchase-quotation-comparison-report'
  | 'purchase-order-report'
  | 'goods-receipt-report'
  | 'purchase-invoice-report'
  | 'purchase-return-request-report'
  | 'purchase-return-report';

interface PurchaseReportsViewProps {
  reportType: PurchaseReportType;
  onNavigateTab?: (tab: string) => void;
}

export const PurchaseReportsView: React.FC<PurchaseReportsViewProps> = ({
  reportType,
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [printPdfModalOpen, setPrintPdfModalOpen] = useState(false);
  const [activePrintDocument, setActivePrintDocument] = useState<ThemedDocumentData | null>(null);
  const [openInFullScreen, setOpenInFullScreen] = useState(false);

  const openDocumentViewer = (docData: ThemedDocumentData, fullScreen = false) => {
    setActivePrintDocument(docData);
    setOpenInFullScreen(fullScreen);
    setPrintPdfModalOpen(true);
  };

  const requests: PurchaseRequest[] = useMemo(() => erpFinanceStorage.getPurchaseRequests(), []);
  const quotations: PurchaseQuotation[] = useMemo(() => erpFinanceStorage.getPurchaseQuotations(), []);
  const orders: PurchaseOrder[] = useMemo(() => erpFinanceStorage.getPurchaseOrders(), []);
  const grpos: GoodsReceiptPO[] = useMemo(() => erpFinanceStorage.getGoodsReceiptPOs(), []);
  const invoices: PurchaseInvoiceRecord[] = useMemo(() => erpFinanceStorage.getPurchaseInvoices(), []);
  const returnRequests: PurchaseReturnRequest[] = useMemo(() => erpFinanceStorage.getPurchaseReturnRequests(), []);
  const returns: PurchaseReturnRecord[] = useMemo(() => erpFinanceStorage.getPurchaseReturns(), []);

  // Compute Quotation Comparison data grouped by Purchase Request
  const comparisons = useMemo(() => {
    return requests.map((req) => {
      const linkedQuotes = quotations.filter((q) => q.requestRefId === req.id);
      const sorted = [...linkedQuotes].sort((a, b) => a.grandTotal - b.grandTotal);
      const lowestBid = sorted[0];
      const highestBid = sorted[sorted.length - 1];
      const variance = lowestBid && highestBid ? highestBid.grandTotal - lowestBid.grandTotal : 0;
      const savings = lowestBid ? Math.max(0, req.estimatedTotal - lowestBid.grandTotal) : 0;
      const awarded = linkedQuotes.find((q) => q.status === 'Converted to PO' || q.status === 'Approved');

      return {
        id: `comp-${req.id}`,
        requestNumber: req.requestNumber,
        department: req.department,
        estimatedTotal: req.estimatedTotal,
        quotesCount: linkedQuotes.length,
        lowestBidder: lowestBid?.vendorName || '—',
        lowestBidAmount: lowestBid?.grandTotal || 0,
        variance,
        savings,
        awardedTo: awarded?.vendorName || (linkedQuotes.length > 0 ? 'Evaluating' : 'Pending Bids'),
        status: linkedQuotes.length >= 2 ? 'Comparative Evaluated' : linkedQuotes.length === 1 ? 'Single Bid' : 'Awaiting Bids',
      };
    });
  }, [requests, quotations]);

  // Report metadata
  const meta = useMemo(() => {
    switch (reportType) {
      case 'purchase-request-report':
        return {
          title: 'Purchase Request Report',
          code: 'PR-RPT',
          docName: 'Purchase Request',
          description: 'Requisitions from internal departments, requisition budget estimations, and approvals.',
          workflowTab: 'purchase-request',
        };
      case 'purchase-quotation-report':
        return {
          title: 'Purchase Quotation Report',
          code: 'PQ-RPT',
          docName: 'Purchase Quotation',
          description: 'Supplier bids received, rate submissions, vendor lead times, and terms.',
          workflowTab: 'purchase-quotation',
        };
      case 'purchase-quotation-comparison-report':
        return {
          title: 'Purchase Quotation Comparison Report',
          code: 'PQC-RPT',
          docName: 'Quotation Comparison',
          description: 'Multi-vendor side-by-side bid analysis, L1 lowest-cost determination, and savings tracking.',
          workflowTab: 'purchase-quotation-comparison',
        };
      case 'purchase-order-report':
        return {
          title: 'Purchase Order Report',
          code: 'PO-RPT',
          docName: 'Purchase Order',
          description: 'Official procurement commitments issued to vendors, delivery schedules, and commitments.',
          workflowTab: 'purchase-order',
        };
      case 'goods-receipt-report':
        return {
          title: 'Goods Receipt PO (GRPO) Report',
          code: 'GRPO-RPT',
          docName: 'Goods Receipt',
          description: 'Warehouse inward goods receipts, QC inspections, accepted quantities, and physical stock entries.',
          workflowTab: 'goods-receipt',
        };
      case 'purchase-invoice-report':
        return {
          title: 'Purchase Invoice Report',
          code: 'PI-RPT',
          docName: 'Purchase Invoice',
          description: 'Vendor A/P invoices recorded, input GST credits, withholding TDS deductions, and payables.',
          workflowTab: 'purchase-invoice',
        };
      case 'purchase-return-request-report':
        return {
          title: 'Purchase Return Request Report',
          code: 'PRR-RPT',
          docName: 'Purchase Return Request',
          description: 'Vendor return requests raised due to damaged stock, rejections, and pending RMA approvals.',
          workflowTab: 'purchase-return-request',
        };
      case 'purchase-return-report':
        return {
          title: 'Purchase Return & Debit Note Report',
          code: 'PRTN-RPT',
          docName: 'Purchase Return',
          description: 'Authorized supplier stock returns, Debit Notes posted to GL, and ITC tax reversals.',
          workflowTab: 'purchase-return',
        };
    }
  }, [reportType]);

  // Filter data
  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    switch (reportType) {
      case 'purchase-request-report':
        return requests.filter((r) => {
          const matches =
            r.requestNumber.toLowerCase().includes(term) ||
            r.department.toLowerCase().includes(term) ||
            r.requestedBy.toLowerCase().includes(term);
          const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
          return matches && matchesStatus;
        });
      case 'purchase-quotation-report':
        return quotations.filter((q) => {
          const matches =
            q.quotationNumber.toLowerCase().includes(term) ||
            q.vendorName.toLowerCase().includes(term) ||
            (q.requestNumber && q.requestNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
          return matches && matchesStatus;
        });
      case 'purchase-quotation-comparison-report':
        return comparisons.filter((c) => {
          const matches =
            c.requestNumber.toLowerCase().includes(term) ||
            c.department.toLowerCase().includes(term) ||
            c.lowestBidder.toLowerCase().includes(term) ||
            c.awardedTo.toLowerCase().includes(term);
          const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
          return matches && matchesStatus;
        });
      case 'purchase-order-report':
        return orders.filter((o) => {
          const matches =
            o.poNumber.toLowerCase().includes(term) ||
            o.vendorName.toLowerCase().includes(term) ||
            (o.quotationNumber && o.quotationNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
          return matches && matchesStatus;
        });
      case 'goods-receipt-report':
        return grpos.filter((g) => {
          const matches =
            g.grpoNumber.toLowerCase().includes(term) ||
            g.vendorName.toLowerCase().includes(term) ||
            (g.poNumber && g.poNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || g.status === statusFilter;
          return matches && matchesStatus;
        });
      case 'purchase-invoice-report':
        return invoices.filter((i) => {
          const matches =
            i.invoiceNumber.toLowerCase().includes(term) ||
            i.vendorName.toLowerCase().includes(term) ||
            (i.poNumber && i.poNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || i.status === statusFilter;
          return matches && matchesStatus;
        });
      case 'purchase-return-request-report':
        return returnRequests.filter((r) => {
          const matches =
            r.returnRequestNumber.toLowerCase().includes(term) ||
            r.vendorName.toLowerCase().includes(term) ||
            r.originalInvoiceNumber.toLowerCase().includes(term);
          const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
          return matches && matchesStatus;
        });
      case 'purchase-return-report':
        return returns.filter((r) => {
          const matches =
            r.returnNumber.toLowerCase().includes(term) ||
            r.vendorName.toLowerCase().includes(term) ||
            (r.debitNoteNumber && r.debitNoteNumber.toLowerCase().includes(term));
          const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
          return matches && matchesStatus;
        });
    }
  }, [reportType, requests, quotations, comparisons, orders, grpos, invoices, returnRequests, returns, searchTerm, statusFilter]);

  // Aggregate Total Value
  const totalAmount = useMemo(() => {
    switch (reportType) {
      case 'purchase-request-report':
        return (filteredData as PurchaseRequest[]).reduce((s, it) => s + it.estimatedTotal, 0);
      case 'purchase-quotation-report':
        return (filteredData as PurchaseQuotation[]).reduce((s, it) => s + it.grandTotal, 0);
      case 'purchase-quotation-comparison-report':
        return (filteredData as typeof comparisons).reduce((s, it) => s + it.lowestBidAmount, 0);
      case 'purchase-order-report':
        return (filteredData as PurchaseOrder[]).reduce((s, it) => s + it.grandTotal, 0);
      case 'goods-receipt-report':
        return (filteredData as GoodsReceiptPO[]).reduce((s, it) => s + (it.totalAmount || 0), 0);
      case 'purchase-invoice-report':
        return (filteredData as PurchaseInvoiceRecord[]).reduce((s, it) => s + it.grandTotal, 0);
      case 'purchase-return-request-report':
        return (filteredData as PurchaseReturnRequest[]).reduce((s, it) => s + it.totalAmount, 0);
      case 'purchase-return-report':
        return (filteredData as PurchaseReturnRecord[]).reduce((s, it) => s + it.grandTotal, 0);
    }
  }, [filteredData, reportType]);

  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    switch (reportType) {
      case 'purchase-request-report':
        csvContent += 'Request No,Department,Date,Required Date,Items,Estimated Total,Status\n';
        (filteredData as PurchaseRequest[]).forEach((r) => {
          csvContent += `"${r.requestNumber}","${r.department}","${r.date}","${r.requiredDate || ''}","${r.items.length}","${r.estimatedTotal}","${r.status}"\n`;
        });
        break;
      case 'purchase-quotation-report':
        csvContent += 'Quote No,Vendor,Date,Valid Until,Subtotal,Tax,Grand Total,Status\n';
        (filteredData as PurchaseQuotation[]).forEach((q) => {
          csvContent += `"${q.quotationNumber}","${q.vendorName}","${q.date}","${q.validUntil}","${q.subtotal}","${q.taxTotal}","${q.grandTotal}","${q.status}"\n`;
        });
        break;
      case 'purchase-quotation-comparison-report':
        csvContent += 'Request No,Department,Quotes Count,Lowest Bidder,Lowest Amount,Savings,Awarded To,Status\n';
        (filteredData as typeof comparisons).forEach((c) => {
          csvContent += `"${c.requestNumber}","${c.department}","${c.quotesCount}","${c.lowestBidder}","${c.lowestBidAmount}","${c.savings}","${c.awardedTo}","${c.status}"\n`;
        });
        break;
      case 'purchase-order-report':
        csvContent += 'PO No,Vendor,Date,Delivery Date,Subtotal,Tax,Grand Total,Status\n';
        (filteredData as PurchaseOrder[]).forEach((o) => {
          csvContent += `"${o.poNumber}","${o.vendorName}","${o.date}","${o.expectedDeliveryDate || ''}","${o.subtotal}","${o.taxTotal}","${o.grandTotal}","${o.status}"\n`;
        });
        break;
      case 'goods-receipt-report':
        csvContent += 'GRPO No,Vendor,Date,PO Ref,Warehouse,Total Amount,Status\n';
        (filteredData as GoodsReceiptPO[]).forEach((g) => {
          csvContent += `"${g.grpoNumber}","${g.vendorName}","${g.date}","${g.poNumber || ''}","${g.warehouse || ''}","${g.totalAmount || 0}","${g.status}"\n`;
        });
        break;
      case 'purchase-invoice-report':
        csvContent += 'Invoice No,Vendor,Date,Due Date,Grand Total,Paid,Balance,Status\n';
        (filteredData as PurchaseInvoiceRecord[]).forEach((i) => {
          csvContent += `"${i.invoiceNumber}","${i.vendorName}","${i.date}","${i.dueDate}","${i.grandTotal}","${i.paidAmount}","${i.balanceAmount}","${i.status}"\n`;
        });
        break;
      case 'purchase-return-request-report':
        csvContent += 'Return Req No,Vendor,Date,Invoice Ref,Reason,Amount,Status\n';
        (filteredData as PurchaseReturnRequest[]).forEach((r) => {
          csvContent += `"${r.returnRequestNumber}","${r.vendorName}","${r.date}","${r.originalInvoiceNumber}","${r.reason}","${r.totalAmount}","${r.status}"\n`;
        });
        break;
      case 'purchase-return-report':
        csvContent += 'Return No,Vendor,Date,Invoice Ref,Debit Note,Grand Total,Status\n';
        (filteredData as PurchaseReturnRecord[]).forEach((r) => {
          csvContent += `"${r.returnNumber}","${r.vendorName}","${r.date}","${r.originalInvoiceNumber}","${r.debitNoteNumber || ''}","${r.grandTotal}","${r.status}"\n`;
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
            <div className="p-3 rounded-2xl bg-emerald-50 text-[#168A45] border border-emerald-200 shadow-2xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
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
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-[#0B5D2A] hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
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
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">{filteredData.length} entries</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">Total Evaluated Value</span>
            <span className="text-lg font-bold text-emerald-800 mt-0.5 block">{formatINR(totalAmount)}</span>
          </div>
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block">Active Filter</span>
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
            placeholder={`Search document no, vendor, department...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              {reportType === 'purchase-request-report' && (
                <>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {reportType === 'purchase-quotation-report' && (
                <>
                  <option value="Received">Received</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Rejected">Rejected</option>
                </>
              )}
              {reportType === 'purchase-quotation-comparison-report' && (
                <>
                  <option value="Comparative Evaluated">Comparative Evaluated</option>
                  <option value="Single Bid">Single Bid</option>
                  <option value="Awaiting Bids">Awaiting Bids</option>
                </>
              )}
              {reportType === 'purchase-order-report' && (
                <>
                  <option value="Open">Open</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Received">Received</option>
                  <option value="Billed">Billed</option>
                  <option value="Closed">Closed</option>
                </>
              )}
              {reportType === 'goods-receipt-report' && (
                <>
                  <option value="Accepted">Accepted</option>
                  <option value="In QC">In QC</option>
                  <option value="Partial">Partial</option>
                  <option value="Billed">Billed</option>
                </>
              )}
              {reportType === 'purchase-invoice-report' && (
                <>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                </>
              )}
              {reportType === 'purchase-return-request-report' && (
                <>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </>
              )}
              {reportType === 'purchase-return-report' && (
                <>
                  <option value="Completed">Completed</option>
                  <option value="Debit Note Issued">Debit Note Issued</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportType === 'purchase-request-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request No</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Required Date</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4 text-right">Estimated Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as PurchaseRequest[]).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{r.requestNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.department}</td>
                    <td className="py-3 px-4 text-slate-600">{r.requestedBy}</td>
                    <td className="py-3 px-4 text-slate-600">{r.requiredDate || r.date}</td>
                    <td className="py-3 px-4 text-slate-500">{r.items.length} line(s)</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(r.estimatedTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseRequestToDoc(r), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseRequestToDoc(r), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Request"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseRequestToDoc(r), false)}
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

          {reportType === 'purchase-quotation-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Quotation No</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">PR Ref</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as PurchaseQuotation[]).map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">{q.quotationNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{q.vendorName}</td>
                    <td className="py-3 px-4 text-slate-600">{q.date}</td>
                    <td className="py-3 px-4 text-slate-600">{q.validUntil}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{q.requestNumber || '—'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(q.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseQuotationToDoc(q), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseQuotationToDoc(q), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Quotation"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseQuotationToDoc(q), false)}
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

          {reportType === 'purchase-quotation-comparison-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PR Number</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Quotes Evaluated</th>
                  <th className="py-3 px-4">Lowest Bidder (L1)</th>
                  <th className="py-3 px-4 text-right">L1 Bid Amount</th>
                  <th className="py-3 px-4 text-right">Achieved Savings</th>
                  <th className="py-3 px-4">Award Status</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as typeof comparisons).map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-900">{c.requestNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{c.department}</td>
                    <td className="py-3 px-4 text-slate-600">{c.quotesCount} quote(s)</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{c.lowestBidder}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-800">{formatINR(c.lowestBidAmount)}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-700">{formatINR(c.savings)}</td>
                    <td className="py-3 px-4 font-medium text-slate-700">{c.awardedTo}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'purchase-order-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">PO Date</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Quote Ref</th>
                  <th className="py-3 px-4 text-right">PO Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as PurchaseOrder[]).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-900">{o.poNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{o.vendorName}</td>
                    <td className="py-3 px-4 text-slate-600">{o.date}</td>
                    <td className="py-3 px-4 text-slate-600">{o.expectedDeliveryDate || '—'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{o.quotationNumber || '—'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(o.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-[#0B5D2A] border border-emerald-200">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseOrderToDoc(o), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseOrderToDoc(o), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print PO"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseOrderToDoc(o), false)}
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

          {reportType === 'goods-receipt-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">GRPO Number</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4 text-right">Received Value</th>
                  <th className="py-3 px-4 text-center">QC Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as GoodsReceiptPO[]).map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-teal-900">{g.grpoNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{g.vendorName}</td>
                    <td className="py-3 px-4 text-slate-600">{g.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{g.poNumber || '—'}</td>
                    <td className="py-3 px-4 text-slate-600">{g.warehouse || 'Central'}</td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">{formatINR(g.totalAmount || 0)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        {g.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertGoodsReceiptToDoc(g), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertGoodsReceiptToDoc(g), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print GRPO"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertGoodsReceiptToDoc(g), false)}
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

          {reportType === 'purchase-invoice-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Bill / Invoice No</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total Invoice</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as PurchaseInvoiceRecord[]).map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-900">{i.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{i.vendorName}</td>
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
                          onClick={() => openDocumentViewer(convertPurchaseInvoiceToDoc(i), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseInvoiceToDoc(i), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseInvoiceToDoc(i), false)}
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

          {reportType === 'purchase-return-request-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Return Req No</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bill Ref</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as PurchaseReturnRequest[]).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-900">{r.returnRequestNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.vendorName}</td>
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
                          onClick={() => openDocumentViewer(convertPurchaseReturnRequestToDoc(r), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseReturnRequestToDoc(r), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Return Request"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseReturnRequestToDoc(r), false)}
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

          {reportType === 'purchase-return-report' && (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Return No</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Bill Ref</th>
                  <th className="py-3 px-4">Debit Note</th>
                  <th className="py-3 px-4 text-right">Return Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredData as PurchaseReturnRecord[]).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-900">{r.returnNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{r.vendorName}</td>
                    <td className="py-3 px-4 text-slate-600">{r.date}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{r.originalInvoiceNumber}</td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-semibold">{r.debitNoteNumber || 'Issued'}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">-{formatINR(r.grandTotal)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseReturnToDoc(r), true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseReturnToDoc(r), false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Return"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseReturnToDoc(r), false)}
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
              <p className="text-xs font-medium">No procurement records found matching filters</p>
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
        category="purchase"
        initialFullScreen={openInFullScreen}
      />
    </div>
  );
};
