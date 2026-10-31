/**
 * BUKU INDUK GURU & TENAGA KEPENDIDIKAN (GTK)
 * Excel Import / Export & Template Helper
 * Standar Dapodik Kemdikbudristek & BKN
 */

import * as XLSX from 'xlsx';
import { AdminUser, TeacherDutyCategory, TeacherActiveStatus, SchoolProfile } from '../types';

export const TEACHER_EXCEL_HEADERS = [
  'No',
  'Nama Lengkap',
  'Gelar Depan',
  'Gelar Belakang',
  'NIP',
  'NUPTK',
  'NIK',
  'Jenis Kelamin (L/P)',
  'Tempat Lahir',
  'Tanggal Lahir (YYYY-MM-DD)',
  'Nama Ibu Kandung',
  'Agama',
  'Status Pernikahan',
  'No HP / WhatsApp',
  'Email',
  'Alamat Rumah',
  'Status Kepegawaian',
  'Pangkat Golongan',
  'Pendidikan Terakhir',
  'Jurusan Pendidikan',
  'Perguruan Tinggi / Asal',
  'Kategori Tugas',
  'Jabatan / Tugas Pokok',
  'Tingkat Kelas (Khusus Guru Kelas)',
  'Mata Pelajaran (Khusus Guru Mapel)',
  'Tugas Tendik (Khusus Tendik)',
  'Tugas Tambahan',
  'Status Keaktifan',
  'TMT Masuk / Pengangkatan (YYYY-MM-DD)',
  // Mutasi Masuk
  'Asal Sekolah / Instansi (Mutasi Masuk)',
  'No SK Masuk',
  'Tanggal SK Masuk',
  'Alasan Masuk',
  // Mutasi Keluar & Keluar Karena Apa
  'Keluar Karena Apa (Alasan Keluar)',
  'Sekolah / Instansi Tujuan (Mutasi Keluar)',
  'Tanggal Keluar / TMT Keluar',
  'No SK Mutasi / Keluar',
  'Tanggal SK Mutasi / Keluar',
  'Pejabat Penetap SK Keluar',
  'Keterangan / Catatan Keluar',
];

