import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  Receipt,
  CreditCard,
  Palette,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import {
  ReceiptTransactionRecord,
  PaymentTransactionRecord,
} from '../../../types/finance';
import {
  DocumentThemeConfig,
  InvoiceThemeStyle,
  InvoiceThemeColor,
  ThemedDocumentCategory,
  THEME_COLOR_PALETTES,
} from '../../../types/invoiceTheme';
import { invoiceThemeStorage } from '../../../services/finance/invoiceThemeStorage';
import { ThemedDocumentRenderer, ThemedDocumentData } from './ThemedDocumentRenderer';

interface PrintableVoucherModalProps {
  type: 'receipt' | 'payment';
  receipt?: ReceiptTransactionRecord | null;
  payment?: PaymentTransactionRecord | null;
  onClose: () => void;
}

export const PrintableVoucherModal: React.FC<PrintableVoucherModalProps> = ({
  type,
  receipt,
  payment,
  onClose,
}) => {
  const [themeConfig, setThemeConfig] = useState<DocumentThemeConfig>(() =>
    invoiceThemeStorage.getThemeForDocument(type)
  );
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setThemeConfig(invoiceThemeStorage.getThemeForDocument(type));
    };
    window.addEventListener('erp_invoice_themes_changed', handleStorageChange);
    return () => window.removeEventListener('erp_invoice_themes_changed', handleStorageChange);
  }, [type]);

  if (!receipt && !payment) return null;

  // Convert Receipt to ThemedDocumentData
  let documentData: ThemedDocumentData;
  if (type === 'receipt' && receipt) {
    documentData = {
      documentNumber: receipt.receiptNumber,
      documentType: receipt.isAdvance ? 'Advance Receipt Voucher' : 'Payment Receipt',
      date: receipt.date,
      referenceNumber: receipt.referenceNumber || receipt.transactionId,
      paymentMethod: receipt.paymentMethod,
      accountName: receipt.accountName,
      partyName: receipt.partyName,
      items: [],
      allocations: receipt.allocations?.map((a) => ({
        invoiceNumber: a.invoiceNumber,
        amount: a.amount,
      })) || [],
      subtotal: receipt.amount,
      cgst: 0,
      sgst: 0,
      igst: 0,
      grandTotal: receipt.amount,
    };
  } else if (payment) {
    documentData = {
      documentNumber: payment.paymentNumber,
      documentType: payment.isAdvance ? 'Advance Payment Voucher' : 'Payment Voucher',
      date: payment.date,
      referenceNumber: payment.referenceNumber || payment.transactionId,
      paymentMethod: payment.paymentMethod,
      accountName: payment.accountName,
      partyName: payment.partyName,
      items: [],
      allocations: payment.allocations?.map((a) => ({
        invoiceNumber: a.invoiceNumber,
        amount: a.amount,
      })) || [],
      subtotal: payment.amount,
      tdsAmount: payment.tdsAmount,
      tdsSection: payment.tdsSection ? `Sec ${payment.tdsSection} (${payment.tdsRate}%)` : undefined,
      cgst: 0,
      sgst: 0,
      igst: 0,
      grandTotal: payment.netPaid,
    };
  } else {
    return null;
  }

  const handleSelectThemeStyle = (style: InvoiceThemeStyle) => {
    const updated = { ...themeConfig, themeStyle: style };
    setThemeConfig(updated);
    invoiceThemeStorage.saveThemeForCategory(type, updated);
  };

  const handleSelectColor = (color: InvoiceThemeColor) => {
    const updated = { ...themeConfig, primaryColor: color };
    setThemeConfig(updated);
    invoiceThemeStorage.saveThemeForCategory(type, updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-slate-100 rounded-2xl max-w-4xl w-full p-4 md:p-6 max-h-[94vh] overflow-y-auto shadow-2xl relative border border-gray-200">
        {/* Modal Top Bar */}
        <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span
              className={`p-2.5 rounded-xl ${
                type === 'receipt' ? 'bg-purple-100 text-purple-800' : 'bg-slate-800 text-white'
              }`}
            >
              {type === 'receipt' ? <Receipt className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-slate-900">
                  {type === 'receipt' ? 'Official Receipt Voucher' : 'Official Payment Voucher'}:{' '}
                  <span className="font-mono">{documentData.documentNumber}</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-gray-200">
                  Theme: {themeConfig.themeStyle.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Printed using My Billbook Theme Settings for {type === 'receipt' ? 'Receipts' : 'Payments'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Theme Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-gray-200"
              >
                <Palette className="w-3.5 h-3.5 text-slate-600" />
                <span>Theme: {themeConfig.themeStyle}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isThemePickerOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 p-3 z-30 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Select Theme Style
                    </span>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {(['classic', 'stylish', 'advanced', 'minimal', 'corporate', 'thermal'] as InvoiceThemeStyle[]).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleSelectThemeStyle(st)}
                            className={`p-1.5 rounded-lg text-left capitalize transition-colors ${
                              themeConfig.themeStyle === st
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            {st}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Select Palette Color
                    </span>
                    <div className="flex items-center gap-1.5">
                      {(['emerald', 'blue', 'purple', 'red', 'teal', 'slate', 'amber'] as InvoiceThemeColor[]).map(
                        (col) => {
                          const pal = THEME_COLOR_PALETTES[col];
                          return (
                            <button
                              key={col}
                              type="button"
                              onClick={() => handleSelectColor(col)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform ${
                                themeConfig.primaryColor === col ? 'ring-2 ring-slate-800 scale-110' : ''
                              }`}
                              style={{ backgroundColor: pal.hex }}
                              title={pal.name}
                            >
                              {themeConfig.primaryColor === col && <span className="text-white text-[10px]">✓</span>}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-1.5 bg-[#0B5D2A] hover:bg-[#168A45] text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Voucher</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Themed Document Sheet */}
        <div className="bg-slate-100/80 p-4 rounded-xl shadow-xs flex flex-col items-center overflow-auto max-h-[80vh]">
          <div className="mb-3 px-3 py-1 rounded-full bg-slate-900 text-slate-300 text-[11px] font-medium border border-slate-700 shadow-xs flex items-center space-x-2 no-print shrink-0 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-white">A4 Page Preview</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-emerald-300">210mm × 297mm</span>
          </div>
          <div className="w-[210mm] max-w-full min-h-[297mm] shadow-2xl bg-white print:shadow-none print:w-[210mm] print:m-0 erp-a4-document-sheet">
            <ThemedDocumentRenderer
              category={type}
              themeConfig={themeConfig}
              data={documentData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
