import React, { useState } from 'react';
import {
  X,
  FileText,
  FileCheck,
  Receipt,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Building2,
  ExternalLink,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Printer,
  Download,
  Maximize2,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { DocumentPrintPdfModal } from '../../common/DocumentPrintPdfModal';
import { ThemedDocumentData } from '../themes/ThemedDocumentRenderer';
import {
  convertSalesRequestToDoc,
  convertSalesQuotationToDoc,
  convertSalesOrderToDoc,
  convertSalesDeliveryToDoc,
  convertSalesInvoiceToDoc,
} from '../../../utils/documentConversionHelpers';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface SalesRelatedDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: 'Request' | 'Quotation' | 'Order' | 'Delivery' | 'Invoice';
  docId: string;
  docNumber: string;
  onSelectDoc?: (stage: string, id: string) => void;
}

export const SalesRelatedDocumentsModal: React.FC<SalesRelatedDocumentsModalProps> = ({
  isOpen,
  onClose,
  docType,
  docId,
  docNumber,
  onSelectDoc,
}) => {
  const [printPdfModalOpen, setPrintPdfModalOpen] = useState(false);
  const [activePrintDocument, setActivePrintDocument] = useState<ThemedDocumentData | null>(null);
  const [openInFullScreen, setOpenInFullScreen] = useState(false);

  if (!isOpen) return null;

  const chain = erpFinanceStorage.getRelatedSalesDocuments(docType, docId);

  const handleOpenDocPrint = (stage: string, id: string, fullScreen = false) => {
    let docData: ThemedDocumentData | null = null;
    if (stage === 'Request') {
      const item = erpFinanceStorage.getSalesRequests().find((r) => r.id === id);
      if (item) docData = convertSalesRequestToDoc(item);
    } else if (stage === 'Quotation') {
      const item = erpFinanceStorage.getSalesQuotations().find((q) => q.id === id);
      if (item) docData = convertSalesQuotationToDoc(item);
    } else if (stage === 'Order') {
      const item = erpFinanceStorage.getSalesOrders().find((o) => o.id === id);
      if (item) docData = convertSalesOrderToDoc(item);
    } else if (stage === 'Delivery') {
      const item = erpFinanceStorage.getSalesDeliveries().find((d) => d.id === id);
      if (item) docData = convertSalesDeliveryToDoc(item);
    } else if (stage === 'Invoice') {
      const item = erpFinanceStorage.getSalesInvoices().find((i) => i.id === id);
      if (item) docData = convertSalesInvoiceToDoc(item);
    }

    if (docData) {
      setActivePrintDocument(docData);
      setOpenInFullScreen(fullScreen);
      setPrintPdfModalOpen(true);
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'Request':
        return <FileText className="w-5 h-5 text-amber-600" />;
      case 'Quotation':
        return <FileCheck className="w-5 h-5 text-blue-600" />;
      case 'Order':
        return <ShoppingCart className="w-5 h-5 text-purple-600" />;
      case 'Delivery':
        return <Truck className="w-5 h-5 text-emerald-600" />;
      case 'Invoice':
        return <Receipt className="w-5 h-5 text-rose-600" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Request':
        return 'border-amber-200 bg-amber-50/50 text-amber-800';
      case 'Quotation':
        return 'border-blue-200 bg-blue-50/50 text-blue-800';
      case 'Order':
        return 'border-purple-200 bg-purple-50/50 text-purple-800';
      case 'Delivery':
        return 'border-emerald-200 bg-emerald-50/50 text-emerald-800';
      case 'Invoice':
        return 'border-rose-200 bg-rose-50/50 text-rose-800';
      default:
        return 'border-slate-200 bg-slate-50 text-slate-800';
    }
  };

  const getStageTitle = (stage: string) => {
    switch (stage) {
      case 'Request':
        return '1. Sales Request / Opportunity';
      case 'Quotation':
        return '2. Sales Quotation';
      case 'Order':
        return '3. Sales Order (SO)';
      case 'Delivery':
        return '4. Delivery Note / Goods Issue';
      case 'Invoice':
        return '5. A/R Sales Invoice';
      default:
        return stage;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100/70 text-blue-800 border border-blue-200/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">SAP B1 Sales Relationship Map & Related Documents</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {docType}: {docNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete audit trail from Sales Inquiry to Customer Delivery Note and Final Tax Invoice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Visual Workflow Breadcrumb / Progression */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Standard Sales Order Fulfillment Chain (SAP B1)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { stage: 'Request', label: '1. Request', sub: 'Inquiry / Lead' },
                { stage: 'Quotation', label: '2. Quotation', sub: 'Price Proposal' },
                { stage: 'Order', label: '3. Sales Order', sub: 'Customer Confirmation' },
                { stage: 'Delivery', label: '4. Delivery Note', sub: 'Warehouse Dispatch' },
                { stage: 'Invoice', label: '5. A/R Invoice', sub: 'Finance Billing' },
              ].map((step, idx) => {
                const hasDoc = chain.some((c) => c.stage === step.stage);
                const isSelected = chain.some((c) => c.stage === step.stage && c.isCurrent);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 shadow-xs ring-2 ring-blue-400/30'
                        : hasDoc
                        ? 'border-slate-300 bg-white shadow-2xs'
                        : 'border-dashed border-slate-200 bg-slate-100/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {hasDoc && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                        {step.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block leading-tight">{step.sub}</span>
                    <span
                      className={`inline-block mt-1.5 text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                        hasDoc ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {hasDoc ? 'Linked' : 'Not Created'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Documents List */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
              <span>Linked Document Chain ({chain.length} Documents)</span>
              <span className="text-[11px] text-slate-400 font-normal">Active document highlighted</span>
            </h4>

            {chain.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium">No linked downstream sales documents found yet.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Once Quotation, Sales Order, Delivery Note, or Invoices are generated, they will link here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chain.map((doc, idx) => (
                  <div
                    key={`${doc.stage}-${doc.id}-${idx}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                      doc.isCurrent
                        ? 'border-blue-400 bg-blue-50/60 shadow-xs ring-1 ring-blue-300'
                        : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5 mb-2 sm:mb-0">
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80">
                        {getStageIcon(doc.stage)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStageColor(
                              doc.stage
                            )}`}
                          >
                            {getStageTitle(doc.stage)}
                          </span>
                          <span className="text-sm font-bold text-slate-900">{doc.number}</span>
                          {doc.isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white">
                              Current Window
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            {doc.partyName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {doc.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{formatINR(doc.amount)}</span>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {doc.status}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenDocPrint(doc.stage, doc.id, true)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="View Full Screen"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDocPrint(doc.stage, doc.id, false)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="Print Document"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDocPrint(doc.stage, doc.id, false)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                          title="Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {onSelectDoc && !doc.isCurrent && (
                          <button
                            onClick={() => {
                              onClose();
                              onSelectDoc(doc.stage, doc.id);
                            }}
                            className="ml-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>View</span>
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
          >
            Close Relationship Map
          </button>
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
