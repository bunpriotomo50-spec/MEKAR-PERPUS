import React, { useMemo } from 'react';
import { Member } from '../types/library';
import { useLibrary } from '../context/LibraryContext';
import { generateCode39Svg } from '../utils/barcode';
import { User, School, BookOpen, ShieldCheck } from 'lucide-react';

interface MemberCardProps {
  member: Member;
}

export const MemberCard: React.FC<MemberCardProps> = ({ member }) => {
  const { schoolInfo } = useLibrary();

  const barcodeSvg = useMemo(() => {
    return generateCode39Svg(member.memberCode, 210, 48, true);
  }, [member.memberCode]);

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-center p-2 avoid-break">
      {/* FRONT SIDE */}
      <div className="w-[340px] h-[215px] bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-900 rounded-xl p-3.5 text-white shadow-lg relative overflow-hidden border-2 border-emerald-950 flex flex-col justify-between">
        {/* Subtle Background Pattern */}
        <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none">
          <BookOpen size={160} />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-emerald-600/60 pb-2 relative z-10">
          <div className="w-10 h-10 rounded-lg bg-white p-0.5 flex items-center justify-center flex-shrink-0 shadow-xs border border-white/50">
            <img
              src={schoolInfo.logoUrl}
              alt="Logo SMPN 2 Pemalang"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 leading-tight">
            <h4 className="text-[11px] font-black tracking-wide uppercase text-amber-300">
              {schoolInfo.libraryName}
            </h4>
            <h5 className="text-[10px] font-bold text-white tracking-tight">
              {schoolInfo.name}
            </h5>
            <p className="text-[8px] text-emerald-200">
              NPSN: {schoolInfo.npsn} | Pemalang
            </p>
          </div>
          <div className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[9px] font-extrabold uppercase">
            {member.type}
          </div>
        </div>

        {/* Member Info Content */}
        <div className="flex gap-3 items-center my-auto relative z-10">
          {/* Photo */}
          <div className="w-16 h-20 bg-slate-100 rounded-md border-2 border-white/80 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400 shadow-sm">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={36} className="text-slate-400" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 text-[11px] space-y-0.5 text-emerald-50">
            <div className="font-bold text-xs text-white truncate max-w-[190px]">
              {member.name}
            </div>
            <div className="flex text-[10px]">
              <span className="w-16 text-emerald-200 font-medium">No. ID:</span>
              <span className="font-mono font-semibold text-amber-200">{member.idNumber}</span>
            </div>
            <div className="flex text-[10px]">
              <span className="w-16 text-emerald-200 font-medium">Kelas/Mapel:</span>
              <span className="font-semibold text-white truncate max-w-[130px]">{member.classOrSubject}</span>
            </div>
            <div className="flex text-[10px]">
              <span className="w-16 text-emerald-200 font-medium">Berlaku s/d:</span>
              <span className="text-emerald-100">
                {member.type === 'Siswa' ? 'Tamat Belajar' : 'Aktif Bertugas'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Barcode Area */}
        <div className="bg-white rounded-md p-1 flex justify-center shadow-inner relative z-10">
          <div
            className="flex justify-center"
            dangerouslySetInnerHTML={{ __html: barcodeSvg }}
          />
        </div>
      </div>

      {/* BACK SIDE */}
      <div className="w-[340px] h-[215px] bg-slate-50 rounded-xl p-3.5 text-slate-800 shadow-md border-2 border-slate-300 flex flex-col justify-between">
        <div className="border-b border-slate-200 pb-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
            <ShieldCheck size={14} />
            <span>TATA TERTIB ANGGOTA PERPUSTAKAAN</span>
          </div>
          <span className="text-[9px] font-mono text-slate-500">{member.memberCode}</span>
        </div>

        <ol className="text-[9px] text-slate-600 list-decimal pl-3 space-y-1 my-1 leading-tight">
          <li>Kartu anggota wajib dibawa setiap berkunjung dan meminjam buku.</li>
          <li>Kartu tidak boleh dipinjamkan atau digunakan oleh orang lain.</li>
          <li>Peminjam bertanggung jawab penuh atas keutuhan dan kebersihan buku.</li>
          <li>Keterlambatan pengembalian buku dikenakan denda sesuai ketentuan.</li>
          <li>Jika kartu hilang atau rusak, segera lapor ke petugas perpustakaan.</li>
        </ol>

        <div className="border-t border-slate-200 pt-1.5 flex items-end justify-between text-[9px]">
          <div className="text-slate-500 leading-tight">
            <p className="font-semibold text-slate-700">{schoolInfo.libraryName}</p>
            <p>{schoolInfo.address}</p>
          </div>
          <div className="text-center">
            <p className="text-[8px] text-slate-500">Pemalang, {member.joinDate}</p>
            <p className="text-[8px] font-bold text-slate-800 mt-0.5">Kepala Perpustakaan</p>
            <div className="h-6 flex items-center justify-center font-serif italic text-[9px] text-slate-400">
              (ttd & cap)
            </div>
            <p className="text-[8px] font-semibold text-slate-900 underline">
              {schoolInfo.headOfLibrary}
            </p>
            {schoolInfo.headOfLibraryNip && (
              <p className="text-[7px] font-mono text-slate-500">
                NIP. {schoolInfo.headOfLibraryNip}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
