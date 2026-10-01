// ============================================================================
// Universal Document Print, PDF & Full-Screen Modal
// Allows ANY Sales and Purchase ERP Document to be:
// 1. Viewed in full screen (viewport expansion & browser fullscreen)
// 2. Printed cleanly on A4 paper with GST compliant headers
// 3. Exported/Downloaded as high-resolution PDF
// 4. Styled with multiple themes (Classic, Stylish, Advanced GST, Minimal, Corporate)
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Printer,
  Download,
  Maximize2,
  Minimize2,
  X,
  Palette,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Copy,
  ChevronDown,
  Layers,
  Sparkles,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { ThemedDocumentRenderer, ThemedDocumentData } from '../finance/themes/ThemedDocumentRenderer';
import {
  DocumentThemeConfig,
  InvoiceThemeStyle,
  InvoiceThemeColor,
  ThemedDocumentCategory,
  THEME_COLOR_PALETTES,
} from '../../types/invoiceTheme';
import { invoiceThemeStorage } from '../../services/finance/invoiceThemeStorage';
import { generatePdfFromElement } from '../../utils/pdfGenerator';

export interface DocumentPrintPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: ThemedDocumentData | null;
  category?: ThemedDocumentCategory;
  initialFullScreen?: boolean;
}

export const DocumentPrintPdfModal: React.FC<DocumentPrintPdfModalProps> = ({
  isOpen,
  onClose,
  documentData,
  category = 'sales',
  initialFullScreen = false,
}) => {
  const docCategory: ThemedDocumentCategory = (category as ThemedDocumentCategory) || 'sales';
  const [isFullScreen, setIsFullScreen] = useState(initialFullScreen);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Active theme configuration
  const [themeConfig, setThemeConfig] = useState<DocumentThemeConfig>(() =>
    invoiceThemeStorage.getThemeForDocument(docCategory)
  );

  const documentContentRef = useRef<HTMLDivElement>(null);

  // Sync initial full screen if prop changes
  useEffect(() => {
    if (isOpen) {
      setIsFullScreen(initialFullScreen);
      setZoomLevel(100);
      setThemeConfig(invoiceThemeStorage.getThemeForDocument(docCategory));
    }
  }, [isOpen, initialFullScreen, docCategory]);

  // Handle ESC key to exit full screen or close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullScreen, onClose]);

  if (!isOpen || !documentData) return null;

  const handlePrint = () => {
    // Add print classes to body for full-screen layout optimization
    document.body.classList.add('erp-print-active');
    document.body.classList.add('erp-fullscreen-print-optimized');

    const prevZoom = zoomLevel;
    setZoomLevel(100);

    const cleanup = () => {
      document.body.classList.remove('erp-print-active');
      document.body.classList.remove('erp-fullscreen-print-optimized');
      setZoomLevel(prevZoom);
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    // Give DOM time to update layout for print
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 1200);
    }, 120);
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    setPdfProgressText('Preparing high-resolution document...');
    try {
      const containerId = 'erp-printable-document-root';
      const cleanDocNumber = (documentData.documentNumber || 'DOCUMENT').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `MYSAR_${category.toUpperCase()}_${cleanDocNumber}.pdf`;

      await generatePdfFromElement(containerId, filename, (msg) => {
        setPdfProgressText(msg);
      });
    } catch (err) {
      console.error('PDF Generation failed:', err);
      // Fallback: trigger print dialog which lets user Save as PDF directly
      handlePrint();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgressText('');
    }
  };

  const toggleFullScreen = () => {
    setIsFullScreen((prev) => !prev);
  };

  const handleCopyDocNumber = () => {
    try {
      navigator.clipboard.writeText(documentData.documentNumber);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    } catch {}
  };

  const themeStyles: { id: InvoiceThemeStyle; label: string; desc: string }[] = [
    { id: 'classic', label: 'Classic GST', desc: 'Official compact GST invoice grid' },
    { id: 'stylish', label: 'Modern Stylish', desc: 'Color banner with card details' },
    { id: 'advanced', label: 'Advanced GST', desc: 'Statutory compliance with HSN breakdown' },
    { id: 'corporate', label: 'Corporate Executive', desc: 'Dual-tone formal executive layout' },
    { id: 'minimal', label: 'Minimalist Clean', desc: 'Clean typography without heavy boxes' },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs transition-all duration-200 ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4 md:p-6'
      }`}
    >
      <div
        className={`bg-slate-100 flex flex-col shadow-2xl transition-all duration-200 overflow-hidden ${
          isFullScreen
            ? 'w-screen h-screen rounded-none border-none'
            : 'w-full max-w-5xl h-[95vh] rounded-2xl border border-slate-300'
        }`}
      >
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0 select-none shadow-md">
          {/* Left Title & Status */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-tight text-white truncate">
                  {documentData.documentType || 'ERP Document'}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDocNumber}
                  title="Copy Document Number"
                  className="inline-flex items-center space-x-1 font-mono text-xs px-2 py-0.5 rounded-md bg-slate-800 text-emerald-400 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <span>{documentData.documentNumber}</span>
                  {copiedRef ? <CheckCircle2 className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                {documentData.partyName} &bull; {documentData.date} &bull; Total: ₹{documentData.grandTotal?.toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* Center / Right Action Controls */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs text-slate-300">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                title="Zoom Out"
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] min-w-10 text-center">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                title="Zoom In"
                className="p-1.5 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              {zoomLevel !== 100 && (
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  title="Reset 100%"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors cursor-pointer border-l border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Theme Style Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer"
                title="Change Document Theme"
              >
                <Palette className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline capitalize">{themeConfig.themeStyle}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isThemePickerOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-2xl border border-slate-200 py-1.5 text-slate-800 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    Select Document Theme
                  </div>
                  {themeStyles.map((th) => (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => {
                        setThemeConfig((prev) => ({ ...prev, themeStyle: th.id }));
                        setIsThemePickerOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                        themeConfig.themeStyle === th.id ? 'bg-emerald-50 text-emerald-800 font-bold' : ''
                      }`}
                    >
                      <div>
                        <div>{th.label}</div>
                        <div className="text-[10px] text-slate-500 font-normal">{th.desc}</div>
                      </div>
                      {themeConfig.themeStyle === th.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Vector PDF Export Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="hidden sm:flex px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 text-slate-200 hover:text-white rounded-lg text-xs font-semibold items-center space-x-1.5 border border-slate-700 shadow-xs transition-all cursor-pointer"
              title="Download high-resolution vector PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isGeneratingPdf ? 'Exporting...' : 'PDF File'}</span>
            </button>

            {/* Persistent Primary Print / PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black flex items-center space-x-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer ring-1 ring-white/20"
              title="Trigger browser print dialogue (Print to printer or Save as PDF) with full-screen layout optimization"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print/PDF</span>
            </button>

            {/* Full Screen Toggle Button */}
            <button
              type="button"
              onClick={toggleFullScreen}
              className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                isFullScreen
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-700 hover:bg-emerald-900'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
              }`}
              title={isFullScreen ? 'Exit Full Screen' : 'View Full Screen'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Overlay when PDF is generating */}
        {isGeneratingPdf && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 text-xs font-semibold text-indigo-900 flex items-center justify-between animate-pulse">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
              <span>{pdfProgressText || 'Generating crisp vector PDF...'}</span>
            </div>
            <span className="text-[11px] text-indigo-600 font-normal">Rendering 300 DPI canvas...</span>
          </div>
        )}

        {/* Scrollable Document Canvas Viewport */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-200/80 relative">
          <div
            id="erp-printable-document-root"
            ref={documentContentRef}
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out',
            }}
            className="shadow-2xl bg-white rounded-sm shrink-0 border border-slate-300 print:shadow-none print:border-none print:m-0 print:transform-none"
          >
            <ThemedDocumentRenderer
              category={category}
              themeConfig={themeConfig}
              data={documentData}
              isSample={false}
            />
          </div>

          {/* Persistent Floating Quick-Action Pill */}
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 hover:bg-slate-900 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center space-x-2.5 text-xs transition-all duration-200 erp-floating-action-pill no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center space-x-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1 rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
              title="Open browser print dialogue (Print or Save as PDF) with full-screen layout optimization"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print/PDF</span>
            </button>
            <div className="h-3.5 w-px bg-slate-700" />
            <button
              type="button"
              onClick={toggleFullScreen}
              className="flex items-center space-x-1 text-slate-300 hover:text-white font-medium cursor-pointer transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'Expand Full Screen View'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Exit Full</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
            <div className="h-3.5 w-px bg-slate-700 hidden sm:block" />
            <div className="hidden sm:flex items-center space-x-1 text-slate-300">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(60, z - 10))}
                className="p-1 hover:text-white rounded cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] min-w-8 text-center">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 hover:text-white rounded cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-3.5 w-px bg-slate-700" />
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-full transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Footer Status Bar */}
        <div className="bg-slate-900 text-slate-400 px-4 py-2 text-[11px] border-t border-slate-800 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>MYSAR ERP Official Document Engine &bull; GST Ready</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Press <kbd className="bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-[10px]">Esc</kbd> to exit</span>
            <span>&bull;</span>
            <button
              type="button"
              onClick={toggleFullScreen}
              className="hover:text-emerald-400 underline transition-colors cursor-pointer"
            >
              {isFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
