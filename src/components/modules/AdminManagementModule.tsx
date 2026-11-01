import React, { useState } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { SCHOOL_INFO, BudgetLog } from '../../types/library';
import { OfficialKopSurat } from '../OfficialKopSurat';
import {
  Building2,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Award,
  CheckCircle2,
  Briefcase,
  Plus,
  Shield,
  FileSpreadsheet,
  Printer,
  X,
} from 'lucide-react';

export const AdminManagementModule: React.FC = () => {
  const { staffDuties, annualPlans, budgetLogs, addBudgetLog, updateAnnualPlanStatus, schoolInfo, updateSchoolInfo } = useLibrary();

  // Sub Tab: 'struktur' | 'tugas' | 'proker' | 'jadwal' | 'anggaran' | 'evaluasi'
  const [activeTab, setActiveTab] = useState<'struktur' | 'tugas' | 'proker' | 'jadwal' | 'anggaran' | 'evaluasi'>('struktur');

  // Head of Library & Headmaster Edit Modal
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [tempHeadOfLib, setTempHeadOfLib] = useState(schoolInfo.headOfLibrary);
  const [tempHeadOfLibNip, setTempHeadOfLibNip] = useState(schoolInfo.headOfLibraryNip);
  const [tempHeadmaster, setTempHeadmaster] = useState(schoolInfo.headmaster);
  const [tempHeadmasterNip, setTempHeadmasterNip] = useState(schoolInfo.headmasterNip);
  const [tempDinasName, setTempDinasName] = useState(schoolInfo.dinasName || 'DINAS PENDIDIKAN PEMUDA, DAN OLAHRAGA');

  // Budget Modal
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [bType, setBType] = useState<'Pemasukan' | 'Pengeluaran'>('Pengeluaran');
  const [bCategory, setBCategory] = useState<BudgetLog['category']>('Pembelian Buku Baru');
  const [bAmount, setBAmount] = useState<number>(500000);
  const [bDescription, setBDescription] = useState('');
  const [bReceipt, setBReceipt] = useState('');

  const totalIn = budgetLogs.filter((b) => b.type === 'Pemasukan').reduce((acc, b) => acc + b.amount, 0);
  const totalOut = budgetLogs.filter((b) => b.type === 'Pengeluaran').reduce((acc, b) => acc + b.amount, 0);
  const balance = totalIn - totalOut;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bDescription.trim() || bAmount <= 0) return;

    addBudgetLog({
      type: bType,
      category: bCategory,
      amount: bAmount,
      description: bDescription.trim(),
      receiptNumber: bReceipt.trim() || `KWT/${Date.now().toString().slice(-6)}`,
    });

    setBDescription('');
    setBReceipt('');
    setShowAddBudgetModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-slate-100 text-slate-800">
                <Briefcase size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Sistem Administrasi dan Tata Kelola Manajemen
                </h2>
                <p className="text-xs text-slate-500">
                  Struktur Organisasi, Pembagian Tugas, Program Kerja, Jadwal Layanan & Anggaran BOS
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              <Printer size={14} />
              <span>Cetak Dokumen Manajemen (PDF)</span>
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setActiveTab('struktur')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'struktur' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Struktur Organisasi
          </button>
          <button
            onClick={() => setActiveTab('tugas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tugas' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pembagian Tugas Petugas
          </button>
          <button
            onClick={() => setActiveTab('proker')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'proker' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Program Kerja Tahunan ({annualPlans.length})
          </button>
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'jadwal' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Jadwal Pelayanan
          </button>
          <button
            onClick={() => setActiveTab('anggaran')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'anggaran' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Pengelolaan Anggaran ({budgetLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('evaluasi')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'evaluasi' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Evaluasi & Kinerja
          </button>
        </div>
      </div>

      {/* 1. STRUKTUR ORGANISASI */}
      {activeTab === 'struktur' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto mb-6">
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center p-1 bg-white rounded-xl shadow-xs border border-slate-200">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SMP Negeri 2 Pemalang"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800">
              BAGAN STRUKTUR ORGANISASI
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              {SCHOOL_INFO.libraryName} {SCHOOL_INFO.name}
            </h3>
            <p className="text-xs text-slate-500">
              Tahun Ajaran 2026/2027 • SK Kepala Sekolah Nomor: 800/012/SMPN2PML/2026
            </p>
            <div className="mt-3">
              <button
                onClick={() => {
                  setTempDinasName(schoolInfo.dinasName || 'DINAS PENDIDIKAN PEMUDA, DAN OLAHRAGA');
                  setTempHeadOfLib(schoolInfo.headOfLibrary);
                  setTempHeadOfLibNip(schoolInfo.headOfLibraryNip);
                  setTempHeadmaster(schoolInfo.headmaster);
                  setTempHeadmasterNip(schoolInfo.headmasterNip);
                  setShowHeadModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Shield size={14} />
                <span>Ganti Nama Kepala Perpustakaan & Pejabat</span>
              </button>
            </div>
          </div>

          {/* Hierarchy Chart */}
          <div className="flex flex-col items-center space-y-6">
            {/* Top Node: Kepala Sekolah */}
            <div className="w-72 bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-4 rounded-xl text-center shadow-md border-2 border-emerald-950">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">Penanggung Jawab</span>
              <h4 className="font-bold text-sm mt-0.5">{schoolInfo.headmaster}</h4>
              <p className="text-[10px] text-emerald-200">Kepala SMPN 2 Pemalang</p>
              <p className="text-[9px] text-emerald-300 font-mono mt-0.5">NIP. {schoolInfo.headmasterNip}</p>
            </div>

            <div className="w-0.5 h-6 bg-slate-300"></div>

            {/* Second Node: Kepala Perpustakaan */}
            <div className="w-80 bg-gradient-to-r from-teal-800 to-emerald-900 text-white p-4 rounded-xl text-center shadow-md border-2 border-teal-950">
              <span className="text-[10px] uppercase font-bold text-amber-300 block">Kepala Perpustakaan MEKAR</span>
              <h4 className="font-bold text-sm mt-0.5">{schoolInfo.headOfLibrary}</h4>
              <p className="text-[10px] text-teal-200">Koordinator Teknis & Program Literasi</p>
              <p className="text-[9px] text-teal-300 font-mono mt-0.5">NIP. {schoolInfo.headOfLibraryNip}</p>
            </div>

            <div className="w-0.5 h-6 bg-slate-300"></div>

            {/* Sub-divisions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl">
              <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">
                  Layanan Sirkulasi & IT
                </span>
                <h5 className="font-bold text-xs text-slate-900 mt-1">
                  Bambang Tri Atmojo, S.I.Pust.
                </h5>
                <p className="text-[10px] text-slate-500">Otomasi & Peminjaman</p>
              </div>

              <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">
                  Pengolahan & Perawatan
                </span>
                <h5 className="font-bold text-xs text-slate-900 mt-1">
                  Nur Aini, A.Md.
                </h5>
                <p className="text-[10px] text-slate-500">Klasifikasi DDC & Barcoding</p>
              </div>

              <div className="bg-slate-50 border border-slate-300 p-4 rounded-xl text-center">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">
                  Pembina Gerakan Literasi
                </span>
                <h5 className="font-bold text-xs text-slate-900 mt-1">
                  Agus Triyono, S.Pd. & Guru Bahasa
                </h5>
                <p className="text-[10px] text-slate-500">Jurnal Membaca & Duta Literasi</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PEMBAGIAN TUGAS PETUGAS */}
      {activeTab === 'tugas' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">
              Rincian Pembagian Tugas & Tanggung Jawab Petugas Perpustakaan
            </h3>
          </div>
          <div className="p-4 space-y-4">
            {staffDuties.map((duty) => (
              <div
                key={duty.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{duty.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                      {duty.position}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">NIP: {duty.nip}</p>
                  <p className="text-slate-700 mt-2 font-medium leading-relaxed">
                    <strong>Tugas Utama:</strong> {duty.roleDescription}
                  </p>
                </div>
                <div className="shrink-0 text-slate-600 sm:text-right border-t sm:border-t-0 sm:border-l border-slate-200 sm:pl-4 pt-2 sm:pt-0">
                  <div className="font-bold text-slate-800">Jadwal Tugas:</div>
                  <div className="text-[11px] text-emerald-800 font-medium">{duty.schedule}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Kontak: {duty.contact}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PROGRAM KERJA TAHUNAN */}
      {activeTab === 'proker' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">
              Program Kerja Tahunan Perpustakaan MEKAR Tahun 2026/2027
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Nama Program Kerja</th>
                  <th className="py-3 px-3">Bidang / Kategori</th>
                  <th className="py-3 px-3">Target Waktu</th>
                  <th className="py-3 px-3 text-right">Alokasi Anggaran</th>
                  <th className="py-3 px-3">Penanggung Jawab</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {annualPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{plan.programName}</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{plan.category}</td>
                    <td className="py-3 px-3 font-mono">{plan.targetTimeline}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      Rp {plan.budgetAllocated.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3">{plan.personInCharge}</td>
                    <td className="py-3 px-3 text-center">
                      <select
                        value={plan.status}
                        onChange={(e) =>
                          updateAnnualPlanStatus(plan.id, e.target.value as any)
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          plan.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : plan.status === 'Sedang Berjalan'
                            ? 'bg-blue-100 text-blue-900 border-blue-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="Selesai">Selesai</option>
                        <option value="Sedang Berjalan">Sedang Berjalan</option>
                        <option value="Direncanakan">Direncanakan</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. JADWAL PELAYANAN */}
      {activeTab === 'jadwal' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Clock className="text-emerald-700" size={18} />
              <span>Jam Buka Pelayanan Perpustakaan</span>
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800">Senin s/d Kamis:</span>
                <span className="font-mono font-bold text-emerald-800">07.00 - 14.30 WIB</span>
              </li>
              <li className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800">Jumat:</span>
                <span className="font-mono font-bold text-emerald-800">07.00 - 11.30 WIB</span>
              </li>
              <li className="flex justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-800">Sabtu:</span>
                <span className="font-mono font-bold text-emerald-800">07.00 - 13.00 WIB</span>
              </li>
              <li className="flex justify-between p-3 bg-rose-50 rounded-xl text-rose-800">
                <span className="font-bold">Minggu & Hari Libur Nasional:</span>
                <span className="font-bold">TUTUP</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 text-xs">
            <h3 className="font-bold text-base text-slate-900">
              SOP Layanan Sirkulasi & Ruang Baca
            </h3>
            <ol className="list-decimal pl-4 space-y-2 text-slate-600 leading-relaxed">
              <li>Pengunjung wajib mengisi Buku Tamu Digital di pintu masuk.</li>
              <li>Membawa tas atau jaket disimpan pada loker penitipan yang disediakan.</li>
              <li>Peminjaman buku wajib menunjukkan Kartu Anggota Perpustakaan SMPN 2 Pemalang.</li>
              <li>Menjaga ketenangan, kebersihan, dan dilarang makan/minum di ruang koleksi.</li>
              <li>Pengembalian buku melewati jatuh tempo dikenakan denda sesuai peraturan sekolah.</li>
            </ol>
          </div>
        </div>
      )}

      {/* 5. PENGELOLAAN ANGGARAN & BOS */}
      {activeTab === 'anggaran' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[11px] text-emerald-800 font-bold block">Total Pemasukan:</span>
              <strong className="text-lg font-black text-emerald-950">
                Rp {totalIn.toLocaleString('id-ID')}
              </strong>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-[11px] text-rose-800 font-bold block">Total Pengeluaran:</span>
              <strong className="text-lg font-black text-rose-950">
                Rp {totalOut.toLocaleString('id-ID')}
              </strong>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl">
              <span className="text-[11px] text-slate-600 font-bold block">Saldo Kas Perpustakaan:</span>
              <strong className="text-lg font-black text-slate-900">
                Rp {balance.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">
                Buku Kas Umum Perpustakaan (Dana BOS & Denda)
              </h3>
              <button
                onClick={() => setShowAddBudgetModal(true)}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg"
              >
                + Tambah Transaksi Kas
              </button>
            </div>

            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3">Tanggal & Bukti</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Uraian Transaksi</th>
                  <th className="py-3 px-3 text-right">Pemasukan</th>
                  <th className="py-3 px-3 text-right">Pengeluaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {budgetLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono">
                      <div>{log.date}</div>
                      <div className="text-[10px] text-slate-400">{log.receiptNumber}</div>
                    </td>
                    <td className="py-3 px-3 font-bold">
                      {log.category}
                    </td>
                    <td className="py-3 px-3">{log.description}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      {log.type === 'Pemasukan' ? `Rp ${log.amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                      {log.type === 'Pengeluaran' ? `Rp ${log.amount.toLocaleString('id-ID')}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. EVALUASI DAN LAPORAN KINERJA */}
      {activeTab === 'evaluasi' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="font-bold text-base text-slate-900">
              Evaluasi Kinerja dan Akreditasi Perpustakaan Sekolah
            </h3>
            <p className="text-xs text-slate-500">
              Indikator Standar Nasional Perpustakaan (SNP) SMP Negeri 2 Pemalang
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-emerald-800">Standar Koleksi</span>
              <h4 className="font-black text-sm text-emerald-950 mt-1">Tercapai 94%</h4>
              <p className="text-slate-600 mt-1">
                Koleksi buku teks Kurikulum Merdeka dan buku non-teks memenuhi rasio kecukupan siswa.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-blue-800">Standar Sarana & IT</span>
              <h4 className="font-black text-sm text-blue-950 mt-1">Tercapai 90%</h4>
              <p className="text-slate-600 mt-1">
                Sistem katalog OPAC online, barcode inventaris digital, dan buku tamu otomatis telah berjalan.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-amber-800">Standar Pelayanan</span>
              <h4 className="font-black text-sm text-amber-950 mt-1">Tercapai 96%</h4>
              <p className="text-slate-600 mt-1">
                Sirkulasi peminjaman cepat dan gerakan literasi membaca 15 menit berjalan teratur.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Transaksi Kas */}
      {showAddBudgetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 bg-emerald-900 text-white -m-6 p-5 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">Catat Transaksi Kas Perpustakaan</h3>
                <p className="text-xs text-emerald-200">BOS Perpustakaan, Kas Denda, Pengadaan</p>
              </div>
              <button
                onClick={() => setShowAddBudgetModal(false)}
                className="text-emerald-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Transaksi</label>
                  <select
                    value={bType}
                    onChange={(e) => setBType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Pengeluaran">Pengeluaran</option>
                    <option value="Pemasukan">Pemasukan</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={bCategory}
                    onChange={(e) => setBCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Dana BOS Perpustakaan">Dana BOS</option>
                    <option value="Denda Buku">Denda Buku</option>
                    <option value="Pembelian Buku Baru">Pembelian Buku Baru</option>
                    <option value="Perawatan / Jilid Buku">Perawatan / Jilid</option>
                    <option value="Pengadaan ATK & Barcode">Pengadaan ATK & Barcode</option>
                    <option value="Hadiah Lomba Literasi">Hadiah Lomba Literasi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nominal (Rupiah)</label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={bAmount}
                  onChange={(e) => setBAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Uraian Transaksi</label>
                <textarea
                  rows={2}
                  required
                  value={bDescription}
                  onChange={(e) => setBDescription(e.target.value)}
                  placeholder="Keterangan pembelian buku, belanja perlengkapan barcode..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Kuitansi / Nota</label>
                <input
                  type="text"
                  value={bReceipt}
                  onChange={(e) => setBReceipt(e.target.value)}
                  placeholder="Contoh: KWT-BOS/2026/04"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBudgetModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL GANTI KEPALA PERPUSTAKAAN & KEPALA SEKOLAH */}
      {showHeadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Shield size={18} className="text-amber-400" />
                  Pengaturan Pejabat & Tanda Tangan
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">
                  Berlaku otomatis di kartu anggota, lembar pengesahan, dan bagan organisasi
                </p>
              </div>
              <button
                onClick={() => setShowHeadModal(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSchoolInfo({
                  dinasName: tempDinasName.trim(),
                  headOfLibrary: tempHeadOfLib.trim(),
                  headOfLibraryNip: tempHeadOfLibNip.trim(),
                  headmaster: tempHeadmaster.trim(),
                  headmasterNip: tempHeadmasterNip.trim(),
                });
                setShowHeadModal(false);
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <span className="font-bold text-amber-950 text-[11px] uppercase tracking-wide block">
                  Instansi / Dinas Pembina (Kop Surat Resmi)
                </span>
                <input
                  type="text"
                  required
                  value={tempDinasName}
                  onChange={(e) => setTempDinasName(e.target.value)}
                  placeholder="DINAS PENDIDIKAN PEMUDA, DAN OLAHRAGA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
                <span className="font-bold text-teal-900 text-[11px] uppercase tracking-wide block">
                  Kepala Perpustakaan MEKAR (Penanda Tangan Kartu Anggota)
                </span>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Kepala Perpustakaan
                  </label>
                  <input
                    type="text"
                    required
                    value={tempHeadOfLib}
                    onChange={(e) => setTempHeadOfLib(e.target.value)}
                    placeholder="Contoh: Dra. Hj. Siti Rohmah, M.Pd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP Kepala Perpustakaan
                  </label>
                  <input
                    type="text"
                    value={tempHeadOfLibNip}
                    onChange={(e) => setTempHeadOfLibNip(e.target.value)}
                    placeholder="19780815 200501 2 008"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
                <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wide block">
                  Kepala Sekolah SMP Negeri 2 Pemalang (Penanggung Jawab)
                </span>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    required
                    value={tempHeadmaster}
                    onChange={(e) => setTempHeadmaster(e.target.value)}
                    placeholder="Contoh: Drs. H. Bambang Suwarno, M.Pd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={tempHeadmasterNip}
                    onChange={(e) => setTempHeadmasterNip(e.target.value)}
                    placeholder="19680512 199412 1 002"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHeadModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
