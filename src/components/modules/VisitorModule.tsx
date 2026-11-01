import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { VisitorLog, SCHOOL_INFO } from '../../types/library';
import { OfficialKopSurat } from '../OfficialKopSurat';
import {
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Clock,
  Printer,
  Search,
  ScanBarcode,
  CheckCircle,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export const VisitorModule: React.FC = () => {
  const { visitors, members, books, addVisitor } = useLibrary();

  // Quick Kiosk Search / Check-in State
  const [quickInput, setQuickInput] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<VisitorLog['purpose']>('Membaca di Tempat');
  const [readBookTitle, setReadBookTitle] = useState('');
  const [visitorNotes, setVisitorNotes] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState<string | null>(null);

  // Manual non-registered guest state
  const [showManualForm, setShowManualForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestType, setGuestType] = useState<VisitorLog['type']>('Siswa');
  const [guestClassOrDept, setGuestClassOrDept] = useState('Kelas VII.A');

  // Filter & Date Range
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Handle Quick Check-in via Member Search
  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;

    const query = quickInput.trim().toLowerCase();
    const matchedMember = members.find(
      (m) =>
        m.idNumber.toLowerCase() === query ||
        m.memberCode.toLowerCase() === query ||
        m.name.toLowerCase().includes(query)
    );

    if (matchedMember) {
      addVisitor({
        memberId: matchedMember.id,
        name: matchedMember.name,
        type: matchedMember.type,
        idNumber: matchedMember.idNumber,
        classOrDept: matchedMember.classOrSubject,
        purpose: selectedPurpose,
        bookReadOnSite: readBookTitle.trim() || undefined,
        notes: visitorNotes.trim() || undefined,
      });

      setCheckInFeedback(
        `Selamat Datang, ${matchedMember.name}! Kehadiran Anda di Perpustakaan MEKAR berhasil dicatat.`
      );
      setQuickInput('');
      setReadBookTitle('');
      setVisitorNotes('');
      setTimeout(() => setCheckInFeedback(null), 4000);
    } else {
      setCheckInFeedback(`Anggota "${quickInput}" tidak ditemukan. Silakan gunakan form Tamu Manual di bawah.`);
    }
  };

  // Handle Manual Guest Submit
  const handleManualGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) return;

    addVisitor({
      name: guestName.trim(),
      type: guestType,
      classOrDept: guestClassOrDept.trim(),
      purpose: selectedPurpose,
      bookReadOnSite: readBookTitle.trim() || undefined,
      notes: visitorNotes.trim() || undefined,
    });

    setCheckInFeedback(`Kunjungan untuk ${guestName} berhasil dicatat.`);
    setGuestName('');
    setReadBookTitle('');
    setShowManualForm(false);
    setTimeout(() => setCheckInFeedback(null), 4000);
  };

  // Stats calculation
  const totalVisits = visitors.length;
  const todayVisits = visitors.filter((v) => v.date === filterDate);

  // Group visits by purpose
  const purposeCounts: Record<string, number> = {};
  todayVisits.forEach((v) => {
    purposeCounts[v.purpose] = (purposeCounts[v.purpose] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-100 text-purple-800">
              <UserCheck size={20} />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Sistem Layanan Pengunjung & Buku Tamu Digital
              </h2>
              <p className="text-xs text-slate-500">
                Pencatatan kehadiran harian siswa, guru & tamu • Statistik minat baca di tempat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak Rekap Kunjungan (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KIOSK DIGITAL BUKU TAMU */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 no-print">
        {/* Check-in Terminal */}
        <div className="lg:col-span-2 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-purple-800">
          <div className="flex items-center justify-between pb-3 border-b border-purple-700/60 mb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                TERMINAL BUKU TAMU DIGITAL
              </span>
              <h3 className="text-lg font-black text-white">
                Check-in Pengunjung Perpustakaan MEKAR
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-800/80 border border-purple-600 flex items-center justify-center text-amber-300">
              <Sparkles size={20} />
            </div>
          </div>

          {/* Quick Check-in Form */}
          <form onSubmit={handleQuickCheckIn} className="space-y-4 text-xs">
            <div>
              <label className="block text-purple-200 font-bold mb-1">
                Scan Kartu / Masukkan NISN, NIP, atau Nama Anggota:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Ketik NISN / NIP atau cari nama siswa/guru..."
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  className="w-full bg-purple-950/80 border-2 border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-purple-300/60 font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
                <ScanBarcode className="absolute left-3 top-3 text-purple-300" size={18} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-purple-200 font-bold mb-1">
                  Keperluan / Layanan Kunjungan:
                </label>
                <select
                  value={selectedPurpose}
                  onChange={(e) => setSelectedPurpose(e.target.value as VisitorLog['purpose'])}
                  className="w-full bg-purple-950 border border-purple-600 rounded-lg px-3 py-2 text-xs text-white font-medium focus:ring-2 focus:ring-amber-400"
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
                <label className="block text-purple-200 font-bold mb-1">
                  Judul Buku yang Dibaca di Tempat (Opsional):
                </label>
                <input
                  type="text"
                  placeholder="Misal: Kosmos, Atlas Indonesia, dsb."
                  value={readBookTitle}
                  onChange={(e) => setReadBookTitle(e.target.value)}
                  className="w-full bg-purple-950 border border-purple-600 rounded-lg px-3 py-2 text-xs text-white placeholder-purple-400 focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowManualForm(!showManualForm)}
                className="text-[11px] text-purple-300 hover:text-white underline cursor-pointer"
              >
                {showManualForm ? 'Tutup Form Tamu Manual' : 'Bukan Anggota Terdaftar? Isi Tamu Manual'}
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
              >
                <UserCheck size={16} />
                <span>Simpan Kehadiran (Check-in)</span>
              </button>
            </div>
          </form>

          {/* Feedback message */}
          {checkInFeedback && (
            <div className="mt-4 p-3 bg-white/10 backdrop-blur-md rounded-xl text-xs font-bold text-amber-200 border border-white/20 flex items-center gap-2">
              <CheckCircle size={16} />
              <span>{checkInFeedback}</span>
            </div>
          )}

          {/* Manual Non-registered Guest Accordion */}
          {showManualForm && (
            <form onSubmit={handleManualGuestSubmit} className="mt-5 pt-4 border-t border-purple-700/80 space-y-3">
              <p className="text-xs font-bold text-amber-300">Pendataan Tamu Manual / Tamu Khusus</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Nama Lengkap Tamu"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full bg-purple-950 border border-purple-600 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <select
                    value={guestType}
                    onChange={(e) => setGuestType(e.target.value as VisitorLog['type'])}
                    className="w-full bg-purple-950 border border-purple-600 rounded-lg px-3 py-2 text-xs text-white font-medium"
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                    <option value="Umum/Tamu">Tamu / Umum</option>
                  </select>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Kelas / Instansi"
                    value={guestClassOrDept}
                    onChange={(e) => setGuestClassOrDept(e.target.value)}
                    className="w-full bg-purple-950 border border-purple-600 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
              >
                Catat Tamu Manual
              </button>
            </form>
          )}
        </div>

        {/* Daily Stats Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <BarChart3 className="text-purple-700" size={17} />
            <span>Statistik Pengunjung</span>
          </h4>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl">
              <span className="text-purple-900 font-medium">Hari Ini ({filterDate}):</span>
              <strong className="text-lg font-black text-purple-950">{todayVisits.length} Orang</strong>
            </div>

            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
              <span className="text-slate-700 font-medium">Total Akumulasi Kunjungan:</span>
              <strong className="text-lg font-black text-slate-900">{totalVisits} Orang</strong>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <span className="text-xs font-bold text-slate-800 block mb-2">
              Distribusi Layanan Hari Ini:
            </span>
            <div className="space-y-1.5 text-xs">
              {Object.entries(purposeCounts).map(([purpose, count]) => (
                <div key={purpose} className="flex justify-between text-slate-600">
                  <span className="truncate max-w-[180px]">{purpose}:</span>
                  <span className="font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VISITOR LOG TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Printable Official Kop */}
        <div className="print-only p-4">
          <OfficialKopSurat
            documentTitle="REKAPITULASI BUKU TAMU & LAYANAN PENGUNJUNG"
            documentSubtitle={`Tanggal Kunjungan: ${filterDate}`}
          />
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Daftar Buku Tamu Perpustakaan MEKAR
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {todayVisits.length} kunjungan pada tanggal {filterDate}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Pilih Tanggal:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Waktu Datang</th>
                <th className="py-3 px-3">Nama Pengunjung</th>
                <th className="py-3 px-3">Tipe / Kelas</th>
                <th className="py-3 px-3">Keperluan / Layanan</th>
                <th className="py-3 px-3">Buku yang Dibaca di Tempat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {todayVisits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada pengunjung yang tercatat pada tanggal {filterDate}.
                  </td>
                </tr>
              ) : (
                todayVisits.map((vis, idx) => (
                  <tr key={vis.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">
                      <span className="font-bold text-slate-900">{vis.time}</span> WIB
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{vis.name}</div>
                      {vis.idNumber && (
                        <div className="text-[10px] font-mono text-slate-400">ID: {vis.idNumber}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-slate-800">{vis.classOrDept}</span>
                      <div className="text-[10px] text-slate-500">{vis.type}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-bold text-[10px]">
                        {vis.purpose}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {vis.bookReadOnSite ? (
                        <span className="font-medium text-emerald-800 italic">
                          "{vis.bookReadOnSite}"
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
