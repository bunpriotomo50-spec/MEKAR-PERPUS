import React, { useState, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { BOOK_CATEGORIES, SCHOOL_INFO } from '../../types/library';
import { OfficialKopSurat } from '../OfficialKopSurat';
import { exportBooksToExcel, exportLoansToExcel } from '../../utils/excelHelper';
import { exportElementToPdf, triggerPrintWithIframe } from '../../utils/pdfGenerator';
import {
  FileText,
  Printer,
  Download,
  BookOpen,
  AlertTriangle,
  RotateCcw,
  Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  ClipboardCheck,
  Barcode,
  Search,
  Check,
  RefreshCw,
  FileDown,
  Loader2,
  X,
} from 'lucide-react';

export const InventoryReportingModule: React.FC = () => {
  const { books, loans, members, visitors, budgetLogs, schoolInfo } = useLibrary();

  // Active Report Sub-type: 'koleksi' | 'sirkulasi' | 'rusak_hilang' | 'pengunjung' | 'keuangan' | 'stock_opname'
  const [reportType, setReportType] = useState<
    'koleksi' | 'sirkulasi' | 'rusak_hilang' | 'pengunjung' | 'keuangan' | 'stock_opname'
  >('koleksi');

  // PDF Export ref & states
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressMessage, setPdfProgressMessage] = useState<string | null>(null);
  const [pdfFeedback, setPdfFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const getReportFilename = () => {
    const map: Record<string, string> = {
      koleksi: 'Laporan_Statistik_Koleksi_Buku_SMPN2_Pemalang.pdf',
      sirkulasi: 'Laporan_Sirkulasi_Peminjaman_SMPN2_Pemalang.pdf',
      rusak_hilang: 'Laporan_Buku_Rusak_Hilang_SMPN2_Pemalang.pdf',
      pengunjung: 'Laporan_Rekapitulasi_Pengunjung_SMPN2_Pemalang.pdf',
      keuangan: 'Laporan_Keuangan_Denda_SMPN2_Pemalang.pdf',
      stock_opname: 'Berita_Acara_Stock_Opname_SMPN2_Pemalang.pdf',
    };
    return map[reportType] || 'Laporan_Resmi_Perpustakaan_SMPN2_Pemalang.pdf';
  };

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPdf(true);
    setPdfFeedback(null);
    setPdfProgressMessage('Menyiapkan tata letak dokumen...');

    try {
      await exportElementToPdf(reportContainerRef.current, {
        filename: getReportFilename(),
        onProgress: (stage) => setPdfProgressMessage(stage),
      });

      setPdfFeedback({
        isError: false,
        message: 'Berkas PDF resmi berhasil diunduh ke komputer/perangkat Anda!',
      });
      setTimeout(() => {
        setIsExportingPdf(false);
        setPdfProgressMessage(null);
      }, 1200);
      setTimeout(() => setPdfFeedback(null), 5000);
    } catch (err) {
      console.error(err);
      setIsExportingPdf(false);
      setPdfProgressMessage(null);
      setPdfFeedback({
        isError: true,
        message: 'Pengunduhan otomatis terhambat peramban. Mengaktifkan jendela cetak sistem...',
      });
      handleDirectPrint();
    }
  };

  const handleDirectPrint = () => {
    if (reportContainerRef.current) {
      triggerPrintWithIframe(reportContainerRef.current, `Laporan Perpustakaan SMPN 2 Pemalang - ${reportType}`);
    } else {
      window.print();
    }
  };

  // Stock Opname interactive verification state (persists during session)
  const [scannedCodes, setScannedCodes] = useState<string[]>(() => {
    // Default: mark top books as scanned for demo
    return books.slice(0, 3).map((b) => b.inventoryCode);
  });
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const handleScanBook = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scanInput.trim().toUpperCase();
    if (!query) return;

    const matchedBook = books.find(
      (b) =>
        b.inventoryCode.toUpperCase() === query ||
        b.barcode.toUpperCase() === query ||
        b.title.toUpperCase().includes(query)
    );

    if (matchedBook) {
      if (scannedCodes.includes(matchedBook.inventoryCode)) {
        setScanMessage({ text: `Buku "${matchedBook.title}" sudah diverifikasi sebelumnya di rak.`, isError: false });
      } else {
        setScannedCodes((prev) => [...prev, matchedBook.inventoryCode]);
        setScanMessage({ text: `Berhasil mencocokkan fisik: [${matchedBook.inventoryCode}] ${matchedBook.title}`, isError: false });
      }
    } else {
      setScanMessage({ text: `Buku dengan kode/barcode/judul "${query}" tidak ditemukan di database.`, isError: true });
    }
    setScanInput('');
  };

  const markAllAsVerified = () => {
    setScannedCodes(books.map((b) => b.inventoryCode));
    setScanMessage({ text: 'Semua koleksi ditandai telah diverifikasi cocok di rak.', isError: false });
  };

  const resetStockOpname = () => {
    setScannedCodes([]);
    setScanMessage({ text: 'Pencacahan Stock Opname direset ke 0.', isError: false });
  };

  // Calculations
  const totalTitles = books.length;
  const totalCopies = books.reduce((acc, b) => acc + b.copiesTotal, 0);
  const totalAvailable = books.reduce((acc, b) => acc + b.copiesAvailable, 0);
  const damagedBooks = books.filter((b) => b.condition === 'Rusak Ringan' || b.condition === 'Rusak Berat');
  const lostBooks = books.filter((b) => b.condition === 'Hilang');
  const damagedOrLostValue = [...damagedBooks, ...lostBooks].reduce((acc, b) => acc + (b.priceEstimated || 0), 0);

  const activeLoans = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const overdueLoans = loans.filter((l) => l.status === 'Terlambat');
  const returnedLoans = loans.filter((l) => l.status === 'Kembali');
  const totalFinesCollected = loans.reduce((acc, l) => (l.isFinePaid ? acc + l.fineAmount : acc), 0);
  const totalFinesPending = loans.reduce((acc, l) => (!l.isFinePaid && l.fineAmount > 0 ? acc + l.fineAmount : acc), 0);

  const totalVisitorsCount = visitors.length;

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Header & Report Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <FileText size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Sistem Inventaris dan Pelaporan Resmi
                </h2>
                <p className="text-xs text-slate-500">
                  Laporan rekapitulasi berkala perpustakaan lengkap dengan Kop Surat resmi SMPN 2 Pemalang
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (reportType === 'koleksi') exportBooksToExcel(books);
                else exportLoansToExcel(loans);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Ekspor data laporan ke lembar kerja Excel (.xlsx)"
            >
              <Download size={14} />
              <span>Ekspor ke Excel</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-rose-700 hover:bg-rose-800 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              title="Unduh langsung berkas file PDF (.pdf) resmi ber-Kop Surat"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>{pdfProgressMessage || 'Memproses PDF...'}</span>
                </>
              ) : (
                <>
                  <FileDown size={15} />
                  <span>Unduh File PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
              title="Kirim ke mesin printer fisik atau dialog cetak browser"
            >
              <Printer size={15} />
              <span>Cetak Printer</span>
            </button>
          </div>
        </div>

        {/* Report Sub-Tabs */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setReportType('koleksi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              reportType === 'koleksi'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Laporan Jumlah Koleksi Buku
          </button>

          <button
            onClick={() => setReportType('sirkulasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              reportType === 'sirkulasi'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Laporan Peminjaman & Pengembalian
          </button>

          <button
            onClick={() => setReportType('rusak_hilang')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              reportType === 'rusak_hilang'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Laporan Buku Rusak & Hilang
          </button>

          <button
            onClick={() => setReportType('pengunjung')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              reportType === 'pengunjung'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Rekapitulasi Pengunjung
          </button>

          <button
            onClick={() => setReportType('keuangan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              reportType === 'keuangan'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Laporan Keuangan & Denda
          </button>

          <button
            onClick={() => setReportType('stock_opname')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              reportType === 'stock_opname'
                ? 'bg-indigo-900 text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100 font-extrabold'
            }`}
          >
            <ClipboardCheck size={14} />
            <span>Stock Opname & Berita Acara</span>
          </button>
        </div>
      </div>

      {/* PDF Export Feedback Alert */}
      {pdfFeedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between no-print shadow-xs ${
            pdfFeedback.isError
              ? 'bg-rose-50 border border-rose-300 text-rose-900'
              : 'bg-emerald-50 border border-emerald-300 text-emerald-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {pdfFeedback.isError ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span>{pdfFeedback.message}</span>
          </div>
          <button
            onClick={() => setPdfFeedback(null)}
            className="text-slate-400 hover:text-slate-700 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* PRINTABLE OFFICIAL REPORT CANVAS */}
      <div ref={reportContainerRef} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm print-container">
        {/* Official Kop Surat */}
        <OfficialKopSurat
          documentTitle={
            reportType === 'koleksi'
              ? 'LAPORAN STATISTIK DAN KEADAAN KOLEKSI BUKU'
              : reportType === 'sirkulasi'
              ? 'LAPORAN SIRKULASI PEMINJAMAN DAN PENGEMBALIAN'
              : reportType === 'rusak_hilang'
              ? 'LAPORAN REKAPITULASI BUKU RUSAK DAN HILANG'
              : reportType === 'pengunjung'
              ? 'LAPORAN REKAPITULASI PENGUNJUNG PERPUSTAKAAN'
              : reportType === 'keuangan'
              ? 'LAPORAN KAS, ANGGARAN & PENGELOLAAN DENDA'
              : 'BERITA ACARA HASIL STOCK OPNAME KOLEKSI BUKU'
          }
          documentNumber={`421.3 / ${reportType === 'stock_opname' ? 'BA-STOCK-OPNAME' : reportType.toUpperCase()} / PERPUS-MEKAR / 2026`}
          documentSubtitle={`Periode: Tahun Pelajaran 2026/2027 • Tanggal Pelaksanaan: ${today}`}
        />

        {/* 1. REPORT KOLEKSI */}
        {reportType === 'koleksi' && (
          <div className="space-y-6 text-xs text-slate-800">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Judul Buku:</span>
                <strong className="text-base font-black text-slate-900">{totalTitles} Judul</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Total Eksemplar:</span>
                <strong className="text-base font-black text-slate-900">{totalCopies} Eks</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Buku Tersedia:</span>
                <strong className="text-base font-black text-emerald-800">{totalAvailable} Eks</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Buku Dipinjam:</span>
                <strong className="text-base font-black text-blue-800">{activeLoans.length} Eks</strong>
              </div>
            </div>

            {/* Breakdown by Category */}
            <div>
              <h4 className="font-bold text-sm text-slate-900 mb-2 border-b border-slate-200 pb-1">
                A. Rincian Koleksi Menurut Kategori Klasifikasi DDC & Sekolah
              </h4>
              <table className="w-full text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">No</th>
                    <th className="p-2 border-r border-slate-300">Kategori Koleksi</th>
                    <th className="p-2 border-r border-slate-300 text-center">Jumlah Judul</th>
                    <th className="p-2 border-r border-slate-300 text-center">Total Eksemplar</th>
                    <th className="p-2 text-center">Tersedia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {BOOK_CATEGORIES.map((cat, idx) => {
                    const catBooks = books.filter((b) => b.category === cat);
                    const titlesCount = catBooks.length;
                    const copiesCount = catBooks.reduce((acc, b) => acc + b.copiesTotal, 0);
                    const availCount = catBooks.reduce((acc, b) => acc + b.copiesAvailable, 0);

                    return (
                      <tr key={cat} className="hover:bg-slate-50">
                        <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-semibold">{cat}</td>
                        <td className="p-2 border-r border-slate-300 text-center">{titlesCount}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">{copiesCount}</td>
                        <td className="p-2 text-center font-bold text-emerald-800">{availCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black border-t-2 border-slate-400">
                  <tr>
                    <td colSpan={2} className="p-2 text-center border-r border-slate-300">
                      TOTAL KOLEKSI
                    </td>
                    <td className="p-2 text-center border-r border-slate-300">{totalTitles}</td>
                    <td className="p-2 text-center border-r border-slate-300">{totalCopies}</td>
                    <td className="p-2 text-center text-emerald-900">{totalAvailable}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 2. REPORT SIRKULASI */}
        {reportType === 'sirkulasi' && (
          <div className="space-y-6 text-xs text-slate-800">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Transaksi:</span>
                <strong className="text-base font-black text-slate-900">{loans.length} Transaksi</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Sedang Dipinjam:</span>
                <strong className="text-base font-black text-blue-800">{activeLoans.length}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Terlambat:</span>
                <strong className="text-base font-black text-rose-800">{overdueLoans.length}</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">Sudah Dikembalikan:</span>
                <strong className="text-base font-black text-emerald-800">{returnedLoans.length}</strong>
              </div>
            </div>

            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Kode</th>
                  <th className="p-2 border-r border-slate-300">Peminjam</th>
                  <th className="p-2 border-r border-slate-300">Judul Buku</th>
                  <th className="p-2 border-r border-slate-300">Tgl Pinjam & Kembali</th>
                  <th className="p-2 border-r border-slate-300 text-center">Status</th>
                  <th className="p-2 text-right">Denda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loans.map((loan) => (
                  <tr key={loan.id}>
                    <td className="p-2 border-r border-slate-300 font-mono">{loan.loanCode}</td>
                    <td className="p-2 border-r border-slate-300">
                      <strong>{loan.memberName}</strong> ({loan.memberClassOrSubject})
                    </td>
                    <td className="p-2 border-r border-slate-300 font-medium">{loan.bookTitle}</td>
                    <td className="p-2 border-r border-slate-300">
                      <div>{loan.loanDate} s/d {loan.dueDate}</div>
                      {loan.returnDate && <div className="text-emerald-800">Kembali: {loan.returnDate}</div>}
                    </td>
                    <td className="p-2 border-r border-slate-300 text-center font-bold">
                      {loan.status}
                    </td>
                    <td className="p-2 text-right font-mono">
                      {loan.fineAmount > 0 ? `Rp ${loan.fineAmount.toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. REPORT BUKU RUSAK & HILANG */}
        {reportType === 'rusak_hilang' && (
          <div className="space-y-6 text-xs text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div>
                <span className="text-[11px] text-rose-800 block">Koleksi Rusak:</span>
                <strong className="text-base font-black text-rose-950">{damagedBooks.length} Judul Buku</strong>
              </div>
              <div>
                <span className="text-[11px] text-rose-800 block">Koleksi Hilang:</span>
                <strong className="text-base font-black text-rose-950">{lostBooks.length} Judul Buku</strong>
              </div>
              <div>
                <span className="text-[11px] text-rose-800 block">Estimasi Nilai Buku:</span>
                <strong className="text-base font-black text-rose-950">
                  Rp {damagedOrLostValue.toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">No. Inventaris</th>
                  <th className="p-2 border-r border-slate-300">Judul Buku</th>
                  <th className="p-2 border-r border-slate-300">Kondisi</th>
                  <th className="p-2 border-r border-slate-300 text-right">Nilai Taksiran</th>
                  <th className="p-2">Keterangan / Tindak Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {[...damagedBooks, ...lostBooks].map((book) => (
                  <tr key={book.id}>
                    <td className="p-2 border-r border-slate-300 font-mono">{book.inventoryCode}</td>
                    <td className="p-2 border-r border-slate-300 font-semibold">{book.title}</td>
                    <td className="p-2 border-r border-slate-300 font-bold text-rose-700">{book.condition}</td>
                    <td className="p-2 border-r border-slate-300 text-right font-mono">
                      Rp {book.priceEstimated.toLocaleString('id-ID')}
                    </td>
                    <td className="p-2 text-slate-600 italic">{book.notes || 'Dalam proses penggantian / usulan afkir'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. REPORT PENGUNJUNG */}
        {reportType === 'pengunjung' && (
          <div className="space-y-6 text-xs text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-purple-50 border border-purple-200 rounded-xl">
              <div>
                <span className="text-[11px] text-purple-800 block">Total Kunjungan:</span>
                <strong className="text-base font-black text-purple-950">{totalVisitorsCount} Orang</strong>
              </div>
              <div>
                <span className="text-[11px] text-purple-800 block">Kunjungan Siswa:</span>
                <strong className="text-base font-black text-purple-950">
                  {visitors.filter((v) => v.type === 'Siswa').length} Siswa
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-purple-800 block">Kunjungan Guru / Tamu:</span>
                <strong className="text-base font-black text-purple-950">
                  {visitors.filter((v) => v.type !== 'Siswa').length} Orang
                </strong>
              </div>
            </div>

            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Tanggal & Jam</th>
                  <th className="p-2 border-r border-slate-300">Nama Pengunjung</th>
                  <th className="p-2 border-r border-slate-300">Kelas / Departemen</th>
                  <th className="p-2 border-r border-slate-300">Keperluan</th>
                  <th className="p-2">Buku Dibaca di Tempat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {visitors.map((v) => (
                  <tr key={v.id}>
                    <td className="p-2 border-r border-slate-300 font-mono">{v.date} {v.time}</td>
                    <td className="p-2 border-r border-slate-300 font-semibold">{v.name}</td>
                    <td className="p-2 border-r border-slate-300">{v.classOrDept}</td>
                    <td className="p-2 border-r border-slate-300 font-medium">{v.purpose}</td>
                    <td className="p-2 italic">{v.bookReadOnSite || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. REPORT KEUANGAN & DENDA */}
        {reportType === 'keuangan' && (
          <div className="space-y-6 text-xs text-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div>
                <span className="text-[11px] text-emerald-800 block">Denda Lunas Terkumpul:</span>
                <strong className="text-base font-black text-emerald-950">
                  Rp {totalFinesCollected.toLocaleString('id-ID')}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-emerald-800 block">Denda Belum Disetor:</span>
                <strong className="text-base font-black text-rose-800">
                  Rp {totalFinesPending.toLocaleString('id-ID')}
                </strong>
              </div>
              <div>
                <span className="text-[11px] text-emerald-800 block">Total Dana Masuk BOS:</span>
                <strong className="text-base font-black text-slate-900">
                  Rp {budgetLogs.filter((b) => b.type === 'Pemasukan').reduce((acc, b) => acc + b.amount, 0).toLocaleString('id-ID')}
                </strong>
              </div>
            </div>

            <table className="w-full text-left border border-slate-300">
              <thead className="bg-slate-100 font-bold border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Tgl & No Kuitansi</th>
                  <th className="p-2 border-r border-slate-300">Tipe & Kategori</th>
                  <th className="p-2 border-r border-slate-300">Uraian Transaksi</th>
                  <th className="p-2 text-right">Nominal (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {budgetLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="p-2 border-r border-slate-300 font-mono">
                      <div>{log.date}</div>
                      <div className="text-[10px] text-slate-400">{log.receiptNumber}</div>
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold">
                      <span className={log.type === 'Pemasukan' ? 'text-emerald-700' : 'text-rose-700'}>
                        [{log.type}] {log.category}
                      </span>
                    </td>
                    <td className="p-2 border-r border-slate-300">{log.description}</td>
                    <td className="p-2 text-right font-mono font-bold">
                      Rp {log.amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. REPORT STOCK OPNAME (PENCACAHAN FISIK KOLEKSI BUKU) */}
        {reportType === 'stock_opname' && (
          <div className="space-y-6 text-xs text-slate-800">
            {/* Interactive Scanning Console (Hidden when printed) */}
            <div className="no-print p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-700 text-white rounded-lg">
                    <Barcode size={18} />
                  </span>
                  <div>
                    <h4 className="font-bold text-sm text-indigo-950">
                      Pemindaian Fisik Buku di Rak (Stock Opname Otomatis)
                    </h4>
                    <p className="text-[11px] text-indigo-800">
                      Gunakan barcode scanner atau masukkan nomor barcode/kode buku untuk mencocokkan fisik di rak
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={markAllAsVerified}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>Tandai Semua Cocok</span>
                  </button>
                  <button
                    onClick={resetStockOpname}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={14} />
                    <span>Reset Hitungan</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleScanBook} className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan Barcode buku atau ketik Kode/Judul buku lalu tekan Enter..."
                    className="w-full pl-9 pr-3 py-2 border border-indigo-300 rounded-xl bg-white text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-900 hover:bg-indigo-950 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Check size={15} />
                  <span>Verifikasi Fisik</span>
                </button>
              </form>

              {scanMessage && (
                <div
                  className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                    scanMessage.isError
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {scanMessage.isError ? <AlertTriangle size={15} /> : <CheckCircle size={15} />}
                  <span>{scanMessage.text}</span>
                </div>
              )}
            </div>

            {/* Official Rekapitulasi Metrik Stock Opname */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-slate-50 border border-slate-300 rounded-xl">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Koleksi Sistem:</span>
                <strong className="text-base font-black text-slate-900">{totalCopies} Eks</strong>
                <p className="text-[10px] text-slate-500">({totalTitles} Judul)</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Fisik Ada di Rak:</span>
                <strong className="text-base font-black text-emerald-800">
                  {books
                    .filter((b) => scannedCodes.includes(b.inventoryCode))
                    .reduce((acc, b) => acc + b.copiesAvailable, 0)}{' '}
                  Eks
                </strong>
                <p className="text-[10px] text-emerald-600">
                  ({scannedCodes.length} Judul Terverifikasi)
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Sedang Dipinjam Sah:</span>
                <strong className="text-base font-black text-blue-800">{activeLoans.length} Eks</strong>
                <p className="text-[10px] text-blue-600">(Tercatat di Sirkulasi)</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Selisih / Belum Cek:</span>
                <strong className="text-base font-black text-amber-800">
                  {Math.max(
                    0,
                    books
                      .filter((b) => !scannedCodes.includes(b.inventoryCode) && b.condition === 'Baik')
                      .reduce((acc, b) => acc + b.copiesAvailable, 0)
                  )}{' '}
                  Eks
                </strong>
                <p className="text-[10px] text-amber-600">
                  ({books.filter((b) => !scannedCodes.includes(b.inventoryCode) && b.condition === 'Baik').length} Judul)
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Rusak & Hilang:</span>
                <strong className="text-base font-black text-rose-800">
                  {damagedBooks.length + lostBooks.length} Judul
                </strong>
                <p className="text-[10px] text-rose-600">(Perlu Penyiangan)</p>
              </div>
            </div>

            {/* Berita Acara Formal Narrative */}
            <div className="p-4 border border-slate-300 rounded-xl bg-white space-y-2 text-justify leading-relaxed">
              <h4 className="font-bold text-center text-sm underline text-slate-900 mb-2">
                BERITA ACARA PELAKSANAAN STOCK OPNAME BUKU PERPUSTAKAAN
              </h4>
              <p>
                Pada hari ini, tanggal <strong>{today}</strong>, telah dilaksanakan kegiatan inventarisasi fisik
                (<strong>Stock Opname</strong>) terhadap seluruh koleksi buku dan bahan pustaka pada{' '}
                <strong>Perpustakaan MEKAR SMP Negeri 2 Pemalang</strong>.
              </p>
              <p>
                Berdasarkan hasil pencacahan fisik di rak buku, penelusuran transaksi sirkulasi aktif, dan verifikasi
                nomor inventaris/barcode diperoleh kesimpulan sebagai berikut:
              </p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>
                  Total koleksi bahan pustaka yang terdaftar pada pangkalan data sebanyak{' '}
                  <strong>{totalTitles} judul ({totalCopies} eksemplar)</strong>.
                </li>
                <li>
                  Buku fisik yang telah diverifikasi berada dalam kondisi baik dan tersusun rapi di rak perpustakaan
                  sebanyak{' '}
                  <strong>
                    {books.filter((b) => scannedCodes.includes(b.inventoryCode)).reduce((acc, b) => acc + b.copiesAvailable, 0)}{' '}
                    eksemplar
                  </strong>
                  .
                </li>
                <li>
                  Buku yang sedang berada dalam masa peminjaman sah oleh siswa/guru sebanyak{' '}
                  <strong>{activeLoans.length} eksemplar</strong>.
                </li>
                <li>
                  Buku yang mengalami kondisi rusak atau tidak layak pakai terdata sebanyak{' '}
                  <strong>{damagedBooks.length} judul</strong> dan direkomendasikan untuk proses perbaikan/penjilidan atau
                  penyiangan (<em>weeding</em>).
                </li>
                <li>
                  Buku yang belum terverifikasi / berstatus selisih sebanyak{' '}
                  <strong>
                    {books.filter((b) => !scannedCodes.includes(b.inventoryCode) && b.condition === 'Baik').length} judul
                  </strong>{' '}
                  dan akan dilakukan penelusuran lanjutan di rak kelas/pojok baca.
                </li>
              </ol>
              <p className="pt-1">
                Demikian Berita Acara ini dibuat dengan sebenarnya untuk dapat dipergunakan sebagai bahan pertanggungjawaban
                pengelolaan koleksi serta dasar pengajuan pemeliharaan dan pengadaan buku baru melalui dana BOS Perpustakaan.
              </p>
            </div>

            {/* Detail Tabel Hasil Pencacahan Fisik */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-slate-900">Daftar Hasil Pencacahan Fisik Koleksi Buku</h4>
                <span className="text-[10px] text-slate-500">Menampilkan {books.length} judul buku terdata</span>
              </div>
              <table className="w-full text-left border border-slate-300">
                <thead className="bg-slate-100 font-bold border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300">No</th>
                    <th className="p-2 border-r border-slate-300">Kode & Barcode</th>
                    <th className="p-2 border-r border-slate-300">Judul Buku & Pengarang</th>
                    <th className="p-2 border-r border-slate-300">Klasifikasi / Rak</th>
                    <th className="p-2 border-r border-slate-300 text-center">Fisik (Eks)</th>
                    <th className="p-2 text-center">Status Stock Opname</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {books.map((b, idx) => {
                    const isScanned = scannedCodes.includes(b.inventoryCode);
                    const isLoaned = activeLoans.some((l) => l.bookId === b.id);
                    const isDamaged = b.condition === 'Rusak Ringan' || b.condition === 'Rusak Berat';
                    const isLost = b.condition === 'Hilang';

                    return (
                      <tr key={b.id} className={isScanned ? 'bg-emerald-50/40' : ''}>
                        <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-mono">
                          <div className="font-bold text-slate-900">{b.inventoryCode}</div>
                          <div className="text-[10px] text-slate-500">{b.barcode}</div>
                        </td>
                        <td className="p-2 border-r border-slate-300">
                          <div className="font-bold text-slate-900">{b.title}</div>
                          <div className="text-[10px] text-slate-500">{b.author} • {b.publisher} ({b.publishYear})</div>
                        </td>
                        <td className="p-2 border-r border-slate-300 font-mono">
                          <div>{b.ddcCode}</div>
                          <div className="text-[10px] text-slate-500">{b.rackLocation}</div>
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">
                          {b.copiesAvailable} / {b.copiesTotal}
                        </td>
                        <td className="p-2 text-center">
                          {isScanned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle size={11} /> Fisik Sesuai di Rak
                            </span>
                          ) : isLoaned ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              Sedang Dipinjam
                            </span>
                          ) : isDamaged ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              {b.condition}
                            </span>
                          ) : isLost ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              Hilang
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                              Belum Terhitung (Selisih)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OFFICIAL SIGNATURE BLOCK FOR OFFICIAL GOVERNMENT / SCHOOL USE */}
        <div className="mt-12 pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-xs text-slate-800 avoid-break">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">Kepala SMP Negeri 2 Pemalang</p>
            <div className="h-16 flex items-center justify-center italic text-slate-400">
              (ttd & cap dinas)
            </div>
            <p className="font-bold underline text-slate-900">{schoolInfo.headmaster}</p>
            <p className="text-[10px] font-mono text-slate-600">NIP. {schoolInfo.headmasterNip}</p>
          </div>

          <div>
            <p>Pemalang, {today}</p>
            <p className="font-bold">Kepala Perpustakaan MEKAR</p>
            <div className="h-16 flex items-center justify-center italic text-slate-400">
              (ttd)
            </div>
            <p className="font-bold underline text-slate-900">{schoolInfo.headOfLibrary}</p>
            <p className="text-[10px] font-mono text-slate-600">NIP. {schoolInfo.headOfLibraryNip}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
