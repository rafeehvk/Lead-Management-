import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to convert any CSS color string (oklch, oklab, hsl, var, etc.) to standard rgba/hex
function sanitizeElementColors(doc: Document) {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const toSafeColor = (colorStr: string): string => {
    if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit' || colorStr === 'initial') {
      return colorStr;
    }
    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = colorStr;
      return ctx.fillStyle;
    } catch {
      return '#000000';
    }
  };

  const allElements = doc.querySelectorAll('*');
  allElements.forEach((node) => {
    const el = node as HTMLElement;
    if (el.style) {
      if (el.style.color && el.style.color.includes('oklch')) {
        el.style.color = toSafeColor(el.style.color);
      }
      if (el.style.backgroundColor && el.style.backgroundColor.includes('oklch')) {
        el.style.backgroundColor = toSafeColor(el.style.backgroundColor);
      }
      if (el.style.borderColor && el.style.borderColor.includes('oklch')) {
        el.style.borderColor = toSafeColor(el.style.borderColor);
      }
    }
  });
}

export async function generatePdfFromElement(
  elementId: string,
  filename: string,
  onProgress?: (message: string, current: number, total: number) => void
): Promise<void> {
  const rootElement = document.getElementById(elementId);
  if (!rootElement) {
    throw new Error(`Element with ID "${elementId}" not found for PDF generation.`);
  }

  // Find individual pages if present (e.g., .proposal-page)
  const pageElements = Array.from(rootElement.querySelectorAll<HTMLElement>('.proposal-page'));

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  if (pageElements.length > 0) {
    const total = pageElements.length;
    for (let i = 0; i < total; i++) {
      if (onProgress) {
        onProgress(`Rendering page ${i + 1} of ${total}`, i + 1, total);
      }
      const pageEl = pageElements[i];

      try {
        const canvas = await html2canvas(pageEl, {
          scale: 1.4, // Optimal balance of crisp typography and rendering speed
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          imageTimeout: 5000,
          onclone: (clonedDoc) => {
            sanitizeElementColors(clonedDoc);
          },
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.92);

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      } catch (pageErr) {
        console.warn(`Warning: Error rendering page ${i + 1}`, pageErr);
        // Fallback for single failed page: Add clean blank page with text notice
        if (i > 0) {
          pdf.addPage();
        }
        pdf.setFontSize(12);
        pdf.setTextColor(30, 41, 59);
        pdf.text(`MYSAR Proposal - Page ${i + 1}`, 20, 20);
      }
    }
  } else {
    if (onProgress) {
      onProgress('Rendering proposal document...', 1, 1);
    }
    const canvas = await html2canvas(rootElement, {
      scale: 1.4,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      imageTimeout: 5000,
      onclone: (clonedDoc) => {
        sanitizeElementColors(clonedDoc);
      },
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }
  }

  if (onProgress) {
    onProgress('Finalizing and saving PDF...', pageElements.length || 1, pageElements.length || 1);
  }

  // Multi-tier reliable download delivery
  const safeFilename = `${filename.replace(/\.pdf$/i, '')}.pdf`;

  try {
    // Strategy 1: jsPDF standard save
    pdf.save(safeFilename);
  } catch (saveErr) {
    console.warn('jsPDF save failed, trying Blob URL download', saveErr);
    try {
      // Strategy 2: Blob URL anchor click
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
      console.warn('Blob URL download failed, trying data URI', blobErr);
      // Strategy 3: Direct Data URI
      const dataUri = pdf.output('datauristring');
      const dataLink = document.createElement('a');
      dataLink.href = dataUri;
      dataLink.download = safeFilename;
      document.body.appendChild(dataLink);
      dataLink.click();
      setTimeout(() => {
        if (document.body.contains(dataLink)) {
          document.body.removeChild(dataLink);
        }
      }, 3000);
    }
  }
}

export function printProposalDocument(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Create isolated iframe for clean printing
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

  // Grab all active stylesheets from parent document
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((el) => el.outerHTML)
    .join('\n');

  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>MYSAR Proposal for Implementation</title>
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
          .proposal-page {
            page-break-after: always;
            break-after: page;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .proposal-page:last-child {
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
      console.warn('Iframe print failed, falling back to window.print', err);
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

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
