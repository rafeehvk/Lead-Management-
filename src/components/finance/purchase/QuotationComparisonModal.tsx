import React, { useState, useMemo } from 'react';
import {
  X,
  FileCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Award,
  Clock,
  TrendingDown,
  ShoppingBag,
  Info,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Printer,
  Download,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { erpFinanceStorage } from '../../../services/finance/erpFinanceStorage';
import { PurchaseRequest, PurchaseQuotation } from '../../../types/finance';
import { RelatedDocumentsModal } from './RelatedDocumentsModal';
import { generatePdfFromElement } from '../../../utils/pdfGenerator';

const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

interface QuotationComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequestId?: string;
  onPOCreated: () => void;
}

export const QuotationComparisonModal: React.FC<QuotationComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedRequestId,
  onPOCreated,
}) => {
  const allRequests = useMemo(() => erpFinanceStorage.getPurchaseRequests(), [isOpen]);
  const allQuotations = useMemo(() => erpFinanceStorage.getPurchaseQuotations(), [isOpen]);

  const [activeRequestId, setActiveRequestId] = useState<string>(
    selectedRequestId || (allRequests.length > 0 ? allRequests[0].id : '')
  );
  const [isRelatedDocsOpen, setIsRelatedDocsOpen] = useState(false);

  const selectedRequest = allRequests.find((r) => r.id === activeRequestId);

  // Filter quotations linked to activeRequestId or matching items
  const relevantQuotations = useMemo(() => {
    if (!activeRequestId) return allQuotations;
    return allQuotations.filter((q) => q.requestRefId === activeRequestId);
  }, [allQuotations, activeRequestId]);

  // Determine Best Price and Best Delivery Date
  const comparisonAnalysis = useMemo(() => {
    if (relevantQuotations.length === 0) {
      return { bestPriceQuoteId: null, bestDeliveryQuoteId: null, lowestPrice: 0, earliestDelivery: '' };
    }

    let minPrice = Infinity;
    let bestPriceQuoteId: string | null = null;
    let earliestDeliveryTime = Infinity;
    let bestDeliveryQuoteId: string | null = null;
    let earliestDeliveryStr = '';

    relevantQuotations.forEach((q) => {
      if (q.grandTotal < minPrice) {
        minPrice = q.grandTotal;
        bestPriceQuoteId = q.id;
      }

      if (q.deliveryDate) {
        const dTime = new Date(q.deliveryDate).getTime();
        if (!isNaN(dTime) && dTime < earliestDeliveryTime) {
          earliestDeliveryTime = dTime;
          bestDeliveryQuoteId = q.id;
          earliestDeliveryStr = q.deliveryDate;
        }
      }
    });

    return {
      bestPriceQuoteId,
      bestDeliveryQuoteId,
      lowestPrice: minPrice,
      earliestDelivery: earliestDeliveryStr,
    };
  }, [relevantQuotations]);

  const [selectedQuoteIdForPO, setSelectedQuoteIdForPO] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Pre-select best price quotation if available
  React.useEffect(() => {
    if (comparisonAnalysis.bestPriceQuoteId) {
      setSelectedQuoteIdForPO(comparisonAnalysis.bestPriceQuoteId);
    } else if (relevantQuotations[0]) {
      setSelectedQuoteIdForPO(relevantQuotations[0].id);
    }
  }, [comparisonAnalysis.bestPriceQuoteId, relevantQuotations]);

  if (!isOpen) return null;

  const handlePrint = () => {
    document.body.classList.add('erp-print-active');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('erp-print-active');
    }, 150);
  };

  const handleDownloadPdf = async () => {
    setIsExportingPdf(true);
    try {
      const containerId = 'quotation-comparison-printable-root';
      const cleanRef = (selectedRequest?.requestNumber || 'COMPARISON').replace(/[^a-zA-Z0-9_-]/g, '_');
      await generatePdfFromElement(containerId, `MYSAR_Quotation_Comparison_${cleanRef}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      handlePrint();
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleGeneratePO = () => {
    if (!selectedQuoteIdForPO) {
      alert('Please select a supplier quotation to create the Purchase Order.');
      return;
    }

    try {
      erpFinanceStorage.convertQuotationToPO(selectedQuoteIdForPO);
      alert('Purchase Order successfully created from the selected Supplier Quotation!');
      onPOCreated();
      onClose();
    } catch (err: any) {
      alert(err?.message || 'Failed to create Purchase Order.');
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 ${
        isFullScreen ? 'p-0' : 'p-4'
      }`}
    >
      <div
        className={`bg-white flex flex-col shadow-2xl overflow-hidden transition-all duration-200 ${
          isFullScreen
            ? 'w-screen h-screen rounded-none border-none'
            : 'border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh]'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-100/70 text-blue-800 border border-blue-200/60">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Supplier Quotation Comparison & Evaluation (SAP B1)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  Procurement Decision
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare multi-vendor bids side-by-side to determine best pricing and earliest delivery before issuing PO
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
              title="Print Comparison Sheet"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              title="Download Comparison Sheet as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isExportingPdf ? 'Exporting...' : 'PDF'}</span>
            </button>
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4 text-emerald-600" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Filter Bar: Select Request */}
        <div className="px-6 py-3 bg-white border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Filter by Purchase Request:</label>
            <select
              value={activeRequestId}
              onChange={(e) => setActiveRequestId(e.target.value)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
            >
              {allRequests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.requestNumber} - {r.department} ({r.items.length} items, est. {formatINR(r.estimatedTotal)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRelatedDocsOpen(true)}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View full procurement traceability chain for this request"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Traceability Chain</span>
            </button>
            <span className="text-xs text-slate-500">
              Found <strong className="text-slate-800 font-bold">{relevantQuotations.length}</strong> supplier quotations
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div id="quotation-comparison-printable-root" className="p-6 overflow-y-auto space-y-6 bg-white">
          {relevantQuotations.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">No Supplier Quotations Received for this PR</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Use the <strong className="text-slate-700">"Copy to Quotation"</strong> option on Purchase Request{' '}
                {selectedRequest?.requestNumber} to record quotes from different suppliers and compare them.
              </p>
            </div>
          ) : (
            <>
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-800 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Best Pricing (Lowest)</span>
                  </div>
                  {comparisonAnalysis.bestPriceQuoteId ? (
                    <div>
                      <span className="text-lg font-bold text-emerald-950 block">
                        {formatINR(comparisonAnalysis.lowestPrice)}
                      </span>
                      <span className="text-xs text-emerald-800 font-medium mt-0.5 block">
                        Vendor:{' '}
                        {
                          relevantQuotations.find((q) => q.id === comparisonAnalysis.bestPriceQuoteId)?.vendorName
                        }
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">N/A</span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 shadow-2xs">
                  <div className="flex items-center gap-2 text-blue-800 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Fastest Delivery</span>
                  </div>
                  {comparisonAnalysis.bestDeliveryQuoteId ? (
                    <div>
                      <span className="text-lg font-bold text-blue-950 block">
                        {comparisonAnalysis.earliestDelivery || 'Immediate'}
                      </span>
                      <span className="text-xs text-blue-800 font-medium mt-0.5 block">
                        Vendor:{' '}
                        {
                          relevantQuotations.find((q) => q.id === comparisonAnalysis.bestDeliveryQuoteId)?.vendorName
                        }
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">Not specified</span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60 shadow-2xs">
                  <div className="flex items-center gap-2 text-purple-800 mb-1">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Quotations Under Review</span>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-purple-950 block">
                      {relevantQuotations.length} Proposals
                    </span>
                    <span className="text-xs text-purple-800 font-medium mt-0.5 block">
                      PR Ref: {selectedRequest?.requestNumber}
                    </span>
                  </div>
                </div>
              </div>

              {/* Side-by-side Supplier Quotation Comparison Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Vendor Comparative Statement
                  </h4>
                  <span className="text-[11px] text-slate-500">Select a radio button to award the Purchase Order</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-700 font-bold">
                        <th className="p-3 w-12 text-center">Select</th>
                        <th className="p-3 min-w-[180px]">Supplier / Vendor</th>
                        <th className="p-3">Quote #</th>
                        <th className="p-3">Delivery Date</th>
                        <th className="p-3">Payment Terms</th>
                        <th className="p-3">Item Breakdown</th>
                        <th className="p-3 text-right">Subtotal</th>
                        <th className="p-3 text-right">GST / Tax</th>
                        <th className="p-3 text-right min-w-[130px]">Grand Total</th>
                        <th className="p-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {relevantQuotations.map((q) => {
                        const isBestPrice = q.id === comparisonAnalysis.bestPriceQuoteId;
                        const isBestDelivery = q.id === comparisonAnalysis.bestDeliveryQuoteId;
                        const isSelected = selectedQuoteIdForPO === q.id;

                        return (
                          <tr
                            key={q.id}
                            onClick={() => setSelectedQuoteIdForPO(q.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/70 hover:bg-blue-50'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name="selectedQuote"
                                checked={isSelected}
                                onChange={() => setSelectedQuoteIdForPO(q.id)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>

                            <td className="p-3">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>{q.vendorName}</span>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {isBestPrice && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <TrendingDown className="w-2.5 h-2.5" /> Best Price
                                  </span>
                                )}
                                {isBestDelivery && (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300">
                                    <Clock className="w-2.5 h-2.5" /> Earliest Delivery
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-3">
                              <span className="font-semibold text-slate-800 block">{q.quotationNumber}</span>
                              <span className="text-[10px] text-slate-500">{q.date}</span>
                            </td>

                            <td className="p-3">
                              <div
                                className={`font-semibold ${
                                  isBestDelivery ? 'text-blue-700 font-bold' : 'text-slate-700'
                                }`}
                              >
                                {q.deliveryDate || 'Not specified'}
                              </div>
                            </td>

                            <td className="p-3 text-slate-600 font-medium">{q.paymentTerms}</td>

                            <td className="p-3">
                              <div className="space-y-1 max-w-xs">
                                {q.items.map((item, idx) => (
                                  <div key={idx} className="text-[11px] text-slate-700 flex justify-between gap-2">
                                    <span className="truncate">{item.itemName}</span>
                                    <span className="font-semibold whitespace-nowrap">
                                      {item.quantity} {item.unit} @ {formatINR(item.rate)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="p-3 text-right text-slate-600 font-medium">{formatINR(q.subtotal)}</td>

                            <td className="p-3 text-right text-slate-600 font-medium">{formatINR(q.taxTotal)}</td>

                            <td className="p-3 text-right">
                              <span
                                className={`text-sm font-bold block ${
                                  isBestPrice ? 'text-emerald-700 font-extrabold' : 'text-slate-900'
                                }`}
                              >
                                {formatINR(q.grandTotal)}
                              </span>
                              {isBestPrice && (
                                <span className="text-[10px] text-emerald-600 font-semibold block">Lowest Bid</span>
                              )}
                            </td>

                            <td className="p-3 text-center">
                              <span
                                className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  q.status === 'Approved' || q.status === 'Converted to PO'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {q.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-600 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            <span>
              Selected Quote:{' '}
              <strong className="text-slate-900">
                {relevantQuotations.find((q) => q.id === selectedQuoteIdForPO)?.vendorName || 'None selected'}
              </strong>{' '}
              ({formatINR(relevantQuotations.find((q) => q.id === selectedQuoteIdForPO)?.grandTotal || 0)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handleGeneratePO}
              disabled={!selectedQuoteIdForPO || relevantQuotations.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Award & Create Purchase Order (PO)</span>
            </button>
          </div>
        </div>
      </div>

      <RelatedDocumentsModal
        isOpen={isRelatedDocsOpen}
        onClose={() => setIsRelatedDocsOpen(false)}
        docType="Request"
        docId={activeRequestId}
        docNumber={selectedRequest?.requestNumber || ''}
      />
    </div>
  );
};
