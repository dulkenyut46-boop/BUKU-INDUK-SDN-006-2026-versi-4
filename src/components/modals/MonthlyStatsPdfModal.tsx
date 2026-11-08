import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Sliders, 
  Eye, 
  Calendar, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck,
  FileCheck,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { SchoolProfile } from '../../types';
import { formatIndonesianDate } from '../../lib/utils';
import { 
  AcademicMonthInfo, 
  MonthlyRombelStat, 
  MonthlyTingkatStat 
} from '../common/MonthlyActiveStudentsSummaryCard';
import { 
  MonthlyStatsPrintDocument, 
  MonthlyStatsPrintSettings 
} from '../common/MonthlyStatsPrintDocument';
import { exportMonthlyStatsToPdf } from '../../utils/pdfExportHelper';
import { getTingkatKelasNumber } from '../../utils/academicYearHelper';
import { printElementIsolated } from '../../utils/printHelper';

interface MonthlyStatsPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolProfile: SchoolProfile;
  activeTP: string;
  academicMonths: AcademicMonthInfo[];
  periodicMonthlyStats: any[];
  availableClasses: string[];
  initialSelectedMonthKey?: string;
  initialTingkatStats?: MonthlyTingkatStat[];
  onMonthChange?: (key: string) => void;
}

