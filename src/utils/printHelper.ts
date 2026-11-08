/**
 * Helper utilitas untuk mencetak elemen dokumen secara terisolasi dan presisi.
 * Menggunakan iframe tersembunyi yang bersih sehingga:
 * 1. Hanya dokumen target yang dicetak (bebas dari latar belakang halaman lain).
 * 2. Tidak terjadi tumpang tindih elemen (tidak bertumpuk).
 * 3. Gaya cetak tabel dan Kop Surat A4 diterapkan secara konsisten.
 */
export interface PrintElementOptions {
  title?: string;
  orientation?: 'portrait' | 'landscape';
  paperSize?: 'A4' | 'F4' | 'Legal';
}

export const printElementIsolated = (
  element: HTMLElement,
  options?: PrintElementOptions
): void => {
  if (!element) return;

  const { title = 'Dokumen Resmi', orientation = 'portrait', paperSize = 'A4' } = options || {};

  // Hapus iframe cetak sebelumnya jika ada
  const existingFrame = document.getElementById('applet-isolated-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  // Buat iframe tersembunyi
  const iframe = document.createElement('iframe');
  iframe.id = 'applet-isolated-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.top = '-10000px';
  iframe.style.left = '-10000px';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  // Kumpulkan seluruh stylesheet dan CSS yang aktif dari head utama
  const headStyles: string[] = [];
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach(node => {
    headStyles.push(node.outerHTML);
  });

  const sizeStr = paperSize === 'F4' ? '215mm 330mm' : paperSize === 'Legal' ? '8.5in 14in' : 'A4';

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        ${headStyles.join('\n')}
        <style>
          @page {
            size: ${sizeStr} ${orientation};
            margin: 8mm 10mm 10mm 10mm;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            box-shadow: none !important;
            text-shadow: none !important;
            filter: none !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            width: 100% !important;
            overflow: visible !important;
          }
          #monthly-stats-print-document {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border-color: #334155 !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .avoid-break, .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          img, svg {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: inline-block !important;
          }
        </style>
      </head>
      <body>
        ${element.outerHTML}
      </body>
    </html>
  `);
  doc.close();

  // Berikan waktu sejenak agar CSS & font selesai dimuat dalam iframe sebelum print dialog muncul
  setTimeout(() => {
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } else {
        window.print();
      }
    } catch (e) {
      console.warn('Iframe print fallback to window.print():', e);
      window.print();
    }

    // Bersihkan iframe setelah pencetakan selesai
    setTimeout(() => {
      iframe.remove();
    }, 60000);
  }, 250);
};
