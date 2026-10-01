import React, { useState, useMemo } from 'react';
import {
  X,
  FileText,
  FileCheck,
  ShoppingBag,
  Package,
  Receipt,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  ShieldCheck,
  BarChart3,
  Tag,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  Info,
  Clock,
  ChevronRight,
  Check,
  Copy,
  PanelRightClose,
  Maximize2,
  Truck,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Search,
  Printer,
  ChevronDown,
  Download,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { DocumentPrintPdfModal } from '../../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../themes/ThemedDocumentRenderer';
import {
  convertPurchaseRequestToDoc,
  convertPurchaseQuotationToDoc,
  convertPurchaseOrderToDoc,
  convertGoodsReceiptToDoc,
  convertPurchaseInvoiceToDoc,
} from '../../../utils/documentConversionHelpers';
import {
  ProcurementTraceabilityChain,
  ProcurementTraceabilityStage,
  PurchaseRequest,
  PurchaseQuotation,
  PurchaseOrder,
  GoodsReceiptPO,
  PurchaseInvoiceRecord,
} from '../../../types/finance';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export interface RelatedDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: 'Request' | 'Quotation' | 'PO' | 'Order' | 'GRPO' | 'Invoice';
  docId: string;
  docNumber: string;
  onSelectDoc?: (stage: string, id: string) => void;
  displayMode?: 'modal' | 'sidepanel';
}

interface ReconciledItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  requestedQty: number;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  invoicedQty: number;
  unit: string;
  unitPrice: number;
  status: 'Complete' | 'Partial' | 'Pending Receipt' | 'Pending PO';
}

