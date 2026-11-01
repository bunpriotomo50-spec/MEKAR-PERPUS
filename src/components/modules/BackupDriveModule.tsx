import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  getCurrentUser,
} from '../../utils/googleAuth';
import {
  DRIVE_BACKUP_FOLDER_ID,
  DRIVE_BACKUP_FOLDER_URL,
  uploadBackupToGoogleDrive,
  listDriveBackups,
  downloadLocalBackupFile,
  DriveUploadResult,
  DriveBackupFile,
} from '../../utils/googleDrive';
import {
  Cloud,
  CloudUpload,
  FolderOpen,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Database,
  ExternalLink,
  Lock,
  LogOut,
  Calendar,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  Info,
  X,
  BookOpen,
  Users,
  ArrowLeftRight,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { User } from 'firebase/auth';

export const BackupDriveModule: React.FC = () => {
  const {
    schoolInfo,
    books,
    members,
    loans,
    visitors,
    budgetLogs,
    getCompleteBackupPayload,
    restoreBackupData,
  } = useLibrary();

  // Auth state
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Drive state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string>('');
  const [uploadResult, setUploadResult] = useState<DriveUploadResult | null>(null);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);

  // Modals & Confirmation dialogs (MANDATORY for mutating Workspace operations)
  const [showConfirmUploadModal, setShowConfirmUploadModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restorePayload, setRestorePayload] = useState<any | null>(null);
  const [restoreFeedback, setRestoreFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (loggedInUser, token) => {
        setUser(loggedInUser);
        setAccessToken(token);
        loadDriveBackups(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setDriveBackups([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        loadDriveBackups(result.accessToken);
      }
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-closed-by-user')
      ) {
        return;
      }
      setAuthError(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setAccessToken(null);
    setDriveBackups([]);
    setUploadResult(null);
  };

  const loadDriveBackups = async (token?: string) => {
    const activeToken = token || accessToken;
    if (!activeToken) return;
    setIsLoadingBackups(true);
    try {
      const files = await listDriveBackups(activeToken);
      setDriveBackups(files);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  // Perform Google Drive upload after user confirmation
  const handleExecuteDriveBackup = async () => {
    setShowConfirmUploadModal(false);
    const token = accessToken || (await getAccessToken());
    if (!token) {
      setAuthError('Sesi login Google telah kedaluwarsa. Silakan masuk kembali.');
      return;
    }

    setIsUploading(true);
    setUploadResult(null);
    setUploadStep('Menyusun seluruh data perpustakaan...');

    try {
      const payload = getCompleteBackupPayload();
      setUploadStep('Mengemas berkas cadangan JSON...');

      await new Promise((r) => setTimeout(r, 400));
      setUploadStep(`Menghubungkan ke folder Google Drive (${DRIVE_BACKUP_FOLDER_ID})...`);

      const result = await uploadBackupToGoogleDrive(token, payload);
      setUploadStep('Verifikasi unggahan selesai!');
      setUploadResult(result);

      // Refresh recent list
      await loadDriveBackups(token);
    } catch (err: any) {
      console.warn('Backup upload warning:', err);
      setUploadResult({
        success: false,
        folderId: DRIVE_BACKUP_FOLDER_ID,
        folderUrl: DRIVE_BACKUP_FOLDER_URL,
        message: err.message || 'Terjadi kesalahan saat mengunggah cadangan ke Google Drive.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Local JSON download
  const handleDownloadLocalJson = () => {
    const payload = getCompleteBackupPayload();
    downloadLocalBackupFile(payload);
  };

  // File picker handler for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        setRestorePayload(parsed);
        setShowRestoreModal(true);
      } catch (err: any) {
        setRestoreFeedback({
          isError: true,
          message: 'Berkas yang dipilih bukan berkas JSON cadangan yang valid.',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExecuteRestore = () => {
    if (!restorePayload) return;
    const res = restoreBackupData(restorePayload);
    setRestoreFeedback({
      isError: !res.success,
      message: res.message,
    });
    setShowRestoreModal(false);
    setRestorePayload(null);
    setTimeout(() => setRestoreFeedback(null), 6000);
  };

  const activeLoans = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const totalCopies = books.reduce((acc, b) => acc + (b.copiesTotal || 1), 0);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
              <CloudUpload size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Menu Backup Data & Cloud Drive
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  Resmi Google Drive
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencadangan otomatis seluruh database {schoolInfo.libraryName} • {schoolInfo.name} ke folder Google Drive sekolah
              </p>
            </div>
          </div>
        </div>

        {/* Action badge link to designated Drive folder */}
        <a
          href={DRIVE_BACKUP_FOLDER_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all border border-slate-300 shadow-xs cursor-pointer"
        >
          <FolderOpen size={16} className="text-amber-600" />
          <span>Buka Folder Drive Tujuan</span>
          <ExternalLink size={13} className="text-slate-400" />
        </a>
      </div>

      {/* FEEDBACK BANNER (IF ANY) */}
      {restoreFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs ${
            restoreFeedback.isError
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {restoreFeedback.isError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>{restoreFeedback.message}</span>
          </div>
          <button
            onClick={() => setRestoreFeedback(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: GOOGLE DRIVE CONNECTION & BACKUP ACTIONS */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: GOOGLE ACCOUNT & DRIVE STATUS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Cloud size={18} className="text-blue-600" />
              1. Status Koneksi Google Drive
            </h2>

            {user ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Akun'}
                      className="w-11 h-11 rounded-full border-2 border-white shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">{user.displayName || 'Pengguna Google'}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900">
                        Terhubung
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{user.email}</p>
                    <p className="text-[10px] text-emerald-800 font-medium mt-0.5 flex items-center gap-1">
                      <ShieldCheck size={12} />
                      Izin Aktif: Penyimpanan & Pengunggahan Berkas Cadangan Drive
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGoogleLogout}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <LogOut size={13} />
                  <span>Keluar Akun</span>
                </button>
              </div>
            ) : (
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">
                      Sambungkan Akun Google untuk Sinkronisasi Otomatis
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Hubungkan akun Google Anda dengan aman untuk mengunggah berkas cadangan database perpustakaan ke folder Google Drive resmi sekolah secara berkala.
                    </p>
                  </div>
                </div>

                {authError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                    <AlertTriangle size={15} />
                    <span>{authError}</span>
                  </div>
                )}

                {/* OFFICIAL GOOGLE SIGN-IN BUTTON */}
                <div className="pt-1">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isSigningIn}
                    className="inline-flex items-center justify-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSigningIn ? (
                      <RefreshCw size={16} className="animate-spin text-blue-600" />
                    ) : (
                      <svg
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-4 h-4 shrink-0"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                        />
                        <path fill="none" d="M0 0h48v48H0z" />
                      </svg>
                    )}
                    <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: BACKUP & UPLOAD ACTIONS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Database size={18} className="text-emerald-700" />
                2. Eksekusi Pencadangan Data (Backup)
              </h2>
              <span className="text-[11px] text-slate-500">
                Waktu server: {new Date().toLocaleDateString('id-ID')}
              </span>
            </div>

            {/* PRIMARY BUTTON: BACKUP TO GOOGLE DRIVE */}
            <div className="p-5 bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <CloudUpload size={20} className="text-amber-300" />
                    Pencadangan Langsung ke Google Drive Sekolah
                  </h3>
                  <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                    Data buku, anggota, riwayat sirkulasi, pengunjung, dan anggaran akan dienkapsulasi ke dalam berkas cadangan resmi dan diunggah langsung ke folder Drive:
                  </p>
                  <p className="text-[11px] font-mono text-amber-200 mt-0.5 break-all">
                    Folder ID: {DRIVE_BACKUP_FOLDER_ID}
                  </p>
                </div>

                <button
                  onClick={() => setShowConfirmUploadModal(true)}
                  disabled={isUploading || !user}
                  className="px-5 py-3 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload size={18} />
                      <span>{user ? 'Mulai Backup ke Google Drive' : 'Masuk Google Terlebih Dahulu'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Upload Progress Status Bar */}
              {isUploading && (
                <div className="p-3 bg-emerald-950/60 rounded-lg space-y-2 border border-emerald-700/50">
                  <div className="flex items-center justify-between text-[11px] text-emerald-200">
                    <span className="font-semibold">{uploadStep}</span>
                    <span className="animate-pulse">Sedang Memproses...</span>
                  </div>
                  <div className="w-full bg-emerald-900/80 rounded-full h-2 overflow-hidden">
                    <div className="bg-amber-400 h-2 rounded-full w-3/4 animate-pulse" />
                  </div>
                </div>
              )}

              {/* Upload Result Notification */}
              {uploadResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
                    uploadResult.success
                      ? 'bg-emerald-950/80 text-emerald-100 border-emerald-500'
                      : 'bg-rose-950/80 text-rose-200 border-rose-500'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {uploadResult.success ? (
                      <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold text-xs">{uploadResult.message}</p>
                      {uploadResult.fileName && (
                        <p className="text-[11px] opacity-90 mt-0.5 font-mono">
                          Nama berkas: {uploadResult.fileName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {uploadResult.webViewLink && (
                      <a
                        href={uploadResult.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white text-emerald-950 hover:bg-slate-100 flex items-center gap-1 shadow-xs"
                      >
                        <ExternalLink size={12} />
                        <span>Buka Berkas di Drive</span>
                      </a>
                    )}
                    <a
                      href={uploadResult.folderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-700 text-white hover:bg-emerald-600 flex items-center gap-1 shadow-xs"
                    >
                      <FolderOpen size={12} />
                      <span>Buka Folder</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* SECONDARY BACKUP OPTIONS: LOCAL FILE & RESTORE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Local JSON Download */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Download size={16} className="text-slate-600" />
                  <span>Cadangkan ke Penyimpanan Lokal (.JSON)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Unduh berkas JSON cadangan langsung ke komputer/laptop atau flashdisk sebagai arsip cadangan luring (offline).
                </p>
                <button
                  onClick={handleDownloadLocalJson}
                  className="mt-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download size={14} />
                  <span>Unduh File Cadangan .JSON</span>
                </button>
              </div>

              {/* Restore / Import */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <Upload size={16} className="text-amber-600" />
                  <span>Pulihkan Data dari Berkas Cadangan</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Unggah berkas JSON cadangan yang pernah dibuat sebelumnya untuk mengembalikan seluruh catatan perpustakaan.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full py-2 px-3 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Upload size={14} className="text-amber-600" />
                  <span>Pilih Berkas Cadangan untuk Dipulihkan</span>
                </button>
              </div>
            </div>
          </div>

          {/* CARD 3: RECENT GOOGLE DRIVE BACKUPS LIST */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FolderOpen size={18} className="text-amber-600" />
                3. Berkas Cadangan Tersimpan di Google Drive
              </h2>

              {user && (
                <button
                  onClick={() => loadDriveBackups()}
                  disabled={isLoadingBackups}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  title="Segarkan daftar dari Drive"
                >
                  <RefreshCw size={14} className={isLoadingBackups ? 'animate-spin' : ''} />
                  <span className="text-[11px]">Segarkan</span>
                </button>
              )}
            </div>

            {!user ? (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Lock size={24} className="mx-auto mb-2 text-slate-300" />
                <p>Silakan masuk dengan akun Google di atas untuk melihat daftar berkas cadangan di Google Drive.</p>
              </div>
            ) : isLoadingBackups ? (
              <div className="text-center py-8 text-xs text-slate-500">
                <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-emerald-800" />
                <p>Memuat daftar berkas cadangan dari Google Drive...</p>
              </div>
            ) : driveBackups.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-1">
                <Cloud size={24} className="mx-auto mb-1 text-slate-300" />
                <p className="font-semibold text-slate-700">Belum ada berkas cadangan yang ditemukan.</p>
                <p className="text-[11px] text-slate-400">
                  Klik tombol <strong>"Mulai Backup ke Google Drive"</strong> di atas untuk membuat cadangan pertama Anda.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {driveBackups.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 font-mono text-[11px]">{file.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(file.createdTime).toLocaleString('id-ID')}
                          </span>
                          {file.size && (
                            <span>• {(parseInt(file.size, 10) / 1024).toFixed(1)} KB</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1 border border-slate-300 shadow-2xs"
                      >
                        <ExternalLink size={12} />
                        <span>Buka di Drive</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: BACKUP METRICS & FOLDER INFO */}
        <div className="space-y-6">
          {/* FOLDER TARGET INFO CARD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderOpen size={18} className="text-amber-600" />
              Folder Google Drive Tujuan
            </h2>

            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Nama Folder / Lokasi:
                </span>
                <span className="text-xs font-black text-slate-900">
                  Folder Resmi Perpustakaan SMPN 2 Pemalang
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Folder ID:
                </span>
                <span className="text-[11px] font-mono font-bold text-slate-800 break-all bg-white/80 px-2 py-0.5 rounded border border-amber-200 block mt-0.5">
                  {DRIVE_BACKUP_FOLDER_ID}
                </span>
              </div>

              <a
                href={DRIVE_BACKUP_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <FolderOpen size={14} />
                <span>Buka Folder di Google Drive</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="text-[11px] text-slate-500 space-y-1.5 border-t border-slate-100 pt-3">
              <p className="font-semibold text-slate-700">Rekomendasi Petugas:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>Lakukan pencadangan berkala setiap akhir pekan atau akhir bulan.</li>
                <li>Pencadangan mencakup data buku, anggota, sirkulasi, pengunjung & kas denda.</li>
                <li>Berkas dapat dipulihkan kapan saja ke perangkat lain melalui menu pulihkan.</li>
              </ul>
            </div>
          </div>

          {/* SUMMARY OF DATA BEING BACKED UP */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database size={18} className="text-emerald-700" />
              Rincian Database Saat Ini
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Koleksi Judul</span>
                <strong className="text-base font-black text-slate-900">{books.length}</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">({totalCopies} Eks)</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Total Anggota</span>
                <strong className="text-base font-black text-slate-900">{members.length}</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Siswa & Guru</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Total Sirkulasi</span>
                <strong className="text-base font-black text-slate-900">{loans.length}</strong>
                <span className="text-[10px] text-blue-700 block mt-0.5">({activeLoans.length} Aktif)</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] text-slate-500 block">Buku Tamu</span>
                <strong className="text-base font-black text-slate-900">{visitors.length}</strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Kunjungan</span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Catatan Keuangan & Kas</span>
                    <strong className="text-sm font-black text-emerald-800">{budgetLogs.length} Entri</strong>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 rounded-md">
                    Lengkap
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
              <p className="font-bold text-slate-800">Identitas Sekolah:</p>
              <p>{schoolInfo.name} • NPSN {schoolInfo.npsn}</p>
              <p>{schoolInfo.libraryName}</p>
              <p className="text-[10px] text-slate-400">{schoolInfo.address}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL FOR WORKSPACE DRIVE UPLOAD */}
      {showConfirmUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl shrink-0">
                <CloudUpload size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Konfirmasi Backup ke Google Drive
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Harap tinjau ringkasan data yang akan diunggah ke Google Drive:
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Folder Google Drive Tujuan:</span>
                <span className="font-bold font-mono text-slate-900 text-[11px] truncate max-w-[180px]">
                  {DRIVE_BACKUP_FOLDER_ID}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Koleksi Buku:</span>
                <span className="font-bold text-slate-900">{books.length} Judul ({totalCopies} Eksemplar)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Anggota Terdaftar:</span>
                <span className="font-bold text-slate-900">{members.length} Siswa & Guru</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Riwayat Sirkulasi Peminjaman:</span>
                <span className="font-bold text-slate-900">{loans.length} Catatan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buku Tamu Kunjungan:</span>
                <span className="font-bold text-slate-900">{visitors.length} Kunjungan</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Berkas cadangan akan diberi cap waktu otomatis dan tersimpan di folder Google Drive sekolah yang dapat diakses oleh petugas yang berwenang.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmUploadModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteDriveBackup}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CloudUpload size={15} />
                <span>Ya, Mulai Backup ke Drive</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR RESTORE DATA */}
      {showRestoreModal && restorePayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-rose-100 text-rose-800 rounded-xl shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Konfirmasi Pemulihan Data (Restore)
                </h3>
                <p className="text-xs text-rose-700 mt-1 font-semibold">
                  Tindakan ini akan menimpa data aktif saat ini dengan data dari berkas cadangan!
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Waktu Cadangan:</span>
                <span className="font-bold text-slate-900">
                  {restorePayload.backupDateFormatted || restorePayload.backupTimestamp || 'Tidak tercatat'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Koleksi Buku:</span>
                <span className="font-bold text-slate-900">
                  {restorePayload.data?.books?.length || restorePayload.books?.length || 0} Judul
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5">
                <span className="text-slate-500">Anggota:</span>
                <span className="font-bold text-slate-900">
                  {restorePayload.data?.members?.length || restorePayload.members?.length || 0} Orang
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sirkulasi:</span>
                <span className="font-bold text-slate-900">
                  {restorePayload.data?.loans?.length || restorePayload.loans?.length || 0} Catatan
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowRestoreModal(false);
                  setRestorePayload(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteRestore}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={15} />
                <span>Ya, Pulihkan Data Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
