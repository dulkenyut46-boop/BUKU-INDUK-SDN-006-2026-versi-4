import React from 'react';
import { SchoolProfile, Student } from '../../types';
import { formatIndonesianDate } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { AcademicMonthInfo, MonthlyRombelStat, MonthlyTingkatStat } from './MonthlyActiveStudentsSummaryCard';

export interface MonthlyStatsPrintSettings {
  showKopSurat: boolean;
  showTingkatBreakdown: boolean;
  showRombelDetails: boolean;
  showMutationDetails: boolean;
  showSignatures: boolean;
  orientation: 'portrait' | 'landscape';
  fontSize: 'xs' | 'sm' | 'base';
  titimangsaKota: string;
  titimangsaTanggal: string;
  namaKepalaSekolah: string;
  nipKepalaSekolah: string;
  namaPetugas?: string;
  nipPetugas?: string;
  jabatanPetugas?: string;
}

interface MonthlyStatsPrintDocumentProps {
  schoolProfile: SchoolProfile;
  activeTP: string;
  selectedMonth: AcademicMonthInfo;
  monthData: {
    month: AcademicMonthInfo;
    totalAwal: number;
    totalAwalL: number;
    totalAwalP: number;
    masukList: any[];
    masukCount: number;
    masukL: number;
    masukP: number;
    mutasiList: any[];
    mutasiCount: number;
    mutasiL: number;
    mutasiP: number;
    meninggalList: any[];
    meninggalCount: number;
    meninggalL: number;
    meninggalP: number;
    totalAkhir: number;
    totalAkhirL: number;
    totalAkhirP: number;
    akhirList: any[];
    netChange: number;
    tingkatCounts: Record<number, { total: number; l: number; p: number; jmlL: number; jmlP: number }>;
  };
  tingkatStats: MonthlyTingkatStat[];
  rombelStats: MonthlyRombelStat[];
  settings: MonthlyStatsPrintSettings;
  documentRef?: React.RefObject<HTMLDivElement | null>;
}