export const SAMPLE_TEACHER_ROWS = [
  [
    1,
    'H. MARLISMAN, S.Pd., M.M.',
    'H.',
    'S.Pd., M.M.',
    '19680512 199103 1 005',
    '8745746648200032',
    '1409051205680001',
    'L',
    'Teluk Kuantan',
    '1968-05-12',
    'Siti Aminah',
    'Islam',
    'Menikah',
    '081275891234',
    'marlisman@sdn006.sch.id',
    'Jl. Utama No. 12 Desa Sungai Buluh',
    'PNS (Pegawai Negeri Sipil)',
    'Pembina Tingkat I (IV/b)',
    'S2 / Magister',
    'Manajemen Pendidikan',
    'Universitas Riau',
    'Kepala Sekolah',
    'Kepala Sekolah (Penanggung Jawab Utama)',
    '-',
    '-',
    '-',
    'Ketua K3S Kecamatan',
    'Aktif',
    '1991-03-01',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ],
  [
    2,
    'DEWI ANGGRAINI, S.Pd.SD',
    '',
    'S.Pd.SD',
    '19901103 201502 2 009',
    '3456768669210043',
    '1409054311900002',
    'P',
    'Pekanbaru',
    '1990-11-03',
    'Nurhayati',
    'Islam',
    'Menikah',
    '081270112233',
    'dewi.anggraini@sdn006.sch.id',
    'Perumahan Guru SDN 006 Sungai Buluh',
    'PNS (Pegawai Negeri Sipil)',
    'Penata (III/c)',
    'S1 / Sarjana (D-IV)',
    'Pendidikan Guru Sekolah Dasar (PGSD)',
    'Universitas Negeri Padang',
    'Wali Kelas',
    'Wali Kelas 1 & Koordinator Kurikulum Merdeka',
    'Kelas 1',
    '-',
    '-',
    'Koordinator Tim Kurikulum',
    'Aktif',
    '2015-02-01',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ],
  [
    3,
    'AHMAD FAUZI, S.Pd.I.',
    '',
    'S.Pd.I.',
    '19930718 201903 1 006',
    '6543771672130092',
    '1409051807930005',
    'L',
    'Kuansing',
    '1993-07-18',
    'Fatimah',
    'Islam',
    'Menikah',
    '082178904561',
    'ahmad.fauzi@sdn006.sch.id',
    'RT 003 RW 001 Dusun Suka Maju',
    'PPPK (Pegawai Pemerintah dg Perjanjian Kerja)',
    'Penata Muda (III/a)',
    'S1 / Sarjana (D-IV)',
    'Pendidikan Agama Islam (PAI)',
    'UIN Sultan Syarif Kasim Riau',
    'Guru Mapel',
    'Guru Mapel Pendidikan Agama Islam',
    '-',
    'Pendidikan Agama Islam & Budi Pekerti',
    '-',
    'Pembina Rohis & MTQ Siswa',
    'Aktif',
    '2019-03-01',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ],
  [
    4,
    'RAHMAT HIDAYAT, S.Kom.',
    '',
    'S.Kom.',
    '19920415 201902 1 008',
    '4532770671130081',
    '1409051504920003',
    'L',
    'Sungai Buluh',
    '1992-04-15',
    'Siti Aisyah',
    'Islam',
    'Menikah',
    '081378901234',
    'operator.rahmat@sdn006.sch.id',
    'Jl. Poros RT 002 RW 001 Sungai Buluh',
    'PPPK (Pegawai Pemerintah dg Perjanjian Kerja)',
    'Penata Muda (III/a)',
    'S1 / Sarjana (D-IV)',
    'Sistem Informasi / Teknik Informatika',
    'Universitas Islam Riau',
    'Tenaga Kependidikan',
    'Tenaga Administrasi Sekolah (Tata Usaha) & Operator',
    '-',
    '-',
    'Operator Dapodik & SIM Sekolah',
    'Pengelola SIM Inventaris Sekolah',
    'Aktif',
    '2019-02-01',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ],
  [
    5,
    'SRI WAHYUNI, A.Md.',
    '',
    'A.Md.',
    '-',
    '-',
    '1409056006950007',
    'P',
    'Singingi',
    '1995-06-20',
    'Mariana',
    'Islam',
    'Belum Menikah',
    '082283459988',
    'sri.wahyuni@sdn006.sch.id',
    'Dusun Giri Maju RT 001 RW 002',
    'Tenaga Honorer / Staf Teknis',
    '- (Non-PNS / Non-Golongan)',
    'D3 / Diploma III',
    'Akuntansi / Perpajakan',
    'Politeknik Negeri Padang',
    'Tenaga Kependidikan',
    'Bendahara BOS & Keuangan Sekolah',
    '-',
    '-',
    'Bendahara BOS & Keuangan Sekolah',
    'Pengelola SPJ Dana Bantuan Siswa',
    'Aktif',
    '2021-01-05',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ],
  [
    6,
    'HENDRA SAPUTRA',
    '',
    '',
    '-',
    '-',
    '1409051009890004',
    'L',
    'Sungai Buluh',
    '1989-09-10',
    'Khadijah',
    'Islam',
    'Menikah',
    '085278119900',
    'hendra.penjaga@sdn006.sch.id',
    'Rumah Jaga Lingkungan SDN 006',
    'Tenaga Honorer / Staf Teknis',
    '- (Non-PNS / Non-Golongan)',
    'SMA / SMK / Sederajat',
    'Ilmu Pengetahuan Sosial',
    'SMAN 1 Singingi Hilir',
    'Tenaga Kependidikan',
    'Petugas Keamanan & Penjaga Sekolah',
    '-',
    '-',
    'Petugas Keamanan / Penjaga Sekolah',
    'Petugas Perawatan Sarana & Prasarana',
    'Aktif',
    '2018-07-16',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-'
  ],
  [
    7,
    'NURHASANAH, S.Pd.',
    '',
    'S.Pd.',
    '19940215 202012 2 006',
    '7890772674230041',
    '1409055502940003',
    'P',
    'Lipat Kain',
    '1994-02-15',
    'Rosmawati',
    'Islam',
    'Menikah',
    '081365443322',
    'nurhasanah@sdn006.sch.id',
    'RT 004 RW 002 Dusun Rukun Makmur',
    'PPPK (Pegawai Pemerintah dg Perjanjian Kerja)',
    'Penata Muda (III/a)',
    'S1 / Sarjana (D-IV)',
    'PGSD',
    'Universitas Riau',
    'Wali Kelas',
    'Wali Kelas 3 (Mutasi Masuk)',
    'Kelas 3',
    '-',
    '-',
    'Pembina Seni Tari Melayu',
    'Mutasi Masuk',
    '2024-07-15',
    'SDN 002 Singingi Hilir',
    '821.2/DISDIK-KS/MUTASI/2024/078',
    '2024-07-08',
    'Mengikuti penempatan mutasi dinas untuk pemenuhan guru kelas',
    '-',
    '-',
    '-',
    '-',
    '-',
    '-',
    'SK Mutasi Masuk Disdik Kuantan Singingi'
  ],
  [
    8,
    'Drs. H. SYAAMSUDIN',
    'Drs.',
    'M.Pd.',
    '19640410 198603 1 008',
    '4532742644200012',
    '1409051004640002',
    'L',
    'Muara Lembu',
    '1964-04-10',
    'Mariam',
    'Islam',
    'Menikah',
    '081275990011',
    'syaamsudin@sdn006.sch.id',
    'Jl. Jenderal Sudirman No. 45 Muara Lembu',
    'PNS (Pegawai Negeri Sipil)',
    'Pembina Utama Muda (IV/c)',
    'S2 / Magister',
    'Manajemen Pendidikan',
    'Universitas Riau',
    'Wali Kelas',
    'Mantan Guru Kelas Senior (Purna Tugas)',
    'Kelas 6',
    '-',
    '-',
    '-',
    'Pensiun',
    '1986-03-01',
    '-',
    '-',
    '-',
    '-',
    'Pensiun Batas Usia Pensiun (BUP)',
    '-',
    '2024-05-01',
    '00045/BKN/PENSIUN/2024',
    '2024-04-15',
    'BKN Kantor Regional XII',
    'Pensiun resmi per 1 Mei 2024 usia 60 tahun'
  ],
  [
    9,
    'IRFAN FAHREZI, S.Pd.',
    '',
    'S.Pd.',
    '19950821 202203 1 002',
    '5643773675130093',
    '1409052108950001',
    'L',
    'Taluk Kuantan',
    '1995-08-21',
    'Nurjanah',
    'Islam',
    'Belum Menikah',
    '081270998877',
    'irfan.fahrezi@sdn006.sch.id',
    'Jl. Diponegoro RT 001 RW 001 Teluk Kuantan',
    'PPPK (Pegawai Pemerintah dg Perjanjian Kerja)',
    'Penata Muda (III/a)',
    'S1 / Sarjana (D-IV)',
    'Pendidikan Bahasa Inggris',
    'Universitas Islam Riau',
    'Guru Mapel',
    'Guru Mapel Bahasa Inggris',
    '-',
    'Bahasa Inggris',
    '-',
    '-',
    'Mutasi Keluar',
    '2022-03-01',
    '-',
    '-',
    '-',
    '-',
    'Pindah Tugas / Mutasi Dinas ke Sekolah Lain',
    'SD Negeri 001 Teluk Kuantan',
    '2025-07-10',
    '824/DISDIK-KS/MUT/2025/112',
    '2025-07-02',
    'Kepala Dinas Pendidikan Kuantan Singingi',
    'Pindah tugas mendekati domisili keluarga di ibukota kabupaten'
  ]
];

