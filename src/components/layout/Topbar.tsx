import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Search,
  PlusCircle,
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  TrendingUp,
  X
} from 'lucide-react';
import { formatRupiah, formatKg } from '../../lib/utils';

interface TopbarProps {
  onToggleSidebar: () => void;
  onOpenAuth: () => void;
  onOpenNewBatchModal: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  onOpenAuth,
  onOpenNewBatchModal,
}) => {
  const {
    currentUser,
    globalSearch,
    setGlobalSearch,
    theme,
    toggleTheme,
    harvestBatches,
    metrics,
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);

  // Recent 3 batches with surplus
  const recentSurplusBatches = harvestBatches.slice(0, 3);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-900/95 sm:px-6">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile menu button */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={globalSearch}
            onChange={e => setGlobalSearch(e.target.value)}
            placeholder="Cari nomor SPB, nama petani, blok TPH..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-800 transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Panen (Admin only) */}
        {currentUser.role === 'admin' && (
          <button
            onClick={onOpenNewBatchModal}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Catat Panen</span>
          </button>
        )}

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Pemberitahuan Selisih Panen"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Pemberitahuan Medaran Terkini
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Tutup
                </button>
              </div>

              <div className="py-2 space-y-2.5">
                {recentSurplusBatches.map(b => (
                  <div key={b.id} className="rounded-lg bg-emerald-50/50 p-2.5 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                      <span>{b.batchNumber}</span>
                      <span>+{b.weightDifferenceKg} Kg</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                      Medaran lebih menghasilkan omset {formatRupiah(b.medaranOmsetValueRp)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-center text-slate-500">
                Total Omset Kelompok: <span className="font-bold text-emerald-600">{formatRupiah(metrics.totalGroupOmsetRp)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-slate-600" />
          )}
        </button>

        {/* User Role Badge / Switcher Button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-[10px] font-bold text-white">
            {currentUser.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <span className="block max-w-[120px] truncate leading-tight font-bold">
              {currentUser.name}
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
              {currentUser.role === 'admin' ? 'Pengurus' : 'Petani'}
            </span>
          </div>
        </button>
      </div>
    </header>
  );
};
