import React from 'react';
import { useLibrary } from '../context/LibraryContext';

interface OfficialKopSuratProps {
  documentTitle?: string;
  documentSubtitle?: string;
  documentNumber?: string;
}

export const OfficialKopSurat: React.FC<OfficialKopSuratProps> = ({
  documentTitle,
  documentSubtitle,
  documentNumber,
}) => {
  const { schoolInfo } = useLibrary();

  return (
    <div className="w-full text-center pb-4 mb-6 border-b-4 border-double border-slate-800">
      <div className="flex items-center justify-between gap-4">
        {/* School Logo / Official Seal */}
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center p-1">
          <img
            src={schoolInfo.logoUrl}
            alt="Logo SMP Negeri 2 Pemalang"
            className="w-full h-full object-contain filter drop-shadow-sm"
          />
        </div>

        {/* Institution Details */}
        <div className="flex-1 text-center">
          <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-700">
            PEMERINTAH KABUPATEN PEMALANG
          </h3>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-slate-700">
            {schoolInfo.dinasName || 'DINAS PENDIDIKAN PEMUDA, DAN OLAHRAGA'}
          </h3>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 mt-0.5">
            {schoolInfo.name}
          </h1>
          <h2 className="text-base font-bold text-emerald-800 tracking-wide uppercase">
            {schoolInfo.libraryName}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            NPSN: <span className="font-semibold text-slate-800">{schoolInfo.npsn}</span> | {schoolInfo.address} | Kode Pos: {schoolInfo.postalCode}
          </p>
          <p className="text-xs text-slate-600">
            Telp: {schoolInfo.phone} | Pos-el: {schoolInfo.email}
          </p>
        </div>

        {/* Library MEKAR Emblem */}
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-amber-500 text-slate-900 rounded-full font-bold shadow-sm border-2 border-amber-600">
          <div className="text-center leading-tight">
            <span className="text-[10px] uppercase font-bold block text-amber-950">PERPUS</span>
            <span className="text-sm font-black tracking-wider text-amber-950">MEKAR</span>
          </div>
        </div>
      </div>

      {documentTitle && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <h2 className="text-lg font-bold uppercase tracking-wider text-slate-900 underline decoration-slate-900 decoration-1 underline-offset-4">
            {documentTitle}
          </h2>
          {documentNumber && (
            <p className="text-xs text-slate-600 font-mono mt-0.5">
              Nomor: {documentNumber}
            </p>
          )}
          {documentSubtitle && (
            <p className="text-xs font-medium text-slate-700 mt-0.5">
              {documentSubtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
