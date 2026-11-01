import jsPDF from 'jspdf';
import { toCanvas } from 'html-to-image';

export interface PdfExportOptions {
  filename?: string;
  onProgress?: (stage: string) => void;
}

/**
 * Exports a specified HTML container element to a high-quality PDF file.
 * Uses html-to-image to fully support modern CSS features (including Tailwind v4 oklch colors).
 * Handles A4 pagination cleanly when content spans multiple pages.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  options: PdfExportOptions = {}
): Promise<boolean> {
  const { filename = 'Laporan_Perpustakaan_SMPN2_Pemalang.pdf', onProgress } = options;

  try {
    if (onProgress) onProgress('Menyiapkan dokumen & tata letak...');

    // Filter out .no-print elements
    const filterFn = (node: HTMLElement) => {
      if (node instanceof HTMLElement && node.classList?.contains('no-print')) {
        return false;
      }
      return true;
    };

    // Render HTML element to high-res canvas (pixelRatio 2 for sharp 300dpi output)
    let canvas: HTMLCanvasElement;
    try {
      canvas = await toCanvas(element, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        cacheBust: true,
        filter: filterFn,
      });
    } catch (fontErr) {
      // In restricted iframe environments, external font fetching may fail.
      // Fallback with skipFonts: true ensures robust export using system fonts.
      console.warn('html-to-image standard capture failed, retrying with skipFonts: true...', fontErr);
      canvas = await toCanvas(element, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        skipFonts: true,
        filter: filterFn,
      });
    }

    if (onProgress) onProgress('Membuat berkas PDF standar A4...');

    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 190 mm
    const contentHeight = pageHeight - margin * 2; // 277 mm

    const totalHeightInPdf = (canvas.height * contentWidth) / canvas.width;

    // Single page document
    if (totalHeightInPdf <= contentHeight) {
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, totalHeightInPdf);
    } else {
      // Multi-page document: slice canvas cleanly by page chunk
      const pageCanvasHeight = Math.floor((contentHeight * canvas.width) / contentWidth);
      let renderedHeight = 0;
      let pageIndex = 0;

      while (renderedHeight < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const chunkHeight = Math.min(pageCanvasHeight, canvas.height - renderedHeight);
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = chunkHeight;

        const ctx = pageCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            renderedHeight,
            canvas.width,
            chunkHeight,
            0,
            0,
            canvas.width,
            chunkHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
          const chunkPdfHeight = (chunkHeight * contentWidth) / canvas.width;
          pdf.addImage(pageImgData, 'JPEG', margin, margin, contentWidth, chunkPdfHeight);
        }

        renderedHeight += chunkHeight;
        pageIndex++;
      }
    }

    if (onProgress) onProgress('Mengunduh berkas PDF ke perangkat...');
    pdf.save(filename);

    return true;
  } catch (err) {
    console.error('PDF export failed:', err);
    throw err;
  }
}

/**
 * Fallback browser printing helper with hidden iframe
 * Useful when window.print() inside iframes is restricted
 */
export function triggerPrintWithIframe(element: HTMLElement, documentTitle: string = 'Laporan Perpustakaan') {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Copy all style tags and links from parent
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((s) => s.outerHTML)
      .join('\n');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          ${styles}
          <style>
            body { background: #ffffff !important; padding: 20px !important; margin: 0 !important; color: #000 !important; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 12mm 15mm; }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${element.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  } catch (e) {
    console.warn('Iframe print error, falling back to window.print():', e);
    window.print();
  }
}
