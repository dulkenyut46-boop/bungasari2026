import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { HarvestBatch } from '../../types';
import { formatRupiah, formatKg, formatDate, downloadCSV, downloadHarvestBatchTemplate } from '../../lib/utils';
import { Badge } from '../common/Badge';
import { HarvestBatchImportModal } from './HarvestBatchImportModal';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Eye,
  Edit2,
  Trash2,
  Scale,
  Factory,
  ArrowUpDown,
  FileSpreadsheet,
  AlertTriangle,
  Coins
} from 'lucide-react';

interface HarvestBatchViewProps {
  onSelectBatch: (batch: HarvestBatch) => void;
  onEditBatch: (batch: HarvestBatch) => void;
  onOpenNewBatchModal: () => void;
}

export const HarvestBatchView: React.FC<HarvestBatchViewProps> = ({
  onSelectBatch,
  onEditBatch,
  onOpenNewBatchModal,
}) => {
  const { harvestBatches, deleteHarvestBatch, globalSearch, currentUser } = useApp();

  // Local filters
  const [searchTerm, setSearchTerm] = useState('');
  const [differenceFilter, setDifferenceFilter] = useState<'all' | 'surplus' | 'susut'>('all');
  const [sortOption, setSortOption] = useState<'date_desc' | 'date_asc' | 'diff_desc' | 'weight_desc'>('date_desc');
  const [page, setPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const pageSize = 8;

  // Combine search
  const effectiveSearch = globalSearch || searchTerm;

  const filteredBatches = useMemo(() => {
    return harvestBatches
      .filter(b => {
        // Search matching
        if (effectiveSearch) {
          const q = effectiveSearch.toLowerCase();
          const matchBatch = b.batchNumber.toLowerCase().includes(q);
          const matchSpb = b.spbNumber.toLowerCase().includes(q);
          const matchTicket = b.ticketNumberPKS.toLowerCase().includes(q);
          const matchDriver = b.driverName.toLowerCase().includes(q);
          const matchPks = b.factoryDestination.toLowerCase().includes(q);
          const matchFarmer = b.items.some(i => i.farmerName.toLowerCase().includes(q));
          if (!matchBatch && !matchSpb && !matchTicket && !matchDriver && !matchPks && !matchFarmer) {
            return false;
          }
        }

        // Difference filter
        if (differenceFilter === 'surplus' && b.weightDifferenceKg <= 0) return false;
        if (differenceFilter === 'susut' && b.weightDifferenceKg >= 0) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'date_desc') {
          return new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime();
        }
        if (sortOption === 'date_asc') {
          return new Date(a.harvestDate).getTime() - new Date(b.harvestDate).getTime();
        }
        if (sortOption === 'diff_desc') {
          return b.weightDifferenceKg - a.weightDifferenceKg;
        }
        if (sortOption === 'weight_desc') {
          return b.totalTphWeightKg - a.totalTphWeightKg;
        }
        return 0;
      });
  }, [harvestBatches, effectiveSearch, differenceFilter, sortOption]);

  const totalPages = Math.ceil(filteredBatches.length / pageSize) || 1;
  const paginatedBatches = filteredBatches.slice((page - 1) * pageSize, page * pageSize);

  // Total summary of current filtered results
  const summaryTotals = useMemo(() => {
    let tph = 0;
    let pks = 0;
    let diff = 0;
    let omset = 0;
    filteredBatches.forEach(b => {
      tph += b.totalTphWeightKg;
      pks += b.factoryFinalNetKg;
      diff += b.weightDifferenceKg;
      omset += b.totalGroupOmsetRp;
    });
    return { tph, pks, diff, omset };
  }, [filteredBatches]);

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = [
      'No Batch',
      'No SPB',
      'Tiket PKS',
      'Tanggal Panen',
      'PKS Tujuan',
      'Truk',
      'Sopir',
      'Janjang',
      'Timbangan TPH (Kg)',
      'Bruto PKS (Kg)',
      'Tarra PKS (Kg)',
      'Netto PKS (Kg)',
      'Sortir (%)',
      'Netto Akhir PKS (Kg)',
      'Selisih Medaran (Kg)',
      'Harga TBS (Rp/Kg)',
      'Omset Medaran (Rp)',
      'Iuran Kas Poktan (Rp)',
      'Total Omset Kelompok (Rp)',
      'Hak Bersih Petani (Rp)',
    ];

    const rows = filteredBatches.map(b => [
      b.batchNumber,
      b.spbNumber,
      b.ticketNumberPKS,
      b.harvestDate,
      b.factoryDestination,
      b.truckPlate,
      b.driverName,
      b.totalBunches || 0,
      b.totalTphWeightKg,
      b.factoryGrossKg,
      b.factoryTareKg,
      b.factoryNetKg,
      b.sortirPercentage,
      b.factoryFinalNetKg,
      b.weightDifferenceKg,
      b.tbsPricePerKg,
      b.medaranOmsetValueRp,
      b.groupFeeTotalRp,
      b.totalGroupOmsetRp,
      b.totalFarmerPayoutRp,
    ]);

    downloadCSV(`REKAPITULASI_PANEN_BUNGA_SARI_${new Date().toISOString().split('T')[0]}`, [
      headers,
      ...rows,
    ]);
  };

  const handleDelete = (id: string, batchNumber: string) => {
    if (window.confirm(`Yakin ingin menghapus rekapan panen ${batchNumber}?`)) {
      deleteHarvestBatch(id);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Catatan Per Manen (Rekapitulasi TPH vs Pabrik)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pencatatan hasil timbangan kebun, tiket timbang PKS, selisih medaran lebih, dan omset kelompok tani
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadHarvestBatchTemplate}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs"
            title="Unduh format template Excel rapi (.xlsx) rekapan panen"
          >
            <Download className="h-4 w-4 text-emerald-600" /> Template Panen (.xlsx)
          </button>

          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 cursor-pointer transition-colors shadow-2xs"
              title="Import Data Rekapan Panen Massal via Excel / CSV"
            >
              <Upload className="h-4 w-4" /> Import Panen (Excel/CSV)
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>

          {currentUser.role === 'admin' && (
            <button
              onClick={onOpenNewBatchModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" /> Catat Panen Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Cari No SPB, Sopir, PKS..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Status Selisih Filter */}
          <div>
            <select
              value={differenceFilter}
              onChange={e => setDifferenceFilter(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="all">Semua Status Selisih</option>
              <option value="surplus">Surplus (Medaran Lebih +)</option>
              <option value="susut">Susut (Kurang -)</option>
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as any)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="date_desc">Tanggal: Terbaru</option>
              <option value="date_asc">Tanggal: Terlama</option>
              <option value="diff_desc">Selisih Medaran Terbesar</option>
              <option value="weight_desc">Tonase TPH Terbesar</option>
            </select>
          </div>

          {/* Quick Summary Pill */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs font-medium text-slate-500">
            <span>Ditemukan: <strong className="text-slate-900 dark:text-white">{filteredBatches.length}</strong> Manen</span>
          </div>
        </div>

        {/* Live Filter Summary bar */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <span>Total TPH: <strong className="text-slate-900 dark:text-white">{formatKg(summaryTotals.tph)}</strong></span>
          <span>•</span>
          <span>Netto PKS: <strong className="text-slate-900 dark:text-white">{formatKg(summaryTotals.pks)}</strong></span>
          <span>•</span>
          <span>Total Medaran Lebih: <strong className="text-emerald-600 font-bold">+{formatKg(summaryTotals.diff)}</strong></span>
          <span>•</span>
          <span>Omset Kelompok: <strong className="text-emerald-700 dark:text-emerald-300 font-extrabold">{formatRupiah(summaryTotals.omset)}</strong></span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/70 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-700/80">
              <tr>
                <th className="py-3 px-3.5">No Batch / SPB</th>
                <th className="py-3 px-3.5">Tanggal</th>
                <th className="py-3 px-3.5">PKS & Kendaraan</th>
                <th className="py-3 px-3 text-right">TPH Kebun</th>
                <th className="py-3 px-3 text-right">Netto PKS</th>
                <th className="py-3 px-3 text-right">Selisih Medaran</th>
                <th className="py-3 px-3 text-right">Harga TBS</th>
                <th className="py-3 px-3 text-right">Omset Kelompok</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Tidak ada data panen yang sesuai dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map(batch => (
                  <tr
                    key={batch.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-3.5">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {batch.batchNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {batch.spbNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="block font-medium text-slate-800 dark:text-slate-200">
                        {formatDate(batch.harvestDate)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tiket: {batch.ticketNumberPKS}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5">
                      <span className="font-semibold text-slate-900 dark:text-white block truncate max-w-[140px]">
                        {batch.factoryDestination}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {batch.truckPlate} ({batch.driverName})
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatKg(batch.totalTphWeightKg)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {batch.totalBunches} Janjang
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-bold text-slate-900 dark:text-white block">
                        {formatKg(batch.factoryFinalNetKg)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sortir {batch.sortirPercentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <Badge variant={batch.weightDifferenceKg >= 0 ? 'success' : 'danger'}>
                        {batch.weightDifferenceKg >= 0
                          ? `+${batch.weightDifferenceKg} Kg`
                          : `${batch.weightDifferenceKg} Kg`}
                      </Badge>
                      <span className="block text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        +{((batch.weightDifferenceKg / batch.totalTphWeightKg) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatRupiah(batch.tbsPricePerKg)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block text-sm">
                        {formatRupiah(batch.totalGroupOmsetRp)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Medaran: {formatRupiah(batch.medaranOmsetValueRp)}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectBatch(batch)}
                          title="Lihat Detail & Slip"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-slate-800 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {currentUser.role === 'admin' && (
                          <>
                            <button
                              onClick={() => onEditBatch(batch)}
                              title="Edit Rekapan"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-slate-800 dark:hover:text-sky-400 transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(batch.id, batch.batchNumber)}
                              title="Hapus Rekapan"
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800 text-xs text-slate-500">
            <div>
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> ({filteredBatches.length} Data)
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-200 px-3 py-1 font-semibold hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Harvest Batch Import Modal */}
      <HarvestBatchImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
