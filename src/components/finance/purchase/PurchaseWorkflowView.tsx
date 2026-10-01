import React, { useState, useMemo, useEffect } from 'react';
import {
  ShoppingBag,
  FileText,
  FileCheck,
  Receipt,
  ArrowRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  ArrowDownRight,
  Landmark,
  ShieldCheck,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  Building2,
  Package,
  Layers,
  Sparkles,
  Undo2,
  Calendar,
  Award,
  Network,
  Trash2,
  Truck,
  Printer,
  Maximize2,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import {
  PurchaseRequest,
  PurchaseQuotation,
  PurchaseOrder,
  GoodsReceiptPO,
  PurchaseInvoiceRecord,
  PurchaseReturnRequest,
  PurchaseReturnRecord,
  DebitNoteRecord,
  PurchaseItemLine,
} from '../../../types/finance';
import { RelatedDocumentsModal } from './RelatedDocumentsModal';
import { QuotationComparisonModal } from './QuotationComparisonModal';
import { CopyToQuotationModal } from './CopyToQuotationModal';
import { NewGoodsReceiptModal } from './NewGoodsReceiptModal';
import { NewDirectOrderModal } from './NewDirectOrderModal';
import { NewDirectQuotationModal } from './NewDirectQuotationModal';
import { NewDirectInvoiceModal } from './NewDirectInvoiceModal';
import { NewDirectReturnModal } from './NewDirectReturnModal';
import { DocumentPrintPdfModal } from '../../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../themes/ThemedDocumentRenderer';
import {
  convertPurchaseRequestToDoc,
  convertPurchaseQuotationToDoc,
  convertPurchaseOrderToDoc,
  convertGoodsReceiptToDoc,
  convertPurchaseInvoiceToDoc,
  convertPurchaseReturnRequestToDoc,
  convertPurchaseReturnToDoc,
} from '../../../utils/documentConversionHelpers';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export interface PurchaseWorkflowViewProps {
  initialStage?: 'requests' | 'quotations' | 'orders' | 'grpo' | 'invoices' | 'returns';
  autoOpenComparison?: boolean;
  subTab?: 'all' | 'requests' | 'quotations' | 'comparison' | 'orders' | 'grpo' | 'invoices' | 'return-requests' | 'returns';
}

export const PurchaseWorkflowView: React.FC<PurchaseWorkflowViewProps> = ({
  initialStage = 'requests',
  autoOpenComparison = false,
  subTab,
}) => {
  const [activeStage, setActiveStage] = useState<
    'requests' | 'quotations' | 'orders' | 'grpo' | 'invoices' | 'returns'
  >(initialStage);

  useEffect(() => {
    if (initialStage) {
      setActiveStage(initialStage);
    }
  }, [initialStage]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');

  // Storage states
  const [requests, setRequests] = useState<PurchaseRequest[]>(() => erpFinanceStorage.getPurchaseRequests());
  const [quotations, setQuotations] = useState<PurchaseQuotation[]>(() => erpFinanceStorage.getPurchaseQuotations());
  const [orders, setOrders] = useState<PurchaseOrder[]>(() => erpFinanceStorage.getPurchaseOrders());
  const [grpos, setGrpos] = useState<GoodsReceiptPO[]>(() => erpFinanceStorage.getGoodsReceiptPOs());
  const [invoices, setInvoices] = useState<PurchaseInvoiceRecord[]>(() => erpFinanceStorage.getPurchaseInvoices());
  const [returnRequests, setReturnRequests] = useState<PurchaseReturnRequest[]>(() => erpFinanceStorage.getPurchaseReturnRequests());
  const [returns, setReturns] = useState<PurchaseReturnRecord[]>(() => erpFinanceStorage.getPurchaseReturns());
  const [debitNotes, setDebitNotes] = useState<DebitNoteRecord[]>(() => erpFinanceStorage.getDebitNotes());
  const parties = useMemo(() => erpFinanceStorage.getParties().filter((p) => p.type === 'Vendor' || p.type === 'Customer & Vendor'), []);
  const itemsMaster = useMemo(() => erpFinanceStorage.getItems(), []);

  // Modals
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [isNewDirectOrderModalOpen, setIsNewDirectOrderModalOpen] = useState(false);
  const [isNewDirectQuotationModalOpen, setIsNewDirectQuotationModalOpen] = useState(false);
  const [isNewDirectInvoiceModalOpen, setIsNewDirectInvoiceModalOpen] = useState(false);
  const [isNewDirectReturnModalOpen, setIsNewDirectReturnModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<PurchaseInvoiceRecord | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<{ type: string; data: any } | null>(null);

  // SAP B1 Workflow Modals
  const [isCopyToQuotationModalOpen, setIsCopyToQuotationModalOpen] = useState(false);
  const [selectedRequestForCopy, setSelectedRequestForCopy] = useState<PurchaseRequest | null>(null);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [comparisonRequestId, setComparisonRequestId] = useState<string>('');

  useEffect(() => {
    if (autoOpenComparison && requests.length > 0) {
      setComparisonRequestId(requests[0].id);
      setIsComparisonModalOpen(true);
    }
  }, [autoOpenComparison, requests]);
  const [isGRPOModalOpen, setIsGRPOModalOpen] = useState(false);
  const [selectedPOForGRPO, setSelectedPOForGRPO] = useState<PurchaseOrder | undefined>(undefined);
  const [isRelatedDocsModalOpen, setIsRelatedDocsModalOpen] = useState(false);
  const [relatedDocMeta, setRelatedDocMeta] = useState<{
    docType: 'Request' | 'Quotation' | 'Order' | 'GRPO' | 'Invoice';
    docId: string;
    docNumber: string;
  }>({
    docType: 'Request',
    docId: '',
    docNumber: '',
  });

  // Universal Document Print, PDF & Full-Screen Viewer State
  const [printPdfModalOpen, setPrintPdfModalOpen] = useState(false);
  const [activePrintDocument, setActivePrintDocument] = useState<ThemedDocumentData | null>(null);
  const [openInFullScreen, setOpenInFullScreen] = useState(false);

  const openDocumentViewer = (docData: ThemedDocumentData, fullScreen = false) => {
    setActivePrintDocument(docData);
    setOpenInFullScreen(fullScreen);
    setPrintPdfModalOpen(true);
  };

  // Form states for New PR
  const [prRequestedBy, setPrRequestedBy] = useState('John Doe');
  const [prDepartment, setPrDepartment] = useState('General Admin');
  const [prBranch, setPrBranch] = useState('Kochi Campus');
  const [prPriority, setPrPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [prReason, setPrReason] = useState('');
  const [prItems, setPrItems] = useState<
    { itemId: string; itemCode: string; itemName: string; quantity: number; unit: string; estimatedPrice: number }[]
  >([
    {
      itemId: itemsMaster[0]?.id || 'itm-1',
      itemCode: itemsMaster[0]?.code || 'LAP-DELL-XPS',
      itemName: itemsMaster[0]?.name || 'Dell XPS 15 Workstation',
      quantity: 2,
      unit: 'NOS',
      estimatedPrice: 125000,
    },
  ]);

  // Form states for Payment
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'NEFT' | 'RTGS' | 'Cheque' | 'Bank Transfer'>('NEFT');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('acc-bank-1');
  const [tdsDeduction, setTdsDeduction] = useState<number>(0);

  // Form states for Return Request
  const [retVendorId, setRetVendorId] = useState('');
  const [retInvoiceId, setRetInvoiceId] = useState('');
  const [retReason, setRetReason] = useState<PurchaseReturnRequest['reason']>('Damaged');
  const [retRemarks, setRetRemarks] = useState('');
  const [retQuantity, setRetQuantity] = useState(1);

  const refreshData = () => {
    setRequests(erpFinanceStorage.getPurchaseRequests());
    setQuotations(erpFinanceStorage.getPurchaseQuotations());
    setOrders(erpFinanceStorage.getPurchaseOrders());
    setGrpos(erpFinanceStorage.getGoodsReceiptPOs());
    setInvoices(erpFinanceStorage.getPurchaseInvoices());
    setReturnRequests(erpFinanceStorage.getPurchaseReturnRequests());
    setReturns(erpFinanceStorage.getPurchaseReturns());
    setDebitNotes(erpFinanceStorage.getDebitNotes());
  };

  // Stage Metrics
  const metrics = useMemo(() => {
    return {
      requestsCount: requests.length,
      quotationsCount: quotations.length,
      ordersCount: orders.length,
      ordersCommitted: orders.reduce((sum, o) => sum + (o.budgetCommitmentAmount || o.grandTotal), 0),
      grposCount: grpos.length,
      invoicesCount: invoices.length,
      invoicesUnpaid: invoices.filter((i) => i.status !== 'Paid').reduce((sum, i) => sum + i.balanceAmount, 0),
      returnsCount: returnRequests.length,
      debitNotesTotal: debitNotes.reduce((sum, d) => sum + d.grandTotal, 0),
    };
  }, [requests, quotations, orders, grpos, invoices, returnRequests, debitNotes]);

  // Handlers
  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    if (prItems.length === 0) return;

    erpFinanceStorage.savePurchaseRequest({
      requestedBy: prRequestedBy,
      department: prDepartment,
      branch: prBranch,
      priority: prPriority,
      reason: prReason || 'Department operational need',
      items: prItems.map((i) => ({
        itemId: i.itemId,
        itemCode: i.itemCode,
        itemName: i.itemName,
        quantity: i.quantity,
        unit: i.unit,
        estimatedPrice: i.estimatedPrice,
        estimatedTotal: i.quantity * i.estimatedPrice,
      })),
      status: 'Submitted',
    });

    refreshData();
    setIsNewRequestModalOpen(false);
  };

  const handleConvertToQuotation = (requestId: string) => {
    const firstVendor = parties[0]?.id;
    if (!firstVendor) {
      alert('No vendors available. Please add a vendor first.');
      return;
    }
    erpFinanceStorage.convertPurchaseRequestToQuotation(requestId, firstVendor);
    refreshData();
    setActiveStage('quotations');
  };

  const handleConvertToPO = (quoteId: string) => {
    erpFinanceStorage.convertQuotationToPO(quoteId);
    refreshData();
    setActiveStage('orders');
  };

  const handleConvertPOToInvoice = (poId: string) => {
    erpFinanceStorage.convertPOToPurchaseInvoice(poId);
    refreshData();
    setActiveStage('invoices');
  };

  const handleApproveReturnRequest = (reqId: string) => {
    erpFinanceStorage.approvePurchaseReturnRequest(reqId);
    refreshData();
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment) return;

    erpFinanceStorage.postPayment({
      partyId: selectedInvoiceForPayment.vendorId,
      partyName: selectedInvoiceForPayment.vendorName,
      amount: paymentAmount,
      tdsAmount: tdsDeduction,
      paymentMethod: (paymentMode === 'Bank Transfer' ? 'NEFT' : paymentMode) as any,
      accountId: selectedBankAccountId,
      accountName: 'HDFC Corporate Current Account',
      referenceNumber: `PMT-${Date.now()}`,
      allocations: [
        {
          invoiceId: selectedInvoiceForPayment.id,
          invoiceNumber: selectedInvoiceForPayment.invoiceNumber,
          amount: paymentAmount,
        },
      ],
    });

    refreshData();
    setIsPaymentModalOpen(false);
    setSelectedInvoiceForPayment(null);
  };

  const handleCreateReturnRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = parties.find((p) => p.id === retVendorId) || parties[0];
    const invoice = invoices.find((i) => i.id === retInvoiceId) || invoices[0];
    if (!vendor || !invoice) return;

    const returnItem = invoice.items[0] || {
      itemId: 'itm-1',
      itemCode: 'LAP-DELL-XPS',
      itemName: 'Dell XPS 15 Workstation',
      hsnCode: '8471',
      quantity: 1,
      unit: 'NOS',
      rate: 125000,
      discount: 0,
      taxPercent: 18,
      cgst: 11250,
      sgst: 11250,
      igst: 0,
      total: 147500,
    };

    const unitPrice = returnItem.rate;
    const taxRate = returnItem.taxPercent || 18;
    const itemSub = unitPrice * retQuantity;
    const tax = (itemSub * taxRate) / 100;
    const grandTotal = itemSub + tax;

    erpFinanceStorage.savePurchaseReturnRequest({
      vendorId: vendor.id,
      vendorName: vendor.name,
      originalInvoiceId: invoice.id,
      originalInvoiceNumber: invoice.invoiceNumber,
      totalAmount: grandTotal,
      reason: retReason,
      remarks: retRemarks,
      items: [
        {
          ...returnItem,
          quantity: retQuantity,
          cgst: tax / 2,
          sgst: tax / 2,
          igst: 0,
          total: grandTotal,
        },
      ],
    });

    refreshData();
    setIsNewReturnModalOpen(false);
  };

  return (
    <div className="space-y-6" id="purchase-workflow-view">
      {/* Module Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                End-to-End Procurement (Sec 13, 14, 15 & 96)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Purchase & Vendor Supply Chain</h1>
            <p className="text-sm text-emerald-100/80 mt-1">
              Automated workflow with Budget Commitment enforcement, 3-way matching, and GST ITC reversal
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewDirectOrderModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-direct-purchase-order"
              title="Create Direct Purchase Order (without Requisition)"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>+ Direct PO</span>
            </button>
            <button
              onClick={() => setIsNewDirectQuotationModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-direct-purchase-quotation"
              title="Record Direct Vendor Quotation"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>+ Direct Quotation</span>
            </button>
            <button
              onClick={() => setIsNewDirectInvoiceModalOpen(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-direct-purchase-invoice"
              title="Post Direct Purchase Bill / A/P Invoice"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>+ Direct Bill</span>
            </button>
            <button
              onClick={() => setIsNewDirectReturnModalOpen(true)}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-direct-purchase-return"
              title="Issue Direct Purchase Return & Debit Note"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>+ Direct Return</span>
            </button>
            <div className="h-5 w-px bg-white/20 mx-1 hidden sm:block" />
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-new-purchase-request"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>PR</span>
            </button>
            <button
              onClick={() => {
                setComparisonRequestId(requests[0]?.id || '');
                setIsComparisonModalOpen(true);
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-compare-quotations"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
            <button
              onClick={() => {
                setSelectedPOForGRPO(undefined);
                setIsGRPOModalOpen(true);
              }}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-add-goods-receipt"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>GRPO</span>
            </button>
          </div>
        </div>

        {/* Visual Pipeline Stepper (6-Stage SAP B1 Workflow) */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveStage('requests')}
            className={`p-3 rounded-xl text-left transition-all border ${
              activeStage === 'requests'
                ? 'bg-white text-emerald-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-xs font-medium uppercase opacity-75">1. Requisition</div>
            <div className="text-lg font-bold mt-0.5">{metrics.requestsCount} Requests</div>
            <div className="text-xs mt-1 truncate">Staff & Dept demands</div>
          </button>

          <button
            onClick={() => setActiveStage('quotations')}
            className={`p-3 rounded-xl text-left transition-all border ${
              activeStage === 'quotations'
                ? 'bg-white text-emerald-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-xs font-medium uppercase opacity-75">2. Quotation</div>
            <div className="text-lg font-bold mt-0.5">{metrics.quotationsCount} Quotes</div>
            <div className="text-xs mt-1 truncate">Vendor price comparison</div>
          </button>

          <button
            onClick={() => setActiveStage('orders')}
            className={`p-3 rounded-xl text-left transition-all border ${
              activeStage === 'orders'
                ? 'bg-white text-emerald-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-xs font-medium uppercase opacity-75">3. Purchase Order</div>
            <div className="text-lg font-bold mt-0.5">{metrics.ordersCount} POs</div>
            <div className="text-xs mt-1 truncate">Commitment: {formatINR(metrics.ordersCommitted)}</div>
          </button>

          <button
            onClick={() => setActiveStage('grpo')}
            className={`p-3 rounded-xl text-left transition-all border ${
              activeStage === 'grpo'
                ? 'bg-white text-emerald-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-xs font-medium uppercase opacity-75">4. Goods Receipt</div>
            <div className="text-lg font-bold mt-0.5">{metrics.grposCount} Inward</div>
            <div className="text-xs mt-1 truncate text-emerald-200 font-medium">Warehouse stock</div>
          </button>

          <button
            onClick={() => setActiveStage('invoices')}
            className={`p-3 rounded-xl text-left transition-all border ${
              activeStage === 'invoices'
                ? 'bg-white text-emerald-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-xs font-medium uppercase opacity-75">5. Vendor Bills</div>
            <div className="text-lg font-bold mt-0.5">{metrics.invoicesCount} Invoices</div>
            <div className="text-xs mt-1 truncate text-amber-300 font-medium">Due: {formatINR(metrics.invoicesUnpaid)}</div>
          </button>

          <button
            onClick={() => setActiveStage('returns')}
            className={`p-3 rounded-xl text-left transition-all border ${
              activeStage === 'returns'
                ? 'bg-white text-emerald-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="text-xs font-medium uppercase opacity-75">6. Returns & Notes</div>
            <div className="text-lg font-bold mt-0.5">{metrics.returnsCount} Returns</div>
            <div className="text-xs mt-1 truncate text-rose-300 font-medium">DNs: {formatINR(metrics.debitNotesTotal)}</div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by number, vendor, item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <button
            onClick={() => {
              const rootDoc = requests[0] || orders[0];
              if (rootDoc) {
                setRelatedDocMeta({
                  docType: requests[0] ? 'Request' : 'Order',
                  docId: rootDoc.id,
                  docNumber: (rootDoc as any).requestNumber || (rootDoc as any).orderNumber || '',
                });
                setIsRelatedDocsModalOpen(true);
              }
            }}
            className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
            title="Open Unified Procurement Traceability Chain (PR ➔ PQ ➔ COMP ➔ PO ➔ GRPO ➔ PI)"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Traceability Chain</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-200 text-emerald-800">
              PR ➔ PI
            </span>
          </button>

          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 bg-white"
          >
            <option value="All">All Departments</option>
            <option value="General Admin">General Admin</option>
            <option value="IT & Systems">IT & Systems</option>
            <option value="Hostel & Facilities">Hostel & Facilities</option>
            <option value="Academic Operations">Academic Operations</option>
          </select>
          <button
            onClick={refreshData}
            className="p-2 text-slate-600 hover:text-emerald-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* STAGE 1: PURCHASE REQUESTS */}
      {activeStage === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Purchase Requests (PR)</h2>
              <p className="text-xs text-slate-500">Internal requisitions pending quotation comparison or direct conversion</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
              {requests.length} Requests Total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request No</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Department / Branch</th>
                  <th className="py-3 px-4">Required By</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Items / Est Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests
                  .filter(
                    (r) =>
                      (filterDepartment === 'All' || r.department === filterDepartment) &&
                      (r.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.department.toLowerCase().includes(searchTerm.toLowerCase()))
                  )
                  .map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-emerald-900">{req.requestNumber}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{req.requestedBy}</div>
                        <div className="text-xs text-slate-500">{req.reason}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {req.department}
                        <div className="text-xs text-slate-400">{req.branch}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{req.requiredDate}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            req.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : req.priority === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{formatINR(req.estimatedTotal)}</div>
                        <div className="text-xs text-slate-500">{req.items.length} item line(s)</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            req.status === 'Converted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : req.status === 'Approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedRequestForCopy(req);
                              setIsCopyToQuotationModalOpen(true);
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                            title="Copy Request to Vendor Quotation (SAP B1)"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            <span>Copy to Quote</span>
                          </button>
                          <button
                            onClick={() => {
                              setComparisonRequestId(req.id);
                              setIsComparisonModalOpen(true);
                            }}
                            className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition-colors flex items-center gap-1"
                            title="Compare Quotes received from suppliers"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Compare</span>
                          </button>
                          <button
                            onClick={() => {
                              setRelatedDocMeta({
                                docType: 'Request',
                                docId: req.id,
                                docNumber: req.requestNumber,
                              });
                              setIsRelatedDocsModalOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1"
                            title="View SAP B1 Relationship Map"
                          >
                            <Network className="w-3.5 h-3.5 text-slate-500" />
                            <span>Related Docs</span>
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseRequestToDoc(req), true)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View in Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              openDocumentViewer(convertPurchaseRequestToDoc(req), false);
                              setTimeout(() => window.print(), 250);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Purchase Requisition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseRequestToDoc(req), false)}
                            className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Download / View PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE 2: PURCHASE QUOTATIONS */}
      {activeStage === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-900">Purchase Quotations (PQ)</h2>
              <p className="text-xs text-slate-500">Vendor bids and commercial terms review</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewDirectQuotationModalOpen(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                id="btn-stage-direct-quotation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Direct Quotation</span>
              </button>
              <button
                onClick={() => {
                  setComparisonRequestId(requests[0]?.id || '');
                  setIsComparisonModalOpen(true);
                }}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Compare Quotes</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Quotation No</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Date / Valid Until</th>
                  <th className="py-3 px-4">PR Ref</th>
                  <th className="py-3 px-4">Subtotal / Tax</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Payment Terms</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-emerald-900">{quote.quotationNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{quote.vendorName}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{quote.date}</div>
                      <div className="text-xs text-slate-400">Valid: {quote.validUntil}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{quote.requestNumber || '—'}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{formatINR(quote.subtotal)}</div>
                      <div className="text-xs text-slate-400">+ Tax {formatINR(quote.taxTotal)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(quote.grandTotal)}</td>
                    <td className="py-3.5 px-4 text-slate-600">{quote.paymentTerms}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                        {quote.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setComparisonRequestId(quote.requestRefId || '');
                            setIsComparisonModalOpen(true);
                          }}
                          className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition-colors flex items-center gap-1"
                          title="Compare with other supplier bids"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Compare</span>
                        </button>
                        {quote.status !== 'Approved' && quote.status !== 'Converted to PO' && (
                          <button
                            onClick={() => handleConvertToPO(quote.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                          >
                            Accept & Issue PO
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setRelatedDocMeta({
                              docType: 'Quotation',
                              docId: quote.id,
                              docNumber: quote.quotationNumber,
                            });
                            setIsRelatedDocsModalOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1"
                          title="View SAP B1 Relationship Map"
                        >
                          <Network className="w-3.5 h-3.5 text-slate-500" />
                          <span>Related Docs</span>
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseQuotationToDoc(quote), true)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View in Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            openDocumentViewer(convertPurchaseQuotationToDoc(quote), false);
                            setTimeout(() => window.print(), 250);
                          }}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Quotation"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseQuotationToDoc(quote), false)}
                          className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download / View PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE 3: PURCHASE ORDERS */}
      {activeStage === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-900">Approved Purchase Orders (PO)</h2>
              <p className="text-xs text-slate-500">
                Creates automatic Budget Commitment (Sec 96) against allocated department funds
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewDirectOrderModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                id="btn-stage-direct-order"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Direct Purchase Order</span>
              </button>
              <button
                onClick={() => {
                  setSelectedPOForGRPO(undefined);
                  setIsGRPOModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Goods Receipt (GRPO)</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Department / Branch</th>
                  <th className="py-3 px-4">Expected Delivery</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Budget Commitment</th>
                  <th className="py-3 px-4">Invoiced %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((po) => {
                  const invPercent = po.grandTotal > 0 ? Math.round((po.invoicedAmount / po.grandTotal) * 100) : 0;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-emerald-900">{po.poNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{po.vendorName}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {po.department}
                        <div className="text-xs text-slate-400">{po.branch}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{po.expectedDeliveryDate}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(po.grandTotal)}</td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {formatINR(po.budgetCommitmentAmount || po.grandTotal)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, invPercent)}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{invPercent}% invoiced</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {po.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedPOForGRPO(po);
                              setIsGRPOModalOpen(true);
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                            title="Warehouse Goods Receipt (GRPO)"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>GRPO</span>
                          </button>
                          {po.invoicedAmount < po.grandTotal && (
                            <button
                              onClick={() => handleConvertPOToInvoice(po.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                            >
                              Receive Bill
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRelatedDocMeta({
                                docType: 'Order',
                                docId: po.id,
                                docNumber: po.orderNumber,
                              });
                              setIsRelatedDocsModalOpen(true);
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1"
                            title="View SAP B1 Relationship Map"
                          >
                            <Network className="w-3.5 h-3.5 text-slate-500" />
                            <span>Related Docs</span>
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseOrderToDoc(po), true)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View in Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              openDocumentViewer(convertPurchaseOrderToDoc(po), false);
                              setTimeout(() => window.print(), 250);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Purchase Order"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseOrderToDoc(po), false)}
                            className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Download / View PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE 4: GOODS RECEIPT PO (GRPO - WAREHOUSE INWARD) */}
      {activeStage === 'grpo' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Goods Receipt PO (GRPO - Warehouse Inward)</h2>
              <p className="text-xs text-slate-500">
                Physical goods receipt, inspection, and automatic inventory stock increment (SAP B1 Warehouse step)
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedPOForGRPO(undefined);
                setIsGRPOModalOpen(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Add Goods Receipt PO</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">GRPO Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-4">Date / Warehouse</th>
                  <th className="py-3 px-4">Vehicle / Tracking #</th>
                  <th className="py-3 px-4">Items Received</th>
                  <th className="py-3 px-4 text-right">Accepted Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grpos.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                      No Goods Receipt POs recorded yet. Receive items from approved POs.
                    </td>
                  </tr>
                ) : (
                  grpos.map((gr) => {
                    const totalVal = gr.items.reduce((s, it) => s + it.acceptedQty * it.rate, 0);
                    return (
                      <tr key={gr.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-emerald-900">{gr.grpoNumber}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">{gr.vendorName}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-blue-700 font-semibold">{gr.poNumber}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{gr.date}</div>
                          <div className="text-xs text-slate-400">{gr.warehouse}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{gr.vehicleNo || '—'}</div>
                          <div className="text-xs text-slate-400">{gr.trackingNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="font-semibold">{gr.items.length} line(s)</span>
                          <div className="text-xs text-slate-400">Inspected by {gr.receivedBy}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatINR(totalVal)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            {gr.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {gr.status !== 'Invoiced' && (
                              <button
                                onClick={() => {
                                  try {
                                    erpFinanceStorage.convertGRPOToPurchaseInvoice(gr.id);
                                    alert('A/P Purchase Invoice created from Goods Receipt!');
                                    refreshData();
                                    setActiveStage('invoices');
                                  } catch (e: any) {
                                    alert(e?.message || 'Error converting to invoice');
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                Create Invoice
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setRelatedDocMeta({
                                  docType: 'GRPO',
                                  docId: gr.id,
                                  docNumber: gr.grpoNumber,
                                });
                                setIsRelatedDocsModalOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1"
                              title="View SAP B1 Relationship Map"
                            >
                              <Network className="w-3.5 h-3.5 text-slate-500" />
                              <span>Related Docs</span>
                            </button>
                            <button
                              onClick={() => openDocumentViewer(convertGoodsReceiptToDoc(gr), true)}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View in Full Screen"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                openDocumentViewer(convertGoodsReceiptToDoc(gr), false);
                                setTimeout(() => window.print(), 250);
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Print Goods Receipt Note"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDocumentViewer(convertGoodsReceiptToDoc(gr), false)}
                              className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Download / View PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
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
      )}

      {/* STAGE 4: PURCHASE INVOICES (BILLS) */}
      {activeStage === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="font-semibold text-slate-900">Purchase Invoices & Bills</h2>
              <p className="text-xs text-slate-500">
                Tax invoices with HSN/SAC codes, CGST/SGST/IGST breakdown, and TDS deduction on settlement
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewDirectInvoiceModalOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                id="btn-stage-direct-invoice"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Direct Purchase Bill</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Date / Due</th>
                  <th className="py-3 px-4">PO Ref</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-emerald-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{inv.vendorName}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{inv.date}</div>
                      <div className="text-xs text-slate-400">Due: {inv.dueDate}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{inv.poNumber || 'Direct'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(inv.grandTotal)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${inv.balanceAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                        {formatINR(inv.balanceAmount)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          inv.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'Partially Paid'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {inv.balanceAmount > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv);
                              setPaymentAmount(inv.balanceAmount);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            Pay Bill
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setRelatedDocMeta({
                              docType: 'Invoice',
                              docId: inv.id,
                              docNumber: inv.invoiceNumber,
                            });
                            setIsRelatedDocsModalOpen(true);
                          }}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1"
                          title="View SAP B1 Relationship Map"
                        >
                          <Network className="w-3.5 h-3.5 text-slate-500" />
                          <span>Related Docs</span>
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseInvoiceToDoc(inv), true)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View in Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            openDocumentViewer(convertPurchaseInvoiceToDoc(inv), false);
                            setTimeout(() => window.print(), 250);
                          }}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Vendor Bill"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertPurchaseInvoiceToDoc(inv), false)}
                          className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download / View PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE 5: RETURNS & DEBIT NOTES */}
      {activeStage === 'returns' && (
        <div className="space-y-6">
          {/* Pending Return Requests */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="font-semibold text-slate-900">Purchase Return Requests & Direct Returns</h2>
                <p className="text-xs text-slate-500">
                  Manage vendor returns, issue direct Debit Notes, and adjust physical stock quantities
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewDirectReturnModalOpen(true)}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  id="btn-stage-direct-return"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Direct Purchase Return</span>
                </button>
                <button
                  onClick={() => setIsNewReturnModalOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Raise Return Request</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Return Req No</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Invoice Ref</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnRequests.map((rr) => (
                    <tr key={rr.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-emerald-900">{rr.returnRequestNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{rr.vendorName}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{rr.originalInvoiceNumber}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          {rr.reason}
                        </span>
                        {rr.remarks && <div className="text-xs text-slate-500 mt-0.5">{rr.remarks}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(rr.totalAmount)}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            rr.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rr.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {rr.status !== 'Approved' && (
                            <button
                              onClick={() => handleApproveReturnRequest(rr.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                            >
                              Approve & Issue Debit Note
                            </button>
                          )}
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseReturnRequestToDoc(rr), true)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View in Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              openDocumentViewer(convertPurchaseReturnRequestToDoc(rr), false);
                              setTimeout(() => window.print(), 250);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Return Request"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseReturnRequestToDoc(rr), false)}
                            className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Download / View PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Generated Debit Notes */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Debit Notes Register (DN)</h2>
                <p className="text-xs text-slate-500">
                  Reduces vendor accounts payable (Control #2000) and reverses Input Tax Credit (ITC #1400)
                </p>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                Total DN Value: {formatINR(metrics.debitNotesTotal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Note Number</th>
                    <th className="py-3 px-4">Vendor</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Original Bill</th>
                    <th className="py-3 px-4">Subtotal / Tax</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Accounting Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debitNotes.map((dn) => (
                    <tr key={dn.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-rose-900">{dn.noteNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{dn.vendorName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{dn.date}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{dn.originalInvoiceNumber}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{formatINR(dn.subtotal)}</div>
                        <div className="text-xs text-slate-400">+ Tax {formatINR(dn.taxTotal)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-700">-{formatINR(dn.grandTotal)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Posted to GL
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseReturnToDoc(dn), true)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View in Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              openDocumentViewer(convertPurchaseReturnToDoc(dn), false);
                              setTimeout(() => window.print(), 250);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Debit Note"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertPurchaseReturnToDoc(dn), false)}
                            className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Download / View PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW PURCHASE REQUEST */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Create Purchase Request</h3>
            <form onSubmit={handleCreatePR} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Requested By</label>
                  <input
                    type="text"
                    required
                    value={prRequestedBy}
                    onChange={(e) => setPrRequestedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                  <select
                    value={prDepartment}
                    onChange={(e) => setPrDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="General Admin">General Admin</option>
                    <option value="IT & Systems">IT & Systems</option>
                    <option value="Hostel & Facilities">Hostel & Facilities</option>
                    <option value="Academic Operations">Academic Operations</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={prPriority}
                    onChange={(e) => setPrPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={prBranch}
                    onChange={(e) => setPrBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason / Justification</label>
                <textarea
                  value={prReason}
                  onChange={(e) => setPrReason(e.target.value)}
                  placeholder="State the operational reason for this procurement..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  rows={2}
                />
              </div>

              {/* Items Section - Multiple Items Support */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Requisition Items ({prItems.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultItem = itemsMaster[0] || {
                        id: `itm-${Date.now()}`,
                        code: 'GEN-ITEM',
                        name: 'General Material',
                        purchasePrice: 1000,
                        uom: 'NOS',
                      };
                      setPrItems((prev) => [
                        ...prev,
                        {
                          itemId: defaultItem.id,
                          itemCode: defaultItem.code,
                          itemName: defaultItem.name,
                          quantity: 1,
                          unit: defaultItem.uom || 'NOS',
                          estimatedPrice: defaultItem.purchasePrice || 1000,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {prItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Select Item</label>
                          <select
                            value={item.itemId}
                            onChange={(e) => {
                              const found = itemsMaster.find((m) => m.id === e.target.value);
                              if (found) {
                                setPrItems((prev) =>
                                  prev.map((it, iIdx) =>
                                    iIdx === idx
                                      ? {
                                          ...it,
                                          itemId: found.id,
                                          itemCode: found.code,
                                          itemName: found.name,
                                          unit: found.uom || 'NOS',
                                          estimatedPrice: found.purchasePrice || it.estimatedPrice,
                                        }
                                      : it
                                  )
                                );
                              }
                            }}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white font-medium text-slate-800"
                          >
                            {itemsMaster.map((im) => (
                              <option key={im.id} value={im.id}>
                                {im.name} ({im.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        {prItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setPrItems((prev) => prev.filter((_, iIdx) => iIdx !== idx))}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded mt-4"
                            title="Remove this item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Quantity ({item.unit})</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value));
                              setPrItems((prev) =>
                                prev.map((i, iIdx) => (iIdx === idx ? { ...i, quantity: val } : i))
                              );
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Est. Rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.estimatedPrice}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setPrItems((prev) =>
                                prev.map((i, iIdx) => (iIdx === idx ? { ...i, estimatedPrice: val } : i))
                              );
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-slate-900"
                          />
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-medium text-slate-500 mb-0.5">Est. Total</span>
                          <span className="font-bold text-slate-900">{formatINR(item.quantity * item.estimatedPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 p-2 bg-emerald-50 rounded-lg flex items-center justify-between text-xs font-bold text-emerald-950 border border-emerald-200">
                  <span>Grand Total Estimated:</span>
                  <span>
                    {formatINR(
                      prItems.reduce((sum, item) => sum + item.quantity * item.estimatedPrice, 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PAY VENDOR BILL */}
      {isPaymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Record Vendor Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Against {selectedInvoiceForPayment.invoiceNumber} • {selectedInvoiceForPayment.vendorName}
            </p>

            <form onSubmit={handleExecutePayment} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payable Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">TDS Withheld (₹)</label>
                <input
                  type="number"
                  value={tdsDeduction}
                  onChange={(e) => setTdsDeduction(Number(e.target.value))}
                  placeholder="e.g. 1% or 2% Sec 194C"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="NEFT">NEFT (Direct Bank Transfer)</option>
                  <option value="RTGS">RTGS (High Value Settlement)</option>
                  <option value="Cheque">Account Payee Cheque</option>
                  <option value="Bank Transfer">Internal Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm"
                >
                  Confirm & Post Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RAISE RETURN REQUEST */}
      {isNewReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Raise Purchase Return Request</h3>
            <p className="text-xs text-slate-500 mb-4">Will generate Debit Note once approved by Purchase Head</p>

            <form onSubmit={handleCreateReturnRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Vendor</label>
                <select
                  value={retVendorId}
                  onChange={(e) => setRetVendorId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Select Vendor...</option>
                  {parties.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Original Invoice</label>
                <select
                  value={retInvoiceId}
                  onChange={(e) => setRetInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Select Bill...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.vendorName} ({formatINR(inv.grandTotal)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Return</label>
                <select
                  value={retReason}
                  onChange={(e) => setRetReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Damaged">Damaged in Transit</option>
                  <option value="Wrong Item">Wrong Item Delivered</option>
                  <option value="Quality Issue">Quality Below Specification</option>
                  <option value="Excess Quantity">Excess Quantity Supplied</option>
                  <option value="Other">Other Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity to Return</label>
                <input
                  type="number"
                  min="1"
                  value={retQuantity}
                  onChange={(e) => setRetQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detailed Remarks</label>
                <textarea
                  value={retRemarks}
                  onChange={(e) => setRetRemarks(e.target.value)}
                  placeholder="Notes for inspection & debit note memo..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewReturnModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-sm"
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SAP B1 Modals */}
      <CopyToQuotationModal
        isOpen={isCopyToQuotationModalOpen}
        onClose={() => {
          setIsCopyToQuotationModalOpen(false);
          setSelectedRequestForCopy(null);
        }}
        request={selectedRequestForCopy}
        onSuccess={() => {
          refreshData();
          setActiveStage('quotations');
        }}
      />

      <QuotationComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        requestId={comparisonRequestId}
        onPoCreated={() => {
          refreshData();
          setActiveStage('orders');
        }}
      />

      <NewGoodsReceiptModal
        isOpen={isGRPOModalOpen}
        onClose={() => {
          setIsGRPOModalOpen(false);
          setSelectedPOForGRPO(undefined);
        }}
        purchaseOrder={selectedPOForGRPO}
        onSuccess={() => {
          refreshData();
          setActiveStage('grpo');
        }}
      />

      <RelatedDocumentsModal
        isOpen={isRelatedDocsModalOpen}
        onClose={() => setIsRelatedDocsModalOpen(false)}
        docType={relatedDocMeta.docType}
        docId={relatedDocMeta.docId}
        docNumber={relatedDocMeta.docNumber}
        onSelectDoc={(stage, id) => {
          if (stage === 'Request') setActiveStage('requests');
          else if (stage === 'Quotation') setActiveStage('quotations');
          else if (stage === 'Comparison') {
            const reqId = id.replace('comp-', '');
            setComparisonRequestId(reqId || (requests[0]?.id ?? ''));
            setIsComparisonModalOpen(true);
          }
          else if (stage === 'Order') setActiveStage('orders');
          else if (stage === 'Goods Receipt') setActiveStage('grpo');
          else if (stage === 'Invoice') setActiveStage('invoices');
        }}
      />

      {/* Direct Procurement Modals */}
      <NewDirectOrderModal
        isOpen={isNewDirectOrderModalOpen}
        onClose={() => setIsNewDirectOrderModalOpen(false)}
        onOrderCreated={() => {
          refreshData();
          setActiveStage('orders');
        }}
      />

      <NewDirectQuotationModal
        isOpen={isNewDirectQuotationModalOpen}
        onClose={() => setIsNewDirectQuotationModalOpen(false)}
        onQuotationCreated={() => {
          refreshData();
          setActiveStage('quotations');
        }}
      />

      <NewDirectInvoiceModal
        isOpen={isNewDirectInvoiceModalOpen}
        onClose={() => setIsNewDirectInvoiceModalOpen(false)}
        onInvoiceCreated={() => {
          refreshData();
          setActiveStage('invoices');
        }}
      />

      <NewDirectReturnModal
        isOpen={isNewDirectReturnModalOpen}
        onClose={() => setIsNewDirectReturnModalOpen(false)}
        onReturnCreated={() => {
          refreshData();
          setActiveStage('returns');
        }}
      />

      {/* Universal Document Print, PDF & Full-Screen Viewer Modal */}
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
