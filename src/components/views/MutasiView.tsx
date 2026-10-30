import React, { useState, useMemo } from 'react';
import { 
  UserMinus, 
  UserPlus, 
  Plus, 
  Printer, 
  Search, 
  FileText, 
  ArrowLeft, 
  Building, 
  AlertCircle, 
  RotateCcw, 
  CheckCircle, 
  Eye, 
  AlertTriangle, 
  X, 
  ShieldAlert, 
  Edit3, 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Filter, 
  School, 
  Layers, 
  Calendar, 
  MapPin, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Student, Gender } from '../../types';
import { formatIndonesianDate, cn, isInAcademicYear, getAcademicYearFromDate } from '../../lib/utils';
import { KopSuratHeader } from '../layout/KopSuratHeader';
import { SuratPindahDocument } from '../common/SuratPindahDocument';
import { downloadMutasiExcelTemplate, exportMutasiToExcel, exportMutasiMasukToExcel } from '../../utils/excelHelper';
import { ImportMutasiModal } from '../modals/ImportMutasiModal';
import { isKelas1Sampai6, isStudentMutasiMasuk, getTingkatKelasNumber } from '../../utils/academicYearHelper';

interface MutasiViewProps {
  onOpenMutationModal: (student: Student) => void;
  onSelectStudentDetail: (studentId: string) => void;
  onEditStudent?: (student: Student, initialTab?: 'pribadi' | 'alamat' | 'ortu' | 'kesehatan' | 'masuk' | 'bantuan') => void;
  onOpenAddModal?: () => void;
  onBack?: () => void;
  setActiveTab?: (tab: any) => void;
}

