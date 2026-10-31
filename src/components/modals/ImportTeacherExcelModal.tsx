import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  ArrowRight,
  Info,
  Check,
  AlertTriangle
} from 'lucide-react';
import { AdminUser, SchoolProfile } from '../../types';
import { cn } from '../../lib/utils';
import { 
  downloadTeacherTemplateExcel, 
  parseExcelToTeachers 
} from '../../utils/excelTeacherHelper';

interface ImportTeacherExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (importedUsers: Partial<AdminUser>[], strategy: 'append' | 'replace') => void;
  schoolProfile: SchoolProfile;
}

export const ImportTeacherExcelModal: React.FC<ImportTeacherExcelModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  schoolProfile,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
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
  } | null>(null);

  const [importStrategy, setImportStrategy] = useState<'append' | 'replace'>('append');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setParseError('Berkas harus berformat Microsoft Excel (.xlsx atau .xls)');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setParsedData(null);

    try {
      const parsed = await parseExcelToTeachers(selectedFile);
      setParsedData(parsed);
      if (parsed.totalRows === 0) {
        setParseError('Berkas tidak berisi baris data pegawai atau format tabel kosong.');
      }
    } catch (err: any) {
      setParseError(err?.message || 'Gagal memproses berkas Excel.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleExecuteImport = () => {
    if (!parsedData || parsedData.validRows === 0) return;

    setIsSubmitting(true);
    const validUsers = parsedData.results
      .filter(r => r.isValid)
      .map(r => r.data);

    try {
      onImportSuccess(validUsers, importStrategy);
      handleReset();
      onClose();
    } catch (err: any) {
      setParseError(err?.message || 'Gagal menyimpan data import.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#003399] text-white shrink-0 border-b border-blue-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  IMPORT EXCEL
                </span>
                <span className="text-xs text-blue-200 font-mono">Format .xlsx</span>
              </div>
              <h3 className="text-base font-extrabold text-white">
                Import Data Guru & Tenaga Kependidikan
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Download Template Banner */}
          <div className="p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-blue-950 dark:text-blue-100">
                  Belum punya template Excel standar Guru & Tendik?
                </h4>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                  Unduh template resmi berformat .xlsx yang telah dilengkapi contoh data Guru, Tendik, Mutasi Masuk, Mutasi Keluar (beserta alasan keluar), dan petunjuk pengisian.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => downloadTeacherTemplateExcel(schoolProfile.namaSekolah)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>Download Template .xlsx</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {!parsedData && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3",
                isParsing 
                  ? "border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                  : "border-slate-300 dark:border-slate-700 hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                {isParsing ? (
                  <RefreshCw className="w-7 h-7 animate-spin text-blue-600 dark:text-blue-400" />
                ) : (
                  <Upload className="w-7 h-7" />
                )}
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {isParsing ? 'Sedang membaca dan menganalisis berkas Excel...' : 'Klik untuk memilih berkas atau seret berkas Excel ke sini'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Mendukung berkas Microsoft Excel format <strong>.xlsx</strong> atau <strong>.xls</strong>
                </p>
              </div>

              {file && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs font-mono font-bold mt-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          )}

          {/* Error Banner */}
          {parseError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Parsed Data Preview & Settings */}
          {parsedData && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Stats Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Total Baris Dideteksi</span>
                  <span className="text-xl font-black text-slate-900 dark:text-slate-100">{parsedData.totalRows} Pegawai</span>
                </div>

                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Baris Valid & Siap Impor</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{parsedData.validRows} Pegawai</span>
                  </span>
                </div>

                <div className={cn(
                  "p-3.5 rounded-xl border",
                  parsedData.invalidRows > 0
                    ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800"
                    : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                )}>
                  <span className={cn(
                    "text-[11px] font-bold uppercase block",
                    parsedData.invalidRows > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-500"
                  )}>
                    Baris Tidak Lengkap / Error
                  </span>
                  <span className={cn(
                    "text-xl font-black",
                    parsedData.invalidRows > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-600"
                  )}>
                    {parsedData.invalidRows} Data
                  </span>
                </div>
              </div>

              {/* Import Strategy Options */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Metode Penggabungan Data:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all",
                    importStrategy === 'append'
                      ? "border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-bold"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}>
                    <input
                      type="radio"
                      name="strategy"
                      checked={importStrategy === 'append'}
                      onChange={() => setImportStrategy('append')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div>
                      <span>Tambahkan ke data yang sudah ada (Append)</span>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Data pegawai dari Excel akan ditambahkan tanpa menghapus data guru/tendik yang sudah tersimpan.
                      </p>
                    </div>
                  </label>

                  <label className={cn(
                    "flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all",
                    importStrategy === 'replace'
                      ? "border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 font-bold"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}>
                    <input
                      type="radio"
                      name="strategy"
                      checked={importStrategy === 'replace'}
                      onChange={() => setImportStrategy('replace')}
                      className="mt-0.5 text-amber-600"
                    />
                    <div>
                      <span>Ganti seluruh daftar data pegawai (Replace)</span>
                      <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                        Seluruh data guru & tendik lama akan digantikan secara penuh dengan data dari berkas Excel ini.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Pratinjau Data yang Terbaca:</span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ganti File Excel</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Baris</th>
                        <th className="p-2.5">Nama & NIP</th>
                        <th className="p-2.5">Kategori / Jabatan</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5">Riwayat Mutasi / Alasan</th>
                        <th className="p-2.5 text-center">Status Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parsedData.results.map((res, i) => (
                        <tr key={i} className={cn(
                          "hover:bg-slate-50 dark:hover:bg-slate-800/40",
                          !res.isValid && "bg-rose-50/50 dark:bg-rose-950/20"
                        )}>
                          <td className="p-2.5 font-mono text-slate-400 font-bold">{res.rowNumber}</td>
                          <td className="p-2.5">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{res.data.nama || '-'}</div>
                            <div className="text-[10px] text-slate-400 font-mono">NIP: {res.data.nip || '-'}</div>
                          </td>
                          <td className="p-2.5">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[10px] font-bold block w-fit mb-0.5",
                              res.data.kategoriTugas === 'tenaga_kependidikan'
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                                : res.data.kategoriTugas === 'kepala_sekolah'
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            )}>
                              {res.data.kategoriTugas === 'tenaga_kependidikan' ? 'Tendik' : res.data.kategoriTugas === 'kepala_sekolah' ? 'Kepsek' : 'Guru'}
                            </span>
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{res.data.jabatan}</div>
                          </td>
                          <td className="p-2.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-bold",
                              res.data.status === 'Aktif'
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                : res.data.status === 'Mutasi Masuk'
                                ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300"
                                : res.data.status === 'Mutasi Keluar'
                                ? "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300"
                                : res.data.status === 'Pensiun'
                                ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            )}>
                              {res.data.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-[11px]">
                            {res.data.status === 'Mutasi Masuk' ? (
                              <div className="text-cyan-700 dark:text-cyan-400">
                                <strong>Masuk dari:</strong> {res.data.sekolahAsalMutasi || '-'}
                              </div>
                            ) : res.data.status === 'Mutasi Keluar' || res.data.status === 'Pensiun' ? (
                              <div>
                                <div className="text-rose-600 dark:text-rose-400 font-semibold">
                                  <strong>Keluar karena:</strong> {res.data.alasanKeluar || '-'}
                                </div>
                                {res.data.sekolahTujuanMutasi && (
                                  <div className="text-[10px] text-slate-500">
                                    Tujuan: {res.data.sekolahTujuanMutasi}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            {res.isValid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                                <Check className="w-3.5 h-3.5" />
                                <span>Valid</span>
                              </span>
                            ) : (
                              <span 
                                className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-bold"
                                title={res.errors.join(', ')}
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Error</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {parsedData && (
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isSubmitting || parsedData.validRows === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#003399] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>Import {parsedData.validRows} Data Pegawai</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
