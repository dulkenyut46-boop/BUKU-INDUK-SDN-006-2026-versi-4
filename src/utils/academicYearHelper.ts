import { Student, StudentStatus } from '../types';
import { getAcademicYearFromDate } from '../lib/utils';

/**
 * Mengambil tahun awal dari format Tahun Pelajaran (misal: "2025/2026" -> 2025, "2024" -> 2024)
 */
export function getAcademicYearStart(tp?: string): number {
  if (!tp) return 2026;
  const clean = tp.trim();
  const match = clean.match(/^(\d{4})/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 2026;
}

/**
 * Mengambil tahun akhir dari format Tahun Pelajaran (misal: "2025/2026" -> 2026)
 */
export function getAcademicYearEnd(tp?: string): number {
  const start = getAcademicYearStart(tp);
  return start + 1;
}

/**
 * Memformat tahun angka ke format Tahun Pelajaran resmi Indonesia (misal: 2025 -> "2025/2026")
 */
export function formatAcademicYear(startYear: number): string {
  return `${startYear}/${startYear + 1}`;
}

/**
 * Helper: Cek apakah kelas berada di tingkat 1 sampai dengan 6 (Sekolah Dasar)
 */
export const isKelas1Sampai6 = (kelasName?: string): boolean => {
  if (!kelasName) return false;
  const k = kelasName.trim().toLowerCase();

  // Exclude non-SD levels explicitly
  if (
    k.includes('alumni') || 
    k.includes('lulus') || 
    k.includes('tamat') || 
    k.includes('belum masuk') ||
    k.includes('tk') || 
    k.includes('paud') || 
    k.includes('kb') ||
    k.includes('tpa') ||
    k.includes('ra') ||
    k.includes('smp') ||
    k.includes('mts') ||
    k.includes('sma') ||
    k.includes('smk')
  ) {
    return false;
  }

  // Exclude secondary grades: 7, 8, 9, 10, 11, 12, VII, VIII, IX, X, XI, XII
  if (/\b(?:kelas|tingkat|rombel)?\s*(?:7|8|9|10|11|12|vii|viii|ix|x|xi|xii)\b/i.test(k)) {
    return false;
  }

  // Check for digits 1-6 (e.g. "Kelas 1", "Kelas 1A", "1B", "Kelas 2", "3-A", "Kelas 6", "6B")
  if (/\b(?:kelas|tingkat|rombel)?\s*([1-6])(?![0-9])/i.test(k)) {
    return true;
  }

  if (/\bvi\b/i.test(k)) return true;
  if (/\bv\b/i.test(k)) return true;
  if (/\biv\b/i.test(k)) return true;
  if (/\biii\b/i.test(k)) return true;
  if (/\bii\b/i.test(k)) return true;
  if (/\bi\b/i.test(k)) return true;

  return false;
};

/**
 * Helper: Mengambil nomor tingkat 1 s/d 6 untuk pengelompokan & kalkulasi naik/turun
 */
export const getTingkatKelasNumber = (kelasName?: string): number => {
  if (!kelasName) return 1;
  const k = kelasName.trim().toLowerCase();

  if (k.includes('belum masuk')) return 0;
  if (k.includes('alumni') || k.includes('lulus')) return 7;

  const numMatch = k.match(/(?:kelas|tingkat|rombel)?\s*([1-6])(?![0-9])/i);
  if (numMatch) return parseInt(numMatch[1], 10);

  if (/\bvi\b/i.test(k)) return 6;
  if (/\bv\b/i.test(k)) return 5;
  if (/\biv\b/i.test(k)) return 4;
  if (/\biii\b/i.test(k)) return 3;
  if (/\bii\b/i.test(k)) return 2;
  if (/\bi\b/i.test(k)) return 1;

  return 1;
};

export interface ProjectedStudent extends Student {
  projectedRombel: string;
  projectedStatus: StudentStatus;
  projectedTingkat: number; // 0 = Belum Masuk SD, 1-6 = Kelas 1-6, 7 = Lulus / Alumni
  isBelumMasukSD: boolean;
  baseRombel: string;
  baseStatus: StudentStatus;
  diffYears: number;
}

/**
 * Menghitung proyeksi rombel dan status siswa secara otomatis berdasarkan Tahun Pelajaran Aktif (targetTP).
 * - Saat ganti TP sebelumnya: data rombel turun, siswa kelas 1 menjadi "Belum Masuk SD"
 * - Saat ganti TP selanjutnya: data rombel naik (kelas 1->2, 2->3, ..., kelas 6 menjadi Lulus/Alumni)
 * - Format rombel variabel (seperti "Kelas 1A", "1B", "Kelas 3-A") tetap mempertahankan kode/abjad rombelnya
 */
export function projectStudentForAcademicYear(
  student: Student,
  targetTP: string,
  baseSchoolTP: string = '2026/2027'
): ProjectedStudent {
  const targetYear = getAcademicYearStart(targetTP);
  
  // Tahun Pelajaran dasar/acuan tempat data kelasSekarang tersimpan (default: "2026/2027")
  const baseYear = getAcademicYearStart(student.tahunPelajaranKelasSekarang || baseSchoolTP || '2026/2027');
  const diffYears = targetYear - baseYear;

  // Tahun Masuk (Tahun Diterima di SD)
  let admissionYear = 2026;
  if (student.tanggalDiterima) {
    const tpMasuk = getAcademicYearFromDate(student.tanggalDiterima);
    admissionYear = getAcademicYearStart(tpMasuk);
  } else if (student.tahunMasuk && /^\d{4}$/.test(student.tahunMasuk.trim())) {
    admissionYear = parseInt(student.tahunMasuk.trim(), 10);
  } else {
    // Estimasi mundur dari kelasSekarang
    const baseGrade = getTingkatKelasNumber(student.kelasSekarang || 'Kelas 1');
    admissionYear = baseYear - (Math.max(1, baseGrade) - 1);
  }

  const admittedGrade = getTingkatKelasNumber(student.diterimaDiKelas || 'Kelas 1');

  // Deteksi apakah siswa merupakan Alumni / Lulus dan cari tahun kelulusannya
  let alumniLulusYear: number | null = null;
  if (student.sttb?.lulusTahun && /^\d{4}$/.test(student.sttb.lulusTahun.trim())) {
    alumniLulusYear = parseInt(student.sttb.lulusTahun.trim(), 10);
  } else if (student.sttb?.tanggalKelulusan) {
    const m = student.sttb.tanggalKelulusan.match(/\b(20\d{2})\b/);
    if (m) alumniLulusYear = parseInt(m[1], 10);
  } else if (student.kelasSekarang && (student.status === 'Lulus' || student.kelasSekarang.toLowerCase().includes('alumni') || student.kelasSekarang.toLowerCase().includes('lulus'))) {
    const m = student.kelasSekarang.match(/\b(20\d{2})\b/);
    if (m) alumniLulusYear = parseInt(m[1], 10);
  } else if ((student as any).tahunLulus) {
    const m = String((student as any).tahunLulus).match(/\b(20\d{2})\b/);
    if (m) alumniLulusYear = parseInt(m[1], 10);
  } else if (student.status === 'Lulus') {
    alumniLulusYear = admissionYear + (6 - admittedGrade) + 1;
  }

  // JIKA SISWA MERUPAKAN ALUMNI / LULUS:
  // Lulus pada tahun alumniLulusYear (misal 2026).
  // Tahun Pelajaran kelulusannya adalah TP (alumniLulusYear - 1)/alumniLulusYear (misal 2025/2026), di mana siswa berada di Kelas 6.
  // - Jika targetYear >= alumniLulusYear: Siswa sudah Lulus / Alumni
  // - Jika targetYear < alumniLulusYear: Siswa saat itu masih aktif di SD!
  //   Tingkat kelasnya dihitung mundur: 6 - ((alumniLulusYear - 1) - targetYear) = targetYear - alumniLulusYear + 7
  if (alumniLulusYear !== null) {
    if (targetYear >= alumniLulusYear) {
      const alumniLabel = `Alumni (Tahun ${student.sttb?.lulusTahun || alumniLulusYear})`;
      return {
        ...student,
        kelasSekarang: alumniLabel,
        status: 'Lulus',
        projectedRombel: alumniLabel,
        projectedStatus: 'Lulus',
        projectedTingkat: 7,
        isBelumMasukSD: false,
        baseRombel: student.kelasSekarang,
        baseStatus: student.status,
        diffYears,
      };
    } else {
      // targetYear < alumniLulusYear: Waktu itu siswa masih aktif belajar!
      const gradeInTargetYear = targetYear - alumniLulusYear + 7;
      if (gradeInTargetYear <= 0 || targetYear < admissionYear) {
        return {
          ...student,
          kelasSekarang: 'Belum Masuk SD',
          status: 'Belum Masuk SD',
          projectedRombel: 'Belum Masuk SD',
          projectedStatus: 'Belum Masuk SD',
          projectedTingkat: 0,
          isBelumMasukSD: true,
          baseRombel: student.kelasSekarang,
          baseStatus: student.status,
          diffYears,
        };
      } else {
        const rombelName = `Kelas ${gradeInTargetYear}`;
        return {
          ...student,
          kelasSekarang: rombelName,
          status: 'Aktif',
          projectedRombel: rombelName,
          projectedStatus: 'Aktif',
          projectedTingkat: gradeInTargetYear,
          isBelumMasukSD: false,
          baseRombel: student.kelasSekarang,
          baseStatus: student.status,
          diffYears,
        };
      }
    }
  }

  const baseGrade = getTingkatKelasNumber(student.kelasSekarang || 'Kelas 1');
  const projectedGrade = baseGrade + diffYears;

  // KONDISI 1: Belum Masuk SD
  // Terjadi jika targetYear sebelum tahun siswa diterima atau proyeksi tingkat <= 0
  if (targetYear < admissionYear || projectedGrade <= 0) {
    return {
      ...student,
      kelasSekarang: 'Belum Masuk SD',
      status: 'Belum Masuk SD',
      projectedRombel: 'Belum Masuk SD',
      projectedStatus: 'Belum Masuk SD',
      projectedTingkat: 0,
      isBelumMasukSD: true,
      baseRombel: student.kelasSekarang,
      baseStatus: student.status,
      diffYears,
    };
  }

  // KONDISI 2: Sudah Lulus / Alumni (Tingkat > 6)
  if (projectedGrade > 6) {
    const estimatedGradYear = admissionYear + (6 - admittedGrade) + 1;
    const alumniLabel = student.sttb?.lulusTahun 
      ? `Alumni (Tahun ${student.sttb.lulusTahun})`
      : `Alumni (Tahun ${estimatedGradYear})`;

    return {
      ...student,
      kelasSekarang: alumniLabel,
      status: 'Lulus',
      projectedRombel: alumniLabel,
      projectedStatus: 'Lulus',
      projectedTingkat: 7,
      isBelumMasukSD: false,
      baseRombel: student.kelasSekarang,
      baseStatus: student.status,
      diffYears,
    };
  }

  // KONDISI 3: Siswa Tingkat 1 s/d 6 pada Tahun Pelajaran target
  // Sinkronisasi status siswa persis dengan Buku Induk Siswa (Aktif, Lulus, Mutasi Keluar, Drop Out, Meninggal)
  let projectedStatus: StudentStatus = student.status || 'Aktif';
  if (student.status === 'Mutasi Keluar') {
    if (student.mutasi?.tglMeninggalkan) {
      const mutasiYear = getAcademicYearStart(getAcademicYearFromDate(student.mutasi.tglMeninggalkan));
      if (targetYear >= mutasiYear) {
        projectedStatus = 'Mutasi Keluar';
      } else {
        projectedStatus = 'Aktif';
      }
    } else {
      projectedStatus = 'Mutasi Keluar';
    }
  } else if (student.status === 'Lulus') {
    if (student.sttb?.lulusTahun) {
      const lulusYear = parseInt(student.sttb.lulusTahun, 10);
      if (targetYear >= lulusYear) {
        projectedStatus = 'Lulus';
      } else {
        projectedStatus = 'Aktif';
      }
    } else {
      projectedStatus = 'Lulus';
    }
  } else if (student.status === 'Drop Out' || student.status === 'Meninggal') {
    projectedStatus = student.status;
  }

  // Rekonstruksi nama rombel dengan mempertahankan awalan & akhiran/abjad
  // Contoh: "Kelas 1A" -> "Kelas 2A", "1B" -> "2B", "Kelas 3-A" -> "Kelas 2-A"
  const rawClass = student.kelasSekarang || 'Kelas 1';
  let projectedRombel = `Kelas ${projectedGrade}`;

  const numMatch = rawClass.match(/^(\s*(?:kelas|tingkat|rombel)?\s*)([1-6])(.*)$/i);
  if (numMatch) {
    const prefix = numMatch[1] || 'Kelas ';
    const suffix = numMatch[3] || '';
    projectedRombel = `${prefix}${projectedGrade}${suffix}`.trim();
  } else if (/\bvi\b/i.test(rawClass) || /\bv\b/i.test(rawClass) || /\biv\b/i.test(rawClass) || /\biii\b/i.test(rawClass) || /\bii\b/i.test(rawClass) || /\bi\b/i.test(rawClass)) {
    const romanGrades = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
    projectedRombel = `Kelas ${romanGrades[projectedGrade] || projectedGrade}`;
  }

  return {
    ...student,
    kelasSekarang: projectedRombel,
    status: projectedStatus,
    projectedRombel,
    projectedStatus,
    projectedTingkat: projectedGrade,
    isBelumMasukSD: false,
    baseRombel: student.kelasSekarang,
    baseStatus: student.status,
    diffYears,
  };
}

/**
 * Menghitung proyeksi rombel untuk seluruh array siswa berdasarkan Tahun Pelajaran Aktif
 */
export function projectStudentsForAcademicYear(
  students: Student[],
  targetTP: string,
  baseSchoolTP: string = '2026/2027'
): ProjectedStudent[] {
  return students.map(s => projectStudentForAcademicYear(s, targetTP, baseSchoolTP));
}

/**
 * Helper: Mengenali apakah siswa adalah siswa mutasi masuk / pindahan
 * berdasarkan data profil siswa (diterima di tingkat kelas 2 s/d 6, sekolah asal SD/MI, atau SKP)
 */
export const isStudentMutasiMasuk = (s: Student): boolean => {
  if (!s) return false;
  
  // 1. Cek diterimaDiKelas: jika diterima di tingkat kelas 2, 3, 4, 5, 6 (bukan kelas 1)
  const rawClass = (s.diterimaDiKelas || '').trim().toLowerCase();
  
  // Kecualikan kelas 1 (dan legacy typo '7')
  const isKelas1 = !rawClass || 
    rawClass === '1' || 
    rawClass === 'kelas 1' || 
    rawClass === 'kelas 1a' || 
    rawClass === 'kelas 1b' ||
    rawClass === '7' || 
    rawClass === '7a' ||
    rawClass === 'kelas 7';

  const isDiterimaTingkatLanjutan = !isKelas1 && (
    /\b[2-6]\b/.test(rawClass) ||
    /kelas\s*[2-6]/i.test(rawClass) ||
    /\b(?:ii|iii|iv|v|vi)\b/i.test(rawClass)
  );

  // 2. Cek sekolah asal: SD / MI / Sekolah Dasar / Madrasah / ada kata 'pindahan'
  const isSekolahAsalSD = Boolean(s.sekolahAsalTK && (
    s.sekolahAsalTK.toLowerCase().includes('sd') ||
    s.sekolahAsalTK.toLowerCase().includes('mi') ||
    s.sekolahAsalTK.toLowerCase().includes('sekolah dasar') ||
    s.sekolahAsalTK.toLowerCase().includes('madrasah') ||
    s.sekolahAsalTK.toLowerCase().includes('pindahan')
  ));

  // 3. Cek nomor surat keterangan pindah (SKP)
  const hasTransferSurat = Boolean(s.noIjazahTK && (
    s.noIjazahTK.toLowerCase().includes('skp') || 
    s.noIjazahTK.toLowerCase().includes('pindah') ||
    s.noIjazahTK.toLowerCase().includes('mutasi')
  ));

  return isDiterimaTingkatLanjutan || isSekolahAsalSD || hasTransferSurat;
};

export const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const SHORT_BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export interface AcademicMonthInfo {
  key: string; // YYYY-MM
  year: number;
  monthNum: number; // 1-12
  monthIndex: number; // 0-11
  monthName: string;
  shortName: string;
  fullName: string;
  semester: 'Ganjil' | 'Genap';
  isCurrent: boolean;
}

export interface MonthlyPeriodicStatResult {
  month: AcademicMonthInfo;
  totalAwal: number;
  totalAwalL: number;
  totalAwalP: number;
  awalList: ProjectedStudent[];
  masukList: ProjectedStudent[];
  masukCount: number;
  masukL: number;
  masukP: number;
  mutasiList: ProjectedStudent[];
  mutasiCount: number;
  mutasiL: number;
  mutasiP: number;
  meninggalList: ProjectedStudent[];
  meninggalCount: number;
  meninggalL: number;
  meninggalP: number;
  totalAkhir: number;
  totalAkhirL: number;
  totalAkhirP: number;
  akhirList: ProjectedStudent[];
  netChange: number;
  tingkatCounts: Record<number, { total: number; l: number; p: number; jmlL: number; jmlP: number }>;
  totalAktif: number;
  totalAktifL: number;
  totalAktifP: number;
}

export const extractYearMonth = (val?: string | null): string | null => {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    return `${y}-${m}`;
  }

  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const y = dmyMatch[3];
    const m = dmyMatch[2].padStart(2, '0');
    return `${y}-${m}`;
  }

  const monthMap: Record<string, string> = {
    jan: '01', januari: '01',
    feb: '02', februari: '02',
    mar: '03', maret: '03',
    apr: '04', april: '04',
    mei: '05',
    jun: '06', juni: '06',
    jul: '07', juli: '07',
    ags: '08', agustus: '08',
    sep: '09', september: '09',
    okt: '10', oktober: '10',
    nov: '11', november: '11',
    des: '12', desember: '12'
  };
  const parts = trimmed.toLowerCase().split(/[\s,.-]+/);
  let foundMonth: string | null = null;
  let foundYear: string | null = null;
  for (const p of parts) {
    if (monthMap[p]) {
      foundMonth = monthMap[p];
    } else if (/^\d{4}$/.test(p)) {
      foundYear = p;
    }
  }
  if (foundMonth && foundYear) {
    return `${foundYear}-${foundMonth}`;
  }

  return null;
};

