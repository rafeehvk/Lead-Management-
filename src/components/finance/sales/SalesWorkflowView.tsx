import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  FileText,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Truck,
  RotateCcw,
  DollarSign,
  Download,
  Eye,
  RefreshCw,
  Users,
  Building2,
  PackageCheck,
  CreditCard,
  Layers,
  Sparkles,
  Network,
  Trash2,
  Send,
  Package,
  Printer,
  Maximize2,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import {
  SalesRequest,
  SalesQuotation,
  SalesOrder,
  SalesDelivery,
  SalesInvoiceRecord,
  SalesReturnRequest,
  SalesReturnRecord,
  CreditNoteRecord,
} from '../../../types/finance';
import { SalesRelatedDocumentsModal } from './SalesRelatedDocumentsModal';
import { CopyToSalesQuotationModal } from './CopyToSalesQuotationModal';
import { NewSalesDeliveryModal } from './NewSalesDeliveryModal';
import { NewSalesQuotationModal } from './NewSalesQuotationModal';
import { NewSalesOrderModal } from './NewSalesOrderModal';
import { NewDirectSalesInvoiceModal } from './NewDirectSalesInvoiceModal';
import { DocumentPrintPdfModal } from '../../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../themes/ThemedDocumentRenderer';
import {
  convertSalesRequestToDoc,
  convertSalesQuotationToDoc,
  convertSalesOrderToDoc,
  convertSalesDeliveryToDoc,
  convertSalesInvoiceToDoc,
  convertSalesReturnRequestToDoc,
  convertSalesReturnToDoc,
} from '../../../utils/documentConversionHelpers';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export interface SalesWorkflowViewProps {
  initialStage?: 'requests' | 'quotations' | 'orders' | 'deliveries' | 'invoices' | 'returns';
  subTab?: 'all' | 'requests' | 'quotations' | 'orders' | 'deliveries' | 'invoices' | 'return-requests' | 'returns';
}