export const MonthlyStatsPrintDocument: React.FC<MonthlyStatsPrintDocumentProps> = ({
  schoolProfile,
  activeTP,
  selectedMonth,
  monthData,
  tingkatStats,
  rombelStats,
  settings,
  documentRef,
}) => {
  const visibleRombels = rombelStats.filter(r => r.total > 0);

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'xs':
        return 'text-[9px] leading-tight';
      case 'base':
        return 'text-[11px] leading-normal';
      case 'sm':
      default:
        return 'text-[10px] leading-snug';
    }
  };

  const getTableFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'xs':
        return 'text-[8.5px]';
      case 'base':
        return 'text-[10.5px]';
      case 'sm':
      default:
        return 'text-[9.5px]';
    }
  };

  const isLandscape = settings.orientation === 'landscape';

  return (
    <div
      ref={documentRef}
      id="monthly-stats-print-document"
      className={`bg-white text-slate-950 p-6 md:p-8 font-sans ${getFontSizeClass()} ${
        isLandscape ? 'w-[297mm] min-h-[210mm]' : 'w-[210mm] min-h-[297mm]'
      } mx-auto shadow-sm print:shadow-none print:m-0 print:p-6`}
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. Official Kop Surat */}
      {settings.showKopSurat && (
        <KopSuratHeader
          schoolProfile={schoolProfile}
          documentTitle="LAPORAN STATISTIK BULANAN & REKAPITULASI SISWA AKTIF"
          documentSubtitle={`BULAN: ${selectedMonth.fullName.toUpperCase()} • TAHUN PELAJARAN ${activeTP} (SEMESTER ${selectedMonth.semester.toUpperCase()})`}
          className="mb-4"
        />
      )}

      {!settings.showKopSurat && (
        <div className="text-center mb-4 pb-2 border-b-2 border-slate-900">
          <h2 className="font-black text-sm md:text-base uppercase tracking-wide">
            {schoolProfile.namaSekolah}
          </h2>
          <h3 className="font-extrabold text-xs md:text-sm uppercase text-slate-800">
            LAPORAN STATISTIK BULANAN & REKAPITULASI SISWA AKTIF
          </h3>
          <p className="text-[10px] text-slate-600 font-bold mt-0.5">
            Bulan: {selectedMonth.fullName} • Tahun Pelajaran {activeTP} (Semester {selectedMonth.semester})
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* 2. Ringkasan Dinamika Mutasi & Peserta Didik Aktif Bulan Ini */}
        <div>
          <div className="font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-1.5 flex items-center justify-between border-b border-slate-300 pb-1">
            <span>I. REKAPITULASI MUTASI & JUMLAH SISWA AKTIF (BULAN {selectedMonth.fullName.toUpperCase()})</span>
            <span className="text-[9px] font-bold text-slate-600">
              Perubahan Bersih: {monthData.netChange > 0 ? `+${monthData.netChange}` : monthData.netChange} Siswa
            </span>
          </div>

          <table className={`w-full border-collapse border border-slate-400 ${getTableFontSizeClass()} text-center`}>
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold">
                <th className="border border-slate-400 py-1.5 px-2" rowSpan={2}>No</th>
                <th className="border border-slate-400 py-1.5 px-3 text-left" rowSpan={2}>Uraian Keadaan Siswa</th>
                <th className="border border-slate-400 py-1 px-2" colSpan={3}>Jenis Kelamin</th>
                <th className="border border-slate-400 py-1.5 px-3 text-left" rowSpan={2}>Keterangan Status</th>
              </tr>
              <tr className="bg-slate-50 text-slate-800 font-bold">
                <th className="border border-slate-400 py-1 px-2 w-16">Laki-Laki (L)</th>
                <th className="border border-slate-400 py-1 px-2 w-16">Perempuan (P)</th>
                <th className="border border-slate-400 py-1 px-2 w-20">Total (L+P)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-400 py-1 px-2 font-mono">1</td>
                <td className="border border-slate-400 py-1 px-3 text-left font-semibold">Keadaan Siswa Awal Bulan</td>
                <td className="border border-slate-400 py-1 px-2 font-mono">{monthData.totalAwalL}</td>
                <td className="border border-slate-400 py-1 px-2 font-mono">{monthData.totalAwalP}</td>
                <td className="border border-slate-400 py-1 px-2 font-mono font-bold bg-slate-50">{monthData.totalAwal}</td>
                <td className="border border-slate-400 py-1 px-3 text-left text-[9px] text-slate-600">Terdaftar aktif di awal bulan</td>
              </tr>
              <tr>
                <td className="border border-slate-400 py-1 px-2 font-mono">2</td>
                <td className="border border-slate-400 py-1 px-3 text-left font-semibold text-emerald-900">Siswa Masuk (Pindahan / Diterima)</td>
                <td className="border border-slate-400 py-1 px-2 font-mono text-emerald-800">+{monthData.masukL}</td>
                <td className="border border-slate-400 py-1 px-2 font-mono text-emerald-800">+{monthData.masukP}</td>
                <td className="border border-slate-400 py-1 px-2 font-mono font-bold text-emerald-900 bg-emerald-50">+{monthData.masukCount}</td>
                <td className="border border-slate-400 py-1 px-3 text-left text-[9px] text-slate-600">Siswa baru diterima di bulan ini</td>
              </tr>
              <tr>
                <td className="border border-slate-400 py-1 px-2 font-mono">3</td>
                <td className="border border-slate-400 py-1 px-3 text-left font-semibold text-amber-900">Siswa Pindah / Mutasi Keluar</td>
                <td className="border border-slate-400 py-1 px-2 font-mono text-amber-800">-{monthData.mutasiL}</td>
                <td className="border border-slate-400 py-1 px-2 font-mono text-amber-800">-{monthData.mutasiP}</td>
                <td className="border border-slate-400 py-1 px-2 font-mono font-bold text-amber-900 bg-amber-50">-{monthData.mutasiCount}</td>
                <td className="border border-slate-400 py-1 px-3 text-left text-[9px] text-slate-600">Siswa meninggalkan / mutasi keluar</td>
              </tr>
              {monthData.meninggalCount > 0 && (
                <tr>
                  <td className="border border-slate-400 py-1 px-2 font-mono">4</td>
                  <td className="border border-slate-400 py-1 px-3 text-left font-semibold text-rose-900">Siswa Meninggal Dunia</td>
                  <td className="border border-slate-400 py-1 px-2 font-mono text-rose-800">-{monthData.meninggalL}</td>
                  <td className="border border-slate-400 py-1 px-2 font-mono text-rose-800">-{monthData.meninggalP}</td>
                  <td className="border border-slate-400 py-1 px-2 font-mono font-bold text-rose-900 bg-rose-50">-{monthData.meninggalCount}</td>
                  <td className="border border-slate-400 py-1 px-3 text-left text-[9px] text-slate-600">Peserta didik wafat/meninggal</td>
                </tr>
              )}
              <tr className="bg-blue-50/70 font-black text-blue-950 border-t-2 border-slate-500">
                <td className="border border-slate-400 py-1.5 px-2 font-mono">{monthData.meninggalCount > 0 ? '5' : '4'}</td>
                <td className="border border-slate-400 py-1.5 px-3 text-left">KEADAAN SISWA AKHIR BULAN (SISWA AKTIF)</td>
                <td className="border border-slate-400 py-1.5 px-2 font-mono">{monthData.totalAkhirL}</td>
                <td className="border border-slate-400 py-1.5 px-2 font-mono">{monthData.totalAkhirP}</td>
                <td className="border border-slate-400 py-1.5 px-2 font-mono text-blue-900 font-extrabold text-[11px] bg-blue-100/80">
                  {monthData.totalAkhir}
                </td>
                <td className="border border-slate-400 py-1.5 px-3 text-left text-[9px] font-bold text-blue-900">
                  Total Siswa Aktif Bulan {selectedMonth.monthName}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Breakdown by Grade Level (Rekapitulasi Siswa Berdasarkan Tingkat Kelas 1 - 6) */}
        {settings.showTingkatBreakdown && (
          <div>
            <div className="font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-1.5 flex items-center justify-between border-b border-slate-300 pb-1">
              <span>II. REKAPITULASI JUMLAH SISWA BERDASARKAN TINGKAT KELAS</span>
              <span className="text-[9px] font-bold text-slate-600">
                Jenjang Sekolah Dasar (Tingkat 1 - 6)
              </span>
            </div>

            <table className={`w-full border-collapse border border-slate-400 ${getTableFontSizeClass()} text-center`}>
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-400 py-1.5 px-2 w-10">No</th>
                  <th className="border border-slate-400 py-1.5 px-3 text-left">Tingkat Kelas</th>
                  <th className="border border-slate-400 py-1.5 px-3 text-left">Rombel Terkait</th>
                  <th className="border border-slate-400 py-1.5 px-2 w-20">Laki-Laki (L)</th>
                  <th className="border border-slate-400 py-1.5 px-2 w-20">Perempuan (P)</th>
                  <th className="border border-slate-400 py-1.5 px-2 w-24">Jumlah Siswa</th>
                  <th className="border border-slate-400 py-1.5 px-2 w-20">Persentase</th>
                  <th className="border border-slate-400 py-1.5 px-2 w-20">Rasio L:P</th>
                </tr>
              </thead>
              <tbody>
                {tingkatStats.map((t, idx) => {
                  const pre = monthData?.tingkatCounts?.[t.tingkat];
                  const preTotal = pre?.total || 0;
                  const preL = pre?.jmlL !== undefined ? pre?.jmlL : (pre?.l || 0);
                  const preP = pre?.jmlP !== undefined ? pre?.jmlP : (pre?.p || 0);

                  const countTotal = t.total > 0 ? t.total : preTotal;
                  const countL = t.total > 0 ? t.jmlL : preL;
                  const countP = t.total > 0 ? t.jmlP : preP;
                  const totalAkhir = monthData?.totalAkhir || 1;
                  const persentase = totalAkhir > 0 ? Math.round((countTotal / totalAkhir) * 100) : 0;
                  const rasioL = countTotal > 0 ? Math.round((countL / countTotal) * 100) : 0;
                  const rasioP = countTotal > 0 ? (100 - rasioL) : 0;

                  return (
                    <tr key={t.tingkat} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="border border-slate-400 py-1 px-2 font-mono">{t.tingkat}</td>
                      <td className="border border-slate-400 py-1 px-3 text-left font-bold text-slate-900">
                        Kelas {t.tingkat}
                      </td>
                      <td className="border border-slate-400 py-1 px-3 text-left text-slate-700 text-[9px]">
                        {t.rombels.length > 0 ? t.rombels.join(', ') : `Kelas ${t.tingkat}`}
                      </td>
                      <td className="border border-slate-400 py-1 px-2 font-mono">{countL}</td>
                      <td className="border border-slate-400 py-1 px-2 font-mono">{countP}</td>
                      <td className="border border-slate-400 py-1 px-2 font-mono font-bold bg-slate-50/80">
                        {countTotal}
                      </td>
                      <td className="border border-slate-400 py-1 px-2 font-mono text-[9px]">
                        {persentase}%
                      </td>
                      <td className="border border-slate-400 py-1 px-2 text-[8.5px] text-slate-600 font-mono">
                        {rasioL}% : {rasioP}%
                      </td>
                    </tr>
                  );
                })}

                {/* Total Row */}
                <tr className="bg-slate-200/90 font-black text-slate-950 border-t-2 border-slate-600">
                  <td className="border border-slate-400 py-1.5 px-2" colSpan={3}>
                    TOTAL KESELURUHAN (TINGKAT 1 S.D. 6)
                  </td>
                  <td className="border border-slate-400 py-1.5 px-2 font-mono">{monthData.totalAkhirL}</td>
                  <td className="border border-slate-400 py-1.5 px-2 font-mono">{monthData.totalAkhirP}</td>
                  <td className="border border-slate-400 py-1.5 px-2 font-mono text-[11px] font-extrabold bg-blue-100">
                    {monthData.totalAkhir}
                  </td>
                  <td className="border border-slate-400 py-1.5 px-2 font-mono">100%</td>
                  <td className="border border-slate-400 py-1.5 px-2 text-[8.5px] font-mono">
                    {monthData.totalAkhir > 0 ? Math.round((monthData.totalAkhirL / monthData.totalAkhir) * 100) : 0}% : {monthData.totalAkhir > 0 ? Math.round((monthData.totalAkhirP / monthData.totalAkhir) * 100) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Rincian Per Rombongan Belajar (Classroom Breakdown) */}
        {settings.showRombelDetails && visibleRombels.length > 0 && (
          <div>
            <div className="font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-1.5 flex items-center justify-between border-b border-slate-300 pb-1">
              <span>III. RINCIAN PER ROMBONGAN BELAJAR (ROMBEL AKTIF)</span>
              <span className="text-[9px] font-bold text-slate-600">
                Total {visibleRombels.length} Rombongan Belajar
              </span>
            </div>

            <table className={`w-full border-collapse border border-slate-400 ${getTableFontSizeClass()} text-center`}>
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold">
                  <th className="border border-slate-400 py-1 px-2 w-10">No</th>
                  <th className="border border-slate-400 py-1 px-3 text-left">Nama Rombel / Kelas</th>
                  <th className="border border-slate-400 py-1 px-2 w-18">Tingkat</th>
                  <th className="border border-slate-400 py-1 px-3 text-left">Wali Kelas / Guru Kelas</th>
                  <th className="border border-slate-400 py-1 px-2 w-16">L (Laki)</th>
                  <th className="border border-slate-400 py-1 px-2 w-16">P (Perem)</th>
                  <th className="border border-slate-400 py-1 px-2 w-20">Total Siswa</th>
                  <th className="border border-slate-400 py-1 px-2 w-18">Persentase</th>
                </tr>
              </thead>
              <tbody>
                {visibleRombels.map((r, idx) => (
                  <tr key={r.rombel} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="border border-slate-400 py-0.5 px-2 font-mono">{idx + 1}</td>
                    <td className="border border-slate-400 py-0.5 px-3 text-left font-bold text-slate-900">
                      {r.rombel}
                    </td>
                    <td className="border border-slate-400 py-0.5 px-2 font-mono">Tingkat {r.tingkat}</td>
                    <td className="border border-slate-400 py-0.5 px-3 text-left text-slate-700">
                      {r.waliKelas || '-'}
                    </td>
                    <td className="border border-slate-400 py-0.5 px-2 font-mono">{r.jmlL}</td>
                    <td className="border border-slate-400 py-0.5 px-2 font-mono">{r.jmlP}</td>
                    <td className="border border-slate-400 py-0.5 px-2 font-mono font-bold bg-slate-50/80">
                      {r.total}
                    </td>
                    <td className="border border-slate-400 py-0.5 px-2 font-mono text-[9px]">{r.persentase}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-200/90 font-black text-slate-950 border-t border-slate-600">
                  <td className="border border-slate-400 py-1 px-2" colSpan={4}>
                    TOTAL KESELURUHAN SISWA AKTIF
                  </td>
                  <td className="border border-slate-400 py-1 px-2 font-mono">{monthData.totalAkhirL}</td>
                  <td className="border border-slate-400 py-1 px-2 font-mono">{monthData.totalAkhirP}</td>
                  <td className="border border-slate-400 py-1 px-2 font-mono font-extrabold bg-blue-100">
                    {monthData.totalAkhir}
                  </td>
                  <td className="border border-slate-400 py-1 px-2 font-mono">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Catatan Mutasi Khusus Bulan Ini (jika ada siswa masuk / keluar) */}
        {settings.showMutationDetails && (monthData.masukCount > 0 || monthData.mutasiCount > 0 || monthData.meninggalCount > 0) && (
          <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
            <div className="font-extrabold text-[10.5px] uppercase tracking-wider text-slate-900 mb-1.5">
              IV. CATATAN PERISTIWA MUTASI SISWA (BULAN {selectedMonth.fullName.toUpperCase()})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9px]">
              {monthData.masukCount > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200 p-2 rounded">
                  <span className="font-bold text-emerald-900 block mb-0.5">
                    Siswa Masuk / Pindahan ({monthData.masukCount} Siswa):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-emerald-950">
                    {monthData.masukList.slice(0, 5).map((s: any) => (
                      <li key={s.id}>
                        <strong>{s.namaLengkap}</strong> ({s.jenisKelamin}) - Masuk ke {s.kelasSekarang}
                      </li>
                    ))}
                    {monthData.masukList.length > 5 && (
                      <li className="italic text-emerald-800">
                        ...dan {monthData.masukList.length - 5} siswa lainnya.
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {monthData.mutasiCount > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 p-2 rounded">
                  <span className="font-bold text-amber-900 block mb-0.5">
                    Siswa Mutasi Keluar ({monthData.mutasiCount} Siswa):
                  </span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-950">
                    {monthData.mutasiList.slice(0, 5).map((s: any) => (
                      <li key={s.id}>
                        <strong>{s.namaLengkap}</strong> ({s.jenisKelamin}) - Pindah ke {s.mutasi?.keSekolah || 'Sekolah Lain'}
                      </li>
                    ))}
                    {monthData.mutasiList.length > 5 && (
                      <li className="italic text-amber-800">
                        ...dan {monthData.mutasiList.length - 5} siswa lainnya.
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. Official Signatures Block (Tanda Tangan Resmi - Hanya Kepala Sekolah) */}
        {settings.showSignatures && (
          <div className="pt-4 mt-4 border-t border-slate-300 break-inside-avoid">
            <div className="flex justify-end items-start text-[10px] leading-snug">
              {/* Titimangsa & Kepala Sekolah */}
              <div className="w-64 sm:w-72 flex flex-col items-center text-center">
                <span>
                  {settings.titimangsaKota || schoolProfile.kabupatenKota || 'Kuantan Singingi'}, {settings.titimangsaTanggal || formatIndonesianDate(new Date().toISOString().split('T')[0])}
                </span>
                <span className="font-bold mt-0.5">Kepala Sekolah</span>
                <div className="h-16" />
                <span className="font-extrabold underline uppercase tracking-wide">
                  {settings.namaKepalaSekolah || schoolProfile.namaKepalaSekolah || 'Kepala Sekolah'}
                </span>
                <span className="font-mono text-[9px] text-slate-700 mt-0.5">
                  NIP. {settings.nipKepalaSekolah || schoolProfile.nipKepalaSekolah || '-'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
