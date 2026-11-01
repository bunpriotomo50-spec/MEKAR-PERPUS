import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { LiteracyJournal, BookReviewContest, SCHOOL_INFO } from '../../types/library';
import {
  Sparkles,
  BookOpen,
  Award,
  Crown,
  LayoutGrid,
  Plus,
  CheckCircle,
  Star,
  Calendar,
  User,
  Heart,
  TrendingUp,
  X,
} from 'lucide-react';

export const LiteracyProgramModule: React.FC = () => {
  const {
    literacyJournals,
    contestEntries,
    ambassadors,
    readingCorners,
    members,
    addLiteracyJournal,
    verifyLiteracyJournal,
    addContestEntry,
    updateContestEntry,
    updateReadingCornerScore,
  } = useLibrary();

  // Sub Tab: '15menit' | 'lomba' | 'duta' | 'pojok_baca'
  const [activeTab, setActiveTab] = useState<'15menit' | 'lomba' | 'duta' | 'pojok_baca'>('15menit');

  // Modal State
  const [showAddJournalModal, setShowAddJournalModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);

  // Journal Form State
  const [jStudentName, setJStudentName] = useState('');
  const [jStudentClass, setJStudentClass] = useState('Kelas VIII.A');
  const [jNis, setJNis] = useState('');
  const [jBookTitle, setJBookTitle] = useState('');
  const [jAuthor, setJAuthor] = useState('');
  const [jPagesRead, setJPagesRead] = useState('Hal. 1-20');
  const [jSummary, setJSummary] = useState('');
  const [jMoralValue, setJMoralValue] = useState('');

  // Review Contest Form State
  const [rStudentName, setRStudentName] = useState('');
  const [rStudentClass, setRStudentClass] = useState('Kelas VIII.B');
  const [rBookTitle, setRBookTitle] = useState('');
  const [rAuthor, setRAuthor] = useState('');
  const [rReviewText, setRReviewText] = useState('');
  const [rRatingStars, setRRatingStars] = useState<number>(5);

  const handleSaveJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jStudentName.trim() || !jBookTitle.trim()) return;

    addLiteracyJournal({
      studentName: jStudentName.trim(),
      studentClass: jStudentClass,
      nis: jNis.trim() || '0098765...',
      bookTitle: jBookTitle.trim(),
      author: jAuthor.trim() || 'Anonim',
      pagesRead: jPagesRead.trim(),
      summary: jSummary.trim(),
      moralValue: jMoralValue.trim(),
    });

    setJStudentName('');
    setJBookTitle('');
    setJSummary('');
    setJMoralValue('');
    setShowAddJournalModal(false);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rStudentName.trim() || !rBookTitle.trim()) return;

    addContestEntry({
      contestTitle: 'Lomba Resensi Buku Bulan Bahasa & Literasi MEKAR',
      studentName: rStudentName.trim(),
      studentClass: rStudentClass,
      bookTitle: rBookTitle.trim(),
      author: rAuthor.trim() || 'Anonim',
      reviewText: rReviewText.trim(),
      ratingStars: rRatingStars,
      rank: 'Peserta',
    });

    setRStudentName('');
    setRBookTitle('');
    setRReviewText('');
    setShowAddReviewModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Program Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 text-white p-6 rounded-2xl shadow-md no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider backdrop-blur-xs">
              GERAKAN LITERASI SEKOLAH (GLS)
            </span>
            <h2 className="text-2xl font-black mt-2 tracking-tight">
              Program Literasi & Apresiasi Budaya Baca
            </h2>
            <p className="text-xs text-amber-100 mt-1">
              Perpustakaan MEKAR SMPN 2 Pemalang: Membaca 15 Menit, Lomba Resensi, Duta Literasi & Pojok Baca
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddJournalModal(true)}
              className="px-4 py-2 bg-white text-orange-900 rounded-xl font-bold text-xs shadow-md hover:bg-amber-50 cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} />
              <span>Isi Jurnal 15 Menit</span>
            </button>
            <button
              onClick={() => setShowAddReviewModal(true)}
              className="px-4 py-2 bg-amber-400 text-amber-950 rounded-xl font-bold text-xs shadow-md hover:bg-amber-300 cursor-pointer flex items-center gap-1.5"
            >
              <Award size={15} />
              <span>Kirim Resensi Buku</span>
            </button>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/20">
          <button
            onClick={() => setActiveTab('15menit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === '15menit'
                ? 'bg-white text-orange-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Gerakan Membaca 15 Menit ({literacyJournals.length})
          </button>
          <button
            onClick={() => setActiveTab('lomba')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'lomba'
                ? 'bg-white text-orange-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Lomba Resensi Buku ({contestEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('duta')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'duta'
                ? 'bg-white text-orange-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Duta Literasi Sekolah ({ambassadors.length})
          </button>
          <button
            onClick={() => setActiveTab('pojok_baca')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pojok_baca'
                ? 'bg-white text-orange-900 shadow-xs'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Pojok Baca Ruang Kelas ({readingCorners.length})
          </button>
        </div>
      </div>

      {/* 1. GERAKAN MEMBACA 15 MENIT */}
      {activeTab === '15menit' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Jurnal Harian Membaca 15 Menit Sebelum Pembelajaran
              </h3>
              <p className="text-xs text-slate-500">
                Setiap siswa membaca buku non-pelajaran 15 menit setiap pagi dan mencatat intisari bacaan
              </p>
            </div>
            <button
              onClick={() => setShowAddJournalModal(true)}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg"
            >
              + Input Jurnal Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {literacyJournals.map((j) => (
              <div
                key={j.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{j.studentName}</h4>
                    <span className="text-[10px] text-slate-500">{j.studentClass} • NIS: {j.nis}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{j.date}</span>
                </div>

                <div>
                  <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <BookOpen size={14} />
                    <span>{j.bookTitle}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Karya: {j.author} | Halaman: {j.pagesRead}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 space-y-1">
                  <p className="font-medium">
                    <strong className="text-slate-900">Ringkasan:</strong> {j.summary}
                  </p>
                  <p className="text-amber-900 italic text-[11px]">
                    <strong>Nilai Karakter / Moral:</strong> "{j.moralValue}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  {j.teacherVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <CheckCircle size={14} />
                      <span>Terverifikasi Guru / Pustakawan</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => verifyLiteracyJournal(j.id)}
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 rounded text-[10px] font-bold cursor-pointer"
                    >
                      Beri Paraf / Verifikasi
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LOMBA RESENSI BUKU */}
      {activeTab === 'lomba' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Karya Lomba Resensi Buku & Bintang Literasi MEKAR
              </h3>
              <p className="text-xs text-slate-500">
                Ajang kompetisi mengulas dan mengapresiasi karya sastra & ilmiah populer
              </p>
            </div>
            <button
              onClick={() => setShowAddReviewModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-lg"
            >
              + Kirim Naskah Resensi
            </button>
          </div>

          <div className="space-y-4">
            {contestEntries.map((c) => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{c.studentName}</h4>
                      <span className="text-xs text-slate-500">({c.studentClass})</span>
                      {c.rank && c.rank !== 'Peserta' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] border border-amber-300 flex items-center gap-1">
                          <Crown size={12} className="text-amber-600" />
                          <span>{c.rank}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-800 font-bold mt-0.5">
                      Buku: "{c.bookTitle}" karya {c.author}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < c.ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
                      />
                    ))}
                    {c.score && (
                      <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded font-bold text-xs text-slate-800">
                        Nilai: {c.score}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed italic bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  "{c.reviewText}"
                </p>

                {c.feedback && (
                  <div className="text-[11px] text-slate-600 border-l-2 border-emerald-600 pl-3 py-1">
                    <strong>Catatan Dewan Juri:</strong> {c.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. DUTA LITERASI SEKOLAH */}
      {activeTab === 'duta' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ambassadors.map((amb) => (
              <div
                key={amb.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={amb.photoUrl}
                      alt={amb.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-amber-400 shadow-md"
                    />
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 font-black text-[10px] uppercase tracking-wide">
                        {amb.role}
                      </span>
                      <h3 className="font-black text-lg text-slate-900 mt-1">{amb.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {amb.classLevel} • Periode {amb.period}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Prestasi & Program:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{amb.achievements}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-lg">
                      <span className="text-[10px] text-emerald-800 block uppercase font-bold">Buku Favorit:</span>
                      <p className="font-bold text-emerald-950 mt-0.5">{amb.favoriteBook}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-3.5 text-center text-xs font-bold text-white">
                  "{amb.motto}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. POJOK BACA RUANG KELAS */}
      {activeTab === 'pojok_baca' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Monitoring & Penilaian Pojok Baca Ruang Kelas
              </h3>
              <p className="text-xs text-slate-500">
                Pemberdayaan sudut literasi di kelas VII, VIII, dan IX untuk mendekatkan buku ke siswa
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {readingCorners.map((rc) => (
              <div
                key={rc.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-slate-900">{rc.className}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      rc.status === 'Sangat Aktif'
                        ? 'bg-emerald-100 text-emerald-900'
                        : rc.status === 'Aktif'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {rc.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-xs text-emerald-800">{rc.cornerName}</h4>
                  <p className="text-[11px] text-slate-500">Wali Kelas: {rc.homeroomTeacher}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center pt-2 border-t border-slate-100">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <span className="text-[10px] text-slate-400 block">Koleksi:</span>
                    <strong className="text-sm font-bold text-slate-800">{rc.bookCount} Buku</strong>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <span className="text-[10px] text-amber-800 block">Skor:</span>
                    <strong className="text-sm font-black text-amber-950">{rc.score} / 100</strong>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 text-right">
                  Inspeksi terakhir: {rc.lastInspected}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Input Jurnal Membaca 15 Menit */}
      {showAddJournalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 bg-orange-800 text-white -m-6 p-5 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">Jurnal Membaca 15 Menit Siswa</h3>
                <p className="text-xs text-orange-200">Catat pengalaman membaca sebelum kegiatan belajar</p>
              </div>
              <button
                onClick={() => setShowAddJournalModal(false)}
                className="text-orange-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveJournal} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Siswa</label>
                  <input
                    type="text"
                    required
                    value={jStudentName}
                    onChange={(e) => setJStudentName(e.target.value)}
                    placeholder="Nama lengkap siswa"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <select
                    value={jStudentClass}
                    onChange={(e) => setJStudentClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Kelas VII.A">Kelas VII.A</option>
                    <option value="Kelas VII.B">Kelas VII.B</option>
                    <option value="Kelas VIII.A">Kelas VIII.A</option>
                    <option value="Kelas VIII.B">Kelas VIII.B</option>
                    <option value="Kelas IX.A">Kelas IX.A</option>
                    <option value="Kelas IX.B">Kelas IX.B</option>
                    <option value="Kelas IX.C">Kelas IX.C</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Buku</label>
                  <input
                    type="text"
                    required
                    value={jBookTitle}
                    onChange={(e) => setJBookTitle(e.target.value)}
                    placeholder="Judul buku non-pelajaran"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Halaman Dibaca</label>
                  <input
                    type="text"
                    value={jPagesRead}
                    onChange={(e) => setJPagesRead(e.target.value)}
                    placeholder="Contoh: Hal. 25 - 45"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ringkasan Inti Cerita / Pokok Pikiran</label>
                <textarea
                  rows={3}
                  required
                  value={jSummary}
                  onChange={(e) => setJSummary(e.target.value)}
                  placeholder="Tuliskan isi buku yang telah dibaca hari ini secara ringkas..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pesan Moral / Nilai Karakter</label>
                <input
                  type="text"
                  required
                  value={jMoralValue}
                  onChange={(e) => setJMoralValue(e.target.value)}
                  placeholder="Hikmah atau keteladanan yang dapat dicontoh..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddJournalModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg"
                >
                  Simpan Jurnal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Kirim Naskah Resensi */}
      {showAddReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 bg-amber-800 text-white -m-6 p-5 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">Kirim Ulasan / Resensi Buku</h3>
                <p className="text-xs text-amber-200">Ajang Bintang Literasi Perpustakaan MEKAR</p>
              </div>
              <button
                onClick={() => setShowAddReviewModal(false)}
                className="text-amber-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveReview} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Siswa</label>
                  <input
                    type="text"
                    required
                    value={rStudentName}
                    onChange={(e) => setRStudentName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={rStudentClass}
                    onChange={(e) => setRStudentClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Judul Buku yang Diulas</label>
                  <input
                    type="text"
                    required
                    value={rBookTitle}
                    onChange={(e) => setRBookTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pengarang</label>
                  <input
                    type="text"
                    value={rAuthor}
                    onChange={(e) => setRAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Teks Resensi / Ulasan Buku</label>
                <textarea
                  rows={4}
                  required
                  value={rReviewText}
                  onChange={(e) => setRReviewText(e.target.value)}
                  placeholder="Ulas mengenai kelebihan buku, pesan penulis, dan daya tarik bagi pembaca..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddReviewModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                >
                  Kirim Resensi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