export const SalesWorkflowView: React.FC<SalesWorkflowViewProps> = ({
  initialStage = 'orders',
  subTab,
}) => {
  const [activeStage, setActiveStage] = useState<
    'requests' | 'quotations' | 'orders' | 'deliveries' | 'invoices' | 'returns'
  >(initialStage);

  useEffect(() => {
    if (initialStage) {
      setActiveStage(initialStage);
    }
  }, [initialStage]);
  const [searchTerm, setSearchTerm] = useState('');

  // Storage states
  const [requests, setRequests] = useState<SalesRequest[]>(() => erpFinanceStorage.getSalesRequests());
  const [quotations, setQuotations] = useState<SalesQuotation[]>(() => erpFinanceStorage.getSalesQuotations());
  const [orders, setOrders] = useState<SalesOrder[]>(() => erpFinanceStorage.getSalesOrders());
  const [deliveries, setDeliveries] = useState<SalesDelivery[]>(() => erpFinanceStorage.getSalesDeliveries());
  const [invoices, setInvoices] = useState<SalesInvoiceRecord[]>(() => erpFinanceStorage.getSalesInvoices());
  const [returnRequests, setReturnRequests] = useState<SalesReturnRequest[]>(() => erpFinanceStorage.getSalesReturnRequests());
  const [salesReturns, setSalesReturns] = useState<SalesReturnRecord[]>(() => erpFinanceStorage.getSalesReturns());
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>(() => erpFinanceStorage.getCreditNotes());
  const customers = useMemo(() => erpFinanceStorage.getParties().filter((p) => p.type === 'Customer' || p.type === 'Customer & Vendor'), []);
  const itemsMaster = useMemo(() => erpFinanceStorage.getItems(), []);

  // Modals
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isNewReturnModalOpen, setIsNewReturnModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<SalesInvoiceRecord | null>(null);

  // Standalone Individual Doing Modals
  const [isNewQuotationModalOpen, setIsNewQuotationModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isNewDirectInvoiceModalOpen, setIsNewDirectInvoiceModalOpen] = useState(false);

  // SAP B1 Modals
  const [isCopyToQuotationModalOpen, setIsCopyToQuotationModalOpen] = useState(false);
  const [selectedRequestForCopy, setSelectedRequestForCopy] = useState<SalesRequest | null>(null);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedOrderForDelivery, setSelectedOrderForDelivery] = useState<SalesOrder | undefined>(undefined);
  const [isRelatedDocsModalOpen, setIsRelatedDocsModalOpen] = useState(false);
  const [relatedDocMeta, setRelatedDocMeta] = useState<{
    docType: 'Request' | 'Quotation' | 'Order' | 'Delivery' | 'Invoice';
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

  // New Sales Request form
  const [srCustomerId, setSrCustomerId] = useState(customers[0]?.id || '');
  const [srRequestedBy, setSrRequestedBy] = useState('Sales Team');
  const [srPriority, setSrPriority] = useState<'Low' | 'Medium' | 'High' | 'Urgent'>('Medium');
  const [srEstimatedValue, setSrEstimatedValue] = useState(250000);
  const [srItems, setSrItems] = useState([
    {
      itemId: itemsMaster[0]?.id || 'itm-1',
      itemCode: itemsMaster[0]?.code || 'LAP-DELL-XPS',
      itemName: itemsMaster[0]?.name || 'Dell XPS 15 Workstation',
      quantity: 2,
      unit: 'NOS',
      estimatedPrice: 125000,
    },
  ]);

  // Form states for Payment Collection
  const [receiptAmount, setReceiptAmount] = useState<number>(0);
  const [receiptMode, setReceiptMode] = useState<'UPI' | 'NEFT' | 'RTGS' | 'Cheque' | 'Cash'>('UPI');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>('acc-bank-1');

  // Form states for Sales Return Request
  const [retCustomerId, setRetCustomerId] = useState('');
  const [retInvoiceId, setRetInvoiceId] = useState('');
  const [retReason, setRetReason] = useState<SalesReturnRequest['reason']>('Defective Goods');
  const [retCondition, setRetCondition] = useState<SalesReturnRequest['condition']>('Resaleable');
  const [retRemarks, setRetRemarks] = useState('');
  const [retQuantity, setRetQuantity] = useState(1);

  const refreshData = () => {
    setRequests(erpFinanceStorage.getSalesRequests());
    setQuotations(erpFinanceStorage.getSalesQuotations());
    setOrders(erpFinanceStorage.getSalesOrders());
    setDeliveries(erpFinanceStorage.getSalesDeliveries());
    setInvoices(erpFinanceStorage.getSalesInvoices());
    setReturnRequests(erpFinanceStorage.getSalesReturnRequests());
    setSalesReturns(erpFinanceStorage.getSalesReturns());
    setCreditNotes(erpFinanceStorage.getCreditNotes());
  };

  // Metrics
  const metrics = useMemo(() => {
    return {
      requestsCount: requests.length,
      quotationsCount: quotations.length,
      ordersCount: orders.length,
      ordersTotal: orders.reduce((sum, o) => sum + o.grandTotal, 0),
      deliveriesCount: deliveries.length,
      invoicesCount: invoices.length,
      receivablesTotal: invoices.filter((i) => i.status !== 'Paid').reduce((sum, i) => sum + i.balanceAmount, 0),
      returnsCount: returnRequests.length,
      creditNotesTotal: creditNotes.reduce((sum, c) => sum + c.grandTotal, 0),
    };
  }, [requests, quotations, orders, deliveries, invoices, returnRequests, creditNotes]);

  // Handlers
  const handleCreateSalesRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === srCustomerId) || customers[0];
    if (!customer) return;

    erpFinanceStorage.saveSalesRequest({
      customerId: customer.id,
      customerName: customer.name,
      requestedBy: srRequestedBy,
      priority: srPriority,
      estimatedTotal: srEstimatedValue,
      items: srItems.map((i) => ({
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
    erpFinanceStorage.convertSalesRequestToQuotation(requestId);
    refreshData();
    setActiveStage('quotations');
  };

  const handleConvertQuoteToOrder = (quoteId: string) => {
    erpFinanceStorage.convertQuotationToSalesOrder(quoteId);
    refreshData();
    setActiveStage('orders');
  };

  const handleConvertOrderToInvoice = (orderId: string) => {
    try {
      erpFinanceStorage.convertSalesOrderToInvoice(orderId);
      refreshData();
      setActiveStage('invoices');
    } catch (err: any) {
      alert(err.message || 'Error generating invoice');
    }
  };

  const handleApproveReturnRequest = (reqId: string) => {
    erpFinanceStorage.approveSalesReturnRequest(reqId);
    refreshData();
  };

  const handleRecordReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForReceipt) return;

    erpFinanceStorage.postReceipt({
      partyId: selectedInvoiceForReceipt.customerId,
      partyName: selectedInvoiceForReceipt.customerName,
      amount: receiptAmount,
      paymentMethod: (receiptMode === 'Cash' ? 'Cash' : receiptMode === 'Cheque' ? 'Cheque' : receiptMode === 'UPI' ? 'UPI' : 'Bank Transfer') as any,
      accountId: selectedBankAccountId,
      accountName: 'HDFC Corporate Current Account',
      referenceNumber: `REC-${Date.now()}`,
      allocations: [
        {
          invoiceId: selectedInvoiceForReceipt.id,
          invoiceNumber: selectedInvoiceForReceipt.invoiceNumber,
          amount: receiptAmount,
        },
      ],
    });

    refreshData();
    setIsReceiptModalOpen(false);
    setSelectedInvoiceForReceipt(null);
  };

  const handleCreateReturnRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === retCustomerId) || customers[0];
    const invoice = invoices.find((i) => i.id === retInvoiceId) || invoices[0];
    if (!customer || !invoice) return;

    const returnItem = invoice.items[0] || {
      itemId: 'itm-1',
      itemCode: 'LAP-DELL-XPS',
      itemName: 'Dell XPS 15 Workstation',
      hsnCode: '8471',
      quantity: 1,
      unit: 'NOS',
      rate: 145000,
      discount: 0,
      taxPercent: 18,
      cgst: 13050,
      sgst: 13050,
      igst: 0,
      total: 171100,
    };

    const unitPrice = returnItem.rate;
    const taxRate = returnItem.taxPercent || 18;
    const itemSub = unitPrice * retQuantity;
    const tax = (itemSub * taxRate) / 100;
    const grandTotal = itemSub + tax;

    erpFinanceStorage.saveSalesReturnRequest({
      customerId: customer.id,
      customerName: customer.name,
      originalInvoiceId: invoice.id,
      originalInvoiceNumber: invoice.invoiceNumber,
      totalAmount: grandTotal,
      reason: retReason,
      condition: retCondition,
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
    <div className="space-y-6" id="sales-workflow-view">
      {/* Module Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                End-to-End Order-to-Cash (Sec 16 & 17)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Sales & Customer Revenue Cycle</h1>
            <p className="text-sm text-blue-100/80 mt-1">
              Automated workflow with Credit Limit checks, GST e-Invoice IRN/QR, e-Way bills, and return restocking
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="px-3.5 py-2 bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-new-sales-request"
              title="Record Inbound Lead / Sales Enquiry"
            >
              <Plus className="w-3.5 h-3.5" />
              New Enquiry
            </button>
            <button
              onClick={() => setIsNewQuotationModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-indigo-400/40 cursor-pointer"
              id="btn-new-sales-quotation"
              title="Individual Creation: Standalone Sales Quotation"
            >
              <Plus className="w-3.5 h-3.5" />
              New Quotation
            </button>
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-emerald-400/40 cursor-pointer"
              id="btn-new-sales-order"
              title="Individual Creation: Direct Sales Order Booking"
            >
              <Plus className="w-3.5 h-3.5" />
              New Sales Order
            </button>
            <button
              onClick={() => setIsNewDirectInvoiceModalOpen(true)}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-blue-400/40 cursor-pointer"
              id="btn-new-sales-invoice"
              title="Individual Creation: Direct Tax Invoice & GL Posting"
            >
              <Receipt className="w-3.5 h-3.5" />
              Direct Invoice
            </button>
            <button
              onClick={() => {
                setSelectedOrderForDelivery(undefined);
                setIsDeliveryModalOpen(true);
              }}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
              id="btn-new-sales-delivery"
              title="Warehouse Shipment / Delivery Dispatch"
            >
              <Truck className="w-3.5 h-3.5 text-blue-200" />
              Delivery Note
            </button>
            <button
              onClick={() => setIsNewReturnModalOpen(true)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-raise-sales-return"
              title="Customer Return & RMA Request"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-300" />
              Return
            </button>
          </div>
        </div>

        {/* Visual Pipeline Stepper (SAP B1 6-Stage Process) */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveStage('requests')}
            className={`p-3 rounded-xl text-left transition-all border relative group ${
              activeStage === 'requests'
                ? 'bg-white text-blue-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase opacity-75">1. Enquiry / Lead</div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNewRequestModalOpen(true);
                }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  activeStage === 'requests'
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Create Individual Sales Enquiry"
              >
                + New
              </span>
            </div>
            <div className="text-base font-bold mt-0.5">{metrics.requestsCount} Requests</div>
            <div className="text-xs mt-1 truncate opacity-90">Inbound demand</div>
          </button>

          <button
            onClick={() => setActiveStage('quotations')}
            className={`p-3 rounded-xl text-left transition-all border relative group ${
              activeStage === 'quotations'
                ? 'bg-white text-blue-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase opacity-75">2. Quotation</div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNewQuotationModalOpen(true);
                }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  activeStage === 'quotations'
                    ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Create Individual Quotation"
              >
                + New
              </span>
            </div>
            <div className="text-base font-bold mt-0.5">{metrics.quotationsCount} Quotes</div>
            <div className="text-xs mt-1 truncate opacity-90">Proposals & pricing</div>
          </button>

          <button
            onClick={() => setActiveStage('orders')}
            className={`p-3 rounded-xl text-left transition-all border relative group ${
              activeStage === 'orders'
                ? 'bg-white text-blue-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase opacity-75">3. Sales Orders</div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNewOrderModalOpen(true);
                }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  activeStage === 'orders'
                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Create Individual Sales Order"
              >
                + New
              </span>
            </div>
            <div className="text-base font-bold mt-0.5">{metrics.ordersCount} Orders</div>
            <div className="text-xs mt-1 truncate opacity-90">{formatINR(metrics.ordersTotal)}</div>
          </button>

          <button
            onClick={() => setActiveStage('deliveries')}
            className={`p-3 rounded-xl text-left transition-all border relative group ${
              activeStage === 'deliveries'
                ? 'bg-white text-blue-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase opacity-75">4. Delivery / Dispatch</div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedOrderForDelivery(undefined);
                  setIsDeliveryModalOpen(true);
                }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  activeStage === 'deliveries'
                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Create Delivery Note"
              >
                + New
              </span>
            </div>
            <div className="text-base font-bold mt-0.5">{metrics.deliveriesCount} Delivered</div>
            <div className="text-xs mt-1 truncate opacity-90 text-cyan-200 font-semibold">Stock Decrement</div>
          </button>

          <button
            onClick={() => setActiveStage('invoices')}
            className={`p-3 rounded-xl text-left transition-all border relative group ${
              activeStage === 'invoices'
                ? 'bg-white text-blue-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase opacity-75">5. Tax Invoices</div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNewDirectInvoiceModalOpen(true);
                }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  activeStage === 'invoices'
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Create Direct Tax Invoice"
              >
                + New
              </span>
            </div>
            <div className="text-base font-bold mt-0.5">{metrics.invoicesCount} Invoices</div>
            <div className="text-xs mt-1 truncate text-amber-300 font-semibold">AR: {formatINR(metrics.receivablesTotal)}</div>
          </button>

          <button
            onClick={() => setActiveStage('returns')}
            className={`p-3 rounded-xl text-left transition-all border relative group ${
              activeStage === 'returns'
                ? 'bg-white text-blue-950 border-white shadow-md'
                : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-medium uppercase opacity-75">6. Returns & CNs</div>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNewReturnModalOpen(true);
                }}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                  activeStage === 'returns'
                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Raise Customer Return"
              >
                + New
              </span>
            </div>
            <div className="text-base font-bold mt-0.5">{metrics.returnsCount} Returns</div>
            <div className="text-xs mt-1 truncate text-rose-300 font-semibold">CNs: {formatINR(metrics.creditNotesTotal)}</div>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search orders, invoices, customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={refreshData}
          className="p-2 text-slate-600 hover:text-blue-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* STAGE 1: SALES REQUESTS */}
      {activeStage === 'requests' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Sales Requests & Enquiries (SR)</h2>
              <p className="text-xs text-slate-500">Customer requests and inbound leads ready for quotation</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                {requests.length} Enquiries Total
              </span>
              <button
                onClick={() => setIsNewRequestModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sales Enquiry</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Request No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Estimated Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((sr) => (
                  <tr key={sr.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-blue-900">{sr.requestNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{sr.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">{sr.requestedBy}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {sr.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(sr.estimatedTotal)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sr.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <button
                          onClick={() => {
                            setSelectedRequestForCopy(sr);
                            setIsCopyToQuotationModalOpen(true);
                          }}
                          className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                          title="Copy Enquiry to Customer Quotation"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Copy to Quote</span>
                        </button>
                        {sr.status !== 'Converted' && (
                          <button
                            onClick={() => handleConvertToQuotation(sr.id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                          >
                            Generate Quote
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setRelatedDocMeta({
                              docType: 'Request',
                              docId: sr.id,
                              docNumber: sr.requestNumber,
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
                          onClick={() => openDocumentViewer(convertSalesRequestToDoc(sr), true)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View in Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            openDocumentViewer(convertSalesRequestToDoc(sr), false);
                            setTimeout(() => window.print(), 250);
                          }}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Document"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesRequestToDoc(sr), false)}
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

      {/* STAGE 2: SALES QUOTATIONS */}
      {activeStage === 'quotations' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Sales Quotations (SQ)</h2>
              <p className="text-xs text-slate-500">Commercial proposals with tax calculations and validity terms</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                {quotations.length} Quotes Total
              </span>
              <button
                onClick={() => setIsNewQuotationModalOpen(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sales Quotation</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Quotation No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date / Valid Until</th>
                  <th className="py-3 px-4">Subtotal / Tax</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((sq) => (
                  <tr key={sq.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-blue-900">{sq.quotationNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{sq.customerName}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{sq.date}</div>
                      <div className="text-xs text-slate-400">Valid: {sq.validUntil}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{formatINR(sq.subtotal)}</div>
                      <div className="text-xs text-slate-400">+ Tax {formatINR(sq.taxTotal)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(sq.grandTotal)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sq.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {sq.status !== 'Converted to Order' && (
                          <button
                            onClick={() => handleConvertQuoteToOrder(sq.id)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                          >
                            Accept → Create Order
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setRelatedDocMeta({
                              docType: 'Quotation',
                              docId: sq.id,
                              docNumber: sq.quotationNumber,
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
                          onClick={() => openDocumentViewer(convertSalesQuotationToDoc(sq), true)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View in Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            openDocumentViewer(convertSalesQuotationToDoc(sq), false);
                            setTimeout(() => window.print(), 250);
                          }}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Quotation"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesQuotationToDoc(sq), false)}
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

      {/* STAGE 3: SALES ORDERS */}
      {activeStage === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Confirmed Sales Orders (SO)</h2>
              <p className="text-xs text-slate-500">
                Enforces Customer Credit Limit checks (Block/Warning/Approval) before tax invoice dispatch
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewOrderModalOpen(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Sales Order</span>
              </button>
              <button
                onClick={() => {
                  setSelectedOrderForDelivery(undefined);
                  setIsDeliveryModalOpen(true);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Dispatch Delivery Note</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Date / Delivery</th>
                  <th className="py-3 px-4">Credit Limit Status</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Invoiced %</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((so) => {
                  const invPercent = so.grandTotal > 0 ? Math.round((so.invoicedAmount / so.grandTotal) * 100) : 0;
                  return (
                    <tr key={so.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-blue-900">{so.orderNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{so.customerName}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{so.date}</div>
                        <div className="text-xs text-slate-400">Due: {so.deliveryDate}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {so.creditLimitCheckStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatINR(so.grandTotal)}</td>
                      <td className="py-3.5 px-4">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, invPercent)}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 mt-1">{invPercent}% invoiced</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {so.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => {
                              setSelectedOrderForDelivery(so);
                              setIsDeliveryModalOpen(true);
                            }}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                            title="Warehouse Shipment / Delivery Note"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                          {so.invoicedAmount < so.grandTotal && (
                            <button
                              onClick={() => handleConvertOrderToInvoice(so.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                            >
                              Direct Invoice
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setRelatedDocMeta({
                                docType: 'Order',
                                docId: so.id,
                                docNumber: so.orderNumber,
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
                            onClick={() => openDocumentViewer(convertSalesOrderToDoc(so), true)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View in Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              openDocumentViewer(convertSalesOrderToDoc(so), false);
                              setTimeout(() => window.print(), 250);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Sales Order"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertSalesOrderToDoc(so), false)}
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

      {/* STAGE 4: SALES DELIVERIES (WAREHOUSE DISPATCH & INVENTORY REDUCTION) */}
      {activeStage === 'deliveries' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Sales Deliveries & Shipments (SAP B1 Outward)</h2>
              <p className="text-xs text-slate-500">
                Warehouse dispatch notes, e-Way tracking, and automatic finished goods inventory deduction
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedOrderForDelivery(undefined);
                setIsDeliveryModalOpen(true);
              }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Create Delivery Note</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Delivery No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Order Ref</th>
                  <th className="py-3 px-4">Date / Warehouse</th>
                  <th className="py-3 px-4">Transporter / Tracking</th>
                  <th className="py-3 px-4">Items Dispatched</th>
                  <th className="py-3 px-4 text-right">Value</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400 text-xs">
                      No deliveries dispatched yet. Dispatch confirmed Sales Orders from warehouse.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((del) => {
                    const totalVal = del.items.reduce((s, it) => s + it.deliveredQty * it.rate, 0);
                    return (
                      <tr key={del.id} className="hover:bg-slate-50/75 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-blue-900">{del.deliveryNumber}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-900">{del.customerName}</td>
                        <td className="py-3.5 px-4 font-mono text-xs text-indigo-700 font-semibold">{del.orderNumber}</td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{del.date}</div>
                          <div className="text-xs text-slate-400">{del.warehouse}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{del.transporter || 'Direct Courier'}</div>
                          <div className="text-xs text-slate-400">{del.trackingNumber || del.vehicleNo}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <span className="font-semibold">{del.items.length} product(s)</span>
                          <div className="text-xs text-slate-400">By {del.dispatchedBy}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">{formatINR(totalVal)}</td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {del.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {del.status !== 'Invoiced' && (
                              <button
                                onClick={() => {
                                  try {
                                    erpFinanceStorage.convertSalesDeliveryToInvoice(del.id);
                                    alert('Tax Invoice generated successfully from Delivery Note!');
                                    refreshData();
                                    setActiveStage('invoices');
                                  } catch (e: any) {
                                    alert(e?.message || 'Error converting to invoice');
                                  }
                                }}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                Create Invoice
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setRelatedDocMeta({
                                  docType: 'Delivery',
                                  docId: del.id,
                                  docNumber: del.deliveryNumber,
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
                              onClick={() => openDocumentViewer(convertSalesDeliveryToDoc(del), true)}
                              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="View in Full Screen"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                openDocumentViewer(convertSalesDeliveryToDoc(del), false);
                                setTimeout(() => window.print(), 250);
                              }}
                              className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Print Delivery Challan"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDocumentViewer(convertSalesDeliveryToDoc(del), false)}
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

      {/* STAGE 4: SALES INVOICES */}
      {activeStage === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Tax Invoices (GST & e-Invoice IRN)</h2>
              <p className="text-xs text-slate-500">
                Official GST sales tax invoices with e-Way bills and 64-character IRN hash
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md">
                {invoices.length} Invoices Total
              </span>
              <button
                onClick={() => setIsNewDirectInvoiceModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Direct Invoice</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">e-Invoice IRN & e-Way Bill</th>
                  <th className="py-3 px-4">Date / Due</th>
                  <th className="py-3 px-4">Grand Total</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-blue-900">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{inv.customerName}</td>
                    <td className="py-3.5 px-4">
                      {inv.irnNumber ? (
                        <div className="space-y-0.5">
                          <div className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <QrCode className="w-3 h-3 text-emerald-600" />
                            IRN: {inv.irnNumber.substring(0, 10)}...
                          </div>
                          {inv.ewayBillNumber && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-600 font-mono">
                              <Truck className="w-3 h-3 text-slate-400" />
                              eWay: {inv.ewayBillNumber}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Exempt / Standard B2B</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>{inv.date}</div>
                      <div className="text-xs text-slate-400">Due: {inv.dueDate}</div>
                    </td>
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
                              setSelectedInvoiceForReceipt(inv);
                              setReceiptAmount(inv.balanceAmount);
                              setIsReceiptModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            Collect Receipt
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Collected
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
                          onClick={() => openDocumentViewer(convertSalesInvoiceToDoc(inv), true)}
                          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View in Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            openDocumentViewer(convertSalesInvoiceToDoc(inv), false);
                            setTimeout(() => window.print(), 250);
                          }}
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openDocumentViewer(convertSalesInvoiceToDoc(inv), false)}
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

      {/* STAGE 5: RETURNS & CREDIT NOTES */}
      {activeStage === 'returns' && (
        <div className="space-y-6">
          {/* Pending Sales Return Requests */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Sales Return Requests (SRR)</h2>
                <p className="text-xs text-slate-500">
                  Customer returns undergoing quality inspection; restocks inventory if condition is Resaleable
                </p>
              </div>
              <button
                onClick={() => setIsNewReturnModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Raise Return Request</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Return Req No</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Invoice Ref</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {returnRequests.map((rr) => (
                    <tr key={rr.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-blue-900">{rr.returnRequestNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{rr.customerName}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{rr.originalInvoiceNumber}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            rr.condition === 'Resaleable'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rr.condition}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{rr.reason}</td>
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
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
                            >
                              Approve & Issue Credit Note
                            </button>
                          )}
                          <button
                            onClick={() => openDocumentViewer(convertSalesReturnRequestToDoc(rr), true)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View in Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              openDocumentViewer(convertSalesReturnRequestToDoc(rr), false);
                              setTimeout(() => window.print(), 250);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Return Request"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertSalesReturnRequestToDoc(rr), false)}
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

          {/* Credit Notes Register */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">Credit Notes Register (CN)</h2>
                <p className="text-xs text-slate-500">
                  Reduces customer receivable and reverses Output GST liability
                </p>
              </div>
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded border border-rose-200">
                Total CN Value: {formatINR(metrics.creditNotesTotal)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Note Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Original Invoice</th>
                    <th className="py-3 px-4">Subtotal / Tax</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">GL Posting</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {creditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-rose-900">{cn.noteNumber}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">{cn.customerName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{cn.date}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-slate-600">{cn.originalInvoiceNumber}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{formatINR(cn.subtotal)}</div>
                        <div className="text-xs text-slate-400">+ Tax {formatINR(cn.taxTotal)}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-700">-{formatINR(cn.grandTotal)}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Posted to GL
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDocumentViewer(convertSalesReturnToDoc(cn), true)}
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View in Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              openDocumentViewer(convertSalesReturnToDoc(cn), false);
                              setTimeout(() => window.print(), 250);
                            }}
                            className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Credit Note"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openDocumentViewer(convertSalesReturnToDoc(cn), false)}
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

      {/* MODAL: NEW SALES REQUEST */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Record Sales Enquiry</h3>
            <form onSubmit={handleCreateSalesRequest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Customer</label>
                  <select
                    value={srCustomerId}
                    onChange={(e) => setSrCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Sales Rep / Requested By</label>
                  <input
                    type="text"
                    required
                    value={srRequestedBy}
                    onChange={(e) => setSrRequestedBy(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={srPriority}
                    onChange={(e) => setSrPriority(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estimated Total Value (₹)</label>
                  <input
                    type="number"
                    value={srItems.reduce((s, it) => s + it.quantity * it.estimatedPrice, 0)}
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Items Section - Multiple Items */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
                    Requested Items ({srItems.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const defaultItem = itemsMaster[0] || {
                        id: `itm-${Date.now()}`,
                        code: 'GEN-PROD',
                        name: 'General Product',
                        sellingPrice: 15000,
                        uom: 'NOS',
                      };
                      setSrItems((prev) => [
                        ...prev,
                        {
                          itemId: defaultItem.id,
                          itemCode: defaultItem.code,
                          itemName: defaultItem.name,
                          quantity: 1,
                          unit: defaultItem.uom || 'NOS',
                          estimatedPrice: defaultItem.sellingPrice || 15000,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md border border-blue-200 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {srItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Product</label>
                          <select
                            value={item.itemId}
                            onChange={(e) => {
                              const found = itemsMaster.find((m) => m.id === e.target.value);
                              if (found) {
                                setSrItems((prev) =>
                                  prev.map((it, iIdx) =>
                                    iIdx === idx
                                      ? {
                                          ...it,
                                          itemId: found.id,
                                          itemCode: found.code,
                                          itemName: found.name,
                                          unit: found.uom || 'NOS',
                                          estimatedPrice: found.sellingPrice || it.estimatedPrice,
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
                        {srItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSrItems((prev) => prev.filter((_, iIdx) => iIdx !== idx))}
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
                              setSrItems((prev) =>
                                prev.map((i, iIdx) => (iIdx === idx ? { ...i, quantity: val } : i))
                              );
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Target Rate (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={item.estimatedPrice}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value));
                              setSrItems((prev) =>
                                prev.map((i, iIdx) => (iIdx === idx ? { ...i, estimatedPrice: val } : i))
                              );
                            }}
                            className="w-full px-2 py-1 border border-slate-200 rounded bg-white text-slate-900"
                          />
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-medium text-slate-500 mb-0.5">Subtotal</span>
                          <span className="font-bold text-slate-900">{formatINR(item.quantity * item.estimatedPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm"
                >
                  Save Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COLLECT RECEIPT */}
      {isReceiptModalOpen && selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Collect Customer Payment</h3>
            <p className="text-xs text-slate-500 mb-4">
              Invoice {selectedInvoiceForReceipt.invoiceNumber} • {selectedInvoiceForReceipt.customerName}
            </p>

            <form onSubmit={handleRecordReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Receipt Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Payment Channel</label>
                <select
                  value={receiptMode}
                  onChange={(e) => setReceiptMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="UPI">UPI / Instant QR</option>
                  <option value="NEFT">NEFT / RTGS Wire Transfer</option>
                  <option value="Cheque">Bank Cheque</option>
                  <option value="Cash">Cash Receipt</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm"
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
            <h3 className="text-lg font-bold text-slate-900 mb-1">Raise Customer Return</h3>
            <p className="text-xs text-slate-500 mb-4">Inspection will determine restocking and Credit Note issue</p>

            <form onSubmit={handleCreateReturnRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Customer</label>
                <select
                  value={retCustomerId}
                  onChange={(e) => setRetCustomerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Select Customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Sales Invoice</label>
                <select
                  value={retInvoiceId}
                  onChange={(e) => setRetInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Select Invoice...</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} — {inv.customerName} ({formatINR(inv.grandTotal)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Item Condition</label>
                <select
                  value={retCondition}
                  onChange={(e) => setRetCondition(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Resaleable">Resaleable (Restock to inventory)</option>
                  <option value="Damaged">Damaged / Scrap (Do not restock)</option>
                  <option value="Inspection Needed">Pending Technical Inspection</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Return</label>
                <select
                  value={retReason}
                  onChange={(e) => setRetReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                >
                  <option value="Defective Goods">Defective Goods</option>
                  <option value="Wrong Item Shipped">Wrong Item Shipped</option>
                  <option value="Excess Quantity">Excess Quantity</option>
                  <option value="Cancelled by Customer">Cancelled by Customer</option>
                  <option value="Other">Other Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={retQuantity}
                  onChange={(e) => setRetQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Remarks</label>
                <textarea
                  value={retRemarks}
                  onChange={(e) => setRetRemarks(e.target.value)}
                  placeholder="Inspection observations..."
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
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm"
                >
                  Submit Return Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SAP B1 Modals for Sales */}
      <CopyToSalesQuotationModal
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

      <NewSalesDeliveryModal
        isOpen={isDeliveryModalOpen}
        onClose={() => {
          setIsDeliveryModalOpen(false);
          setSelectedOrderForDelivery(undefined);
        }}
        salesOrder={selectedOrderForDelivery}
        onSuccess={() => {
          refreshData();
          setActiveStage('deliveries');
        }}
      />

      <SalesRelatedDocumentsModal
        isOpen={isRelatedDocsModalOpen}
        onClose={() => setIsRelatedDocsModalOpen(false)}
        docType={relatedDocMeta.docType}
        docId={relatedDocMeta.docId}
        docNumber={relatedDocMeta.docNumber}
      />

      {/* Standalone Individual Doing Modals */}
      <NewSalesQuotationModal
        isOpen={isNewQuotationModalOpen}
        onClose={() => setIsNewQuotationModalOpen(false)}
        onSuccess={() => {
          refreshData();
          setActiveStage('quotations');
        }}
      />

      <NewSalesOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSuccess={() => {
          refreshData();
          setActiveStage('orders');
        }}
      />

      <NewDirectSalesInvoiceModal
        isOpen={isNewDirectInvoiceModalOpen}
        onClose={() => setIsNewDirectInvoiceModalOpen(false)}
        onSuccess={() => {
          refreshData();
          setActiveStage('invoices');
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
        category="sales"
        initialFullScreen={openInFullScreen}
      />
    </div>
  );
};
