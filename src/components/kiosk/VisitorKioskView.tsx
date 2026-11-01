import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { SCHOOL_INFO, VisitorLog } from '../../types/library';
import {
  UserCheck,
  ScanBarcode,
  Search,
  BookOpen,
  Clock,
  Calendar,
  Sparkles,
  CheckCircle2,
  Lock,
  Layers,
  MapPin,
  Shield,
  HelpCircle,
} from 'lucide-react';

interface VisitorKioskViewProps {
  onOpenAdminLogin: () => void;
}

export const VisitorKioskView: React.FC<VisitorKioskViewProps> = ({ onOpenAdminLogin }) => {
  const { visitors, members, books, addVisitor } = useLibrary();

  // Kiosk Check-in Form State
  const [searchInput, setSearchInput] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<VisitorLog['purpose']>('Membaca di Tempat');
  const [bookRead, setBookRead] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Manual non-registered guest state
  const [showManualGuest, setShowManualGuest] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualType, setManualType] = useState<VisitorLog['type']>('Siswa');
  const [manualClass, setManualClass] = useState('Kelas VII.A');

  // Quick Book Search State for Visitors
  const [bookQuery, setBookQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayVisitors = visitors.filter((v) => v.date === todayStr);

  // Handle Quick Member Check-in
  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const q = searchInput.trim().toLowerCase();
    const matched = members.find(
      (m) =>
        m.idNumber.toLowerCase() === q ||
        m.memberCode.toLowerCase() === q ||
        m.name.toLowerCase().includes(q)
    );

    if (matched) {
      addVisitor({
        memberId: matched.id,
        name: matched.name,
        type: matched.type,
        idNumber: matched.idNumber,
        classOrDept: matched.classOrSubject,
        purpose: selectedPurpose,
        bookReadOnSite: bookRead.trim() || undefined,
      });

      setCheckInFeedback({
        success: true,
        message: `Selamat datang, ${matched.name} (${matched.classOrSubject})! Kunjungan Anda berhasil dicatat di buku tamu.`,
      });
      setSearchInput('');
      setBookRead('');
      setTimeout(() => setCheckInFeedback(null), 5000);
    } else {
      setCheckInFeedback({
        success: false,
        message: `Data "${searchInput}" belum terdaftar sebagai anggota. Silakan gunakan opsi "Isi Tamu Manual" di bawah atau hubungi pustakawan.`,
      });
    }
  };

  // Handle Manual Guest Check-in
  const handleManualGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;

    addVisitor({
      name: manualName.trim(),
      type: manualType,
      classOrDept: manualClass.trim(),
      purpose: selectedPurpose,
      bookReadOnSite: bookRead.trim() || undefined,
    });

    setCheckInFeedback({
      success: true,
      message: `Selamat datang, ${manualName}! Kunjungan Anda berhasil dicatat.`,
    });
    setManualName('');
    setBookRead('');
    setShowManualGuest(false);
    setTimeout(() => setCheckInFeedback(null), 5000);
  };

  // Filtered books for visitor catalog lookup
  const searchResults = bookQuery.trim()
    ? books.filter(
        (b) =>
          b.title.toLowerCase().includes(bookQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(bookQuery.toLowerCase()) ||
          b.category.toLowerCase().includes(bookQuery.toLowerCase()) ||
          b.ddcCode.toLowerCase().includes(bookQuery.toLowerCase()) ||
          b.rackLocation.toLowerCase().includes(bookQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner with School Emblem and Admin Login Button */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/60 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute right-[-40px] top-[-40px] opacity-10 pointer-events-none">
          <BookOpen size={240} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-xl border-2 border-amber-400 shrink-0 flex items-center justify-center">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SMP Negeri 2 Pemalang"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] tracking-wider uppercase font-mono">
                  NPSN: {SCHOOL_INFO.npsn}
                </span>
                <span className="text-xs text-emerald-200">
                  {SCHOOL_INFO.address}
                </span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white">
                {SCHOOL_INFO.libraryName}
              </h1>
              <h2 className="text-xs sm:text-sm font-semibold text-emerald-300">
                {SCHOOL_INFO.name} • {SCHOOL_INFO.motto}
              </h2>
            </div>
          </div>

          {/* Login Admin Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={onOpenAdminLogin}
              className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-xs shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center gap-2 border-2 border-amber-300 active:scale-95"
            >
              <Lock size={16} />
              <span>Login Petugas / Admin Perpustakaan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Kiosk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Digital Guestbook Check-in Terminal (8 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Buku Tamu Pengunjung Digital
                  </h3>
                  <p className="text-xs text-slate-500">
                    Silakan isi kehadiran sebelum menikmati layanan perpustakaan
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex flex-col items-end text-xs text-slate-500">
                <div className="flex items-center gap-1 font-bold text-slate-800">
                  <Calendar size={14} className="text-emerald-700" />
                  <span>
                    {new Date().toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold mt-0.5">
                  <Clock size={13} />
                  <span>Layanan Hari Ini Buka: 07.00 - 14.30 WIB</span>
                </div>
              </div>
            </div>

            {/* Check-in Form */}
            <form onSubmit={handleCheckIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-sm">
                  Nomor Anggota / NISN Siswa / NIP Guru / Cari Nama:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 0098765432, AGT-SIS-0001, atau nama..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-emerald-600 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-emerald-500/20 focus:bg-white"
                  />
                  <ScanBarcode className="absolute left-4 top-4 text-emerald-700" size={20} />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  💡 Arahkan barcode scanner kartu anggota ke kolom di atas atau ketik langsung.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Tujuan & Keperluan Kunjungan:
                  </label>
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value as VisitorLog['purpose'])}
                    className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Membaca di Tempat">Membaca di Tempat</option>
                    <option value="Peminjaman / Pengembalian Buku">Peminjaman / Pengembalian Buku</option>
                    <option value="Mencari Referensi / Tugas">Mencari Referensi / Tugas</option>
                    <option value="Diskusi Kelompok">Diskusi Kelompok</option>
                    <option value="Pojok Literasi Digital">Pojok Literasi Digital</option>
                    <option value="Kunjungan Kelas / Observasi">Kunjungan Kelas / Observasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Judul Buku Dibaca di Tempat (Opsional):
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Kosmos, Laskar Pelangi, IPA..."
                    value={bookRead}
                    onChange={(e) => setBookRead(e.target.value)}
                    className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Feedback Alert */}
              {checkInFeedback && (
                <div
                  className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    checkInFeedback.success
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border border-rose-300 text-rose-900'
                  }`}
                >
                  <CheckCircle2 size={18} className="shrink-0" />
                  <span>{checkInFeedback.message}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualGuest(!showManualGuest)}
                  className="text-xs text-emerald-800 hover:text-emerald-950 font-semibold underline cursor-pointer"
                >
                  {showManualGuest ? '← Tutup Form Tamu Manual' : '+ Belum punya kartu? Isi Form Tamu Manual'}
                </button>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm rounded-2xl shadow-lg cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <UserCheck size={18} />
                  <span>Catat Kehadiran (Check-in)</span>
                </button>
              </div>
            </form>

            {/* Manual Non-registered Guest Form */}
            {showManualGuest && (
              <form onSubmit={handleManualGuestSubmit} className="pt-4 border-t border-slate-200 space-y-3">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-3">
                  <h4 className="font-bold text-xs text-amber-950">Pendataan Tamu Manual</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama pengunjung..."
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Status</label>
                      <select
                        value={manualType}
                        onChange={(e) => setManualType(e.target.value as VisitorLog['type'])}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Siswa">Siswa</option>
                        <option value="Guru">Guru</option>
                        <option value="Umum/Tamu">Tamu / Umum</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Kelas / Asal</label>
                      <input
                        type="text"
                        placeholder="Contoh: Kelas VII.A"
                        value={manualClass}
                        onChange={(e) => setManualClass(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl"
                    >
                      Simpan Tamu Manual
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* Quick OPAC Book Search for Visitors */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <Search size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Cari Buku & Letak Rak (OPAC Mandiri)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cek apakah buku yang Anda cari tersedia dan ada di rak mana
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Total: {books.length} Judul
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Ketik judul buku, pengarang, atau nomor klasifikasi..."
                value={bookQuery}
                onChange={(e) => setBookQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
            </div>

            {/* Quick search results */}
            {bookQuery.trim() && (
              <div className="space-y-2 pt-2">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">
                    Tidak ditemukan buku dengan kata kunci "{bookQuery}".
                  </p>
                ) : (
                  searchResults.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-slate-50 hover:bg-teal-50/50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{b.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {b.author} • <span className="font-semibold text-emerald-800">{b.category}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 font-bold text-amber-800">
                          <MapPin size={12} />
                          <span>{b.rackLocation}</span>
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-bold ${
                            b.copiesAvailable > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {b.copiesAvailable > 0 ? `Tersedia (${b.copiesAvailable} Eks)` : 'Sedang Dipinjam'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Visitors Today & Library Rules / Info (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Live Visitor Log Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Pengunjung Hari Ini
                </h3>
                <p className="text-[11px] text-slate-500">
                  Telah hadir {todayVisitors.length} pemustaka hari ini
                </p>
              </div>
              <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-900 font-black text-xs flex items-center justify-center">
                {todayVisitors.length}
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {todayVisitors.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-8">
                  Belum ada pengunjung tercatat hari ini. Silakan lakukan check-in di terminal.
                </p>
              ) : (
                todayVisitors.map((v, idx) => (
                  <div
                    key={v.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{v.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {v.classOrDept} • <span className="font-semibold text-purple-800">{v.purpose}</span>
                      </div>
                      {v.bookReadOnSite && (
                        <div className="text-[10px] text-emerald-800 italic mt-0.5">
                          📖 Membaca: "{v.bookReadOnSite}"
                        </div>
                      )}
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 font-bold shrink-0">
                      {v.time} WIB
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Library Info & Literacy Corner Card */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 space-y-4 text-xs text-slate-800">
            <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
              <Sparkles size={18} />
              <span>Gerakan Literasi Sekolah (GLS MEKAR)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Budayakan membaca 15 menit setiap pagi sebelum KBM dimulai. Dapatkan inspirasi, wawasan baru, dan ikuti lomba resensi buku bulanan!
            </p>
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-[11px] space-y-1">
              <strong className="text-amber-950 block">Tata Tertib Pengunjung:</strong>
              <p>• Tas dan jaket disimpan rapi di loker penitipan.</p>
              <p>• Menjaga ketenangan dan kebersihan ruang baca.</p>
              <p>• Buku yang selesai dibaca letakkan pada meja kembali / troli buku.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
