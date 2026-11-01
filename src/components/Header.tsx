import React, { useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { SCHOOL_INFO } from '../types/library';
import {
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  Search,
  ScanBarcode,
  School,
  CheckCircle,
  RotateCcw,
  CloudUpload,
} from 'lucide-react';

interface HeaderProps {
  onQuickSearchSelectBook?: (bookId: string) => void;
  onNavigateTab?: (tab: string) => void;
  onSwitchToVisitorKiosk?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onQuickSearchSelectBook,
  onNavigateTab,
  onSwitchToVisitorKiosk,
}) => {
  const { books, members, loans, visitors, resetAllData } = useLibrary();
  const [barcodeSearch, setBarcodeSearch] = useState('');
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Stats calculation
  const totalBooks = books.reduce((acc, b) => acc + b.copiesTotal, 0);
  const activeLoans = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat');
  const overdueLoans = loans.filter((l) => l.status === 'Terlambat');
  const todayDate = new Date().toISOString().split('T')[0];
  const todayVisitors = visitors.filter((v) => v.date === todayDate);

  const handleBarcodeLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeSearch.trim()) return;

    const query = barcodeSearch.trim().toLowerCase();
    const matchedBook = books.find(
      (b) =>
        b.barcode.toLowerCase() === query ||
        b.inventoryCode.toLowerCase().includes(query) ||
        b.title.toLowerCase().includes(query) ||
        b.isbn.toLowerCase().includes(query)
    );

    const matchedMember = members.find(
      (m) =>
        m.memberCode.toLowerCase() === query ||
        m.idNumber.toLowerCase() === query ||
        m.name.toLowerCase().includes(query)
    );

    if (matchedBook) {
      setSearchFeedback(`Buku Ditemukan: "${matchedBook.title}" (Tersedia: ${matchedBook.copiesAvailable}/${matchedBook.copiesTotal})`);
      if (onQuickSearchSelectBook) {
        onQuickSearchSelectBook(matchedBook.id);
      }
      if (onNavigateTab) {
        onNavigateTab('katalog');
      }
    } else if (matchedMember) {
      setSearchFeedback(`Anggota Ditemukan: ${matchedMember.name} (${matchedMember.type} - ${matchedMember.classOrSubject})`);
      if (onNavigateTab) {
        onNavigateTab('keanggotaan');
      }
    } else {
      setSearchFeedback(`Data "${barcodeSearch}" tidak ditemukan di database.`);
    }

    setTimeout(() => setSearchFeedback(null), 4000);
  };

  return (
    <header className="bg-white border-b border-slate-200 shadow-xs no-print">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-white/40 shrink-0">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SMP Negeri 2 Pemalang"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-400 text-amber-950 uppercase tracking-wider font-mono">
                  NPSN {SCHOOL_INFO.npsn}
                </span>
                <span className="text-xs text-emerald-200 hidden sm:inline">
                  {SCHOOL_INFO.address}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>{SCHOOL_INFO.libraryName}</span>
                <span className="text-emerald-300 font-light hidden sm:inline">|</span>
                <span className="text-emerald-200 text-sm font-normal hidden sm:inline">{SCHOOL_INFO.name}</span>
              </h1>
            </div>
          </div>

          {/* Quick Scanner Barcode Input & Logout to Kiosk */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <form onSubmit={handleBarcodeLookup} className="flex items-center gap-1.5 flex-1 md:flex-initial">
              <div className="relative w-full md:w-56">
                <input
                  type="text"
                  placeholder="Scan / Cari Barcode, NIS, Judul..."
                  value={barcodeSearch}
                  onChange={(e) => setBarcodeSearch(e.target.value)}
                  className="w-full bg-emerald-950/70 border border-emerald-600/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-emerald-300/70 focus:outline-hidden focus:ring-2 focus:ring-amber-400 focus:bg-emerald-950"
                />
                <ScanBarcode className="absolute left-2.5 top-2 text-emerald-300" size={14} />
              </div>
              <button
                type="submit"
                className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Search size={13} />
                <span className="hidden sm:inline">Cari</span>
              </button>
            </form>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('backup')}
                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-lg text-xs shrink-0 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                title="Backup Data ke Google Drive"
              >
                <CloudUpload size={14} className="text-blue-600" />
                <span className="hidden md:inline">Backup Drive</span>
              </button>
            )}

            {onSwitchToVisitorKiosk && (
              <button
                onClick={onSwitchToVisitorKiosk}
                className="px-3 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white font-bold rounded-lg text-xs shrink-0 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                title="Keluar dari Panel Admin ke Tampilan Buku Tamu Pengunjung"
              >
                <span>Keluar ke Kiosk Pengunjung</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Feedback Notification if any */}
      {searchFeedback && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center text-xs font-semibold text-amber-900 transition-all">
          {searchFeedback}
        </div>
      )}

      {/* Quick Dashboard Stat Strip */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between overflow-x-auto gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <BookOpen size={15} className="text-emerald-700" />
              <span>Koleksi:</span>
              <strong className="text-slate-900 font-bold">{books.length} Judul ({totalBooks} Eks)</strong>
            </div>

            <div className="flex items-center gap-2 font-medium">
              <Users size={15} className="text-teal-700" />
              <span>Anggota:</span>
              <strong className="text-slate-900 font-bold">{members.length} Orang</strong>
            </div>

            <div className="flex items-center gap-2 font-medium">
              <Clock size={15} className="text-blue-700" />
              <span>Buku Dipinjam:</span>
              <strong className="text-slate-900 font-bold">{activeLoans.length}</strong>
            </div>

            {overdueLoans.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 font-bold animate-pulse">
                <AlertTriangle size={13} />
                <span>Terlambat: {overdueLoans.length}</span>
              </div>
            )}

            <div className="flex items-center gap-2 font-medium">
              <CheckCircle size={15} className="text-purple-700" />
              <span>Pengunjung Hari Ini:</span>
              <strong className="text-slate-900 font-bold">{todayVisitors.length} Siswa/Guru</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (window.confirm('Reset data perpustakaan kembali ke data awal demo SMPN 2 Pemalang?')) {
                  resetAllData();
                }
              }}
              title="Reset data ke bawaan awal demo"
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Data Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