export const getStudentAdmissionMonthKey = (s: Student, startYear: number): string => {
  const parsedDiterima = extractYearMonth(s.tanggalDiterima);
  if (parsedDiterima) return parsedDiterima;

  const parsedMasuk = extractYearMonth((s as any).tanggalMasuk);
  if (parsedMasuk) return parsedMasuk;

  if (s.tahunMasuk && /^\d{4}$/.test(s.tahunMasuk.trim())) {
    return `${s.tahunMasuk.trim()}-07`;
  }
  const parsedCreated = extractYearMonth(s.createdAt);
  if (parsedCreated) return parsedCreated;

  const grade = getTingkatKelasNumber(s.kelasSekarang || 'Kelas 1');
  const estimatedYear = startYear - (Math.max(1, grade) - 1);
  return `${estimatedYear}-07`;
};

export const getStudentMeninggalMonthKey = (s: Student, startYear: number): string | null => {
  if (s.status !== 'Meninggal') return null;
  const tgl = (s as any).tanggalMeninggal || s.mutasi?.tglMeninggalkan || s.mutasi?.dikeluarkanTanggal;
  const parsed = extractYearMonth(tgl);
  if (parsed) return parsed;

  const parsedUpdated = extractYearMonth(s.updatedAt);
  if (parsedUpdated) return parsedUpdated;

  return `${startYear}-10`;
};

