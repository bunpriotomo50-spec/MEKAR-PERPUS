import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Loan, SCHOOL_INFO } from '../../types/library';
import { exportLoansToExcel } from '../../utils/excelHelper';
import { OfficialKopSurat } from '../OfficialKopSurat';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Printer,
  Download,
  Search,
  Calendar,
  DollarSign,
  MessageSquare,
  BookOpen,
  User,
  X,
  FileText,
  ScanBarcode,
  Camera,
} from 'lucide-react';
import { CameraBarcodeScannerModal, playBarcodeBeep } from '../CameraBarcodeScannerModal';

export const CirculationModule: React.FC = () => {
  const { books, members, loans, settings, borrowBook, returnBook, updateSettings } = useLibrary();

  // Circulation Tab: 'pinjam' | 'kembali' | 'terlambat' | 'riwayat' | 'pengaturan'
  const [activeSubTab, setActiveSubTab] = useState<'pinjam' | 'kembali' | 'terlambat' | 'riwayat' | 'pengaturan'>('pinjam');

  // New Loan Form State
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [customDays, setCustomDays] = useState<number>(7);
  const [loanNotes, setLoanNotes] = useState('');
  const [staffName, setStaffName] = useState('Bambang Tri Atmojo, S.I.Pust.');
  const [formFeedback, setFormFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Quick return selection & search
  const [returnSearch, setReturnSearch] = useState('');
  const [selectedLoanForReceipt, setSelectedLoanForReceipt] = useState<Loan | null>(null);

  // Barcode Quick Scan for Borrow Form
  const [scanBorrowQuery, setScanBorrowQuery] = useState('');
  const [scanBorrowFeedback, setScanBorrowFeedback] = useState<{ text: string; isSuccess: boolean } | null>(null);

  // Active loans
  const activeLoans = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const overdueLoans = loans.filter((l) => l.status === 'Terlambat');
  const historyLoans = loans.filter((l) => l.status === 'Kembali');

  // Barcode Quick Scan for Return
  const [quickReturnBarcode, setQuickReturnBarcode] = useState('');
  const [quickReturnFeedback, setQuickReturnFeedback] = useState<{ text: string; isSuccess: boolean } | null>(null);

  // Camera Barcode Scanner State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraScanContext, setCameraScanContext] = useState<'borrow' | 'return'>('borrow');
  const [lastScannedCameraInfo, setLastScannedCameraInfo] = useState<{
    type: 'book' | 'member' | 'unknown';
    title: string;
    code: string;
    detail?: string;
    success: boolean;
  } | null>(null);

  // Handle Quick Return
  const handleReturnAction = (loanId: string, isFinePaid: boolean = true) => {
    const res = returnBook({
      loanId,
      isFinePaid,
      returnedByStaff: staffName,
    });

    const targetLoan = loans.find((l) => l.id === loanId);
    if (targetLoan) {
      setSelectedLoanForReceipt({ ...targetLoan, status: 'Kembali', isFinePaid });
    }
    setFormFeedback(res);
  };

  // Handle camera barcode detection
  const handleCameraBarcodeScanned = (code: string) => {
    const query = code.trim();
    if (!query) return;

    if (cameraScanContext === 'return') {
      // Return mode: scan book barcode to return active loan
      const matchedLoan = activeLoans.find(
        (l) =>
          l.bookBarcode.toLowerCase() === query.toLowerCase() ||
          l.bookInventoryCode.toLowerCase() === query.toLowerCase() ||
          l.loanCode.toLowerCase() === query.toLowerCase()
      );

      if (matchedLoan) {
        handleReturnAction(matchedLoan.id, true);
        setQuickReturnFeedback({
          text: `✓ Buku "${matchedLoan.bookTitle}" (Peminjam: ${matchedLoan.memberName}) berhasil dikembalikan via Kamera!`,
          isSuccess: true,
        });
        setLastScannedCameraInfo({
          type: 'book',
          title: `Pengembalian: ${matchedLoan.bookTitle}`,
          code: matchedLoan.bookBarcode,
          detail: `Peminjam: ${matchedLoan.memberName} (${matchedLoan.memberClassOrSubject})`,
          success: true,
        });
      } else {
        setQuickReturnFeedback({
          text: `❌ Tidak ditemukan pinjaman aktif untuk barcode buku "${query}".`,
          isSuccess: false,
        });
        setLastScannedCameraInfo({
          type: 'unknown',
          title: 'Tidak Ada Pinjaman Aktif',
          code: query,
          detail: 'Barcode ini tidak ditemukan pada daftar peminjaman aktif.',
          success: false,
        });
      }
      return;
    }

    // Borrow mode: can be a member card OR a book barcode
    const matchedMember = members.find(
      (m) =>
        m.memberCode.toLowerCase() === query.toLowerCase() ||
        m.idNumber.toLowerCase() === query.toLowerCase() ||
        m.name.toLowerCase() === query.toLowerCase()
    );

    const matchedBook = books.find(
      (b) =>
        b.barcode.toLowerCase() === query.toLowerCase() ||
        b.inventoryCode.toLowerCase() === query.toLowerCase()
    );

    if (matchedMember) {
      setSelectedMemberId(matchedMember.id);
      setCustomDays(
        matchedMember.type === 'Guru'
          ? settings.teacherLoanDurationDays
          : settings.studentLoanDurationDays
      );
      setScanBorrowFeedback({
        text: `✓ Kartu Anggota Terdeteksi via Kamera: ${matchedMember.name} (${matchedMember.memberCode})`,
        isSuccess: true,
      });
      setLastScannedCameraInfo({
        type: 'member',
        title: matchedMember.name,
        code: matchedMember.memberCode,
        detail: `${matchedMember.type} • ${matchedMember.classOrSubject}`,
        success: true,
      });
      return;
    }

    if (matchedBook) {
      if (matchedBook.copiesAvailable <= 0) {
        setScanBorrowFeedback({
          text: `⚠️ Buku "${matchedBook.title}" (${matchedBook.barcode}) stok sedang dipinjam seluruhnya.`,
          isSuccess: false,
        });
        setLastScannedCameraInfo({
          type: 'book',
          title: matchedBook.title,
          code: matchedBook.barcode,
          detail: 'Stok buku habis / sedang dipinjam',
          success: false,
        });
      } else {
        setSelectedBookId(matchedBook.id);
        setScanBorrowFeedback({
          text: `✓ Barcode Buku Terdeteksi via Kamera: [${matchedBook.barcode}] ${matchedBook.title}`,
          isSuccess: true,
        });
        setLastScannedCameraInfo({
          type: 'book',
          title: matchedBook.title,
          code: matchedBook.barcode,
          detail: `Tersedia: ${matchedBook.copiesAvailable} Eks • Rak: ${matchedBook.rackLocation}`,
          success: true,
        });
      }
      return;
    }

    setScanBorrowFeedback({
      text: `❌ Barcode / Kode "${query}" tidak ditemukan pada katalog buku maupun kartu anggota.`,
      isSuccess: false,
    });
    setLastScannedCameraInfo({
      type: 'unknown',
      title: 'Barcode Tidak Dikenali',
      code: query,
      detail: 'Pastikan barcode buku atau kartu anggota terdaftar di sistem.',
      success: false,
    });
  };

  // Handle scan in borrow tab (works with USB/Bluetooth barcode scanner & manual input)
  const handleScanInBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanBorrowQuery.trim();
    if (!query) return;

    // Check member
    const matchedMember = members.find(
      (m) =>
        m.memberCode.toLowerCase() === query.toLowerCase() ||
        m.idNumber.toLowerCase() === query.toLowerCase() ||
        m.name.toLowerCase() === query.toLowerCase()
    );

    // Check book
    const matchedBook = books.find(
      (b) =>
        b.barcode.toLowerCase() === query.toLowerCase() ||
        b.inventoryCode.toLowerCase() === query.toLowerCase()
    );

    if (matchedMember) {
      setSelectedMemberId(matchedMember.id);
      setCustomDays(matchedMember.type === 'Guru' ? settings.teacherLoanDurationDays : settings.studentLoanDurationDays);
      setScanBorrowFeedback({
        text: `✓ Kartu Anggota Terdeteksi: ${matchedMember.name} (${matchedMember.memberCode})`,
        isSuccess: true,
      });
      setScanBorrowQuery('');
      return;
    }

    if (matchedBook) {
      if (matchedBook.copiesAvailable <= 0) {
        setScanBorrowFeedback({
          text: `⚠️ Buku "${matchedBook.title}" (${matchedBook.barcode}) stok sedang dipinjam seluruhnya.`,
          isSuccess: false,
        });
      } else {
        setSelectedBookId(matchedBook.id);
        setScanBorrowFeedback({
          text: `✓ Barcode Buku Terdeteksi: [${matchedBook.barcode}] ${matchedBook.title}`,
          isSuccess: true,
        });
      }
      setScanBorrowQuery('');
      return;
    }

    setScanBorrowFeedback({
      text: `❌ Barcode / Kode "${query}" tidak ditemukan pada data buku maupun kartu anggota.`,
      isSuccess: false,
    });
    setScanBorrowQuery('');
  };

  // Handle instant barcode scan in return tab
  const handleQuickReturnScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickReturnBarcode.trim().toLowerCase();
    if (!query) return;

    const matchedLoan = activeLoans.find(
      (l) =>
        l.bookBarcode.toLowerCase() === query ||
        l.bookInventoryCode.toLowerCase() === query ||
        l.loanCode.toLowerCase() === query ||
        l.memberIdNumber.toLowerCase() === query
    );

    if (matchedLoan) {
      handleReturnAction(matchedLoan.id, true);
      setQuickReturnFeedback({
        text: `✓ Buku "${matchedLoan.bookTitle}" (Peminjam: ${matchedLoan.memberName}) berhasil dikembalikan!`,
        isSuccess: true,
      });
      setQuickReturnBarcode('');
    } else {
      setQuickReturnFeedback({
        text: `❌ Tidak ditemukan pinjaman aktif untuk barcode/kode "${query}".`,
        isSuccess: false,
      });
      setQuickReturnBarcode('');
    }
  };

  // Settings State
  const [tempSettings, setTempSettings] = useState(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Handle Book Loan Submit
  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId || !selectedMemberId) {
      setFormFeedback({ success: false, message: 'Harap pilih buku dan anggota perpustakaan terlebih dahulu.' });
      return;
    }

    const res = borrowBook({
      bookId: selectedBookId,
      memberId: selectedMemberId,
      customDurationDays: customDays,
      notes: loanNotes,
      staffName,
    });

    setFormFeedback(res);
    if (res.success && res.loan) {
      setSelectedLoanForReceipt(res.loan);
      setSelectedBookId('');
      setSelectedMemberId('');
      setLoanNotes('');
    }
  };


  // WhatsApp reminder message generator
  const sendWhatsAppReminder = (loan: Loan) => {
    const member = members.find((m) => m.id === loan.memberId);
    const phone = member?.phone?.replace(/[^0-9]/g, '') || '';
    const cleanPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;

    const message = encodeURIComponent(
      `Halo ${loan.memberName} (${loan.memberClassOrSubject}),\n\n` +
      `Pemberitahuan dari *${SCHOOL_INFO.libraryName} ${SCHOOL_INFO.name}*:\n` +
      `Buku yang Anda pinjam:\n` +
      `📚 *${loan.bookTitle}*\n` +
      `📅 Tanggal Pinjam: ${loan.loanDate}\n` +
      `⏰ Jatuh Tempo: ${loan.dueDate}\n` +
      (loan.daysLate > 0
        ? `⚠️ Telah TERLAMBAT selama *${loan.daysLate} hari* (Estimasi denda: Rp ${loan.fineAmount.toLocaleString('id-ID')}).\n`
        : `Batas waktu pengembalian adalah hari ini.\n`) +
      `\nMohon segera mengembalikan buku tersebut ke perpustakaan. Terima kasih! 🙏`
    );

    if (cleanPhone) {
      window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    } else {
      alert(`Nomor kontak WhatsApp untuk ${loan.memberName} belum terdaftar.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Sub Navigation */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <ArrowDownLeft size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Sistem Peminjaman & Pengembalian (Sirkulasi Otomatis)
                </h2>
                <p className="text-xs text-slate-500">
                  Pencatatan waktu real-time, jatuh tempo dinamis, pengingat WA, dan perhitungan denda otomatis
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => exportLoansToExcel(loans)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download size={14} />
            <span>Ekspor Riwayat Excel</span>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => { setActiveSubTab('pinjam'); setFormFeedback(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'pinjam'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowDownLeft size={15} />
            <span>+ Catat Peminjaman Baru</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('kembali'); setFormFeedback(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'kembali'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowUpRight size={15} />
            <span>Pengembalian Buku ({activeLoans.length})</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('terlambat'); setFormFeedback(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'terlambat'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle size={15} />
            <span>Pengingat Keterlambatan ({overdueLoans.length})</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('riwayat'); setFormFeedback(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'riwayat'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock size={15} />
            <span>Riwayat Selesai ({historyLoans.length})</span>
          </button>

          <button
            onClick={() => { setActiveSubTab('pengaturan'); setFormFeedback(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeSubTab === 'pengaturan'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Settings size={15} />
            <span>Atur Waktu & Denda</span>
          </button>
        </div>
      </div>

      {/* Global Form Notification */}
      {formFeedback && (
        <div
          className={`p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs no-print ${
            formFeedback.success
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border border-rose-300 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {formFeedback.success ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{formFeedback.message}</span>
          </div>
          <button
            onClick={() => setFormFeedback(null)}
            className="text-slate-500 hover:text-slate-800"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUB-TAB 1: FORM PEMINJAMAN BARU */}
      {activeSubTab === 'pinjam' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
          {/* Main Borrow Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <ArrowDownLeft className="text-emerald-700" size={18} />
              <span>Formulir Peminjaman Koleksi Perpustakaan</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pilih anggota dan buku yang akan dipinjam. Waktu pinjam dan batas kembali terhitung secara otomatis.
            </p>

            {/* Quick Barcode Scanner Box for Borrow */}
            <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-3.5 mb-5 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-600 text-white">
                    <ScanBarcode size={16} />
                  </span>
                  <div>
                    <h4 className="font-bold text-xs text-emerald-950">
                      Scan Cepat Barcode (Kamera Perangkat / Scanner Gun USB)
                    </h4>
                    <p className="text-[10px] text-emerald-700">
                      Pindai stiker buku atau kartu anggota, data langsung terisi otomatis
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCameraScanContext('borrow');
                      setLastScannedCameraInfo(null);
                      setIsCameraModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Camera size={14} className="text-amber-300" />
                    <span>Pindai via Kamera (Live)</span>
                  </button>
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 hidden sm:inline-block">
                    Kamera / USB Ready
                  </span>
                </div>
              </div>

              <form onSubmit={handleScanInBorrow} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={scanBorrowQuery}
                    onChange={(e) => setScanBorrowQuery(e.target.value)}
                    placeholder="Scan / ketik barcode buku (mis: SMPN2PML-BK-0001) atau kartu anggota (mis: M-SIS-001)..."
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <ScanBarcode size={14} />
                  <span>Scan / Enter</span>
                </button>
              </form>

              {scanBorrowFeedback && (
                <div
                  className={`mt-2 p-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                    scanBorrowFeedback.isSuccess
                      ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border border-rose-300'
                  }`}
                >
                  <span>{scanBorrowFeedback.text}</span>
                  <button
                    type="button"
                    onClick={() => setScanBorrowFeedback(null)}
                    className="text-slate-500 hover:text-slate-800 ml-2"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleBorrowSubmit} className="space-y-4 text-xs">
              {/* Member Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">
                    Pilih Anggota Peminjam (Siswa / Guru) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraScanContext('borrow');
                      setLastScannedCameraInfo(null);
                      setIsCameraModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Camera size={12} />
                    <span>Scan Kartu via Kamera</span>
                  </button>
                </div>
                <select
                  required
                  value={selectedMemberId}
                  onChange={(e) => {
                    setSelectedMemberId(e.target.value);
                    const mem = members.find((m) => m.id === e.target.value);
                    if (mem) {
                      setCustomDays(mem.type === 'Guru' ? settings.teacherLoanDurationDays : settings.studentLoanDurationDays);
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Pilih Anggota Peminjam --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.memberCode} | {m.name} ({m.type} - {m.classOrSubject}) [Pinjam Aktif: {m.activeLoansCount}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Book Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">
                    Pilih Buku yang Dipinjam <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraScanContext('borrow');
                      setLastScannedCameraInfo(null);
                      setIsCameraModalOpen(true);
                    }}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Camera size={12} />
                    <span>Scan Buku via Kamera</span>
                  </button>
                </div>
                <select
                  required
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="">-- Pilih Buku yang Tersedia --</option>
                  {books
                    .filter((b) => b.copiesAvailable > 0 && b.condition !== 'Rusak Berat' && b.condition !== 'Hilang')
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        [{b.barcode}] {b.title} • (Tersedia: {b.copiesAvailable} Eks, DDC {b.ddcCode}, {b.rackLocation})
                      </option>
                    ))}
                </select>
              </div>

              {/* Pair Confirmation Indicator if both selected */}
              {selectedMemberId && selectedBookId && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                    <span className="text-emerald-950 font-medium text-xs">
                      <strong>Peminjam:</strong> {members.find((m) => m.id === selectedMemberId)?.name} •{' '}
                      <strong>Buku:</strong> {books.find((b) => b.id === selectedBookId)?.title}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 shrink-0 self-start sm:self-auto">
                    ✓ Siap Diproses
                  </span>
                </div>
              )}

              {/* Adjustable Loan Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Atur Durasi Pinjam (Hari)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={customDays}
                    onChange={(e) => setCustomDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Standar Siswa: {settings.studentLoanDurationDays} hari | Guru: {settings.teacherLoanDurationDays} hari
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Petugas Sirkulasi
                  </label>
                  <input
                    type="text"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Catatan Keperluan Pinjam</label>
                <input
                  type="text"
                  value={loanNotes}
                  onChange={(e) => setLoanNotes(e.target.value)}
                  placeholder="Misal: Tugas proyek bab 4, belajar mandiri OSN, dll."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer text-xs"
                >
                  <ArrowDownLeft size={16} />
                  <span>Proses Peminjaman Buku</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Info & Policy Side Card */}
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Clock className="text-emerald-700" size={16} />
                <span>Ketentuan Sirkulasi Aktif</span>
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Waktu Pinjam Siswa:</span>
                  <strong className="text-slate-900">{settings.studentLoanDurationDays} Hari</strong>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Waktu Pinjam Guru:</span>
                  <strong className="text-slate-900">{settings.teacherLoanDurationDays} Hari</strong>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Batas Maksimal Buku Siswa:</span>
                  <strong className="text-slate-900">{settings.maxBooksStudent} Buku</strong>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Batas Maksimal Buku Guru:</span>
                  <strong className="text-slate-900">{settings.maxBooksTeacher} Buku</strong>
                </li>
                <li className="flex justify-between border-b border-slate-200 pb-1">
                  <span>Denda Keterlambatan:</span>
                  <strong className="text-rose-700 font-bold">
                    {settings.enableFines ? `Rp ${settings.finePerDay.toLocaleString('id-ID')} / hari` : 'Dinonaktifkan'}
                  </strong>
                </li>
              </ul>
              <p className="text-[10px] text-slate-500 italic pt-1">
                *) Durasi peminjaman dapat diatur secara manual per transaksi jika ada izin khusus dari Kepala Perpustakaan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DAFTAR PENGEMBALIAN BUKU (ACTIVE LOANS) */}
      {activeSubTab === 'kembali' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Daftar Buku Sedang Dipinjam ({activeLoans.length})
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol "Kembalikan" untuk mencatat pengembalian dan menghitung denda otomatis
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Cari peminjam, judul, barcode..."
                value={returnSearch}
                onChange={(e) => setReturnSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>
          </div>

          {/* Quick Barcode Return Scan Banner */}
          <div className="p-3.5 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-200 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <span className="p-2 bg-blue-700 text-white rounded-lg shrink-0">
                <ScanBarcode size={18} />
              </span>
              <div>
                <h4 className="font-bold text-xs text-blue-950">
                  Scan Barcode Buku untuk Kembalikan Seketika
                </h4>
                <p className="text-[10px] text-blue-700">
                  Tembakkan scanner ke barcode buku yang dikembalikan siswa/guru untuk proses pengembalian otomatis 1 langkah
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
              <form onSubmit={handleQuickReturnScan} className="flex gap-2 flex-1 md:w-80">
                <input
                  type="text"
                  value={quickReturnBarcode}
                  onChange={(e) => setQuickReturnBarcode(e.target.value)}
                  placeholder="Tembak barcode buku di sini..."
                  className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  <ScanBarcode size={14} />
                  <span>Kembalikan</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setCameraScanContext('return');
                  setLastScannedCameraInfo(null);
                  setIsCameraModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Pindai barcode buku via kamera untuk pengembalian instan"
              >
                <Camera size={14} className="text-amber-300" />
                <span>Scan Kamera</span>
              </button>
            </div>
          </div>

          {quickReturnFeedback && (
            <div
              className={`p-3 text-xs font-medium border-b flex items-center justify-between ${
                quickReturnFeedback.isSuccess
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              <span>{quickReturnFeedback.text}</span>
              <button
                type="button"
                onClick={() => setQuickReturnFeedback(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Kode Pinjam</th>
                  <th className="py-3 px-3">Peminjam</th>
                  <th className="py-3 px-3">Buku & Barcode</th>
                  <th className="py-3 px-3">Waktu Pinjam</th>
                  <th className="py-3 px-3">Batas Kembali</th>
                  <th className="py-3 px-3 text-center">Status / Keterlambatan</th>
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeLoans
                  .filter((l) =>
                    l.memberName.toLowerCase().includes(returnSearch.toLowerCase()) ||
                    l.bookTitle.toLowerCase().includes(returnSearch.toLowerCase()) ||
                    l.bookBarcode.toLowerCase().includes(returnSearch.toLowerCase()) ||
                    l.loanCode.toLowerCase().includes(returnSearch.toLowerCase())
                  )
                  .map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {loan.loanCode}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{loan.memberName}</div>
                        <div className="text-[11px] text-slate-500">
                          {loan.memberType} • {loan.memberClassOrSubject} ({loan.memberIdNumber})
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-slate-900 truncate" title={loan.bookTitle}>
                          {loan.bookTitle}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">
                          {loan.bookBarcode} | {loan.bookInventoryCode}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{loan.loanDate}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Pukul {loan.loanTime} WIB</div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{loan.dueDate}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {loan.daysLate > 0 ? (
                          <div className="inline-block">
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-300">
                              Terlambat {loan.daysLate} Hari
                            </span>
                            {settings.enableFines && (
                              <div className="text-[10px] text-rose-700 font-bold mt-0.5">
                                Denda: Rp {loan.fineAmount.toLocaleString('id-ID')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            Tepat Waktu
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLoanForReceipt(loan)}
                            title="Cetak Bukti Peminjaman"
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handleReturnAction(loan.id, true)}
                            className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowUpRight size={13} />
                            <span>Kembalikan</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PENGINGAT KETERLAMBATAN & WHATSAPP */}
      {activeSubTab === 'terlambat' && (
        <div className="space-y-4 no-print">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-rose-200 text-rose-900">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h4 className="font-bold text-rose-950 text-sm">
                  Daftar Peminjaman Melewati Batas Waktu ({overdueLoans.length} Buku)
                </h4>
                <p className="text-xs text-rose-800">
                  Gunakan tombol WhatsApp di bawah untuk mengirim pesan peringatan otomatis kepada siswa atau wali kelas.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Peminjam</th>
                    <th className="py-3 px-3">Judul Buku</th>
                    <th className="py-3 px-3">Jatuh Tempo</th>
                    <th className="py-3 px-3 text-center">Terlambat</th>
                    <th className="py-3 px-3 text-center">Denda Berjalan</th>
                    <th className="py-3 px-3 text-right">Aksi Pengingat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {overdueLoans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Alhamdulillah, tidak ada peminjaman buku yang terlambat saat ini.
                      </td>
                    </tr>
                  ) : (
                    overdueLoans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-rose-50/40">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{loan.memberName}</div>
                          <div className="text-[11px] text-slate-500">
                            {loan.memberClassOrSubject} • No. ID: {loan.memberIdNumber}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {loan.bookTitle}
                        </td>
                        <td className="py-3 px-3 font-mono text-rose-900 font-bold">
                          {loan.dueDate}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 font-bold text-xs">
                            {loan.daysLate} Hari
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-700">
                          Rp {loan.fineAmount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => sendWhatsAppReminder(loan)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <MessageSquare size={13} />
                              <span>Kirim WA</span>
                            </button>
                            <button
                              onClick={() => handleReturnAction(loan.id, true)}
                              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs cursor-pointer shadow-xs"
                            >
                              Kembalikan
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

      {/* SUB-TAB 4: RIWAYAT SIRKULASI SELESAI */}
      {activeSubTab === 'riwayat' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">
              Riwayat Pengembalian Koleksi ({historyLoans.length} Transaksi Selesai)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Kode Transaksi</th>
                  <th className="py-3 px-3">Peminjam</th>
                  <th className="py-3 px-3">Judul Buku</th>
                  <th className="py-3 px-3">Tgl Pinjam & Kembali</th>
                  <th className="py-3 px-3 text-center">Status Denda</th>
                  <th className="py-3 px-3">Petugas</th>
                  <th className="py-3 px-3 text-right">Struk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {historyLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {loan.loanCode}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{loan.memberName}</div>
                      <div className="text-[11px] text-slate-500">{loan.memberClassOrSubject}</div>
                    </td>
                    <td className="py-3 px-3 max-w-xs font-medium text-slate-800 truncate" title={loan.bookTitle}>
                      {loan.bookTitle}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-slate-600">Pinjam: {loan.loanDate} ({loan.loanTime})</div>
                      <div className="text-emerald-800 font-bold">Kembali: {loan.returnDate} ({loan.returnTime})</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {loan.fineAmount > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                          Rp {loan.fineAmount.toLocaleString('id-ID')} ({loan.isFinePaid ? 'Lunas' : 'Belum Lunas'})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Bebas Denda
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      <div>Lent: {loan.lentByStaff}</div>
                      {loan.returnedByStaff && <div>Rcvd: {loan.returnedByStaff}</div>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedLoanForReceipt(loan)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded"
                        title="Lihat Struk Transaksi"
                      >
                        <Printer size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: PENGATURAN WAKTU & DENDA */}
      {activeSubTab === 'pengaturan' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs max-w-2xl no-print">
          <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
            <Settings className="text-amber-600" size={18} />
            <span>Pengaturan Batas Waktu Peminjaman & Kebijakan Denda</span>
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Konfigurasi aturan otomatis sirkulasi Perpustakaan MEKAR SMPN 2 Pemalang
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateSettings(tempSettings);
              setSettingsSaved(true);
              setTimeout(() => setSettingsSaved(false), 4000);
            }}
            className="space-y-4 text-xs"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Batas Waktu Pinjam Siswa (Hari)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={tempSettings.studentLoanDurationDays}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, studentLoanDurationDays: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Batas Waktu Pinjam Guru (Hari)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.teacherLoanDurationDays}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, teacherLoanDurationDays: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Maksimal Buku Siswa (Eksemplar)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={tempSettings.maxBooksStudent}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, maxBooksStudent: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Maksimal Buku Guru (Eksemplar)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={tempSettings.maxBooksTeacher}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, maxBooksTeacher: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 block">Aktifkan Denda Keterlambatan</label>
                  <p className="text-[11px] text-slate-500">
                    Jika diaktifkan, denda per hari akan dihitung otomatis saat pengembalian telat
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={tempSettings.enableFines}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, enableFines: e.target.checked })
                  }
                  className="w-5 h-5 accent-emerald-600 rounded"
                />
              </div>

              {tempSettings.enableFines && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tarif Denda per Hari (Rupiah)
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={tempSettings.finePerDay}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, finePerDay: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-rose-700"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tarif denda standar: Rp 1.000 / hari keterlambatan per buku
                  </p>
                </div>
              )}
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Pengaturan berhasil disimpan dan langsung diterapkan ke seluruh sistem!</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm cursor-pointer"
              >
                Simpan Perubahan Pengaturan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CETAK STRUK / BUKTI TRANSAKSI (Print PDF Ready) */}
      {selectedLoanForReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-300 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
              <span className="font-bold text-xs flex items-center gap-1.5">
                <FileText size={15} className="text-amber-400" />
                <span>Bukti Transaksi Perpustakaan</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setSelectedLoanForReceipt(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Container */}
            <div className="p-6 text-xs text-slate-800 space-y-4 print-container">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <div className="w-12 h-12 mx-auto mb-1 flex items-center justify-center">
                  <img
                    src={SCHOOL_INFO.logoUrl}
                    alt="Logo SMP Negeri 2 Pemalang"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3 className="font-black text-sm uppercase text-slate-900">
                  {SCHOOL_INFO.libraryName}
                </h3>
                <h4 className="font-bold text-xs text-slate-700">{SCHOOL_INFO.name}</h4>
                <p className="text-[10px] text-slate-500">{SCHOOL_INFO.address}</p>
                <p className="text-[10px] text-slate-500 font-mono">NPSN: {SCHOOL_INFO.npsn}</p>
              </div>

              <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-900 py-1 bg-slate-100 rounded">
                {selectedLoanForReceipt.status === 'Kembali' ? 'BUKTI PENGEMBALIAN BUKU' : 'BUKTI PEMINJAMAN BUKU'}
              </div>

              <div className="space-y-1.5 font-mono text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Transaksi:</span>
                  <span className="font-bold">{selectedLoanForReceipt.loanCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peminjam:</span>
                  <span className="font-bold">{selectedLoanForReceipt.memberName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ID / Kelas:</span>
                  <span>{selectedLoanForReceipt.memberIdNumber} ({selectedLoanForReceipt.memberClassOrSubject})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Pinjam:</span>
                  <span>{selectedLoanForReceipt.loanDate} {selectedLoanForReceipt.loanTime}</span>
                </div>
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>Jatuh Tempo:</span>
                  <span>{selectedLoanForReceipt.dueDate}</span>
                </div>
                {selectedLoanForReceipt.returnDate && (
                  <div className="flex justify-between text-blue-800 font-bold">
                    <span>Tgl Kembali:</span>
                    <span>{selectedLoanForReceipt.returnDate} {selectedLoanForReceipt.returnTime}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-slate-500 text-[10px]">Judul Buku:</div>
                <div className="font-bold text-slate-900">{selectedLoanForReceipt.bookTitle}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  Barcode: {selectedLoanForReceipt.bookBarcode} | Inv: {selectedLoanForReceipt.bookInventoryCode}
                </div>
              </div>

              {selectedLoanForReceipt.fineAmount > 0 && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-900 font-bold text-xs flex justify-between">
                  <span>Denda ({selectedLoanForReceipt.daysLate} Hari):</span>
                  <span>Rp {selectedLoanForReceipt.fineAmount.toLocaleString('id-ID')} ({selectedLoanForReceipt.isFinePaid ? 'LUNAS' : 'BELUM DIBAYAR'})</span>
                </div>
              )}

              <div className="pt-2 text-center text-[10px] text-slate-500 border-t border-dashed border-slate-300">
                <p>Simpan lembar bukti ini sebagai tanda transaksi resmi.</p>
                <p className="mt-1 font-semibold text-slate-700">Petugas: {selectedLoanForReceipt.lentByStaff}</p>
                <p className="text-[9px] text-slate-400 mt-2">Terima kasih atas kunjungan Anda di Perpustakaan MEKAR</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMINDAI BARCODE KAMERA PERANGKAT (WEBCAM / HP) */}
      <CameraBarcodeScannerModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onScanSuccess={handleCameraBarcodeScanned}
        title={
          cameraScanContext === 'return'
            ? 'Kamera Pengembalian Buku Otomatis'
            : 'Kamera Barcode Sirkulasi & Peminjaman'
        }
        subtitle={
          cameraScanContext === 'return'
            ? 'Arahkan kamera ke barcode buku untuk mengembalikan buku dan menghitung denda seketika'
            : 'Arahkan kamera ke barcode buku atau kartu anggota untuk memilih otomatis'
        }
        lastScannedInfo={lastScannedCameraInfo}
      />
    </div>
  );
};
