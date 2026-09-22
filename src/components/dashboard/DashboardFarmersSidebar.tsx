import React, { useState, useMemo } from 'react';
import { Farmer, HarvestBatch } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatKg, formatRupiah } from '../../lib/utils';
import {
  Users,
  Search,
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Phone,
  CreditCard,
  X
} from 'lucide-react';

interface DashboardFarmersSidebarProps {
  farmers: Farmer[];
  harvestBatches: HarvestBatch[];
  onViewSlip?: (farmer: Farmer) => void;
  onOpenNewFarmer?: () => void;
}

export const DashboardFarmersSidebar: React.FC<DashboardFarmersSidebarProps> = ({
  farmers,
  harvestBatches,
  onViewSlip,
  onOpenNewFarmer,
}) => {
  const { setActiveTab, currentUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'weight'>('code');

  // Compute stats for each farmer from harvest batches
  const farmerStats = useMemo(() => {
    const stats: Record<string, { totalKg: number; totalEarningsRp: number; count: number }> = {};
    (harvestBatches || []).forEach(batch => {
      (batch?.items || []).forEach(item => {
        if (!stats[item.farmerId]) {
          stats[item.farmerId] = { totalKg: 0, totalEarningsRp: 0, count: 0 };
        }
        stats[item.farmerId].totalKg += item.tphWeightKg || 0;
        stats[item.farmerId].totalEarningsRp += item.farmerShareRp || 0;
        stats[item.farmerId].count += 1;
      });
    });
    return stats;
  }, [harvestBatches]);

  // Filter and sort farmers
  const filteredFarmers = useMemo(() => {
    const safeFarmers = farmers || [];
    let result = safeFarmers.filter(farmer => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        farmer.name.toLowerCase().includes(q) ||
        farmer.code.toLowerCase().includes(q) ||
        farmer.blockLocation.toLowerCase().includes(q) ||
        (farmer.phone && farmer.phone.includes(q))
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'weight') {
        const kgA = farmerStats[a.id]?.totalKg || 0;
        const kgB = farmerStats[b.id]?.totalKg || 0;
        return kgB - kgA;
      }
      // default: code
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });

    return result;
  }, [farmers, searchQuery, sortBy, farmerStats]);

  // Total Land Area & Total Tonase
  const totalArea = useMemo(() => {
    return (farmers || []).reduce((sum, f) => sum + (f.landAreaHa || 0), 0);
  }, [farmers]);

  return (
    <div
      id="dashboard-farmers-sidebar"
      className="flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-b from-emerald-50/40 to-transparent dark:from-emerald-950/20">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                Daftar Petani
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                  {(farmers || []).length} Anggota
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Kelompok Tani Bunga Sari
              </p>
            </div>
          </div>

          {currentUser.role === 'admin' && onOpenNewFarmer && (
            <button
              onClick={onOpenNewFarmer}
              type="button"
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 transition-colors cursor-pointer shadow-2xs"
              title="Tambah Anggota Petani Baru"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          )}
        </div>

        {/* Quick summary chips */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-100/80 dark:border-slate-800/80">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">Total Luas Lahan</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {totalArea.toFixed(1)} Hektar
            </span>
          </div>
          <div className="rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 p-2">
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-medium">Status Anggota</span>
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              100% Aktif
            </span>
          </div>
        </div>

        {/* Search input */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama petani atau kode..."
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Sort tabs */}
        <div className="flex items-center justify-between gap-1 mt-2.5 text-[11px]">
          <span className="text-slate-400 text-[10px] font-medium">Urutkan:</span>
          <div className="inline-flex rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800 text-[11px]">
            <button
              type="button"
              onClick={() => setSortBy('code')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                sortBy === 'code'
                  ? 'bg-white text-emerald-700 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Kode
            </button>
            <button
              type="button"
              onClick={() => setSortBy('name')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                sortBy === 'name'
                  ? 'bg-white text-emerald-700 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Nama
            </button>
            <button
              type="button"
              onClick={() => setSortBy('weight')}
              className={`px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer ${
                sortBy === 'weight'
                  ? 'bg-white text-emerald-700 shadow-2xs dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              Hasil Kg
            </button>
          </div>
        </div>
      </div>

      {/* Farmers List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800/80 overflow-y-auto max-h-[680px] xl:max-h-[760px] scrollbar-thin">
        {(filteredFarmers || []).length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Tidak ada petani yang sesuai pencarian "{searchQuery}"
          </div>
        ) : (
          (filteredFarmers || []).map((farmer) => {
            const stats = farmerStats[farmer.id];
            const initials = farmer.name
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={farmer.id}
                className="group relative p-3 sm:p-3.5 hover:bg-slate-50/90 dark:hover:bg-slate-800/50 transition-colors flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Avatar Initials */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                    {initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {farmer.name}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {farmer.code}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">{farmer.blockLocation}</span>
                      </span>
                      <span>•</span>
                      <span className="shrink-0">{farmer.landAreaHa} Ha</span>
                    </div>

                    {farmer.phone && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        <Phone className="h-2.5 w-2.5 shrink-0" />
                        <span className="truncate">{farmer.phone}</span>
                        {farmer.bankAccount?.bankName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{farmer.bankAccount.bankName}</span>
                          </>
                        )}
                      </div>
                    )}

                    {/* Stats summary: Total Panen & Hak Petani */}
                    <div className="flex items-center gap-3 mt-1.5 pt-1 border-t border-slate-100/60 dark:border-slate-800/60 text-[11px]">
                      <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {stats ? formatKg(stats.totalKg) : '0 Kg'}
                        </span>
                      </div>
                      {stats && stats.totalEarningsRp > 0 && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                          {formatRupiah(stats.totalEarningsRp)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Action: Slip Panen */}
                {onViewSlip && (
                  <button
                    type="button"
                    onClick={() => onViewSlip(farmer)}
                    className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs mt-0.5"
                    title={`Lihat Slip Panen ${farmer.name}`}
                  >
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Slip</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
        <button
          type="button"
          onClick={() => setActiveTab('petani')}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-emerald-400 transition-colors cursor-pointer shadow-2xs"
        >
          Lihat & Kelola Seluruh Data Petani
          <ArrowRight className="h-3.5 w-3.5 text-emerald-600" />
        </button>
      </div>
    </div>
  );
};