export const getStudentMutationMonthKey = (s: Student, startYear: number): string | null => {
  if (s.status === 'Meninggal') {
    return null;
  }
  const tgl = s.mutasi?.tglMeninggalkan || s.mutasi?.dikeluarkanTanggal || (s as any).tanggalMutasi || (s as any).tanggalMutasiKeluar;
  const parsed = extractYearMonth(tgl);
  if (parsed) return parsed;

  if (s.status === 'Mutasi Keluar' || s.status === 'Drop Out') {
    const parsedUpdated = extractYearMonth(s.updatedAt);
    if (parsedUpdated) return parsedUpdated;
    return `${startYear}-07`;
  }
  return null;
};

/**
 * Menghitung Statistik Bulanan & Periodik Siswa Aktif untuk Tahun Pelajaran tertentu
 * Menghasilkan data untuk setiap bulan dalam kalender akademik dan bulan yang sedang berjalan.
 */
export function calculateMonthlyPeriodicStats(
  projectedStudents: ProjectedStudent[],
  activeTP: string
): {
  academicMonths: AcademicMonthInfo[];
  periodicMonthlyStats: MonthlyPeriodicStatResult[];
  runningMonth: AcademicMonthInfo;
  runningMonthData: MonthlyPeriodicStatResult;
} {
  const startYear = getAcademicYearStart(activeTP);
  const endYear = startYear + 1;
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const sequence = [
    { num: 7, year: startYear, sem: 'Ganjil' as const },
    { num: 8, year: startYear, sem: 'Ganjil' as const },
    { num: 9, year: startYear, sem: 'Ganjil' as const },
    { num: 10, year: startYear, sem: 'Ganjil' as const },
    { num: 11, year: startYear, sem: 'Ganjil' as const },
    { num: 12, year: startYear, sem: 'Ganjil' as const },
    { num: 1, year: endYear, sem: 'Genap' as const },
    { num: 2, year: endYear, sem: 'Genap' as const },
    { num: 3, year: endYear, sem: 'Genap' as const },
    { num: 4, year: endYear, sem: 'Genap' as const },
    { num: 5, year: endYear, sem: 'Genap' as const },
    { num: 6, year: endYear, sem: 'Genap' as const },
  ];

  const academicMonths: AcademicMonthInfo[] = sequence.map((item, index) => {
    const key = `${item.year}-${String(item.num).padStart(2, '0')}`;
    return {
      key,
      year: item.year,
      monthNum: item.num,
      monthIndex: index,
      monthName: NAMA_BULAN[item.num - 1],
      shortName: SHORT_BULAN[item.num - 1],
      fullName: `${NAMA_BULAN[item.num - 1]} ${item.year}`,
      semester: item.sem,
      isCurrent: key === currentYearMonth,
    };
  });

  const eligibleStudentsForTP = projectedStudents.filter(p => {
    if (!isKelas1Sampai6(p.kelasSekarang) || p.projectedTingkat < 1 || p.projectedTingkat > 6) {
      return false;
    }
    const mutKey = getStudentMutationMonthKey(p, startYear);
    if (mutKey && mutKey < `${startYear}-07`) {
      return false;
    }
    const menKey = getStudentMeninggalMonthKey(p, startYear);
    if (menKey && menKey < `${startYear}-07`) {
      return false;
    }
    const admKey = getStudentAdmissionMonthKey(p, startYear);
    if (admKey > `${endYear}-06`) {
      return false;
    }
    return true;
  });

  const startOfJulyKey = `${startYear}-07`;
  let runningActiveList = eligibleStudentsForTP.filter(s => {
    const admKey = getStudentAdmissionMonthKey(s, startYear);
    const mutKey = getStudentMutationMonthKey(s, startYear);
    const menKey = getStudentMeninggalMonthKey(s, startYear);
    const enteredBeforeJuly = admKey < startOfJulyKey;
    const notMutatedBeforeJuly = !mutKey || mutKey >= startOfJulyKey;
    const notMeninggalBeforeJuly = !menKey || menKey >= startOfJulyKey;
    return enteredBeforeJuly && notMutatedBeforeJuly && notMeninggalBeforeJuly;
  });

  const periodicMonthlyStats: MonthlyPeriodicStatResult[] = academicMonths.map(m => {
    const awalList = [...runningActiveList];
    const awalL = awalList.filter(s => s.jenisKelamin === 'L').length;
    const awalP = awalList.filter(s => s.jenisKelamin === 'P').length;
    const totalAwal = awalList.length;

    const masukList = eligibleStudentsForTP.filter(s => {
      const admKey = getStudentAdmissionMonthKey(s, startYear);
      return admKey === m.key;
    });
    const masukL = masukList.filter(s => s.jenisKelamin === 'L').length;
    const masukP = masukList.filter(s => s.jenisKelamin === 'P').length;
    const masukCount = masukList.length;

    const mutasiList = eligibleStudentsForTP.filter(s => {
      const mutKey = getStudentMutationMonthKey(s, startYear);
      return mutKey === m.key;
    });
    const mutasiL = mutasiList.filter(s => s.jenisKelamin === 'L').length;
    const mutasiP = mutasiList.filter(s => s.jenisKelamin === 'P').length;
    const mutasiCount = mutasiList.length;

    const meninggalList = eligibleStudentsForTP.filter(s => {
      const menKey = getStudentMeninggalMonthKey(s, startYear);
      return menKey === m.key;
    });
    const meninggalL = meninggalList.filter(s => s.jenisKelamin === 'L').length;
    const meninggalP = meninggalList.filter(s => s.jenisKelamin === 'P').length;
    const meninggalCount = meninggalList.length;

    const mutasiIds = new Set(mutasiList.map(s => s.id));
    const meninggalIds = new Set(meninggalList.map(s => s.id));
    const akhirMap = new Map<string, ProjectedStudent>();

    awalList.forEach(s => {
      if (!mutasiIds.has(s.id) && !meninggalIds.has(s.id)) {
        akhirMap.set(s.id, s);
      }
    });
    masukList.forEach(s => {
      if (!mutasiIds.has(s.id) && !meninggalIds.has(s.id)) {
        akhirMap.set(s.id, s);
      }
    });

    const rawAkhirList = Array.from(akhirMap.values());
    const akhirList = rawAkhirList.filter(s => {
      const mutKey = getStudentMutationMonthKey(s, startYear);
      if (mutKey && mutKey <= m.key) return false;
      const menKey = getStudentMeninggalMonthKey(s, startYear);
      if (menKey && menKey <= m.key) return false;
      if (m.isCurrent && (s.status === 'Mutasi Keluar' || s.status === 'Meninggal' || s.status === 'Drop Out' || s.status === 'Lulus')) {
        return false;
      }
      return true;
    });

    const akhirL = akhirList.filter(s => s.jenisKelamin === 'L').length;
    const akhirP = akhirList.filter(s => s.jenisKelamin === 'P').length;
    const totalAkhir = akhirList.length;
    const netChange = masukCount - mutasiCount - meninggalCount;

    runningActiveList = akhirList;

    const tingkatCounts: Record<number, { total: number; l: number; p: number; jmlL: number; jmlP: number }> = {
      1: { total: 0, l: 0, p: 0, jmlL: 0, jmlP: 0 },
      2: { total: 0, l: 0, p: 0, jmlL: 0, jmlP: 0 },
      3: { total: 0, l: 0, p: 0, jmlL: 0, jmlP: 0 },
      4: { total: 0, l: 0, p: 0, jmlL: 0, jmlP: 0 },
      5: { total: 0, l: 0, p: 0, jmlL: 0, jmlP: 0 },
      6: { total: 0, l: 0, p: 0, jmlL: 0, jmlP: 0 },
    };

    akhirList.forEach(s => {
      const t = getTingkatKelasNumber(s.kelasSekarang);
      if (t >= 1 && t <= 6) {
        tingkatCounts[t].total += 1;
        if (s.jenisKelamin === 'L') {
          tingkatCounts[t].l += 1;
          tingkatCounts[t].jmlL += 1;
        } else {
          tingkatCounts[t].p += 1;
          tingkatCounts[t].jmlP += 1;
        }
      }
    });

    return {
      month: m,
      totalAwal,
      totalAwalL: awalL,
      totalAwalP: awalP,
      awalList,
      masukList,
      masukCount,
      masukL,
      masukP,
      mutasiList,
      mutasiCount,
      mutasiL,
      mutasiP,
      meninggalList,
      meninggalCount,
      meninggalL,
      meninggalP,
      totalAkhir,
      totalAkhirL: akhirL,
      totalAkhirP: akhirP,
      akhirList,
      netChange,
      tingkatCounts,
      totalAktif: totalAkhir,
      totalAktifL: akhirL,
      totalAktifP: akhirP,
    };
  });

  // Penentuan bulan berjalan:
  // 1. Bulan kalender saat ini jika berada di dalam TP aktif
  // 2. Jika TP sudah lewat (today > endYear-06), gunakan bulan penutup (Juni endYear)
  // 3. Jika TP belum berjalan (today < startYear-07), gunakan bulan pembuka (Juli startYear)
  let runningMonth = academicMonths.find(m => m.isCurrent);
  if (!runningMonth) {
    if (currentYearMonth > `${endYear}-06`) {
      runningMonth = academicMonths[academicMonths.length - 1]; // Juni endYear
    } else if (currentYearMonth < `${startYear}-07`) {
      runningMonth = academicMonths[0]; // Juli startYear
    } else {
      runningMonth = academicMonths.find(m => m.monthNum === today.getMonth() + 1) || academicMonths[0];
    }
  }

  const runningMonthData = periodicMonthlyStats.find(p => p.month.key === runningMonth.key) || periodicMonthlyStats[0];

  return { academicMonths, periodicMonthlyStats, runningMonth, runningMonthData };
}