export const MutasiView: React.FC<MutasiViewProps> = ({
  onOpenMutationModal,
  onSelectStudentDetail,
  onEditStudent,
  onOpenAddModal,
  onBack,
  setActiveTab,
}) => {
  const { students, schoolProfile, currentRole, cancelMutation, rolePermissions, addStudent } = useSchool();
  
  // Tab Mutasi: 'masuk' (Mutasi Siswa Masuk) vs 'keluar' (Sheet TINGGALKAN)
  const [mutasiTab, setMutasiTab] = useState<'masuk' | 'keluar'>('masuk');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudentForLetter, setSelectedStudentForLetter] = useState<Student | null>(null);
  const [previewModalStudent, setPreviewModalStudent] = useState<Student | null>(null);
  const [isPrintingRekap, setIsPrintingRekap] = useState(false);
  const [isPrintingRekapMasuk, setIsPrintingRekapMasuk] = useState(false);
  const [studentToCancelMutation, setStudentToCancelMutation] = useState<Student | null>(null);
  const [restoreClass, setRestoreClass] = useState<string>('Kelas 1');
  const [feedbackToast, setFeedbackToast] = useState<{ 
    message: string; 
    type: 'success' | 'info';
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter Tahun Pelajaran Aktif (default to activeTP, or 'ALL')
  const activeTP = schoolProfile.tahunPelajaranAktif || '2026/2027';
  const [selectedTahunPelajaran, setSelectedTahunPelajaran] = useState<string>(activeTP);
  const [selectedTingkatMasuk, setSelectedTingkatMasuk] = useState<string>('ALL');

  // ==========================================
  // DATA MUTASI KELUAR (Sheet TINGGALKAN)
  // ==========================================
  const allMutatedStudents = useMemo(() => {
    return students.filter(s => s.mutasi || s.status === 'Mutasi Keluar');
  }, [students]);

  const activeStudents = useMemo(() => {
    return students.filter(s => s.status === 'Aktif');
  }, [students]);

  const mutatedStudents = useMemo(() => {
    return allMutatedStudents.filter(s => {
      if (selectedTahunPelajaran === 'ALL') return true;
      return (
        isInAcademicYear(s.mutasi?.tglMeninggalkan, selectedTahunPelajaran) ||
        isInAcademicYear(s.mutasi?.dikeluarkanTanggal, selectedTahunPelajaran) ||
        isInAcademicYear(s.mutasi?.tahunAjaran, selectedTahunPelajaran) ||
        (s.status === 'Mutasi Keluar' && !s.mutasi?.tglMeninggalkan && isInAcademicYear(s.updatedAt, selectedTahunPelajaran))
      );
    });
  }, [allMutatedStudents, selectedTahunPelajaran]);

  const hiddenCountInOtherYears = allMutatedStudents.length - mutatedStudents.length;

  const filteredMutated = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return mutatedStudents.filter(s => {
      if (!term) return true;
      const nameMatch = (s.namaLengkap || '').toLowerCase().includes(term);
      const noIndukMatch = (s.noInduk || '').toLowerCase().includes(term);
      const nisnMatch = (s.nisn || '').toLowerCase().includes(term);
      const targetMatch = (s.mutasi?.sekolahTujuan || '').toLowerCase().includes(term);
      const reasonMatch = (s.mutasi?.alasan || '').toLowerCase().includes(term);
      return nameMatch || noIndukMatch || nisnMatch || targetMatch || reasonMatch;
    });
  }, [mutatedStudents, searchTerm]);

  // ==========================================
  // DATA MUTASI SISWA MASUK (Siswa Pindahan)
  // Terdeteksi dari profil siswa: diterima di tingkat kelas 2 s/d 6 atau asal SD/MI
  // ==========================================
  const allMutasiMasukStudents = useMemo(() => {
    return students.filter(isStudentMutasiMasuk);
  }, [students]);

  const mutasiMasukByTP = useMemo(() => {
    return allMutasiMasukStudents.filter(s => {
      if (selectedTahunPelajaran === 'ALL') return true;
      const studentTP = getAcademicYearFromDate(s.tanggalDiterima) || 
        (s.tahunMasuk && /^\d{4}$/.test(s.tahunMasuk.trim()) ? `${s.tahunMasuk}/${parseInt(s.tahunMasuk) + 1}` : s.tahunMasuk);
      return studentTP === selectedTahunPelajaran || isInAcademicYear(s.tanggalDiterima, selectedTahunPelajaran);
    });
  }, [allMutasiMasukStudents, selectedTahunPelajaran]);

  const hiddenMutasiMasukCount = allMutasiMasukStudents.length - mutasiMasukByTP.length;

  const filteredMutasiMasuk = useMemo(() => {
    const term = (searchTerm || '').toLowerCase().trim();
    return mutasiMasukByTP.filter(s => {
      // Filter tingkat kelas diterima
      if (selectedTingkatMasuk !== 'ALL') {
        const rawClass = (s.diterimaDiKelas || '').toLowerCase();
        if (!rawClass.includes(selectedTingkatMasuk.toLowerCase())) {
          return false;
        }
      }

      if (!term) return true;
      const nameMatch = (s.namaLengkap || '').toLowerCase().includes(term);
      const noIndukMatch = (s.noInduk || '').toLowerCase().includes(term);
      const nisnMatch = (s.nisn || '').toLowerCase().includes(term);
      const sekolahAsalMatch = (s.sekolahAsalTK || '').toLowerCase().includes(term);
      const kelasDiterimaMatch = (s.diterimaDiKelas || '').toLowerCase().includes(term);
      const kelasSekarangMatch = (s.kelasSekarang || '').toLowerCase().includes(term);
      const skpMatch = (s.noIjazahTK || '').toLowerCase().includes(term);
      return nameMatch || noIndukMatch || nisnMatch || sekolahAsalMatch || kelasDiterimaMatch || kelasSekarangMatch || skpMatch;
    });
  }, [mutasiMasukByTP, searchTerm, selectedTingkatMasuk]);

  // Statistik Mutasi Masuk
  const totalLakiMasuk = filteredMutasiMasuk.filter(s => s.jenisKelamin === 'L').length;
  const totalPerempuanMasuk = filteredMutasiMasuk.filter(s => s.jenisKelamin === 'P').length;

  // Modal Pendaftaran Siswa Mutasi Masuk Cepat
  const [isAddMutasiMasukOpen, setIsAddMutasiMasukOpen] = useState(false);
  const [mutasiMasukForm, setMutasiMasukForm] = useState({
    namaLengkap: '',
    jenisKelamin: 'L' as Gender,
    nisn: '',
    noInduk: '',
    nik: '',
    tempatLahir: schoolProfile.desaKelurahan || 'Sungai Buluh',
    tanggalLahir: '2016-01-01',
    sekolahAsal: '',
    noSuratPindah: '',
    diterimaDiKelas: 'Kelas 3',
    kelasSekarang: 'Kelas 3',
    tanggalDiterima: new Date().toISOString().split('T')[0],
    namaAyah: '',
    noHpOrtu: '',
    alamat: `Dusun Suka Maju, Desa ${schoolProfile.desaKelurahan || 'Sungai Buluh'}`,
  });

  const canManageMutation = currentRole !== 'umum' && (rolePermissions?.inputMutasi !== false);

  // Print Handlers
  const handlePrintLetter = (student: Student) => {
    setIsPrintingRekap(false);
    setIsPrintingRekapMasuk(false);
    setSelectedStudentForLetter(student);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintRekapMutasiKeluar = () => {
    setSelectedStudentForLetter(null);
    setIsPrintingRekapMasuk(false);
    setIsPrintingRekap(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handlePrintRekapMutasiMasuk = () => {
    setSelectedStudentForLetter(null);
    setIsPrintingRekap(false);
    setIsPrintingRekapMasuk(true);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleOpenCancelDialog = (student: Student) => {
    setStudentToCancelMutation(student);
    setRestoreClass(student.mutasi?.dariKelas || student.kelasSekarang || 'Kelas 1');
  };

  const handleConfirmCancelMutation = () => {
    if (!studentToCancelMutation) return;

    const studentName = studentToCancelMutation.namaLengkap;
    const targetClass = restoreClass || studentToCancelMutation.mutasi?.dariKelas || studentToCancelMutation.kelasSekarang || 'Kelas 1';
    
    cancelMutation(studentToCancelMutation.id, targetClass);
    setStudentToCancelMutation(null);

    setFeedbackToast({
      message: `Mutasi siswa ${studentName} berhasil dibatalkan. Status siswa kini AKTIF kembali di ${targetClass}.`,
      type: 'success',
      actionLabel: 'Buka Data Siswa Aktif →',
      onAction: () => setActiveTab && setActiveTab('active-students'),
    });

    setTimeout(() => {
      setFeedbackToast(null);
    }, 6500);
  };

  const handleGoBack = () => {
    if (onBack) {
      onBack();
    } else if (setActiveTab) {
      setActiveTab('dashboard');
    }
  };

  // Submit Pendaftaran Siswa Mutasi Masuk
  const handleSubmitNewMutasiMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mutasiMasukForm.namaLengkap.trim()) {
      alert('Nama lengkap siswa mutasi masuk wajib diisi.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const newStudentData: Partial<Student> = {
      namaLengkap: mutasiMasukForm.namaLengkap.trim().toUpperCase(),
      namaPanggilan: mutasiMasukForm.namaLengkap.trim().split(' ')[0],
      jenisKelamin: mutasiMasukForm.jenisKelamin,
      noInduk: mutasiMasukForm.noInduk.trim() || `${currentYear}${String(students.length + 1).padStart(3, '0')}`,
      nisn: mutasiMasukForm.nisn.trim() || `00${Math.floor(10000000 + Math.random() * 90000000)}`,
      nik: mutasiMasukForm.nik.trim() || '1409000000000000',
      tempatLahir: mutasiMasukForm.tempatLahir,
      tanggalLahir: mutasiMasukForm.tanggalLahir,
      agama: 'Islam',
      kewarganegaraan: 'Indonesia (WNI)',
      anakKe: 1,
      jumlahSaudaraKandung: 0,
      jumlahSaudaraTiri: 0,
      jumlahSaudaraAngkat: 0,
      statusKeluarga: 'Anak Kandung',
      bahasaIbu: 'Bahasa Indonesia',
      alamat: mutasiMasukForm.alamat,
      rt: '001',
      rw: '001',
      kelurahanDesa: schoolProfile.desaKelurahan || 'Sungai Buluh',
      kecamatan: schoolProfile.kecamatan || 'Singingi Hilir',
      kabupatenKota: schoolProfile.kabupatenKota || 'Kabupaten Kuantan Singingi',
      provinsi: schoolProfile.provinsi || 'Riau',
      kodePos: schoolProfile.kodePos || '29563',
      tinggalDengan: 'Orang Tua',
      jarakKeSekolahKm: 1.0,
      transportasi: 'Sepeda Motor',
      kesehatan: {
        golonganDarah: 'O',
        tinggiBadanCm: 125,
        beratBadanKg: 25,
      },
      ayah: {
        nama: mutasiMasukForm.namaAyah || 'Orang Tua Siswa',
        nik: '1409000000000001',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        pendidikan: 'SMA / Sederajat',
        pekerjaan: 'Wiraswasta',
        penghasilanBulanan: 'Rp 2.000.000 - Rp 4.000.000',
        noHp: mutasiMasukForm.noHpOrtu || '081200000000',
        statusHidup: 'Masih Hidup',
      },
      ibu: {
        nama: 'Ibu Siswa',
        nik: '1409000000000002',
        agama: 'Islam',
        kewarganegaraan: 'WNI',
        pendidikan: 'SMA / Sederajat',
        pekerjaan: 'Mengurus Rumah Tangga',
        penghasilanBulanan: 'Tidak Berpenghasilan',
        noHp: mutasiMasukForm.noHpOrtu || '081200000000',
        statusHidup: 'Masih Hidup',
      },
      // Kunci data Mutasi Masuk (Siswa Pindahan)
      sekolahAsalTK: mutasiMasukForm.sekolahAsal ? `${mutasiMasukForm.sekolahAsal} (Pindahan)` : 'Sekolah Dasar Asal (Pindahan)',
      noIjazahTK: mutasiMasukForm.noSuratPindah || `421.2/SKP/${currentYear}/${Math.floor(100 + Math.random() * 899)}`,
      tanggalDiterima: mutasiMasukForm.tanggalDiterima,
      diterimaDiKelas: mutasiMasukForm.diterimaDiKelas,
      kelasSekarang: mutasiMasukForm.kelasSekarang || mutasiMasukForm.diterimaDiKelas,
      tahunPelajaranKelasSekarang: activeTP,
      tahunMasuk: String(currentYear),
      status: 'Aktif',
      raport: [],
    };

    addStudent(newStudentData);
    setIsAddMutasiMasukOpen(false);

    setFeedbackToast({
      message: `Siswa mutasi masuk ${newStudentData.namaLengkap} berhasil didaftarkan ke ${newStudentData.diterimaDiKelas}! Data terhubung otomatis ke Data Siswa Aktif dan Buku Induk.`,
      type: 'success',
      actionLabel: 'Buka Data Siswa Aktif →',
      onAction: () => setActiveTab && setActiveTab('active-students'),
    });

    setTimeout(() => {
      setFeedbackToast(null);
    }, 6500);

    // Reset Form
    setMutasiMasukForm({
      namaLengkap: '',
      jenisKelamin: 'L',
      nisn: '',
      noInduk: '',
      nik: '',
      tempatLahir: schoolProfile.desaKelurahan || 'Sungai Buluh',
      tanggalLahir: '2016-01-01',
      sekolahAsal: '',
      noSuratPindah: '',
      diterimaDiKelas: 'Kelas 3',
      kelasSekarang: 'Kelas 3',
      tanggalDiterima: new Date().toISOString().split('T')[0],
      namaAyah: '',
      noHpOrtu: '',
      alamat: `Dusun Suka Maju, Desa ${schoolProfile.desaKelurahan || 'Sungai Buluh'}`,
    });
  };

  const classOptions = (schoolProfile?.daftarKelas || []).filter(isKelas1Sampai6).length > 0
    ? (schoolProfile?.daftarKelas || []).filter(isKelas1Sampai6)
    : ['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  const transferClassOptions = ['Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className="no-print fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-700 text-white rounded-xl shadow-xl border border-emerald-600 text-xs font-semibold max-w-md">
            <CheckCircle className="w-5 h-5 text-emerald-200 shrink-0" />
            <div className="flex-1">
              <div>{feedbackToast.message}</div>
              {feedbackToast.actionLabel && feedbackToast.onAction && (
                <button
                  type="button"
                  onClick={feedbackToast.onAction}
                  className="mt-1 text-emerald-200 hover:text-white font-extrabold underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{feedbackToast.actionLabel}</span>
                </button>
              )}
            </div>
            <button
              onClick={() => setFeedbackToast(null)}
              className="p-1 hover:bg-emerald-800 rounded-md text-emerald-200 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Utama & Tombol Kembali */}
      <div className="no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4 text-[#003399] dark:text-blue-400" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Buku Mutasi Siswa (Masuk & Keluar)
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register resmi pencatatan mutasi peserta didik masuk (siswa pindahan) dan mutasi keluar (siswa meninggalkan sekolah)
            </p>
          </div>
        </div>

        {/* Tab Switcher Utama: Mutasi Masuk vs Mutasi Keluar */}
        <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300 dark:border-slate-700 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setMutasiTab('masuk')}
            className={cn(
              "flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer",
              mutasiTab === 'masuk'
                ? "bg-[#003399] text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
            )}
          >
            <UserPlus className="w-4 h-4" />
            <span>Mutasi Siswa Masuk</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
              mutasiTab === 'masuk' ? "bg-white/25 text-white" : "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
            )}>
              {filteredMutasiMasuk.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMutasiTab('keluar')}
            className={cn(
              "flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer",
              mutasiTab === 'keluar'
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700"
            )}
          >
            <UserMinus className="w-4 h-4" />
            <span>Mutasi Keluar (Sheet TINGGALKAN)</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-extrabold",
              mutasiTab === 'keluar' ? "bg-white/25 text-white" : "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300"
            )}>
              {filteredMutated.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* KONTEN TAB 1: MUTASI SISWA MASUK (SISWA PINDAHAN DITERIMA DI TINGKAT KELAS) */}
      {/* ========================================================================= */}
      {mutasiTab === 'masuk' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Action Toolbar & Info Header */}
          <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#003399] dark:text-blue-400 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Buku Register Mutasi Siswa Masuk
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#003399] dark:text-blue-300 text-[10px] font-extrabold">
                    Terdeteksi dari Profil Siswa
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Daftar peserta didik yang masuk melalui jalur mutasi/pindahan (diterima di tingkat kelas 2, 3, 4, 5, atau 6)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Daftarkan Siswa Mutasi Masuk */}
              {canManageMutation && (
                <button
                  type="button"
                  onClick={() => setIsAddMutasiMasukOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title="Daftarkan Peserta Didik Baru Jalur Mutasi Masuk"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Daftarkan Mutasi Masuk</span>
                </button>
              )}

              {/* Ekspor Excel Mutasi Masuk */}
              <button
                type="button"
                onClick={() => exportMutasiMasukToExcel(filteredMutasiMasuk, schoolProfile)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Ekspor Seluruh Data Siswa Mutasi Masuk ke Format Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Ekspor Excel</span>
              </button>

              {/* Cetak Laporan Register Mutasi Masuk */}
              <button
                type="button"
                onClick={handlePrintRekapMutasiMasuk}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Cetak Laporan Resmi Buku Register Mutasi Masuk (Kop Surat Dinas)"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Register Masuk</span>
              </button>
            </div>
          </div>

          {/* Search, Filter Tahun Pelajaran, & Filter Tingkat Kelas Diterima */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="sm:col-span-5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa pindahan, NIS, NISN, sekolah asal, no SKP..."
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Tahun Pelajaran Masuk */}
            <div className="sm:col-span-4 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tahun Pelajaran Masuk:</span>
                {selectedTahunPelajaran === activeTP && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                    AKTIF
                  </span>
                )}
              </label>
              <select
                value={selectedTahunPelajaran}
                onChange={(e) => setSelectedTahunPelajaran(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value={activeTP}>Tahun Pelajaran Aktif ({activeTP})</option>
                {(schoolProfile.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'])
                  .filter(tp => tp !== activeTP)
                  .map(tp => (
                    <option key={tp} value={tp}>Tahun Pelajaran {tp}</option>
                  ))
                }
                <option value="ALL">Semua Tahun Pelajaran (Arsip Lengkap)</option>
              </select>
            </div>

            {/* Filter Tingkat Kelas Diterima */}
            <div className="sm:col-span-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Tingkat Kelas Diterima:
              </label>
              <select
                value={selectedTingkatMasuk}
                onChange={(e) => setSelectedTingkatMasuk(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Tingkat Masuk</option>
                {transferClassOptions.map(cls => (
                  <option key={cls} value={cls}>Diterima di {cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stat Cards Ringkasan */}
          <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Siswa Pindahan</span>
              <div className="text-xl font-extrabold text-[#003399] dark:text-blue-400 mt-0.5">
                {filteredMutasiMasuk.length} Siswa
              </div>
              <span className="text-[10px] text-slate-500">
                {selectedTahunPelajaran === 'ALL' ? 'Seluruh Tahun' : `TP ${selectedTahunPelajaran}`}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Laki-laki (L)</span>
              <div className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-0.5">
                {totalLakiMasuk} Siswa
              </div>
              <span className="text-[10px] text-slate-500">
                {filteredMutasiMasuk.length > 0 ? `${Math.round((totalLakiMasuk / filteredMutasiMasuk.length) * 100)}% dari total` : '-'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Perempuan (P)</span>
              <div className="text-xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                {totalPerempuanMasuk} Siswa
              </div>
              <span className="text-[10px] text-slate-500">
                {filteredMutasiMasuk.length > 0 ? `${Math.round((totalPerempuanMasuk / filteredMutasiMasuk.length) * 100)}% dari total` : '-'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">Status Belajar</span>
              <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                {filteredMutasiMasuk.filter(s => s.status === 'Aktif').length} Aktif
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                Terdaftar di Rombel Aktif
              </span>
            </div>
          </div>

          {/* Info Banner when other years are hidden */}
          {selectedTahunPelajaran !== 'ALL' && hiddenMutasiMasukCount > 0 && (
            <div className="no-print p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Menampilkan mutasi masuk pada <strong>Tahun Pelajaran {selectedTahunPelajaran}</strong>. {hiddenMutasiMasukCount} data mutasi tahun selain itu disembunyikan.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTahunPelajaran('ALL')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Tampilkan Semua ({allMutasiMasukStudents.length})
              </button>
            </div>
          )}

          {/* Tabel Register Mutasi Masuk */}
          <div className="no-print rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#002266] text-white uppercase text-[11px] font-bold">
                  <tr>
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 w-32">NIS / NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3 text-center w-12">L/P</th>
                    <th className="p-3">Diterima di Tingkat</th>
                    <th className="p-3">Kelas Sekarang</th>
                    <th className="p-3">Sekolah Asal Pindahan</th>
                    <th className="p-3">No. Surat Pindah / SKP</th>
                    <th className="p-3">Tgl Diterima</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMutasiMasuk.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-[#003399] dark:text-blue-400 flex items-center justify-center">
                            <UserPlus className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">
                              Tidak ada siswa mutasi masuk yang sesuai kriteria pencarian/filter.
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Siswa akan otomatis muncul di sini bila pada profilnya terisi "Diterima di Tingkat Kelas" (Kelas 2 s/d 6) atau berasal dari sekolah dasar/madrasah lain.
                            </p>
                          </div>
                          {canManageMutation && (
                            <button
                              type="button"
                              onClick={() => setIsAddMutasiMasukOpen(true)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>+ Daftarkan Siswa Mutasi Masuk Sekarang</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMutasiMasuk.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-center text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-300">
                          {student.noInduk}
                          <div className="text-[10px] text-slate-400">{student.nisn}</div>
                        </td>
                        <td className="p-3">
                          <div 
                            onClick={() => onSelectStudentDetail(student.id)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer"
                          >
                            {student.namaLengkap}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[10px]",
                            student.jenisKelamin === 'L' ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                          )}>
                            {student.jenisKelamin}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-emerald-700 dark:text-emerald-400">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
                            <ArrowRight className="w-3 h-3" />
                            <span>{student.diterimaDiKelas || 'Kelas Pindahan'}</span>
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800 dark:text-slate-200">
                          {student.kelasSekarang}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {student.sekolahAsalTK || '-'}
                          </div>
                          {student.alamat && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {student.alamat}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {student.noIjazahTK || '-'}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">
                          {student.tanggalDiterima ? formatIndonesianDate(student.tanggalDiterima) : (student.tahunMasuk || '-')}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Detail Siswa */}
                            <button
                              type="button"
                              onClick={() => onSelectStudentDetail(student.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              title="Lihat profil detail lengkap siswa"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>

                            {/* Tombol Edit Profil Siswa */}
                            {canManageMutation && onEditStudent && (
                              <button
                                type="button"
                                onClick={() => onEditStudent(student, 'masuk')}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                title="Edit profil dan data mutasi masuk siswa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* KONTEN TAB 2: MUTASI SISWA KELUAR (Sheet TINGGALKAN)                       */}
      {/* ========================================================================= */}
      {mutasiTab === 'keluar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Action Toolbar Mutasi Keluar */}
          <div className="no-print flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Buku Mutasi Siswa Keluar
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 font-extrabold text-[10px]">
                    Sheet TINGGALKAN ({mutatedStudents.length})
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Register resmi pencatatan peserta didik yang pindah atau meninggalkan sekolah
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Unduh Template Excel */}
              <button
                type="button"
                onClick={() => downloadMutasiExcelTemplate(schoolProfile)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Unduh Template Format Excel Mutasi Sesuai Kolom Surat Keterangan Pindah Sekolah"
              >
                <Download className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span className="hidden sm:inline">Template Excel Mutasi</span>
                <span className="sm:hidden">Template</span>
              </button>

              {/* Impor Excel Data Mutasi */}
              {canManageMutation && (
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold shadow-sm hover:shadow-md transition-all cursor-pointer"
                  title="Impor Data Mutasi & Surat Pindah dari Berkas Excel"
                >
                  <Upload className="w-4 h-4" />
                  <span>Impor Data Mutasi</span>
                </button>
              )}

              {/* Ekspor Excel */}
              <button
                type="button"
                onClick={() => exportMutasiToExcel(mutatedStudents, schoolProfile)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Ekspor Seluruh Data Siswa Mutasi ke Format Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden md:inline">Ekspor Excel</span>
              </button>

              {/* Cetak Laporan Mutasi Keluar */}
              <button
                onClick={handlePrintRekapMutasiKeluar}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Cetak Laporan Rekapitulasi Mutasi & Siswa Pindah (Sheet TINGGALKAN)"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Cetak Laporan Mutasi</span>
                <span className="sm:hidden">Cetak</span>
              </button>

              {currentRole !== 'umum' && (
                <select
                  onChange={(e) => {
                    const s = students.find(item => item.id === e.target.value);
                    if (s) onOpenMutationModal(s);
                  }}
                  defaultValue=""
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <option value="" disabled>+ Pilih Siswa untuk Dipindahkan...</option>
                  {activeStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.noInduk} - {s.namaLengkap} ({s.kelasSekarang})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Search & Statistics Mutasi Keluar */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama siswa mutasi keluar atau sekolah tujuan..."
                className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden"
              />
            </div>

            {/* Filter Tahun Pelajaran */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Tahun Pelajaran:</span>
                {selectedTahunPelajaran === activeTP && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded">
                    AKTIF
                  </span>
                )}
              </label>
              <select
                value={selectedTahunPelajaran}
                onChange={(e) => setSelectedTahunPelajaran(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value={activeTP}>Tahun Aktif: {activeTP}</option>
                {(schoolProfile.daftarTahunPelajaran || ['2023/2024', '2024/2025', '2025/2026', '2026/2027', '2027/2028'])
                  .filter(tp => tp !== activeTP)
                  .map(tp => (
                    <option key={tp} value={tp}>Tahun Pelajaran {tp}</option>
                  ))
                }
                <option value="ALL">Semua Tahun Pelajaran (Arsip)</option>
              </select>
            </div>

            <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900 shadow-xs flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase text-orange-800 dark:text-orange-300">
                  {selectedTahunPelajaran === 'ALL' ? 'Total Seluruh Tahun' : `Mutasi TP ${selectedTahunPelajaran}`}
                </div>
                <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-400">{mutatedStudents.length} Siswa</div>
              </div>
              <UserMinus className="w-8 h-8 text-orange-400 opacity-60" />
            </div>
          </div>

          {/* Info Banner when other years are hidden */}
          {selectedTahunPelajaran !== 'ALL' && hiddenCountInOtherYears > 0 && (
            <div className="no-print p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Menampilkan data mutasi keluar pada <strong>Tahun Pelajaran {selectedTahunPelajaran}</strong>. {hiddenCountInOtherYears} data mutasi tahun selain itu disembunyikan.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTahunPelajaran('ALL')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Tampilkan Semua ({allMutatedStudents.length})
              </button>
            </div>
          )}

          {/* Tabel Mutasi Keluar */}
          <div className="no-print rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#002266] text-white uppercase text-[11px] font-bold">
                  <tr>
                    <th className="p-3">No</th>
                    <th className="p-3">NIS / NISN</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Tgl Meninggalkan</th>
                    <th className="p-3">Dari Kelas</th>
                    <th className="p-3">Sekolah Tujuan</th>
                    <th className="p-3">Alasan Pindah</th>
                    <th className="p-3 text-right">Aksi & Surat Mutasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMutated.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                            <UserMinus className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">Belum ada siswa dalam register mutasi keluar.</p>
                            <p className="text-xs text-slate-400 mt-0.5">Anda dapat memindahkan siswa aktif atau mengimpor data mutasi lampau secara massal dengan berkas Excel.</p>
                          </div>
                          {canManageMutation && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Impor Data Mutasi Excel</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadMutasiExcelTemplate(schoolProfile)}
                                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Unduh Template Mutasi</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredMutated.map((student, idx) => (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-mono font-bold text-blue-700 dark:text-blue-300">
                          {student.noInduk}
                          <div className="text-[10px] text-slate-400">{student.nisn}</div>
                        </td>
                        <td className="p-3">
                          <div 
                            onClick={() => onSelectStudentDetail(student.id)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 cursor-pointer"
                          >
                            {student.namaLengkap}
                          </div>
                          <div className="text-[10px] text-slate-400">{student.tempatLahir}, {formatIndonesianDate(student.tanggalLahir)}</div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                          {student.mutasi ? formatIndonesianDate(student.mutasi.tglMeninggalkan) : '-'}
                        </td>
                        <td className="p-3 font-bold text-slate-700 dark:text-slate-300">
                          {student.mutasi?.dariKelas || student.kelasSekarang}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-blue-900 dark:text-blue-300">
                            {student.mutasi?.sekolahTujuan || '-'}
                          </div>
                          {(student.mutasi?.kabupatenKotaTujuan || student.mutasi?.provinsiTujuan) && (
                            <div className="text-[10px] text-slate-500 font-medium">
                              {[student.mutasi.kecamatanTujuan, student.mutasi.kabupatenKotaTujuan, student.mutasi.provinsiTujuan].filter(Boolean).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {student.mutasi?.alasanPindah || '-'}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Tombol Pratinjau Surat */}
                            <button
                              onClick={() => setPreviewModalStudent(student)}
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              title="Lihat Pratinjau Surat Keterangan Pindah Sekolah"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Pratinjau</span>
                            </button>

                            {/* Tombol Edit Mutasi */}
                            {canManageMutation && (
                              <button
                                onClick={() => onOpenMutationModal(student)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                title="Edit data dan catatan mutasi siswa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* Tombol Batalkan Mutasi (Kembalikan ke Siswa Aktif) */}
                            {canManageMutation && (
                              <button
                                onClick={() => handleOpenCancelDialog(student)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                                title="Batalkan mutasi dan kembalikan data siswa ke Data Siswa Aktif"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                                <span>Batalkan Mutasi</span>
                              </button>
                            )}

                            {/* Tombol Cetak Surat Pindah */}
                            <button
                              onClick={() => handlePrintLetter(student)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                              title="Cetak Surat Keterangan Pindah Sekolah"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Cetak Surat</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PENDAFTARAN CEPAT SISWA MUTASI MASUK                                */}
      {/* ========================================================================= */}
      {isAddMutasiMasukOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-linear-to-r from-[#003399] to-blue-700 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wide">
                    Daftarkan Siswa Mutasi Masuk (Pindahan)
                  </h3>
                  <p className="text-[11px] text-blue-100">
                    Pencatatan langsung ke Buku Induk & Data Rombel Aktif TP {activeTP}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMutasiMasukOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitNewMutasiMasuk} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Siswa pindahan akan otomatis terdeteksi dalam <strong>Buku Mutasi Siswa Masuk</strong> dan langsung ditempatkan pada <strong>Data Siswa Aktif</strong> sesuai tingkat kelas yang dipilih.
                  </p>
                </div>
              </div>

              {/* Data Pribadi Pokok */}
              <div className="space-y-3">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  1. Identitas Pokok Siswa Pindahan
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Lengkap Peserta Didik <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={mutasiMasukForm.namaLengkap}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, namaLengkap: e.target.value })}
                      placeholder="Contoh: MUHAMMAD RIZKI PRATAMA"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold uppercase"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jenis Kelamin <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mutasiMasukForm.jenisKelamin}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, jenisKelamin: e.target.value as Gender })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold cursor-pointer"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIS (Nomor Induk)
                    </label>
                    <input
                      type="text"
                      value={mutasiMasukForm.noInduk}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, noInduk: e.target.value })}
                      placeholder="Otomatis jika dikosongkan"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NISN Siswa
                    </label>
                    <input
                      type="text"
                      value={mutasiMasukForm.nisn}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, nisn: e.target.value })}
                      placeholder="Contoh: 0153891022"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NIK Siswa
                    </label>
                    <input
                      type="text"
                      value={mutasiMasukForm.nik}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, nik: e.target.value })}
                      placeholder="16 Digit NIK"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={mutasiMasukForm.tempatLahir}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, tempatLahir: e.target.value })}
                      placeholder="Contoh: Sungai Buluh"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Lahir <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={mutasiMasukForm.tanggalLahir}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, tanggalLahir: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Data Mutasi & Sekolah Asal */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] text-[#003399] dark:text-blue-400">
                  2. Riwayat Mutasi & Asal Pindahan
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sekolah Asal Pindahan (SD/MI) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={mutasiMasukForm.sekolahAsal}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, sekolahAsal: e.target.value })}
                      placeholder="Contoh: SD Negeri 002 Singingi Hilir"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Surat Keterangan Pindah (SKP)
                    </label>
                    <input
                      type="text"
                      value={mutasiMasukForm.noSuratPindah}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, noSuratPindah: e.target.value })}
                      placeholder="Contoh: 421.2/SDN-002/SKP/2026/019"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Diterima di Tingkat Kelas <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mutasiMasukForm.diterimaDiKelas}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMutasiMasukForm({ 
                          ...mutasiMasukForm, 
                          diterimaDiKelas: val,
                          kelasSekarang: val
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border-2 border-[#003399] dark:border-blue-500 bg-white dark:bg-slate-800 text-[#003399] dark:text-blue-300 font-bold cursor-pointer"
                    >
                      {transferClassOptions.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tingkat kelas saat resmi diterima masuk</p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Penempatan Rombel Aktif <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={mutasiMasukForm.kelasSekarang}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, kelasSekarang: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold cursor-pointer"
                    >
                      {classOptions.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Diterima Masuk <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={mutasiMasukForm.tanggalDiterima}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, tanggalDiterima: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Data Orang Tua & Alamat */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  3. Data Orang Tua & Alamat
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Orang Tua (Ayah / Ibu / Wali)
                    </label>
                    <input
                      type="text"
                      value={mutasiMasukForm.namaAyah}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, namaAyah: e.target.value })}
                      placeholder="Contoh: Bambang Irawan"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor HP / WhatsApp Orang Tua
                    </label>
                    <input
                      type="text"
                      value={mutasiMasukForm.noHpOrtu}
                      onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, noHpOrtu: e.target.value })}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Alamat Domisili Siswa
                  </label>
                  <input
                    type="text"
                    value={mutasiMasukForm.alamat}
                    onChange={(e) => setMutasiMasukForm({ ...mutasiMasukForm, alamat: e.target.value })}
                    placeholder="Contoh: Dusun Suka Maju RT 002 / RW 001, Desa Sungai Buluh"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Actions Modal */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMutasiMasukOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#003399] hover:bg-[#002266] text-white font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Simpan & Daftarkan Siswa Masuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: BATALKAN MUTASI KELUAR */}
      {studentToCancelMutation && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-4 bg-rose-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide">
                    KONFIRMASI PEMBATALAN MUTASI
                  </h3>
                  <p className="text-[11px] text-rose-100">
                    Pengembalian Status Siswa ke Buku Induk Aktif
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStudentToCancelMutation(null)}
                className="p-1 rounded-md text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-5 space-y-4 text-xs">
              {/* Alert Notice */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <p className="font-bold text-amber-900 dark:text-amber-200">Perhatian:</p>
                  Tindakan ini akan <strong>menghapus catatan mutasi keluar</strong> dari lembar Sheet TINGGALKAN dan mengembalikan status peserta didik menjadi <strong>AKTIF</strong> di Buku Induk Siswa.
                </div>
              </div>

              {/* Student Summary Info */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500 font-medium">Nama Siswa:</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{studentToCancelMutation.namaLengkap}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nomor Induk (NIS):</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-300">{studentToCancelMutation.noInduk}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">NISN:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{studentToCancelMutation.nisn}</span>
                </div>
                {studentToCancelMutation.mutasi?.sekolahTujuan && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Sekolah Tujuan Semula:</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">{studentToCancelMutation.mutasi.sekolahTujuan}</span>
                  </div>
                )}
                {studentToCancelMutation.mutasi?.tglMeninggalkan && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tanggal Pencatatan Mutasi:</span>
                    <span className="text-slate-700 dark:text-slate-300">{formatIndonesianDate(studentToCancelMutation.mutasi.tglMeninggalkan)}</span>
                  </div>
                )}
              </div>

              {/* Restore Class Selection */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Kembalikan ke Kelas Aktif: <span className="text-rose-500">*</span>
                </label>
                <select
                  value={restoreClass}
                  onChange={(e) => setRestoreClass(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                >
                  {classOptions.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Pilih tingkat kelas aktif saat siswa kembali mengikuti kegiatan belajar.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setStudentToCancelMutation(null)}
                className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelMutation}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Ya, Batalkan Mutasi & Aktifkan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PRATINJAU SURAT KETERANGAN PINDAH SEKOLAH */}
      {previewModalStudent && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal Pratinjau */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">
                    Pratinjau Surat Keterangan Pindah Sekolah
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Siswa: {previewModalStudent.namaLengkap} (NIS: {previewModalStudent.noInduk}) • Sesuai Berkas PDF Resmi
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const st = previewModalStudent;
                    setPreviewModalStudent(null);
                    handlePrintLetter(st);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Surat (PDF)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalStudent(null)}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
              <div className="shadow-xl border border-slate-300 rounded-sm w-full max-w-[210mm] bg-white">
                <SuratPindahDocument
                  student={previewModalStudent}
                  schoolProfile={schoolProfile}
                />
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-500">
                Format surat resmi dilengkapi lembar isian pengembalian untuk sekolah penerima.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const st = previewModalStudent;
                    setPreviewModalStudent(null);
                    onOpenMutationModal(st);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  Edit Data Formulir Surat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const st = previewModalStudent;
                    setPreviewModalStudent(null);
                    handlePrintLetter(st);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Dokumen Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL SURAT KETERANGAN PINDAH SEKOLAH (Printed when Cetak Surat clicked) */}
      {selectedStudentForLetter && !isPrintingRekap && !isPrintingRekapMasuk && (
        <div className="max-w-[210mm] mx-auto bg-white text-black shadow-2xl rounded-sm border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full">
          <SuratPindahDocument
            student={selectedStudentForLetter}
            schoolProfile={schoolProfile}
          />
        </div>
      )}

      {/* FORMAL LAPORAN REKAPITULASI MUTASI KELUAR (SHEET TINGGALKAN) */}
      {isPrintingRekap && (
        <div className="max-w-[297mm] mx-auto bg-white text-slate-950 p-[12mm] shadow-2xl rounded-sm font-serif text-[11px] leading-relaxed border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full">
          <KopSuratHeader
            schoolProfile={schoolProfile}
            documentTitle="BUKU REGISTER MUTASI PESERTA DIDIK"
            documentSubtitle="LAPORAN REKAPITULASI PESERTA DIDIK PINDAH / MENINGGALKAN SEKOLAH (SHEET TINGGALKAN)"
          />

          <div className="my-3 text-xs font-sans text-slate-700 flex justify-between items-center">
            <p>Daftar resmi peserta didik yang tercatat pindah / meninggalkan {schoolProfile.namaSekolah}:</p>
            <span className="font-bold">Tahun Pelajaran: {selectedTahunPelajaran === 'ALL' ? 'Semua Tahun (Arsip)' : selectedTahunPelajaran}</span>
          </div>

          <table className="w-full border-collapse border border-slate-950 text-[10px] my-3">
            <thead>
              <tr className="bg-slate-100 text-slate-950 font-bold">
                <th className="border border-slate-950 px-2 py-1 text-center w-8">No</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-24">NIS / NISN</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Nama Peserta Didik</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-10">L/P</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-16">Dari Kelas</th>
                <th className="border border-slate-950 px-2 py-1 text-center w-24">Tgl Keluar</th>
                <th className="border border-slate-950 px-2 py-1 text-left w-36">No. Surat Pindah</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Sekolah Tujuan</th>
                <th className="border border-slate-950 px-2 py-1 text-left">Alasan Pindah</th>
              </tr>
            </thead>
            <tbody>
              {filteredMutated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-slate-950 px-3 py-4 text-center text-slate-500 italic">
                    Belum ada catatan peserta didik mutasi / pindah sekolah.
                  </td>
                </tr>
              ) : (
                filteredMutated.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{s.noInduk} / {s.nisn}</td>
                    <td className="border border-slate-950 px-2 py-1 font-bold uppercase">{s.namaLengkap}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{s.jenisKelamin}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{s.mutasi?.dariKelas || s.kelasSekarang}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{formatIndonesianDate(s.mutasi?.tglMeninggalkan || s.tanggalPembaruan)}</td>
                    <td className="border border-slate-950 px-2 py-1 font-mono text-[9px]">{s.mutasi?.noSuratPindah || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 font-semibold">{s.mutasi?.sekolahTujuan || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1">{s.mutasi?.alasanPindah || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-end font-sans text-[11px] mt-6">
            <div className="text-center">
              <div>Mengetahui,</div>
              <div>Pengelola / Petugas Buku Induk</div>
              <div className="h-16" />
              <div className="font-bold underline">Administrator / Operator</div>
              <div>NIP. -</div>
            </div>

            <div className="text-right leading-tight">
              <div>{schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh'}, {formatIndonesianDate(new Date().toISOString())}</div>
              <div className="font-bold mt-0.5">Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-16 flex items-center justify-end relative">
                {schoolProfile.stempelUrl ? (
                  <img
                    src={schoolProfile.stempelUrl}
                    alt="Stempel Sekolah"
                    className="w-24 h-16 object-contain opacity-85 absolute right-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-10 border border-blue-900/30 rounded flex items-center justify-center text-[8px] text-blue-900 font-bold">
                    [ STEMPEL RESMI ]
                  </div>
                )}
              </div>
              <div className="font-bold underline relative z-10">{schoolProfile.namaKepalaSekolah}</div>
              <div>NIP. {schoolProfile.nipKepalaSekolah}</div>
            </div>
          </div>
        </div>
      )}

      {/* FORMAL LAPORAN REGISTER MUTASI MASUK (PRINT DOKUMEN RESMI) */}
      {isPrintingRekapMasuk && (
        <div className="max-w-[297mm] mx-auto bg-white text-slate-950 p-[12mm] shadow-2xl rounded-sm font-serif text-[11px] leading-relaxed border border-slate-300 print:border-none print:shadow-none print:m-0 print:w-full">
          <KopSuratHeader
            schoolProfile={schoolProfile}
            documentTitle="BUKU REGISTER MUTASI MASUK PESERTA DIDIK"
            documentSubtitle="LAPORAN RESMI PESERTA DIDIK PINDAHAN DITERIMA DI TINGKAT KELAS"
          />

          <div className="my-3 text-xs font-sans text-slate-700 flex justify-between items-center">
            <p>Daftar resmi peserta didik pindahan yang diterima masuk di {schoolProfile.namaSekolah}:</p>
            <span className="font-bold">Tahun Pelajaran: {selectedTahunPelajaran === 'ALL' ? 'Semua Tahun (Arsip)' : selectedTahunPelajaran}</span>
          </div>

          <table className="w-full border-collapse border border-slate-950 text-[10px] my-3">
            <thead>
              <tr className="bg-slate-100 text-slate-950 font-bold">
                <th className="border border-slate-950 px-2 py-1.5 text-center w-8">No</th>
                <th className="border border-slate-950 px-2 py-1.5 text-center w-24">NIS / NISN</th>
                <th className="border border-slate-950 px-2 py-1.5 text-left">Nama Peserta Didik</th>
                <th className="border border-slate-950 px-2 py-1.5 text-center w-10">L/P</th>
                <th className="border border-slate-950 px-2 py-1.5 text-center w-24">Diterima di Tingkat</th>
                <th className="border border-slate-950 px-2 py-1.5 text-center w-20">Rombel Sekarang</th>
                <th className="border border-slate-950 px-2 py-1.5 text-left">Sekolah Asal Pindahan</th>
                <th className="border border-slate-950 px-2 py-1.5 text-left w-36">No. Surat Pindah / SKP</th>
                <th className="border border-slate-950 px-2 py-1.5 text-center w-24">Tgl Diterima</th>
              </tr>
            </thead>
            <tbody>
              {filteredMutasiMasuk.length === 0 ? (
                <tr>
                  <td colSpan={9} className="border border-slate-950 px-3 py-4 text-center text-slate-500 italic">
                    Belum ada catatan peserta didik mutasi masuk (pindahan) terdaftar.
                  </td>
                </tr>
              ) : (
                filteredMutasiMasuk.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center font-mono">{s.noInduk} / {s.nisn}</td>
                    <td className="border border-slate-950 px-2 py-1 font-bold uppercase">{s.namaLengkap}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{s.jenisKelamin}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center font-bold">{s.diterimaDiKelas || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">{s.kelasSekarang}</td>
                    <td className="border border-slate-950 px-2 py-1 font-semibold">{s.sekolahAsalTK || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 font-mono text-[9px]">{s.noIjazahTK || '-'}</td>
                    <td className="border border-slate-950 px-2 py-1 text-center">
                      {s.tanggalDiterima ? formatIndonesianDate(s.tanggalDiterima) : (s.tahunMasuk || '-')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="flex justify-between items-end font-sans text-[11px] mt-6">
            <div className="text-center">
              <div>Mengetahui,</div>
              <div>Pengelola / Petugas Buku Induk</div>
              <div className="h-16" />
              <div className="font-bold underline">Administrator / Operator</div>
              <div>NIP. -</div>
            </div>

            <div className="text-right leading-tight">
              <div>{schoolProfile.desaKelurahan || schoolProfile.desa || 'Sungai Buluh'}, {formatIndonesianDate(new Date().toISOString())}</div>
              <div className="font-bold mt-0.5">Kepala {schoolProfile.namaSekolah}</div>
              <div className="h-16 flex items-center justify-end relative">
                {schoolProfile.stempelUrl ? (
                  <img
                    src={schoolProfile.stempelUrl}
                    alt="Stempel Sekolah"
                    className="w-24 h-16 object-contain opacity-85 absolute right-4"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-24 h-10 border border-blue-900/30 rounded flex items-center justify-center text-[8px] text-blue-900 font-bold">
                    [ STEMPEL RESMI ]
                  </div>
                )}
              </div>
              <div className="font-bold underline relative z-10">{schoolProfile.namaKepalaSekolah}</div>
              <div>NIP. {schoolProfile.nipKepalaSekolah}</div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPOR DATA MUTASI FORMAT EXCEL */}
      <ImportMutasiModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          setFeedbackToast({
            message: 'Data mutasi dari berkas Excel berhasil diimpor ke Buku Induk!',
            type: 'success',
          });
          setTimeout(() => setFeedbackToast(null), 4000);
        }}
      />
    </div>
  );
};