export const MonthlyStatsPdfModal: React.FC<MonthlyStatsPdfModalProps> = ({
  isOpen,
  onClose,
  schoolProfile,
  activeTP,
  academicMonths,
  periodicMonthlyStats,
  availableClasses,
  initialSelectedMonthKey,
  initialTingkatStats,
  onMonthChange,
}) => {
  const documentPrintRef = useRef<HTMLDivElement>(null);

  // Selected month within modal
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(() => {
    return initialSelectedMonthKey || academicMonths.find(m => m.isCurrent)?.key || academicMonths[0]?.key || '2026-11';
  });

  // Keep in sync with initialSelectedMonthKey when modal opens
  React.useEffect(() => {
    if (initialSelectedMonthKey) {
      setSelectedMonthKey(initialSelectedMonthKey);
    }
  }, [initialSelectedMonthKey, isOpen]);

  // Settings for Print & PDF
  const [settings, setSettings] = useState<MonthlyStatsPrintSettings>({
    showKopSurat: true,
    showTingkatBreakdown: true,
    showRombelDetails: true,
    showMutationDetails: true,
    showSignatures: true,
    orientation: 'portrait',
    fontSize: 'sm',
    titimangsaKota: schoolProfile.kabupatenKota || schoolProfile.kecamatan || 'Kuantan Singingi',
    titimangsaTanggal: formatIndonesianDate(new Date().toISOString().split('T')[0]),
    namaKepalaSekolah: schoolProfile.namaKepalaSekolah || 'Kepala Sekolah',
    nipKepalaSekolah: schoolProfile.nipKepalaSekolah || '-',
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(null);

  // Month data resolution
  const currentMonthData = useMemo(() => {
    return periodicMonthlyStats.find(p => p.month.key === selectedMonthKey) || periodicMonthlyStats[0];
  }, [periodicMonthlyStats, selectedMonthKey]);

  const selectedMonthInfo = currentMonthData?.month || academicMonths[0];

  // Grade level breakdown calculation (Tingkat 1 - 6)
  const tingkatStats: MonthlyTingkatStat[] = useMemo(() => {
    if (!currentMonthData) return [];

    // If initialTingkatStats was provided and we are on the initial selected month, use it directly if valid
    const isInitialMonth = selectedMonthKey === (initialSelectedMonthKey || academicMonths.find(m => m.isCurrent)?.key || academicMonths[0]?.key);
    if (isInitialMonth && initialTingkatStats && initialTingkatStats.some(t => t.total > 0)) {
      return initialTingkatStats;
    }

    const monthStudents = currentMonthData.akhirList || [];
    const totalAll = currentMonthData.totalAkhir || monthStudents.length || 0;

    return [1, 2, 3, 4, 5, 6].map(tingkat => {
      // 1. Direct filtering using robust level extractor
      const inTingkat = monthStudents.filter((s: any) => {
        if (!s) return false;
        if (s.projectedTingkat === tingkat) return true;
        const t1 = getTingkatKelasNumber(s.kelasSekarang);
        if (t1 === tingkat) return true;
        const t2 = getTingkatKelasNumber(s.projectedRombel);
        if (t2 === tingkat) return true;
        return false;
      });

      let jmlL = inTingkat.filter((s: any) => s.jenisKelamin === 'L').length;
      let jmlP = inTingkat.filter((s: any) => s.jenisKelamin === 'P').length;
      let count = inTingkat.length;

      // 2. Fallback to precalculated tingkatCounts on currentMonthData if direct list had 0
      const precomputed = currentMonthData.tingkatCounts?.[tingkat];
      if (count === 0 && precomputed && precomputed.total > 0) {
        count = precomputed.total;
        jmlL = precomputed.jmlL !== undefined ? precomputed.jmlL : (precomputed.l || 0);
        jmlP = precomputed.jmlP !== undefined ? precomputed.jmlP : (precomputed.p || 0);
      }

      // Filter matching rombels for this grade level
      const rombels = availableClasses.filter(c => getTingkatKelasNumber(c) === tingkat);

      return {
        tingkat,
        label: `Tingkat ${tingkat} (Kelas ${tingkat})`,
        jmlL,
        jmlP,
        total: count,
        persentase: totalAll > 0 ? Math.round((count / totalAll) * 100) : 0,
        rombels,
      };
    });
  }, [currentMonthData, availableClasses, selectedMonthKey, initialSelectedMonthKey, initialTingkatStats, academicMonths]);

  // Rombel stats calculation
  const rombelStats: MonthlyRombelStat[] = useMemo(() => {
    if (!currentMonthData) return [];
    const monthStudents = currentMonthData.akhirList || [];
    const total = currentMonthData.totalAkhir || monthStudents.length || 0;

    return availableClasses.map(rombel => {
      const inRombel = monthStudents.filter((s: any) => {
        if (!s) return false;
        if (s.kelasSekarang === rombel || s.projectedRombel === rombel) return true;
        const sCls = String(s.kelasSekarang || s.projectedRombel || '').trim().toLowerCase();
        const rCls = String(rombel).trim().toLowerCase();
        return sCls === rCls;
      });
      const jmlL = inRombel.filter((s: any) => s.jenisKelamin === 'L').length;
      const jmlP = inRombel.filter((s: any) => s.jenisKelamin === 'P').length;
      const rombelTotal = inRombel.length;
      const tingkat = getTingkatKelasNumber(rombel);
      const wali = schoolProfile.waliKelasMap?.[rombel]?.nama;

      return {
        rombel,
        tingkat,
        waliKelas: wali,
        jmlL,
        jmlP,
        total: rombelTotal,
        persentase: total > 0 ? Math.round((rombelTotal / total) * 100) : 0,
      };
    }).sort((a, b) => {
      if (a.tingkat !== b.tingkat) return a.tingkat - b.tingkat;
      return a.rombel.localeCompare(b.rombel, undefined, { numeric: true });
    });
  }, [availableClasses, currentMonthData, schoolProfile.waliKelasMap]);

  const handleSelectMonth = (key: string) => {
    setSelectedMonthKey(key);
    if (onMonthChange) {
      onMonthChange(key);
    }
  };

  const handleExportPdf = async () => {
    if (!documentPrintRef.current) return;
    setIsExportingPdf(true);
    setExportSuccessMessage(null);
    setExportErrorMessage(null);

    try {
      await exportMonthlyStatsToPdf({
        element: documentPrintRef.current,
        monthName: selectedMonthInfo.monthName,
        activeTP,
        schoolName: schoolProfile.namaSekolah,
        orientation: settings.orientation,
      });

      setExportSuccessMessage(`Laporan PDF Statistik Siswa Aktif (${selectedMonthInfo.fullName}) berhasil diunduh!`);
      setTimeout(() => setExportSuccessMessage(null), 4500);
    } catch (err: any) {
      console.error('Export PDF error:', err);
      setExportErrorMessage('Gagal mengekspor laporan PDF: ' + (err?.message || 'Terjadi kesalahan sistem'));
      setTimeout(() => setExportErrorMessage(null), 5000);
    } finally {
      setIsExportingPdf(false);
    }
  };


  const handleDirectPrint = () => {
    if (documentPrintRef.current) {
      printElementIsolated(documentPrintRef.current, {
        title: `Laporan_Statistik_Siswa_Aktif_${activeTP.replace('/', '_')}_${selectedMonthInfo.monthName}`,
        orientation: settings.orientation,
        paperSize: 'A4',
      });
    } else {
      window.print();
    }
  };

  // Tangkap pintasan Ctrl+P / Cmd+P saat modal terbuka agar mencetak dokumen secara terisolasi tanpa tumpang tindih
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleDirectPrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedMonthInfo, activeTP, settings.orientation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto print:static print:inset-auto print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 print:border-none print:shadow-none print:max-w-none print:max-h-none print:rounded-none print:overflow-visible print:block">
        {/* Modal Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#002b80] via-[#003da6] to-indigo-900 text-white flex items-center justify-between shrink-0 no-print print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold tracking-tight flex items-center gap-2">
                <span>Ekspor & Cetak PDF: Statistik Siswa Aktif Bulanan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Resmi A4
                </span>
              </h2>
              <p className="text-xs text-blue-100">
                Termasuk rekapitulasi lengkap siswa per tingkat kelas 1 - 6 dan dinamika mutasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Jendela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls + Right Live Document Preview */}
        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0 bg-slate-100 dark:bg-slate-950/80 print:bg-white print:overflow-visible print:block">
          {/* Left Settings Panel */}
          <div className="w-full lg:w-80 shrink-0 p-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 overflow-y-auto no-print print:hidden">
            {/* 1. Pilih Bulan Laporan */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Pilih Bulan Laporan</span>
              </label>
              <div className="relative">
                <select
                  value={selectedMonthKey}
                  onChange={(e) => handleSelectMonth(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-extrabold rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
                >
                  {academicMonths.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.fullName} (Semester {m.semester}) {m.isCurrent ? '• Bulan Berjalan' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-blue-700 dark:text-blue-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Quick KPI badge for selected month */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
                <span>Total Siswa Aktif:</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                  {currentMonthData?.totalAkhir || 0} Siswa
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                <span>Laki-Laki: <strong>{currentMonthData?.totalAkhirL || 0}</strong></span>
                <span>Perempuan: <strong>{currentMonthData?.totalAkhirP || 0}</strong></span>
              </div>
              <div className="pt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[10px] text-slate-500">
                <span>Awal: {currentMonthData?.totalAwal}</span>
                <span className="text-emerald-600">+{currentMonthData?.masukCount}</span>
                <span className="text-amber-600">-{currentMonthData?.mutasiCount}</span>
              </div>
            </div>

            {/* 2. Format & Orientasi Kertas */}
            <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Pengaturan Format Dokumen</span>
              </label>

              {/* Orientasi */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Orientasi Kertas (A4):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, orientation: 'portrait' }))}
                    className={`py-1.5 px-2.5 rounded-lg font-bold border transition-all cursor-pointer ${
                      settings.orientation === 'portrait'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Potret (Tegak)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings(s => ({ ...s, orientation: 'landscape' }))}
                    className={`py-1.5 px-2.5 rounded-lg font-bold border transition-all cursor-pointer ${
                      settings.orientation === 'landscape'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Lanskap (Melebar)
                  </button>
                </div>
              </div>

              {/* Ukuran Teks */}
              <div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Kepadatan & Ukuran Teks:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {(['xs', 'sm', 'base'] as const).map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSettings(s => ({ ...s, fontSize: sz }))}
                      className={`py-1 rounded-lg font-bold border capitalize transition-all cursor-pointer text-[11px] ${
                        settings.fontSize === sz
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {sz === 'xs' ? 'Ringkas' : sz === 'sm' ? 'Standar' : 'Besar'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Pilihan Bagian Laporan */}
            <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                Bagian Dokumen yang Ditampilkan
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showKopSurat}
                  onChange={(e) => setSettings(s => ({ ...s, showKopSurat: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Kop Surat Resmi Sekolah & Logo</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showTingkatBreakdown}
                  onChange={(e) => setSettings(s => ({ ...s, showTingkatBreakdown: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Tabel Rekapitulasi Tingkat 1 - 6</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showRombelDetails}
                  onChange={(e) => setSettings(s => ({ ...s, showRombelDetails: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Rincian Per Rombel & Guru Kelas</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showMutationDetails}
                  onChange={(e) => setSettings(s => ({ ...s, showMutationDetails: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Catatan Peristiwa Mutasi Bulan Ini</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showSignatures}
                  onChange={(e) => setSettings(s => ({ ...s, showSignatures: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Kolom Tanda Tangan Kepala Sekolah & Titimangsa</span>
              </label>
            </div>

            {/* 4. Edit Nama & NIP Penandatangan (Kepala Sekolah) */}
            {settings.showSignatures && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase">
                  Data Penandatangan (Kepala Sekolah)
                </label>
                <div>
                  <span className="text-[10px] text-slate-500 block">Nama Kepala Sekolah:</span>
                  <input
                    type="text"
                    value={settings.namaKepalaSekolah}
                    onChange={(e) => setSettings(s => ({ ...s, namaKepalaSekolah: e.target.value }))}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">NIP Kepala Sekolah:</span>
                  <input
                    type="text"
                    value={settings.nipKepalaSekolah}
                    onChange={(e) => setSettings(s => ({ ...s, nipKepalaSekolah: e.target.value }))}
                    className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Titimangsa (Kota & Tanggal):</span>
                  <div className="grid grid-cols-2 gap-1">
                    <input
                      type="text"
                      value={settings.titimangsaKota}
                      onChange={(e) => setSettings(s => ({ ...s, titimangsaKota: e.target.value }))}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      placeholder="Kota"
                    />
                    <input
                      type="text"
                      value={settings.titimangsaTanggal}
                      onChange={(e) => setSettings(s => ({ ...s, titimangsaTanggal: e.target.value }))}
                      className="w-full px-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px]"
                      placeholder="Tanggal"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Live Preview Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto flex flex-col items-center justify-start min-h-[500px] print:p-0 print:m-0 print:overflow-visible print:block">
            <div className="w-full max-w-4xl flex items-center justify-between mb-3 text-xs text-slate-600 dark:text-slate-400 no-print print:hidden">
              <span className="font-bold flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Lembar Cetak Dokumen Resmi (WYSIWYG)</span>
              </span>
              <span className="text-[11px] bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-2xs font-mono">
                Format: A4 {settings.orientation === 'portrait' ? 'Potret' : 'Lanskap'}
              </span>
            </div>

            {/* Notification alert banner */}
            {exportSuccessMessage && (
              <div className="w-full max-w-4xl mb-3 p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in no-print print:hidden">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{exportSuccessMessage}</span>
              </div>
            )}

            {exportErrorMessage && (
              <div className="w-full max-w-4xl mb-3 p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-bold flex items-center gap-2 animate-in fade-in no-print print:hidden">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{exportErrorMessage}</span>
              </div>
            )}


            {/* Document wrapper */}
            <div className="w-full overflow-x-auto pb-6 flex justify-center print:p-0 print:m-0 print:overflow-visible print:block">
              <div className="shadow-xl rounded-sm border border-slate-300 bg-white shrink-0 print:shadow-none print:border-none print:m-0 print:p-0 print:w-full">
                <MonthlyStatsPrintDocument
                  documentRef={documentPrintRef}
                  schoolProfile={schoolProfile}
                  activeTP={activeTP}
                  selectedMonth={selectedMonthInfo}
                  monthData={currentMonthData}
                  tingkatStats={tingkatStats}
                  rombelStats={rombelStats}
                  settings={settings}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 no-print print:hidden">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
            <span>Mencetak dokumen resmi rekapitulasi siswa aktif </span>
            <strong className="text-slate-800 dark:text-slate-200">{selectedMonthInfo?.fullName}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleDirectPrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 transition-colors shadow-xs cursor-pointer"
              title="Cetak langsung menggunakan dialog print peramban"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak (Print)</span>
            </button>

            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Membuat Berkas PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh Berkas PDF (.pdf)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
