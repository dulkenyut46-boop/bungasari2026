import React from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  Truck,
  Users,
  Calculator,
  Wallet,
  FileSpreadsheet,
  Sprout,
  ShieldCheck,
  UserCheck,
  RotateCcw,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const { activeTab, setActiveTab, currentUser, theme, toggleTheme, resetToDemoData } = useApp();

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'dashboard', label: 'Ringkasan Dashboard', icon: LayoutDashboard },
    { id: 'panen', label: 'Catatan Per Manen', icon: Truck, badge: 'TPH vs PKS' },
    { id: 'petani', label: 'Rekapan Petani', icon: Users, badge: '20 Anggota' },
    { id: 'kalkulator', label: 'Kalkulator Selisih', icon: Calculator },
    { id: 'kas_kelompok', label: 'Kas & Omset Kelompok', icon: Wallet },
    { id: 'laporan', label: 'Laporan & Slip Panen', icon: FileSpreadsheet },
  ];

  const handleNavClick = (id: ActiveTab) => {
    setActiveTab(id);
    onClose(); // close drawer on mobile
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200/90 bg-white shadow-xs transition-transform duration-200 ease-in-out dark:border-slate-800/90 dark:bg-slate-900 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-md shadow-emerald-500/20">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  BUNGA SARI
                </span>
                <span className="rounded-sm bg-emerald-100 px-1 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  POKTAN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Rekap Hasil & Selisih Panen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current User Active Profile Card */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div
            onClick={onOpenAuth}
            className="group flex cursor-pointer items-center justify-between rounded-xl bg-slate-50 p-3 hover:bg-emerald-50/70 border border-slate-200/60 dark:bg-slate-800/60 dark:border-slate-700/60 dark:hover:bg-emerald-950/40 transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white text-xs shadow-xs">
                {currentUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {currentUser.role === 'admin' ? (
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <UserCheck className="h-3 w-3 text-sky-600" />
                  )}
                  <span>{currentUser.role === 'admin' ? 'Pengurus Kelompok' : 'Petani Anggota'}</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold group-hover:underline">
              Ganti
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menu Utama
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 text-left cursor-pointer',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500')} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                      isActive
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Actions */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800 space-y-2">
          {/* Dark mode & Reset demo */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" /> Mode Terang
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-slate-500" /> Mode Gelap
                </>
              )}
            </button>

            <button
              onClick={resetToDemoData}
              title="Reset ke Data Awal Poktan"
              className="flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
            Kelompok Tani Bunga Sari &copy; 2026
          </div>
        </div>
      </aside>
    </>
  );
};
