import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface HrPdfExportOptions {
  filename?: string;
  onProgress?: (message: string, current: number, total: number) => void;
}

/**
 * Generates and downloads a multi-page A4 PDF from a container element containing .hr-pdf-page elements
 */
export async function generateHrPdfFromElement(
  elementId: string,
  options?: HrPdfExportOptions
): Promise<void> {
  const rootElement = document.getElementById(elementId);
  if (!rootElement) {
    throw new Error(`Element with ID "${elementId}" not found for PDF export.`);
  }

  const { filename = 'MYSAR_Staff_Document.pdf', onProgress } = options || {};

  // Find individual A4 pages with class .hr-pdf-page
  const pageElements = Array.from(rootElement.querySelectorAll<HTMLElement>('.hr-pdf-page'));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  rootElement.classList.add('hr-pdf-export-mode');

  try {
    if (pageElements.length > 0) {
      const total = pageElements.length;
      for (let i = 0; i < total; i++) {
        if (onProgress) {
          onProgress(`Rendering page ${i + 1} of ${total}...`, i + 1, total);
        }
        const pageEl = pageElements[i];

        const canvas = await html2canvas(pageEl, {
          scale: 2, // 2x crispness
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          width: 794,
          height: 1123,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.96);

        if (i > 0) {
          pdf.addPage('a4', 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
    } else {
      if (onProgress) {
        onProgress('Rendering document...', 1, 1);
      }
      const canvas = await html2canvas(rootElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        width: 794,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage('a4', 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }
  } finally {
    rootElement.classList.remove('hr-pdf-export-mode');
  }

  if (onProgress) {
    onProgress('Saving PDF file...', 1, 1);
  }

  // Safe file delivery with fallback
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

  try {
    pdf.save(safeFilename);
  } catch (saveErr) {
    console.warn('Standard PDF save failed, using blob download fallback', saveErr);
    try {
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = safeFilename;
      downloadLink.target = '_blank';
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();

      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobUrl);
      }, 3000);
    } catch (blobErr) {
      console.warn('Blob download failed, fallback to print', blobErr);
      printHrDocument(elementId);
    }
  }
}

/**
 * Print HR Document via isolated iframe
 */
export function printHrDocument(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>MYSAR Institutional HR Document</title>
        ${headStyles}
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          html, body {
            background-color: #FFFFFF !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .hr-pdf-page {
            page-break-after: always;
            break-after: page;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: flex-start !important;
          }
          .hr-pdf-page:last-child {
            page-break-after: avoid;
            break-after: avoid;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  iframeDoc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    try {
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print failed', err);
      window.print();
    } finally {
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1500);
    }
  }, 450);
}
