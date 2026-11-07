import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface BukuIndukPdfExportOptions {
  page1Element: HTMLElement;
  page2Element: HTMLElement;
  studentName?: string;
  nisn?: string;
  isBlankMode?: boolean;
  schoolName?: string;
}

/**
 * Helper to export the 2-page Buku Induk Peserta Didik into an official A4 PDF document.
 */
export const exportBukuIndukToPdf = async (options: BukuIndukPdfExportOptions): Promise<void> => {
  const { page1Element, page2Element, studentName, nisn, isBlankMode } = options;

  if (!page1Element || !page2Element) {
    throw new Error('Elemen halaman Buku Induk tidak ditemukan.');
  }

  // Configuration for high-res crisp print capture
  const canvasOptions = {
    scale: 2, // 2x resolution for crisp text rendering
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1200,
  };

  // Capture Page 1
  const canvasPage1 = await html2canvas(page1Element, canvasOptions);
  const imgData1 = canvasPage1.toDataURL('image/png', 1.0);

  // Capture Page 2
  const canvasPage2 = await html2canvas(page2Element, canvasOptions);
  const imgData2 = canvasPage2.toDataURL('image/png', 1.0);

  // Standard A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  // Add Page 1
  pdf.addImage(imgData1, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  // Add Page 2
  pdf.addPage('a4', 'portrait');
  pdf.addImage(imgData2, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  // Construct official filename
  let filename = 'Buku_Induk_Peserta_Didik.pdf';
  if (isBlankMode) {
    filename = 'Buku_Induk_Peserta_Didik_Blanko_Kosong.pdf';
  } else if (studentName) {
    const cleanName = studentName.trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
    const cleanNisn = nisn ? `_${nisn.trim()}` : '';
    filename = `Buku_Induk_${cleanName}${cleanNisn}.pdf`;
  }

  // Trigger download in browser
  pdf.save(filename);
};

export interface MonthlyStatsPdfExportOptions {
  element: HTMLElement;
  monthName: string;
  activeTP: string;
  schoolName?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Helper to export the Monthly Active Students Count Report into a crisp official A4 PDF document.
 */
export const exportMonthlyStatsToPdf = async (options: MonthlyStatsPdfExportOptions): Promise<void> => {
  const { element, monthName, activeTP, orientation = 'portrait' } = options;

  if (!element) {
    throw new Error('Elemen dokumen statistik bulanan tidak ditemukan.');
  }

  // Configuration for high-res crisp print capture
  const canvasOptions = {
    scale: 2, // 2x resolution for crisp high-DPI text rendering
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: orientation === 'landscape' ? 1400 : 1100,
  };

  const canvas = await html2canvas(element, canvasOptions);
  const imgData = canvas.toDataURL('image/png', 1.0);

  const pdfWidth = orientation === 'landscape' ? 297 : 210;
  const pdfHeight = orientation === 'landscape' ? 210 : 297;

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  if (imgHeight <= pdfHeight) {
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'FAST');
  } else {
    // Multi-page handling if table or report exceeds one A4 page
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = position - pdfHeight;
      pdf.addPage('a4', orientation);
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }
  }

  const cleanMonth = (monthName || 'Bulan').trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const cleanTP = (activeTP || 'TP').trim().replace(/[^a-zA-Z0-9_\-]/g, '_');
  const filename = `Laporan_Statistik_Siswa_Aktif_${cleanTP}_${cleanMonth}.pdf`;

  pdf.save(filename);
};
