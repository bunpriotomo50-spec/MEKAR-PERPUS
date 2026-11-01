import React, { useState, useRef } from 'react';
import { useLibrary } from '../../context/LibraryContext';
import { Member, MemberType } from '../../types/library';
import {
  downloadMemberExcelTemplate,
  parseMemberExcelFile,
  exportMembersToExcel,
} from '../../utils/excelHelper';
import { MemberCard } from '../MemberCard';
import { OfficialKopSurat } from '../OfficialKopSurat';
import {
  Users,
  Plus,
  FileSpreadsheet,
  Upload,
  Download,
  Printer,
  Search,
  UserCheck,
  CreditCard,
  History,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle,
  Camera,
  User,
  ShieldCheck,
  FileDown,
  Loader2,
} from 'lucide-react';
import { exportElementToPdf, triggerPrintWithIframe } from '../../utils/pdfGenerator';

export const MembershipModule: React.FC = () => {
  const {
    members,
    loans,
    visitors,
    addMember,
    addMembersBatch,
    updateMember,
    deleteMember,
    schoolInfo,
    updateSchoolInfo,
  } = useLibrary();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMemberForCard, setSelectedMemberForCard] = useState<Member | null>(null);
  const [showBatchCardModal, setShowBatchCardModal] = useState(false);
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showHeadModal, setShowHeadModal] = useState(false);

  // Upload feedback
  const [uploadFeedback, setUploadFeedback] = useState<{ error?: string; success?: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cards PDF export
  const cardsPrintRef = useRef<HTMLDivElement>(null);
  const [isExportingCardsPdf, setIsExportingCardsPdf] = useState(false);

  const handleDownloadCardsPdf = async () => {
    if (!cardsPrintRef.current) return;
    setIsExportingCardsPdf(true);
    try {
      await exportElementToPdf(cardsPrintRef.current, {
        filename: `Kartu_Anggota_Perpustakaan_SMPN2_Pemalang_${new Date().toISOString().split('T')[0]}.pdf`,
      });
    } catch (e) {
      console.error(e);
      handlePrintCardsDirect();
    } finally {
      setIsExportingCardsPdf(false);
    }
  };

  const handlePrintCardsDirect = () => {
    if (cardsPrintRef.current) {
      triggerPrintWithIframe(cardsPrintRef.current, 'Kartu Anggota Perpustakaan MEKAR SMPN 2 Pemalang');
    } else {
      window.print();
    }
  };

  // Form State
  const [formType, setFormType] = useState<MemberType>('Siswa');
  const [formName, setFormName] = useState('');
  const [formIdNumber, setFormIdNumber] = useState('');
  const [formClassOrSubject, setFormClassOrSubject] = useState('Kelas VII.A');
  const [formGender, setFormGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('Pemalang');
  const [formPhotoUrl, setFormPhotoUrl] = useState<string>('');

  // Head of Library state for modal
  const [headName, setHeadName] = useState(schoolInfo.headOfLibrary);
  const [headNip, setHeadNip] = useState(schoolInfo.headOfLibraryNip);
  const [headmasterName, setHeadmasterName] = useState(schoolInfo.headmaster);
  const [headmasterNip, setHeadmasterNip] = useState(schoolInfo.headmasterNip);
  const [dinasNameInput, setDinasNameInput] = useState(schoolInfo.dinasName || 'DINAS PENDIDIKAN PEMUDA, DAN OLAHRAGA');
  const [headSavedFeedback, setHeadSavedFeedback] = useState(false);

  // Photo file input handler
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (isEdit) {
        if (editingMember) {
          setEditingMember({ ...editingMember, photoUrl: dataUrl });
        }
      } else {
        setFormPhotoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Filtered Members
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.memberCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.idNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.classOrSubject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  // Handle Excel Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFeedback(null);
    try {
      const parsed = await parseMemberExcelFile(file, members.length);
      if (parsed.length === 0) {
        setUploadFeedback({ error: 'Tidak ada data anggota valid dalam file Excel tersebut.' });
        return;
      }
      addMembersBatch(parsed);
      setUploadFeedback({
        success: `Berhasil menambahkan ${parsed.length} anggota baru beserta nomor identitas dan barcode anggota!`,
      });
      setTimeout(() => setUploadFeedback(null), 5000);
    } catch (err: any) {
      setUploadFeedback({ error: `Gagal membaca file Excel: ${err.message}` });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Manual Add
  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formIdNumber.trim()) return;

    addMember({
      type: formType,
      name: formName.trim(),
      idNumber: formIdNumber.trim(),
      classOrSubject: formClassOrSubject.trim(),
      gender: formGender,
      phone: formPhone.trim() || '-',
      email: formEmail.trim() || undefined,
      address: formAddress.trim() || 'Pemalang',
      photoUrl: formPhotoUrl.trim() || undefined,
    });

    setFormName('');
    setFormIdNumber('');
    setFormPhone('');
    setFormEmail('');
    setFormPhotoUrl('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Header & Actions */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <Users size={20} />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Sistem Keanggotaan Perpustakaan
                </h2>
                <p className="text-xs text-slate-500">
                  Data Siswa, Guru & Tenaga Kependidikan • Pas Foto Kartu, Cetak Kartu Anggota & TTD Kepala Perpustakaan
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setHeadName(schoolInfo.headOfLibrary);
                setHeadNip(schoolInfo.headOfLibraryNip);
                setHeadmasterName(schoolInfo.headmaster);
                setHeadmasterNip(schoolInfo.headmasterNip);
                setShowHeadModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
              title="Ubah nama Kepala Perpustakaan & Kepala Sekolah untuk tanda tangan kartu anggota dan laporan resmi"
            >
              <ShieldCheck size={15} />
              <span>Ganti Kepala Perpustakaan</span>
            </button>

            <button
              onClick={downloadMemberExcelTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Unduh format template Excel untuk impor massal anggota"
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
              onClick={() => exportMembersToExcel(filteredMembers)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Download size={15} />
              <span>Unduh Excel</span>
            </button>

            <button
              onClick={() => setShowBatchCardModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
              title="Cetak kartu anggota massal"
            >
              <CreditCard size={15} />
              <span>Cetak Kartu Massal</span>
            </button>

            <button
              onClick={() => {
                setFormPhotoUrl('');
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>+ Tambah Anggota</span>
            </button>
          </div>
        </div>

        {/* Upload feedback */}
        {uploadFeedback?.success && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check size={16} />
            <span>{uploadFeedback.success}</span>
          </div>
        )}
        {uploadFeedback?.error && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{uploadFeedback.error}</span>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama, No Anggota, NISN/NIP, Kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:ring-2 focus:ring-teal-500"
            >
              <option value="ALL">Semua Jenis Anggota ({members.length})</option>
              <option value="Siswa">Siswa ({members.filter((m) => m.type === 'Siswa').length})</option>
              <option value="Guru">Guru ({members.filter((m) => m.type === 'Guru').length})</option>
              <option value="Tenaga Kependidikan">
                Tenaga Kependidikan ({members.filter((m) => m.type === 'Tenaga Kependidikan').length})
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Member Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Daftar Anggota: {filteredMembers.length} Orang
          </span>
          <span className="text-xs text-slate-500">
            Klik icon kartu untuk pratinjau dan mencetak kartu anggota perpustakaan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-800 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Kode Anggota</th>
                <th className="py-3 px-3">Nama & NISN/NIP</th>
                <th className="py-3 px-3">Tipe & Kelas/Mapel</th>
                <th className="py-3 px-3">Kontak & Alamat</th>
                <th className="py-3 px-3 text-center">Pinjaman Aktif</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-teal-900">
                    {member.memberCode}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        onClick={() => setEditingMember(member)}
                        title="Klik untuk ubah foto atau data anggota"
                        className="w-9 h-11 bg-slate-100 rounded-md border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center text-slate-400 cursor-pointer relative group hover:border-teal-500 shadow-2xs"
                      >
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={18} className="text-slate-300" />
                        )}
                        <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Camera size={13} />
                        </span>
                      </div>
                      <div>
                        <div
                          className="font-bold text-slate-900 hover:text-teal-800 cursor-pointer"
                          onClick={() => setEditingMember(member)}
                        >
                          {member.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          ID: {member.idNumber} ({member.gender})
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-0.5 ${
                        member.type === 'Guru'
                          ? 'bg-blue-100 text-blue-900'
                          : member.type === 'Siswa'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-purple-100 text-purple-900'
                      }`}
                    >
                      {member.type}
                    </span>
                    <div className="font-medium text-slate-700">{member.classOrSubject}</div>
                  </td>

                  <td className="py-3 px-3 text-[11px]">
                    <div className="text-slate-800 font-medium">WA: {member.phone}</div>
                    <div className="text-slate-500 truncate max-w-xs">{member.address}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                        member.activeLoansCount > 0
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {member.activeLoansCount} Buku
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {member.status}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedMemberForCard(member)}
                        title="Cetak Kartu Anggota Ini"
                        className="p-1.5 text-teal-700 hover:bg-teal-50 rounded-md transition-colors"
                      >
                        <CreditCard size={15} />
                      </button>
                      <button
                        onClick={() => setSelectedMemberForHistory(member)}
                        title="Riwayat Aktivitas & Pinjaman"
                        className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <History size={15} />
                      </button>
                      <button
                        onClick={() => setEditingMember(member)}
                        title="Edit Anggota"
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus anggota ${member.name}?`)) {
                            deleteMember(member.id);
                          }
                        }}
                        title="Hapus Anggota"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah Anggota Manual */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 bg-teal-900 text-white -m-6 p-5 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">Pendaftaran Anggota Perpustakaan</h3>
                <p className="text-xs text-teal-200">
                  Kode Anggota dan Barcode kartu akan dibuat secara otomatis
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-teal-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Anggota</label>
                  <select
                    value={formType}
                    onChange={(e) => {
                      const t = e.target.value as MemberType;
                      setFormType(t);
                      if (t === 'Siswa') setFormClassOrSubject('Kelas VII.A');
                      else if (t === 'Guru') setFormClassOrSubject('Guru Mata Pelajaran');
                      else setFormClassOrSubject('Staf Administrasi');
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Siswa">Siswa</option>
                    <option value="Guru">Guru</option>
                    <option value="Tenaga Kependidikan">Tenaga Kependidikan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {formType === 'Siswa' ? 'NISN / NIS' : 'NIP / NUPTK'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formIdNumber}
                    onChange={(e) => setFormIdNumber(e.target.value)}
                    placeholder={formType === 'Siswa' ? '0098765...' : '197805...'}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Aditya Pratama Nugraha"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {formType === 'Siswa' ? 'Kelas' : 'Jabatan / Mapel'}
                  </label>
                  <input
                    type="text"
                    value={formClassOrSubject}
                    onChange={(e) => setFormClassOrSubject(e.target.value)}
                    placeholder="Contoh: Kelas VIII.B"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="081234..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email (Opsional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@smpn2pemalang.sch.id"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Tempat Tinggal</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  placeholder="Jl. Pemuda No..., Mulyoharjo, Pemalang"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Upload Pas Foto */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800">
                  Pas Foto Anggota (Untuk Dicetak pada Kartu)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-18 bg-white rounded-md border-2 border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    {formPhotoUrl ? (
                      <img src={formPhotoUrl} alt="Preview Foto" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFileChange(e, false)}
                      className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Pilih file foto siswa/guru dari komputer (format JPG, PNG). Foto akan otomatis muncul pada kartu anggota.
                    </p>
                    {formPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormPhotoUrl('')}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Hapus Foto Terpilih
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CETAK KARTU ANGGOTA TUNGGAL (Print PDF Ready) */}
      {selectedMemberForCard && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-300">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Kartu Anggota Perpustakaan: {selectedMemberForCard.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Sisi Depan (Identitas & Barcode) & Sisi Belakang (Tata Tertib & TTD Kepala Perpustakaan)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer size={15} />
                  <span>Cetak Kartu (PDF)</span>
                </button>
                <button
                  onClick={() => setSelectedMemberForCard(null)}
                  className="text-slate-400 hover:text-slate-700 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="py-6 print-container">
              <MemberCard member={selectedMemberForCard} />
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CETAK KARTU ANGGOTA MASSAL (PRINT SHEET) */}
      {showBatchCardModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-300">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between rounded-t-2xl no-print">
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-400" />
                  <span>Cetak Kartu Anggota Massal ({filteredMembers.length} Anggota)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  Tata letak otomatis siap cetak A4 / lembar ID Card
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCardsPdf}
                  disabled={isExportingCardsPdf}
                  className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60"
                  title="Unduh seluruh kartu anggota dalam file PDF"
                >
                  {isExportingCardsPdf ? (
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
                  onClick={handlePrintCardsDirect}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Cetak langsung ke printer"
                >
                  <Printer size={14} />
                  <span>Cetak Printer</span>
                </button>

                <button
                  onClick={() => setShowBatchCardModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div ref={cardsPrintRef} className="p-6 overflow-y-auto flex-1 bg-slate-100 print-container space-y-6">
              <div className="print-only">
                <OfficialKopSurat
                  documentTitle="LEMBAR CETAK KARTU ANGGOTA PERPUSTAKAAN MEKAR"
                  documentSubtitle="SMP NEGERI 2 PEMALANG - TAHUN AJARAN 2026/2027"
                />
              </div>

              <div className="space-y-6">
                {filteredMembers.map((mem) => (
                  <div key={mem.id} className="bg-white p-3 rounded-xl shadow-xs border border-slate-200">
                    <MemberCard member={mem} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RIWAYAT AKTIVITAS ANGGOTA */}
      {selectedMemberForHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <History className="text-teal-700" size={18} />
                  <span>Riwayat Aktivitas: {selectedMemberForHistory.name}</span>
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedMemberForHistory.memberCode} • {selectedMemberForHistory.classOrSubject}
                </p>
              </div>
              <button
                onClick={() => setSelectedMemberForHistory(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {/* Circulation History for this member */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Riwayat Peminjaman Buku</h4>
                {loans.filter((l) => l.memberId === selectedMemberForHistory.id).length === 0 ? (
                  <p className="text-slate-400 italic">Belum ada catatan peminjaman buku.</p>
                ) : (
                  <div className="space-y-2">
                    {loans
                      .filter((l) => l.memberId === selectedMemberForHistory.id)
                      .map((loan) => (
                        <div
                          key={loan.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{loan.bookTitle}</div>
                            <div className="text-[10px] text-slate-500">
                              Pinjam: {loan.loanDate} • Jatuh Tempo: {loan.dueDate}
                              {loan.returnDate && ` • Kembali: ${loan.returnDate}`}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              loan.status === 'Kembali'
                                ? 'bg-emerald-100 text-emerald-800'
                                : loan.status === 'Terlambat'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {loan.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Attendance visits for this member */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Riwayat Kunjungan Perpustakaan</h4>
                {visitors.filter((v) => v.name.toLowerCase() === selectedMemberForHistory.name.toLowerCase())
                  .length === 0 ? (
                  <p className="text-slate-400 italic">Belum ada catatan kunjungan di buku tamu.</p>
                ) : (
                  <div className="space-y-2">
                    {visitors
                      .filter((v) => v.name.toLowerCase() === selectedMemberForHistory.name.toLowerCase())
                      .map((vis) => (
                        <div
                          key={vis.id}
                          className="p-2.5 bg-teal-50/50 border border-teal-200 rounded-lg flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{vis.purpose}</span>
                            {vis.bookReadOnSite && (
                              <div className="text-[10px] text-teal-800">
                                Membaca: "{vis.bookReadOnSite}"
                              </div>
                            )}
                          </div>
                          <span className="font-mono text-slate-500 text-[10px]">
                            {vis.date} pukul {vis.time} WIB
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 mt-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMemberForHistory(null)}
                className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DATA & PAS FOTO ANGGOTA */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 bg-teal-900 text-white -m-6 p-5 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-base">Edit Data & Pas Foto Anggota</h3>
                <p className="text-xs text-teal-200 font-mono">
                  {editingMember.memberCode} • {editingMember.type}
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-teal-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 pt-2">
              {/* Photo Upload & Preview Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block font-bold text-slate-800">
                  Pas Foto Anggota (Tampil pada Kartu Cetak)
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-20 bg-white rounded-md border-2 border-slate-300 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                    {editingMember.photoUrl ? (
                      <img
                        src={editingMember.photoUrl}
                        alt={editingMember.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={32} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFileChange(e, true)}
                      className="text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-700 file:text-white hover:file:bg-teal-800 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-500">
                      Pilih pas foto baru (format JPG / PNG).
                    </p>
                    {editingMember.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setEditingMember({ ...editingMember, photoUrl: undefined })}
                        className="text-[10px] text-rose-600 hover:underline font-semibold"
                      >
                        Hapus Foto Ini
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingMember.type === 'Siswa' ? 'NISN / NIS' : 'NIP / NUPTK'}
                  </label>
                  <input
                    type="text"
                    value={editingMember.idNumber}
                    onChange={(e) => setEditingMember({ ...editingMember, idNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {editingMember.type === 'Siswa' ? 'Kelas' : 'Jabatan / Mapel'}
                  </label>
                  <input
                    type="text"
                    value={editingMember.classOrSubject}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, classOrSubject: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    value={editingMember.phone}
                    onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Keanggotaan</label>
                  <select
                    value={editingMember.status}
                    onChange={(e) =>
                      setEditingMember({ ...editingMember, status: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Alamat Rumah</label>
                <input
                  type="text"
                  value={editingMember.address}
                  onChange={(e) => setEditingMember({ ...editingMember, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateMember(editingMember.id, editingMember);
                    setEditingMember(null);
                  }}
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: GANTI NAMA KEPALA PERPUSTAKAAN & KEPALA SEKOLAH */}
      {showHeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4 bg-indigo-950 text-white -m-6 p-5 rounded-t-2xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-800 flex items-center justify-center text-amber-300 shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Ganti Nama Kepala Perpustakaan</h3>
                  <p className="text-xs text-indigo-200">
                    Otomatis terpasang pada TTD Kartu Anggota dan Laporan Resmi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHeadModal(false)}
                className="text-indigo-300 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSchoolInfo({
                  dinasName: dinasNameInput.trim(),
                  headOfLibrary: headName.trim(),
                  headOfLibraryNip: headNip.trim(),
                  headmaster: headmasterName.trim(),
                  headmasterNip: headmasterNip.trim(),
                });
                setHeadSavedFeedback(true);
                setTimeout(() => {
                  setHeadSavedFeedback(false);
                  setShowHeadModal(false);
                }, 1500);
              }}
              className="space-y-4 pt-2"
            >
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                  Instansi / Dinas Pembina (Kop Surat Resmi)
                </label>
                <input
                  type="text"
                  required
                  value={dinasNameInput}
                  onChange={(e) => setDinasNameInput(e.target.value)}
                  placeholder="DINAS PENDIDIKAN PEMUDA, DAN OLAHRAGA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900 text-xs"
                />
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wide">
                  Pejabat Kepala Perpustakaan MEKAR
                </h4>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Kepala Perpustakaan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={headName}
                    onChange={(e) => setHeadName(e.target.value)}
                    placeholder="Contoh: Siti Rahmawati, S.Pd., M.A."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIP Kepala Perpustakaan
                  </label>
                  <input
                    type="text"
                    value={headNip}
                    onChange={(e) => setHeadNip(e.target.value)}
                    placeholder="19820310 200801 2 015"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Pejabat Kepala Sekolah (SMPN 2 Pemalang)
                </h4>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar Kepala Sekolah <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={headmasterName}
                    onChange={(e) => setHeadmasterName(e.target.value)}
                    placeholder="Contoh: Drs. H. Sukarno, M.Pd."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    NIP Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={headmasterNip}
                    onChange={(e) => setHeadmasterNip(e.target.value)}
                    placeholder="19750814 200003 1 002"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              {headSavedFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 font-bold flex items-center gap-2">
                  <Check size={16} />
                  <span>Data pejabat berhasil disimpan dan langsung diterapkan ke seluruh kartu dan dokumen!</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowHeadModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-800 hover:bg-indigo-900 text-white font-bold rounded-lg shadow-sm"
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