export const TEACHER_TEMPLATE_INSTRUCTIONS = [
  {
    Kolom: 'Nama Lengkap',
    Wajib: 'YA',
    Keterangan: 'Nama lengkap pegawai beserta gelar akademik (contoh: H. MARLISMAN, S.Pd., M.M.)'
  },
  {
    Kolom: 'NIP',
    Wajib: 'TIDAK',
    Keterangan: 'Nomor Induk Pegawai 18 digit untuk PNS/PPPK. Jika belum ada isi tanda (-)'
  },
  {
    Kolom: 'NUPTK',
    Wajib: 'TIDAK',
    Keterangan: 'Nomor Unik Pendidik dan Tenaga Kependidikan 16 digit Kemdikbudristek'
  },
  {
    Kolom: 'NIK',
    Wajib: 'TIDAK',
    Keterangan: 'Nomor Induk Kependudukan 16 digit sesuai e-KTP / Kartu Keluarga'
  },
  {
    Kolom: 'Jenis Kelamin (L/P)',
    Wajib: 'YA',
    Keterangan: 'Isi L untuk Laki-Laki atau P untuk Perempuan'
  },
  {
    Kolom: 'Kategori Tugas',
    Wajib: 'YA',
    Keterangan: 'Pilih: "Kepala Sekolah", "Wali Kelas", "Guru Mapel", atau "Tenaga Kependidikan"'
  },
  {
    Kolom: 'Jabatan / Tugas Pokok',
    Wajib: 'YA',
    Keterangan: 'Uraian jabatan (contoh: Wali Kelas 1, Guru Mapel PAI, Operator Dapodik & TU, Bendahara BOS, Satpam Sekolah)'
  },
  {
    Kolom: 'Status Kepegawaian',
    Wajib: 'YA',
    Keterangan: 'Pilih: PNS (Pegawai Negeri Sipil), PPPK, Guru Honorer Sekolah, Guru Tetap Yayasan (GTY), Tenaga Honorer / Staf Teknis'
  },
  {
    Kolom: 'Status Keaktifan',
    Wajib: 'YA',
    Keterangan: 'Pilih: "Aktif", "Mutasi Masuk", "Mutasi Keluar", "Pensiun", "Cuti", "Mengundurkan Diri", "Meninggal", atau "Nonaktif"'
  },
  {
    Kolom: 'Keluar Karena Apa (Alasan Keluar)',
    Wajib: 'Khusus Mutasi Keluar / Pensiun / Nonaktif',
    Keterangan: 'Pilih / Isi alasan: "Pindah Tugas / Mutasi Dinas ke Sekolah Lain", "Pensiun Batas Usia Pensiun (BUP)", "Pensiun Dini", "Mengundurkan Diri / Resign", "Meninggal Dunia", "Pemberhentian / Habis Kontrak"'
  },
  {
    Kolom: 'Asal Sekolah (Mutasi Masuk)',
    Wajib: 'Khusus Mutasi Masuk',
    Keterangan: 'Nama sekolah atau instansi asal sebelum bertugas di sekolah ini'
  },
  {
    Kolom: 'Sekolah / Instansi Tujuan (Mutasi Keluar)',
    Wajib: 'Khusus Mutasi Keluar',
    Keterangan: 'Nama sekolah atau instansi tujuan kepindahan pegawai'
  }
];