export const RelatedDocumentsModal: React.FC<RelatedDocumentsModalProps> = ({
  isOpen,
  onClose,
  docType,
  docId,
  docNumber,
  onSelectDoc,
  displayMode = 'modal',
}) => {
  const [viewMode, setViewMode] = useState<'modal' | 'sidepanel'>(displayMode);
  const [activeTab, setActiveTab] = useState<'map' | 'reconciliation' | 'comparison' | 'timeline'>('map');
  const [copiedRef, setCopiedRef] = useState(false);
  const [selectedInspectStage, setSelectedInspectStage] = useState<string | null>(null);

  // Selector for switching between different active reference chains
  const [currentDocType, setCurrentDocType] = useState<'Request' | 'Quotation' | 'Order' | 'Goods Receipt' | 'Invoice'>(
    docType === 'PO' ? 'Order' : docType === 'GRPO' ? 'Goods Receipt' : (docType as any)
  );
  const [currentDocId, setCurrentDocId] = useState<string>(docId);

  // Sync state if incoming props change
  React.useEffect(() => {
    setCurrentDocType(docType === 'PO' ? 'Order' : docType === 'GRPO' ? 'Goods Receipt' : (docType as any));
    setCurrentDocId(docId);
  }, [docType, docId]);

  // All available requests and orders for chain quick-switch dropdown
  const allRequests = useMemo(() => erpFinanceStorage.getPurchaseRequests(), [isOpen]);
  const allOrders = useMemo(() => erpFinanceStorage.getPurchaseOrders(), [isOpen]);

  if (!isOpen) return null;

  const traceability: ProcurementTraceabilityChain = erpFinanceStorage.getProcurementTraceabilityChain(
    currentDocType,
    currentDocId
  );

  const copyRefToClipboard = (ref: string) => {
    try {
      navigator.clipboard.writeText(ref);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {}
  };

  const getStageIcon = (stage: ProcurementTraceabilityStage['stage'], className = 'w-4 h-4') => {
    switch (stage) {
      case 'Request':
        return <FileText className={`${className} text-amber-600`} />;
      case 'Quotation':
        return <FileCheck className={`${className} text-blue-600`} />;
      case 'Comparison':
        return <BarChart3 className={`${className} text-indigo-600`} />;
      case 'Order':
        return <ShoppingBag className={`${className} text-purple-600`} />;
      case 'Goods Receipt':
        return <Package className={`${className} text-teal-600`} />;
      case 'Invoice':
        return <Receipt className={`${className} text-rose-600`} />;
      default:
        return <FileText className={`${className} text-slate-600`} />;
    }
  };

  const getStageBadgeStyle = (stage: ProcurementTraceabilityStage['stage']) => {
    switch (stage) {
      case 'Request':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Quotation':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Comparison':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'Order':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Goods Receipt':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'Invoice':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-800 border-slate-200';
    }
  };

  // Compute item quantity reconciliation across PR -> PO -> GRPO -> PI
  const reconciledItems: ReconciledItem[] = useMemo(() => {
    const itemMap = new Map<string, ReconciledItem>();

    // 1. Ingest PR items
    if (traceability.request?.items) {
      traceability.request.items.forEach((it) => {
        itemMap.set(it.itemId, {
          itemId: it.itemId,
          itemCode: it.itemCode,
          itemName: it.itemName,
          requestedQty: it.quantity,
          orderedQty: 0,
          receivedQty: 0,
          acceptedQty: 0,
          invoicedQty: 0,
          unit: it.unit || 'NOS',
          unitPrice: it.estimatedPrice || 0,
          status: 'Pending PO',
        });
      });
    }

    // 2. Ingest PO items
    if (traceability.order?.items) {
      traceability.order.items.forEach((it) => {
        const existing = itemMap.get(it.itemId);
        const itemRate = (it as any).rate ?? (it as any).unitPrice ?? 0;
        if (existing) {
          existing.orderedQty = it.quantity;
          if (itemRate) existing.unitPrice = itemRate;
        } else {
          itemMap.set(it.itemId, {
            itemId: it.itemId,
            itemCode: it.itemCode,
            itemName: it.itemName,
            requestedQty: 0,
            orderedQty: it.quantity,
            receivedQty: 0,
            acceptedQty: 0,
            invoicedQty: 0,
            unit: 'NOS',
            unitPrice: itemRate,
            status: 'Pending Receipt',
          });
        }
      });
    }

    // 3. Ingest GRPO items
    if (traceability.goodsReceipt?.items) {
      traceability.goodsReceipt.items.forEach((it) => {
        const existing = itemMap.get(it.itemId);
        if (existing) {
          existing.receivedQty = it.receivedQty;
          existing.acceptedQty = it.acceptedQty || it.receivedQty;
        }
      });
    }

    // 4. Ingest Invoice items
    if (traceability.invoice?.items) {
      traceability.invoice.items.forEach((it) => {
        const existing = itemMap.get(it.itemId);
        if (existing) {
          existing.invoicedQty = it.quantity;
        }
      });
    }

    // Calculate status for each item
    return Array.from(itemMap.values()).map((row) => {
      let status: 'Complete' | 'Partial' | 'Pending Receipt' | 'Pending PO' = 'Pending PO';
      if (row.invoicedQty > 0 && row.acceptedQty >= row.orderedQty && row.invoicedQty >= row.orderedQty) {
        status = 'Complete';
      } else if (row.acceptedQty > 0 || row.invoicedQty > 0) {
        status = 'Partial';
      } else if (row.orderedQty > 0) {
        status = 'Pending Receipt';
      }
      return { ...row, status };
    });
  }, [traceability]);

  // Stage mapping for navigation
  const handleOpenDoc = (stage: ProcurementTraceabilityStage['stage'], targetDocId: string) => {
    if (!onSelectDoc) return;
    onClose();
    onSelectDoc(stage, targetDocId);
  };

  // Universal Document Print, PDF & Full-Screen Viewer State
  const [printPdfModalOpen, setPrintPdfModalOpen] = useState(false);
  const [activePrintDocument, setActivePrintDocument] = useState<ThemedDocumentData | null>(null);
  const [openInFullScreen, setOpenInFullScreen] = useState(false);

  const handleOpenPurchaseDocPrint = (stage: string, docId?: string, fullScreen = false) => {
    let docData: ThemedDocumentData | null = null;
    if (stage === 'Request' && traceability.request) {
      docData = convertPurchaseRequestToDoc(traceability.request);
    } else if (stage === 'Order' && traceability.order) {
      docData = convertPurchaseOrderToDoc(traceability.order);
    } else if (stage === 'GoodsReceipt' && traceability.goodsReceipt) {
      docData = convertGoodsReceiptToDoc(traceability.goodsReceipt);
    } else if (stage === 'Invoice' && traceability.invoice) {
      docData = convertPurchaseInvoiceToDoc(traceability.invoice);
    } else if (stage === 'Quotation') {
      const q = docId ? traceability.quotations.find((it) => it.id === docId) : traceability.quotations[0];
      if (q) docData = convertPurchaseQuotationToDoc(q);
    }

    // Fallback: search in storage if not in traceability
    if (!docData && docId) {
      if (stage === 'Request') {
        const it = erpFinanceStorage.getPurchaseRequests().find((r) => r.id === docId);
        if (it) docData = convertPurchaseRequestToDoc(it);
      } else if (stage === 'Quotation') {
        const it = erpFinanceStorage.getPurchaseQuotations().find((q) => q.id === docId);
        if (it) docData = convertPurchaseQuotationToDoc(it);
      } else if (stage === 'Order') {
        const it = erpFinanceStorage.getPurchaseOrders().find((o) => o.id === docId);
        if (it) docData = convertPurchaseOrderToDoc(it);
      } else if (stage === 'GoodsReceipt') {
        const it = erpFinanceStorage.getGoodsReceiptPOs().find((g) => g.id === docId);
        if (it) docData = convertGoodsReceiptToDoc(it);
      } else if (stage === 'Invoice') {
        const it = erpFinanceStorage.getPurchaseInvoices().find((i) => i.id === docId);
        if (it) docData = convertPurchaseInvoiceToDoc(it);
      }
    }

    if (docData) {
      setActivePrintDocument(docData);
      setOpenInFullScreen(fullScreen);
      setPrintPdfModalOpen(true);
    }
  };

  const containerContent = (
    <div className="flex flex-col h-full overflow-hidden bg-white text-slate-800">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-slate-200/90 bg-gradient-to-r from-slate-50 via-emerald-50/40 to-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Unified Procurement Traceability Chain
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                PR ➔ PQ ➔ COMP ➔ PO ➔ GRPO ➔ PI
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-600 flex-wrap">
              <span className="font-medium text-slate-700 flex items-center gap-1">
                Active Document: <strong className="text-slate-900">{currentDocType} #{docNumber || traceability.sharedReferenceId}</strong>
              </span>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200 font-mono text-[11px] shadow-2xs">
                <Tag className="w-3 h-3 text-emerald-600" />
                <span>Shared Ref ID: <strong className="text-emerald-800 font-bold">{traceability.sharedReferenceId}</strong></span>
                <button
                  onClick={() => copyRefToClipboard(traceability.sharedReferenceId)}
                  className="ml-1 text-slate-400 hover:text-emerald-700 cursor-pointer transition-colors"
                  title="Copy Shared Reference ID"
                >
                  {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Chain Switcher Dropdown */}
          <div className="relative hidden md:block">
            <select
              value={currentDocId}
              onChange={(e) => {
                const selId = e.target.value;
                const foundReq = allRequests.find((r) => r.id === selId);
                if (foundReq) {
                  setCurrentDocType('Request');
                  setCurrentDocId(foundReq.id);
                  return;
                }
                const foundPo = allOrders.find((o) => o.id === selId);
                if (foundPo) {
                  setCurrentDocType('Order');
                  setCurrentDocId(foundPo.id);
                }
              }}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden cursor-pointer"
            >
              <optgroup label="Recent Purchase Requests">
                {allRequests.map((r) => (
                  <option key={r.id} value={r.id}>
                    PR #{r.requestNumber} ({r.department})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Recent Purchase Orders">
                {allOrders.map((o) => (
                  <option key={o.id} value={o.id}>
                    PO #{o.orderNumber} ({o.vendorName})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            onClick={() => setViewMode(viewMode === 'modal' ? 'sidepanel' : 'modal')}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer text-xs flex items-center gap-1 border border-slate-200"
            title={viewMode === 'modal' ? 'Switch to Side Panel view' : 'Expand to Center Modal'}
          >
            {viewMode === 'modal' ? (
              <>
                <PanelRightClose className="w-4 h-4 text-emerald-700" />
                <span className="hidden sm:inline font-medium">Side Panel</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-emerald-700" />
                <span className="hidden sm:inline font-medium">Center Modal</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'map'
                ? 'bg-white text-emerald-900 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${activeTab === 'map' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>Traceability Map & Chain</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {traceability.completedCount}/{traceability.totalStages}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reconciliation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'reconciliation'
                ? 'bg-white text-emerald-900 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Package className={`w-3.5 h-3.5 ${activeTab === 'reconciliation' ? 'text-teal-600' : 'text-slate-400'}`} />
            <span>Quantity Reconciliation</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800">
              {reconciledItems.length} Items
            </span>
          </button>

          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'comparison'
                ? 'bg-white text-emerald-900 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <BarChart3 className={`w-3.5 h-3.5 ${activeTab === 'comparison' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>Vendor Quotation Bids (L1)</span>
            {traceability.quotations.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                {traceability.quotations.length} Bids
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-white text-emerald-900 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${activeTab === 'timeline' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span>Audit Timeline</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 shrink-0">
          <span className="font-semibold text-slate-700">{traceability.progressPercentage}%</span> Complete
          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${traceability.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* TAB 1: TRACEABILITY MAP & CHAIN */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Visual Interactive Flowchart Stepper */}
            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  Visual Procurement Relationship Diagram (SAP B1 Standard)
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Shared Ref: <strong className="text-slate-800">{traceability.sharedReferenceId}</strong>
                </span>
              </div>

              {/* Horizontal / Responsive Step Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
                {traceability.stages.map((stageItem, index) => {
                  const isSelected = selectedInspectStage === stageItem.stage;
                  return (
                    <div key={stageItem.sequence} className="relative">
                      <button
                        onClick={() => setSelectedInspectStage(isSelected ? null : stageItem.stage)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer h-full flex flex-col justify-between ${
                          stageItem.isCurrent
                            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400/40 shadow-xs'
                            : stageItem.isCompleted
                            ? isSelected
                              ? 'bg-blue-50 border-blue-400 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                            : 'bg-slate-100/50 border-dashed border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                              {getStageIcon(stageItem.stage, 'w-3 h-3')}
                              Step {stageItem.sequence}
                            </span>
                            {stageItem.isCompleted ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            )}
                          </div>

                          <div className="text-xs font-bold text-slate-900 truncate">
                            {stageItem.stageName}
                          </div>
                          <div className="text-[11px] font-medium text-slate-600 truncate mt-0.5 font-mono">
                            {stageItem.docNumber}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] flex items-center justify-between">
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded-full border ${getStageBadgeStyle(
                              stageItem.stage
                            )}`}
                          >
                            {stageItem.status}
                          </span>
                          {stageItem.amount > 0 && (
                            <span className="font-bold text-slate-800">
                              {formatINR(stageItem.amount)}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick KPI / Summary Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] font-medium block">Total Lifecycle Stages</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  6 Stages Linked
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
                  {traceability.completedCount} Active / Completed
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] font-medium block">Committed Order Value</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {traceability.order ? formatINR(traceability.order.grandTotal) : 'Pending PO'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 inline-block">
                  {traceability.order?.vendorName || 'No Vendor Assigned'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] font-medium block">Warehouse Receipt Status</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {traceability.goodsReceipt ? 'Stock Inwarded' : 'Pending Inward'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 inline-block">
                  {traceability.goodsReceipt?.warehouse || 'Central Warehouse'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-slate-500 text-[11px] font-medium block">A/P Invoice Balance Due</span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {traceability.invoice ? formatINR(traceability.invoice.balanceAmount) : 'Pending Invoice'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 inline-block">
                  Status: {traceability.invoice?.status || 'Unbilled'}
                </span>
              </div>
            </div>

            {/* Detailed Stage Cards (Full Chain) */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Detailed Procurement Chain Walkthrough</span>
                <span className="text-[11px] font-normal text-slate-500">
                  Click 'Open' to switch view to any document
                </span>
              </h4>

              {traceability.stages.map((stg) => {
                const isSelected = selectedInspectStage === stg.stage;
                return (
                  <div
                    key={stg.sequence}
                    className={`rounded-2xl border transition-all p-4 ${
                      stg.isCurrent
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-300'
                        : isSelected
                        ? 'border-blue-400 bg-blue-50/40 shadow-xs'
                        : stg.isCompleted
                        ? 'border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                        : 'border-dashed border-slate-200 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 shrink-0">
                          {getStageIcon(stg.stage)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStageBadgeStyle(
                                stg.stage
                              )}`}
                            >
                              Step {stg.sequence}: {stg.stageName}
                            </span>
                            <span className="text-sm font-bold text-slate-900 font-mono">
                              {stg.docNumber}
                            </span>
                            {stg.isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white shadow-2xs">
                                Active Document
                              </span>
                            )}
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {stg.status}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              {stg.partyName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {stg.date}
                            </span>
                            {stg.summaryText && (
                              <span className="text-slate-600 italic">
                                • {stg.summaryText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {stg.amount > 0 && (
                          <div className="text-right">
                            <span className="text-sm font-bold text-slate-900">
                              {formatINR(stg.amount)}
                            </span>
                            <span className="text-[10px] block text-slate-500">
                              Document Total
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenPurchaseDocPrint(stg.stage, stg.docId, true)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Full Screen"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenPurchaseDocPrint(stg.stage, stg.docId, false)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Print Document"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenPurchaseDocPrint(stg.stage, stg.docId, false)}
                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {onSelectDoc && stg.docId && !stg.isCurrent && (
                            <button
                              onClick={() => handleOpenDoc(stg.stage, stg.docId)}
                              className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3 text-emerald-600" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quotations Sub-List when multi-vendor bids are submitted */}
                    {stg.stage === 'Quotation' && traceability.quotations.length > 1 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          All Linked Supplier Bids ({traceability.quotations.length} quotes submitted):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {traceability.quotations.map((q) => (
                            <div
                              key={q.id}
                              className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="font-mono">{q.quotationNumber}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                    {q.status}
                                  </span>
                                </div>
                                <div className="text-slate-600 text-[11px] mt-0.5">
                                  {q.vendorName}
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-2">
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    {formatINR(q.grandTotal)}
                                  </span>
                                  <span className="text-[10px] block text-slate-500">
                                    Due: {q.deliveryDate || 'Standard'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 ml-1">
                                  <button
                                    onClick={() => handleOpenPurchaseDocPrint('Quotation', q.id, true)}
                                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded transition-colors cursor-pointer"
                                    title="View Quote Full Screen"
                                  >
                                    <Maximize2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenPurchaseDocPrint('Quotation', q.id, false)}
                                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-white rounded transition-colors cursor-pointer"
                                    title="Print Quote"
                                  >
                                    <Printer className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleOpenPurchaseDocPrint('Quotation', q.id, false)}
                                    className="p-1 text-slate-500 hover:text-indigo-700 hover:bg-white rounded transition-colors cursor-pointer"
                                    title="Download Quote PDF"
                                  >
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ITEM-LEVEL QUANTITY RECONCILIATION */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-teal-600" />
                    Item Fulfillment & Quantity Audit
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Reconciles requested quantities from Purchase Request through PO ordering, warehouse receiving (GRPO), and invoice settlement.
                  </p>
                </div>
                <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
                  Shared Ref: {traceability.sharedReferenceId}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3.5">Item Code & Name</th>
                    <th className="py-3 px-3 text-center">PR Requested</th>
                    <th className="py-3 px-3 text-center">PO Ordered</th>
                    <th className="py-3 px-3 text-center">GRPO Received</th>
                    <th className="py-3 px-3 text-center">Invoice Billed</th>
                    <th className="py-3 px-3 text-right">Unit Rate</th>
                    <th className="py-3 px-3 text-center">Fulfillment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {reconciledItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No item lines found for this procurement chain.
                      </td>
                    </tr>
                  ) : (
                    reconciledItems.map((item) => (
                      <tr key={item.itemId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 font-medium text-slate-900">
                          <div>{item.itemName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.itemCode}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-amber-900">
                          {item.requestedQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-purple-900">
                          {item.orderedQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-teal-900">
                          {item.acceptedQty || item.receivedQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-rose-900">
                          {item.invoicedQty} {item.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">
                          {formatINR(item.unitPrice)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.status === 'Complete'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Partial'
                                ? 'bg-blue-100 text-blue-800'
                                : item.status === 'Pending Receipt'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
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

        {/* TAB 3: QUOTATION BIDS COMPARISON (L1) */}
        {activeTab === 'comparison' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-purple-50/80 border border-blue-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600 text-white shadow-2xs">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                      Supplier Quotation Comparison Analysis
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                        {traceability.comparison.evaluationStatus}
                      </span>
                    </h4>
                    <p className="text-xs text-blue-800/80">
                      Evaluates competing vendor bids linked to reference ID {traceability.sharedReferenceId}
                    </p>
                  </div>
                </div>

                {traceability.comparison.potentialSavings > 0 && (
                  <div className="flex items-center gap-2 bg-emerald-100/90 text-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-bold">
                    <TrendingDown className="w-4 h-4 text-emerald-700" />
                    <span>
                      Savings Achieved: {formatINR(traceability.comparison.potentialSavings)}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white/90 p-3 rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Lowest Price Offer (L1)
                  </span>
                  <div className="font-bold text-slate-900 mt-1 flex items-center justify-between">
                    <span className="truncate">
                      {traceability.comparison.lowestPriceQuote?.vendorName || 'N/A'}
                    </span>
                    <span className="text-emerald-700">
                      {formatINR(traceability.comparison.lowestPriceQuote?.grandTotal || 0)}
                    </span>
                  </div>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Fastest Delivery Lead Time
                  </span>
                  <div className="font-bold text-slate-900 mt-1 flex items-center justify-between">
                    <span className="truncate">
                      {traceability.comparison.fastestDeliveryQuote?.vendorName || 'N/A'}
                    </span>
                    <span className="text-blue-700">
                      {traceability.comparison.fastestDeliveryQuote?.deliveryDate || 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="bg-white/90 p-3 rounded-xl border border-blue-100 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Bid Price Variance
                  </span>
                  <div className="font-bold text-slate-900 mt-1 flex items-center justify-between">
                    <span className="text-slate-600">Spread</span>
                    <span className="text-indigo-700">
                      {formatINR(traceability.comparison.priceVariance)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quotations List */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-bold text-slate-700">All Submitted Vendor Quotes</h5>
              {traceability.quotations.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No vendor quotations linked yet to this purchase chain.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {traceability.quotations.map((q) => {
                    const isL1 = q.id === traceability.comparison.lowestPriceQuote?.id;
                    const isAwarded = q.status === 'Converted to PO' || q.status === 'Approved' || (traceability.order && q.poId === traceability.order.id);
                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-2xl border transition-all ${
                          isAwarded
                            ? 'bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300'
                            : isL1
                            ? 'bg-blue-50/70 border-blue-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-sm text-slate-900">{q.vendorName}</span>
                            {isAwarded && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                                Awarded PO
                              </span>
                            )}
                            {isL1 && !isAwarded && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-2xs">
                                L1 Lowest Price
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {q.quotationNumber}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Grand Total</span>
                            <span className="font-bold text-slate-900">{formatINR(q.grandTotal)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Delivery Lead Time</span>
                            <span className="font-medium text-slate-700">{q.deliveryDate || 'Standard'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Payment Terms</span>
                            <span className="font-medium text-slate-700">{q.paymentTerms}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Status</span>
                            <span className="font-semibold text-slate-800">{q.status}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <strong className="text-slate-800">Complete Audit History</strong> for Shared Reference ID: <span className="font-mono font-bold text-emerald-800">{traceability.sharedReferenceId}</span>
              </div>
              <button
                onClick={() => copyRefToClipboard(traceability.sharedReferenceId)}
                className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer flex items-center gap-1 font-medium"
              >
                <Copy className="w-3 h-3" />
                <span>Copy Ref</span>
              </button>
            </div>

            <div className="relative pl-6 border-l-2 border-emerald-300 space-y-6">
              {traceability.stages
                .filter((s) => s.isCompleted)
                .map((stg, i) => (
                  <div key={stg.sequence} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-emerald-600 border-2 border-white ring-2 ring-emerald-200" />
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          {getStageIcon(stg.stage, 'w-3.5 h-3.5')}
                          {stg.stageName} ({stg.docNumber})
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">{stg.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {stg.summaryText || `Completed ${stg.stageName} record for ${stg.partyName}.`}
                      </p>
                      {stg.amount > 0 && (
                        <div className="mt-2 text-xs font-semibold text-slate-800">
                          Total Amount: {formatINR(stg.amount)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 border-t border-slate-200/90 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cross-referenced by Shared Ref: <strong className="font-mono text-slate-800">{traceability.sharedReferenceId}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
            title="Print Traceability Audit Sheet"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Audit</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (viewMode === 'sidepanel') {
    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end">
        <div className="w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
          {containerContent}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {containerContent}
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
    </>
  );
};
