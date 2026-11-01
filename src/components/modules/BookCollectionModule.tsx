import React, { useState, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Book, BookCategory, BOOK_CATEGORIES, BookCondition, SCHOOL_INFO } from '../../types/library';
import {
  downloadBookExcelTemplate,
  parseBookExcelFile,
  exportBooksToExcel,
} from '../../utils/excelHelper';
import { BarcodeCard } from '../BarcodeCard';
import { OfficialKopSurat } from '../OfficialKopSurat';
import {
  Plus,
  FileSpreadsheet,
  Upload,
  Printer,
  Download,
  Search,
  Filter,
  Barcode as BarcodeIcon,
  AlertOctagon,
  Trash2,
  Edit,
  Check,
  X,
  BookOpen,
  FileDown,
  Loader2,
} from 'lucide-react';
import { exportElementToPdf, triggerPrintWithIframe } from '../../utils/pdfGenerator';

export const BookCollectionModule: React.FC = () => {
  const { books, addBook, addBooksBatch, updateBook, deleteBook, markBookCondition } = useLibrary();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodePrintModal, setShowBarcodePrintModal] = useState(false);
  const [selectedBarcodeBooks, setSelectedBarcodeBooks] = useState<Book[]>([]);
  const [barcodeFilterCategory, setBarcodeFilterCategory] = useState<string>('ALL');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Barcode PDF export state & ref
  const barcodePrintRef = useRef<HTMLDivElement>(null);
  const [isExportingBarcodePdf, setIsExportingBarcodePdf] = useState(false);

  const handleDownloadBarcodePdf = async () => {
    if (!barcodePrintRef.current) return;
    setIsExportingBarcodePdf(true);
    try {
      await exportElementToPdf(barcodePrintRef.current, {
        filename: `Stiker_Label_Barcode_SMPN2_Pemalang_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    } catch (e) {
      console.error(e);
      handlePrintBarcodeDirect();
    } finally {
      setIsExportingBarcodePdf(false);
    }
  };

  const handlePrintBarcodeDirect = () => {
    if (barcodePrintRef.current) {
      triggerPrintWithIframe(barcodePrintRef.current, 'Label Barcode Buku Perpustakaan SMPN 2 Pemalang');
    } else {
      window.print();
    }
  };

  // Manual Add Form state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newPublisher, setNewPublisher] = useState('');
  const [newPublishYear, setNewPublishYear] = useState<number>(2024);
  const [newCategory, setNewCategory] = useState<BookCategory>('BUKU PAKET SISWA');
  const [newDdc, setNewDdc] = useState('500');
  const [newIsbn, setNewIsbn] = useState('');
  const [newRack, setNewRack] = useState('Rak 01-A');
  const [newCopies, setNewCopies] = useState<number>(5);
  const [newSource, setNewSource] = useState<Book['source']>('BOS Perpustakaan');
  const [newPrice, setNewPrice] = useState<number>(60000);
  const [newNotes, setNewNotes] = useState('');

  // Editing state
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // File input ref for Excel upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.inventoryCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.ddcCode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'ALL' || book.category === selectedCategory;

    const matchesCondition =
      conditionFilter === 'ALL'
        ? true
        : conditionFilter === 'RusakOrHilang'
        ? book.condition !== 'Baik'
        : book.condition === conditionFilter;

    return matchesSearch && matchesCategory && matchesCondition;
  });

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    try {
      const parsed = await parseBookExcelFile(file, books.length);
      if (parsed.length === 0) {
        setUploadError('Tidak ada baris buku valid yang dapat diimpor.');
        return;
      }
      addBooksBatch(parsed);
      setUploadSuccess(`Berhasil mengunggah dan menambahkan ${parsed.length} buku baru beserta Barcode & Kode Inventaris!`);
      setTimeout(() => setUploadSuccess(null), 5000);
    } catch (err: any) {
      setUploadError(`Gagal membaca file Excel: ${err.message || 'Format tidak didukung'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Manual Add
  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addBook({
      title: newTitle.trim(),
      author: newAuthor.trim() || 'Anonim',
      publisher: newPublisher.trim() || 'Perpustakaan',
      publishYear: Number(newPublishYear) || 2024,
      category: newCategory,
      ddcCode: newDdc.trim() || '000',
      isbn: newIsbn.trim() || '-',
      rackLocation: newRack.trim() || 'Rak Koleksi',
      copiesTotal: Number(newCopies) || 1,
      condition: 'Baik',
      source: newSource,
      priceEstimated: Number(newPrice) || 50000,
      notes: newNotes.trim() || undefined,
    });

    // Reset form
    setNewTitle('');
    setNewAuthor('');
    setNewPublisher('');
    setNewNotes('');
    setShowAddModal(false);
  };

  // Open Barcode Print Modal
  const openBarcodeModal = (specificBooks?: Book[]) => {
    if (specificBooks && specificBooks.length > 0) {
      setSelectedBarcodeBooks(specificBooks);
    } else {
      setSelectedBarcodeBooks(books);
    }
    setShowBarcodePrintModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Quick Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                <BookOpen size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Sistem Pengelolaan Koleksi Buku
                </h2>
                <p className="text-xs text-slate-500">
                  Perpustakaan MEKAR SMPN 2 Pemalang • Total Koleksi: <strong>{books.length} Judul</strong> (
                  {books.reduce((acc, b) => acc + b.copiesTotal, 0)} Eksemplar)
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Template Excel, Upload Excel, Add Manual, Print Barcode, Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={downloadBookExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Unduh format file Excel kosong dengan panduan pengisian"
            >
              <FileSpreadsheet size={15} />
              <span>Template Excel</span>
            </button>

            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-teal-50 text-teal-800 border border-teal-300 hover:bg-teal-100 transition-colors cursor-pointer">
              <Upload size={15} />
              <span>Unggah Excel</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={() => exportBooksToExcel(filteredBooks)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Unduh seluruh daftar buku yang sedang tampil ke Excel"
            >
              <Download size={15} />
              <span>Unduh Excel</span>
            </button>

            <button
              onClick={() => openBarcodeModal(filteredBooks)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Cetak stiker barcode inventaris untuk ditempel di punggung buku"
            >
              <BarcodeIcon size={15} />
              <span>Cetak Barcode</span>
            </button>

            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Input Buku Baru</span>
            </button>
          </div>
        </div>

        {/* Upload Alert feedback */}
        {uploadSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-medium text-emerald-800 flex items-center gap-2">
            <Check size={16} />
            <span>{uploadSuccess}</span>
          </div>
        )}
        {uploadError && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-800 flex items-center gap-2">
            <AlertOctagon size={16} />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan Judul, Pengarang, No DDC, Barcode, No Inventaris..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white"
            />
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-72">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="ALL">Semua Kategori Koleksi ({books.length})</option>
              {BOOK_CATEGORIES.map((cat) => {
                const count = books.filter((b) => b.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Condition Filter */}
          <div className="w-full md:w-56">
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
            >
              <option value="ALL">Semua Kondisi Fisik</option>
              <option value="Baik">Kondisi Baik</option>
              <option value="RusakOrHilang">Perlu Perhatian (Rusak & Hilang)</option>
              <option value="Rusak Ringan">Rusak Ringan</option>
              <option value="Rusak Berat">Rusak Berat</option>
              <option value="Hilang">Hilang</option>
            </select>
          </div>
        </div>
      </div>

      {/* Book List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Menampilkan {filteredBooks.length} dari {books.length} Buku
          </span>
          <span className="text-xs text-slate-500">
            Klik barcode untuk melihat label siap cetak
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Kode Inventaris / Barcode</th>
                <th className="py-3 px-3">Judul & Pengarang</th>
                <th className="py-3 px-3">Kategori & DDC</th>
                <th className="py-3 px-3">Lokasi Rak</th>
                <th className="py-3 px-3 text-center">Eksemplar</th>
                <th className="py-3 px-3 text-center">Kondisi</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada koleksi buku yang sesuai dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  return (
                    <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-slate-900">{book.inventoryCode}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] bg-slate-200 px-1.5 py-0.2 rounded font-semibold text-slate-800">
                            {book.barcode}
                          </span>
                          <button
                            onClick={() => openBarcodeModal([book])}
                            title="Pratinjau label barcode"
                            className="text-emerald-700 hover:text-emerald-900"
                          >
                            <BarcodeIcon size={14} />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1" title={book.title}>
                          {book.title}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5 truncate">
                          {book.author} • {book.publisher} ({book.publishYear})
                        </div>
                        {book.isbn && book.isbn !== '-' && (
                          <div className="text-[10px] font-mono text-slate-400">
                            ISBN: {book.isbn}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 mb-0.5 max-w-[190px] truncate">
                          {book.category}
                        </span>
                        <div className="font-mono text-slate-600 font-semibold text-[11px]">
                          DDC: {book.ddcCode}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-slate-700 font-medium">
                        {book.rackLocation}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="font-bold text-slate-900">
                          {book.copiesAvailable} / {book.copiesTotal}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            book.copiesAvailable > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {book.copiesAvailable > 0 ? 'Tersedia' : 'Habis Dipinjam'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <select
                          value={book.condition}
                          onChange={(e) =>
                            markBookCondition(book.id, e.target.value as BookCondition)
                          }
                          className={`text-[10px] font-bold px-2 py-1 rounded border ${
                            book.condition === 'Baik'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : book.condition === 'Rusak Ringan'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          <option value="Baik">Baik</option>
                          <option value="Rusak Ringan">Rusak Ringan</option>
                          <option value="Rusak Berat">Rusak Berat</option>
                          <option value="Hilang">Hilang</option>
                        </select>
                        {book.notes && (
                          <div className="text-[9px] text-slate-500 italic max-w-[120px] truncate mt-0.5" title={book.notes}>
                            {book.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openBarcodeModal([book])}
                            title="Cetak Barcode Buku Ini"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => setEditingBook(book)}
                            title="Edit Data Buku"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus buku "${book.title}" dari database?`)) {
                                deleteBook(book.id);
                              }
                            }}
                            title="Hapus Buku"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Input Buku Baru Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-emerald-900 text-white rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">Pendataan Buku Baru (Input Manual)</h3>
                <p className="text-xs text-emerald-200">
                  Kode Inventaris dan Barcode akan digenerate secara otomatis
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-emerald-300 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveBook} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Judul Buku <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Ilmu Pengetahuan Alam SMP Kelas VII"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pengarang / Penulis</label>
                  <input
                    type="text"
                    value={newAuthor}
                    onChange={(e) => setNewAuthor(e.target.value)}
                    placeholder="Contoh: Victoriani Inabuy, Cece Sutia"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={newPublisher}
                    onChange={(e) => setNewPublisher(e.target.value)}
                    placeholder="Contoh: Pusat Kurikulum Kemendikbudristek"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tahun Terbit</label>
                  <input
                    type="number"
                    value={newPublishYear}
                    onChange={(e) => setNewPublishYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ISBN / ISSN</label>
                  <input
                    type="text"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    placeholder="978-602-..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Eksemplar</label>
                  <input
                    type="number"
                    min="1"
                    value={newCopies}
                    onChange={(e) => setNewCopies(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Koleksi</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as BookCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Klasifikasi DDC
                  </label>
                  <input
                    type="text"
                    value={newDdc}
                    onChange={(e) => setNewDdc(e.target.value)}
                    placeholder="Contoh: 500, 813, 297, 005"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Rak Buku</label>
                  <input
                    type="text"
                    value={newRack}
                    onChange={(e) => setNewRack(e.target.value)}
                    placeholder="Rak 01-A / Sains"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sumber Pengadaan</label>
                  <select
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value as Book['source'])}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="BOS Perpustakaan">BOS Perpustakaan</option>
                    <option value="APBD">APBD</option>
                    <option value="Hibah/Sumbangan Alumni">Hibah / Alumni</option>
                    <option value="Pengadaan Mandiri">Pengadaan Mandiri</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Harga (Rp)</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Catatan kondisi buku, edisi cetakan, dsb."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Edit Buku */}
      {editingBook && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-bold text-base text-slate-900">
                Edit Buku: {editingBook.inventoryCode}
              </h3>
              <button
                onClick={() => setEditingBook(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Buku</label>
                <input
                  type="text"
                  value={editingBook.title}
                  onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pengarang</label>
                  <input
                    type="text"
                    value={editingBook.author}
                    onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Penerbit</label>
                  <input
                    type="text"
                    value={editingBook.publisher}
                    onChange={(e) => setEditingBook({ ...editingBook, publisher: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingBook.category}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, category: e.target.value as BookCategory })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                  >
                    {BOOK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor DDC</label>
                  <input
                    type="text"
                    value={editingBook.ddcCode}
                    onChange={(e) => setEditingBook({ ...editingBook, ddcCode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lokasi Rak</label>
                  <input
                    type="text"
                    value={editingBook.rackLocation}
                    onChange={(e) => setEditingBook({ ...editingBook, rackLocation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Eksemplar</label>
                  <input
                    type="number"
                    min="1"
                    value={editingBook.copiesTotal}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, copiesTotal: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tersedia</label>
                  <input
                    type="number"
                    min="0"
                    max={editingBook.copiesTotal}
                    value={editingBook.copiesAvailable}
                    onChange={(e) =>
                      setEditingBook({ ...editingBook, copiesAvailable: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-emerald-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  updateBook(editingBook.id, editingBook);
                  setEditingBook(null);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cetak Barcode & Stiker Punggung Buku (Print PDF Ready) */}
      {showBarcodePrintModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300">
            {/* Header Dialog (no-print) */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white rounded-t-2xl no-print">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <BarcodeIcon size={18} className="text-amber-400" />
                  <span>Cetak Label Barcode & Nomor Klasifikasi Buku</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Format stiker punggung buku perpustakaan SMPN 2 Pemalang
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadBarcodePdf}
                  disabled={isExportingBarcodePdf}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-60"
                  title="Unduh label stiker dalam bentuk berkas PDF"
                >
                  {isExportingBarcodePdf ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Memproses PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown size={14} />
                      <span>Unduh PDF</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrintBarcodeDirect}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Cetak langsung ke printer"
                >
                  <Printer size={14} />
                  <span>Cetak Printer</span>
                </button>

                <button
                  onClick={() => setShowBarcodePrintModal(false)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Filter in modal (no-print) */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs no-print">
              <span className="font-semibold text-slate-700">
                Jumlah Label Siap Cetak: {selectedBarcodeBooks.length} Label
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">Filter Kategori:</span>
                <select
                  value={barcodeFilterCategory}
                  onChange={(e) => {
                    setBarcodeFilterCategory(e.target.value);
                    if (e.target.value === 'ALL') {
                      setSelectedBarcodeBooks(books);
                    } else {
                      setSelectedBarcodeBooks(books.filter((b) => b.category === e.target.value));
                    }
                  }}
                  className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-medium"
                >
                  <option value="ALL">Semua Kategori ({books.length})</option>
                  {BOOK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Printable Content Container */}
            <div ref={barcodePrintRef} className="p-6 overflow-y-auto flex-1 bg-slate-50 print-container">
              {/* Official Kop on Print */}
              <div className="print-only mb-6">
                <OfficialKopSurat
                  documentTitle="LEMBAR CETAK LABEL BARCODE & NOMOR PUNGGUNG BUKU"
                  documentSubtitle="PERPUSTAKAAN MEKAR SMP NEGERI 2 PEMALANG"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {selectedBarcodeBooks.map((book) => (
                  <BarcodeCard
                    key={book.id}
                    barcode={book.barcode}
                    inventoryCode={book.inventoryCode}
                    title={book.title}
                    ddcCode={book.ddcCode}
                    category={book.category}
                    author={book.author}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