/**
 * Downloads the complete standard Excel template for Guru & Tenaga Kependidikan
 */
export const downloadTeacherTemplateExcel = (schoolName: string = 'SDN 006 SUNGAI BULUH') => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: DATA_GURU_DAN_TENDIK
  const wsData = XLSX.utils.aoa_to_sheet([
    TEACHER_EXCEL_HEADERS,
    ...SAMPLE_TEACHER_ROWS
  ]);

  // Set column widths
  const colWidths = [
    { wch: 5 },  // No
    { wch: 28 }, // Nama Lengkap
    { wch: 10 }, // Gelar Depan
    { wch: 12 }, // Gelar Belakang
    { wch: 22 }, // NIP
    { wch: 20 }, // NUPTK
    { wch: 20 }, // NIK
    { wch: 18 }, // JK
    { wch: 16 }, // Tempat Lahir
    { wch: 22 }, // Tanggal Lahir
    { wch: 20 }, // Ibu Kandung
    { wch: 14 }, // Agama
    { wch: 16 }, // Status Pernikahan
    { wch: 18 }, // No HP
    { wch: 24 }, // Email
    { wch: 32 }, // Alamat
    { wch: 26 }, // Status Kepegawaian
    { wch: 24 }, // Pangkat Golongan
    { wch: 20 }, // Pendidikan Terakhir
    { wch: 26 }, // Jurusan
    { wch: 24 }, // PT Asal
    { wch: 20 }, // Kategori Tugas
    { wch: 32 }, // Jabatan
    { wch: 20 }, // Tingkat Kelas
    { wch: 26 }, // Mapel
    { wch: 24 }, // Tugas Tendik
    { wch: 26 }, // Tugas Tambahan
    { wch: 18 }, // Status Keaktifan
    { wch: 20 }, // TMT Masuk
    { wch: 26 }, // Asal Sekolah (Mutasi Masuk)
    { wch: 24 }, // No SK Masuk
    { wch: 18 }, // Tgl SK Masuk
    { wch: 28 }, // Alasan Masuk
    { wch: 32 }, // Keluar Karena Apa
    { wch: 28 }, // Sekolah Tujuan (Mutasi Keluar)
    { wch: 20 }, // Tgl Keluar
    { wch: 24 }, // No SK Keluar
    { wch: 18 }, // Tgl SK Keluar
    { wch: 24 }, // Pejabat Penetap SK Keluar
    { wch: 30 }, // Keterangan Keluar
  ];
  wsData['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, wsData, 'DATA_GURU_DAN_TENDIK');

  // Sheet 2: PETUNJUK_PENGISIAN
  const wsGuide = XLSX.utils.json_to_sheet(TEACHER_TEMPLATE_INSTRUCTIONS);
  wsGuide['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK_PENGISIAN');

  const cleanSchool = schoolName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `TEMPLATE_IMPORT_GURU_DAN_TENDIK_${cleanSchool}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

/**
 * Normalizes input date from Excel (can be serial number, string YYYY-MM-DD, or DD/MM/YYYY)
 */
export const normalizeExcelDate = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel serial number
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Check DD/MM/YYYY or DD-MM-YYYY
  const m = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    const year = m[3];
    return `${year}-${month}-${day}`;
  }
  return str;
};

/**
 * Parses uploaded Excel file (.xlsx / .xls) into list of partial AdminUser
 */
export const parseExcelToTeachers = (
  file: File
): Promise<{
  totalRows: number;
  validRows: number;
  invalidRows: number;
  results: Array<{
    rowNumber: number;
    data: Partial<AdminUser>;
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawRows || rawRows.length < 2) {
          resolve({ totalRows: 0, validRows: 0, invalidRows: 0, results: [] });
          return;
        }

        // Header detection (Row 0 or find row containing 'Nama')
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
          const rowStr = (rawRows[i] || []).join(' ').toLowerCase();
          if (rowStr.includes('nama') || rowStr.includes('nip') || rowStr.includes('jabatan')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = (rawRows[headerRowIndex] || []).map((h: any) => String(h || '').trim());
        const dataRows = rawRows.slice(headerRowIndex + 1);

        const results: Array<{
          rowNumber: number;
          data: Partial<AdminUser>;
          isValid: boolean;
          errors: string[];
          warnings: string[];
        }> = [];

        let validCount = 0;
        let invalidCount = 0;

        dataRows.forEach((row, idx) => {
          if (!row || row.length === 0 || row.every((c: any) => c === undefined || c === null || String(c).trim() === '')) {
            return; // Skip empty row
          }

          const rowNumber = headerRowIndex + 2 + idx;
          const errors: string[] = [];
          const warnings: string[] = [];

          // Build dictionary mapping
          const dict: Record<string, any> = {};
          headers.forEach((h, colIdx) => {
            if (h && row[colIdx] !== undefined) {
              dict[h.toLowerCase()] = row[colIdx];
            }
          });

          // Helper getter
          const getVal = (...keys: string[]): any => {
            for (const k of keys) {
              const lower = k.toLowerCase();
              if (dict[lower] !== undefined && dict[lower] !== null && String(dict[lower]).trim() !== '') {
                return dict[lower];
              }
            }
            return '';
          };

          const rawNama = String(getVal('nama lengkap', 'nama', 'nama guru', 'nama pegawai') || '').trim();
          if (!rawNama) {
            errors.push('Nama Lengkap pegawai wajib diisi');
          }

          const rawJk = String(getVal('jenis kelamin (l/p)', 'jenis kelamin', 'jk') || 'L').toUpperCase().trim();
          const jenisKelamin: 'L' | 'P' = rawJk.startsWith('P') ? 'P' : 'L';

          const rawKat = String(getVal('kategori tugas', 'kategori', 'jenis ptk', 'tipe') || '').toLowerCase().trim();
          let kategoriTugas: TeacherDutyCategory = 'wali_kelas';
          if (rawKat.includes('kepala') || rawKat.includes('kepsek')) {
            kategoriTugas = 'kepala_sekolah';
          } else if (rawKat.includes('tendik') || rawKat.includes('tenaga kependidikan') || rawKat.includes('tata usaha') || rawKat.includes('operator')) {
            kategoriTugas = 'tenaga_kependidikan';
          } else if (rawKat.includes('mapel') || rawKat.includes('mata pelajaran') || rawKat.includes('agama') || rawKat.includes('pjok')) {
            kategoriTugas = 'guru_mapel';
          } else {
            kategoriTugas = 'wali_kelas';
          }

          const rawStatus = String(getVal('status keaktifan', 'status', 'keaktifan') || 'Aktif').trim();
          let status: TeacherActiveStatus = 'Aktif';
          const lowerStatus = rawStatus.toLowerCase();
          if (lowerStatus.includes('masuk')) {
            status = 'Mutasi Masuk';
          } else if (lowerStatus.includes('keluar') || lowerStatus.includes('pindah')) {
            status = 'Mutasi Keluar';
          } else if (lowerStatus.includes('pensiun')) {
            status = 'Pensiun';
          } else if (lowerStatus.includes('cuti')) {
            status = 'Cuti';
          } else if (lowerStatus.includes('undur') || lowerStatus.includes('resign')) {
            status = 'Mengundurkan Diri';
          } else if (lowerStatus.includes('meninggal')) {
            status = 'Meninggal';
          } else if (lowerStatus.includes('nonaktif')) {
            status = 'Nonaktif';
          } else {
            status = 'Aktif';
          }

          // Reason for exit
          const rawAlasanKeluar = String(
            getVal(
              'keluar karena apa (alasan keluar)',
              'keluar karena apa',
              'alasan keluar',
              'alasan mutasi keluar',
              'alasan pindah',
              'alasan'
            ) || ''
          ).trim();

          const alasanKeluar = rawAlasanKeluar || (status === 'Pensiun' ? 'Pensiun Batas Usia Pensiun (BUP)' : status === 'Mutasi Keluar' ? 'Pindah Tugas / Mutasi Dinas ke Sekolah Lain' : '');

          const teacherData: Partial<AdminUser> = {
            id: `usr-imp-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
            nama: rawNama,
            gelarDepan: String(getVal('gelar depan') || '').trim(),
            gelarBelakang: String(getVal('gelar belakang') || '').trim(),
            nip: String(getVal('nip') || '').trim() || '-',
            nuptk: String(getVal('nuptk') || '').trim() || '-',
            nik: String(getVal('nik') || '').trim() || '',
            jenisKelamin,
            tempatLahir: String(getVal('tempat lahir') || 'Sungai Buluh').trim(),
            tanggalLahir: normalizeExcelDate(getVal('tanggal lahir (yyyy-mm-dd)', 'tanggal lahir', 'tgl lahir')) || '1990-01-01',
            namaIbuKandung: String(getVal('nama ibu kandung', 'ibu kandung', 'nama ibu') || '').trim(),
            agama: String(getVal('agama') || 'Islam').trim(),
            statusPernikahan: String(getVal('status pernikahan', 'pernikahan') || 'Menikah').trim(),
            noHp: String(getVal('no hp / whatsapp', 'no hp', 'hp', 'telepon', 'whatsapp') || '').trim(),
            email: String(getVal('email', 'surel') || '').trim(),
            alamat: String(getVal('alamat rumah', 'alamat') || 'Desa Sungai Buluh').trim(),
            statusKepegawaian: String(getVal('status kepegawaian', 'status pegawai') || 'PNS (Pegawai Negeri Sipil)').trim(),
            pangkatGolongan: String(getVal('pangkat golongan', 'golongan', 'pangkat') || 'Penata Muda (III/a)').trim(),
            pendidikanTerakhir: String(getVal('pendidikan terakhir', 'pendidikan') || 'S1 / Sarjana (D-IV)').trim(),
            jurusanPendidikan: String(getVal('jurusan pendidikan', 'jurusan', 'prodi') || 'Pendidikan Guru Sekolah Dasar (PGSD)').trim(),
            ptAsal: String(getVal('perguruan tinggi / asal', 'perguruan tinggi', 'universitas', 'pt asal') || '').trim(),
            kategoriTugas,
            jabatan: String(getVal('jabatan / tugas pokok', 'jabatan', 'tugas pokok') || (kategoriTugas === 'kepala_sekolah' ? 'Kepala Sekolah' : kategoriTugas === 'wali_kelas' ? 'Wali Kelas' : kategoriTugas === 'guru_mapel' ? 'Guru Mapel' : 'Tenaga Kependidikan')).trim(),
            tingkatKelas: String(getVal('tingkat kelas (khusus guru kelas)', 'tingkat kelas', 'kelas') || '').trim(),
            mataPelajaran: String(getVal('mata pelajaran (khusus guru mapel)', 'mata pelajaran', 'mapel') || '').trim(),
            tugasTendik: String(getVal('tugas tendik (khusus tendik)', 'tugas tendik', 'tugas tata usaha') || '').trim(),
            tugasTambahan: String(getVal('tugas tambahan') || '').trim(),
            status,
            tmtTugas: normalizeExcelDate(getVal('tmt masuk / pengangkatan (yyyy-mm-dd)', 'tmt masuk', 'tmt tugas', 'tmt pengangkatan')),
            tmtPengangkatan: normalizeExcelDate(getVal('tmt pengangkatan', 'tmt masuk / pengangkatan (yyyy-mm-dd)')),
            
            // Mutasi Masuk
            isMutasiMasuk: status === 'Mutasi Masuk' || !!getVal('asal sekolah / instansi (mutasi masuk)', 'sekolah asal'),
            sekolahAsalMutasi: String(getVal('asal sekolah / instansi (mutasi masuk)', 'sekolah asal', 'asal sekolah') || '').trim(),
            noSkMasuk: String(getVal('no sk masuk', 'sk masuk') || '').trim(),
            tglSkMasuk: normalizeExcelDate(getVal('tanggal sk masuk', 'tgl sk masuk')),
            alasanMutasiMasuk: String(getVal('alasan masuk', 'alasan mutasi masuk') || '').trim(),

            // Mutasi Keluar & Keluar Karena Apa
            alasanKeluar,
            sekolahTujuanMutasi: String(getVal('sekolah / instansi tujuan (mutasi keluar)', 'sekolah tujuan', 'tujuan mutasi') || '').trim(),
            tglKeluar: normalizeExcelDate(getVal('tanggal keluar / tmt keluar', 'tgl keluar', 'tanggal keluar')),
            noSkMutasi: String(getVal('no sk mutasi / keluar', 'no sk mutasi', 'no sk keluar') || '').trim(),
            tglSkMutasi: normalizeExcelDate(getVal('tanggal sk mutasi / keluar', 'tgl sk mutasi', 'tgl sk keluar')),
            pejabatSkMutasi: String(getVal('pejabat penetap sk keluar', 'pejabat penetap', 'pejabat sk') || '').trim(),
            keteranganKeluar: String(getVal('keterangan / catatan keluar', 'keterangan keluar', 'keterangan') || '').trim(),

            role: (kategoriTugas === 'kepala_sekolah' || kategoriTugas === 'tenaga_kependidikan') ? 'admin' : 'user',
            avatarColor: 'bg-blue-600',
          };

          const isValid = errors.length === 0;
          if (isValid) {
            validCount++;
          } else {
            invalidCount++;
          }

          results.push({
            rowNumber,
            data: teacherData,
            isValid,
            errors,
            warnings,
          });
        });

        resolve({
          totalRows: results.length,
          validRows: validCount,
          invalidRows: invalidCount,
          results,
        });
      } catch (err: any) {
        reject(new Error(`Gagal membaca berkas Excel: ${err?.message || 'Format berkas tidak valid'}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas. Pastikan file tidak rusak.'));
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Exports current teacher list to a styled Excel (.xlsx) file
 */
export const exportTeachersToExcel = (
  teachers: AdminUser[],
  schoolProfile: SchoolProfile
) => {
  const wb = XLSX.utils.book_new();

  const exportRows = teachers.map((t, idx) => [
    idx + 1,
    t.nama,
    t.gelarDepan || '',
    t.gelarBelakang || '',
    t.nip || '-',
    t.nuptk || '-',
    t.nik || '-',
    t.jenisKelamin || 'L',
    t.tempatLahir || '-',
    t.tanggalLahir || '-',
    t.namaIbuKandung || '-',
    t.agama || '-',
    t.statusPernikahan || '-',
    t.noHp || '-',
    t.email || '-',
    t.alamat || '-',
    t.statusKepegawaian || '-',
    t.pangkatGolongan || '-',
    t.pendidikanTerakhir || '-',
    t.jurusanPendidikan || '-',
    t.ptAsal || '-',
    t.kategoriTugas === 'kepala_sekolah' ? 'Kepala Sekolah' : t.kategoriTugas === 'wali_kelas' ? 'Wali Kelas' : t.kategoriTugas === 'guru_mapel' ? 'Guru Mapel' : 'Tenaga Kependidikan',
    t.jabatan,
    t.tingkatKelas || '-',
    t.mataPelajaran || '-',
    t.tugasTendik || '-',
    t.tugasTambahan || '-',
    t.status,
    t.tmtTugas || t.tmtPengangkatan || '-',
    t.sekolahAsalMutasi || '-',
    t.noSkMasuk || '-',
    t.tglSkMasuk || '-',
    t.alasanMutasiMasuk || '-',
    t.alasanKeluar || '-',
    t.sekolahTujuanMutasi || '-',
    t.tglKeluar || t.tanggalPensiun || '-',
    t.noSkMutasi || t.noSkPensiun || '-',
    t.tglSkMutasi || '-',
    t.pejabatSkMutasi || t.pejabatSkPensiun || '-',
    t.keteranganKeluar || t.keteranganKeaktifan || '-',
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    TEACHER_EXCEL_HEADERS,
    ...exportRows,
  ]);

  const colWidths = [
    { wch: 5 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 22 },
    { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 22 },
    { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 24 },
    { wch: 32 }, { wch: 26 }, { wch: 24 }, { wch: 20 }, { wch: 26 },
    { wch: 24 }, { wch: 20 }, { wch: 32 }, { wch: 20 }, { wch: 26 },
    { wch: 24 }, { wch: 26 }, { wch: 18 }, { wch: 20 }, { wch: 26 },
    { wch: 24 }, { wch: 18 }, { wch: 28 }, { wch: 32 }, { wch: 28 },
    { wch: 20 }, { wch: 24 }, { wch: 18 }, { wch: 24 }, { wch: 30 },
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'DATA_GURU_DAN_TENDIK');

  const cleanSchool = (schoolProfile.namaSekolah || 'SEKOLAH').replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `DATA_GURU_DAN_TENDIK_${cleanSchool}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, fileName);
};
