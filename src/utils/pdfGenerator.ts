import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    // Process page-by-page: extremely fast, eliminates canvas memory overflows, and guarantees 1-to-1 page alignment
    for (let i = 0; i < pageElements.length; i++) {
      if (onProgress) {
        onProgress(`Rendering page ${i + 1} of ${pageElements.length}`, i + 1, pageElements.length);
      }
      const pageEl = pageElements[i];
      const canvas = await html2canvas(pageEl, {
        scale: 1.5, // Clean high-resolution output while keeping memory lightweight
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        imageTimeout: 8000,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }
  } else {
    // Single container fallback
    const canvas = await html2canvas(rootElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      imageTimeout: 8000,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
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

  // Universal Blob Download (compatible with browsers, iframes, and mobile devices)
  const safeFilename = `${filename.replace(/\.pdf$/i, '')}.pdf`;
  const pdfBlob = pdf.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);

  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = safeFilename;
  downloadLink.style.display = 'none';
  document.body.appendChild(downloadLink);
  downloadLink.click();

  setTimeout(() => {
    if (document.body.contains(downloadLink)) {
      document.body.removeChild(downloadLink);
    }
    URL.revokeObjectURL(blobUrl);
  }, 2500);
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
