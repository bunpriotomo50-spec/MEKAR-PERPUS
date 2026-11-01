import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Book, BookCategory, BOOK_CATEGORIES } from '../../types/library';
import {
  Search,
  BookOpen,
  MapPin,
  CheckCircle2,
  XCircle,
  Hash,
  User,
  Building2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CatalogSearchModuleProps {
  onDirectBorrow?: (bookId: string) => void;
}

export const CatalogSearchModule: React.FC<CatalogSearchModuleProps> = ({ onDirectBorrow }) => {
  const { books } = useLibrary();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState<'ALL' | 'AVAILABLE' | 'LOANED'>('ALL');
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);

  // Filter books for OPAC
  const filteredBooks = books.filter((book) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      book.publisher.toLowerCase().includes(term) ||
      book.ddcCode.toLowerCase().includes(term) ||
      book.isbn.toLowerCase().includes(term) ||
      book.rackLocation.toLowerCase().includes(term);

    const matchesCategory = selectedCategory === 'ALL' || book.category === selectedCategory;

    const matchesAvailability =
      availabilityFilter === 'ALL'
        ? true
        : availabilityFilter === 'AVAILABLE'
        ? book.copiesAvailable > 0
        : book.copiesAvailable === 0;

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  return (
    <div className="space-y-6">
      {/* OPAC Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 rounded-2xl shadow-md no-print">
        <div className="max-w-3xl">
          <span className="px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider">
            OPAC - Online Public Access Catalog
          </span>
          <h2 className="text-2xl font-black mt-2 tracking-tight">
            Katalog & Pencarian Buku Perpustakaan MEKAR
          </h2>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
            Temukan buku teks kurikulum merdeka, referensi sains, karya sastra, ensiklopedi, audio visual, dan buku pegangan guru SMP Negeri 2 Pemalang.
          </p>

          {/* Search Input */}
          <div className="relative mt-5">
            <input
              type="text"
              placeholder="Cari berdasarkan Judul Buku, Nama Pengarang, No. DDC, atau Kata Kunci..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-slate-900 rounded-xl pl-11 pr-4 py-3 text-sm font-semibold placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-amber-400/50 shadow-lg"
            />
            <Search className="absolute left-4 top-3.5 text-emerald-700" size={18} />
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
          >
            <option value="ALL">Semua Kategori ({books.length})</option>
            {BOOK_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({books.filter((b) => b.category === cat).length})
              </option>
            ))}
          </select>

          <span className="font-bold text-slate-700 ml-2">Ketersediaan:</span>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setAvailabilityFilter('ALL')}
              className={`px-3 py-1 rounded-md font-medium ${
                availabilityFilter === 'ALL' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setAvailabilityFilter('AVAILABLE')}
              className={`px-3 py-1 rounded-md font-medium ${
                availabilityFilter === 'AVAILABLE' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-slate-600'
              }`}
            >
              Hanya Tersedia
            </button>
            <button
              onClick={() => setAvailabilityFilter('LOANED')}
              className={`px-3 py-1 rounded-md font-medium ${
                availabilityFilter === 'LOANED' ? 'bg-white shadow-xs text-rose-700 font-bold' : 'text-slate-600'
              }`}
            >
              Sedang Habis
            </button>
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          Ditemukan <strong className="text-slate-900">{filteredBooks.length}</strong> judul buku
        </div>
      </div>

      {/* Book Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBooks.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200">
            <BookOpen size={48} className="mx-auto text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700">Tidak ada buku yang cocok dengan pencarian Anda</h4>
            <p className="text-xs text-slate-500 mt-1">Coba gunakan kata kunci lain atau pilih "Semua Kategori".</p>
          </div>
        ) : (
          filteredBooks.map((book) => {
            const isAvailable = book.copiesAvailable > 0;
            return (
              <div
                key={book.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Category & DDC Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 truncate max-w-[200px]">
                      {book.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                      DDC {book.ddcCode}
                    </span>
                  </div>

                  {/* Title & Author */}
                  <h3
                    onClick={() => setSelectedBookDetail(book)}
                    className="font-bold text-slate-900 text-sm hover:text-emerald-700 cursor-pointer line-clamp-2 leading-snug mb-1"
                    title={book.title}
                  >
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Oleh: <span className="font-medium text-slate-700">{book.author}</span>
                  </p>

                  {/* Metadata Grid */}
                  <div className="space-y-1.5 text-[11px] text-slate-600 border-t border-slate-100 pt-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={13} className="text-amber-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{book.rackLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Building2 size={13} className="shrink-0" />
                      <span className="truncate">{book.publisher} ({book.publishYear})</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                      <Hash size={12} className="shrink-0" />
                      <span>{book.barcode}</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Availability & Action */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isAvailable ? (
                      <>
                        <CheckCircle2 size={15} className="text-emerald-600" />
                        <span className="text-xs font-bold text-emerald-800">
                          Tersedia ({book.copiesAvailable} Eks)
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle size={15} className="text-rose-600" />
                        <span className="text-xs font-bold text-rose-800">
                          Semua Dipinjam
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedBookDetail(book)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                    >
                      Detail
                    </button>
                    {isAvailable && onDirectBorrow && (
                      <button
                        onClick={() => onDirectBorrow(book.id)}
                        className="px-3 py-1 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md cursor-pointer"
                      >
                        Pinjam
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: DETAIL BUKU OPAC */}
      {selectedBookDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="pb-3 border-b border-slate-200 mb-4">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 mb-1 inline-block">
                {selectedBookDetail.category}
              </span>
              <h3 className="font-bold text-base text-slate-900">
                {selectedBookDetail.title}
              </h3>
              <p className="text-xs text-slate-500">
                Pengarang: {selectedBookDetail.author}
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Nomor Klasifikasi DDC:</span>
                <span className="font-mono font-bold text-slate-900">{selectedBookDetail.ddcCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Lokasi Rak Buku:</span>
                <span className="font-bold text-emerald-800">{selectedBookDetail.rackLocation}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Kode Inventaris:</span>
                <span className="font-mono font-bold">{selectedBookDetail.inventoryCode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Barcode Buku:</span>
                <span className="font-mono font-bold">{selectedBookDetail.barcode}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Penerbit & Tahun:</span>
                <span>{selectedBookDetail.publisher} ({selectedBookDetail.publishYear})</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">ISBN:</span>
                <span className="font-mono">{selectedBookDetail.isbn}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Total Koleksi:</span>
                <span>{selectedBookDetail.copiesTotal} Eksemplar</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Ketersediaan Saat Ini:</span>
                <span className="font-bold text-emerald-800">{selectedBookDetail.copiesAvailable} Eksemplar</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Kondisi Fisik:</span>
                <span className="font-bold">{selectedBookDetail.condition}</span>
              </div>
              {selectedBookDetail.notes && (
                <div className="pt-1 text-slate-500 italic">
                  Catatan: {selectedBookDetail.notes}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedBookDetail(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600"
              >
                Tutup
              </button>
              {selectedBookDetail.copiesAvailable > 0 && onDirectBorrow && (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedBookDetail.id;
                    setSelectedBookDetail(null);
                    onDirectBorrow(id);
                  }}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg"
                >
                  Ajukan Peminjaman
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
