import React from 'react';
import {
  BookOpen,
  ArrowLeftRight,
  Users,
  UserCheck,
  Search,
  FileText,
  Sparkles,
  Settings,
  AlertTriangle,
  CloudUpload,
} from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';

export type MainTabType =
  | 'koleksi'
  | 'sirkulasi'
  | 'keanggotaan'
  | 'pengunjung'
  | 'katalog'
  | 'laporan'
  | 'literasi'
  | 'administrasi'
  | 'backup';

interface NavigationProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const { loans, books } = useLibrary();

  const overdueCount = loans.filter((l) => l.status === 'Terlambat').length;
  const activeLoansCount = loans.filter((l) => l.status === 'Dipinjam' || l.status === 'Terlambat').length;

  const navItems: { id: MainTabType; label: string; number: string; icon: React.ReactNode; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'koleksi',
      number: '1',
      label: 'Koleksi Buku & Barcode',
      icon: <BookOpen size={16} />,
    },
    {
      id: 'sirkulasi',
      number: '2',
      label: 'Sirkulasi & Pengembalian',
      icon: <ArrowLeftRight size={16} />,
      badge: overdueCount > 0 ? `${overdueCount} Telat` : activeLoansCount > 0 ? `${activeLoansCount}` : undefined,
      badgeColor: overdueCount > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white',
    },
    {
      id: 'keanggotaan',
      number: '3',
      label: 'Keanggotaan & Kartu',
      icon: <Users size={16} />,
    },
    {
      id: 'pengunjung',
      number: '4',
      label: 'Buku Tamu Pengunjung',
      icon: <UserCheck size={16} />,
    },
    {
      id: 'katalog',
      number: '5',
      label: 'Katalog OPAC & Rak',
      icon: <Search size={16} />,
    },
    {
      id: 'laporan',
      number: '6',
      label: 'Inventaris & Pelaporan',
      icon: <FileText size={16} />,
    },
    {
      id: 'literasi',
      number: '7',
      label: 'Program Literasi (GLS)',
      icon: <Sparkles size={16} />,
    },
    {
      id: 'administrasi',
      number: '8',
      label: 'Administrasi & Manajemen',
      icon: <Settings size={16} />,
    },
    {
      id: 'backup',
      number: '9',
      label: 'Backup Data & Drive',
      icon: <CloudUpload size={16} />,
      badge: 'Cloud',
      badgeColor: 'bg-blue-600 text-white',
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-xs sticky top-0 z-40 no-print">
      <div className="max-w-7xl mx-auto px-2 sm:px-4">
        <div className="flex items-center space-x-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-950'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black font-mono ${
                    isActive ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {item.number}
                </span>
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                      item.badgeColor || 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
