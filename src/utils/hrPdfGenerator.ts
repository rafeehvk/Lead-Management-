import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface HrPdfExportOptions {
  filename?: string;
  onProgress?: (message: string, current: number, total: number) => void;
}

/**
 * Ensures all <img> elements in a cloned subtree are loaded or safely stripped of
 * broken cross-origin URLs so html2canvas never hangs or throws a CORS security error.
 */
async function prepareImagesForCapture(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          const src = img.getAttribute('src') || '';
          if (!src) {
            resolve();
            return;
          }
          // Data URLs are already loaded and CORS-safe
          if (src.startsWith('data:')) {
            resolve();
            return;
          }
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const timer = setTimeout(() => {
            resolve();
          }, 1800);
          img.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          img.onerror = () => {
            clearTimeout(timer);
            img.removeAttribute('crossorigin');
            resolve();
          };
        })
    )
  );
}

/**
 * Renders an element containing `.hr-pdf-page` sections (or a single A4 document sheet)
 * into a multi-page A4 PDF and triggers an instant file download.
 * Works regardless of whether the source element is inside a hidden/opacity-0 wrapper.
 */
export const generateHrPdfFromElement = async (
  elementId: string,
  options: HrPdfExportOptions = {}
): Promise<boolean> => {
  const sourceElement = document.getElementById(elementId);
  if (!sourceElement) {
    console.error(`HR PDF Export: Element #${elementId} not found`);
    return false;
  }

  // Create a clean off-screen staging container with opacity: 1 so html2canvas renders full colors
  const stagingRoot = document.createElement('div');
  stagingRoot.style.position = 'fixed';
  stagingRoot.style.left = '-10000px';
  stagingRoot.style.top = '0px';
  stagingRoot.style.width = '794px';
  stagingRoot.style.opacity = '1';
  stagingRoot.style.pointerEvents = 'none';
  stagingRoot.style.zIndex = '-9999';
  stagingRoot.style.background = '#ffffff';

  const clonedRoot = sourceElement.cloneNode(true) as HTMLElement;
  clonedRoot.removeAttribute('id');
  stagingRoot.appendChild(clonedRoot);
  document.body.appendChild(stagingRoot);

  try {
    await prepareImagesForCapture(stagingRoot);
    await new Promise((r) => setTimeout(r, 100));

    const pages = stagingRoot.querySelectorAll('.hr-pdf-page');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    if (pages.length > 0) {
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i] as HTMLElement;
        if (options.onProgress) {
          options.onProgress(`Rendering page ${i + 1} of ${pages.length}...`, i + 1, pages.length);
        }

        await new Promise((r) => setTimeout(r, 40));

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.94);
        if (i > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
    } else {
      // Single continuous A4 sheet (such as Offer Letter or Appointment Letter) -> automatic multi-page A4 slicing
      clonedRoot.style.width = '794px';
      clonedRoot.style.maxWidth = '794px';
      clonedRoot.style.margin = '0';
      clonedRoot.style.boxShadow = 'none';
      clonedRoot.style.border = 'none';

      if (options.onProgress) {
        options.onProgress('Rendering document pages...', 1, 1);
      }

      const canvas = await html2canvas(clonedRoot, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 794,
        windowWidth: 794,
      });

      const imgWidth = pdfWidth;
      const pageHeight = pdfHeight;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/jpeg', 0.94);
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 8) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }
    }

    const rawFilename = options.filename || `MYSAR_HR_Document_${new Date().toISOString().split('T')[0]}.pdf`;
    const safeFilename = rawFilename.endsWith('.pdf') ? rawFilename : `${rawFilename}.pdf`;
    pdf.save(safeFilename);
    return true;
  } catch (error) {
    console.error('Error generating HR PDF:', error);
    return false;
  } finally {
    if (stagingRoot.parentNode) {
      stagingRoot.parentNode.removeChild(stagingRoot);
    }
  }
};

/**
 * Prints an HR document (Staff Onboarding Form, Staff Profile Dossier, Offer Letter, or Appointment Letter)
 * by mounting a clean print portal directly into document.body and invoking native window.print(),
 * or opens a clean print window if native iframe printing is restricted.
 */
export const printHrDocument = (elementId: string, documentTitle?: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const originalTitle = document.title;
  if (documentTitle) {
    document.title = documentTitle;
  }

  // Remove any leftover portal from previous print actions
  const existingPortal = document.getElementById('hr-active-print-portal');
  if (existingPortal && existingPortal.parentNode) {
    existingPortal.parentNode.removeChild(existingPortal);
  }

  const portal = document.createElement('div');
  portal.id = 'hr-active-print-portal';
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.margin = '0 auto';
  clone.style.boxShadow = 'none';
  portal.appendChild(clone);
  document.body.appendChild(portal);
  document.body.classList.add('hr-doc-print-active');

  const cleanup = () => {
    document.body.classList.remove('hr-doc-print-active');
    if (documentTitle) {
      document.title = originalTitle;
    }
    const activePortal = document.getElementById('hr-active-print-portal');
    if (activePortal && activePortal.parentNode) {
      activePortal.parentNode.removeChild(activePortal);
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      if (document.body.classList.contains('hr-doc-print-active')) {
        cleanup();
      }
    }, 1500);
  }, 180);
};
