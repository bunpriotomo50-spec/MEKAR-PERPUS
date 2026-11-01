import React, { useState } from 'react';
import { SCHOOL_INFO } from '../../types/library';
import { Lock, User, KeyRound, AlertCircle, X } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Login requirement: User / Password using NPSN (20324292) or admin with NPSN
    const validPassword = SCHOOL_INFO.npsn; // "20324292"
    const validUsernames = ['admin', '20324292', 'pustakawan', 'smpn2pemalang'];

    const inputUser = username.trim().toLowerCase();
    const inputPass = password.trim();

    if (
      (validUsernames.includes(inputUser) || inputUser === validPassword) &&
      inputPass === validPassword
    ) {
      onLoginSuccess();
      setPassword('');
      setErrorMsg(null);
    } else {
      setErrorMsg('Username atau password salah! Silakan periksa kembali kredensial Anda.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-300 hover:text-white p-1 rounded-lg"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 shadow-md shrink-0 flex items-center justify-center">
              <img
                src={SCHOOL_INFO.logoUrl}
                alt="Logo SMP Negeri 2 Pemalang"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                PORTAL ADMINISTRATOR
              </span>
              <h3 className="text-base font-black leading-tight text-white">
                Login Petugas Perpustakaan
              </h3>
              <p className="text-xs text-emerald-200">{SCHOOL_INFO.name}</p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 font-medium flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Username / ID Petugas
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <User className="absolute left-3 top-3 text-slate-400" size={15} />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 text-xs"
              />
              <KeyRound className="absolute left-3 top-3 text-slate-400" size={15} />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Kembali ke Kiosk
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Lock size={14} />
              <span>Masuk Sebagai Admin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
